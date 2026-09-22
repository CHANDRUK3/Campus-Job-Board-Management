// routes/drives.js — Recruitment drive API
const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const Drive = require('../models/Drive');
const User = require('../models/user');
const Notification = require('../models/Notification');
const SearchService = require('../services/searchService');
const { authenticate, authorize } = require('../middleware/auth');

const mapDriveToJob = (drive) => ({
  ...drive.toObject(),
  company: drive.companyId?.name || 'Unknown Company',
  jobTitle: drive.role,
  salary: { min: drive.package, max: drive.package },
  formattedSalary: `${drive.package} LPA`,
  daysUntilDeadline: Math.ceil(
    (new Date(drive.importantDates.registrationDeadline) - new Date()) / (1000 * 60 * 60 * 24)
  ),
  applicationDeadline: drive.importantDates.registrationDeadline
});

// GET: Advanced search for drives
router.get('/search', async (req, res) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...filters
    } = req.query;

    const result = await SearchService.searchJobs({
      query,
      filters,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    const suggestions = await SearchService.getSearchSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      message: 'Failed to get suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/filters', async (req, res) => {
  try {
    const options = await SearchService.getFilterOptions();
    res.json(options);
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      message: 'Failed to get filter options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: All active drives
router.get('/', async (req, res) => {
  try {
    const drives = await Drive.find().populate('companyId').sort({ createdAt: -1 });
    res.json(drives.map(mapDriveToJob));
  } catch (error) {
    console.error('Error fetching drives:', error);
    res.status(500).json({ message: 'Error fetching drives', error: error.message });
  }
});

// POST: Add a new drive (admin/recruiter only)
router.post('/add', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      company,
      jobTitle,
      description,
      skills,
      salary,
      location,
      jobType,
      experienceLevel,
      members,
      applicationDeadline,
      requirements,
      contactEmail,
      website
    } = req.body;

    if (!company?.trim()) return res.status(400).json({ message: 'Company name is required' });
    if (!jobTitle?.trim()) return res.status(400).json({ message: 'Role title is required' });
    if (!description?.trim()) return res.status(400).json({ message: 'Job description is required' });

    const skillsArray = Array.isArray(skills)
      ? skills.filter(s => s && s.trim())
      : (skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const locationsArray = Array.isArray(location)
      ? location
      : (location ? [location.trim()] : ['Bangalore']);

    let companyProfile = await Company.findOne({ name: company.trim() });
    if (!companyProfile) {
      companyProfile = new Company({
        name: company.trim(),
        description: `Company profile for ${company.trim()}`,
        website: website || '',
        contactEmail: contactEmail || '',
        logo: ''
      });
      await companyProfile.save();
    }

    const pkg = salary?.max ? parseFloat(salary.max) : (salary?.min ? parseFloat(salary.min) : 6);
    const workModeMapped = ['onsite', 'hybrid', 'remote'].includes(experienceLevel) ? experienceLevel : 'onsite';

    const eligibilityRules = req.body.eligibilityRules || {
      minCgpa: req.body.minCgpa || 6.0,
      allowedDepartments: req.body.allowedDepartments || [],
      maxBacklogs: req.body.maxBacklogs || 0,
      gradYears: req.body.gradYears || [new Date().getFullYear(), new Date().getFullYear() + 1],
      allowPlaced: req.body.allowPlaced !== undefined ? req.body.allowPlaced : true
    };

    const selectionProcess = req.body.selectionProcess || ['Online Test', 'Technical Interview', 'HR Interview'];

    const driveData = {
      companyId: companyProfile._id,
      role: jobTitle.trim(),
      package: pkg,
      description: description.trim(),
      skills: skillsArray,
      location: locationsArray,
      workMode: workModeMapped,
      jobType: jobType || 'full-time',
      members: parseInt(members) || 1,
      eligibilityRules,
      importantDates: {
        registrationDeadline: applicationDeadline
          ? new Date(applicationDeadline)
          : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        testDate: req.body.testDate ? new Date(req.body.testDate) : null,
        interviewDate: req.body.interviewDate ? new Date(req.body.interviewDate) : null
      },
      selectionProcess,
      documents: Array.isArray(requirements) ? requirements : [],
      status: 'active',
      createdBy: req.user.email
    };

    const savedDrive = await new Drive(driveData).save();

    const students = await User.find({ role: 'student' });
    await Promise.all(students.map(student =>
      new Notification({
        recipient: student.email,
        type: 'new_job',
        message: `New recruitment drive: ${companyProfile.name} is hiring for ${jobTitle}!`,
        link: '/jobs'
      }).save()
    ));

    res.status(201).json({
      message: 'Drive posted successfully',
      job: mapDriveToJob(await savedDrive.populate('companyId')),
      jobId: savedDrive._id
    });
  } catch (error) {
    console.error('ERROR adding drive:', error);
    res.status(500).json({ message: 'Internal server error while adding drive', error: error.message });
  }
});

router.get('/:adminEmail', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { adminEmail } = req.params;
    if (req.user.email !== adminEmail) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const drives = await Drive.find({ createdBy: adminEmail }).populate('companyId').sort({ createdAt: -1 });
    res.json(drives.map(mapDriveToJob));
  } catch (error) {
    console.error('Error fetching admin drives:', error);
    res.status(500).json({ message: 'Failed to fetch drives', error: error.message });
  }
});

router.put('/:jobId/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const validStatuses = ['active', 'closed', 'draft'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: active, closed, draft' });
    }

    const drive = await Drive.findById(jobId);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    if (drive.createdBy !== req.user.email) {
      return res.status(403).json({ message: 'Access denied. You can only update your own drives.' });
    }

    drive.status = status;
    await drive.save();
    res.json({ message: 'Drive status updated successfully', job: drive });
  } catch (error) {
    console.error('Error updating drive status:', error);
    res.status(500).json({ message: 'Failed to update drive status', error: error.message });
  }
});

router.delete('/:jobId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.jobId);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    if (drive.createdBy !== req.user.email) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own drives.' });
    }

    await Drive.findByIdAndDelete(req.params.jobId);
    res.json({ message: 'Drive deleted successfully' });
  } catch (error) {
    console.error('Error deleting drive:', error);
    res.status(500).json({ message: 'Failed to delete drive', error: error.message });
  }
});

module.exports = router;

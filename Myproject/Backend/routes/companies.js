// routes/companies.js
const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const User = require('../models/user');
const Notification = require('../models/Notification');
const SearchService = require('../services/searchService');
const { authenticate, authorize } = require('../middleware/auth');
const { validateJobPosting } = require('../middleware/validation');

// GET: Advanced search for jobs
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

// GET: Search suggestions
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

// GET: Filter options
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

// GET: All jobs (for students) - Legacy endpoint
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(20); // Limit for performance
    res.json(companies);
  } catch (error) {
    console.error('Error fetching all companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Add a new job (admin only)
router.post('/add', authenticate, authorize('admin'), validateJobPosting, async (req, res) => {
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
      benefits,
      contactEmail,
      website,
      tags
    } = req.body;

    // Parse skills if it's a string
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    
    // Parse salary if it's a string (legacy support)
    let salaryObj = salary;
    if (typeof salary === 'string') {
      const [min, max] = salary.split('-').map(s => parseFloat(s.trim()));
      salaryObj = { min, max, currency: 'INR' };
    }

    const newJob = new Company({
      company,
      jobTitle,
      description,
      skills: skillsArray,
      salary: salaryObj,
      location,
      jobType: jobType || 'full-time',
      experienceLevel: experienceLevel || 'fresher',
      members: parseInt(members),
      applicationDeadline: new Date(applicationDeadline),
      requirements: requirements || [],
      benefits: benefits || [],
      contactEmail,
      website,
      tags: tags || [],
      createdBy: req.user.email
    });

    await newJob.save();

    // Find all students and create a notification for each
    const students = await User.find({ role: 'student' });
    const notificationPromises = students.map(student => {
      const newNotification = new Notification({
        recipient: student.email,
        type: 'new_job',
        message: `A new job at ${company} - ${jobTitle} has been posted!`,
        link: '/jobs'
      });
      return newNotification.save();
    });
    await Promise.all(notificationPromises);

    res.status(201).json({ 
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Error adding job:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A job with this information already exists',
        error: 'Duplicate entry'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to post job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get jobs by admin email
router.get('/:adminEmail', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { adminEmail } = req.params;
    
    // Verify that the admin is requesting their own jobs
    if (req.user.email !== adminEmail) {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own jobs.' 
      });
    }
    
    const jobs = await Company.find({ createdBy: adminEmail })
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    res.status(500).json({ 
      message: 'Failed to fetch jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT: Update job status
router.put('/:jobId/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'closed', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: active, closed, draft' 
      });
    }
    
    const job = await Company.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify that the admin owns this job
    if (job.createdBy !== req.user.email) {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own jobs.' 
      });
    }
    
    job.status = status;
    await job.save();
    
    res.json({ 
      message: 'Job status updated successfully',
      job 
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ 
      message: 'Failed to update job status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE: Delete job
router.delete('/:jobId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Company.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Verify that the admin owns this job
    if (job.createdBy !== req.user.email) {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own jobs.' 
      });
    }
    
    await Company.findByIdAndDelete(jobId);
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ 
      message: 'Failed to delete job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

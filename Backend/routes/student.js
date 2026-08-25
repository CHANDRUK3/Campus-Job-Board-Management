const express = require('express');
const router = express.Router();
const ApplicationService = require('../services/applicationService');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ===========================
// APPLICATION ROUTES
// ===========================

// Create new application
router.post('/applications', authenticate, authorize('student'), async (req, res) => {
  try {
    const application = await ApplicationService.createApplication(
      req.user._id,
      req.body.jobId,
      req.body.applicationData
    );

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get student's applications
router.get('/applications', authenticate, authorize('student'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filters = {};
    
    if (status) filters.status = status;

    const applications = await ApplicationService.getStudentApplications(
      req.user._id,
      filters
    );

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedApplications = applications.slice(startIndex, endIndex);

    res.json({
      applications: paginatedApplications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(applications.length / limit),
        totalApplications: applications.length,
        hasNextPage: endIndex < applications.length,
        hasPrevPage: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific application
router.get('/applications/:applicationId', authenticate, async (req, res) => {
  try {
    const application = await ApplicationService.getApplicationById(req.params.applicationId);
    
    // Check if user has access to this application
    if (application.student._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (error) {
    console.error('Application fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update application status (admin only)
router.put('/applications/:applicationId/status', authenticate, authorize('admin'), [
  body('status').isIn([
    'applied', 'verified', 'test_scheduled', 'test_completed', 'shortlisted',
    'technical_interview', 'hr_interview', 'final_shortlist', 'selected', 'closed'
  ]),
  body('note').optional().isString().isLength({ max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const application = await ApplicationService.updateApplicationStatus(
      req.params.applicationId,
      status,
      req.user._id,
      note
    );

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      message: 'Failed to update application status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Student offer accept/decline
router.put('/applications/:applicationId/offer', authenticate, authorize('student'), [
  body('action').isIn(['accept', 'decline']),
  body('note').optional().isString().isLength({ max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const application = await ApplicationService.respondToOffer(
      req.params.applicationId,
      req.user._id,
      req.body.action,
      req.body.note
    );
    res.json({ message: `Offer ${req.body.action}ed successfully`, application });
  } catch (error) {
    console.error('Offer response error:', error);
    res.status(500).json({
      message: error.message || 'Failed to respond to offer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check drive eligibility for current student
router.get('/eligibility/:driveId', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await ApplicationService.checkDriveEligibility(req.user._id, req.params.driveId);
    res.json(result);
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({
      message: 'Failed to check eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===========================
// INTERVIEW ROUTES
// ===========================

// Schedule interview (admin only)
router.post('/interviews', authenticate, authorize('admin'), [
  body('applicationId').isMongoId(),
  body('scheduledDate').isISO8601(),
  body('scheduledTime').isString().notEmpty(),
  body('location').isString().notEmpty(),
  body('interviewType').optional().isIn(['online', 'offline', 'phone', 'video']),
  body('duration').optional().isInt({ min: 15, max: 480 }),
  body('instructions').optional().isString().isLength({ max: 1000 })
], handleValidationErrors, async (req, res) => {
  try {
    const result = await ApplicationService.scheduleInterview(
      req.body.applicationId,
      req.body,
      req.user._id
    );

    res.status(201).json({
      message: 'Interview scheduled successfully',
      application: result.application,
      interview: result.interview
    });
  } catch (error) {
    console.error('Interview scheduling error:', error);
    res.status(500).json({
      message: 'Failed to schedule interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get upcoming interviews
router.get('/interviews/upcoming', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const studentId = req.user.role === 'student' ? req.user._id : req.query.studentId;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const interviews = await ApplicationService.getUpcomingInterviews(studentId, parseInt(days));
    res.json(interviews);
  } catch (error) {
    console.error('Upcoming interviews error:', error);
    res.status(500).json({
      message: 'Failed to fetch upcoming interviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add interview feedback (admin only)
router.post('/interviews/:interviewId/feedback', authenticate, authorize('admin'), [
  body('overallRating').isInt({ min: 1, max: 5 }),
  body('technicalSkills').optional().isInt({ min: 1, max: 5 }),
  body('communicationSkills').optional().isInt({ min: 1, max: 5 }),
  body('problemSolving').optional().isInt({ min: 1, max: 5 }),
  body('culturalFit').optional().isInt({ min: 1, max: 5 }),
  body('recommendation').isIn(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
  body('comments').optional().isString().isLength({ max: 1000 })
], handleValidationErrors, async (req, res) => {
  try {
    const interview = await ApplicationService.addInterviewFeedback(
      req.params.interviewId,
      req.body,
      req.user._id
    );

    res.json({
      message: 'Interview feedback submitted successfully',
      interview
    });
  } catch (error) {
    console.error('Interview feedback error:', error);
    res.status(500).json({
      message: 'Failed to submit interview feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===========================
// FEEDBACK ROUTES
// ===========================

// Submit student feedback
router.post('/feedback', authenticate, authorize('student'), [
  body('jobId').isMongoId(), // this represents driveId from the front end
  body('feedbackType').isIn(['application_process', 'interview_experience', 'company_experience', 'placement_process', 'general']),
  body('ratings.overallExperience').isInt({ min: 1, max: 5 }),
  body('feedback.overallComments').optional().isString().isLength({ max: 1000 }),
  body('feedback.wouldRecommend').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const feedback = await ApplicationService.submitStudentFeedback(
      req.user._id,
      req.body.jobId, // driveId
      req.body
    );

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get student's feedback
router.get('/feedback', authenticate, authorize('student'), async (req, res) => {
  try {
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.find({ student: req.user._id })
      .populate({
        path: 'drive',
        populate: { path: 'companyId' }
      })
      .sort({ createdAt: -1 });

    // Map to compat structure for frontend
    const mappedFeedback = feedback.map(fb => {
      const fbObj = fb.toObject();
      fbObj.job = {
        company: fb.drive?.companyId?.name || 'Company',
        jobTitle: fb.drive?.role || 'Software Engineer'
      };
      return fbObj;
    });

    res.json(mappedFeedback);
  } catch (error) {
    console.error('Feedback fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===========================
// DASHBOARD ROUTES
// ===========================

// Get student dashboard
router.get('/dashboard', authenticate, authorize('student'), async (req, res) => {
  try {
    const dashboard = await ApplicationService.getStudentDashboard(req.user._id);
    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get application statistics
router.get('/stats', authenticate, authorize('student'), async (req, res) => {
  try {
    const stats = await ApplicationService.getStudentApplicationStats(req.user._id);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch application statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get application timeline
router.get('/timeline', authenticate, authorize('student'), async (req, res) => {
  try {
    const timeline = await ApplicationService.getApplicationTimeline(req.user._id);
    res.json(timeline);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({
      message: 'Failed to fetch application timeline',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===========================
// ADMIN ROUTES
// ===========================

// Get all applications (admin only)
router.get('/admin/applications', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, jobId, studentId, page = 1, limit = 20 } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (jobId) filters.drive = jobId;
    if (studentId) filters.student = studentId;

    const Application = require('../models/Application');
    const applications = await Application.find(filters)
      .populate('student', 'name email')
      .populate({ path: 'drive', populate: { path: 'companyId' } })
      .sort({ applicationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(filters);

    res.json({
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplications: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Admin applications error:', error);
    res.status(500).json({
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all interviews (admin only) — derived from Application schedule details
router.get('/admin/interviews', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filters = {
      status: { $in: ['test_scheduled', 'technical_interview', 'hr_interview'] },
      'testInterviewDetails.date': { $exists: true }
    };
    if (status) filters.status = status;

    const Application = require('../models/Application');
    const applications = await Application.find(filters)
      .populate('student', 'name email')
      .populate({ path: 'drive', populate: { path: 'companyId' } })
      .sort({ 'testInterviewDetails.date': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Application.countDocuments(filters);

    res.json({
      interviews: applications.map(app => ({
        _id: app._id,
        student: app.student,
        status: app.status,
        scheduledDate: app.testInterviewDetails?.date,
        scheduledTime: app.testInterviewDetails?.time,
        location: app.testInterviewDetails?.venue,
        meetingLink: app.testInterviewDetails?.meetingLink,
        job: {
          company: app.drive?.companyId?.name,
          jobTitle: app.drive?.role
        }
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInterviews: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Admin interviews error:', error);
    res.status(500).json({
      message: 'Failed to fetch interviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

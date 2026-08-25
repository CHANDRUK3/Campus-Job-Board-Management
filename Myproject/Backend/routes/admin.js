const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const BulkOperationsService = require('../services/bulkOperationsService');
const { authenticate, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/imports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ===========================
// ANALYTICS ROUTES
// ===========================

// Get dashboard analytics
router.get('/analytics/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const analytics = await AnalyticsService.getDashboardAnalytics(req.user.email);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate placement report
router.post('/analytics/report', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Start date and end date are required' 
      });
    }

    const report = await AnalyticsService.generatePlacementReport(startDate, endDate);
    res.json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===========================
// BULK OPERATIONS ROUTES
// ===========================

// Bulk import jobs from file
router.post('/bulk/import-jobs', authenticate, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No file uploaded' 
      });
    }

    const result = await BulkOperationsService.importJobsFromFile(req.file.path, req.user.email);
    
    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      message: 'Bulk import failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export jobs to Excel
router.get('/bulk/export-jobs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const result = await BulkOperationsService.exportJobsToExcel(req.user.email, filters);
    
    res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Download failed' });
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      message: 'Export failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export students to Excel
router.get('/bulk/export-students', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.query;
    const filters = {};
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    const result = await BulkOperationsService.exportStudentsToExcel(filters);
    
    res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Download failed' });
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      message: 'Export failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send bulk email to students
router.post('/bulk/send-email', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { subject, message, filters = {} } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ 
        message: 'Subject and message are required' 
      });
    }

    const result = await BulkOperationsService.sendBulkEmailToStudents(subject, message, filters);
    res.json(result);
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ 
      message: 'Bulk email failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk update job status
router.put('/bulk/update-job-status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { jobIds, status } = req.body;
    
    if (!jobIds || !Array.isArray(jobIds) || !status) {
      return res.status(400).json({ 
        message: 'Job IDs array and status are required' 
      });
    }

    const validStatuses = ['active', 'closed', 'draft'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: active, closed, draft' 
      });
    }

    const result = await BulkOperationsService.bulkUpdateJobStatus(jobIds, status, req.user.email);
    res.json(result);
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ 
      message: 'Bulk update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk delete jobs
router.delete('/bulk/delete-jobs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { jobIds } = req.body;
    
    if (!jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ 
        message: 'Job IDs array is required' 
      });
    }

    const result = await BulkOperationsService.bulkDeleteJobs(jobIds, req.user.email);
    res.json(result);
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      message: 'Bulk delete failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get job import template
router.get('/bulk/template', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await BulkOperationsService.getJobImportTemplate();
    
    res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error('Template download error:', err);
        res.status(500).json({ message: 'Template download failed' });
      }
    });
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ 
      message: 'Template generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===========================
// SYSTEM MANAGEMENT ROUTES
// ===========================

// Get system statistics
router.get('/system/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/user');
    const Company = require('../models/company');
    const OptStatus = require('../models/OptStatus');
    const Notification = require('../models/Notification');

    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalNotifications,
      activeUsers,
      activeJobs
    ] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      OptStatus.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments({ isActive: true }),
      Company.countDocuments({ status: 'active' })
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        inactive: totalJobs - activeJobs
      },
      applications: {
        total: totalApplications
      },
      notifications: {
        total: totalNotifications
      }
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

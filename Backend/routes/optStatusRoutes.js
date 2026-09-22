const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const OptStatus = require('../models/OptStatus');
const User = require('../models/user'); // Import User model
const Notification = require('../models/Notification'); // Import Notification model
const Company = require('../models/company'); // Import Company model
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');

// POST: Student opts in or out
router.post('/set', authenticate, async (req, res) => {
  const { studentEmail, jobId, status } = req.body;

  // Validation
  if (!studentEmail || !jobId || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate jobId format
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ message: 'Invalid jobId format' });
  }

  try {
    const existing = await OptStatus.findOne({ studentEmail, jobId });
    let message = '';
    
    if (existing) {
      existing.status = status;
      existing.timestamp = new Date();
      await existing.save();
      message = `Status updated to ${status}.`;
    } else {
      const newStatus = new OptStatus({ studentEmail, jobId, status });
      await newStatus.save();
      message = `Status created as ${status}.`;
    }

    console.log('✅ ' + message);

    // Find all admins and create a notification for each
    const admins = await User.find({ role: 'admin' });
    const notificationPromises = admins.map(admin => {
      const newNotification = new Notification({
        recipient: admin.email,
        type: 'opt_in_out',
        message: `Student ${studentEmail} has ${status} for a job.`,
        link: '/jobs'
      });
      return newNotification.save();
    });
    await Promise.all(notificationPromises);

    res.status(201).json({ message: 'Status created', data: existing || newStatus });
  } catch (err) {
    console.error('❌ Error in saving status:', err);
    res.status(500).json({ message: 'Error saving status', error: err.message });
  }
});

// GET: Admin gets all opt-in/out for a job
router.get('/job/:jobId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const statuses = await OptStatus.find({ jobId: req.params.jobId });
    res.json(statuses);
  } catch (err) {
    console.error('❌ Error fetching statuses:', err);
    res.status(500).json({ message: 'Error fetching statuses', error: err.message });
  }
});
// GET: Student gets all their opt-in/out statuses
router.get('/student/:studentEmail', authenticate, async (req, res) => {
  try {
    const statuses = await OptStatus.find({ studentEmail: req.params.studentEmail });
    res.json(statuses);
  } catch (err) {
    console.error('❌ Error fetching student statuses:', err);
    res.status(500).json({ message: 'Error fetching student statuses', error: err.message });
  }
});

// GET: Export all opt-in/opt-out data to Excel (Admin only)
router.get('/export/excel', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get all opt-in/opt-out data with populated job and student information
    const optStatuses = await OptStatus.find()
      .populate('jobId', 'role package companyId location skills importantDates status')
      .sort({ timestamp: -1 });

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Opt-in/Opt-out Data');

    // Define columns
    worksheet.columns = [
      { header: 'Student Email', key: 'studentEmail', width: 30 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Job Title', key: 'jobTitle', width: 30 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Salary (LPA)', key: 'salary', width: 15 },
      { header: 'Job Type', key: 'jobType', width: 15 },
      { header: 'Experience Level', key: 'experienceLevel', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Opt-in/Opt-out Date', key: 'timestamp', width: 20 },
      { header: 'Application Deadline', key: 'applicationDeadline', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };

    // Add data rows
    for (const optStatus of optStatuses) {
      // Get student name
      const student = await User.findOne({ email: optStatus.studentEmail });
      const studentName = student ? student.name : 'Unknown';

      // Format salary
      const salary = optStatus.jobId?.salary ? 
        `${optStatus.jobId.salary.min}-${optStatus.jobId.salary.max}` : 'N/A';

      // Format dates
      const optDate = new Date(optStatus.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const deadline = optStatus.jobId?.applicationDeadline ? 
        new Date(optStatus.jobId.applicationDeadline).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'N/A';

      worksheet.addRow({
        studentEmail: optStatus.studentEmail,
        studentName: studentName,
        company: optStatus.jobId?.company || 'N/A',
        jobTitle: optStatus.jobId?.jobTitle || 'N/A',
        location: optStatus.jobId?.location || 'N/A',
        salary: salary,
        jobType: optStatus.jobId?.jobType || 'N/A',
        experienceLevel: optStatus.jobId?.experienceLevel || 'N/A',
        status: optStatus.status,
        timestamp: optDate,
        applicationDeadline: deadline
      });
    }

    // Style status column
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        const statusCell = row.getCell('status');
        if (statusCell.value === 'opt-in') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' } // Light green
          };
        } else if (statusCell.value === 'opt-out') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8D7DA' } // Light red
          };
        }
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 15);
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `opt_in_out_data_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, '../uploads', filename);

    // Ensure uploads directory exists
    const uploadsDir = path.dirname(filepath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write file
    await workbook.xlsx.writeFile(filepath);

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Download failed' });
      } else {
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 5000);
      }
    });

  } catch (err) {
    console.error('❌ Error exporting opt-in/opt-out data:', err);
    res.status(500).json({ 
      message: 'Export failed', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

module.exports = router;

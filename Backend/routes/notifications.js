// routes/companies.js
const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const User = require('../models/user'); // Import the User model
const Notification = require('../models/Notification'); // Import the Notification model

// GET: All jobs (for students)
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find(); // get all jobs
    res.json(companies);
  } catch (error) {
    console.error('Error fetching all companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Add a new job (admin only)
router.post('/add', async (req, res) => {
  console.log('Incoming job payload:', req.body);
  const { company, skills, lpa, members, createdBy } = req.body;
  try {
    const newCompany = new Company({ company, skills, lpa, members, createdBy });
    await newCompany.save();

    // Find all students and create a notification for each
    const students = await User.find({ role: 'student' });
    const notificationPromises = students.map(student => {
      const newNotification = new Notification({
        recipient: student.email,
        type: 'new_job',
        message: `A new job at ${company} has been posted!`,
        link: '/jobs'
      });
      return newNotification.save();
    });
    await Promise.all(notificationPromises);

    res.status(201).json({ message: 'Job added successfully' });
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

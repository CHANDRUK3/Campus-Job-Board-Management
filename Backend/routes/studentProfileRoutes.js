const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const { authenticate, authorize } = require('../middleware/auth');

// Make uploads directory if not exists
const uploadsDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ GET profile by user ID
router.get('/:userId', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const isOwner = req.user._id.toString() === req.params.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    // Use .populate('user') to get the user details
    const profile = await StudentProfile.findOne({ user: req.params.userId }).populate('user', 'name email');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ PUT (create or update profile with resume upload)
router.put('/:userId', authenticate, authorize('student'), async (req, res) => {
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  const { 
    academicHistory, 
    portfolioUrl,
    rollNo,
    department,
    branch,
    cgpa,
    backlogs,
    gradYear,
    phone,
    skills,
    locationPref
  } = req.body;
  
  const resumeFile = req.files ? req.files.resume : null;
  let resumePath = null;

  try {
    // Handle resume upload
    if (resumeFile) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(resumeFile.mimetype)) {
        return res.status(400).json({ 
          message: 'Only PDF files are allowed for resume upload.' 
        });
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (resumeFile.size > maxSize) {
        return res.status(400).json({ 
          message: 'Resume file size must be less than 5MB.' 
        });
      }

      // Generate unique filename
      const fileExtension = path.extname(resumeFile.name);
      const fileName = `${req.params.userId}_${Date.now()}_resume${fileExtension}`;
      resumePath = path.join('/uploads/resumes', fileName);
      const filePath = path.join(uploadsDir, fileName);

      // Save file
      await resumeFile.mv(filePath);
      console.log(`✅ Resume uploaded: ${filePath}`);
    }

    // Process skills and location preferences if sent as string/comma-separated
    let skillsArray = [];
    if (skills) {
      skillsArray = Array.isArray(skills) 
        ? skills.filter(s => s && s.trim())
        : skills.split(',').map(s => s.trim()).filter(s => s);
    }

    let locationPrefArray = [];
    if (locationPref) {
      locationPrefArray = Array.isArray(locationPref)
        ? locationPref.filter(l => l && l.trim())
        : locationPref.split(',').map(l => l.trim()).filter(l => l);
    }

    let profile = await StudentProfile.findOne({ user: req.params.userId });

    if (profile) {
      // Update existing profile
      if (academicHistory !== undefined) profile.academicHistory = academicHistory;
      if (portfolioUrl !== undefined) profile.portfolioUrl = portfolioUrl;
      if (rollNo !== undefined) profile.rollNo = rollNo;
      if (department !== undefined) profile.department = department;
      if (branch !== undefined) profile.branch = branch;
      if (cgpa !== undefined) profile.cgpa = parseFloat(cgpa);
      if (backlogs !== undefined) profile.backlogs = parseInt(backlogs);
      if (gradYear !== undefined) profile.gradYear = parseInt(gradYear);
      if (phone !== undefined) profile.phone = phone;
      if (skills !== undefined) profile.skills = skillsArray;
      if (locationPref !== undefined) profile.locationPref = locationPrefArray;
      if (resumePath !== null) profile.resumePath = resumePath;
      
      // Reset profileStatus to pending for re-verification if it was rejected
      if (profile.profileStatus === 'rejected') {
        profile.profileStatus = 'pending';
        profile.rejectionReason = '';
      }

      await profile.save();
      return res.json({ 
        message: 'Profile updated successfully!', 
        profile: {
          ...profile.toObject(),
          resumeUrl: resumePath ? `http://localhost:5000${resumePath}` : (profile.resumePath ? `http://localhost:5000${profile.resumePath}` : null)
        }
      });
    } else {
      // Create new profile
      const newProfile = new StudentProfile({
        user: req.params.userId,
        academicHistory,
        portfolioUrl,
        rollNo,
        department,
        branch,
        cgpa: cgpa ? parseFloat(cgpa) : 0,
        backlogs: backlogs ? parseInt(backlogs) : 0,
        gradYear: gradYear ? parseInt(gradYear) : new Date().getFullYear(),
        phone,
        skills: skillsArray,
        locationPref: locationPrefArray,
        resumePath,
        profileStatus: 'pending' // default
      });
      await newProfile.save();
      return res.status(201).json({ 
        message: 'Profile created successfully!', 
        profile: {
          ...newProfile.toObject(),
          resumeUrl: resumePath ? `http://localhost:5000${resumePath}` : null
        }
      });
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    // Handle rollNo unique validation error
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A student profile with this Roll Number already exists.'
      });
    }
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

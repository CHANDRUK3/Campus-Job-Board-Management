const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose'); // Import mongoose
const StudentProfile = require('../models/StudentProfile');

// Make uploads directory if not exists
const uploadsDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ GET profile by user ID
router.get('/:userId', async (req, res) => {
  try {
    // Validate userId format as ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
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
router.put('/:userId', async (req, res) => {
  const { academicHistory, portfolioUrl } = req.body;
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

    let profile = await StudentProfile.findOne({ user: req.params.userId });

    if (profile) {
      // Update existing profile
      if (academicHistory !== undefined) profile.academicHistory = academicHistory;
      if (portfolioUrl !== undefined) profile.portfolioUrl = portfolioUrl;
      if (resumePath !== null) profile.resumePath = resumePath;

      await profile.save();
      return res.json({ 
        message: 'Profile updated successfully!', 
        profile: {
          ...profile.toObject(),
          resumeUrl: resumePath ? `http://localhost:5000${resumePath}` : null
        }
      });
    } else {
      // Create new profile
      const newProfile = new StudentProfile({
        user: req.params.userId,
        academicHistory,
        resumePath,
        portfolioUrl
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
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

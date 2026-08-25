const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNo: {
    type: String,
    unique: true,
    sparse: true // Allows nulls for non-students or initially
  },
  department: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  backlogs: {
    type: Number,
    default: 0
  },
  gradYear: {
    type: Number
  },
  phone: {
    type: String,
    trim: true
  },
  skills: {
    type: [String],
    default: []
  },
  locationPref: {
    type: [String],
    default: []
  },
  profileStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  academicHistory: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    default: ''
  },
  portfolioUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);

const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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

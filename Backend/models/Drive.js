const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  role: { 
    type: String, 
    required: true, 
    trim: true 
  },
  package: { 
    type: Number, 
    required: true // CTC in LPA
  },
  description: { 
    type: String, 
    required: true, 
    trim: true 
  },
  skills: { 
    type: [String], 
    required: true 
  },
  location: { 
    type: [String], 
    required: true 
  },
  workMode: { 
    type: String, 
    enum: ['onsite', 'hybrid', 'remote'], 
    default: 'onsite' 
  },
  jobType: { 
    type: String, 
    enum: ['full-time', 'internship', 'ppo'], 
    default: 'full-time' 
  },
  members: {
    type: Number,
    default: 1
  },
  eligibilityRules: {
    minCgpa: { type: Number, default: 0 },
    allowedDepartments: { type: [String], default: [] },
    maxBacklogs: { type: Number, default: 0 },
    gradYears: { type: [Number], default: [] },
    allowPlaced: { type: Boolean, default: true } // If false, already placed students are excluded
  },
  importantDates: {
    registrationDeadline: { type: Date, required: true },
    testDate: { type: Date },
    interviewDate: { type: Date }
  },
  selectionProcess: { 
    type: [String], 
    default: ['Online Test', 'Technical Interview', 'HR Interview'] 
  },
  documents: { 
    type: [String], 
    default: [] 
  },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'draft'], 
    default: 'active' 
  },
  createdBy: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

// Virtual for days until registration deadline
driveSchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const deadline = new Date(this.importantDates.registrationDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if drive is still active and accepting applications
driveSchema.methods.isAcceptingApplications = function() {
  return this.status === 'active' && new Date() < this.importantDates.registrationDeadline;
};

module.exports = mongoose.model('Drive', driveSchema);

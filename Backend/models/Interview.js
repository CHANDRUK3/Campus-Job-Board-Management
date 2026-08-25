const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Interview details
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  location: {
    type: String,
    required: true
  },
  interviewType: {
    type: String,
    enum: ['online', 'offline', 'phone', 'video'],
    default: 'offline'
  },
  meetingLink: String, // For online interviews
  meetingId: String, // For video conferencing
  meetingPassword: String,
  // Interviewer details
  interviewers: [{
    name: String,
    email: String,
    designation: String,
    department: String
  }],
  // Interview content
  agenda: [String],
  topics: [String],
  requirements: [String],
  instructions: String,
  // Status and feedback
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled'
  },
  // Interview feedback
  feedback: {
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    technicalSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    communicationSkills: {
      type: Number,
      min: 1,
      max: 5
    },
    problemSolving: {
      type: Number,
      min: 1,
      max: 5
    },
    culturalFit: {
      type: Number,
      min: 1,
      max: 5
    },
    strengths: [String],
    weaknesses: [String],
    comments: String,
    recommendation: {
      type: String,
      enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire', 'pending']
    },
    nextSteps: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  },
  // Rescheduling details
  rescheduleHistory: [{
    originalDate: Date,
    newDate: Date,
    reason: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    recipient: String,
    message: String
  }],
  // Interview materials
  materials: {
    questionBank: [String],
    assessmentCriteria: [String],
    evaluationForm: String,
    additionalNotes: String
  }
}, {
  timestamps: true
});

// Indexes
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ student: 1 });
interviewSchema.index({ job: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ 'interviewers.email': 1 });

// Virtual for interview duration in hours
interviewSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual for time until interview
interviewSchema.virtual('timeUntilInterview').get(function() {
  const now = new Date();
  const interviewDateTime = new Date(`${this.scheduledDate.toDateString()} ${this.scheduledTime}`);
  const diffMs = interviewDateTime - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} days, ${diffHours} hours`;
  } else if (diffHours > 0) {
    return `${diffHours} hours, ${diffMinutes} minutes`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minutes`;
  } else {
    return 'Interview time has passed';
  }
});

// Method to check if interview is upcoming
interviewSchema.methods.isUpcoming = function() {
  const now = new Date();
  const interviewDateTime = new Date(`${this.scheduledDate.toDateString()} ${this.scheduledTime}`);
  return interviewDateTime > now && this.status === 'scheduled';
};

// Method to check if interview is today
interviewSchema.methods.isToday = function() {
  const today = new Date();
  const interviewDate = new Date(this.scheduledDate);
  return interviewDate.toDateString() === today.toDateString();
};

// Method to reschedule interview
interviewSchema.methods.reschedule = function(newDate, newTime, reason, requestedBy) {
  this.rescheduleHistory.push({
    originalDate: this.scheduledDate,
    newDate: newDate,
    reason: reason,
    requestedBy: requestedBy,
    status: 'pending'
  });
  
  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  this.status = 'rescheduled';
  
  return this.save();
};

// Method to add feedback
interviewSchema.methods.addFeedback = function(feedback, submittedBy) {
  this.feedback = {
    ...feedback,
    submittedBy: submittedBy,
    submittedAt: new Date()
  };
  this.status = 'completed';
  
  return this.save();
};

// Method to send reminder
interviewSchema.methods.addReminder = function(type, recipient, message) {
  this.reminders.push({
    type: type,
    sentAt: new Date(),
    recipient: recipient,
    message: message
  });
  
  return this.save();
};

// Static method to get upcoming interviews
interviewSchema.statics.getUpcomingInterviews = function(days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'scheduled'
  }).populate('student job application');
};

// Static method to get interviews by date range
interviewSchema.statics.getInterviewsByDateRange = function(startDate, endDate) {
  return this.find({
    scheduledDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).populate('student job application');
};

module.exports = mongoose.model('Interview', interviewSchema);

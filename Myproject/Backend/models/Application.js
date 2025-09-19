const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview_scheduled', 'interview_completed', 'selected', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  // Interview details
  interview: {
    scheduledDate: Date,
    scheduledTime: String,
    location: String,
    interviewer: String,
    interviewType: {
      type: String,
      enum: ['online', 'offline', 'phone', 'video'],
      default: 'offline'
    },
    meetingLink: String, // For online interviews
    instructions: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      strengths: [String],
      areasForImprovement: [String],
      recommendation: {
        type: String,
        enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire']
      }
    }
  },
  // Application documents
  documents: {
    resume: String,
    coverLetter: String,
    portfolio: String,
    additionalDocuments: [String]
  },
  // Application notes
  notes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  // Communication history
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'call', 'meeting', 'system']
    },
    subject: String,
    message: String,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  // Selection details
  selection: {
    selectedDate: Date,
    offerDetails: {
      salary: Number,
      joiningDate: Date,
      position: String,
      location: String,
      benefits: [String]
    },
    acceptanceStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    acceptanceDate: Date
  },
  // Feedback from student
  studentFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    experience: String,
    suggestions: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
applicationSchema.index({ student: 1, job: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationDate: -1 });
applicationSchema.index({ 'interview.scheduledDate': 1 });

// Virtual for application timeline
applicationSchema.virtual('timeline').get(function() {
  const timeline = [];
  
  timeline.push({
    event: 'Application Submitted',
    date: this.applicationDate,
    status: 'completed'
  });

  if (this.status === 'shortlisted') {
    timeline.push({
      event: 'Application Shortlisted',
      date: this.updatedAt,
      status: 'completed'
    });
  }

  if (this.interview && this.interview.scheduledDate) {
    timeline.push({
      event: 'Interview Scheduled',
      date: this.interview.scheduledDate,
      status: this.interview.status === 'completed' ? 'completed' : 'pending'
    });
  }

  if (this.status === 'selected') {
    timeline.push({
      event: 'Selected',
      date: this.selection?.selectedDate || this.updatedAt,
      status: 'completed'
    });
  }

  if (this.status === 'rejected') {
    timeline.push({
      event: 'Application Rejected',
      date: this.updatedAt,
      status: 'completed'
    });
  }

  return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
});

// Method to update application status
applicationSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedAt = new Date();
  
  // Add note about status change
  this.notes.push({
    addedBy: updatedBy,
    note: `Status changed to ${newStatus}`,
    addedAt: new Date()
  });
  
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewDetails, scheduledBy) {
  this.interview = {
    ...interviewDetails,
    status: 'scheduled'
  };
  this.status = 'interview_scheduled';
  
  // Add note about interview scheduling
  this.notes.push({
    addedBy: scheduledBy,
    note: `Interview scheduled for ${interviewDetails.scheduledDate}`,
    addedAt: new Date()
  });
  
  return this.save();
};

// Method to add communication
applicationSchema.methods.addCommunication = function(communication) {
  this.communications.push(communication);
  return this.save();
};

// Method to add note
applicationSchema.methods.addNote = function(note, addedBy, isPrivate = false) {
  this.notes.push({
    addedBy,
    note,
    isPrivate,
    addedAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);

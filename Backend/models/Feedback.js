const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  drive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drive',
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  // Feedback type
  feedbackType: {
    type: String,
    enum: ['application_process', 'interview_experience', 'company_experience', 'placement_process', 'general'],
    required: true
  },
  // Overall ratings
  ratings: {
    overallExperience: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    processEfficiency: {
      type: Number,
      min: 1,
      max: 5
    },
    jobDescription: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  // Detailed feedback
  feedback: {
    positiveAspects: [String],
    areasForImprovement: [String],
    suggestions: String,
    overallComments: String,
    wouldRecommend: {
      type: Boolean,
      default: true
    },
    additionalComments: String
  },
  // Interview specific feedback
  interviewFeedback: {
    interviewerBehavior: {
      type: Number,
      min: 1,
      max: 5
    },
    questionQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    interviewEnvironment: {
      type: Number,
      min: 1,
      max: 5
    },
    technicalAssessment: {
      type: Number,
      min: 1,
      max: 5
    },
    interviewComments: String
  },
  // Company specific feedback
  companyFeedback: {
    companyCulture: {
      type: Number,
      min: 1,
      max: 5
    },
    workEnvironment: {
      type: Number,
      min: 1,
      max: 5
    },
    growthOpportunities: {
      type: Number,
      min: 1,
      max: 5
    },
    compensation: {
      type: Number,
      min: 1,
      max: 5
    },
    companyComments: String
  },
  // Process specific feedback
  processFeedback: {
    applicationProcess: {
      type: Number,
      min: 1,
      max: 5
    },
    responseTime: {
      type: Number,
      min: 1,
      max: 5
    },
    clarityOfInstructions: {
      type: Number,
      min: 1,
      max: 5
    },
    supportProvided: {
      type: Number,
      min: 1,
      max: 5
    },
    processComments: String
  },
  // Anonymous feedback option
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'archived'],
    default: 'draft'
  },
  // Admin review
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    adminComments: String,
    actionTaken: String,
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  // Tags for categorization
  tags: [String],
  // Follow-up actions
  followUpActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    completedAt: Date,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes
feedbackSchema.index({ student: 1 });
feedbackSchema.index({ drive: 1 });
feedbackSchema.index({ feedbackType: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ 'ratings.overallExperience': 1 });

// Virtual for average rating
feedbackSchema.virtual('averageRating').get(function() {
  const ratings = Object.values(this.ratings).filter(rating => typeof rating === 'number');
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for feedback summary
feedbackSchema.virtual('summary').get(function() {
  const summary = {
    overallRating: this.ratings.overallExperience,
    averageRating: this.averageRating,
    wouldRecommend: this.feedback.wouldRecommend,
    feedbackType: this.feedbackType,
    isAnonymous: this.isAnonymous,
    submittedAt: this.createdAt
  };
  
  if (this.feedback.overallComments) {
    summary.comment = this.feedback.overallComments.substring(0, 200) + '...';
  }
  
  return summary;
});

// Method to submit feedback
feedbackSchema.methods.submit = function() {
  this.status = 'submitted';
  return this.save();
};

// Method to add admin review
feedbackSchema.methods.addAdminReview = function(reviewedBy, adminComments, actionTaken, isPublic = false) {
  this.adminReview = {
    reviewedBy: reviewedBy,
    reviewedAt: new Date(),
    adminComments: adminComments,
    actionTaken: actionTaken,
    isPublic: isPublic
  };
  this.status = 'reviewed';
  
  return this.save();
};

// Method to add follow-up action
feedbackSchema.methods.addFollowUpAction = function(action, assignedTo, dueDate, notes = '') {
  this.followUpActions.push({
    action: action,
    assignedTo: assignedTo,
    dueDate: dueDate,
    notes: notes,
    status: 'pending'
  });
  
  return this.save();
};

// Method to complete follow-up action
feedbackSchema.methods.completeFollowUpAction = function(actionId, notes = '') {
  const action = this.followUpActions.id(actionId);
  if (action) {
    action.status = 'completed';
    action.completedAt = new Date();
    if (notes) action.notes = notes;
  }
  
  return this.save();
};

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStats = function(filters = {}) {
  const pipeline = [
    { $match: { status: 'submitted', ...filters } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$ratings.overallExperience' },
        recommendationRate: {
          $avg: { $cond: ['$feedback.wouldRecommend', 1, 0] }
        },
        feedbackByType: {
          $push: {
            type: '$feedbackType',
            rating: '$ratings.overallExperience'
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get company feedback summary
feedbackSchema.statics.getCompanyFeedbackSummary = function(driveId) {
  return this.aggregate([
    { $match: { drive: driveId, status: 'submitted' } },
    {
      $group: {
        _id: '$drive',
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$ratings.overallExperience' },
        averageCommunication: { $avg: '$ratings.communication' },
        averageProfessionalism: { $avg: '$ratings.professionalism' },
        averageProcessEfficiency: { $avg: '$ratings.processEfficiency' },
        recommendationRate: {
          $avg: { $cond: ['$feedback.wouldRecommend', 1, 0] }
        },
        positiveAspects: { $push: '$feedback.positiveAspects' },
        improvementAreas: { $push: '$feedback.areasForImprovement' }
      }
    }
  ]);
};

// Static method to get recent feedback
feedbackSchema.statics.getRecentFeedback = function(limit = 10) {
  return this.find({ status: 'submitted' })
    .populate('student', 'name email')
    .populate({
      path: 'drive',
      populate: { path: 'companyId' }
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Feedback', feedbackSchema);

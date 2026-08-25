const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: [
      'applied', 
      'verified', 
      'test_scheduled', 
      'test_completed', 
      'shortlisted', 
      'technical_interview', 
      'hr_interview', 
      'final_shortlist', 
      'selected', 
      'closed'
    ],
    default: 'applied'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  timeline: [{
    stage: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  }],
  testInterviewDetails: {
    date: { type: Date },
    time: { type: String },
    venue: { type: String },
    meetingLink: { type: String },
    instructions: { type: String },
    documents: { type: [String], default: [] }
  },
  outcome: {
    result: { 
      type: String, 
      enum: ['selected', 'not_selected', 'pending'], 
      default: 'pending' 
    },
    offerDetails: {
      ctc: Number,
      joiningDate: Date,
      offerLetterUrl: String
    },
    feedback: String
  },
  documents: {
    resume: String,
    coverLetter: String,
    portfolio: String,
    additionalDocuments: [String]
  }
}, {
  timestamps: true
});

// Indexes for better performance
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationDate: -1 });

// Helper method to add timeline updates
applicationSchema.methods.addTimelineStage = function(stage, notes = '') {
  this.timeline.push({ stage, timestamp: new Date(), notes });
  this.status = stage;
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);

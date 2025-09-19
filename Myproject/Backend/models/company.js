const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  company: { 
    type: String, 
    required: true, 
    trim: true,
    index: 'text' // For text search
  },
  jobTitle: { 
    type: String, 
    required: true, 
    trim: true,
    index: 'text'

  },
  description: { 
    type: String, 
    required: true, 
    trim: true,
    index: 'text'
  },
  skills: { 
    type: [String], 
    required: true,
    index: 'text'
  },
  salary: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' }
  },
  location: { 
    type: String, 
    required: true, 
    trim: true,
    index: 'text'
  },
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'internship', 'contract'], 
    default: 'full-time' 
  },
  experienceLevel: { 
    type: String, 
    enum: ['fresher', '1-2 years', '3-5 years', '5+ years'], 
    default: 'fresher' 
  },
  members: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  applicationDeadline: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'draft'], 
    default: 'active' 
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  tags: [String], // For additional categorization
  requirements: [String], // Detailed requirements
  benefits: [String], // Job benefits
  contactEmail: String,
  website: String
}, { 
  timestamps: true,
  // Create text index for search
  indexes: [
    { 
      company: 'text', 
      jobTitle: 'text', 
      description: 'text', 
      skills: 'text', 
      location: 'text' 
    }
  ]
});

// Virtual for formatted salary
companySchema.virtual('formattedSalary').get(function() {
  return `${this.salary.min} - ${this.salary.max} ${this.salary.currency} LPA`;
});

// Virtual for days until deadline
companySchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if job is still accepting applications
companySchema.methods.isAcceptingApplications = function() {
  return this.status === 'active' && new Date() < this.applicationDeadline;
};

module.exports = mongoose.model('Company', companySchema);

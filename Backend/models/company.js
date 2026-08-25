const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  description: { 
    type: String, 
    trim: true 
  },
  logo: { 
    type: String, 
    default: '' 
  },
  website: { 
    type: String, 
    trim: true 
  },
  industry: { 
    type: String, 
    trim: true 
  },
  contactEmail: { 
    type: String, 
    trim: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Company', companySchema);

const mongoose = require('mongoose');

const OptStatusSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  status: { type: String, enum: ['opt-in', 'opt-out'], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OptStatus', OptStatusSchema);

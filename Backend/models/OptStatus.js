const mongoose = require('mongoose');

const OptStatusSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true },
  status: { type: String, enum: ['opt-in', 'opt-out'], required: true },
  timestamp: { type: Date, default: Date.now }
});

OptStatusSchema.index({ studentEmail: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('OptStatus', OptStatusSchema);

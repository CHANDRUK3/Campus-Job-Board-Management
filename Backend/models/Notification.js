const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // email
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['drive_published', 'deadline_reminder', 'application_update', 'shortlisted', 
           'assessment_scheduled', 'interview_scheduled', 'result', 'offer', 
           'profile_verification', 'system', 'new_job', 'opt_in_out'],
    default: 'system'
  },
  title: { type: String, default: '' },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  relatedDriveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive' },
  relatedApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, relatedDriveId: 1 }, { sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);

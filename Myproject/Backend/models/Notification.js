// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // 'admin' or a specific student's email
  type: { type: String, required: true }, // e.g., 'new_job', 'opt_in'
  message: { type: String, required: true },
  link: { type: String }, // Optional link to a related page
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

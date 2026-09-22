const Drive = require('../models/Drive');
const StudentProfile = require('../models/StudentProfile');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { checkEligibility } = require('../utils/eligibilityEngine');

async function send12HourReminders() {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Find drives with registration deadlines within the next 12 hours
    const drives = await Drive.find({
      status: 'active',
      'importantDates.registrationDeadline': { $gte: now, $lte: windowEnd }
    }).populate('companyId');

    if (!drives.length) return;

    // Fetch verified student profiles only (reduces checks)
    const studentProfiles = await StudentProfile.find({ profileStatus: 'verified' }).populate('user', 'email name');

    for (const drive of drives) {
      const driveLink = `/drives/${drive._id}`;

      for (const profile of studentProfiles) {
        try {
          // Avoid reminding students who already applied
          const alreadyApplied = await Application.findOne({ student: profile.user._id, drive: drive._id });
          if (alreadyApplied) continue;

          // Avoid duplicate reminders for same student+drive
          const existing = await Notification.findOne({
            recipient: profile.user.email,
            type: 'deadline_reminder',
            link: driveLink
          });
          if (existing) continue;

          // Run eligibility logic (backend authoritative)
          const eligibility = await checkEligibility(profile, drive);
          if (!eligibility.eligible) continue; // only remind eligible students

          // Compose message
          const hoursLeft = Math.ceil((new Date(drive.importantDates.registrationDeadline) - now) / (1000 * 60 * 60));
          const message = `Only ${hoursLeft} hours left to respond to ${drive.companyId?.name || 'a drive'} for ${drive.role}. You are eligible — please opt in or opt out before the deadline.`;

          // Create notification
          await new Notification({
            recipient: profile.user.email,
            type: 'deadline_reminder',
            message,
            link: driveLink,
            isRead: false
          }).save();
        } catch (innerErr) {
          console.error('Error processing reminder for profile', profile?.user?.email, innerErr.message || innerErr);
        }
      }
    }
  } catch (err) {
    console.error('Deadline reminder job failed:', err.message || err);
  }
}

function startDeadlineReminderJob(intervalMinutes = 10) {
  // Run immediately, then at interval
  send12HourReminders();
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
  setInterval(send12HourReminders, intervalMs);
  console.log(`✅ Deadline reminder job started (every ${intervalMinutes} minutes)`);
}

module.exports = { startDeadlineReminderJob };

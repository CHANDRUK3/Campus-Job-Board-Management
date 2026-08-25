const Application = require('../models/Application');
const Feedback = require('../models/Feedback');
const Drive = require('../models/Drive');
const User = require('../models/user');
const StudentProfile = require('../models/StudentProfile');
const Notification = require('../models/Notification');
const { checkEligibility } = require('../utils/eligibilityEngine');
const emailService = require('./emailService');

class ApplicationService {
  // Create a new application
  static async createApplication(studentId, driveId, applicationData = {}) {
    try {
      // Find student profile to verify eligibility
      const studentProfile = await StudentProfile.findOne({ user: studentId });
      if (!studentProfile) {
        throw new Error('Student profile must be created before applying to drives');
      }

      // Find drive details
      const drive = await Drive.findById(driveId).populate('companyId');
      if (!drive) {
        throw new Error('Drive not found');
      }

      // Run eligibility matching engine
      const eligibility = await checkEligibility(studentProfile, drive);
      if (!eligibility.eligible) {
        throw new Error(`Student does not meet eligibility requirements: ${eligibility.reasons.join(', ')}`);
      }

      // Check if application already exists
      const existingApplication = await Application.findOne({
        student: studentId,
        drive: driveId
      });

      if (existingApplication) {
        throw new Error('You have already applied for this recruitment drive');
      }

      // Create new application
      const application = new Application({
        student: studentId,
        drive: driveId,
        status: 'applied',
        timeline: [{ stage: 'applied', timestamp: new Date(), notes: 'Application submitted successfully' }],
        documents: applicationData.documents || {},
        testInterviewDetails: {},
        outcome: { result: 'pending' }
      });

      await application.save();

      // Populate application data
      await application.populate([
        { path: 'student', select: 'name email' },
        { path: 'drive', populate: { path: 'companyId' } }
      ]);

      return application;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get student's applications
  static async getStudentApplications(studentId, filters = {}) {
    try {
      const query = { student: studentId, ...filters };
      
      const applications = await Application.find(query)
        .populate({
          path: 'drive',
          populate: { path: 'companyId' }
        })
        .sort({ createdAt: -1 });

      // Format for frontend compatibility
      return applications.map(app => {
        const appObj = app.toObject();
        if (appObj.drive) {
          appObj.job = {
            ...appObj.drive,
            company: appObj.drive.companyId?.name || 'Unknown Company',
            jobTitle: appObj.drive.role,
            location: appObj.drive.location ? appObj.drive.location.join(', ') : '',
            salary: { min: appObj.drive.package, max: appObj.drive.package },
            formattedSalary: `${appObj.drive.package} LPA`,
            applicationDeadline: appObj.drive.importantDates?.registrationDeadline
          };
        }
        return appObj;
      });
    } catch (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }
  }

  // Get application by ID
  static async getApplicationById(applicationId) {
    try {
      const application = await Application.findById(applicationId)
        .populate('student', 'name email')
        .populate({
          path: 'drive',
          populate: { path: 'companyId' }
        });

      if (!application) {
        throw new Error('Application not found');
      }

      const appObj = application.toObject();
      if (appObj.drive) {
        appObj.job = {
          ...appObj.drive,
          company: appObj.drive.companyId?.name || 'Unknown Company',
          jobTitle: appObj.drive.role,
          location: appObj.drive.location ? appObj.drive.location.join(', ') : '',
          salary: { min: appObj.drive.package, max: appObj.drive.package },
          formattedSalary: `${appObj.drive.package} LPA`,
          applicationDeadline: appObj.drive.importantDates?.registrationDeadline
        };
      }

      return appObj;
    } catch (error) {
      throw new Error(`Failed to fetch application: ${error.message}`);
    }
  }

  // Update application status
  static async updateApplicationStatus(applicationId, newStatus, updatedBy, note = '') {
    try {
      const application = await Application.findById(applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Add to timeline and save
      application.status = newStatus;
      application.timeline.push({
        stage: newStatus,
        timestamp: new Date(),
        notes: note || `Application status updated to ${newStatus}`
      });

      // Update outcome object if selected or rejected (closed)
      if (newStatus === 'selected') {
        application.outcome = {
          result: 'selected',
          offerDetails: {
            ctc: application.outcome?.offerDetails?.ctc || 6.0,
            joiningDate: application.outcome?.offerDetails?.joiningDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            offerLetterUrl: application.outcome?.offerDetails?.offerLetterUrl || ''
          },
          feedback: note || 'Selected'
        };
      } else if (newStatus === 'closed') {
        application.outcome = {
          result: 'not_selected',
          feedback: note || 'Application closed'
        };
      }

      await application.save();

      // In-app notification
      const student = await User.findById(application.student);
      const drive = await Drive.findById(application.drive).populate('companyId');
      if (student && drive) {
        await new Notification({
          recipient: student.email,
          type: 'status_update',
          message: `Your application for ${drive.role} at ${drive.companyId?.name} is now: ${newStatus.replace(/_/g, ' ')}`,
          link: '/jobs'
        }).save();
      }

      // Send notification email to student
      await this.sendStatusUpdateNotification(application, newStatus);

      return application;
    } catch (error) {
      throw new Error(`Failed to update application status: ${error.message}`);
    }
  }

  // Schedule interview/test details
  static async scheduleInterview(applicationId, details, scheduledBy) {
    try {
      const application = await Application.findById(applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Populate schedule details
      application.testInterviewDetails = {
        date: details.scheduledDate,
        time: details.scheduledTime,
        venue: details.location,
        meetingLink: details.meetingLink || '',
        instructions: details.instructions || '',
        documents: details.documents || []
      };

      // Set stage to test_scheduled or technical_interview
      const stage = details.interviewType === 'test' ? 'test_scheduled' : 'technical_interview';
      application.status = stage;
      
      application.timeline.push({
        stage: stage,
        timestamp: new Date(),
        notes: `Scheduled: ${details.instructions || 'Rounds details updated.'}`
      });

      await application.save();

      // In-app notification for student
      const student = await User.findById(application.student);
      const drive = await Drive.findById(application.drive).populate('companyId');
      if (student && drive) {
        await new Notification({
          recipient: student.email,
          type: 'interview_scheduled',
          message: `Round scheduled for ${drive.role} at ${drive.companyId?.name}: ${new Date(details.scheduledDate).toLocaleDateString()} at ${details.scheduledTime}`,
          link: '/jobs'
        }).save();
      }

      // Send invitation notification
      await this.sendInterviewInvitation(application, details);

      return { application };
    } catch (error) {
      throw new Error(`Failed to schedule process: ${error.message}`);
    }
  }

  // Get upcoming processes/interviews for student
  static async getUpcomingInterviews(studentId, days = 7) {
    try {
      // Find applications where student is participating and stage is test_scheduled/technical_interview/hr_interview
      const applications = await Application.find({
        student: studentId,
        status: { $in: ['test_scheduled', 'technical_interview', 'hr_interview'] },
        'testInterviewDetails.date': { $gte: new Date() }
      }).populate({
        path: 'drive',
        populate: { path: 'companyId' }
      });

      return applications.map(app => {
        const appObj = app.toObject();
        return {
          _id: appObj._id,
          status: appObj.status,
          scheduledDate: appObj.testInterviewDetails.date,
          scheduledTime: appObj.testInterviewDetails.time,
          location: appObj.testInterviewDetails.venue,
          meetingLink: appObj.testInterviewDetails.meetingLink,
          instructions: appObj.testInterviewDetails.instructions,
          duration: 45,
          job: {
            company: appObj.drive?.companyId?.name || 'Company',
            jobTitle: appObj.drive?.role || 'Software Engineer',
            location: appObj.drive?.location ? appObj.drive.location.join(', ') : ''
          }
        };
      });
    } catch (error) {
      throw new Error(`Failed to fetch upcoming processes: ${error.message}`);
    }
  }

  // Get application statistics for student
  static async getStudentApplicationStats(studentId) {
    try {
      const stats = await Application.aggregate([
        { $match: { student: studentId } },
        {
          $group: {
            _id: null,
            totalApplications: { $sum: 1 },
            applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            testScheduled: { $sum: { $cond: [{ $eq: ['$status', 'test_scheduled'] }, 1, 0] } },
            testCompleted: { $sum: { $cond: [{ $eq: ['$status', 'test_completed'] }, 1, 0] } },
            shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
            technicalInterview: { $sum: { $cond: [{ $eq: ['$status', 'technical_interview'] }, 1, 0] } },
            hrInterview: { $sum: { $cond: [{ $eq: ['$status', 'hr_interview'] }, 1, 0] } },
            finalShortlist: { $sum: { $cond: [{ $eq: ['$status', 'final_shortlist'] }, 1, 0] } },
            selected: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
          }
        }
      ]);

      return stats[0] || {
        totalApplications: 0,
        applied: 0,
        verified: 0,
        testScheduled: 0,
        testCompleted: 0,
        shortlisted: 0,
        technicalInterview: 0,
        hrInterview: 0,
        finalShortlist: 0,
        selected: 0,
        closed: 0
      };
    } catch (error) {
      throw new Error(`Failed to get application statistics: ${error.message}`);
    }
  }

  // Get application timeline
  static async getApplicationTimeline(studentId) {
    try {
      const applications = await Application.find({ student: studentId })
        .populate({
          path: 'drive',
          populate: { path: 'companyId' }
        })
        .sort({ updatedAt: -1 })
        .limit(10);

      return applications.map(app => ({
        id: app._id,
        job: {
          company: app.drive?.companyId?.name || 'Company',
          jobTitle: app.drive?.role || 'Software Engineer'
        },
        status: app.status,
        applicationDate: app.applicationDate,
        timeline: app.timeline,
        lastUpdated: app.updatedAt
      }));
    } catch (error) {
      throw new Error(`Failed to get application timeline: ${error.message}`);
    }
  }

  // Send status update notification
  static async sendStatusUpdateNotification(application, newStatus) {
    try {
      const student = await User.findById(application.student);
      const drive = await Drive.findById(application.drive).populate('companyId');

      if (student && drive) {
        const subject = `Placement Portal: Application status changed to ${newStatus}`;
        const message = `Dear ${student.name},\n\nYour application status for the role of ${drive.role} at ${drive.companyId.name} has been updated to: "${newStatus.replace('_', ' ').toUpperCase()}".\n\nPlease log in to the student placement portal to view updates and detailed instructions.\n\nBest regards,\nPlacement Cell`;
        
        await emailService.sendEmail(student.email, subject, message);
      }
    } catch (error) {
      console.error('Failed to send status update notification:', error);
    }
  }

  // Send process invitation
  static async sendInterviewInvitation(application, details) {
    try {
      const student = await User.findById(application.student);
      const drive = await Drive.findById(application.drive).populate('companyId');

      if (student && drive) {
        const subject = `Placement Round Scheduled: ${drive.role} at ${drive.companyId.name}`;
        const message = `Dear ${student.name},\n\nA placement process round has been scheduled for you:\n\nRole: ${drive.role}\nCompany: ${drive.companyId.name}\nDate: ${new Date(details.scheduledDate).toLocaleDateString()}\nTime: ${details.scheduledTime}\nVenue/Meeting: ${details.location}\nInstructions: ${details.instructions}\n\nPlease prepare accordingly and carry necessary documents.\n\nBest regards,\nPlacement Cell`;
        
        await emailService.sendEmail(student.email, subject, message);
      }
    } catch (error) {
      console.error('Failed to send process invitation email:', error);
    }
  }

  // Add interview feedback (stores on application outcome)
  static async addInterviewFeedback(applicationId, feedbackData, reviewedBy) {
    try {
      const application = await Application.findById(applicationId);
      if (!application) throw new Error('Application not found');

      application.outcome = application.outcome || { result: 'pending' };
      application.outcome.feedback = feedbackData.comments || feedbackData.feedback || '';
      application.timeline.push({
        stage: application.status,
        timestamp: new Date(),
        notes: `Interview feedback submitted (rating: ${feedbackData.overallRating}/5)`
      });

      await application.save();
      return application;
    } catch (error) {
      throw new Error(`Failed to submit interview feedback: ${error.message}`);
    }
  }

  // Submit student feedback on drive/process
  static async submitStudentFeedback(studentId, driveId, feedbackPayload) {
    try {
      const existing = await Feedback.findOne({
        student: studentId,
        drive: driveId,
        feedbackType: feedbackPayload.feedbackType
      });
      if (existing) {
        throw new Error('You have already submitted feedback for this drive');
      }

      const application = await Application.findOne({ student: studentId, drive: driveId });

      const feedback = new Feedback({
        student: studentId,
        drive: driveId,
        application: application?._id,
        feedbackType: feedbackPayload.feedbackType,
        ratings: feedbackPayload.ratings || {},
        feedback: feedbackPayload.feedback || {},
        status: 'submitted'
      });

      await feedback.save();
      return feedback;
    } catch (error) {
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }

  // Check eligibility for a drive (used by frontend)
  static async checkDriveEligibility(studentId, driveId) {
    const studentProfile = await StudentProfile.findOne({ user: studentId });
    const drive = await Drive.findById(driveId).populate('companyId');
    if (!drive) throw new Error('Drive not found');
    return checkEligibility(studentProfile, drive);
  }

  // Student offer response (accept/decline)
  static async respondToOffer(applicationId, studentId, action, note = '') {
    const application = await Application.findById(applicationId);
    if (!application) throw new Error('Application not found');
    if (application.student.toString() !== studentId.toString()) {
      throw new Error('Access denied');
    }
    if (application.status !== 'selected') {
      throw new Error('No pending offer to respond to');
    }

    if (action === 'accept') {
      application.timeline.push({
        stage: 'selected',
        timestamp: new Date(),
        notes: note || 'Offer accepted by student'
      });
    } else if (action === 'decline') {
      application.status = 'closed';
      application.outcome = { result: 'not_selected', feedback: note || 'Offer declined by student' };
      application.timeline.push({
        stage: 'closed',
        timestamp: new Date(),
        notes: note || 'Offer declined by student'
      });
    } else {
      throw new Error('Invalid offer action');
    }

    await application.save();
    return application;
  }

  // Get student dashboard
  static async getStudentDashboard(studentId) {
    try {
      const [
        applicationStats,
        recentApplications,
        upcomingInterviews
      ] = await Promise.all([
        this.getStudentApplicationStats(studentId),
        this.getStudentApplications(studentId),
        this.getUpcomingInterviews(studentId)
      ]);

      return {
        applicationStats,
        recentApplications: recentApplications.slice(0, 5),
        upcomingInterviews,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get student dashboard: ${error.message}`);
    }
  }
}

module.exports = ApplicationService;

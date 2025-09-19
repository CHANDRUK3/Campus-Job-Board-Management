const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Company = require('../models/company');
const User = require('../models/user');
const emailService = require('./emailService');

class ApplicationService {
  // Create a new application
  static async createApplication(studentId, jobId, applicationData = {}) {
    try {
      // Check if application already exists
      const existingApplication = await Application.findOne({
        student: studentId,
        job: jobId
      });

      if (existingApplication) {
        throw new Error('Application already exists for this job');
      }

      // Create new application
      const application = new Application({
        student: studentId,
        job: jobId,
        status: 'applied',
        documents: applicationData.documents || {},
        notes: applicationData.notes || []
      });

      await application.save();

      // Populate the application with related data
      await application.populate([
        { path: 'student', select: 'name email' },
        { path: 'job', select: 'company jobTitle location salary' }
      ]);

      return application;
    } catch (error) {
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  // Get student's applications
  static async getStudentApplications(studentId, filters = {}) {
    try {
      const query = { student: studentId, ...filters };
      
      const applications = await Application.find(query)
        .populate('job', 'company jobTitle location salary applicationDeadline status')
        .populate('interview')
        .sort({ applicationDate: -1 });

      return applications;
    } catch (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }
  }

  // Get application by ID
  static async getApplicationById(applicationId) {
    try {
      const application = await Application.findById(applicationId)
        .populate('student', 'name email')
        .populate('job', 'company jobTitle location salary applicationDeadline')
        .populate('interview')
        .populate('notes.addedBy', 'name email role');

      if (!application) {
        throw new Error('Application not found');
      }

      return application;
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

      application.status = newStatus;
      application.updatedAt = new Date();

      // Add note about status change
      if (note) {
        application.notes.push({
          addedBy: updatedBy,
          note: note,
          addedAt: new Date()
        });
      }

      await application.save();

      // Send notification email to student
      await this.sendStatusUpdateNotification(application, newStatus);

      return application;
    } catch (error) {
      throw new Error(`Failed to update application status: ${error.message}`);
    }
  }

  // Schedule interview
  static async scheduleInterview(applicationId, interviewDetails, scheduledBy) {
    try {
      const application = await Application.findById(applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Create interview record
      const interview = new Interview({
        application: applicationId,
        student: application.student,
        job: application.job,
        scheduledBy: scheduledBy,
        scheduledDate: interviewDetails.scheduledDate,
        scheduledTime: interviewDetails.scheduledTime,
        duration: interviewDetails.duration || 60,
        location: interviewDetails.location,
        interviewType: interviewDetails.interviewType || 'offline',
        meetingLink: interviewDetails.meetingLink,
        meetingId: interviewDetails.meetingId,
        meetingPassword: interviewDetails.meetingPassword,
        interviewers: interviewDetails.interviewers || [],
        agenda: interviewDetails.agenda || [],
        topics: interviewDetails.topics || [],
        requirements: interviewDetails.requirements || [],
        instructions: interviewDetails.instructions || ''
      });

      await interview.save();

      // Update application status
      application.status = 'interview_scheduled';
      application.interview = interview._id;
      application.notes.push({
        addedBy: scheduledBy,
        note: `Interview scheduled for ${interviewDetails.scheduledDate}`,
        addedAt: new Date()
      });

      await application.save();

      // Send interview invitation email
      await this.sendInterviewInvitation(application, interview);

      return { application, interview };
    } catch (error) {
      throw new Error(`Failed to schedule interview: ${error.message}`);
    }
  }

  // Get upcoming interviews for student
  static async getUpcomingInterviews(studentId, days = 7) {
    try {
      const interviews = await Interview.getUpcomingInterviews(days)
        .find({ student: studentId })
        .populate('job', 'company jobTitle location')
        .populate('application');

      return interviews;
    } catch (error) {
      throw new Error(`Failed to fetch upcoming interviews: ${error.message}`);
    }
  }

  // Add interview feedback
  static async addInterviewFeedback(interviewId, feedback, submittedBy) {
    try {
      const interview = await Interview.findById(interviewId);
      
      if (!interview) {
        throw new Error('Interview not found');
      }

      await interview.addFeedback(feedback, submittedBy);

      // Update application status based on feedback
      const application = await Application.findById(interview.application);
      if (application) {
        if (feedback.recommendation === 'strong_hire' || feedback.recommendation === 'hire') {
          application.status = 'selected';
        } else if (feedback.recommendation === 'strong_no_hire' || feedback.recommendation === 'no_hire') {
          application.status = 'rejected';
        } else {
          application.status = 'interview_completed';
        }
        
        application.notes.push({
          addedBy: submittedBy,
          note: `Interview feedback submitted: ${feedback.recommendation}`,
          addedAt: new Date()
        });

        await application.save();
      }

      return interview;
    } catch (error) {
      throw new Error(`Failed to add interview feedback: ${error.message}`);
    }
  }

  // Submit student feedback
  static async submitStudentFeedback(studentId, jobId, feedbackData) {
    try {
      const feedback = new Feedback({
        student: studentId,
        job: jobId,
        feedbackType: feedbackData.feedbackType,
        ratings: feedbackData.ratings,
        feedback: feedbackData.feedback,
        interviewFeedback: feedbackData.interviewFeedback,
        companyFeedback: feedbackData.companyFeedback,
        processFeedback: feedbackData.processFeedback,
        isAnonymous: feedbackData.isAnonymous || false,
        status: 'submitted'
      });

      await feedback.save();

      return feedback;
    } catch (error) {
      throw new Error(`Failed to submit feedback: ${error.message}`);
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
            shortlisted: { $sum: { $cond: [{ $eq: ['$status', 'shortlisted'] }, 1, 0] } },
            interviewScheduled: { $sum: { $cond: [{ $eq: ['$status', 'interview_scheduled'] }, 1, 0] } },
            interviewCompleted: { $sum: { $cond: [{ $eq: ['$status', 'interview_completed'] }, 1, 0] } },
            selected: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            withdrawn: { $sum: { $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0] } }
          }
        }
      ]);

      return stats[0] || {
        totalApplications: 0,
        applied: 0,
        shortlisted: 0,
        interviewScheduled: 0,
        interviewCompleted: 0,
        selected: 0,
        rejected: 0,
        withdrawn: 0
      };
    } catch (error) {
      throw new Error(`Failed to get application statistics: ${error.message}`);
    }
  }

  // Get application timeline
  static async getApplicationTimeline(studentId) {
    try {
      const applications = await Application.find({ student: studentId })
        .populate('job', 'company jobTitle')
        .sort({ applicationDate: -1 })
        .limit(10);

      const timeline = applications.map(app => ({
        id: app._id,
        job: app.job,
        status: app.status,
        applicationDate: app.applicationDate,
        timeline: app.timeline,
        lastUpdated: app.updatedAt
      }));

      return timeline;
    } catch (error) {
      throw new Error(`Failed to get application timeline: ${error.message}`);
    }
  }

  // Send status update notification
  static async sendStatusUpdateNotification(application, newStatus) {
    try {
      const student = await User.findById(application.student);
      const job = await Company.findById(application.job);

      if (student && job) {
        const subject = `Application Update: ${job.jobTitle} at ${job.company}`;
        const message = `Your application status has been updated to: ${newStatus}`;
        
        await emailService.sendEmail(student.email, subject, message);
      }
    } catch (error) {
      console.error('Failed to send status update notification:', error);
    }
  }

  // Send interview invitation
  static async sendInterviewInvitation(application, interview) {
    try {
      const student = await User.findById(application.student);
      const job = await Company.findById(application.job);

      if (student && job) {
        await emailService.sendInterviewInvitation(
          student.email,
          job,
          {
            date: interview.scheduledDate,
            time: interview.scheduledTime,
            location: interview.location,
            interviewer: interview.interviewers[0]?.name || 'TBD',
            instructions: interview.instructions
          }
        );
      }
    } catch (error) {
      console.error('Failed to send interview invitation:', error);
    }
  }

  // Get dashboard data for student
  static async getStudentDashboard(studentId) {
    try {
      const [
        applicationStats,
        recentApplications,
        upcomingInterviews,
        recentFeedback
      ] = await Promise.all([
        this.getStudentApplicationStats(studentId),
        this.getStudentApplications(studentId, {}, 5),
        this.getUpcomingInterviews(studentId, 30),
        Feedback.getRecentFeedback(5)
      ]);

      return {
        applicationStats,
        recentApplications,
        upcomingInterviews,
        recentFeedback,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get student dashboard: ${error.message}`);
    }
  }
}

module.exports = ApplicationService;

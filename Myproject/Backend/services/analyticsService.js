const Company = require('../models/company');
const User = require('../models/user');
const OptStatus = require('../models/OptStatus');
const Notification = require('../models/Notification');

class AnalyticsService {
  // Get comprehensive dashboard analytics
  static async getDashboardAnalytics(adminEmail) {
    try {
      const [
        jobStats,
        applicationStats,
        studentStats,
        recentActivity,
        topCompanies,
        placementTrends
      ] = await Promise.all([
        this.getJobStatistics(adminEmail),
        this.getApplicationStatistics(),
        this.getStudentStatistics(),
        this.getRecentActivity(),
        this.getTopCompanies(),
        this.getPlacementTrends()
      ]);

      return {
        jobStats,
        applicationStats,
        studentStats,
        recentActivity,
        topCompanies,
        placementTrends,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Analytics generation failed: ${error.message}`);
    }
  }

  // Job statistics
  static async getJobStatistics(adminEmail) {
    const totalJobs = await Company.countDocuments();
    const activeJobs = await Company.countDocuments({ status: 'active' });
    const closedJobs = await Company.countDocuments({ status: 'closed' });
    const draftJobs = await Company.countDocuments({ status: 'draft' });
    
    // Jobs by admin
    const adminJobs = await Company.countDocuments({ createdBy: adminEmail });
    
    // Jobs by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const jobsByMonth = await Company.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return {
      total: totalJobs,
      active: activeJobs,
      closed: closedJobs,
      draft: draftJobs,
      adminJobs,
      jobsByMonth: jobsByMonth.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        count: item.count
      }))
    };
  }

  // Application statistics
  static async getApplicationStatistics() {
    const totalApplications = await OptStatus.countDocuments();
    const optInCount = await OptStatus.countDocuments({ status: 'opt-in' });
    const optOutCount = await OptStatus.countDocuments({ status: 'opt-out' });
    
    // Applications by job
    const applicationsByJob = await OptStatus.aggregate([
      {
        $group: {
          _id: '$jobId',
          totalApplications: { $sum: 1 },
          optInCount: {
            $sum: { $cond: [{ $eq: ['$status', 'opt-in'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'job'
        }
      },
      {
        $unwind: '$job'
      },
      {
        $project: {
          jobTitle: '$job.jobTitle',
          company: '$job.company',
          totalApplications: 1,
          optInCount: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$optInCount', '$totalApplications'] },
              100
            ]
          }
        }
      },
      {
        $sort: { optInCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Applications by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const applicationsByMonth = await OptStatus.aggregate([
      {
        $match: {
          timestamp: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' }
          },
          totalApplications: { $sum: 1 },
          optInCount: {
            $sum: { $cond: [{ $eq: ['$status', 'opt-in'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return {
      total: totalApplications,
      optIn: optInCount,
      optOut: optOutCount,
      conversionRate: totalApplications > 0 ? (optInCount / totalApplications * 100).toFixed(2) : 0,
      topJobs: applicationsByJob,
      applicationsByMonth: applicationsByMonth.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        total: item.totalApplications,
        optIn: item.optInCount
      }))
    };
  }

  // Student statistics
  static async getStudentStatistics() {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ 
      role: 'student', 
      isActive: true 
    });
    
    // Students with applications
    const studentsWithApplications = await OptStatus.distinct('studentEmail');
    
    // Most active students
    const mostActiveStudents = await OptStatus.aggregate([
      {
        $group: {
          _id: '$studentEmail',
          totalApplications: { $sum: 1 },
          optInCount: {
            $sum: { $cond: [{ $eq: ['$status', 'opt-in'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'email',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalApplications: 1,
          optInCount: 1
        }
      },
      {
        $sort: { totalApplications: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      total: totalStudents,
      active: activeStudents,
      withApplications: studentsWithApplications.length,
      mostActive: mostActiveStudents
    };
  }

  // Recent activity
  static async getRecentActivity() {
    const recentJobs = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('company jobTitle createdAt createdBy');

    const recentApplications = await OptStatus.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('jobId', 'company jobTitle')
      .select('studentEmail status timestamp jobId');

    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type message recipient createdAt');

    return {
      recentJobs,
      recentApplications,
      recentNotifications
    };
  }

  // Top companies by applications
  static async getTopCompanies() {
    const topCompanies = await OptStatus.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      {
        $unwind: '$job'
      },
      {
        $group: {
          _id: '$job.company',
          totalApplications: { $sum: 1 },
          optInCount: {
            $sum: { $cond: [{ $eq: ['$status', 'opt-in'] }, 1, 0] }
          },
          jobCount: { $addToSet: '$jobId' }
        }
      },
      {
        $project: {
          company: '$_id',
          totalApplications: 1,
          optInCount: 1,
          jobCount: { $size: '$jobCount' },
          conversionRate: {
            $multiply: [
              { $divide: ['$optInCount', '$totalApplications'] },
              100
            ]
          }
        }
      },
      {
        $sort: { optInCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return topCompanies;
  }

  // Placement trends
  static async getPlacementTrends() {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    
    // Monthly trends for current year
    const monthlyTrends = await Company.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          jobsPosted: { $sum: 1 },
          totalPositions: { $sum: '$members' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Application trends
    const applicationTrends = await OptStatus.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$timestamp' },
          totalApplications: { $sum: 1 },
          optInApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'opt-in'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return {
      monthlyTrends: monthlyTrends.map(item => ({
        month: item._id,
        jobsPosted: item.jobsPosted,
        totalPositions: item.totalPositions
      })),
      applicationTrends: applicationTrends.map(item => ({
        month: item._id,
        totalApplications: item.totalApplications,
        optInApplications: item.optInApplications
      }))
    };
  }

  // Generate placement report
  static async generatePlacementReport(startDate, endDate) {
    try {
      const jobs = await Company.find({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      const applications = await OptStatus.find({
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).populate('jobId', 'company jobTitle');

      const students = await User.find({ role: 'student' });

      return {
        period: { startDate, endDate },
        summary: {
          totalJobs: jobs.length,
          totalApplications: applications.length,
          totalStudents: students.length,
          optInRate: applications.length > 0 ? 
            (applications.filter(app => app.status === 'opt-in').length / applications.length * 100).toFixed(2) : 0
        },
        jobs,
        applications,
        students: students.map(student => ({
          name: student.name,
          email: student.email,
          applicationsCount: applications.filter(app => app.studentEmail === student.email).length
        }))
      };
    } catch (error) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }
}

module.exports = AnalyticsService;

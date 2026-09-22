const Drive = require('../models/Drive');
const Company = require('../models/company');
const User = require('../models/user');
const Application = require('../models/Application');
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
    const totalJobs = await Drive.countDocuments();
    const activeJobs = await Drive.countDocuments({ status: 'active' });
    const closedJobs = await Drive.countDocuments({ status: 'closed' });
    const draftJobs = await Drive.countDocuments({ status: 'draft' });
    
    // Jobs by admin
    const adminJobs = await Drive.countDocuments({ createdBy: adminEmail });
    
    // Jobs by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const jobsByMonth = await Drive.aggregate([
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
    const totalApplications = await Application.countDocuments();
    const selectedCount = await Application.countDocuments({ status: 'selected' });
    const rejectedCount = await Application.countDocuments({ status: 'closed', 'outcome.result': 'not_selected' });
    
    // Applications by job
    const applicationsByJob = await Application.aggregate([
      {
        $group: {
          _id: '$drive',
          totalApplications: { $sum: 1 },
          selectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'drives',
          localField: '_id',
          foreignField: '_id',
          as: 'driveInfo'
        }
      },
      {
        $unwind: '$driveInfo'
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'driveInfo.companyId',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      {
        $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          jobTitle: '$driveInfo.role',
          company: '$companyInfo.name',
          totalApplications: 1,
          selectedCount: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$selectedCount', '$totalApplications'] },
              100
            ]
          }
        }
      },
      {
        $sort: { totalApplications: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Applications by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const applicationsByMonth = await Application.aggregate([
      {
        $match: {
          applicationDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$applicationDate' },
            month: { $month: '$applicationDate' }
          },
          totalApplications: { $sum: 1 },
          selectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return {
      total: totalApplications,
      selected: selectedCount,
      rejected: rejectedCount,
      conversionRate: totalApplications > 0 ? (selectedCount / totalApplications * 100).toFixed(2) : 0,
      topJobs: applicationsByJob,
      applicationsByMonth: applicationsByMonth.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        total: item.totalApplications,
        selected: item.selectedCount
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
    const studentsWithApplicationsResult = await Application.distinct('student');
    
    // Most active students
    const mostActiveStudents = await Application.aggregate([
      {
        $group: {
          _id: '$student',
          totalApplications: { $sum: 1 },
          selectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
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
          selectedCount: 1
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
      withApplications: studentsWithApplicationsResult.length,
      mostActive: mostActiveStudents
    };
  }

  // Recent activity
  static async getRecentActivity() {
    const recentJobs = await Drive.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('companyId', 'name')
      .select('companyId role createdAt createdBy');

    // format recent jobs
    const formattedRecentJobs = recentJobs.map(job => ({
      company: job.companyId ? job.companyId.name : 'Unknown',
      jobTitle: job.role,
      createdAt: job.createdAt,
      createdBy: job.createdBy
    }));

    const recentApplications = await Application.find()
      .sort({ applicationDate: -1 })
      .limit(10)
      .populate({
        path: 'drive',
        populate: { path: 'companyId', select: 'name' }
      })
      .populate('student', 'email name')
      .select('student status applicationDate drive');

    // format recent apps
    const formattedRecentApps = recentApplications.map(app => ({
      studentEmail: app.student ? app.student.email : 'Unknown',
      status: app.status,
      timestamp: app.applicationDate,
      job: {
        company: app.drive?.companyId?.name || 'Unknown',
        jobTitle: app.drive?.role || 'Unknown'
      }
    }));

    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type message recipient createdAt');

    return {
      recentJobs: formattedRecentJobs,
      recentApplications: formattedRecentApps,
      recentNotifications
    };
  }

  // Top companies by applications
  static async getTopCompanies() {
    const topCompanies = await Application.aggregate([
      {
        $lookup: {
          from: 'drives',
          localField: 'drive',
          foreignField: '_id',
          as: 'driveInfo'
        }
      },
      {
        $unwind: '$driveInfo'
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'driveInfo.companyId',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $unwind: '$company'
      },
      {
        $group: {
          _id: '$company.name',
          totalApplications: { $sum: 1 },
          selectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
          },
          jobCount: { $addToSet: '$drive' }
        }
      },
      {
        $project: {
          company: '$_id',
          totalApplications: 1,
          selectedCount: 1,
          jobCount: { $size: '$jobCount' },
          conversionRate: {
            $multiply: [
              { $divide: ['$selectedCount', '$totalApplications'] },
              100
            ]
          }
        }
      },
      {
        $sort: { totalApplications: -1 }
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
    const monthlyTrends = await Drive.aggregate([
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
    const applicationTrends = await Application.aggregate([
      {
        $match: {
          applicationDate: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$applicationDate' },
          totalApplications: { $sum: 1 },
          selectedApplications: {
            $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] }
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
        selectedApplications: item.selectedApplications
      }))
    };
  }

  // Generate placement report
  static async generatePlacementReport(startDate, endDate) {
    try {
      const jobs = await Drive.find({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).populate('companyId', 'name');

      const applications = await Application.find({
        applicationDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).populate({
        path: 'drive',
        populate: { path: 'companyId', select: 'name' }
      }).populate('student', 'email name');

      const students = await User.find({ role: 'student' });

      return {
        period: { startDate, endDate },
        summary: {
          totalJobs: jobs.length,
          totalApplications: applications.length,
          totalStudents: students.length,
          selectedRate: applications.length > 0 ? 
            (applications.filter(app => app.status === 'selected').length / applications.length * 100).toFixed(2) : 0
        },
        jobs,
        applications,
        students: students.map(student => ({
          name: student.name,
          email: student.email,
          applicationsCount: applications.filter(app => app.student && app.student.email === student.email).length
        }))
      };
    } catch (error) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }
}

module.exports = AnalyticsService;

const Drive = require('../models/Drive');
const Company = require('../models/company');

class SearchService {
  // Advanced search with filters, pagination, and sorting
  static async searchJobs({
    query = '',
    filters = {},
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    try {
      // Build search criteria
      const searchCriteria = await this.buildSearchCriteria(query, filters);
      
      // Build sort criteria
      const sortCriteria = this.buildSortCriteria(sortBy, sortOrder);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute search with pagination
      const [drives, totalCount] = await Promise.all([
        Drive.find(searchCriteria)
          .populate('companyId')
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .lean(),
        Drive.countDocuments(searchCriteria)
      ]);
      
      // Map Drive database objects to the format the frontend expects (compat layer)
      const jobs = drives.map(drive => ({
        ...drive,
        company: drive.companyId?.name || 'Unknown Company',
        jobTitle: drive.role,
        salary: { min: drive.package, max: drive.package }, // Map package CTC to min/max salary range
        formattedSalary: `${drive.package} LPA`,
        // Calculate days left
        daysUntilDeadline: Math.ceil((new Date(drive.importantDates.registrationDeadline) - new Date()) / (1000 * 60 * 60 * 24)),
        applicationDeadline: drive.importantDates.registrationDeadline
      }));
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      
      return {
        jobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
  
  // Build search criteria based on query and filters
  static async buildSearchCriteria(query, filters) {
    const criteria = { status: 'active' }; // Only show active drives
    
    // Text search using regex across Drive fields and Company name
    if (query && query.trim()) {
      const searchTerm = query.trim();
      
      // Find companies matching name first
      const matchingCompanies = await Company.find({
        name: { $regex: searchTerm, $options: 'i' }
      }).select('_id');
      const companyIds = matchingCompanies.map(c => c._id);

      criteria.$or = [
        { companyId: { $in: companyIds } },
        { role: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { skills: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Salary/Package range filter (package CTC is stored directly on Drive)
    if (filters.minSalary || filters.maxSalary) {
      criteria.package = {};
      if (filters.minSalary) {
        criteria.package.$gte = parseFloat(filters.minSalary);
      }
      if (filters.maxSalary) {
        criteria.package.$lte = parseFloat(filters.maxSalary);
      }
    }
    
    // Location filter
    if (filters.location && filters.location.trim()) {
      criteria.location = { 
        $regex: filters.location.trim(), 
        $options: 'i' 
      };
    }
    
    // Job type filter
    if (filters.jobType && filters.jobType.length > 0) {
      criteria.jobType = { $in: filters.jobType };
    }
    
    // Experience/Work Mode filter
    if (filters.workMode && filters.workMode.length > 0) {
      criteria.workMode = { $in: filters.workMode };
    }
    
    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      criteria.skills = { $in: filters.skills };
    }
    
    // Application deadline filter (only show drives with future deadlines)
    criteria['importantDates.registrationDeadline'] = { $gt: new Date() };
    
    return criteria;
  }
  
  // Build sort criteria
  static buildSortCriteria(sortBy, sortOrder) {
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'salary':
        return { package: order };
      case 'deadline':
        return { 'importantDates.registrationDeadline': order };
      case 'company':
        // Note: sorting by populated field in MongoDB directly is complex. We default to package/date
        return { createdAt: order };
      default:
        return { createdAt: order };
    }
  }
  
  // Get search suggestions
  static async getSearchSuggestions(query, limit = 5) {
    try {
      if (!query || query.trim().length < 2) {
        return { companies: [], skills: [], locations: [] };
      }
      
      const searchTerm = query.trim();
      
      const [companies, skills, locations] = await Promise.all([
        // Company name suggestions
        Company.distinct('name', {
          name: { $regex: searchTerm, $options: 'i' }
        }).limit(limit),
        
        // Skills suggestions
        Drive.aggregate([
          { $match: { status: 'active' } },
          { $unwind: '$skills' },
          { $match: { skills: { $regex: searchTerm, $options: 'i' } } },
          { $group: { _id: '$skills' } },
          { $limit: limit }
        ]).then(results => results.map(r => r._id)),
        
        // Location suggestions
        Drive.distinct('location', {
          location: { $regex: searchTerm, $options: 'i' },
          status: 'active'
        }).limit(limit)
      ]);
      
      return { companies, skills, locations };
    } catch (error) {
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  }
  
  // Get filter options for dropdowns
  static async getFilterOptions() {
    try {
      const [locations, skills, companies] = await Promise.all([
        Drive.distinct('location', { status: 'active' }),
        Drive.aggregate([
          { $match: { status: 'active' } },
          { $unwind: '$skills' },
          { $group: { _id: '$skills' } },
          { $sort: { _id: 1 } }
        ]).then(results => results.map(r => r._id)),
        Company.distinct('name')
      ]);
      
      return {
        locations: locations.sort(),
        skills: skills.sort(),
        companies: companies.sort(),
        jobTypes: ['full-time', 'internship', 'ppo'],
        experienceLevels: ['onsite', 'hybrid', 'remote'] // Mapped to workMode
      };
    } catch (error) {
      throw new Error(`Failed to get filter options: ${error.message}`);
    }
  }
}

module.exports = SearchService;

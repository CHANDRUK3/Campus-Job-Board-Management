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
      const searchCriteria = this.buildSearchCriteria(query, filters);
      
      // Build sort criteria
      const sortCriteria = this.buildSortCriteria(sortBy, sortOrder);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute search with pagination
      const [jobs, totalCount] = await Promise.all([
        Company.find(searchCriteria)
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .lean(),
        Company.countDocuments(searchCriteria)
      ]);
      
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
  static buildSearchCriteria(query, filters) {
    const criteria = { status: 'active' }; // Only show active jobs
    
    // Text search using regex (more reliable than text index)
    if (query && query.trim()) {
      const searchTerm = query.trim();
      criteria.$or = [
        { company: { $regex: searchTerm, $options: 'i' } },
        { jobTitle: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { skills: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Salary range filter
    if (filters.minSalary || filters.maxSalary) {
      criteria['salary.min'] = {};
      if (filters.minSalary) {
        criteria['salary.min'].$gte = parseFloat(filters.minSalary);
      }
      if (filters.maxSalary) {
        criteria['salary.max'] = { $lte: parseFloat(filters.maxSalary) };
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
    
    // Experience level filter
    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      criteria.experienceLevel = { $in: filters.experienceLevel };
    }
    
    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      criteria.skills = { $in: filters.skills };
    }
    
    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      switch (filters.dateRange) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          criteria.createdAt = { $gte: today };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          criteria.createdAt = { $gte: weekAgo };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          criteria.createdAt = { $gte: monthAgo };
          break;
      }
    }
    
    // Application deadline filter (only show jobs with future deadlines)
    criteria.applicationDeadline = { $gt: new Date() };
    
    return criteria;
  }
  
  // Build sort criteria
  static buildSortCriteria(sortBy, sortOrder) {
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'salary':
        return { 'salary.min': order };
      case 'deadline':
        return { applicationDeadline: order };
      case 'relevance':
        return { score: { $meta: 'textScore' }, createdAt: -1 };
      case 'company':
        return { company: order };
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
        // Company suggestions
        Company.distinct('company', {
          company: { $regex: searchTerm, $options: 'i' },
          status: 'active'
        }).limit(limit),
        
        // Skills suggestions
        Company.aggregate([
          { $match: { status: 'active' } },
          { $unwind: '$skills' },
          { $match: { skills: { $regex: searchTerm, $options: 'i' } } },
          { $group: { _id: '$skills' } },
          { $limit: limit }
        ]).then(results => results.map(r => r._id)),
        
        // Location suggestions
        Company.distinct('location', {
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
        Company.distinct('location', { status: 'active' }),
        Company.aggregate([
          { $match: { status: 'active' } },
          { $unwind: '$skills' },
          { $group: { _id: '$skills' } },
          { $sort: { _id: 1 } }
        ]).then(results => results.map(r => r._id)),
        Company.distinct('company', { status: 'active' })
      ]);
      
      return {
        locations: locations.sort(),
        skills: skills.sort(),
        companies: companies.sort(),
        jobTypes: ['full-time', 'part-time', 'internship', 'contract'],
        experienceLevels: ['fresher', '1-2 years', '3-5 years', '5+ years']
      };
    } catch (error) {
      throw new Error(`Failed to get filter options: ${error.message}`);
    }
  }
}

module.exports = SearchService;

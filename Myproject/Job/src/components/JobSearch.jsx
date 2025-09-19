import React, { useState, useEffect, useCallback } from 'react';
import { jobsAPI } from '../utils/api';
import '../style.css';

const JobSearch = ({ onSearchResults, onLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    jobType: [],
    experienceLevel: [],
    skills: [],
    minSalary: '',
    maxSalary: '',
    dateRange: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [suggestions, setSuggestions] = useState({ companies: [], skills: [], locations: [] });
  const [filterOptions, setFilterOptions] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const limit = 10;

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        loadSuggestions(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions({ companies: [], skills: [], locations: [] });
    }
  }, [searchQuery]);

  const loadFilterOptions = async () => {
    try {
      const options = await jobsAPI.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadSuggestions = async (query) => {
    try {
      const suggestions = await jobsAPI.getSuggestions(query);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const performSearch = useCallback(async (page = 1) => {
    if (onLoading) onLoading(true);
    
    try {
      const searchParams = {
        q: searchQuery,
        page,
        limit,
        sortBy,
        sortOrder,
        ...filters
      };

      // Remove empty filters
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === '' || 
            (Array.isArray(searchParams[key]) && searchParams[key].length === 0)) {
          delete searchParams[key];
        }
      });

      const results = await jobsAPI.search(searchParams);
      
      if (onSearchResults) {
        onSearchResults(results);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Search failed:', error);
      if (onSearchResults) {
        onSearchResults({ jobs: [], pagination: {} });
      }
    } finally {
      if (onLoading) onLoading(false);
    }
  }, [searchQuery, filters, sortBy, sortOrder, onSearchResults, onLoading]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, sortBy, sortOrder]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleMultiSelectFilter = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: prev[filterName].includes(value)
        ? prev[filterName].filter(item => item !== value)
        : [...prev[filterName], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      jobType: [],
      experienceLevel: [],
      skills: [],
      minSalary: '',
      maxSalary: '',
      dateRange: ''
    });
    setSearchQuery('');
  };

  const handleSuggestionClick = (type, value) => {
    if (type === 'company' || type === 'location') {
      setSearchQuery(value);
    } else if (type === 'skill') {
      handleMultiSelectFilter('skills', value);
    }
    setShowSuggestions(false);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && !(Array.isArray(value) && value.length === 0)
  ).length;

  return (
    <div className="job-search-container">
      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="search-input"
          />
          <button 
            className="search-btn"
            onClick={() => performSearch(1)}
          >
            🔍
          </button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (suggestions.companies.length > 0 || suggestions.skills.length > 0 || suggestions.locations.length > 0) && (
          <div className="search-suggestions">
            {suggestions.companies.length > 0 && (
              <div className="suggestion-group">
                <div className="suggestion-label">Companies</div>
                {suggestions.companies.map((company, index) => (
                  <div 
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick('company', company)}
                  >
                    🏢 {company}
                  </div>
                ))}
              </div>
            )}
            
            {suggestions.skills.length > 0 && (
              <div className="suggestion-group">
                <div className="suggestion-label">Skills</div>
                {suggestions.skills.map((skill, index) => (
                  <div 
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick('skill', skill)}
                  >
                    💻 {skill}
                  </div>
                ))}
              </div>
            )}
            
            {suggestions.locations.length > 0 && (
              <div className="suggestion-group">
                <div className="suggestion-label">Locations</div>
                {suggestions.locations.map((location, index) => (
                  <div 
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick('location', location)}
                  >
                    📍 {location}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="filter-controls">
        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          🔧 Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
        
        <div className="sort-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="createdAt">Date Posted</option>
            <option value="salary">Salary</option>
            <option value="deadline">Application Deadline</option>
            <option value="company">Company</option>
          </select>
          
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Location</label>
              <select 
                value={filters.location} 
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="filter-select"
              >
                <option value="">All Locations</option>
                {filterOptions.locations?.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Job Type</label>
              <div className="checkbox-group">
                {filterOptions.jobTypes?.map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.jobType.includes(type)}
                      onChange={() => handleMultiSelectFilter('jobType', type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Experience Level</label>
              <div className="checkbox-group">
                {filterOptions.experienceLevels?.map(level => (
                  <label key={level} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.experienceLevel.includes(level)}
                      onChange={() => handleMultiSelectFilter('experienceLevel', level)}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Skills</label>
              <div className="checkbox-group">
                {filterOptions.skills?.slice(0, 10).map(skill => (
                  <label key={skill} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.skills.includes(skill)}
                      onChange={() => handleMultiSelectFilter('skills', skill)}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Salary Range (LPA)</label>
              <div className="salary-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minSalary}
                  onChange={(e) => handleFilterChange('minSalary', e.target.value)}
                  className="salary-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxSalary}
                  onChange={(e) => handleFilterChange('maxSalary', e.target.value)}
                  className="salary-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Posted</label>
              <select 
                value={filters.dateRange} 
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="filter-select"
              >
                <option value="">Any time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSearch;

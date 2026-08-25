import React, { useState, useEffect } from 'react';
import EnhancedAdminDashboard from '../components/EnhancedAdminDashboard';
import StudentDashboard from '../components/StudentDashboard';
import JobSearch from '../components/JobSearch';
import JobCard from '../components/JobCard';
import Pagination from '../components/Pagination';
import { getUser, jobsAPI, optStatusAPI, studentAPI } from '../utils/api';

const Jobs = () => {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [jobForm, setJobForm] = useState({ 
    company: '', 
    jobTitle: '',
    description: '',
    skills: '', 
    salary: { min: '', max: '' },
    location: '',
    jobType: 'full-time',
    experienceLevel: 'fresher',
    members: '',
    applicationDeadline: '',
    requirements: [],
    benefits: [],
    contactEmail: '',
    website: ''
  });
  const [optedJobs, setOptedJobs] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const fetchJobs = async (email, role) => {
    try {
      if (role === 'admin') {
        const data = await jobsAPI.getByAdmin(email);
        setJobs(data);
      } else {
        // Use search API to get all jobs with pagination
        const data = await jobsAPI.search({ page: 1, limit: 50 });
        setJobs(data.jobs || []);
        setPagination(data.pagination || {});
      }
    } catch (err) {
      console.error('❌ Failed to fetch jobs', err);
      // Fallback to basic getAll if search fails
      try {
        const data = await jobsAPI.getAll();
        setJobs(data);
        console.log('✅ Fallback fetch successful, got jobs:', data.length);
      } catch (fallbackErr) {
        console.error('❌ Fallback fetch also failed', fallbackErr);
        setJobs([]);
      }
    }
  };

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      fetchJobs(currentUser.email, currentUser.role);
      if (currentUser.role === 'student') {
        fetchOptedJobs(currentUser.email);
      }
    } else {
      // If no user, still try to fetch jobs for public viewing
      fetchJobs(null, 'public');
    }
  }, []);

  const fetchOptedJobs = async (email) => {
    try {
      const data = await optStatusAPI.getByStudent(email);
      const jobIds = data.filter(opt => opt.status === 'opt-in').map(opt => opt.jobId);
      setOptedJobs(jobIds);
    } catch (err) {
      console.error('❌ Failed to fetch opted jobs', err);
    }
  };

  const handleSearchResults = (results) => {
    setJobs(results.jobs || []);
    setPagination(results.pagination || {});
  };

  const handlePageChange = (page) => {
    // This will be handled by the JobSearch component
  };

  const handleJobChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('salary.')) {
      const salaryField = name.split('.')[1];
      setJobForm(prev => ({
        ...prev,
        salary: { ...prev.salary, [salaryField]: value }
      }));
    } else {
      setJobForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse skills from string to array
      const skillsArray = jobForm.skills.split(',').map(s => s.trim()).filter(s => s);
      
      // Validate required fields
      if (!jobForm.company.trim()) {
        alert('Company name is required');
        return;
      }
      if (!jobForm.jobTitle.trim()) {
        alert('Job title is required');
        return;
      }
      if (!jobForm.description.trim()) {
        alert('Job description is required');
        return;
      }
      if (skillsArray.length === 0) {
        alert('At least one skill is required');
        return;
      }
      if (!jobForm.location.trim()) {
        alert('Location is required');
        return;
      }
      if (!jobForm.salary.min || !jobForm.salary.max) {
        alert('Both minimum and maximum salary are required');
        return;
      }
      if (!jobForm.members || jobForm.members < 1) {
        alert('Number of positions must be at least 1');
        return;
      }
      if (!jobForm.applicationDeadline) {
        alert('Application deadline is required');
        return;
      }

      // Validate salary values
      const minSalary = parseFloat(jobForm.salary.min);
      const maxSalary = parseFloat(jobForm.salary.max);
      
      if (isNaN(minSalary) || isNaN(maxSalary)) {
        alert('Salary values must be valid numbers');
        return;
      }
      
      if (minSalary <= 0 || maxSalary <= 0) {
        alert('Salary values must be greater than 0');
        return;
      }
      
      if (maxSalary < minSalary) {
        alert('Maximum salary must be greater than or equal to minimum salary');
        return;
      }

      // Validate deadline
      const deadline = new Date(jobForm.applicationDeadline);
      if (isNaN(deadline.getTime())) {
        alert('Please enter a valid application deadline');
        return;
      }
      
      if (deadline <= new Date()) {
        alert('Application deadline must be in the future');
        return;
      }

      // Build payload and drop optional empty strings so backend optional() validators don't fail
      const newJobRaw = {
        ...jobForm,
        skills: skillsArray,
        salary: {
          min: minSalary,
          max: maxSalary,
          currency: 'INR'
        },
        members: parseInt(jobForm.members, 10),
        applicationDeadline: deadline.toISOString(),
      };

      const newJob = Object.fromEntries(
        Object.entries(newJobRaw).filter(([key, value]) => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          return true;
        })
      );

      // Clean nested optional fields
      if (newJob.contactEmail && newJob.contactEmail.trim() === '') delete newJob.contactEmail;
      if (newJob.website && newJob.website.trim() === '') delete newJob.website;
      if (Array.isArray(newJob.requirements) && newJob.requirements.length === 0) delete newJob.requirements;
      if (Array.isArray(newJob.benefits) && newJob.benefits.length === 0) delete newJob.benefits;

      console.log('Submitting job:', newJob);
      console.log('User token:', localStorage.getItem('accessToken'));
      const result = await jobsAPI.create(newJob);
      console.log('Job creation result:', result);
      
      // Reset form
      setJobForm({ 
        company: '', 
        jobTitle: '',
        description: '',
        skills: '', 
        salary: { min: '', max: '' },
        location: '',
        jobType: 'full-time',
        experienceLevel: 'fresher',
        members: '',
        applicationDeadline: '',
        requirements: [],
        benefits: [],
        contactEmail: '',
        website: ''
      });
      setShowForm(false);
      setFormErrors({});
      alert('Job posted successfully!');
      fetchJobs(user.email, user.role);
    } catch (err) {
      console.error('❌ Failed to add job', err);
      // Show more specific error message and surface field errors
      if (err.data && Array.isArray(err.data.errors)) {
        const fe = {};
        err.data.errors.forEach(e => { if (e.field) fe[e.field] = e.message; });
        setFormErrors(fe);
        alert(err.data.message || 'Validation failed. Please fix highlighted fields.');
      } else if (err.status === 403) {
        alert('Access denied. Admin permissions are required to post jobs.');
      } else if (err.status === 401 || (err.message && err.message.includes('Session expired'))) {
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert('Failed to post job: ' + (err.message || 'Please try again.'));
      }
    }
  };

  const handleOptIn = async (job) => {
    try {
      if (!user?.email) {
        alert('User email not found!');
        return;
      }
      
      await optStatusAPI.set({
        studentEmail: user.email,
        jobId: job._id,
        status: 'opt-in'
      });
      
      await fetchOptedJobs(user.email);
    } catch (error) {
      console.error('❌ Opt-in failed:', error);
      alert('❌ Opt-in failed: ' + error.message);
    }
  };

  const handleOptOut = async (job) => {
    try {
      if (!user?.email) {
        alert('User email not found!');
        return;
      }
      
      await optStatusAPI.set({
        studentEmail: user.email,
        jobId: job._id,
        status: 'opt-out'
      });
      
      await fetchOptedJobs(user.email);
    } catch (error) {
      console.error('❌ Opt-out failed:', error);
      alert('❌ Opt-out failed: ' + error.message);
    }
  };

  const handleApply = async (jobId) => {
    try {
      await studentAPI.createApplication(jobId);
      alert('Application submitted successfully!');
      // Refresh applications or update UI
    } catch (error) {
      console.error('Application error:', error);
      if (error.message.includes('already exists')) {
        alert('You have already applied for this job');
      } else {
        alert('Failed to submit application');
      }
    }
  };

  if (!user) {
    return (
      <div className="jobs-container">
        <h2>💼 Job Opportunities</h2>
        <p>Please log in to apply for jobs or manage your applications.</p>
        
        <JobSearch 
          onSearchResults={handleSearchResults}
          onLoading={setLoading}
        />
        
        {loading && <div className="loading">Searching jobs...</div>}
        
        <div className="job-list">
          {jobs.length === 0 ? (
            <div className="no-jobs">
              <p>No jobs found matching your criteria.</p>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                user={null}
                onOptIn={() => alert('Please log in to opt-in for jobs')}
                onOptOut={() => alert('Please log in to manage your applications')}
                optedJobs={[]}
                onApply={() => alert('Please log in to apply for jobs')}
              />
            ))
          )}
        </div>
        
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
            totalCount={pagination.totalCount}
            limit={pagination.limit}
          />
        )}
      </div>
    );
  }

  return (
    <div className="jobs-container">
      {user.role === 'admin' ? (
        <>
          <div className="job-header">
            <h2>💼 Manage Job Postings</h2>
            <button onClick={() => setShowForm(!showForm)}>➕ Add Job</button>
          </div>

          {showForm && (
            <div className="job-form-container">
              <h3>Post New Job</h3>
              <form onSubmit={handleJobSubmit} className="job-form">
                <div className="form-row">
                  <div className="field-group">
                    <input 
                      name="company" 
                      placeholder="Company Name" 
                      value={jobForm.company} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors.company}
                      required 
                    />
                    {formErrors.company && <small className="field-error">{formErrors.company}</small>}
                  </div>
                  <div className="field-group">
                    <input 
                      name="jobTitle" 
                      placeholder="Job Title" 
                      value={jobForm.jobTitle} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors.jobTitle}
                      required 
                    />
                    {formErrors.jobTitle && <small className="field-error">{formErrors.jobTitle}</small>}
                  </div>
                </div>
                
                <div className="field-group full-row">
                  <textarea 
                    name="description" 
                    placeholder="Job Description" 
                    value={jobForm.description} 
                    onChange={handleJobChange} 
                    aria-invalid={!!formErrors.description}
                    rows="4"
                    required 
                  />
                  {formErrors.description && <small className="field-error">{formErrors.description}</small>}
                </div>
                
                <div className="form-row">
                  <div className="field-group">
                    <input 
                      name="skills" 
                      placeholder="Skills (comma separated)" 
                      value={jobForm.skills} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors.skills}
                      required 
                    />
                    {formErrors.skills && <small className="field-error">{formErrors.skills}</small>}
                  </div>
                  <div className="field-group">
                    <input 
                      name="location" 
                      placeholder="Location" 
                      value={jobForm.location} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors.location}
                      required 
                    />
                    {formErrors.location && <small className="field-error">{formErrors.location}</small>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="field-group">
                    <input 
                      name="salary.min" 
                      type="number"
                      placeholder="Min Salary (LPA)" 
                      value={jobForm.salary.min} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors['salary.min']}
                      required 
                    />
                    {formErrors['salary.min'] && <small className="field-error">{formErrors['salary.min']}</small>}
                  </div>
                  <div className="field-group">
                    <input 
                      name="salary.max" 
                      type="number"
                      placeholder="Max Salary (LPA)" 
                      value={jobForm.salary.max} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors['salary.max']}
                      required 
                    />
                    {formErrors['salary.max'] && <small className="field-error">{formErrors['salary.max']}</small>}
                  </div>
                </div>
                
                <div className="form-row">
                  <select name="jobType" value={jobForm.jobType} onChange={handleJobChange}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                  
                  <select name="experienceLevel" value={jobForm.experienceLevel} onChange={handleJobChange}>
                    <option value="fresher">Fresher</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="field-group">
                    <input 
                      name="members" 
                      type="number"
                      placeholder="Number of Positions" 
                      value={jobForm.members} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors.members}
                      required 
                    />
                    {formErrors.members && <small className="field-error">{formErrors.members}</small>}
                  </div>
                  <div className="field-group">
                    <input 
                      name="applicationDeadline" 
                      type="datetime-local"
                      placeholder="Application Deadline" 
                      value={jobForm.applicationDeadline} 
                      onChange={handleJobChange} 
                      aria-invalid={!!formErrors.applicationDeadline}
                      required 
                    />
                    {formErrors.applicationDeadline && <small className="field-error">{formErrors.applicationDeadline}</small>}
                  </div>
                </div>
                
                <div className="form-row">
                  <input 
                    name="contactEmail" 
                    type="email"
                    placeholder="Contact Email" 
                    value={jobForm.contactEmail} 
                    onChange={handleJobChange} 
                  />
                  <input 
                    name="website" 
                    type="url"
                    placeholder="Company Website" 
                    value={jobForm.website} 
                    onChange={handleJobChange} 
                  />
                </div>
                
                <button type="submit" className="submit-btn">Post Job</button>
              </form>
            </div>
          )}

          <EnhancedAdminDashboard user={user} />
        </>
      ) : user.role === 'student' ? (
        <StudentDashboard user={user} />
      ) : (
        <>
          <h2>💼 Job Opportunities</h2>
          
          <JobSearch 
            onSearchResults={handleSearchResults}
            onLoading={setLoading}
          />
          
          {loading && <div className="loading">Searching jobs...</div>}
          
          <div className="job-list">
            {jobs.length === 0 ? (
              <div className="no-jobs">
                <p>No jobs found matching your criteria.</p>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              jobs.map((job) => (
                            <JobCard
                              key={job._id}
                              job={job}
                              user={user}
                              onOptIn={handleOptIn}
                              onOptOut={handleOptOut}
                              optedJobs={optedJobs}
                              onApply={handleApply}
                            />
              ))
            )}
          </div>
          
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onPageChange={handlePageChange}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Jobs;


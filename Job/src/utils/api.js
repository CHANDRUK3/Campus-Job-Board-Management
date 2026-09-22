const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('accessToken');
};

// Get user data from localStorage
const getUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Set authentication data
const setAuthData = (user, tokens) => {

  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

// Clear authentication data
const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Refresh token function
const refreshToken = async () => {
  const refreshTokenValue = localStorage.getItem('refreshToken');
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update stored tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthData();
    throw error;
  }
};

// Make authenticated API request
const apiRequest = async (endpoint, options = {}) => {
  let token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`);
    console.log(`📋 Request config:`, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? (typeof config.body === 'string' ? JSON.parse(config.body) : config.body) : undefined
    });
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    // Handle 401 (Unauthorized) - try to refresh token
    if (response.status === 401) {
      try {
        // Try to refresh the token
        token = await refreshToken();
        
        // Retry the request with new token
        config.headers.Authorization = `Bearer ${token}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // If still 401 after refresh, redirect to login
        if (response.status === 401) {
          clearAuthData();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        clearAuthData();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    let data;
    try {
      data = await response.json();
      console.log(`📦 Response data:`, data);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      const textResponse = await response.text();
      console.log('📄 Raw response:', textResponse);
      throw new Error('Invalid response format from server');
    }
    
    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      console.error('❌ Error data:', data);
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      // Attach server-provided error payload so callers can render field errors
      error.data = data;
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
};

// API methods
export const authAPI = {
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.user && response.accessToken) {
      setAuthData(response.user, response);
    }
    
    return response;
  },

  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.user && response.accessToken) {
      setAuthData(response.user, response);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
};

export const drivesAPI = {
  getAll: async () => apiRequest('/drives'),
  getAllDrives: async () => apiRequest('/drives'),
  search: async (searchParams) => {
    const queryString = new URLSearchParams();
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] !== null && searchParams[key] !== undefined) {
        if (Array.isArray(searchParams[key])) {
          searchParams[key].forEach(item => queryString.append(key, item));
        } else {
          queryString.append(key, searchParams[key]);
        }
      }
    });
    return apiRequest(`/drives/search?${queryString.toString()}`);
  },
  getSuggestions: async (query) => apiRequest(`/drives/suggestions?q=${encodeURIComponent(query)}`),
  getFilterOptions: async () => apiRequest('/drives/filters'),
  create: async (jobData) => apiRequest('/drives/add', { method: 'POST', body: JSON.stringify(jobData) }),
  getByAdmin: async (adminEmail) => apiRequest(`/drives/${adminEmail}`),
};

export const driveAPI = drivesAPI;

// Legacy alias — routes still work via /api/companies backward compat
export const jobsAPI = drivesAPI;

export const profileAPI = {
  get: async (userId) => {
    return await apiRequest(`/profile/${userId}`);
  },
  getProfile: async (userId) => {
    return await apiRequest(`/profile/${userId}`);
  },

  update: async (userId, profileData) => {
    // Check if profileData contains a File object (resume)
    const hasFile = Object.values(profileData).some(value => value instanceof File);
    
    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });

      return await apiRequest(`/profile/${userId}`, {
        method: 'PUT',
        headers: {
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
      });
    } else {
      // Use JSON for regular updates
      return await apiRequest(`/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    }
  },
  updateProfile: async (userId, profileData) => {
    return await profileAPI.update(userId, profileData);
  },
};

export const applicationAPI = {
  getMyApplications: async (filters = {}) => {
    return await studentAPI.getApplications(filters);
  },
  getApplication: async (id) => {
    return await studentAPI.getApplication(id);
  },
  createApplication: async (jobId, applicationData = {}) => {
    return await studentAPI.createApplication(jobId, applicationData);
  },
  applyForDrive: async (driveId, applicationData = {}) => {
    return await studentAPI.createApplication(driveId, applicationData);
  },
  updateOfferStatus: async (applicationId, { action, note } = {}) => {
    return await studentAPI.respondToOffer(applicationId, action, note);
  },
};

export const notificationAPI = {
  getNotifications: async () => {
    const res = await apiRequest('/notifications');
    return res.data?.notifications || res.data || res;
  },
  markAsRead: async (id) => {
    return await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
  },
  markAllAsRead: async () => {
    return await apiRequest('/notifications/read-all', { method: 'PUT' });
  },
  deleteNotification: async (id) => {
    return await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  },
};

export const optStatusAPI = {
  set: async (optData) => {
    return await apiRequest('/optstatus/set', {
      method: 'POST',
      body: JSON.stringify(optData),
    });
  },

  getByStudent: async (studentEmail) => {
    return await apiRequest(`/optstatus/student/${studentEmail}`);
  },

  getByJob: async (jobId) => {
    return await apiRequest(`/optstatus/job/${jobId}`);
  },

  exportToExcel: async () => {
    const response = await fetch(`${API_BASE_URL}/optstatus/export/excel`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `opt_in_out_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },
};

// Export utility functions
export const adminAPI = {
  getAnalytics: async () => {
    return await apiRequest('/admin/analytics/dashboard');
  },

  generateReport: async (startDate, endDate) => {
    return await apiRequest('/admin/analytics/report', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  },

  sendBulkEmail: async (subject, message, filters = {}) => {
    return await apiRequest('/admin/bulk/send-email', {
      method: 'POST',
      body: JSON.stringify({ subject, message, filters }),
    });
  },

  bulkUpdateJobStatus: async (jobIds, status) => {
    return await apiRequest('/admin/bulk/update-job-status', {
      method: 'PUT',
      body: JSON.stringify({ jobIds, status }),
    });
  },

  bulkDeleteJobs: async (jobIds) => {
    return await apiRequest('/admin/bulk/delete-jobs', {
      method: 'DELETE',
      body: JSON.stringify({ jobIds }),
    });
  },

  exportJobs: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const url = `/admin/bulk/export-jobs${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `jobs_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  exportStudents: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const url = `/admin/bulk/export-students${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  downloadTemplate: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/bulk/template`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Template download failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'job_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  getSystemStats: async () => {
    return await apiRequest('/admin/system/stats');
  },

  getPendingProfiles: async () => apiRequest('/admin/students/pending'),

  verifyProfile: async (profileId, status, reason = '') =>
    apiRequest(`/admin/students/${profileId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),

  updateApplicationStage: async (applicationId, status, notes = '') =>
    apiRequest(`/admin/applications/${applicationId}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  scheduleApplication: async (applicationId, details) =>
    apiRequest(`/admin/applications/${applicationId}/details`, {
      method: 'PUT',
      body: JSON.stringify(details),
    }),
};

export const studentAPI = {
  getDashboard: async () => {
    return await apiRequest('/student/dashboard');
  },

  getApplications: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(`/student/applications${queryString ? `?${queryString}` : ''}`);
  },

  getApplication: async (applicationId) => {
    return await apiRequest(`/student/applications/${applicationId}`);
  },

  createApplication: async (jobId, applicationData = {}) => {
    return await apiRequest('/student/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, applicationData }),
    });
  },

  getUpcomingInterviews: async (days = 7) => {
    return await apiRequest(`/student/interviews/upcoming?days=${days}`);
  },

  submitFeedback: async (feedbackData) => {
    return await apiRequest('/student/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  getFeedback: async () => {
    return await apiRequest('/student/feedback');
  },

  getStats: async () => {
    return await apiRequest('/student/stats');
  },

  getTimeline: async () => {
    return await apiRequest('/student/timeline');
  },

  checkEligibility: async (driveId) => {
    return await apiRequest(`/student/eligibility/${driveId}`);
  },

  respondToOffer: async (applicationId, action, note = '') => {
    return await apiRequest(`/student/applications/${applicationId}/offer`, {
      method: 'PUT',
      body: JSON.stringify({ action, note }),
    });
  },
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// Validate current token
const validateToken = async () => {
  try {
    if (!isAuthenticated()) {
      return false;
    }
    
    await apiRequest('/auth/me');
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

export { getToken, getUser, setAuthData, clearAuthData, isAuthenticated, validateToken };

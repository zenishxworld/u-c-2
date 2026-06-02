import axios from 'axios';
import { getAccessToken } from '../utils/tokenStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── In-memory caches (session-scoped) ───────────────────────────────────────
// Each cache maps id → Promise<result> so concurrent calls for the same ID
// share a single in-flight network request instead of firing N duplicates.
const _appCache = new Map();
const _courseCache = new Map();
const _universityCache = new Map();
const _workflowCache = new Map();

/** Clear all caches – call after mutating actions (claim / complete) */
export const clearDashboardCache = (applicationId) => {
  if (applicationId) {
    _appCache.delete(applicationId);
    _workflowCache.delete(applicationId);
  } else {
    _appCache.clear();
    _courseCache.clear();
    _universityCache.clear();
    _workflowCache.clear();
  }
};
// ─────────────────────────────────────────────────────────────────────────────

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get workflow configuration - defines all stages, task types, statuses, and rules
 * @returns {Promise<Object>} Returns workflow configuration
 */


/**
 * Get all tasks assigned to the current admin
 * @returns {Promise<Object>} Returns all tasks
 */
export const getAllTasks = async (queryString = '') => {
  try {
    const url = queryString 
      ? `/api/v1/admin/tasks?${queryString}`
      : '/api/v1/admin/tasks';
    
    const response = await api.get(url);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data || [],
        totalCount: response.data.totalCount || 0
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch tasks'
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch tasks',
      error
    };
  }
};

/**
 * Get my tasks (assigned to current user)
 * @returns {Promise<Object>} Returns my tasks
 */
export const getMyTasks = async (queryString = '') => {
  return getAllTasks(queryString);
};

/**
 * Get task filters
 * @param {string} queryString - Optional query string (e.g., 'stages=APPLICATION_REVIEW&active=false')
 * @returns {Promise<Object>} Returns available filters
 */
export const getTaskFilters = async (queryString = '') => {
  try {
    const url = queryString 
      ? `/api/v1/admin/tasks/filters?${queryString}`
      : '/api/v1/admin/tasks/filters';
    
    const response = await api.get(url);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data || []
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch task filters'
    };
  } catch (error) {
    console.error('Error fetching task filters:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch task filters',
      error
    };
  }
};

/**
 * Get detailed information about a specific task
 * @param {string} taskId - The task ID
 * @returns {Promise<Object>} Returns the task details
 */
export const getTaskDetails = async (taskId) => {
  try {
    const response = await api.get(`/api/v1/admin/tasks/${taskId}/details`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data?.[0] || response.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch task details'
    };
  } catch (error) {
    console.error('Error fetching task details:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch task details',
      error
    };
  }
};

/**
 * Claim a specific task/application
 * @param {string} taskId - The task ID to claim
 * @returns {Promise<Object>} Returns the claim result
 */
export const claimTask = async (taskId) => {
  try {
    console.log('Attempting to claim task:', taskId);
    
    const response = await api.post(`/api/v1/admin/tasks/${taskId}/claim`, {});
    
    console.log('Claim response:', response);
    
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Task claimed successfully'
      };
    }
    
    return {
      success: false,
      message: response.data?.message || 'Failed to claim task'
    };
  } catch (error) {
    console.error('Error claiming task:', taskId);
    console.error('Full error object:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    const apiErrorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.response?.data?.details ||
                           'Failed to claim task';
    
    return {
      success: false,
      message: apiErrorMessage,
      error,
      details: error.response?.data
    };
  }
};

/**
 * Get workflow progress for an application
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} Returns the workflow progress
 */
export const getWorkflowProgress = async (applicationId, { bustCache = false } = {}) => {
  if (!bustCache && _workflowCache.has(applicationId)) return _workflowCache.get(applicationId);

  const pending = api.get(`/api/v1/admin/workflow/progress/${applicationId}`)
    .then(response => {
      if (response.status === 200) return { success: true, data: response.data.data };
      return { success: false, message: 'Failed to fetch workflow progress' };
    })
    .catch(error => {
      _workflowCache.delete(applicationId);
      console.error('Error fetching workflow progress:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to fetch workflow progress', error };
    });

  _workflowCache.set(applicationId, pending);
  return pending;
};

/**
 * Complete a task
 * @param {string} taskId - The task ID to complete
 * @param {Object} payload - Completion data
 * @returns {Promise<Object>} Returns the completion result
 */
export const completeTask = async (taskId, payload) => {
  try {
    console.log('📝 Completing task API call:', taskId);
    console.log('📝 Payload being sent:', JSON.stringify(payload, null, 2));
    
    const response = await api.post(`/api/v1/admin/tasks/${taskId}/complete`, payload);
    
    console.log('📝 Complete task response:', response);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Task completed successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to complete task'
    };
  } catch (error) {
    console.error('❌ Error completing task:', error);
    console.error('❌ Response data:', error.response?.data);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to complete task',
      error
    };
  }
};

/**
 * Set flags for an application
 * @param {string} applicationId - The application ID
 * @param {Object} payload - Flags data
 * @returns {Promise<Object>} Returns the result
 */
export const setApplicationFlags = async (applicationId, payload) => {
  try {
    const response = await api.put(`/api/v1/admin/applications/${applicationId}/flags`, payload);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Flags updated successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to update flags'
    };
  } catch (error) {
    console.error('Error updating flags:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update flags',
      error
    };
  }
};

/**
 * Get flags for an application
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} Returns the flags
 */
export const getApplicationFlags = async (applicationId) => {
  try {
    const response = await api.get(`/api/v1/admin/applications/${applicationId}/flags`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch flags'
    };
  } catch (error) {
    console.error('Error fetching flags:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch flags',
      error
    };
  }
};

/**
 * Get application details from students API
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} Returns the application details
 */
export const getApplicationDetails = async (applicationId) => {
  try {
    const response = await api.get(`/api/v1/students/applications/${applicationId}`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch application details'
    };
  } catch (error) {
    console.error('Error fetching application details:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch application details',
      error
    };
  }
};

/**
 * Get all applications from students API
 * @returns {Promise<Object>} Returns all applications
 */
export const getAllApplications = async () => {
  try {
    const response = await api.get('/api/v1/students/applications');
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data.applications || [],
        summary: response.data.data.summary,
        pagination: response.data.data.pagination
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch applications'
    };
  } catch (error) {
    console.error('Error fetching applications:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch applications',
      error
    };
  }
};

/**
 * Get student profile details
 * @returns {Promise<Object>} Returns student profile
 */
export const getStudentProfile = async () => {
  try {
    const response = await api.get('/api/v1/students/profile');
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch student profile'
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch student profile',
      error
    };
  }
};

/**
 * Get student profile for admin
 * @param {string|number} userId
 * @returns {Promise<Object>} Returns student profile
 */
export const getStudentProfileForAdmin = async (userId) => {
  try {
    const response = await api.get(`/api/v1/admin/students/${userId}/profile`);
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data || response.data
      };
    }
    return {
      success: false,
      message: 'Failed to fetch student profile'
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch student profile',
      error
    };
  }
};

/**
 * Get specific application by ID from students API
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} Returns the application details
 */
export const getApplication = async (applicationId) => {
  if (_appCache.has(applicationId)) return _appCache.get(applicationId);

  const pending = api.get(`/api/v1/applications/${applicationId}`)
    .then(response => {
      if (response.status === 200) return { success: true, data: response.data.data };
      return { success: false, message: 'Failed to fetch application' };
    })
    .catch(error => {
      _appCache.delete(applicationId); // evict on error so it can be retried
      console.error('Error fetching application:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to fetch application', error };
    });

  _appCache.set(applicationId, pending);
  return pending;
};

/**
 * Get application with student details (admin endpoint)
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} Returns application with student details
 */
export const getApplicationWithStudentDetails = async (applicationId) => {
  try {
    const response = await api.get(`/api/v1/admin/applications/${applicationId}`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch application with student details'
    };
  } catch (error) {
    console.error('Error fetching application with student details:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch application details',
      error
    };
  }
};

export const getCourse = async (courseId) => {
  if (_courseCache.has(courseId)) return _courseCache.get(courseId);

  const pending = api.get(`/api/v1/courses/${courseId}`)
    .then(r => r.data.data)
    .catch(e => {
      _courseCache.delete(courseId);
      console.error('Error fetching course:', e);
      return null;
    });

  _courseCache.set(courseId, pending);
  return pending;
};

export const getUniversity = async (universityId) => {
  if (_universityCache.has(universityId)) return _universityCache.get(universityId);

  const pending = api.get(`/api/v1/universities/${universityId}`)
    .then(r => r.data.data)
    .catch(e => {
      _universityCache.delete(universityId);
      console.error('Error fetching university:', e);
      return null;
    });

  _universityCache.set(universityId, pending);
  return pending;
};

export const getTaskRequirements = async (taskId) => {
  try {
    const response = await api.get(`/api/v1/admin/tasks/${taskId}/requirements`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch task requirements'
    };
  } catch (error) {
    console.error('Error fetching task requirements:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch task requirements',
      error
    };
  }
};

export const getAllUniversities = async () => {
  try {
    const response = await api.get('/api/v1/universities');
    
    if (response.status === 200) {
      // Extract the actual data array from nested structure
      const universities = response.data.data?.data || response.data.data || [];
      return {
        success: true,
        data: universities
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch universities'
    };
  } catch (error) {
    console.error('Error fetching universities:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch universities',
      error
    };
  }
};

export default {
  getAllTasks,
  getMyTasks,
  getTaskFilters,
  getTaskDetails,
  claimTask,
  getWorkflowProgress,
  completeTask,
  setApplicationFlags,
  getApplicationFlags,
  getApplicationDetails,
  getAllApplications,
  getStudentProfile,
  getStudentProfileForAdmin,
  getApplicationWithStudentDetails,
  getApplication,
  getUniversity,
  getCourse,
  getTaskRequirements,
  getAllUniversities,
  clearDashboardCache
};
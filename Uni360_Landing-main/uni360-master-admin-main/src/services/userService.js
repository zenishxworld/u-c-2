import api from './api';
import { validateToken } from './authService.js';

/**
 * Get all users with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.userType - Filter by user type (STUDENT, ADMIN, SUPER_ADMIN)
 * @param {string} params.status - Filter by status (ACTIVE, INACTIVE, SUSPENDED)
 * @param {string} params.search - Search by name or email
 * @param {number} params.page - Page number (0-indexed)
 * @param {number} params.size - Page size
 * @returns {Promise<Object>} Users data with pagination and summary
 */
export const getAllUsers = async (params = {}) => {
  try {
    // Validate token before making request
    const isValid = validateToken();
    if (!isValid) {
      return {
        success: false,
        error: 'Authentication required. Please login again.'
      };
    }
    
    const queryParams = new URLSearchParams();
    
    // Add filters if provided
    if (params.userType) queryParams.append('userType', params.userType);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.size !== undefined) queryParams.append('size', params.size);
    
    const queryString = queryParams.toString();
    const url = `/api/v1/superadmin/dashboard/users${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    // Handle the nested response structure
    if (response.data?.success && response.data?.data) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    // Fallback for direct data structure
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    let errorMessage = 'Failed to fetch users. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (status === 403) {
        errorMessage = 'You don\'t have permission to view users.';
      } else {
        errorMessage = data?.message || 
                      data?.error || 
                      data?.data?.message ||
                      `Server error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User details
 */
export const getUserById = async (userId) => {
  try {
    // Validate token
    const isValid = await validateToken();
    if (!isValid) {
      return {
        success: false,
        error: 'Authentication required. Please login again.'
      };
    }
    
    const response = await api.get(`/api/v1/superadmin/users/${userId}`);
    // Handle nested response
    if (response.data?.success && response.data?.data) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    let errorMessage = 'Failed to fetch user details. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (status === 403) {
        errorMessage = 'You don\'t have permission to view this user.';
      } else if (status === 404) {
        errorMessage = 'User not found.';
      } else {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    // Validate token
    const isValid = await validateToken();
    if (!isValid) {
      return {
        success: false,
        error: 'Authentication required. Please login again.'
      };
    }
    
    const response = await api.post('/api/v1/superadmin/users', userData);
    // Handle nested response
    if (response.data?.success && response.data?.data) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    let errorMessage = 'Failed to create user. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (status === 403) {
        errorMessage = 'You don\'t have permission to create users.';
      } else if (status === 400) {
        errorMessage = data?.message || 'Invalid user data provided.';
      } else if (status === 409) {
        errorMessage = 'User with this email or username already exists.';
      } else {
        errorMessage = data?.message || 
                      data?.error || 
                      `Server error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Update user
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    // Validate token
    const isValid = await validateToken();
    if (!isValid) {
      return {
        success: false,
        error: 'Authentication required. Please login again.'
      };
    }
    
    const response = await api.put(`/api/v1/superadmin/users/${userId}`, userData);
    // Handle nested response
    if (response.data?.success && response.data?.data) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    let errorMessage = 'Failed to update user. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (status === 403) {
        errorMessage = 'You don\'t have permission to update this user.';
      } else if (status === 404) {
        errorMessage = 'User not found.';
      } else if (status === 400) {
        errorMessage = data?.message || 'Invalid user data provided.';
      } else {
        errorMessage = data?.message || 
                      data?.error || 
                      `Server error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Delete user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export const deleteUser = async (userId) => {
  try {
    // Validate token
    const isValid = await validateToken();
    if (!isValid) {
      return {
        success: false,
        error: 'Authentication required. Please login again.'
      };
    }
    
    const response = await api.delete(`/api/v1/superadmin/users/${userId}`);
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    let errorMessage = 'Failed to delete user. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (status === 403) {
        errorMessage = 'You don\'t have permission to delete this user.';
      } else if (status === 404) {
        errorMessage = 'User not found.';
      } else {
        errorMessage = data?.message || 
                      data?.error || 
                      `Server error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get student full profile
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Full student profile
 */
export const getStudentProfile = async (userId) => {
  try {
    const response = await api.get(`/api/v1/superadmin/dashboard/users/${userId}/profile`);
    if (response.data?.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Failed to fetch student profile.'
    };
  }
};

export default {
  getAllUsers,
  getUserById,
  getStudentProfile,
  createUser,
  updateUser,
  deleteUser
};


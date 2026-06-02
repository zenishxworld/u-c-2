import axios from 'axios';

// Create dedicated auth axios instance (without interceptors to avoid circular dependencies)
const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-ID': import.meta.env.VITE_CLIENT_ID || 'uniflow'
  }
});

/**
 * Login with username/email and password
 * @param {string} usernameOrEmail - Username or email
 * @param {string} password - Password
 * @returns {Promise<Object>} User data and token
 */
export const login = async (usernameOrEmail, password) => {
  try {
    const response = await authApi.post('/api/v1/auth/login', {
      usernameOrEmail,
      password
    });
    // Extract data from the nested structure
    const { data: responseData } = response.data;
    
    if (!responseData) {
      throw new Error('Invalid response structure from server');
    }

    // PRIMARY: Store access token (this is what api.js looks for)
    if (responseData.accessToken) {
      localStorage.setItem('uni360_access_token', responseData.accessToken);
    } else {
      throw new Error('No access token received from server');
    }

    // Store refresh token
    if (responseData.refreshToken) {
      localStorage.setItem('uni360_refresh_token', responseData.refreshToken);
    }

    // Store user data
    const userData = {
      id: responseData.userId,
      username: responseData.username,
      email: responseData.email,
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      fullName: responseData.fullName,
      userType: responseData.userType,
      status: responseData.status,
      roles: responseData.roles || [],
      permissions: responseData.permissions || [],
      clientType: responseData.clientType,
      timezone: responseData.timezone,
      language: responseData.language,
      emailVerified: responseData.emailVerified,
      phoneVerified: responseData.phoneVerified,
      isFirstLogin: responseData.isFirstLogin,
      loginAt: responseData.loginAt
    };

    localStorage.setItem('uni360_user', JSON.stringify(userData));
    // Store token expiry info
    if (responseData.expiresAt) {
      localStorage.setItem('uni360_token_expiry', responseData.expiresAt);
    }
    return {
      success: true,
      data: {
        user: userData,
        token: responseData.accessToken,
        refreshToken: responseData.refreshToken,
        expiresAt: responseData.expiresAt,
        expiresIn: responseData.expiresIn
      }
    };
  } catch (error) {
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || 
                    error.response.data?.error || 
                    error.response.data?.data?.message ||
                    `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else {
      // Error in request setup
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Logout - clear local storage and invalidate session
 */
export const logout = async () => {
  // Optional: Call logout API endpoint if available
  try {
    const token = localStorage.getItem('uni360_access_token');
    if (token) {
      await authApi.post('/api/v1/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
  }
  
  // Clear all auth-related items
  localStorage.removeItem('uni360_access_token');
  localStorage.removeItem('uni360_refresh_token');
  localStorage.removeItem('uni360_user');
  localStorage.removeItem('uni360_token_expiry');
  
  // Clear legacy items
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('uni360_user');
    if (!userStr) {
      return null;
    }
    
    const user = JSON.parse(userStr);
    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Get current token from localStorage
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  const token = localStorage.getItem('uni360_access_token');
  
  if (token) {
    // Check if token is expired
    const expiry = localStorage.getItem('uni360_token_expiry');
    if (expiry) {
      const expiryDate = new Date(expiry);
      const now = new Date();
      
      if (now >= expiryDate) {
        return null;
      }
      
      const timeLeft = Math.floor((expiryDate - now) / 1000 / 60); // minutes
    }
    
    return token;
  }
  return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  const authenticated = !!(token && user);
  return authenticated;
};

/**
 * Refresh token (if your API supports it)
 * @returns {Promise<Object>} New token data
 */
export const refreshToken = async () => {
  try {
    const currentRefreshToken = localStorage.getItem('uni360_refresh_token');
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.post('/api/v1/auth/refresh', {
      refreshToken: currentRefreshToken
    });

    const { data: responseData } = response.data;
    
    if (!responseData || !responseData.accessToken) {
      throw new Error('Invalid refresh response from server');
    }
    
    // Update access token
    localStorage.setItem('uni360_access_token', responseData.accessToken);
    // Update refresh token if provided
    if (responseData.refreshToken) {
      localStorage.setItem('uni360_refresh_token', responseData.refreshToken);
    }

    // Update expiry
    if (responseData.expiresAt) {
      localStorage.setItem('uni360_token_expiry', responseData.expiresAt);
    }
    return {
      success: true,
      data: {
        token: responseData.accessToken,
        refreshToken: responseData.refreshToken,
        expiresAt: responseData.expiresAt
      }
    };
  } catch (error) {
    // If refresh fails, logout user
    await logout();
    throw error;
  }
};

/**
 * Validate token before making API calls
 * @returns {Promise<boolean>} True if token is valid
 */
export const validateToken = async () => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }

    // Check expiry
    const expiry = localStorage.getItem('uni360_token_expiry');
    if (expiry) {
      const expiryDate = new Date(expiry);
      const now = new Date();
      
      // If token expires in less than 5 minutes, refresh it
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
      
      if (expiryDate <= fiveMinutesFromNow) {
        await refreshToken();
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  refreshToken,
  validateToken
};
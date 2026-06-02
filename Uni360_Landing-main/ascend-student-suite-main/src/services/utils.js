// utils.js (Updated: No changes needed beyond what's already there, as it supports all required storage. Minor addition: Optional expiresIn handling via comment for future if needed.)
const ACCESS_TOKEN_KEY = 'uni360_access_token';
const REFRESH_TOKEN_KEY = 'uni360_refresh_token';
const USER_KEY = 'uni360_user';

/**
 * Store access token in localStorage
 * @param {string} token - JWT access token
 */
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

/**
 * Store refresh token in localStorage
 * @param {string} token - JWT refresh token
 */
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

/**
 * Store both tokens
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Get access token from localStorage
 * @returns {string|null} - JWT access token or null
 */
export const getToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get access token from localStorage (alias for getToken)
 * @returns {string|null} - JWT access token or null
 */
export const getAccessToken = () => {
  return getToken();
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} - JWT refresh token or null
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Remove access token from localStorage
 */
export const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Remove refresh token from localStorage
 */
export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Remove all tokens from localStorage
 */
export const removeTokens = () => {
  removeAccessToken();
  removeRefreshToken();
};

/**
 * Store user data in localStorage
 * @param {Object} user - User object
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get user data from localStorage
 * @returns {Object|null} - User object or null
 */
export const getUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  removeTokens();
  removeUser();
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} - True if token exists
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token && !isTokenExpired(token);
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Handle API errors consistently
 * @param {Error|Object} error - Error object or response
 * @returns {Error} - Formatted error
 */
export const handleApiError = (error) => {
  // If it's already an Error object, return as is
  if (error instanceof Error) {
    return error;
  }

  // If it's a response object with error details
  if (error && typeof error === 'object') {
    const message = error.message || 
                   error.detail || 
                   error.error || 
                   'An error occurred';
    return new Error(message);
  }

  // Default error message
  return new Error('An unexpected error occurred');
};

/**
 * Create authorization header for API requests
 * @returns {Object} - Authorization header object
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Create common headers for API requests
 * @returns {Object} - Common headers object
 */
export const getCommonHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...getAuthHeaders(),
  };
};

/**
 * Format user name from first and last name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Formatted full name
 */
export const formatUserName = (firstName, lastName) => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  return [first, last].filter(Boolean).join(' ') || 'User';
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate username from email
 * @param {string} email - Email address
 * @returns {string} - Generated username
 */
export const generateUsernameFromEmail = (email) => {
  if (!email) return '';
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Debounce function for API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Sleep function for testing/delays
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a unique UUID for users
 * @param {string} email - User email
 * @param {string} id - User database ID
 * @returns {string} - Generated UUID in format ST2025-XXXXXX
 */
export const generateUserUUID = (email, id) => {
  const year = new Date().getFullYear();
  const emailHash = email ? email.split('@')[0].substring(0, 3).toUpperCase() : 'USR';
  const idPart = id ? id.toString().padStart(6, '0').slice(-6) : Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ST${year}-${emailHash}${idPart}`;
};

/**
 * Get or generate UUID for user
 * @param {Object} user - User object
 * @returns {string} - User UUID
 */
export const getUserUUID = (user) => {
  if (user?.uuid) {
    return user.uuid;
  }
  
  // Check localStorage for stored UUID
  const storedUUID = localStorage.getItem(`uuid_${user?.id}`);
  if (storedUUID) {
    return storedUUID;
  }
  
  // Generate new UUID
  const newUUID = generateUserUUID(user?.email, user?.id);
  if (user?.id) {
    localStorage.setItem(`uuid_${user.id}`, newUUID);
  }
  return newUUID;
};
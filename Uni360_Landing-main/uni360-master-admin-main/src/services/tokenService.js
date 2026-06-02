/**
 * Centralized Token Service
 * Fetches and manages the backend access_token dynamically
 * All API requests should use this service to get the current token
 */

// Configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const STATIC_ACCESS_TOKEN = import.meta.env.VITE_STATIC_ACCESS_TOKEN || null;
const USE_STATIC_TOKEN = import.meta.env.VITE_USE_STATIC_TOKEN === 'true';
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache for the token
let cachedToken = STATIC_ACCESS_TOKEN; // Initialize with static token if available
let tokenFetchPromise = null;
let lastFetchTime = 0;

/**
 * Fetch access token from backend
 * This should be the endpoint your backend provides to get the access_token
 */
const fetchTokenFromBackend = async () => {
  try {
    // Option 1: Use static token from config if configured
    if (USE_STATIC_TOKEN && STATIC_ACCESS_TOKEN) {
      return STATIC_ACCESS_TOKEN;
    }
    
    // Option 2: Check environment variable for static token
    const envToken = import.meta.env.VITE_STATIC_ACCESS_TOKEN;
    if (envToken) {
      return envToken;
    }
    
    // Option 3: Use user login token (most common case)
    const userToken = localStorage.getItem('uni360_access_token') || 
                      localStorage.getItem('token');
    if (userToken) {
      return userToken;
    }
    
    // Option 4: Try to fetch from backend config endpoint
    const response = await fetch(`${BASE_URL}/api/v1/config/access-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': 'uniflow',
        'ngrok-skip-browser-warning': 'true',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token from config endpoint: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Adjust based on your backend response structure
    const token = data.access_token || data.token || data.data?.access_token || data.data?.token;
    
    if (!token) {
      throw new Error('Token not found in backend response');
    }
    return token;
  } catch (error) {
    // Final fallback: Try user login token one more time
    const userToken = localStorage.getItem('uni360_access_token') || 
                      localStorage.getItem('token');
    if (userToken) {
      return userToken;
    }
    
    throw new Error('No access token available. Please log in or configure VITE_STATIC_ACCESS_TOKEN.');
  }
};

/**
 * Get the current access token
 * Fetches from backend if not cached or cache expired
 * @returns {Promise<string>} - The access token
 */
export const getAccessToken = async () => {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedToken && (now - lastFetchTime) < TOKEN_CACHE_DURATION) {
    return cachedToken;
  }
  
  // If a fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }
  
  // Fetch new token
  tokenFetchPromise = fetchTokenFromBackend()
    .then(token => {
      cachedToken = token;
      lastFetchTime = now;
      tokenFetchPromise = null;
      return token;
    })
    .catch(error => {
      tokenFetchPromise = null;
      throw error;
    });
  
  return tokenFetchPromise;
};

/**
 * Force refresh the token from backend
 * Call this if you know the token changed on backend
 */
export const refreshToken = async () => {
  cachedToken = null;
  lastFetchTime = 0;
  tokenFetchPromise = null;
  return getAccessToken();
};

/**
 * Clear the cached token
 * Call this on logout
 */
export const clearToken = () => {
  cachedToken = null;
  lastFetchTime = 0;
  tokenFetchPromise = null;
};

/**
 * Set user login token
 * Call this after successful login
 * @param {string} token - The access token from login
 */
export const setUserToken = (token) => {
  if (token) {
    localStorage.setItem('uni360_access_token', token);
    localStorage.setItem('token', token); // Backward compatibility
    // Update cache
    cachedToken = token;
    lastFetchTime = Date.now();
  }
};

/**
 * Get auth headers with the current token
 * Use this helper in all API requests
 * @returns {Promise<Object>} - Headers object with Authorization
 */
export const getAuthHeaders = async () => {
  const token = await getAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'X-Client-ID': 'uniflow',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
};

/**
 * Make an authenticated API request
 * Helper function that automatically includes auth headers
 * @param {string} endpoint - API endpoint (e.g., '/api/v1/students/profile')
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Object>} - Response data
 */
export const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const headers = await getAuthHeaders();
    
    // Determine if body is FormData
    const isFormData = options.body instanceof FormData;
    
    // Build final headers - don't set Content-Type for FormData
    const finalHeaders = isFormData 
      ? {
          'Authorization': headers.Authorization,
          'X-Client-ID': headers['X-Client-ID'],
          'ngrok-skip-browser-warning': headers['ngrok-skip-browser-warning'],
          ...options.headers,
        }
      : {
          ...headers,
          ...options.headers,
        };
    
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    // Stringify body if it's an object (but not FormData)
    let processedBody = options.body;
    if (options.body && typeof options.body === 'object' && !isFormData) {
      processedBody = JSON.stringify(options.body);
    } else if (options.body) {
    }
const response = await fetch(url, {
      ...options,
      method: options.method || 'GET',
      headers: finalHeaders,
      body: processedBody,
    });
    
    // Handle 401 - token might be expired/invalid
    if (response.status === 401) {
      // Try refreshing token once
      await refreshToken();
      
      // Retry request with new token
      const newHeaders = await getAuthHeaders();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...newHeaders,
          ...options.headers,
        },
        body: processedBody,
      });
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new Error(`HTTP ${retryResponse.status}: ${errorText}`);
      }
      
      return await retryResponse.json();
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    throw error;
  }
};

// Export default object with all methods
export default {
  getAccessToken,
  refreshToken,
  clearToken,
  setUserToken,
  getAuthHeaders,
  makeAuthenticatedRequest,
};

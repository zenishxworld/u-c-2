/**
 * Centralized Token Service
 * Fetches and manages the backend access_token dynamically
 * All API requests should use this service to get the current token
 */

import { STATIC_ACCESS_TOKEN, USE_STATIC_TOKEN, TOKEN_CACHE_DURATION } from '../config/auth.config.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://34.230.50.74:8080';

// In-memory cache for the token
let cachedToken = STATIC_ACCESS_TOKEN; // Initialize with static token if available
let tokenFetchPromise = null;
let lastFetchTime = 0;

/**
 * Fetch access token from backend
 * This should be the endpoint your backend provides to get the access_token
 * ADJUST THIS ENDPOINT based on your backend API
 */
const fetchTokenFromBackend = async () => {
  try {
    console.log('[TokenService] Fetching access_token from backend...');
    
    // Option 1: Use static token from config if configured
    if (USE_STATIC_TOKEN && STATIC_ACCESS_TOKEN) {
      console.log('[TokenService] Using configured static token');
      return STATIC_ACCESS_TOKEN;
    }
    
    // Option 2: Check environment variable for static token
    const envToken = import.meta.env.VITE_STATIC_ACCESS_TOKEN;
    if (envToken) {
      console.log('[TokenService] Using static token from environment');
      return envToken;
    }
    
    // Option 3: Use user login token (most common case)
    const userToken = localStorage.getItem('uni360_access_token');
    if (userToken) {
      console.log('[TokenService] Using user login token');
      return userToken;
    }
    
    // Option 4: Try to fetch from backend config endpoint
    console.log('[TokenService] Attempting to fetch token from backend config endpoint...');
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
    
    console.log('[TokenService] ✅ Token fetched from backend config');
    return token;
  } catch (error) {
    console.error('[TokenService] ❌ Error fetching token:', error);
    
    // Final fallback: Try user login token one more time
    const userToken = localStorage.getItem('uni360_access_token');
    if (userToken) {
      console.log('[TokenService] Using final fallback: user login token');
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
    console.log('[TokenService] Using cached token');
    return cachedToken;
  }
  
  // If a fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    console.log('[TokenService] Waiting for ongoing token fetch...');
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
  console.log('[TokenService] Force refreshing token...');
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
  console.log('[TokenService] Clearing token cache');
  cachedToken = null;
  lastFetchTime = 0;
  tokenFetchPromise = null;
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
    
    // Merge provided headers with auth headers
    const finalHeaders = {
      ...headers,
      ...options.headers,
    };
    
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    console.log(`[TokenService] Making authenticated request to: ${url}`);
    console.log(`[TokenService] Method: ${options.method || 'GET'}`);
    
    // CRITICAL FIX: Stringify body if it's an object
    let processedBody = options.body;
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      processedBody = JSON.stringify(options.body);
      console.log(`[TokenService] Body (stringified):`, processedBody);
    } else {
      console.log(`[TokenService] Body:`, options.body);
    }
    
    console.log(`[TokenService] Headers:`, finalHeaders);
    
    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
      body: processedBody,
    });
    
    // Handle 401 - token might be expired/invalid
    if (response.status === 401) {
      console.warn('[TokenService] 401 Unauthorized - Refreshing token...');
      
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
    console.error(`[TokenService] Request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Export default object with all methods
export default {
  getAccessToken,
  refreshToken,
  clearToken,
  getAuthHeaders,
  makeAuthenticatedRequest,
};

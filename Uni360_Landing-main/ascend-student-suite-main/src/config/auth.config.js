/**
 * Authentication Configuration
 * 
 * If your backend has a STATIC access_token configured,
 * you can set it here to use it across the entire application
 */

// Option 1: Set static token from environment variable
export const STATIC_ACCESS_TOKEN = import.meta.env.VITE_STATIC_ACCESS_TOKEN || null;

// Option 2: Set static token directly (NOT RECOMMENDED for production)
// export const STATIC_ACCESS_TOKEN = 'your-static-token-here';

// Option 3: Fetch token from a config endpoint
export const TOKEN_CONFIG_ENDPOINT = '/api/v1/config/access-token';

// Token caching configuration
export const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Whether to use static token or user login token
export const USE_STATIC_TOKEN = false; // Set to true if backend uses static token

export default {
  STATIC_ACCESS_TOKEN,
  TOKEN_CONFIG_ENDPOINT,
  TOKEN_CACHE_DURATION,
  USE_STATIC_TOKEN,
};

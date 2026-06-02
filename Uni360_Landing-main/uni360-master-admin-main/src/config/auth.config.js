// Authentication Configuration

// Static access token (if you want to use a hardcoded token for development)
export const STATIC_ACCESS_TOKEN = import.meta.env.VITE_STATIC_ACCESS_TOKEN || null;

// Whether to use static token or dynamic token from login
export const USE_STATIC_TOKEN = import.meta.env.VITE_USE_STATIC_TOKEN === 'true';

// Token cache duration (5 minutes)
export const TOKEN_CACHE_DURATION = 5 * 60 * 1000;

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'uniflow';

export default {
  STATIC_ACCESS_TOKEN,
  USE_STATIC_TOKEN,
  TOKEN_CACHE_DURATION,
  API_BASE_URL,
  CLIENT_ID,
};
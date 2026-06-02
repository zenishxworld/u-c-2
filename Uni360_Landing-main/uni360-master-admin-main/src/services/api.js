import axios from "axios";
// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
    "X-Client-ID": import.meta.env.VITE_CLIENT_ID || "uniflow"
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("uni360_access_token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we have a refresh token
      const refreshToken = localStorage.getItem("uni360_refresh_token");
      
      if (refreshToken && !originalRequest._isRefreshRequest) {
        originalRequest._retry = true;
        
        try {
          // Import authService dynamically to avoid circular dependency
          const { refreshToken: refreshTokenFunc } = await import('./authService');
          const result = await refreshTokenFunc();
          
          if (result.success) {
            // Update the authorization header with new token
            originalRequest.headers.Authorization = `Bearer ${result.data.token}`;
            
            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Fall through to logout
        }
      }
      
      // If we get here, token refresh failed or no refresh token available
      // Clear all auth data
      localStorage.removeItem("uni360_access_token");
      localStorage.removeItem("uni360_refresh_token");
      localStorage.removeItem("uni360_user");
      localStorage.removeItem("uni360_token_expiry");
      
      // Redirect to login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to check if token exists and is valid
export const hasValidToken = () => {
  const token = localStorage.getItem("uni360_access_token");
  
  if (!token) {
    return false;
  }
  
  // Check expiry
  const expiry = localStorage.getItem("uni360_token_expiry");
  if (expiry) {
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    if (now >= expiryDate) {
      return false;
    }
  }
  return true;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("uni360_access_token");
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Client-ID": import.meta.env.VITE_CLIENT_ID || "uniflow"
  };
};

// ─── Leads / Contacts API (Superadmin) ───────────────────────────────────────
export const leadsAPI = {
  /**
   * Get all contact form submissions.
   * GET /api/v1/superadmin/contacts
   * @param {string} token – Bearer token
   */
  getContacts: async (token) => {
    try {
      const response = await apiRequest('/superadmin/contacts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // apiRequest unwraps .data already — response is the array
      return Array.isArray(response) ? response : (response?.data ?? []);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update the status of a contact submission.
   * PATCH /api/v1/superadmin/contacts/:id/status
   * @param {string} id     – contact UUID
   * @param {string} status – NEW | IN_PROGRESS | RESOLVED | CLOSED
   * @param {string} token  – Bearer token
   */
  updateStatus: async (id, status, token) => {
    try {
      const response = await apiRequest(`/superadmin/contacts/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};
export default api;
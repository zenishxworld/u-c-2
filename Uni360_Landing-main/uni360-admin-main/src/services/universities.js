import { getAccessToken, saveTokens, clearTokens, saveUser, getUser } from '../utils/tokenStore'; // ✅ Fixed path

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;


// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;


  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if present
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`Making ${options.method || 'GET'} request to:`, url);

  try {
    const response = await fetch(url, config);
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorDetails = await response.json();
          errorMessage = errorDetails.message || errorDetails.error || errorMessage;
        }
      } catch (parseError) {
        console.log('Could not parse error response');
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const responseText = await response.text();
    
    if (!responseText) {
      return { success: true, data: [] };
    }

    try {
      const jsonResponse = JSON.parse(responseText);
      // Return the data field from the API response
      return jsonResponse.data || jsonResponse;
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    
    if (error.status === 401) {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
    }
    
    throw error;
  }
};

// University API endpoints
export const universityAPI = {
  // Get all universities with optional filters + server-side pagination.
  // Produces URLs like:
  //   /universities?page=0&size=20&country=GB
  //   /universities?page=1&size=20
  //   /universities?page=0&size=50&search=Oxford
  // Returns the FULL response so callers can read totalCount for pagination.
  getUniversities: async (params = {}) => {
    const queryString = new URLSearchParams();

    // Pagination - always send page + size
    queryString.append('page', params.page ?? 0);
    queryString.append('size', params.size ?? 20);

    // Sorting
    if (params.sort_by) queryString.append('sort_by', params.sort_by);
    if (params.sort_direction) queryString.append('sort_direction', params.sort_direction);

    // Filters
    if (params.active !== undefined) queryString.append('active', params.active);
    if (params.country && params.country !== 'all') queryString.append('country', params.country);
    if (params.city && params.city !== 'all') queryString.append('city', params.city);
    if (params.state && params.state !== 'all') queryString.append('state', params.state);
    if (params.type && params.type !== 'all') queryString.append('type', params.type);
    if (params.degreeLevel && params.degreeLevel !== 'all') queryString.append('degreeLevel', params.degreeLevel);
    if (params.language_of_instruction && params.language_of_instruction !== 'all') {
      queryString.append('language_of_instruction', params.language_of_instruction);
    }
    // Search -> ?search=Oxford
    if (params.search && params.search.trim()) queryString.append('search', params.search.trim());

    const endpoint = `/universities?${queryString.toString()}`;
    console.log('[universityAPI] GET', endpoint);

    // Return the full response so callers can access totalCount, page, hasMore.
    // apiRequest already does: return jsonResponse.data || jsonResponse
    // so shape is typically: { totalCount, data: [...], page, size, hasMore }
    const response = await apiRequest(endpoint);
    return response;
  },

  // Get university by ID
  getUniversityById: async (id) => {
    return await apiRequest(`/universities/${id}`);
  },

  // Get filter options
  getCities: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=city");
      const filters = response.filters || response || [];
      return [...new Set(filters.map(f => f.filterId || f))].filter(Boolean);
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  },

  getStates: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=state");
      const filters = response.filters || response || [];
      return [...new Set(filters.map(f => f.filterId || f))].filter(Boolean);
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    }
  },

  getCountries: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=country");
      const filters = response.filters || response || [];
      return [...new Set(filters.map(f => f.filterId || f))].filter(Boolean);
    } catch (error) {
      console.error("Error fetching countries:", error);
      return [];
    }
  },

  getLanguages: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=language_of_instruction");
      const filters = response.filters || response || [];
      return [...new Set(filters.map(f => f.filterId || f))].filter(Boolean);
    } catch (error) {
      console.error("Error fetching languages:", error);
      return [];
    }
  },

  getTypes: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=type");
      const filters = response.filters || response || [];
      return [...new Set(filters.map(f => f.filterId || f))].filter(Boolean);
    } catch (error) {
      console.error("Error fetching types:", error);
      return [];
    }
  },
};

// Course API endpoints
export const courseAPI = {
  // Get courses by university ID
  getCoursesByUniversity: async (universityId) => {
    try {
      const response = await apiRequest(`/universities/${universityId}/courses`);
      
      // Handle different response structures
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.courses && Array.isArray(response.courses)) {
        return response.courses;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  },

  // Get subject areas (field of study)
  getSubjectAreas: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=field_of_study");
      const filters = response.filters || response || [];
      return [...new Set(filters.map(f => f.filterId || f))].filter(Boolean);
    } catch (error) {
      console.error("Error fetching subject areas:", error);
      return [];
    }
  },
};

// Wishlist API endpoints
export const wishlistAPI = {
  // Get user's favorite courses
  getFavoriteCourses: async (token) => {
    try {
      const response = await apiRequest('/students/courses', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Handle different response structures
      if (response?.courses && Array.isArray(response.courses)) {
        return response.courses;
      }
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching favorite courses:", error);
      return [];
    }
  },

  // Add course to favorites
  addToFavorites: async (token, courseId) => {
    try {
      const response = await apiRequest(`/students/courses/favorite/${courseId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  },

  // Remove course from favorites
  removeFromFavorites: async (token, courseId) => {
    try {
      const response = await apiRequest(`/students/courses/favorite/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  },
};

// Utility functions
export const apiUtils = {
  isAuthenticated: () => {
    return !!getAccessToken();
  },

  getAuthToken: () => {
    return getAccessToken();
  },

  getAuthUser: () => {
    return getUser();
  },

  setAuthData: (user, token) => {
    if (typeof window !== "undefined") {
      saveUser(user);
      saveTokens({ 
        accessToken: token, 
        refreshToken: '', 
        expiresIn: 3600 
      });
    }
  },

  clearAuthData: () => {
    clearTokens();
  },
};

export default {
  universityAPI,
  courseAPI,
  wishlistAPI,
  apiUtils,
};
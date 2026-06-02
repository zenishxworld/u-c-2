// Use centralized token service for authenticated requests
import { makeAuthenticatedRequest } from './tokenService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Generic API request function using authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    method: 'GET',
    ...options,
  };

  // Only set Content-Type for JSON requests (not for FormData)
  if (!(options.body instanceof FormData)) {
    config.headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };
  } else {
    config.headers = {
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };
  }

  try {
    console.log(`[API] Making authenticated request to: ${endpoint}`);
    
    const data = await makeAuthenticatedRequest(endpoint, config);
    
    console.log(`[API] Response from ${endpoint}:`, data);
    
    // Handle response data structure
    if (data && data.success && data.data !== undefined) {
      return data.data;
    }
    
    return data;
  } catch (error) {
    console.error(`[API] Request failed for ${endpoint}:`, error);
    
    // Return empty arrays for list endpoints to prevent app crashes
    if (
      endpoint.includes('cities') || 
      endpoint.includes('states') || 
      endpoint.includes('subject_areas') ||
      endpoint.includes('filters') ||
      endpoint.includes('degree_types') ||
      endpoint.includes('featured') ||
      endpoint.includes('search') ||
      (endpoint.includes('universities') && !endpoint.match(/universities\/[a-zA-Z0-9-]+$/)) ||
      (endpoint.includes('courses') && !endpoint.match(/courses\/[a-zA-Z0-9-]+$/))
    ) {
      console.warn(`[API] Returning empty array for failed ${endpoint} request`);
      return [];
    }
    
    throw error;
  }
};

// University API endpoints
export const universityAPI = {
  // Get all universities with optional filters
  getUniversities: async (params = {}) => {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'all') {
        queryString.append(key, value);
      }
    });
    
    const endpoint = `/api/v1/students/universities${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Get university by ID
  getUniversityById: async (id) => {
    return await apiRequest(`/api/v1/students/universities/${id}`);
  },

  // Get university by code
  getUniversityByCode: async (code) => {
    return await apiRequest(`/api/v1/students/universities/code/${code}`);
  },

  // Get universities with filters
  getUniversitiesWithFilters: async () => {
    return await apiRequest('/api/v1/students/universities/filters');
  },

  // Get dynamic filters from backend
  getDynamicFilters: async (filterBy = null) => {
    const endpoint = filterBy
      ? `/api/v1/universities/filters?filterBy=${filterBy}`
      : '/api/v1/universities/filters';
    return await apiRequest(endpoint);
  },

  // Search universities (POST request)
  searchUniversities: async (searchParams = {}) => {
    return await apiRequest('/api/v1/students/universities/search', {
      method: 'POST',
      body: JSON.stringify(searchParams),
    });
  },

  // Update university (PUT request)
  updateUniversity: async (id, data) => {
    return await apiRequest(`/api/v1/students/universities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete university (DELETE request)
  deleteUniversity: async (id, reason = 'TESTING') => {
    return await apiRequest(`/api/v1/students/universities/${id}?reason=${reason}`, {
      method: 'DELETE',
    });
  },

  // Upload universities Excel file
  uploadUniversitiesExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return await apiRequest('/api/university/excel/universities/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload courses Excel file
  uploadCoursesExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return await apiRequest('/api/university/excel/courses/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Get university courses
  getUniversityCourses: async (universityId) => {
    const response = await apiRequest(`/api/v1/students/universities`);
    
    const universities =
      response?.data?.data ||
      response?.data ||
      response || [];
    
    const university = universities.find(
      (uni) => uni.id === universityId
    );
    
    return university?.courses || [];
  },

  // Get all cities
  getCities: async () => {
    return await apiRequest('/api/v1/universities/cities');
  },

  // Get all states
  getStates: async () => {
    return await apiRequest('/api/v1/universities/states');
  },

  // Get featured universities
  getFeaturedUniversities: async () => {
    return await apiRequest('/api/v1/universities/featured');
  },
};

// Course API endpoints
export const courseAPI = {
  // Get all courses with optional filters
  getCourses: async (params = {}) => {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'all') {
        queryString.append(key, value);
      }
    });
    
    const endpoint = `/api/v1/courses${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Get course by ID
  getCourseById: async (id) => {
    return await apiRequest(`/api/v1/courses/${id}`);
  },

  // Get all subject areas
  getSubjectAreas: async () => {
    return await apiRequest('/api/v1/courses/subject_areas');
  },

  // Get all degree types
  getDegreeTypes: async () => {
    return await apiRequest('/api/v1/courses/degree_types');
  },
};

// Export APIs
export default {
  university: universityAPI,
  course: courseAPI,
};
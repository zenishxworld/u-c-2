// Universities Service - Backend integration for university data
import { handleApiError } from './utils.js';
import { makeAuthenticatedRequest } from './tokenService.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://34.230.50.74:8080';

/**
 * Get list of all universities
 * GET /api/v1/universities
 * @param {Object} params - Query parameters (page, size, filters)
 * @returns {Promise<Object>} - Universities list with pagination
 */
export const getUniversities = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    queryParams.append('page', params.page ?? 0);
queryParams.append('size', params.size ?? 20);

if (params.country)               queryParams.append('country', params.country);
if (params.degreeLevel)           queryParams.append('degreeLevel', params.degreeLevel);
if (params.search)                queryParams.append('search', params.search);
if (params.name)                  queryParams.append('name', params.name);
if (params.code)                  queryParams.append('code', params.code);
if (params.status)                queryParams.append('status', params.status);
if (params.institutionType)       queryParams.append('institutionType', params.institutionType);
if (params.type)                  queryParams.append('type', params.type);
if (params.worldRankingMin != null) queryParams.append('world_ranking_min', params.worldRankingMin);
if (params.worldRankingMax != null) queryParams.append('world_ranking_max', params.worldRankingMax);
if (params.nationalRankingMin != null) queryParams.append('national_ranking_min', params.nationalRankingMin);
if (params.nationalRankingMax != null) queryParams.append('national_ranking_max', params.nationalRankingMax);
if (params.qsRankingMin != null)  queryParams.append('qs_ranking_min', params.qsRankingMin);
if (params.qsRankingMax != null)  queryParams.append('qs_ranking_max', params.qsRankingMax);
if (params.tuitionMin != null)    queryParams.append('tuition_min', params.tuitionMin);
if (params.tuitionMax != null)    queryParams.append('tuition_max', params.tuitionMax);
if (params.currency)              queryParams.append('currency', params.currency);
if (params.scholarshipsAvailable != null) queryParams.append('scholarships_available', params.scholarshipsAvailable);
if (params.financialAidAvailable != null) queryParams.append('financial_aid_available', params.financialAidAvailable);
if (params.foundedYearMin != null) queryParams.append('founded_year_min', params.foundedYearMin);
if (params.foundedYearMax != null) queryParams.append('founded_year_max', params.foundedYearMax);
if (params.languageOfInstruction) queryParams.append('language_of_instruction', params.languageOfInstruction);
    
    const endpoint = `/api/v1/students/universities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('[Universities] Fetching universities list:', endpoint);
    const response = await makeAuthenticatedRequest(endpoint);
    
    return response;
  } catch (error) {
    console.error('Error fetching universities:', error);
    throw handleApiError(error);
  }
};

/**
 * Get university filters/metadata
 * GET /api/v1/universities/filters
 * @returns {Promise<Object>} - Available filters and metadata
 */
export const getUniversityFilters = async () => {
  try {
    console.log('[Universities] Fetching university filters');
    const response = await makeAuthenticatedRequest('/api/v1/students/universities/filters');
    
    return response;
  } catch (error) {
    console.error('Error fetching university filters:', error);
    throw handleApiError(error);
  }
};

/**
 * Get university by ID
 * GET /api/v1/universities/{universityId}
 * @param {string} universityId - University UUID
 * @returns {Promise<Object>} - University details
 */
export const getUniversityById = async (universityId) => {
  try {
    if (!universityId) {
      throw new Error('University ID is required');
    }

    console.log('[Universities] Fetching university:', universityId);
    const response = await makeAuthenticatedRequest(`/api/v1/students/universities/${universityId}`);
    
    return response;
  } catch (error) {
    console.error(`Error fetching university ${universityId}:`, error);
    throw handleApiError(error);
  }
};

/**
 * Search universities with filters
 * GET /api/v1/universities/search
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} - Filtered universities list
 */
export const searchUniversities = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const endpoint = `/api/v1/students/universities/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('[Universities] Searching universities:', endpoint);
    const response = await makeAuthenticatedRequest(endpoint);
    
    return response;
  } catch (error) {
    console.error('Error searching universities:', error);
    throw handleApiError(error);
  }
};

/**
 * Get courses for a specific university
 * @param {string} universityId - University UUID
 * @param {Object} params - Query parameters (degreeLevel, fieldOfStudy, etc.)
 * @returns {Promise<Array>} - List of courses
 */
export const getUniversityCourses = async (universityId, params = {}) => {
  try {
    if (!universityId) {
      throw new Error('University ID is required');
    }

    const queryParams = new URLSearchParams();
    
    if (params.degreeLevel) queryParams.append('degreeLevel', params.degreeLevel);
    if (params.fieldOfStudy) queryParams.append('fieldOfStudy', params.fieldOfStudy);
    
    const endpoint = `/api/v1/students/universities/${universityId}/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('[Universities] Fetching university courses:', endpoint);
    const response = await makeAuthenticatedRequest(endpoint);
    
    // Return courses array or extract from response
    return Array.isArray(response) ? response : (response.data?.courses || response.courses || []);
  } catch (error) {
    console.error(`Error fetching courses for university ${universityId}:`, error);
    throw handleApiError(error);
  }
};

/**
 * Get recommended universities for current student
 * GET /api/v1/universities/recommended
 * @returns {Promise<Array>} - List of recommended universities
 */
export const getRecommendedUniversities = async () => {
  try {
    console.log('[Universities] Fetching recommended universities');
    const response = await makeAuthenticatedRequest('/api/v1/students/universities/recommended');
    
    return Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error('Error fetching recommended universities:', error);
    throw handleApiError(error);
  }
};

// Export all functions
export default {
  getUniversities,
  getUniversityFilters,
  getUniversityById,
  searchUniversities,
  getUniversityCourses,
  getRecommendedUniversities,
};

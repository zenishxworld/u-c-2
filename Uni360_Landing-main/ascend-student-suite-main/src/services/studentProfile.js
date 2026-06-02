// Student Profile Service - Complete backend integration with dynamic configuration
import { handleApiError } from './utils.js';
import { makeAuthenticatedRequest } from './tokenService.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Make authenticated API request to student endpoints
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const config = {
  method: options.method || 'GET',
  body: options.body,  // ✅ JUST PASS IT AS-IS
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
};

  try {
    console.log(`[StudentProfile] API Request: ${config.method} ${endpoint}`);
    if (options.body) {
      console.log('[StudentProfile] Request Body:', options.body);
    }
    
    const data = await makeAuthenticatedRequest(endpoint, config);
    
    console.log('[StudentProfile] API Response:', data);
    return data;
  } catch (error) {
    console.error(`[StudentProfile] API request failed for ${endpoint}:`, error);
    
    if (error.message.includes('401')) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (error.message.includes('403')) {
      throw new Error('Access denied. You do not have permission to access this resource.');
    } else if (error.message.includes('404')) {
      throw new Error('Resource not found.');
    }
    
    throw error;
  }
};

// ==================== PROFILE ENDPOINTS ====================

export const getStudentProfile = async () => {
  try {
    const response = await apiRequest('/api/v1/students/profile');
    return response;
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw handleApiError(error);
  }
};

export const getProfileBuilder = async () => {
  try {
    const response = await apiRequest('/api/v1/students/profile/builder');
    return response;
  } catch (error) {
    console.error('Error fetching profile builder:', error);
    throw handleApiError(error);
  }
};

/**
 * Get profile builder configuration
 * GET /api/v1/students/profile/builder/config
 * @returns {Promise<Object>} - Configuration with all steps and fields
 */
export const getProfileBuilderConfig = async () => {
  try {
    console.log('[StudentProfile] Fetching profile builder config...');
    const response = await apiRequest('/api/v1/students/profile/builder/config');
    console.log('[StudentProfile] Config response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching profile builder config:', error);
    throw handleApiError(error);
  }
};

export const getProfileProgress = async () => {
  try {
    const response = await apiRequest('/api/v1/students/profile/builder/progress');
    return response;
  } catch (error) {
    console.error('Error fetching profile progress:', error);
    throw handleApiError(error);
  }
};

/**
 * Get current step in profile builder with form data and template
 * GET /api/v1/students/profile/builder/current
 * @returns {Promise<Object>} - Current step with data and requestBodyTemplate
 */
export const getCurrentStep = async () => {
  try {
    console.log('[StudentProfile] Fetching current step...');
    const response = await apiRequest('/api/v1/students/profile/builder/current');
    console.log('[StudentProfile] Current step response:', response);
    return response;
  } catch (error) {
    console.warn('[StudentProfile] Current step endpoint error:', error);
    
    if (error.message.includes('401') || error.message.includes('404')) {
      console.log('[StudentProfile] Using fallback - endpoint may not be implemented yet');
      return null;
    }
    
    throw handleApiError(error);
  }
};

export const getProfileSteps = async () => {
  try {
    console.log('[StudentProfile] Fetching profile steps...');
    const builderResponse = await apiRequest('/api/v1/students/profile/builder');
    console.log('[StudentProfile] Builder response:', builderResponse);
    
    const data = builderResponse.data || builderResponse;
    const steps = data.stepsStatus || data.steps || [];
    
    console.log('[StudentProfile] Extracted steps:', steps);
    return steps;
  } catch (error) {
    console.warn('[StudentProfile] Could not fetch profile steps:', error);
    
    if (error.message.includes('401') || error.message.includes('404')) {
      console.log('[StudentProfile] Returning empty array as fallback');
      return [];
    }
    
    throw handleApiError(error);
  }
};

/**
 * Validate specific step data
 * POST /api/v1/students/profile/builder/validate/{stepId}
 * @param {string} stepId - Step identifier (e.g., 'testing_basic_info', 'education')
 * @param {Object} stepData - Step data to validate (snake_case keys)
 * @returns {Promise<Object>} - Validation result with errors, warnings, suggestions, and requestBodyTemplate
 */
export const validateStep = async (stepId, stepData) => {
  try {
    console.log(`[StudentProfile] Validating step: ${stepId}`, stepData);
    
    const response = await apiRequest(`/api/v1/students/profile/builder/validate/${stepId}`, {
      method: 'POST',
      body: stepData,
    });
    
    console.log(`[StudentProfile] Validation response for ${stepId}:`, response);
    return response;
  } catch (error) {
    console.error(`Error validating step ${stepId}:`, error);
    throw handleApiError(error);
  }
};

/**
 * Reset profile builder
 * POST /api/v1/students/profile/builder/reset
 * @returns {Promise<Object>} - Reset confirmation
 */
export const resetProfileBuilder = async () => {
  try {
    console.log('[StudentProfile] Resetting profile builder...');
    const response = await apiRequest('/api/v1/students/profile/builder/reset', {
      method: 'POST',
    });
    console.log('[StudentProfile] Reset response:', response);
    return response;
  } catch (error) {
    console.error('Error resetting profile builder:', error);
    throw handleApiError(error);
  }
};

// Keep legacy functions for backward compatibility
export const validateProfile = async (profileData) => {
  try {
    const response = await apiRequest('/api/v1/students/profile/builder/validate', {
      method: 'POST',
      body: profileData,
    });
    return response;
  } catch (error) {
    console.error('Error validating profile:', error);
    throw handleApiError(error);
  }
};

export const saveProfileData = async (profileData) => {
  try {
    console.log('[StudentProfile] Saving profile data (legacy method):', profileData);
    const response = await apiRequest('/api/v1/students/profile', {
      method: 'PUT',
      body: profileData,
    });
    console.log('[StudentProfile] Profile saved successfully:', response);
    return response;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw handleApiError(error);
  }
};

export const loadProfileData = async () => {
  try {
    console.log('[StudentProfile] Loading profile data');
    const response = await getStudentProfile();
    return response;
  } catch (error) {
    console.error('Error loading profile:', error);
    throw handleApiError(error);
  }
};

// ==================== APPLICATIONS ENDPOINTS ====================

export const getStudentApplications = async (countryCode) => {
  try {
    // Build the endpoint with optional countryCode parameter
    let endpoint = '/api/v1/students/applications';
    
    // Only add countryCode param for DE (Germany) and UK tabs
    if (countryCode === 'DE') {
      endpoint += '?countryCode=Germany';
    } else if (countryCode === 'UK') {
      endpoint += '?countryCode=UK';
    }
    // For 'ALL' or undefined, use endpoint without params
    
    console.log('Fetching applications from:', endpoint);
    
    const response = await apiRequest(endpoint);
    return Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error('Error fetching student applications:', error);
    throw handleApiError(error);
  }
};

export const createApplication = async (applicationData) => {
  try {
    console.log('[StudentProfile] ========== CREATE APPLICATION START ==========');
    
    // Validate required fields
    if (!applicationData.studentId) {
      throw new Error('studentId is required');
    }
    if (!applicationData.targetUniversityId) {
      throw new Error('targetUniversityId is required');
    }
    if (!applicationData.targetCourseId) {
      throw new Error('targetCourseId is required');
    }
    if (!applicationData.targetSemester) {
      throw new Error('targetSemester is required');
    }
    if (!applicationData.targetYear) {
      throw new Error('targetYear is required');
    }

    // Create clean payload - ONLY these 5 fields, nothing else
    // CRITICAL: studentId MUST be a number, targetYear MUST be a number
    const payload = {
      studentId: Number(applicationData.studentId),
      targetUniversityId: String(applicationData.targetUniversityId),
      targetCourseId: String(applicationData.targetCourseId),
      targetSemester: String(applicationData.targetSemester).toUpperCase(),
      targetYear: Number(applicationData.targetYear)
    };

    // Validate types before sending
    if (isNaN(payload.studentId) || payload.studentId <= 0) {
      throw new Error(`Invalid studentId: ${applicationData.studentId}. Must be a positive number.`);
    }
    if (isNaN(payload.targetYear) || payload.targetYear < 2024) {
      throw new Error(`Invalid targetYear: ${applicationData.targetYear}. Must be a valid year.`);
    }

    console.log('[StudentProfile] Create Application Payload:', JSON.stringify(payload, null, 2));
    console.log('[StudentProfile] Payload types:', {
      studentId: typeof payload.studentId,
      targetUniversityId: typeof payload.targetUniversityId,
      targetCourseId: typeof payload.targetCourseId,
      targetSemester: typeof payload.targetSemester,
      targetYear: typeof payload.targetYear
    });

    // CRITICAL: Use direct fetch to match Postman curl EXACTLY
    // Postman only sends Content-Type + Authorization headers
    // The shared apiRequest/makeAuthenticatedRequest adds X-Client-ID: uniflow
    // which causes the backend to use a different client config (no workflow definitions)
    const { getAccessToken } = await import('./tokenService.js');
    const token = await getAccessToken();
    
    const url = `${BASE_URL}/api/v1/students/applications`;
    
    console.log('[StudentProfile] Direct fetch to:', url);
    console.log('[StudentProfile] Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('[StudentProfile] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[StudentProfile] Create Application Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('[StudentProfile] ========== CREATE APPLICATION SUCCESS ==========');
    console.log('[StudentProfile] Full Response:', JSON.stringify(data, null, 2));
    console.log('[StudentProfile] Application ID:', data?.data?.id || data?.id);
    console.log('[StudentProfile] Client ID:', data?.data?.client_id);
    console.log('[StudentProfile] Application Type:', data?.data?.application_type || data?.application_type);
    console.log('[StudentProfile] Program Level:', data?.data?.program_level || data?.program_level);
    console.log('[StudentProfile] Country Code:', data?.data?.country_code || data?.country_code);
    console.log('[StudentProfile] Workflow Stage:', data?.data?.workflow_stage || data?.workflow_stage);
    console.log('[StudentProfile] Status:', data?.data?.status || data?.status);
    
    return data;
  } catch (error) {
    console.error('[StudentProfile] ========== CREATE APPLICATION FAILED ==========');
    console.error('[StudentProfile] Error:', error);
    throw handleApiError(error);
  }
};

export const getApplicationById = async (applicationId) => {
  try {
    if (!applicationId) throw new Error('Application ID is required');
    const response = await apiRequest(`/api/v1/applications/${applicationId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching application ${applicationId}:`, error);
    throw handleApiError(error);
  }
};

export const updateApplication = async (applicationId, updateData) => {
  try {
    if (!applicationId) throw new Error('Application ID is required');
    console.log('Updating application:', applicationId, updateData);
    const response = await apiRequest(`/api/v1/applications/${applicationId}`, {
      method: 'PUT',
      body: updateData,
    });
    return response;
  } catch (error) {
    console.error(`Error updating application ${applicationId}:`, error);
    throw handleApiError(error);
  }
};

export const submitApplication = async (applicationId, submitData) => {
  try {
    console.log('[StudentProfile] ========== SUBMIT APPLICATION START ==========');
    console.log('[StudentProfile] Application ID:', applicationId);
    console.log('[StudentProfile] Submit Data received:', submitData);
    
    // Validate required fields
    if (!submitData.agreeToTerms) {
      throw new Error('You must agree to the terms and conditions');
    }
    
    // Prepare the exact payload structure that works in Postman
    const payload = {
      confirmationStatement: submitData.confirmationStatement || "I confirm that all information provided is accurate.",
      agreeToTerms: submitData.agreeToTerms,
      additionalNotes: submitData.additionalNotes || ""
    };
    
    console.log('[StudentProfile] Final Submit Payload:', JSON.stringify(payload, null, 2));

    // CRITICAL: Use direct fetch to match Postman curl EXACTLY
    // Only send Content-Type + Authorization headers (no X-Client-ID)
    const { getAccessToken } = await import('./tokenService.js');
    const token = await getAccessToken();
    
    const url = `${BASE_URL}/api/v1/students/applications/${applicationId}/submit`;
    
    console.log('[StudentProfile] Direct fetch to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('[StudentProfile] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[StudentProfile] Submit Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('[StudentProfile] ========== SUBMIT SUCCESSFUL ==========');
    console.log('[StudentProfile] Submit response:', data);
    return data;
  } catch (error) {
    console.error(`[StudentProfile] ========== SUBMIT FAILED ==========`);
    console.error(`[StudentProfile] Application ID: ${applicationId}`);
    console.error(`[StudentProfile] Error:`, error);
    
    // Extract clean error message
    let errorMessage = 'Failed to submit application';
    
    if (error.message) {
      try {
        const jsonMatch = error.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          errorMessage = errorData.message || errorMessage;
        } else {
          errorMessage = error.message;
        }
      } catch (parseError) {
        errorMessage = error.message;
      }
    }
    
    const cleanError = new Error(errorMessage);
    cleanError.originalError = error;
    throw cleanError;
  }
};

export const getApplicationProgress = async (applicationId) => {
  try {
    if (!applicationId) throw new Error('Application ID is required');
    const response = await apiRequest(`/api/v1/students/applications/${applicationId}/progress`);
    return response;
  } catch (error) {
    console.error(`Error fetching application progress ${applicationId}:`, error);
    throw handleApiError(error);
  }
};

// ==================== HELPER FUNCTIONS ====================

export const isProfileComplete = async () => {
  try {
    const progress = await getProfileProgress();
    const data = progress.data || progress;
    return data.percentage >= 100 || data.completionPercentage >= 100;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
};

export const getProfileCompletionPercentage = async () => {
  try {
    const progress = await getProfileProgress();
    const data = progress.data || progress;
    return data.percentage || data.completionPercentage || 0;
  } catch (error) {
    console.error('Error getting profile completion percentage:', error);
    return 0;
  }
};

// ==================== NOTIFICATIONS ENDPOINTS ====================

export const getNotifications = async () => {
  try {
    const response = await apiRequest('/api/v1/notifications');
    return Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw handleApiError(error);
  }
};

export const getNotificationById = async (notificationId) => {
  try {
    if (!notificationId) throw new Error('Notification ID is required');
    const response = await apiRequest(`/api/v1/notifications/${notificationId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching notification ${notificationId}:`, error);
    throw handleApiError(error);
  }
};

export const getUnreadNotificationsCount = async () => {
  try {
    const response = await apiRequest('/api/v1/notifications/unread/count');
    return response;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw handleApiError(error);
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    if (!notificationId) throw new Error('Notification ID is required');
    console.log('Marking notification as read:', notificationId);
    const response = await apiRequest(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    return response;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw handleApiError(error);
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const notifications = await getNotifications();
    const unreadNotifications = notifications.filter(n => !n.read && !n.isRead);
    
    await Promise.all(
      unreadNotifications.map(notification => 
        markNotificationAsRead(notification.id)
      )
    );
    
    console.log(`Marked ${unreadNotifications.length} notifications as read`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw handleApiError(error);
  }
};

// ==================== COURSES ENDPOINTS ====================

/**
 * GET /api/v1/students/courses
 * Supports: limit, offset, search, degreeLevel
 * Returns raw response (array or paginated object).
 */
export const getAllCourses = async (params = {}) => {
  try {
    const qp = new URLSearchParams();
    if (params.limit   !== undefined) qp.append('limit',       params.limit);
    if (params.offset  !== undefined) qp.append('offset',      params.offset);
    if (params.search)                qp.append('search',      params.search);
    if (params.degreeLevel)           qp.append('degreeLevel', params.degreeLevel);

    const qs = qp.toString();
    const endpoint = `/api/v1/students/courses${qs ? `?${qs}` : ''}`;
    console.log('[StudentProfile] getAllCourses:', endpoint);

    const response = await apiRequest(endpoint);
    // Return as-is — callers normalise the shape themselves
    return response;
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw handleApiError(error);
  }
};

/**
 * Fetch ALL favorite courses by paging through the courses API.
 * Uses limit=20, increments offset until no more pages, and keeps
 * only courses where isFavorite === true.
 */
export const fetchAllFavoriteCourses = async () => {
  const LIMIT = 20;
  let offset = 0;
  let allFavorites = [];
  let hasMore = true;

  console.log('[StudentProfile] fetchAllFavoriteCourses — paging through /api/v1/students/courses ...');

  while (hasMore) {
    try {
      const response = await getAllCourses({ limit: LIMIT, offset });

      // Normalise into a plain array
      let page = [];
      if (Array.isArray(response)) {
        page = response;
      } else if (response?.data && Array.isArray(response.data)) {
        page = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        page = response.data.data;
      }

      console.log(`[StudentProfile] page offset=${offset}, got ${page.length} courses`);

      // Collect favorites from this page
      const pageFavs = page.filter(
        (c) => c.isFavorite === true || c.is_favorite === true
      );
      allFavorites = allFavorites.concat(pageFavs);

      // Stop when we get fewer items than the page size
      if (page.length < LIMIT) {
        hasMore = false;
      } else {
        offset += LIMIT;
      }
    } catch (err) {
      console.error('[StudentProfile] Error fetching courses page at offset', offset, err);
      hasMore = false;
    }
  }

  // Deduplicate by course id — same course can appear on multiple offset pages
  const seen = new Set();
  const deduped = allFavorites.filter((c) => {
    const key = c.id ?? c.courseId;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log('[StudentProfile] fetchAllFavoriteCourses — unique favorites:', deduped.length, '(raw:', allFavorites.length, ')');
  return deduped;
};

export const addCourseToFavorites = async (courseId) => {
  try {
    if (!courseId) throw new Error('Course ID is required');
    console.log('Adding course to favorites:', courseId);
    const response = await apiRequest(`/api/v1/students/courses/favorite/${courseId}`, {
      method: 'POST',
    });
    return response;
  } catch (error) {
    console.error(`Error adding course ${courseId} to favorites:`, error);
    
    // ✅ If already in favorites (409), treat as success
    if (error?.message?.includes('409') || error?.message?.includes('already in favorites')) {
      console.log('[StudentProfile] Course already in favorites, treating as success');
      return { success: true, message: 'Already in favorites' };
    }
    
    throw handleApiError(error);
  }
};

export const removeCourseFromFavorites = async (courseId) => {
  try {
    if (!courseId) throw new Error('Course ID is required');
    console.log('Removing course from favorites:', courseId);
    const response = await apiRequest(`/api/v1/students/courses/favorite/${courseId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error(`Error removing course ${courseId} from favorites:`, error);
    
    // ✅ If not found (404), treat as success (already removed)
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      console.log('[StudentProfile] Course not in favorites, treating as success');
      return { success: true, message: 'Already removed from favorites' };
    }
    
    throw handleApiError(error);
  }
};

export const getFavoriteCourses = async () => {
  try {
    console.log('[StudentProfile] Fetching favorite courses from API...');
    const response = await apiRequest('/api/v1/students/courses/favorites');
    return Array.isArray(response) ? response : (response.data || []);
  } catch (error) {
    console.error('Error fetching favorite courses:', error);
    throw handleApiError(error);
  }
};

// ==================== VISA ENDPOINTS ====================

const isNotFound = (error) =>
  error?.message?.includes('404') ||
  error?.message?.includes('Resource not found') ||
  error?.message?.includes('Not Found');

export const getVisaChecklist = async (country) => {
  try {
    const response = await apiRequest(`/api/v1/students/visa/checklist?country=${country}`);
    return response;
  } catch (error) {
    if (isNotFound(error)) {
      console.warn('[Visa] Checklist endpoint not available yet, using static fallback.');
      return null;
    }
    console.error('Error fetching visa checklist:', error);
    throw handleApiError(error);
  }
};

export const getVisaTracker = async (country) => {
  try {
    const response = await apiRequest(`/api/v1/students/visa/tracker?country=${country}`);
    return response;
  } catch (error) {
    if (isNotFound(error)) {
      console.warn('[Visa] Tracker endpoint not available yet, using static fallback.');
      return null;
    }
    console.error('Error fetching visa tracker:', error);
    throw handleApiError(error);
  }
};

export const updateVisaTracker = async (payload) => {
  try {
    const response = await apiRequest('/api/v1/students/visa/tracker', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    if (isNotFound(error)) {
      console.warn('[Visa] Tracker update endpoint not available yet, skipping persist.');
      return null;
    }
    console.error('Error updating visa tracker:', error);
    throw handleApiError(error);
  }
};

export const getVisaAppointments = async () => {
  try {
    const response = await apiRequest('/api/v1/students/visa/appointments');
    return response;
  } catch (error) {
    if (isNotFound(error)) {
      console.warn('[Visa] Appointments endpoint not available yet, returning empty list.');
      return null;
    }
    console.error('Error fetching visa appointments:', error);
    throw handleApiError(error);
  }
};

export const getMeetingUrl = async (section) => {
  try {
    const response = await apiRequest(`/api/v1/students/meeting-url?section=${section}`);
    return response;
  } catch (error) {
    if (isNotFound(error)) {
      console.warn(`[Meeting] meeting-url endpoint not available yet for section: ${section}.`);
      return null;
    }
    console.error('Error fetching meeting URL:', error);
    throw handleApiError(error);
  }
};


export default {
  getStudentProfile,
  getProfileBuilder,
  getProfileBuilderConfig,
  getProfileProgress,
  getCurrentStep,
  getProfileSteps,
  validateStep,
  validateProfile,
  resetProfileBuilder,
  getStudentApplications,
  createApplication,
  getApplicationById,
  updateApplication,
  submitApplication,
  getApplicationProgress,
  getAllCourses,
  fetchAllFavoriteCourses,
  addCourseToFavorites,
  removeCourseFromFavorites,
  getFavoriteCourses,
  getNotifications,
  getNotificationById,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  isProfileComplete,
  getProfileCompletionPercentage,
  saveProfileData,
  loadProfileData,
  getVisaChecklist,
  getVisaTracker,
  updateVisaTracker,
  getVisaAppointments,
  getMeetingUrl,
};
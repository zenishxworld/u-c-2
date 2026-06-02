import { getCommonHeaders, handleApiError, getToken } from './utils.js';

// Base URL for profile API endpoints - use Vite proxy
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * API Helper function to handle requests with proper headers and error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  let url = `${BASE_URL}${endpoint}`;
  
  // Add ngrok bypass header as query parameter if needed (optional with proxy)
  if (!url.includes('ngrok-skip-browser-warning')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}ngrok-skip-browser-warning=true`;
  }

  const config = {
    method: options.method || 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...getCommonHeaders(),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`Making profile API request to: ${url}`);
    const response = await fetch(url, config);
    
    console.log(`API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`HTTP error! status: ${response.status}`, errorData);
      throw handleApiError(errorData);
    }
    
    const data = await response.json();
    console.log(`Profile API response from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Profile API request failed for ${endpoint}:`, error);
    throw handleApiError(error);
  }
};

/**
 * Get user profile data
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await apiRequest('/student/profile/', {
      method: 'GET',
    });

    return response.user || response;
  } catch (error) {
    console.error('Get profile error:', error);
    throw handleApiError(error);
  }
};

/**
 * Update user profile data
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (profileData) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Format the data according to backend expectations
    const formattedData = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone,
      date_of_birth: profileData.dateOfBirth,
      nationality: profileData.nationality,
      current_location: profileData.currentLocation,
      education_level: profileData.educationLevel,
      field_of_study: profileData.fieldOfStudy,
      target_countries: profileData.targetCountries,
      preferred_programs: profileData.preferredPrograms,
    };

    // Remove undefined values
    Object.keys(formattedData).forEach(key => {
      if (formattedData[key] === undefined) {
        delete formattedData[key];
      }
    });

    const response = await apiRequest('/student/profile/', {
      method: 'PATCH',
      body: JSON.stringify(formattedData),
    });

    // Format response back to frontend format
    if (response) {
      return {
        id: response.id,
        email: response.email,
        name: `${response.first_name || ''} ${response.last_name || ''}`.trim(),
        firstName: response.first_name,
        lastName: response.last_name,
        phone: response.phone,
        dateOfBirth: response.date_of_birth,
        nationality: response.nationality,
        currentLocation: response.current_location,
        educationLevel: response.education_level,
        fieldOfStudy: response.field_of_study,
        targetCountries: response.target_countries,
        preferredPrograms: response.preferred_programs,
        profilePhoto: response.profile_photo,
      };
    }
    return response;
  } catch (error) {
    console.error('Update profile error:', error);
    throw handleApiError(error);
  }
};

/**
 * Upload profile photo
 * @param {File | string} fileOrBase64 - Image file to upload or base64 string
 * @returns {Promise<Object>} Response with photo URL
 */
export const uploadProfilePhoto = async (fileOrBase64) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    let body;
    let headers = {
      'ngrok-skip-browser-warning': 'true',
      'Authorization': `Bearer ${token}`,
    };

    if (typeof fileOrBase64 === 'string') {
      // It's a base64 string
      body = JSON.stringify({ profile_photo: fileOrBase64 });
      headers['Content-Type'] = 'application/json';
    } else {
      // It's a file
      const formData = new FormData();
      formData.append('profile_photo', fileOrBase64);
      body = formData;
      // Don't set Content-Type for FormData, let browser set it
    }

    const response = await fetch(`${BASE_URL}/student/profile/photo/`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleApiError(errorData);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload photo error:', error);
    throw handleApiError(error);
  }
};

/**
 * Delete profile photo
 * @returns {Promise<Object>} Response confirmation
 */
export const deleteProfilePhoto = async () => {
  try {
    const response = await apiRequest('/student/profile/photo/', {
      method: 'DELETE',
    });

    return response;
  } catch (error) {
    console.error('Delete photo error:', error);
    throw handleApiError(error);
  }
};

/**
 * Update specific profile fields (wrapper around updateUserProfile)
 * @param {Object} fields - Specific fields to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfileFields = async (fields) => {
  return updateUserProfile(fields);
};

/**
 * Get profile completion percentage
 * @param {Object} user - User object to calculate completion for
 * @returns {number} Profile completion percentage
 */
export const getProfileCompletion = (user) => {
  if (!user) return 0;
  
  const fields = [
    'name',
    'email',
    'phone',
    'dateOfBirth',
    'nationality',
    'currentLocation',
    'educationLevel',
    'fieldOfStudy',
    'targetCountries',
    'preferredPrograms',
    'profilePhoto'
  ];
  
  const completedFields = fields.filter(field => {
    const value = user[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value.trim() !== '';
  });
  
  return Math.round((completedFields.length / fields.length) * 100);
};

/**
 * Save profile data locally (for draft functionality)
 * @param {Object} profileData - Profile data to save
 */
export const saveProfileDraft = (profileData) => {
  try {
    // Get current user ID to create user-specific draft key
    const currentUser = JSON.parse(localStorage.getItem('uni360_user') || '{}');
    const userId = currentUser.id || currentUser.email || 'default';
    const draftKey = `profile_draft_${userId}`;
    
    localStorage.setItem(draftKey, JSON.stringify(profileData));
    console.log('Profile draft saved for user:', userId);
    return true;
  } catch (error) {
    console.error('Error saving profile draft:', error);
    return false;
  }
};

/**
 * Get profile draft from local storage
 * @returns {Object|null} Saved profile draft or null
 */
export const getProfileDraft = () => {
  try {
    // Get current user ID to retrieve user-specific draft
    const currentUser = JSON.parse(localStorage.getItem('uni360_user') || '{}');
    const userId = currentUser.id || currentUser.email || 'default';
    const draftKey = `profile_draft_${userId}`;
    
    const draft = localStorage.getItem(draftKey);
    const parsedDraft = draft ? JSON.parse(draft) : null;
    console.log('Profile draft retrieved for user:', userId, parsedDraft ? 'Found' : 'Not found');
    return parsedDraft;
  } catch (error) {
    console.error('Error getting profile draft:', error);
    return null;
  }
};

/**
 * Clear profile draft from local storage
 */
export const clearProfileDraft = () => {
  try {
    // Get current user ID to clear user-specific draft
    const currentUser = JSON.parse(localStorage.getItem('uni360_user') || '{}');
    const userId = currentUser.id || currentUser.email || 'default';
    const draftKey = `profile_draft_${userId}`;
    
    localStorage.removeItem(draftKey);
    console.log('Profile draft cleared for user:', userId);
    return true;
  } catch (error) {
    console.error('Error clearing profile draft:', error);
    return false;
  }
};

/**
 * Clear all profile drafts (useful when switching users)
 */
export const clearAllProfileDrafts = () => {
  try {
    // Get all localStorage keys and remove profile drafts
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('profile_draft_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('All profile drafts cleared:', keysToRemove.length, 'drafts removed');
    return true;
  } catch (error) {
    console.error('Error clearing all profile drafts:', error);
    return false;
  }
};

/**
 * Get dashboard data for the student
 * @returns {Promise<Object>} Dashboard data including applications, stats, etc.
 */
export const getDashboardData = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await apiRequest('/student/profile/dashboard/', {
      method: 'GET',
    });

    return response;
  } catch (error) {
    console.error('Get dashboard data error:', error);
    throw handleApiError(error);
  }
};
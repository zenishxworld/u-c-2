// auth.js (Updated: Integrated utils.js for storage (setTokens, setUser, clearAuthData). Aligned response parsing with { success, data: { accessToken, refreshToken, expiresIn, user } }. Used utils.isValidEmail. No functionality removed; enhanced error handling and logging preserved.)
import { handleApiError, getToken, setTokens, setUser, clearAuthData, isValidEmail as utilsIsValidEmail } from './utils.js';

// Base URL for the API - use Vite proxy
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * API Helper function to handle requests with proper headers and error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  let url = `${BASE_URL}${endpoint}`;
  
  // Add ngrok bypass header as query parameter
  if (url.includes('ngrok') && !url.includes('ngrok-skip-browser-warning')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}ngrok-skip-browser-warning=true`;
  }

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),  // merge safely
    },
    body: options.body, // keep body last
  };

  try {
    console.log(`API Request: ${config.method} ${url}`);
    console.log('Request Body:', options.body ? JSON.parse(options.body) : 'No body');
    
    const response = await fetch(url, config);
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          console.log('Error Response Data:', errorData);
        } else {
          const textError = await response.text();
          console.log('Error Response Text:', textError);
          
          // Check if it's an HTML error page (common with server errors)
          if (textError.includes('<!DOCTYPE') || textError.includes('<html')) {
            errorData = { 
              error: `Server returned HTML instead of JSON. Status: ${response.status}`,
              details: 'This usually means the API endpoint is not available or there\'s a server configuration issue.'
            };
          } else {
            errorData = { error: textError || `HTTP ${response.status}: ${response.statusText}` };
          }
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Handle specific error cases based on Django REST framework patterns
      let errorMessage = 'An error occurred. Please try again.';
      
      const isRegister = endpoint.includes('/register/');
      const isLogin = endpoint.includes('/login/');
      
      if (response.status === 401) {
        if (isLogin) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (isRegister) {
          errorMessage = 'Registration failed. Please check your email format and try again.';
        } else {
          errorMessage = 'Unauthorized. Please log in again.';
        }
      } else if (response.status === 400) {
        // Extract validation errors
        if (errorData && typeof errorData === 'object') {
          const errors = [];
          
          // Handle field-specific errors
          Object.entries(errorData).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${messages}`);
            }
          });
          
          if (errors.length > 0) {
            errorMessage = isRegister ? `Registration validation errors: ${errors.join('. ')}.` : errors.join('. ');
          } else if (isRegister) {
            errorMessage = 'Registration failed. Please check your information.';
          }
        }
      } else if (response.status === 404) {
        errorMessage = `API endpoint not found: ${endpoint}`;
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
      
      throw new Error(errorMessage);
    }
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response received:', textResponse);
      
      // If it's HTML, it's likely an error page
      if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html')) {
        throw new Error('Server returned an error page instead of JSON data. Please check if the API server is running correctly.');
      }
      
      throw new Error('Server did not return JSON data');
    }
    
    const data = await response.json();
    console.log('Success Response:', data);
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the server is running and the URL is correct.');
    }
    
    throw error;
  }
};

/**
 * Login user with credentials
 * @param {Object} credentials - { email, password, rememberMe }
 * @returns {Promise<Object>} - User data with tokens
 */
export const loginUser = async (credentials) => {
  try {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    if (!utilsIsValidEmail(credentials.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Build request payload for new backend API
    const requestData = {
      usernameOrEmail: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };

    console.log('Login attempt with:', { 
      usernameOrEmail: requestData.usernameOrEmail,
      password: `[${requestData.password.length} characters]`
    });

    // Call new backend endpoint with X-Client-ID header
    const url = `${BASE_URL}/api/v1/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': 'uniflow',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestData),
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login error response:', errorText);
      
      // Try to parse backend error message (e.g. Google-only user message)
      let backendMessage = null;
      try {
        const errorJson = JSON.parse(errorText);
        backendMessage = errorJson.message || errorJson.error || null;
      } catch (_) { /* not JSON */ }
      
      if (response.status === 401) {
        throw new Error(backendMessage || 'Invalid email or password. Please check your credentials and try again.');
      } else if (response.status === 400) {
        throw new Error(backendMessage || 'Invalid request. Please check your information.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(backendMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    console.log('Login response:', json);

    // Validate response structure from new backend
    if (!json.success || !json.data || !json.data.accessToken) {
      console.error('Invalid response structure:', json);
      throw new Error('Invalid response from server. Please try again.');
    }

    const data = json.data;

    // Store tokens using utils
    setTokens(data.accessToken, data.refreshToken);

    // Build user object matching AuthContext expectations with all backend fields
    const user = {
      id: data.userId,
      email: data.email,
      username: data.username,
      name: data.fullName || data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.username,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      fullName: data.fullName || data.displayName || '',
      isVerified: data.emailVerified || false,
      emailVerified: data.emailVerified || false,
      phoneVerified: data.phoneVerified || false,
      userType: data.userType,
      status: data.status,
      clientType: data.clientType,
      timezone: data.timezone,
      language: data.language,
      twoFactorEnabled: data.twoFactorEnabled || false,
      isFirstLogin: data.isFirstLogin || false,
      isStudent: data.student || data.userType === 'STUDENT',
      isAdmin: data.admin || false,
      roles: data.roles || [],
      permissions: data.permissions || [],
      authProvider: data.authProvider || 'LOCAL',
      hasPassword: data.hasPassword !== undefined ? data.hasPassword : true,
      provider: data.authProvider || 'LOCAL',
      uuid: `ST${new Date().getFullYear()}-${String(data.userId).padStart(6, '0')}`,
    };

    // Store user using utils
    setUser(user);

    console.log('Login successful, user stored:', user);

    return {
      user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Register new user
 * @param {Object} signUpData - { name, email, password, confirmPassword, acceptTerms }
 * @returns {Promise<Object>} - User data with tokens
 */
export const registerUser = async (signUpData) => {
  try {
    if (!signUpData.name || !signUpData.email || !signUpData.password) {
      throw new Error('Name, email, and password are required');
    }

    if (!signUpData.acceptTerms) {
      throw new Error('You must accept the terms and conditions');
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (!utilsIsValidEmail(signUpData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Extract first and last name
    const nameParts = signUpData.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    if (!firstName || !lastName) {
      throw new Error('Please provide both first and last name');
    }

    // Generate username from email - use email prefix as username
    let username = signUpData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');
    
    // Ensure username is at least 3 characters
    if (username.length < 3) {
      username = (firstName + lastName).toLowerCase().replace(/[^a-z0-9._]/g, '').substring(0, 15);
    }

    // Add some randomness if still too short
    if (username.length < 3) {
      username += Math.random().toString(36).substring(2, 5);
    }

    // Add .student suffix to username to match backend format
    username = username + '.student';

    const requestData = {
      username: username,
      email: signUpData.email.toLowerCase().trim(),
      password: signUpData.password,
      confirmPassword: signUpData.confirmPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      privacyPolicyAccepted: signUpData.acceptTerms,
      termsOfServiceAccepted: signUpData.acceptTerms
    };

    console.log('Registration attempt with:', {
      ...requestData,
      password: '[HIDDEN]',
      confirmPassword: '[HIDDEN]'
    });

    // Call new backend endpoint
    const url = `${BASE_URL}/api/v1/auth/register/student`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestData),
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Registration error response:', errorText);
      
      let errorMessage = 'Registration failed. Please try again.';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If not JSON, use default message
      }
      
      throw new Error(errorMessage);
    }

    const json = await response.json();
    console.log('Registration response:', json);

    // Validate response structure from new backend
    if (!json.success || !json.data) {
      throw new Error('Invalid response from server. Please try again.');
    }

    const data = json.data;

    // Since registration doesn't return tokens immediately (requires email verification),
    // we'll store basic user info for now
    const user = {
      id: data.userId,
      email: data.email,
      username: data.username,
      name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      isVerified: data.emailVerified || false,
      emailVerified: data.emailVerified || false,
      phoneVerified: data.phoneVerified || false,
      userType: data.userType,
      status: data.status,
      requiresEmailVerification: data.requiresEmailVerification,
      uuid: `ST${new Date().getFullYear()}-${String(data.userId).padStart(6, '0')}`,
    };

    // Store user data (no tokens yet since email verification is required)
    setUser(user);

    // Return user data with registration info
    return {
      user: user,
      registrationTime: data.registrationTime,
      nextSteps: data.nextSteps,
      welcomeMessage: data.welcomeMessage,
      profileCompletionUrl: data.profileCompletionUrl,
      loginUrl: data.loginUrl,
      verificationToken: data.verificationToken,
      verificationTokenExpiresAt: data.verificationTokenExpiresAt,
      requiresEmailVerification: data.requiresEmailVerification,
      // No tokens yet - will be provided after email verification
      accessToken: null,
      refreshToken: null,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get Google OAuth authorization URL from backend
 * @returns {Promise<string>} - Google authorization URL
 */
export const getGoogleAuthUrl = async () => {
  try {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
const url = `${BASE_URL}/api/v1/auth/google/url?redirect_uri=${redirectUri}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Google auth URL: ${response.status}`);
    }

    const json = await response.json();
    console.log('Google auth URL response:', json);

    const authorizationUrl = json?.data?.authorizationUrl;
    if (!authorizationUrl) {
      throw new Error('Authorization URL not found in response');
    }

    return authorizationUrl;
  } catch (error) {
    console.error('Error fetching Google auth URL:', error);
    throw handleApiError(error);
  }
};

/**
 * Handle Google OAuth callback — called after popup posts message back
 * Stores tokens + user and returns normalized user object.
 * @param {Object} payload - { token, user } posted from the OAuth callback page
 * @returns {Object} - Normalized { user, accessToken, refreshToken }
 */
export const handleGoogleCallback = (payload) => {
  try {
    const { token, user: rawUser } = payload;

    if (!token || !rawUser) {
      throw new Error('Invalid Google OAuth callback payload');
    }

    // Tokens — callback page may send only accessToken or separate fields
    const accessToken = token;
    const refreshToken = rawUser.refreshToken || null;

    setTokens(accessToken, refreshToken);

    const user = {
      id: rawUser.id ?? rawUser.userId ?? rawUser.user_id ?? null,
      email: rawUser.email,
      username: rawUser.username || rawUser.email?.split('@')[0],
      name: rawUser.fullName || rawUser.name || `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim(),
      firstName: rawUser.firstName || rawUser.first_name || '',
      lastName: rawUser.lastName || rawUser.last_name || '',
      fullName: rawUser.fullName || rawUser.name || '',
      isVerified: true,
      emailVerified: true,
      userType: rawUser.userType || 'STUDENT',
      status: rawUser.status || 'ACTIVE',
      provider: 'GOOGLE',
      authProvider: rawUser.authProvider || 'GOOGLE',
      hasPassword: rawUser.hasPassword !== undefined ? rawUser.hasPassword : false,
      uuid: `ST${new Date().getFullYear()}-${String(rawUser.id ?? rawUser.userId ?? 0).padStart(6, '0')}`,
    };

    setUser(user);

    console.log('Google OAuth successful, user stored:', user);

    return { user, accessToken, refreshToken };
  } catch (error) {
    console.error('Error handling Google callback:', error);
    throw handleApiError(error);
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - New access token
 */
export const refreshToken = async (refreshToken) => {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const response = await apiRequest('/student/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    // Assuming refresh response: { success: true, data: { accessToken: "...", refreshToken: "...", expiresIn: 3600 } }
    if (!response.success || !response.data || !response.data.accessToken) {
      throw new Error('Invalid refresh token response');
    }

    // Update storage using utils
    setTokens(
      response.data.accessToken,
      response.data.refreshToken || refreshToken,  // Keep old if not provided
    );
    // Note: User remains the same, no need to update

    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken || refreshToken,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    const token = getToken();
    
    if (token) {
      await apiRequest('/student/auth/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    // Clear storage using utils
    clearAuthData();
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if API fails
    clearAuthData();
  }
};

/**
 * Verify current user with token
 * @returns {Promise<Object>} - Current user data
 */
export const verifyUser = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await apiRequest('/student/auth/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Assuming /me/ returns { success: true, data: { user: {...} } } or direct user object; adjust if direct
    const userData = response.success ? response.data.user : response;
    if (!userData.id) {
      throw new Error('Invalid user verification response');
    }

    // Update stored user if needed
    setUser(userData);

    return {
      id: userData.id,
      email: userData.email,
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
      username: userData.username,
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      isVerified: true,
      createdAt: userData.date_joined || new Date().toISOString(),
      lastLogin: userData.last_login || new Date().toISOString(),
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} - Reset request response
 */
export const requestPasswordReset = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const url = `${BASE_URL}/api/v1/auth/forgot-password`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      // Pass through the backend message (e.g. Google-only user guard)
      throw new Error(json.message || 'Password reset request failed.');
    }

    return json;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Set or change password (for Google OAuth users upgrading to HYBRID, or changing existing password)
 * @param {Object} data - { currentPassword?, newPassword, confirmPassword }
 * @returns {Promise<Object>} - Response with success message
 */
export const setPassword = async (data) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!data.newPassword || !data.confirmPassword) {
      throw new Error('New password and confirm password are required');
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new Error('New password and confirm password do not match');
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(data.newPassword)) {
      throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character');
    }

    const requestBody = {
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    };

    // Include currentPassword only if provided (required for HYBRID users changing password)
    if (data.currentPassword) {
      requestBody.currentPassword = data.currentPassword;
    }

    console.log('Setting password, currentPassword provided:', !!data.currentPassword);

    const url = `${BASE_URL}/api/v1/auth/set-password`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    const json = await response.json();
    console.log('Set password response:', json);

    if (!response.ok) {
      throw new Error(json.message || 'Failed to set password.');
    }

    return json;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} - Reset response
 */
export const resetPassword = async (token, password) => {
  try {
    if (!token || !password) {
      throw new Error('Token and password are required');
    }

    const response = await apiRequest('/student/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({
        token: token,
        password: password,
      }),
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Change user password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Change password response
 */
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    if (!oldPassword || !newPassword) {
      throw new Error('Both old and new passwords are required');
    }

    const response = await apiRequest('/student/auth/change-password/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== APPLICATION APIs ====================
// NOTE: These application functions are DEPRECATED and kept for backward compatibility.
// Please use the new functions from src/services/studentProfile.js instead:
// - getStudentApplications() - replaces getApplications()
// - createApplication() - new implementation with proper payload
// - getApplicationById() - updated endpoint
// - updateApplication() - updated endpoint
// - submitApplication() - new implementation with confirmation data

/**
 * Get all applications for the current user
 * @deprecated Use getStudentApplications from studentProfile.js instead
 * @returns {Promise<Array>} - Array of user applications
 */
export const getApplications = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const response = await apiRequest('/student/applications/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw handleApiError(error);
  }
};

/**
 * Create a new application
 * @param {Object} applicationData - { university, course, country }
 * @returns {Promise<Object>} - Created application data
 */
export const createApplication = async (applicationData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!applicationData.university || !applicationData.course || !applicationData.country) {
      throw new Error('University, course, and country are required');
    }

    // Validate country format
    const validCountries = ['germany', 'united_kingdom'];
    if (!validCountries.includes(applicationData.country.toLowerCase())) {
      throw new Error('Invalid country. Must be "germany" or "united_kingdom"');
    }

    const requestData = {
      university: applicationData.university,
      course: applicationData.course,
      country: applicationData.country.toLowerCase(),
    };

    console.log('Creating application with data:', requestData);

    const response = await apiRequest('/student/applications/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.id) {
      throw new Error('Invalid response from server. Application may not have been created.');
    }

    return response;
  } catch (error) {
    console.error('Error creating application:', error);
    throw handleApiError(error);
  }
};

/**
 * Submit an application (change status from draft to submitted)
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} - Submit response
 */
export const submitApplication = async (applicationId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    console.log('Submitting application:', applicationId);

    const response = await apiRequest(`/student/applications/${applicationId}/submit_application/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error submitting application:', error);
    
    // Handle specific error case
    if (error.message.includes('can only be submitted when in draft status')) {
      throw new Error('This application has already been submitted or is not in draft status.');
    }
    
    throw handleApiError(error);
  }
};

/**
 * Get application by ID
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} - Application data
 */
export const getApplicationById = async (applicationId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    const response = await apiRequest(`/student/applications/${applicationId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response;
  } catch (error) {
    console.error(`Error fetching application ${applicationId}:`, error);
    throw handleApiError(error);
  }
};

/**
 * Update application data
 * @param {string} applicationId - Application ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated application data
 */
export const updateApplication = async (applicationId, updateData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    console.log('Updating application:', applicationId, updateData);

    const response = await apiRequest(`/student/applications/${applicationId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    return response;
  } catch (error) {
    console.error(`Error updating application ${applicationId}:`, error);
    throw handleApiError(error);
  }
};

/**
 * Delete application
 * @param {string} applicationId - Application ID
 * @returns {Promise<void>}
 */
export const deleteApplication = async (applicationId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    console.log('Deleting application:', applicationId);

    await apiRequest(`/student/applications/${applicationId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error(`Error deleting application ${applicationId}:`, error);
    throw handleApiError(error);
  }
};

// ==================== NOTIFICATIONS APIs ====================

/**
* Get all notifications for the current user
 * @param {boolean} unreadOnly - If true, returns only unread notifications
 * @param {string} type - Filter by notification type (e.g., 'document_request')
 * @returns {Promise<Array>} - Array of notifications
 */
export const getNotifications = async (unreadOnly = false, type = null) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    // Try the student-specific endpoint first
    let endpoint = '/student/notifications/';
    const queryParams = new URLSearchParams();
    
    if (unreadOnly) {
      queryParams.append('unread_only', 'true');
    }
    
    if (type) {
      queryParams.append('type', type);
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    console.log('Fetching notifications from:', endpoint);

    const response = await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // The API returns an array directly according to your documentation
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // If the student endpoint doesn't work, try the generic one
    if (error.message.includes('API endpoint not found')) {
      try {
        console.log('Trying alternative notifications endpoint...');
        const alternativeResponse = await apiRequest('/notifications/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return Array.isArray(alternativeResponse) ? alternativeResponse : [];
      } catch (altError) {
        console.error('Alternative endpoint also failed:', altError);
        // Return empty array and let the UI handle it gracefully
        return [];
      }
    }
    
    throw handleApiError(error);
  }
};

/**
 * Mark a notification as read
 * @param {string|number} notificationId - Notification ID
 * @returns {Promise<Object>} - Response with success message
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    console.log('Marking notification as read:', notificationId);

    // Try student endpoint first
    let endpoint = `/student/notifications/${notificationId}/mark_read/`;
    
    try {
      const response = await apiRequest(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      if (error.message.includes('API endpoint not found')) {
        // Try alternative endpoint
        endpoint = `/notifications/${notificationId}/mark_read/`;
        const response = await apiRequest(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return response;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw handleApiError(error);
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} - Response with success message
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    console.log('Marking all notifications as read');

    // Try student endpoint first
    let endpoint = '/student/notifications/mark_all_read/';
    
    try {
      const response = await apiRequest(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      if (error.message.includes('API endpoint not found')) {
        // Try alternative endpoint
        endpoint = '/notifications/mark_all_read/';
        const response = await apiRequest(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return response;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw handleApiError(error);
  }
};
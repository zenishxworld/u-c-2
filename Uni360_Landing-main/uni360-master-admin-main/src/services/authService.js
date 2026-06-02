import axios from 'axios';

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-ID': import.meta.env.VITE_CLIENT_ID || 'uniflow'
  }
});

export const login = async (usernameOrEmail, password) => {
  try {
    const response = await authApi.post('/api/v1/auth/login', {
      usernameOrEmail,
      password
    });
    // ✅ FIXED: Access the correct nested path
    const responseData = response.data?.data;
    
    if (!responseData) {
      throw new Error('Invalid response structure from server');
    }

    // ✅ FIXED: Get token from correct location
    const token = responseData.accessToken;
    
    if (!token) {
      throw new Error('No access token received from server');
    }

    // Save token
    localStorage.setItem('uni360_access_token', token);
    // Save refresh token
    if (responseData.refreshToken) {
      localStorage.setItem('uni360_refresh_token', responseData.refreshToken);
    }

    // Save user info with all available fields
    const userData = {
      id: responseData.userId,
      username: responseData.username,
      email: responseData.email,
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      fullName: responseData.fullName,
      displayName: responseData.displayName,
      userType: responseData.userType,
      status: responseData.status,
      roles: responseData.roles || [],
      permissions: responseData.permissions || [],
      clientType: responseData.clientType,
      timezone: responseData.timezone,
      language: responseData.language,
      emailVerified: responseData.emailVerified,
      phoneVerified: responseData.phoneVerified,
      isFirstLogin: responseData.isFirstLogin,
      loginAt: responseData.loginAt
    };

    localStorage.setItem('uni360_user', JSON.stringify(userData));
    // Save token expiry
    if (responseData.expiresAt) {
      localStorage.setItem('uni360_token_expiry', responseData.expiresAt);
    }

    // Verify token was saved
    return {
      success: true,
      data: {
        user: userData,
        token: token
      }
    };
  } catch (error) {
    let errorMessage = 'Login failed. Please try again.';
    if (error.response) {
      errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/** ✅ FIXED: No-arg version that safely reads and validates token */
export const validateToken = () => {
  try {
    const token =
      localStorage.getItem('uni360_access_token') ||
      localStorage.getItem('token');

    if (!token) {
      return false;
    }

    if (typeof token !== 'string') {
      return false;
    }

    // Check if token looks like a JWT (has 3 parts)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Decode the payload (second part)
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));

      // Check expiration
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp < currentTime) {
          return false;
        }

        // Calculate time remaining
        const timeRemaining = payload.exp - currentTime;
        const minutesRemaining = Math.floor(timeRemaining / 60);
      }
      return true;
    } catch (decodeError) {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('uni360_access_token');
  localStorage.removeItem('uni360_refresh_token');
  localStorage.removeItem('uni360_user');
  localStorage.removeItem('uni360_token_expiry');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};

export const getCurrentUser = () => {
  try {
    const userStr =
      localStorage.getItem('uni360_user') || localStorage.getItem('user');
    
    if (!userStr) {
      return null;
    }
    
    const user = JSON.parse(userStr);
    return user;
  } catch (error) {
    return null;
  }
};

export const getToken = () => {
  const token =
    localStorage.getItem('uni360_access_token') ||
    localStorage.getItem('token');
  
  if (token) {
  } else {
  }
  
  return token;
};

export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  const isValid = validateToken();
  
  const authenticated = !!(token && user && isValid);
  return authenticated;
};

export const refreshToken = async () => {
  try {
    const currentRefreshToken = localStorage.getItem('uni360_refresh_token');
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await authApi.post('/api/v1/auth/refresh', {
      refreshToken: currentRefreshToken
    });

    const responseData = response.data?.data;
    const token = responseData?.accessToken;

    if (!token) {
      throw new Error('No access token in refresh response');
    }

    localStorage.setItem('uni360_access_token', token);
    if (responseData.refreshToken) {
      localStorage.setItem('uni360_refresh_token', responseData.refreshToken);
    }

    if (responseData.expiresAt) {
      localStorage.setItem('uni360_token_expiry', responseData.expiresAt);
    }

    return { success: true, data: { token } };
  } catch (error) {
    logout();
    throw error;
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  refreshToken,
  validateToken
};
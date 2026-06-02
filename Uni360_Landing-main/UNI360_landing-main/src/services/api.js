// services/api.js - Updated version with new API endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Initialize config with default headers
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if present (check sessionStorage first, then localStorage)
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  console.log(`Making ${options.method || 'GET'} request to:`, url);
  console.log('Headers:', config.headers);
  if (config.body) {
    console.log('Body:', config.body);
  }

  try {
    const response = await fetch(url, config);

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorDetails = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json();
          // Extract error message from the new API response format
          errorMessage = errorDetails.message || errorDetails.error || errorDetails.detail || errorMessage;
        } else {
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        console.log('Could not parse error response:', parseError);
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!responseText) {
      return { success: true, data: {} };
    }

    try {
      const jsonResponse = JSON.parse(responseText);
      // Return the data field from the new API response format
      return jsonResponse.data || jsonResponse;
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    
    // Handle auth errors
    if (error.status === 401) {
      apiUtils.clearAuthData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
    }
    
    throw error;
  }
};

// Authentication API endpoints
export const authAPI = {
  // Student registration
  register: async (userData) => {
    try {
      const response = await apiRequest("/auth/register/student", {
        method: "POST",
        body: JSON.stringify({
          username: userData.username || userData.email.split('@')[0],
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.confirmPassword || userData.password,
          firstName: userData.firstName || userData.first_name,
          lastName: userData.lastName || userData.last_name,
          phoneNumber: userData.phoneNumber || "",
          privacyPolicyAccepted: true,
          termsOfServiceAccepted: true,
        }),
      });
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Student login
  login: async (credentials) => {
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          usernameOrEmail: credentials.email || credentials.username,
          password: credentials.password,
        }),
      });
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      }
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },
};

// Public API endpoints (no authentication required)
export const publicAPI = {
  // Submit contact form
  submitContact: async (contactData) => {
    try {
      // Use fetch directly to avoid the auto-injected Bearer token in apiRequest,
      // and to avoid double-prefixing the path (API_BASE_URL already contains /api/v1).
      const url = `${API_BASE_URL}/public/contact`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          country: contactData.country,
          subject: contactData.subject,
          message: contactData.message,
        }),
      });

      if (!res.ok) {
        let msg = `HTTP error! status: ${res.status}`;
        try {
          const err = await res.json();
          msg = err.message || err.error || msg;
        } catch (_) {}
        const error = new Error(msg);
        error.status = res.status;
        throw error;
      }

      const response = await res.json();
      return response;
      return response;
    } catch (error) {
      console.error("Contact form submission error:", error);
      throw error;
    }
  },
};

// Course/Wishlist API endpoints
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
      return response;
    } catch (error) {
      console.error("Error fetching favorite courses:", error);
      throw error;
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
          'Authorization': `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  },
};

// University API endpoints
export const universityAPI = {
  // Get all universities with optional filters
  getUniversities: async (params = {}) => {
    const queryString = new URLSearchParams();

    queryString.append('page', params.page || 0);
    queryString.append('size', params.size || 20);

    if (params.sort_by) queryString.append('sort_by', params.sort_by);
    if (params.sort_direction) queryString.append('sort_direction', params.sort_direction);
    if (params.status) queryString.append('status', params.status);
    if (params.active !== undefined) queryString.append('active', params.active);
    if (params.type) queryString.append('type', params.type);
    if (params.institution_type) queryString.append('institution_type', params.institution_type);
    if (params.country && params.country !== 'all') queryString.append('country', params.country);
    if (params.city) queryString.append('city', params.city);
    if (params.state) queryString.append('state', params.state);
    if (params.region) queryString.append('region', params.region);
    if (params.search && params.search.trim()) queryString.append('search', params.search.trim());
    if (params.name) queryString.append('name', params.name);
    if (params.code) queryString.append('code', params.code);
    if (params.currency) queryString.append('currency', params.currency);
    if (params.scholarships_available !== undefined) {
      queryString.append('scholarships_available', params.scholarships_available);
    }
    if (params.financial_aid_available !== undefined) {
      queryString.append('financial_aid_available', params.financial_aid_available);
    }
    if (params.financialAidAvailable !== undefined) {
      queryString.append('financialAidAvailable', params.financialAidAvailable);
    }

    // New Categorical & Structural
    if (params.verificationStatus) queryString.append('verificationStatus', params.verificationStatus);
    
    // New Boolean/Feature
    if (params.isFeatured !== undefined) queryString.append('isFeatured', params.isFeatured);
    if (params.accommodationAvailable !== undefined) queryString.append('accommodationAvailable', params.accommodationAvailable);
    if (params.internationalOffice !== undefined) queryString.append('internationalOffice', params.internationalOffice);
    if (params.careerServices !== undefined) queryString.append('careerServices', params.careerServices);
    if (params.libraryServices !== undefined) queryString.append('libraryServices', params.libraryServices);
    if (params.healthServices !== undefined) queryString.append('healthServices', params.healthServices);
    if (params.sportsFacilities !== undefined) queryString.append('sportsFacilities', params.sportsFacilities);
    
    // New Numeric/Metric
    if (params.worldRanking) queryString.append('worldRanking', params.worldRanking);
    if (params.nationalRanking) queryString.append('nationalRanking', params.nationalRanking);
    if (params.qsRanking) queryString.append('qsRanking', params.qsRanking);
    if (params.totalStudents) queryString.append('totalStudents', params.totalStudents);

    if (params.founded_year_min) queryString.append('founded_year_min', params.founded_year_min);
    if (params.founded_year_max) queryString.append('founded_year_max', params.founded_year_max);
    if (params.language_of_instruction) {
      queryString.append('language_of_instruction', params.language_of_instruction);
    }
    if (params.degreeLevel) queryString.append('degreeLevel', params.degreeLevel);

    const endpoint = `/universities?${queryString.toString()}`;
    // Return the full response so callers can read totalCount for pagination.
    // Shape from backend: { totalCount, data: [...], page, size, hasMore }
    // or wrapped:         { data: { totalCount, data: [...] } }
    const response = await apiRequest(endpoint);
    return response;
  },

  getUniversityById: async (id) => {
    return await apiRequest(`/universities/${id}`);
  },

  getUniversityByCode: async (code) => {
    return await apiRequest(`/universities/code/${code}`);
  },

  getFilters: async (filterBy = null) => {
    const endpoint = filterBy
      ? `/universities/filters?filterBy=${filterBy}`
      : `/universities/filters`;
    const response = await apiRequest(endpoint);
    return response.filters || [];
  },

  getCities: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=city");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  },

  getStates: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=state");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    }
  },

  getCountries: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=country");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching countries:", error);
      return [];
    }
  },

  getRegions: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=region");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching regions:", error);
      return [];
    }
  },

  getLanguages: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=language_of_instruction");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching languages:", error);
      return [];
    }
  },

  getTypes: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=type");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching types:", error);
      return [];
    }
  },
};

// Course API endpoints
export const courseAPI = {
  getCourses: async (params = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        queryString.append(key, value);
      }
    });
    const endpoint = `/courses${queryString.toString() ? `?${queryString.toString()}` : ""}`;
    return await apiRequest(endpoint);
  },

  getCourseById: async (id) => {
    return await apiRequest(`/courses/${id}`);
  },

  getSubjectAreas: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=field_of_study");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching subject areas:", error);
      return [];
    }
  },

  getDegreeTypes: async () => {
    try {
      const response = await apiRequest("/universities/filters?filterBy=degree_type");
      const filters = response.filters || [];
      return [...new Set(filters.map(f => f.filterId))];
    } catch (error) {
      console.error("Error fetching degree types:", error);
      return [];
    }
  },
};

// Student Profile API endpoints
export const studentAPI = {
  getProfile: async (token) => {
    try {
      const response = await apiRequest("/students/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  updateProfile: async (token, profileData) => {
    try {
      const response = await apiRequest("/students/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      return response;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
};

// ─── Payment API endpoints ────────────────────────────────────────────────────
export const paymentAPI = {
  // 0. Get allowed payment types
  getPaymentTypes: async () => {
    try {
      const response = await apiRequest('/payment/types', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error("Error fetching payment types:", error);
      throw error;
    }
  },

  // 1. Check payment service health
  checkHealth: async () => {
    try {
      const response = await apiRequest('/payment/health', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error("Payment health check failed:", error);
      throw error;
    }
  },

  // 2. Create Razorpay order
  createOrder: async (amount = 100, currency = 'INR', paymentType = 'OTHER') => {
  try {
    const user = apiUtils.getAuthUser();
    const response = await apiRequest('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency,
        payment_type: paymentType,
        reference_id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }),
    });
    return response;
  } catch (error) {
    console.error("Error creating payment order:", error);
    throw error;
  }
},

  // 3. Verify payment signature after Razorpay checkout
  verifyPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const response = await apiRequest('/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        }),
      });
      return response;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },
};

// Utility functions
export const apiUtils = {
  isAuthenticated: () => {
    if (typeof window !== "undefined") {
      return !!(sessionStorage.getItem("authToken") || localStorage.getItem("authToken"));
    }
    return false;
  },

  getAuthToken: () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || null;
    }
    return null;
  },

  getAuthUser: () => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  setAuthData: (user, token) => {
    if (typeof window !== "undefined") {
      // Normalize: backend returns "userId" but quiz submission needs "id".
      // Always map userId -> id so every consumer can reliably use user.id.
      const normalizedUser = {
        ...user,
        id: user.id ?? user.userId ?? user.user_id ?? null,
      };
      const userJson = JSON.stringify(normalizedUser);
      // Store in both sessionStorage and localStorage
      sessionStorage.setItem("authUser", userJson);
      sessionStorage.setItem("authToken", token);
      localStorage.setItem("authUser", userJson);
      localStorage.setItem("authToken", token);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "authUser",
          newValue: userJson,
          oldValue: sessionStorage.getItem("authUser"),
        })
      );
    }
  },

  clearAuthData: () => {
    if (typeof window !== "undefined") {
      // Clear from both sessionStorage and localStorage
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("authUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "authUser",
          newValue: null,
          oldValue: sessionStorage.getItem("authUser"),
        })
      );
    }
  },

  handleError: (error) => {
    if (error.status === 401) {
      apiUtils.clearAuthData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
    }
    return error;
  },
};

// Quiz API endpoints
export const quizAPI = {
  /**
   * Submit a completed quiz session.
   * POST /api/v1/students/quiz/submit
   *
   * @param {object} payload
   * @param {number}   payload.studentId
   * @param {number}   payload.score           – 0-100 percentage score
   * @param {Array}    payload.matchedUniversities – [{ name, matchPercentage }]
   * @param {Array}    payload.answers           – [{ questionId, answer }]
   * @param {string}  token                     – Bearer token
   */
  submitQuiz: async ({ studentId, score, matchedUniversities, answers }, token) => {
    try {
      // Backend login response uses "userId" — resolve it from all possible field names
      const storedUser = apiUtils.getAuthUser();
      const resolvedStudentId =
        Number(studentId) ||
        Number(storedUser?.id) ||
        Number(storedUser?.userId) ||
        Number(storedUser?.studentId) ||
        0;

      if (!resolvedStudentId) {
        console.warn('[quizAPI] studentId could not be resolved — quiz submission skipped.');
        return { success: false, skipped: true };
      }

      const quizPayload = {
        studentId: resolvedStudentId,
        score: Number(score),
        matchedUniversities: Array.isArray(matchedUniversities) ? matchedUniversities : [],
        answers,
      };

      console.log('[quizAPI] Submitting payload:', JSON.stringify(quizPayload, null, 2));

      const response = await apiRequest('/students/quiz/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizPayload),
      });
      return response;
    } catch (error) {
      console.error('[quizAPI] Submit error:', error.message, JSON.stringify(error.details, null, 2));
      throw error;
    }
  },

  /**
   * Get all past quiz results for the logged-in student.
   * GET /api/v1/students/quiz/history
   *
   * @param {string} token – Bearer token
   */
  getQuizHistory: async (token) => {
    try {
      const response = await apiRequest('/students/quiz/history', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // API returns { success, data: [...] } – apiRequest already unwraps .data
      return Array.isArray(response) ? response : (response?.data ?? []);
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      throw error;
    }
  },
};

// Export a default object with all APIs
const API = {
  auth: authAPI,
  public: publicAPI,
  wishlist: wishlistAPI,
  university: universityAPI,
  course: courseAPI,
  student: studentAPI,
  payment: paymentAPI,
  quiz: quizAPI,
  utils: apiUtils,
};

export default API;
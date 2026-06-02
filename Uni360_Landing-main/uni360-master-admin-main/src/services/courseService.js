//courseService.js

import { makeAuthenticatedRequest } from './tokenService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const courseAPI = {
  // Get all courses with optional filters + limit/offset pagination
  getCourses: async (filters = {}) => {
    const params = new URLSearchParams();

    // ── Pagination (always send) ──────────────────────────────────────────
    const limit  = filters.limit  ?? 20;
    const offset = filters.offset ?? 0;
    params.append('limit',  limit);
    params.append('offset', offset);

    // ── Search ────────────────────────────────────────────────────────────
    params.append('search', filters.search ? String(filters.search).trim() : '');

    // ── Filters ───────────────────────────────────────────────────────────
    if (filters.universityCode) params.append('universityCode', filters.universityCode);
    if (filters.degreeLevel)    params.append('degreeLevel',    filters.degreeLevel);
    if (filters.fieldOfStudy)   params.append('fieldOfStudy',   filters.fieldOfStudy);

    const endpoint = `/api/v1/students/courses?${params.toString()}`;
    return await makeAuthenticatedRequest(endpoint, { method: 'GET' });
  },

  // Helper: fetch ALL courses by looping through pages automatically
  getAllCourses: async (filters = {}) => {
    const limit = filters.limit ?? 20;
    let offset  = 0;
    let allCourses = [];
    let hasMore    = true;
    while (hasMore) {
      const response = await courseAPI.getCourses({ ...filters, limit, offset });

      // Support both { content: [...] } and plain array responses
      const courses = Array.isArray(response)
        ? response
        : response?.content ?? response?.courses ?? response?.data ?? [];

      allCourses = [...allCourses, ...courses];
      // Stop if we got fewer results than the limit (last page)
      if (courses.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return allCourses;
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    return await makeAuthenticatedRequest(`/api/v1/students/courses/${courseId}`, {
      method: 'GET'
    });
  },

  // Search courses (POST)
  searchCourses: async (searchCriteria) => {
    return await makeAuthenticatedRequest('/api/v1/students/courses/search', {
      method: 'POST',
      body: searchCriteria
    });
  },

  // Upload courses CSV/Excel
  uploadCoursesExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('uni360_access_token') || localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/api/university/excel/courses/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Client-ID': 'uniflow',
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  // Get filter options for courses
  getCourseFilters: async () => {
    return await makeAuthenticatedRequest('/api/v1/students/courses/filters', {
      method: 'GET'
    });
  }
};

export default courseAPI;
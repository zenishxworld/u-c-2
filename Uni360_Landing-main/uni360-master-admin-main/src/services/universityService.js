// universityService.js (PATCHED — server-side pagination + filter + search)
import { makeAuthenticatedRequest } from './tokenService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const universityAPI = {

  // -----------------------------
  // 1. Get all universities (List API)
  //    Supports:
  //      GET /api/v1/universities?page=0&size=20
  //      GET /api/v1/universities?page=0&size=20&country=GB
  //      GET /api/v1/universities?page=0&size=20&search=Oxford
  // -----------------------------
  getUniversities: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // ── Pagination (always send, default page=0 size=20) ──────────────────
    queryParams.append('page', params.page ?? 0);
    queryParams.append('size', params.size ?? 20);

    // ── Search ────────────────────────────────────────────────────────────
    if (params.search && String(params.search).trim()) {
      queryParams.append('search', String(params.search).trim());
    }

    // ── Filters ───────────────────────────────────────────────────────────
    if (params.country  && params.country  !== 'all') queryParams.append('country',  params.country);
    if (params.ranking  && params.ranking  !== 'all') queryParams.append('ranking',  params.ranking);
    if (params.type     && params.type     !== 'all') queryParams.append('type',     params.type);
    if (params.institutionType && params.institutionType !== 'all') {
      queryParams.append('institutionType', params.institutionType);
    }
    if (params.tuition  && params.tuition  !== 'all') queryParams.append('tuition',  params.tuition);
    if (params.status   && params.status   !== 'all') queryParams.append('status',   params.status);

    if (params.scholarshipsAvailable !== '' && params.scholarshipsAvailable !== undefined) {
      queryParams.append('scholarshipsAvailable', params.scholarshipsAvailable);
    }

    const endpoint = `/api/v1/universities?${queryParams.toString()}`;
    return await makeAuthenticatedRequest(endpoint, { method: 'GET' });
  },

  // -----------------------------
  // 2. Search Universities (POST /search)
  //    Used as a fallback when the backend does not support ?search= on the list API.
  //    BACKEND EXPECTS LOWERCASE COUNTRY.
  // -----------------------------
  searchUniversities: async (searchCriteria = {}) => {
    const normalizedBody = {
      ...searchCriteria,
      country: searchCriteria.country?.toLowerCase() || undefined,
    };
    return await makeAuthenticatedRequest('/api/v1/universities/search', {
      method: 'POST',
      body: normalizedBody,
    });
  },

  // -----------------------------
  // 3. Get university by ID
  // -----------------------------
  getUniversityById: async (universityId) => {
    return await makeAuthenticatedRequest(`/api/v1/universities/${universityId}`, {
      method: 'GET',
    });
  },

  // -----------------------------
  // 4. Get university by code
  // -----------------------------
  getUniversityByCode: async (code) => {
    return await makeAuthenticatedRequest(`/api/v1/universities/code/${code}`, {
      method: 'GET',
    });
  },

  // -----------------------------
  // 5. Update University (PUT)
  // -----------------------------
  updateUniversity: async (universityId, data) => {
    const token = localStorage.getItem('uni360_access_token') || localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/api/v1/universities/${universityId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Client-ID': 'uniflow',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  // -----------------------------
  // 6. Get Filters
  // -----------------------------
  getFilters: async () => {
    return await makeAuthenticatedRequest('/api/v1/universities/filters', {
      method: 'GET',
    });
  },

  // -----------------------------
// 7. Create University (POST)
// -----------------------------
createUniversity: async (data) => {
  const token = localStorage.getItem('uni360_access_token') || localStorage.getItem('token');
  const BASE_URL_LOCAL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const response = await fetch(`${BASE_URL_LOCAL}/api/v1/universities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Client-ID': 'uniflow',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Create failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
},

  // -----------------------------
  // 7. Upload CSV (special case)
  // -----------------------------
  uploadUniversitiesCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('uni360_access_token') || localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/api/university/excel/universities/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Client-ID': 'uniflow',
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  },
};

export default universityAPI;
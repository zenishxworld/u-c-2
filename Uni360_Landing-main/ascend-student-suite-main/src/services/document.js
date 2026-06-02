// Fixed documents.js API file
import { handleApiError } from './utils.js';
import { makeAuthenticatedRequest, getAuthHeaders } from './tokenService.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * API Helper function to handle requests with proper headers and error handling
 * Now uses centralized token service
 */
const apiRequest = async (endpoint, options = {}) => {
  let url = `${BASE_URL}${endpoint}`;

  if (!url.includes('ngrok-skip-browser-warning')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}ngrok-skip-browser-warning=true`;
  }

  const isFormData =
    options?.body && typeof FormData !== 'undefined' && options.body instanceof FormData;

  try {
    console.log(`[Documents] Making API request to: ${url}`);
    
    // For FormData, we need to handle headers differently
    if (isFormData) {
      const headers = await getAuthHeaders();
      // Remove Content-Type for FormData - browser will set it with boundary
      delete headers['Content-Type'];
      
      const config = {
        method: options.method || 'POST',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: options.body,
      };
      
      const response = await fetch(url, config);
      console.log(`[Documents] API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`HTTP error! status: ${response.status}`, errorData);
        const err = handleApiError({ status: response.status, ...errorData });
        err.status = response.status;
        throw err;
      }

      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await response.json();
        console.log(`[Documents] API response:`, data);
        return data;
      }
      return await response.blob();
    }
    
    // For regular JSON requests, use makeAuthenticatedRequest
    const config = {
      method: options.method || 'GET',
      ...options,
    };
    
    const data = await makeAuthenticatedRequest(endpoint, config);
    console.log(`[Documents] API response:`, data);
    return data;
  } catch (error) {
    console.error(`[Documents] API request failed for ${endpoint}:`, error);
    throw handleApiError(error);
  }
};

// Valid document types for each country
const DOCUMENT_TYPES = {
  germany: new Set([
    'passport',
    'offer_letter',
    'bank_statement',
    'student_visa_form',
    'english_proficiency',
    'academic_transcripts',
    'passport_photos',
    'sop',
    'cv_resume',
    'lor',
    'travel_insurance',
    'visa_fee_receipt',
    'german_proficiency',
    'blocked_account',
    'accommodation_proof_germany',
    'flight_reservation',
    'invitation_letter',
    'no_objection_letter',
    'aps_certificate',
  ]),
  uk: new Set([
    'passport',
    'offer_letter',
    'bank_statement',
    'student_visa_form',
    'english_proficiency',
    'academic_transcripts',
    'passport_photos',
    'sop',
    'cv_resume',
    'lor',
    'travel_insurance',
    'visa_fee_receipt',
    'cas_confirmation',
    'tuberculosis_test',
    'health_surcharge_payment',
    'proof_intent_return',
  ]),
  common: new Set([
    'passport',
    'offer_letter',
    'bank_statement',
    'student_visa_form',
    'english_proficiency',
    'academic_transcripts',
    'passport_photos',
    'sop',
    'cv_resume',
    'lor',
    'travel_insurance',
    'visa_fee_receipt',
  ]),
};

export const getDocumentStatusOverview = async () => {
  try {
    const response = await apiRequest('/document-status-overview/');
    return response;
  } catch (error) {
    console.error('Get document status overview error:', error);
    return {
      applications: [],
      summary: {
        total_applications: 0,
        total_documents_uploaded: 0,
        pending_verification: 0,
        approved_documents: 0,
        rejected_documents: 0,
        average_completion: 0,
      },
    };
  }
};

const resolveApplicationId = async (country) => {
  const overview = await getDocumentStatusOverview();
  const apps = Array.isArray(overview?.applications) ? overview.applications : [];
  if (!apps.length) return null;

  const want = (country || '').toString().toLowerCase();
  const match = (c) => {
    const s = (c || '').toLowerCase();
    if (['de', 'ger', 'germany'].includes(want)) return ['germany', 'de', 'ger'].includes(s);
    if (['uk', 'gb', 'united_kingdom', 'great_britain'].includes(want))
      return ['uk', 'gb', 'united_kingdom', 'great_britain'].includes(s);
    return false;
  };

  const pool = want ? apps.filter((a) => match(a.country)) : apps;
  const active = pool.find(
    (a) => a.total_uploaded_documents || ['submitted'].includes(a.status),
  );
  return (active || pool[0])?.application_id || null;
};

/**
 * Get document requirements for an application
 */
export const getDocumentTemplates = async (opts = {}) => {
  try {
    let applicationId = opts.application_id || (await resolveApplicationId(opts.country));
    if (!applicationId) throw new Error('application_id is required');

    const qs = new URLSearchParams({ application_id: String(applicationId) }).toString();
    const response = await apiRequest(`/documents/requirements/?${qs}`);

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.requirements)) return response.requirements;
    return [];
  } catch (error) {
    console.error('Get document templates error:', error);
    throw handleApiError(error);
  }
};

/**
 * Get uploaded documents for an application
 */
export const getApplicationDocuments = async (applicationId) => {
  try {
    if (!applicationId) throw new Error('application_id is required');

    const qs = new URLSearchParams({ application_id: String(applicationId) }).toString();
    const response = await apiRequest(`/documents/?${qs}`);

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Get application documents error:', error);
    throw handleApiError(error);
  }
};

/**
 * Validate document type for country
 */
const validateDocumentType = (documentType, country) => {
  const countryLower = (country || 'common').toLowerCase();
  let validTypes = DOCUMENT_TYPES.common;

  if (countryLower === 'germany') {
    validTypes = DOCUMENT_TYPES.germany;
  } else if (countryLower === 'uk' || countryLower === 'united_kingdom') {
    validTypes = DOCUMENT_TYPES.uk;
  }

  if (!validTypes.has(documentType)) {
    const validList = Array.from(validTypes).join(', ');
    throw new Error(
      `Invalid document type "${documentType}" for ${countryLower}. Valid types: ${validList}`,
    );
  }
};

/**
 * SINGLE DOCUMENT UPLOAD - Uses correct endpoint: /documents/upload_document/
 */
export const uploadDocument = async ({ application_id, field, file, country }) => {
  if (!application_id) throw new Error('application_id is required');
  if (!field) throw new Error('field (document_type) is required');
  if (!file) throw new Error('file is required');

  // Validate document type
  try {
    validateDocumentType(field, country);
  } catch (error) {
    throw handleApiError({ status: 400, error: error.message });
  }

  const fd = new FormData();
  fd.append('application_id', application_id);
  fd.append('document_type', field); // Backend expects 'document_type'
  fd.append('file', file);

  // Use the correct endpoint: /documents/upload_document/
  return await apiRequest('/documents/upload_document/', {
    method: 'POST',
    body: fd,
  });
};

/**
 * BULK DOCUMENT UPLOAD - Uses correct endpoint: /documents/bulk_upload/
 */
export const uploadBulkDocuments = async (documentsList) => {
  if (!Array.isArray(documentsList) || !documentsList.length) {
    throw new Error('No documents to upload');
  }

  // Ensure single application_id
  const appId = documentsList[0].application_id;
  if (!appId) throw new Error('application_id is required');

  const mixed = documentsList.some((d) => d.application_id !== appId);
  if (mixed) throw new Error('All documents must share the same application_id for bulk upload');

  // Get country for validation
  const country = documentsList[0].country;

  const fd = new FormData();
  fd.append('application_id', appId);

  documentsList.forEach((doc) => {
    const documentType = doc.field;
    const file = doc.file;

    if (documentType && file) {
      // Validate document type
      try {
        validateDocumentType(documentType, country);
        fd.append(documentType, file); // e.g., passport=<file>, sop=<file>
      } catch (error) {
        console.warn(`Skipping invalid document type: ${documentType}`, error.message);
        // Skip invalid document types instead of failing entire upload
      }
    }
  });

  // Use the correct endpoint: /documents/bulk_upload/
  return await apiRequest('/documents/bulk_upload/', {
    method: 'POST',
    body: fd,
  });
};

/**
 * UK Documents Upload Helper
 */
export const uploadUKDocuments = async (documentsData) => {
  // Single document upload
  if (documentsData?.field && documentsData?.file) {
    return uploadDocument({
      application_id: documentsData.application_id,
      field: documentsData.field,
      file: documentsData.file,
      country: 'uk',
    });
  }

  // Multiple documents - convert to array format
  const docs = [];
  const appId = documentsData.application_id;

  Object.keys(documentsData).forEach((key) => {
    if (key !== 'application_id' && documentsData[key] instanceof File) {
      docs.push({
        application_id: appId,
        field: key,
        file: documentsData[key],
        country: 'uk',
      });
    }
  });

  if (!docs.length) {
    throw new Error('No valid document files found in payload');
  }

  return docs.length === 1 ? uploadDocument(docs[0]) : uploadBulkDocuments(docs);
};

/**
 * Germany Documents Upload Helper
 */
export const uploadGermanyDocuments = async (documentsData) => {
  // Single document upload
  if (documentsData?.field && documentsData?.file) {
    return uploadDocument({
      application_id: documentsData.application_id,
      field: documentsData.field,
      file: documentsData.file,
      country: 'germany',
    });
  }

  // Multiple documents - convert to array format
  const docs = [];
  const appId = documentsData.application_id;

  Object.keys(documentsData).forEach((key) => {
    if (key !== 'application_id' && documentsData[key] instanceof File) {
      docs.push({
        application_id: appId,
        field: key,
        file: documentsData[key],
        country: 'germany',
      });
    }
  });

  if (!docs.length) {
    throw new Error('No valid document files found in payload');
  }

  return docs.length === 1 ? uploadDocument(docs[0]) : uploadBulkDocuments(docs);
};

/**
 * Get view URL for a document
 */
export const getDocumentViewUrl = async (documentId) => {
  try {
    if (!documentId) throw new Error('document_id is required');
    
    const response = await apiRequest(`/documents/${documentId}/view-url/`, {
      method: 'GET',
    });
    
    return response;
  } catch (error) {
    console.error('Get document view URL error:', error);
    throw handleApiError(error);
  }
};

/**
 * Download document
 */
export const downloadDocumentById = async (documentId) => {
  const metaResponse = await apiRequest(`/documents/${documentId}/download/`);

  // Fetch the actual file using the file_url
  const headers = await getAuthHeaders();
  const fileResponse = await fetch(metaResponse.file_url, {
    method: 'GET',
    headers: headers,
  });

  if (!fileResponse.ok) {
    const errorData = await fileResponse.json().catch(() => ({}));
    throw handleApiError({ status: fileResponse.status, ...errorData });
  }

  return await fileResponse.blob();
};

/**
 * File validation functions
 */
export const validateFileType = (
  file,
  allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
) => allowedTypes.includes(file.type);

export const validateFileSize = (file, maxSizeMB = 10) =>
  file.size <= maxSizeMB * 1024 * 1024;

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Transform document status data for UI
 */
export const transformDocumentStatusForUI = (statusData) => {
  if (!statusData || !statusData.applications) {
    return {
      pending: [],
      uploaded: [],
      reupload: [],
      stats: { pending: 0, uploaded: 0, reupload: 0, verified: 0 },
    };
  }

  const pending = statusData.applications
    .filter((a) => a.total_required_documents > a.total_uploaded_documents)
    .map((a) => ({
      id: a.application_id,
      name: `${a.country} Documents`,
      type: a.country === 'UK' ? 'Academic' : 'Visa',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      priority: 'high',
      description: `Required documents for ${a.university_name}`,
      applicationId: a.application_id,
      universityName: a.university_name,
      country: a.country,
    }));

  const uploaded = statusData.applications
    .filter((a) => a.total_uploaded_documents > 0 && a.rejected_documents === 0)
    .map((a) => ({
      id: a.application_id,
      name: `${a.country} Documents`,
      type: a.country === 'UK' ? 'Academic' : 'Visa',
      uploadDate: new Date().toLocaleDateString(),
      status: a.approved_documents > 0 ? 'approved' : 'pending',
      size: '2.1 MB',
      applicationId: a.application_id,
      universityName: a.university_name,
      country: a.country,
    }));

  const reupload = statusData.applications
    .filter((a) => a.rejected_documents > 0)
    .map((a) => ({
      id: a.application_id,
      name: `${a.country} Documents`,
      type: a.country === 'UK' ? 'Academic' : 'Visa',
      uploadDate: new Date().toLocaleDateString(),
      status: 'rejected',
      reason: 'Document requires revision. Please check with admin.',
      size: '1.8 MB',
      applicationId: a.application_id,
      universityName: a.university_name,
      country: a.country,
    }));

  return {
    pending,
    uploaded,
    reupload,
    stats: {
      pending: pending.length,
      uploaded: uploaded.length,
      reupload: reupload.length,
      verified: statusData.summary?.approved_documents || 0,
    },
  };
};

/**
 * Additional helper functions from original code
 */
export const getNotifications = async () => {
  try {
    const response = await apiRequest('/notifications/');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) =>
  apiRequest(`/notifications/${notificationId}/mark_read/`, { method: 'PUT' });

export const markAllNotificationsAsRead = async () =>
  apiRequest('/notifications/mark_all_read/', { method: 'PUT' });

export const getReusableDocuments = async () => {
  try {
    // âœ… Align with your API spec: /api/student/documents/reusable/
    const response = await apiRequest('/documents/reusable/');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Get reusable documents error:', error);
    return [];
  }
};

// Aliases for backward compatibility
export const getDocumentRequirements = async (opts = {}) => getDocumentTemplates(opts);
export const getDocumentTemplatesByCountry = async (country) =>
  getDocumentTemplates({ country });

// Export all functions
export default {
  // Requirements
  getDocumentTemplates,
  getDocumentTemplatesByCountry,
  getDocumentRequirements,
  getDocumentStatusOverview,

  // Documents
  getApplicationDocuments,

  // Uploads
  uploadDocument,
  uploadBulkDocuments,
  uploadUKDocuments,
  uploadGermanyDocuments,

  // Downloads
  downloadDocumentById,
   getDocumentViewUrl,

  // Validation helpers
  validateFileType,
  validateFileSize,
  formatFileSize,
  validateDocumentType,
  transformDocumentStatusForUI,

  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // Reusable documents
  getReusableDocuments,
};
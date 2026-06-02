import axios from 'axios';
import { getAccessToken } from '../utils/tokenStore'; 

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 1. Get all pending documents for review
 * @returns {Promise<Object>} Returns pending documents
 */
export const getPendingDocuments = async () => {
  try {
    const response = await api.get('/api/v1/admin/documents/workflow/pending-review');
    
    if (response.status === 200) {
      const respData = response.data;
      const dataArray = Array.isArray(respData) ? respData : 
                        (respData?.data && Array.isArray(respData.data)) ? respData.data : 
                        (respData?.workflows && Array.isArray(respData.workflows)) ? respData.workflows : [];
      return {
        success: true,
        data: dataArray
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch pending documents'
    };
  } catch (error) {
    console.error('Error fetching pending documents:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch pending documents',
      error
    };
  }
};

/**
 * Get all reviewed documents
 * @returns {Promise<Object>} Returns reviewed documents
 */
export const getReviewedDocuments = async () => {
  try {
    const response = await api.get('/api/v1/admin/documents/workflow/reviewed');
    
    if (response.status === 200) {
      const respData = response.data;
      const dataArray = Array.isArray(respData) ? respData : 
                        (respData?.data && Array.isArray(respData.data)) ? respData.data : 
                        (respData?.workflows && Array.isArray(respData.workflows)) ? respData.workflows : [];
      return {
        success: true,
        data: dataArray
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch reviewed documents'
    };
  } catch (error) {
    console.error('Error fetching reviewed documents:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch reviewed documents',
      error
    };
  }
};

/**
 * Get all documents for a specific student (admin)
 * @param {number|string} studentId
 */
export const getStudentDocuments = async (studentId) => {
  try {
    const response = await api.get(`/api/v1/admin/students/${studentId}/documents`);
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.documents || [],
        totalDocuments: response.data.totalDocuments
      };
    }
    return { success: false, message: 'Failed to fetch student documents' };
  } catch (error) {
    console.error('Error fetching student documents:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch student documents',
      error
    };
  }
};

/**
 * Get students list with name and email
 * @returns {Promise<Object>} Returns students list
 */
export const getStudentsList = async () => {
  try {
    // First page to get total pages
    const firstResponse = await api.get('/api/v1/notifications/students?page=0&size=50');
    if (firstResponse.status !== 200) {
      return { success: false, message: 'Failed to fetch students list' };
    }

    const firstData = firstResponse.data.data;
    let students = firstData.students || [];
    const totalPages = firstData.pagination?.totalPages || 1;

    // Fetch remaining pages if any
    if (totalPages > 1) {
      const pageRequests = [];
      for (let page = 1; page < totalPages; page++) {
        pageRequests.push(api.get(`/api/v1/notifications/students?page=${page}&size=50`));
      }
      const responses = await Promise.all(pageRequests);
      responses.forEach(res => {
        if (res.status === 200) {
          students = students.concat(res.data.data.students || []);
        }
      });
    }

    return { success: true, data: students };
  } catch (error) {
    console.error('Error fetching students list:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch students list',
      error
    };
  }
};

/**
 * 2. Update document workflow status (approve/reject)
 * @param {string} workflowId - The workflow ID
 * @param {Object} payload - Status update data
 * @returns {Promise<Object>} Returns update result
 */
export const updateDocumentStatus = async (workflowId, payload) => {
  try {
    console.log('Updating document status:', workflowId, payload);
    
    const response = await api.put(
      `/api/v1/admin/documents/workflow/${workflowId}/status`,
      payload
    );
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Document status updated successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to update document status'
    };
  } catch (error) {
    console.error('Error updating document status:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update document status',
      error
    };
  }
};

/**
 * 3. Upload a document
 * @param {File} file - The file to upload
 * @param {string} documentType - Type of document (PASSPORT, TRANSCRIPT, etc.)
 * @param {string} purpose - Purpose of upload (APPLICATION, STUDENT_DOCUMENT, etc.)
 * @returns {Promise<Object>} Returns upload result
 */
export const uploadDocument = async (file, documentType = 'GENERAL', purpose = 'APPLICATION') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('purpose', purpose);

    const response = await axios.post(
      `${BASE_URL}/api/v1/documents/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Document uploaded successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to upload document'
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload document',
      error
    };
  }
};

/**
 * 4. Get my documents (for student/user)
 * @returns {Promise<Object>} Returns user's documents
 */
export const getMyDocuments = async () => {
  try {
    const response = await api.get('/api/v1/documents/my');
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data.documents || [],
        statistics: response.data.statistics,
        count: response.data.count
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch documents'
    };
  } catch (error) {
    console.error('Error fetching my documents:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch documents',
      error
    };
  }
};

/**
 * 5. Get document view URL
 * @param {string} documentId - The document ID
 * @returns {Promise<Object>} Returns view URL
 */
export const getDocumentViewUrl = async (documentId) => {
  try {
    const response = await api.get(`/api/v1/documents/${documentId}/view-url`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        viewUrl: response.data.view_url,
        expiresIn: response.data.expires_in
      };
    }
    
    return {
      success: false,
      message: 'Failed to get view URL'
    };
  } catch (error) {
    console.error('Error getting document view URL:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get view URL',
      error
    };
  }
};

/**
 * 6. Delete a document
 * @param {string} documentId - The document ID
 * @returns {Promise<Object>} Returns deletion result
 */
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/api/v1/documents/${documentId}`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Document deleted successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to delete document'
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete document',
      error
    };
  }
};

/**
 * Helper: Download document
 * @param {string} fileUrl - The file URL
 * @param {string} fileName - The file name
 */
export const downloadDocument = async (fileUrl, fileName) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading document:', error);
    return {
      success: false,
      message: 'Failed to download document',
      error
    };
  }
};

export default {
  getPendingDocuments,
  getReviewedDocuments,
  updateDocumentStatus,
  getStudentDocuments, 
  getStudentsList, 
  uploadDocument,
  getMyDocuments,
  getDocumentViewUrl,
  deleteDocument,
  downloadDocument
};
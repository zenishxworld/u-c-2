// src/services/documentService.js

import axios from "axios";
import tokenService from "./tokenService";

// Get base URL from .env file - VITE uses import.meta.env
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://backend.uni360degree.com";

/**
 * Document Service
 * Handles all document-related API calls with authentication
 * Uses tokenService to get the access token
 */

const documentService = {
  /**
   * Create axios instance with auth headers
   * @returns {Promise<AxiosInstance>} - Configured axios instance
   */
  getAxiosInstance: async () => {
    try {
      const token = await tokenService.getAccessToken();
      
      return axios.create({
        baseURL: BASE_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Client-ID': 'uniflow',
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: 30000,
      });
    } catch (error) {
      throw new Error('Failed to get authentication token');
    }
  },

  /**
   * Fetch all documents for a specific user
   * @param {number} userId - The user ID to fetch documents for
   * @returns {Promise<Object>} - Contains documents data with user info
   */
  fetchUserDocuments: async (userId) => {
    try {
      const apiUrl = `/api/v1/superadmin/dashboard/users/${userId}/documents`;
      // Get axios instance with auth token
      const axiosInstance = await documentService.getAxiosInstance();
      
      const response = await axiosInstance.get(apiUrl);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: You do not have permission to access these documents.');
      } else if (error.response?.status === 404) {
        throw new Error('User documents not found.');
      }
      throw error;
    }
  },

  /**
   * Transform API response to component-ready format
   * @param {Object} apiResponse - Response from the API
   * @returns {Object} - Transformed data with categorized documents
   */
  transformApiResponse: (apiResponse) => {
    if (!apiResponse || !apiResponse.documents) {
      return {
        user: null,
        allDocuments: [],
        pendingDocuments: [],
        reuploadDocuments: [],
        verifiedDocuments: [],
        stats: {
          total: 0,
          pending: 0,
          reupload: 0,
          verified: 0,
        },
      };
    }

    const documents = apiResponse.documents.map((doc) => ({
      id: doc.uploadId,
      uploadId: doc.uploadId,
      workflowId: doc.workflowId,
      type: doc.documentType.toLowerCase(),
      documentType: doc.documentType,
      category: doc.documentCategory,
      fileType: doc.fileType,
      fileName: doc.originalFilename,
      fileUrl: doc.fileUrl,
      size: doc.formattedFileSize || "Unknown",
      uploadedAt: doc.uploadedAt,
      reviewedAt: doc.reviewedAt,
      reviewedBy: doc.reviewedBy,
      status: doc.reviewStatus,
      verificationStatus: doc.verificationStatus,
      notes: doc.verificationNotes,
      isRequired: doc.isRequired,
      deadline: doc.submissionDeadline,
      version: doc.version,
    }));

    // Categorize documents
    const pendingDocuments = documents.filter(
      (doc) => !doc.reviewedAt && doc.uploadedAt
    );

    const reuploadDocuments = documents.filter(
      (doc) => doc.status === "REJECTED" || doc.verificationStatus === "UNVERIFIED"
    );

    const verifiedDocuments = documents.filter(
      (doc) => doc.verificationStatus === "VERIFIED" && doc.status === "APPROVED"
    );

    return {
      user: {
        userId: apiResponse.userId,
        fullName: apiResponse.fullName,
        email: apiResponse.email,
        userType: apiResponse.userType,
      },
      allDocuments: documents,
      pendingDocuments,
      reuploadDocuments,
      verifiedDocuments,
      stats: {
        total: documents.length,
        pending: pendingDocuments.length,
        reupload: reuploadDocuments.length,
        verified: verifiedDocuments.length,
      },
    };
  },

  /**
   * Get documents by status category
   * @param {Array} documents - Array of document objects
   * @param {string} category - "all", "pending", "reupload", "verified"
   * @returns {Array} - Filtered documents
   */
  getDocumentsByCategory: (documents, category = "all") => {
    switch (category) {
      case "pending":
        return documents.filter((doc) => !doc.reviewedAt && doc.uploadedAt);
      case "reupload":
        return documents.filter(
          (doc) => doc.status === "REJECTED" || doc.verificationStatus === "UNVERIFIED"
        );
      case "verified":
        return documents.filter(
          (doc) => doc.verificationStatus === "VERIFIED" && doc.status === "APPROVED"
        );
      case "all":
      default:
        return documents;
    }
  },

  /**
   * Get status badge info
   * @param {string} verificationStatus - Verification status
   * @param {string} reviewStatus - Review status
   * @returns {Object} - Badge info with color and label
   */
  getStatusInfo: (verificationStatus, reviewStatus) => {
    if (reviewStatus === "REJECTED") {
      return {
        status: "reupload",
        label: "Reupload Required",
        color: "red",
        icon: "exclamation",
      };
    }

    if (!verificationStatus || verificationStatus === "UNVERIFIED") {
      return {
        status: "pending",
        label: "Pending Review",
        color: "yellow",
        icon: "clock",
      };
    }

    if (verificationStatus === "VERIFIED" && reviewStatus === "APPROVED") {
      return {
        status: "verified",
        label: "Verified",
        color: "green",
        icon: "check",
      };
    }

    return {
      status: "pending",
      label: "In Progress",
      color: "blue",
      icon: "document",
    };
  },

  /**
   * Format date to readable string
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  formatDate: (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Format date with time
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date with time
   */
  formatDateTime: (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Check if document deadline is approaching
   * @param {string} deadline - Deadline date string
   * @param {number} daysThreshold - Days before deadline to consider approaching
   * @returns {boolean} - True if deadline is approaching
   */
  isDeadlineApproaching: (deadline, daysThreshold = 3) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= daysThreshold && daysUntilDeadline > 0;
  },

  /**
   * Check if document deadline has passed
   * @param {string} deadline - Deadline date string
   * @returns {boolean} - True if deadline has passed
   */
  isDeadlinePassed: (deadline) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  },

  /**
   * Get document statistics
   * @param {Array} documents - Array of document objects
   * @returns {Object} - Document statistics
   */
  getDocumentStats: (documents) => {
    const stats = {
      total: documents.length,
      verified: 0,
      unverified: 0,
      rejected: 0,
      approved: 0,
      pending: 0,
      byCategory: {},
    };

    documents.forEach((doc) => {
      // Count by verification status
      if (doc.verificationStatus === "VERIFIED") {
        stats.verified += 1;
      } else if (doc.verificationStatus === "UNVERIFIED") {
        stats.unverified += 1;
      }

      // Count by review status
      if (doc.status === "APPROVED") {
        stats.approved += 1;
      } else if (doc.status === "REJECTED") {
        stats.rejected += 1;
      }

      // Count pending
      if (!doc.reviewedAt && doc.uploadedAt) {
        stats.pending += 1;
      }

      // Count by category
      const category = doc.category;
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = 0;
      }
      stats.byCategory[category] += 1;
    });

    return stats;
  },
};

export default documentService;
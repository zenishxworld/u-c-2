import { makeAuthenticatedRequest } from './tokenService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Notification API Service
 * Handles all notification-related API calls
 */

/**
 * Get Notification Overview
 * @returns {Promise<Object>} Notification overview data
 */
export const getNotificationOverview = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      '/api/v1/superadmin/dashboard/notifications/overview',
      { method: 'GET' }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Broadcast Notification
 * @param {Object} notificationData - Notification data to broadcast
 * @returns {Promise<Object>} Broadcast response
 */
export const broadcastNotification = async (notificationData) => {
  try {
    const response = await makeAuthenticatedRequest(
      '/api/v1/superadmin/dashboard/notifications/broadcast',
      {
        method: 'POST',
        body: notificationData,
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Notification Analytics
 * @param {Object} params - Query parameters for analytics
 * @param {string} params.period_type - LAST_24_HOURS, LAST_7_DAYS, LAST_30_DAYS, CUSTOM
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @param {string} params.user_type - STUDENT, ADMIN, ALL
 * @param {string} params.notification_type - Specific notification type
 * @returns {Promise<Object>} Analytics data
 */
export const getNotificationAnalytics = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add parameters if provided
    if (params.period_type) queryParams.append('period_type', params.period_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.user_type) queryParams.append('user_type', params.user_type);
    if (params.notification_type) queryParams.append('notification_type', params.notification_type);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/v1/superadmin/dashboard/notifications/analytics${queryString ? `?${queryString}` : ''}`;
    
    const response = await makeAuthenticatedRequest(endpoint, { method: 'GET' });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Notification Templates
 * @param {Object} params - Query parameters for templates
 * @param {number} params.page - Page number
 * @param {number} params.size - Page size
 * @param {string} params.category - Template category
 * @param {string} params.status - Template status (ACTIVE, INACTIVE)
 * @returns {Promise<Object>} Templates data
 */
export const getNotificationTemplates = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.size !== undefined) queryParams.append('size', params.size);
    if (params.category) queryParams.append('category', params.category);
    if (params.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = `/api/v1/superadmin/dashboard/notifications/templates${queryString ? `?${queryString}` : ''}`;
    
    const response = await makeAuthenticatedRequest(endpoint, { method: 'GET' });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Students List
 * @returns {Promise<Object>} Students data
 */
export const getStudents = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      '/api/v1/students',
      { method: 'GET' }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Admins List
 * @returns {Promise<Object>} Admins data
 */
export const getAdmins = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      '/api/v1/admins',
      { method: 'GET' }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// Export all functions as default object
export default {
  getNotificationOverview,
  broadcastNotification,
  getNotificationAnalytics,
  getNotificationTemplates,
  getStudents,
  getAdmins,
};
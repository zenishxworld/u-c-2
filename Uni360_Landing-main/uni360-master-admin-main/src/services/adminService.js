import api from "./api";

/**
 * Admin API Service
 * Handles all API calls related to admin management
 */

// Fetch all admins with optional pagination
export const fetchAdmins = async (params = {}) => {
  try {
    const response = await api.get('/api/v1/superadmin/admins', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch filtered list of admins
// This should already be there, just verify it exists
export const fetchAdminFilters = async (params = {}) => {
  try {
    const response = await api.get('/api/v1/superadmin/admins/filters', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Fetch permissions for a specific admin
export const fetchAdminPermissions = async (adminUuid) => {
  try {
    const response = await api.get(`/api/v1/superadmin/admins/${adminUuid}/permissions`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update admin permissions
export const updateAdminPermissions = async (adminUuid, permissionsData) => {
  try {
    const response = await api.put(
      `/api/v1/superadmin/admins/${adminUuid}/permissions`,
      permissionsData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch all available permissions in the system
export const fetchAllPermissions = async () => {
  try {
    const response = await api.get('/api/v1/superadmin/permissions');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to get client IP (for permission updates)
export const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return '0.0.0.0';
  }
};

// This should already be there, just verify it exists

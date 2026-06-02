import api from "./api"; // adjust path if your axios instance lives elsewhere

/**
 * Payment Service
 * Handles all payment-related API calls for the superadmin dashboard.
 */

/**
 * Fetch all payments across the entire system.
 * GET /api/v1/superadmin/dashboard/payments
 *
 * @returns {Promise<Array>} Array of payment objects
 */
export const getAllSystemPayments = async () => {
  const response = await api.get(
    "/api/v1/superadmin/dashboard/payments"
  );
  return response.data; // Array of all payments
};
// Payment Service — Razorpay integration via backend
// Amount is always in paise (INR). 100 paise = ₹1.
import { makeAuthenticatedRequest } from './tokenService.js';

/**
 * Internal helper — authenticated POST/GET to payment endpoints
 */
const paymentRequest = async (endpoint, options = {}) => {
  try {
    // Reuse the app-wide authenticated request so the Bearer token is included
    const result = await makeAuthenticatedRequest(endpoint, {
      method: options.method || 'GET',
      body: options.body,   // makeAuthenticatedRequest handles JSON.stringify
      headers: options.headers,
    });
    return result;
  } catch (error) {
    // Re-surface with a readable message
    throw new Error(error?.message || 'Payment request failed');
  }
};

// ── 1. Health check ──────────────────────────────────────────────────────────
export const checkPaymentHealth = async () => {
  try {
    const data = await paymentRequest('/api/v1/payment/health');
    return data?.data === 'OK';
  } catch {
    return false;
  }
};

// ── 2. Create Razorpay order ─────────────────────────────────────────────────
/**
 * @param {object} payload
 * @param {number} payload.amount   – in paise (100 = ₹1)
 * @param {string} [payload.currency] – default 'INR'
 * @param {string} [payload.receipt]
 * @param {object} [payload.notes]
 * @returns {Promise<{orderId, keyId, amount, currency, receipt}>}
 */
export const createOrder = async (payload) => {
  const body = {
    amount: payload.amount ?? 100,
    currency: payload.currency ?? 'INR',
    receipt: payload.receipt ?? `rcpt_${Date.now().toString().slice(-10)}`,
    notes: payload.notes ?? {},
    // Backend requires snake_case "payment_type" as a top-level field
    payment_type: payload.paymentType || 'OTHER',
  };

  const data = await paymentRequest('/api/v1/payment/create-order', {
    method: 'POST',
    body,
  });

  if (!data?.success) throw new Error(data?.message || 'Failed to create order');
  return data.data; // { orderId, keyId, amount, currency, receipt }
};

// ── 3. Verify payment signature ───────────────────────────────────────────────
/**
 * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature }} payload
 * @returns {Promise<boolean>} true if verified
 */
export const verifyPayment = async (payload) => {
  const data = await paymentRequest('/api/v1/payment/verify', {
    method: 'POST',
    body: payload,
  });

  if (!data?.success) throw new Error(data?.message || 'Payment verification failed');
  return data?.data?.verified === true;
};

// ── 4. Fetch payment history ──────────────────────────────────────────────────
/**
 * @param {string} [type] – optional payment type filter (e.g. UNIVERSITY_PAYMENT, AI_TOOLS)
 * @returns {Promise<Array>} list of past payments
 */
export const getPaymentHistory = async (type) => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  const data = await paymentRequest(`/api/v1/payment/history${qs}`);
  // Return the array directly; caller handles empty state
  if (data?.success) return data.data ?? [];
  return Array.isArray(data) ? data : (data?.data ?? []);
};
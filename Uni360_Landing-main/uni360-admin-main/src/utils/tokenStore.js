// utils/tokenStore.js - FIXED JAVASCRIPT VERSION
// ────────────────────────────────
// ENHANCED TOKEN STORAGE WITH VALIDATION
// ────────────────────────────────

const LS = {
  access: "uni_access_token",
  refresh: "uni_refresh_token",
  expiry: "uni_token_expiry",
  user: "uni_user",
};

/**
 * ✅ Save tokens to localStorage with expiry
 * @param {Object} params
 * @param {string} params.accessToken
 * @param {string} params.refreshToken
 * @param {number} params.expiresIn - Expiry time in seconds
 */
export function saveTokens({ accessToken, refreshToken, expiresIn }) {
  const expiresAt = Date.now() + Number(expiresIn || 3600) * 1000;

  localStorage.setItem(LS.access, accessToken || "");
  localStorage.setItem(LS.refresh, refreshToken || "");
  localStorage.setItem(LS.expiry, String(expiresAt));
}

/**
 * ✅ Get access token (returns null if expired)
 * @returns {string | null}
 */
export function getAccessToken() {
  const token = localStorage.getItem(LS.access);
  if (!token) return null;

  // Check if token is expired
  if (isTokenExpired()) {
    console.warn("⚠️ Token expired, clearing auth data");
    clearTokens();
    return null;
  }

  return token;
}

/**
 * ✅ Get refresh token
 * @returns {string | null}
 */
export function getRefreshToken() {
  return localStorage.getItem(LS.refresh);
}

/**
 * ✅ Check if token is expired
 * @returns {boolean}
 */
export function isTokenExpired() {
  const expiry = localStorage.getItem(LS.expiry);
  if (!expiry) return true;

  const expiryTime = Number(expiry);
  const now = Date.now();
  
  // Add 60 second buffer to refresh before actual expiry
  return now >= (expiryTime - 60000);
}

/**
 * ✅ Get time until token expires (in ms)
 * @returns {number}
 */
export function getTimeUntilExpiry() {
  const expiry = localStorage.getItem(LS.expiry);
  if (!expiry) return 0;

  const expiryTime = Number(expiry);
  const now = Date.now();
  
  return Math.max(0, expiryTime - now);
}

/**
 * ✅ Check if auth data is valid
 * @returns {boolean}
 */
export function isAuthValid() {
  const token = localStorage.getItem(LS.access);
  const user = localStorage.getItem(LS.user);
  
  if (!token || !user) return false;
  if (isTokenExpired()) return false;
  
  return true;
}

/**
 * ✅ Clear all auth data
 */
export function clearTokens() {
  localStorage.removeItem(LS.access);
  localStorage.removeItem(LS.refresh);
  localStorage.removeItem(LS.expiry);
  localStorage.removeItem(LS.user);
}

/**
 * ✅ Save user
 * @param {Object} user - User object
 */
export function saveUser(user) {
  localStorage.setItem(LS.user, JSON.stringify(user));
}

/**
 * ✅ Get user
 * @returns {Object | null}
 */
export function getUser() {
  try {
    const userStr = localStorage.getItem(LS.user);
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * ✅ Validate and get auth data
 * @returns {{ token: string, user: Object } | null}
 */
export function getValidAuthData() {
  if (!isAuthValid()) return null;
  
  const token = localStorage.getItem(LS.access);
  const user = getUser();
  
  if (!token || !user) return null;
  
  return { token, user };
}

export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  getTimeUntilExpiry,
  isAuthValid,
  clearTokens,
  saveUser,
  getUser,
  getValidAuthData,
};
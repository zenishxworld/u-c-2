// ─────────────────────────────────────────────────────────────────────────────
// Commission Service
// All commission-related API calls for the superadmin dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token"); // adjust key if needed
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// ─── b) Set University Commission Rate ───────────────────────────────────────
// PUT /api/v1/superadmin/commissions/universities/:universityId
export const setUniversityCommissionRate = async (universityId, { commissionRate, description }) => {
  const res = await fetch(
    `${BASE_URL}/api/v1/superadmin/commissions/universities/${universityId}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ commissionRate, description }),
    }
  );
  return handleResponse(res);
};

// ─── c) View All University Commission Rates ──────────────────────────────────
// GET /api/v1/superadmin/commissions/universities
export const getAllUniversityCommissionRates = async () => {
  const res = await fetch(
    `${BASE_URL}/api/v1/superadmin/commissions/universities`,
    { headers: authHeaders() }
  );
  return handleResponse(res);
};

// ─── d) View Earned Commissions (Computed amounts) ────────────────────────────
// GET /api/v1/superadmin/commissions
export const getEarnedCommissions = async () => {
  const res = await fetch(
    `${BASE_URL}/api/v1/superadmin/commissions`,
    { headers: authHeaders() }
  );
  return handleResponse(res);
};

// ─── e) View Commission Dashboard Stats ──────────────────────────────────────
// GET /api/v1/superadmin/commissions/stats
export const getCommissionStats = async () => {
  const res = await fetch(
    `${BASE_URL}/api/v1/superadmin/commissions/stats`,
    { headers: authHeaders() }
  );
  return handleResponse(res);
};
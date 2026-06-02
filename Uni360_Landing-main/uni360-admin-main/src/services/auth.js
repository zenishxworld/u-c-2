import { 
  saveTokens, 
  clearTokens, 
  getAccessToken, 
  saveUser 
} from "../utils/tokenStore";

const BASE = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : "") || "";
const BASE_N = String(BASE).replace(/\/+$/, ""); // trim trailing slash

function nameFromEmail(email) {
  return (String(email).split("@")[0] || "").replace(/[^\w.-]/g, "");
}

function ensureApiV1(path) {
  // Absolute URLs go through untouched
  if (/^https?:\/\//i.test(path)) return path;

  // Normalize: strip leading slashes
  let p = String(path || "").replace(/^\/+/, "");

  // Rewrite known legacy paths
  if (p.startsWith("student/auth/register")) {
    p = "api/v1/auth/register/student";
  } else if (p.startsWith("auth/register/student")) {
    p = "api/v1/auth/register/student";
  } else if (p.startsWith("auth/register/admin")) {
    p = "api/v1/auth/register/admin";
  } else if (p.startsWith("auth/login")) {
    p = "api/v1/auth/login";
  } else if (!p.startsWith("api/v1/") && (p.startsWith("auth/") || p.startsWith("student/") || p.startsWith("admin/"))) {
    p = "api/v1/" + p;
  }

  return `${BASE_N}/${p}`;
}

export async function apiRequest(path, method = "GET", body, extraHeaders = {}) {
  const url = ensureApiV1(path);

  const headers = { "Content-Type": "application/json", ...extraHeaders };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const parseJson = contentType.includes("application/json");
  const data = parseJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg = (parseJson && (data?.message || data?.error)) || res.statusText || "Request failed";
    // Surface clean message for 401
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error(msg);
  }

  return data;
}

/**
 * Login (students/admins)
 * payload: { email, password }
 */
export async function loginUser({ email, password }) {
  const result = await apiRequest("/api/v1/auth/login", "POST", {
    usernameOrEmail: email,
    password,
  });

  const d = result?.data || result;
  if (!d?.accessToken) throw new Error("Invalid login response");

  // Persist tokens using centralized tokenStore
  saveTokens({
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    expiresIn: d.expiresIn ?? 3600,
  });

  // Build lightweight user
  const userId = d.userId != null ? String(d.userId) : nameFromEmail(d.email);
  const user = {
    uuid: `UNI360°-${userId}`.toUpperCase(),
    id: d.userId,
    email: d.email,
    name: d.username || nameFromEmail(d.email),
    role: (d.userType || "student").toLowerCase(),
  };

  // Save user using centralized tokenStore
  saveUser(user);

  return { user, tokens: { accessToken: d.accessToken, refreshToken: d.refreshToken } };
}

/**
 * Register student/admin based on payload.role
 *
 * Student body required by backend:
 * {
 *  username, email, password, confirmPassword, firstName, lastName,
 *  phoneNumber, privacyPolicyAccepted, termsOfServiceAccepted
 * }
 *
 * Admin body:
 * {
 *  username, email, password, confirmPassword, firstName, lastName,
 *  phoneNumber, employeeId, role, specialization, specializationCountries,
 *  privacyPolicyAccepted, termsOfServiceAccepted
 * }
 */
export async function registerUser(payload) {
  const { role = "student" } = payload || {};

  const fullName = String(payload.name || "").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ") || "User";
  const username = (payload.username || nameFromEmail(payload.email || firstName || "user")).toLowerCase();
  const phone = payload.phoneNumber || "+12225111777";

  if (String(role).toLowerCase() === "admin") {
    const body = {
      username,
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.confirmPassword || payload.password,
      firstName: firstName || "Admin",
      lastName,
      phoneNumber: phone,
      employeeId: payload.employeeId || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      role: "COUNSELOR",
      specialization: "BACHELOR,MASTERS,GENERAL",
      specializationCountries: "DE",
      privacyPolicyAccepted: true,
      termsOfServiceAccepted: true,
    };
    return apiRequest("/api/v1/auth/register/admin", "POST", body);
  }

  // default: student
  const body = {
    username,
    email: payload.email,
    password: payload.password,
    confirmPassword: payload.confirmPassword || payload.password,
    firstName: firstName || "Student",
    lastName,
    phoneNumber: phone,
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
  };
  return apiRequest("/api/v1/auth/register/student", "POST", body);
}

export function logoutUser() {
  clearTokens(); // This also removes the user from tokenStore
}
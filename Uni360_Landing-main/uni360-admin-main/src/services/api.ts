// services/api.ts - ENHANCED VERSION
import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';
import {
  getAccessToken,
  clearTokens,
  saveUser,
  getUser,
  isTokenExpired,
  saveTokens
} from '../utils/tokenStore';

const BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// ✅ Create axios instance
export const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ REQUEST INTERCEPTOR - Auto-attach token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR - Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized - Logging out");

      // Clear tokens and logout
      clearTokens();
      store.dispatch(logout());

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn("⚠️ 403 Forbidden - Insufficient permissions");
    }

    return Promise.reject(error);
  }
);

// ✅ Token storage exports (for backward compatibility)
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface StoredUser {
  uuid: string;
  id?: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export const tokenStorage = {
  setTokens: (tokens: StoredTokens) => {
    const expiresIn = Math.floor((tokens.expiresAt - Date.now()) / 1000);
    saveTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn,
    });
  },

  getAccessToken: () => getAccessToken(),

  getExpiry: () => {
    try {
      const expiry = localStorage.getItem('uni_token_expiry');
      return expiry ? Number(expiry) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: StoredUser | null) => {
    if (user) {
      saveUser(user);
    } else {
      clearTokens();
    }
  },

  getUser: () => getUser(),

  clear: () => clearTokens(),
};

// ✅ Helper to ensure API v1 paths
function ensureApiV1(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  let p = String(path || "").replace(/^\/+/, "");

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

  return `${BASE}/${p}`;
}

// ✅ Generic API request wrapper (fetch-based)
export async function apiRequest(
  path: string,
  method = "GET",
  body?: any,
  extraHeaders: Record<string, string> = {}
) {
  const url = ensureApiV1(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders
  };

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
    const msg =
      (parseJson && (data?.message || data?.error)) ||
      res.statusText ||
      "Request failed";

    if (res.status === 401) {
      console.warn("⚠️ 401 from fetch - Logging out");
      clearTokens();
      store.dispatch(logout());
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error("Unauthorized");
    }

    throw new Error(msg);
  }

  return data;
}

// ✅ Named exports for compatibility
function nameFromEmail(email: string) {
  return (String(email).split("@")[0] || "").replace(/[^\w.-]/g, "");
}

export async function loginUser({ email, password }: any) {
  const result = await apiRequest("/api/v1/auth/login", "POST", {
    usernameOrEmail: email,
    password,
  });

  const d = result?.data || result;
  if (!d?.accessToken) throw new Error("Invalid login response");

  saveTokens({
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    expiresIn: d.expiresIn ?? 3600,
  });

  const userId = d.userId != null ? String(d.userId) : nameFromEmail(d.email);
  const user = {
    uuid: `UNI360°-${userId}`.toUpperCase(),
    id: d.userId,
    email: d.email,
    name: d.username || nameFromEmail(d.email),
    role: (d.userType || "student").toLowerCase(),
  };

  saveUser(user);

  return {
    user,
    tokens: {
      accessToken: d.accessToken,
      refreshToken: d.refreshToken,
    },
  };
}

export async function registerUser(payload: any) {
  const { role = "student" } = payload;

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
  clearTokens();
  store.dispatch(logout());
}
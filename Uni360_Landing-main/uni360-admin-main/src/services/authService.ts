// services/authService.ts - ENHANCED VERSION
import { api, tokenStorage, StoredTokens, StoredUser } from "./api";
import { store } from "../store/store";
import { logout as reduxLogout } from "../store/slices/authSlice";
import { clearTokens, isAuthValid } from "../utils/tokenStore";

export type LoginRequest = { email: string; password: string; };
export type LoginResponseUser = StoredUser;
export type RegisterAdminMinimal = { name: string; email: string; };
export type SignupRequest = { name: string; email: string; password: string; role: "admin" | "student"; };

export type AdminRegistration = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  employeeId: string;
  role: string;
  specialization: string;
  specializationCountries: string;
  privacyPolicyAccepted: boolean;
  termsOfServiceAccepted: boolean;
};

type RawLoginResponse = {
  success?: boolean;
  data?: {
    accessToken: string; refreshToken: string; expiresIn: number;
    userId?: string | number; userType?: string; email: string; username?: string;
  };
  [k: string]: any;
};

type AdminRegistrationResponse = {
  success: boolean;
  message: string;
  data: {
    userId: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    status: string;
    registrationTime: string;
    verificationToken: string;
    verificationTokenExpiresAt: string;
    nextSteps: string;
    welcomeMessage: string;
    profileCompletionUrl: string;
    loginUrl: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    requiresEmailVerification: boolean;
  };
  timestamp: string;
};

const endpoints = {
  login: "/api/v1/auth/login",
  registerAdmin: "/api/v1/auth/register/admin",
  registerStudent: "/api/v1/auth/register/student",
};

function nameFromEmail(email: string) {
  return (email.split("@")[0] || "").replace(/[^\w.-]/g, "");
}

function splitName(full: string) {
  const t = (full || "").trim();
  if (!t) return { firstName: "User", lastName: "Account" };
  const p = t.split(/\s+/);
  return p.length === 1 ? { firstName: p[0], lastName: "Account" } : { firstName: p[0], lastName: p.slice(1).join(" ") };
}

function randomToken(n = 8) {
  return Math.random().toString(36).slice(-n).toUpperCase();
}

function mapUserFromRaw(d: RawLoginResponse["data"]): StoredUser {
  const role = (d?.userType || "student").toLowerCase();
  const name = d?.username || nameFromEmail(d?.email || "");
  const userId = (d?.userId != null ? String(d.userId) : randomToken(8)).toUpperCase();
  return {
    uuid: `UNI360°-${userId}`,
    id: d?.userId ? String(d.userId) : undefined,
    email: d?.email || "",
    name,
    role,
    avatarUrl: null,
  };
}

const getAuthToken = () => {
  try {
    return localStorage.getItem("uni_access_token");
  } catch {
    return null;
  }
};

export const authService = {
  async login(payload: LoginRequest): Promise<{ user: LoginResponseUser }> {
    const body = { usernameOrEmail: payload.email, password: payload.password };
    const res = await api.post<RawLoginResponse>(endpoints.login, body);
    const j = res.data;
    if (!j?.data?.accessToken) throw new Error(j?.message || "Invalid email or password");

    const d = j.data;
    const expiresAt = Date.now() + Number(d.expiresIn || 3600) * 1000;
    tokenStorage.setTokens({
      accessToken: d.accessToken,
      refreshToken: d.refreshToken,
      expiresAt
    } as StoredTokens);

    const user = mapUserFromRaw(d);
    tokenStorage.setUser(user);
    return { user };
  },

  async registerB2BAdmin(payload: AdminRegistration): Promise<AdminRegistrationResponse> {
    const token = getAuthToken();
    const headers: any = {
      "X-Client-ID": "uniflow",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await api.post<AdminRegistrationResponse>(
      endpoints.registerAdmin,
      payload,
      { headers }
    );

    return res.data;
  },

  async registerAdmin(min: RegisterAdminMinimal): Promise<{ user?: StoredUser; tempPassword: string }> {
    const { firstName, lastName } = splitName(min.name);
    const username = nameFromEmail(min.email) || firstName.toLowerCase();

    const tempPassword = `Uni${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-4).toUpperCase()}!`;

    const body = {
      username,
      email: min.email,
      password: tempPassword,
      confirmPassword: tempPassword,
      firstName,
      lastName,
      phoneNumber: "+12225111777",
      employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      role: "COUNSELOR",
      specialization: "BACHELOR,MASTERS,GENERAL",
      specializationCountries: "DE",
      privacyPolicyAccepted: true,
      termsOfServiceAccepted: true,
    };

    await api.post(endpoints.registerAdmin, body);

    try {
      const { user } = await this.login({ email: min.email, password: tempPassword });
      return { user, tempPassword };
    } catch {
      return { tempPassword };
    }
  },

  async signup(payload: SignupRequest): Promise<{ user: StoredUser }> {
    if (payload.role === "admin") {
      const { user } = await this.registerAdmin({ name: payload.name, email: payload.email });
      if (!user) {
        const { user: u } = await this.login({ email: payload.email, password: payload.password });
        return { user: u };
      }
      return { user };
    }

    const { firstName, lastName } = splitName(payload.name);
    const username = nameFromEmail(payload.email) || firstName.toLowerCase();

    const body = {
      username,
      email: payload.email,
      password: payload.password,
      confirmPassword: payload.password,
      firstName,
      lastName,
      phoneNumber: "+12225111777",
      privacyPolicyAccepted: true,
      termsOfServiceAccepted: true,
    };

    await api.post(endpoints.registerStudent, body);

    const { user } = await this.login({ email: payload.email, password: payload.password });
    return { user };
  },

  getStoredToken(): string | null {
    const token = tokenStorage.getAccessToken();
    const expiry = tokenStorage.getExpiry();
    if (!token) return null;
    if (expiry && Date.now() > expiry) return null;
    return token;
  },

  getStoredUser(): StoredUser | null {
    return tokenStorage.getUser();
  },

  // ✅ Enhanced logout - clears everything and updates Redux
  logout() {
    clearTokens();
    tokenStorage.clear();
    tokenStorage.setUser(null);

    // Dispatch logout to Redux
    store.dispatch(reduxLogout());

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // ✅ Check if current session is valid
  isSessionValid(): boolean {
    return isAuthValid();
  },
};
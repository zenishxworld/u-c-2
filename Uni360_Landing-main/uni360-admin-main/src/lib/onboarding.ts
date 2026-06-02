// Updated onboarding.ts to support pending approval state

export type Role = "b2b" | "admin";
export type AuthUser = {
  role: Role;
  name: string;
  email: string;
  avatarUrl?: string;       // optional photo/logo url
  onboarded?: boolean;      // B2B completed registration form
  approved?: boolean;       // Master admin approved the B2B user
};

const AUTH_KEY = "UNI360°_auth_user";

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  broadcast();
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  broadcast();
}

// helpers
export function isLoggedIn() {
  return !!getAuthUser();
}

export function isB2B() {
  return getAuthUser()?.role === "b2b";
}

export function isAdmin() {
  return getAuthUser()?.role === "admin";
}

export function isB2BOnboarded() {
  const u = getAuthUser();
  return u?.role === "b2b" ? !!u.onboarded : true;
}

// NEW: Check if B2B user is pending approval (onboarded but not approved)
export function isB2BPendingApproval() {
  const u = getAuthUser();
  return u?.role === "b2b" && u.onboarded === true && u.approved !== true;
}

// NEW: Check if B2B user is fully approved
export function isB2BApproved() {
  const u = getAuthUser();
  return u?.role === "b2b" && u.onboarded === true && u.approved === true;
}

export function setB2BOnboarded(done: boolean) {
  const u = getAuthUser();
  if (u && u.role === "b2b") {
    u.onboarded = done;
    // When setting onboarded to true, ensure approved is false (pending state)
    if (done) {
      u.approved = false;
    }
    setAuthUser(u);
  }
}

// NEW: Master admin can approve B2B users
export function setB2BApproved(approved: boolean) {
  const u = getAuthUser();
  if (u && u.role === "b2b") {
    u.approved = approved;
    setAuthUser(u);
  }
}

export function updateB2BProfile(patch: Partial<AuthUser>) {
  const u = getAuthUser();
  if (u && u.role === "b2b") {
    const next = { ...u, ...patch };
    setAuthUser(next);
  }
}

// UI locks - UPDATED: Only blur for B2B users who haven't completed onboarding or are pending approval
export function shouldBlurShell() {
  const u = getAuthUser();
  if (u?.role === "b2b") {
    // Blur if not onboarded OR if onboarded but not approved
    return !u.onboarded || (u.onboarded && !u.approved);
  }
  // Never blur for regular admins
  return false;
}

// NEW: Check if should show welcome card (only for B2B users who completed onboarding but pending approval)
export function shouldShowWelcomeCard() {
  const u = getAuthUser();
  // Only show welcome card for B2B users, never for admins
  return u?.role === "b2b" && isB2BPendingApproval();
}

// FIXED: Check if should show full dashboard content (metrics, claims, etc.)
export function shouldShowFullDashboard() {
  const u = getAuthUser();
  if (!u) return false;

  // Always show full dashboard for regular admins
  if (u.role === "admin") return true;

  // For B2B users, only show if fully approved
  if (u.role === "b2b") return isB2BApproved();

  return false;
}

// small cross-tab event so sidebar/navbar/dashboard can react live
function broadcast() {
  window.dispatchEvent(new CustomEvent("b2b-onboarding-change"));
}
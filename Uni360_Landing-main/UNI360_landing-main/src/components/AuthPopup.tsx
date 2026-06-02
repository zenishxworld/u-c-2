import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any, token?: string) => void;
  title?: string;
  subtitle?: string;
  initialMode?: 'login' | 'signup';
  /** When true, skip opening the student portal after auth.
   *  Use this for "Book 1:1 Call" buttons — auth leads to payment, not portal. */
  skipPortalRedirect?: boolean;
}

// Student portal URL for cross-domain SSO redirect
const STUDENT_PORTAL_URL = "https://students.uni360degree.com";

// Utility functions for auth state management
export const AuthUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const user = window.sessionStorage?.getItem("authUser") || window.localStorage?.getItem("authUser");
      const token = window.sessionStorage?.getItem("authToken") || window.localStorage?.getItem("authToken");
      return !!(user && token && JSON.parse(user));
    } catch {
      return false;
    }
  },

  // Get current user data
  getCurrentUser: () => {
    if (typeof window === "undefined") return null;
    try {
      const user = window.sessionStorage?.getItem("authUser") || window.localStorage?.getItem("authUser");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Get authentication token
  getAuthToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage?.getItem("authToken") || window.localStorage?.getItem("authToken") || null;
  },

  // Sign out user
  signOut: (): void => {
    if (typeof window === "undefined") return;
    // Clear from both sessionStorage and localStorage
    window.sessionStorage?.removeItem("authUser");
    window.sessionStorage?.removeItem("authToken");
    window.localStorage?.removeItem("authUser");
    window.localStorage?.removeItem("authToken");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authUser",
        newValue: null,
        oldValue: window.sessionStorage?.getItem("authUser") || null,
      })
    );
  },

  // Set authentication data (persisted in both sessionStorage and localStorage)
  setAuthData: (userData: any, token?: string): void => {
    if (typeof window === "undefined") return;
    const normalizedUser = {
      ...userData,
      id: userData.id ?? userData.userId ?? userData.user_id ?? null,
    };
    const userJson = JSON.stringify(normalizedUser);

    // Store in sessionStorage (current tab)
    window.sessionStorage?.setItem("authUser", userJson);
    // Store in localStorage (persists across tabs/sessions for student portal auth)
    window.localStorage?.setItem("authUser", userJson);

    if (token) {
      window.sessionStorage?.setItem("authToken", token);
      window.localStorage?.setItem("authToken", token);
    }

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "authUser",
        newValue: userJson,
        oldValue: window.sessionStorage?.getItem("authUser") || null,
      })
    );
  },

  /**
   * Open the student portal in a new tab after successful authentication.
   * Token is passed as a URL hash fragment — hash is NEVER sent to any server
   * (not in server logs, CDN logs, or network requests).
   * The student portal reads the hash, stores the token, then wipes the hash from the URL.
   */
  redirectToStudentPortal: (): void => {
    const token = AuthUtils.getAuthToken();
    const url = token
      ? `${STUDENT_PORTAL_URL}/#sso_token=${encodeURIComponent(token)}`
      : STUDENT_PORTAL_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  },
};

// Google "G" SVG Icon
const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="w-4 h-4 flex-shrink-0"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const AuthPopup: React.FC<AuthPopupProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  title = "Welcome!",
  subtitle = "Sign in to your account to continue",
  initialMode = "login",
  skipPortalRedirect = false,
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    name: "",
  });

  // API Configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ── Google OAuth: listen for the callback popup message ──────────────────
  useEffect(() => {
    // Handler for postMessage (from popup window.opener)
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from origin:", event.origin, "Data:", event.data);
      if (!event.data?.type) return;
      if (event.data?.type !== "GOOGLE_AUTH_SUCCESS") return;
      const { token, user } = event.data;
      if (!token || !user) return;

      processGoogleAuthSuccess(token, user);
    };

    // Handler for localStorage fallback (if window.opener is broken by browser)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "google_auth_token") {
        const token = localStorage.getItem("google_auth_token");
        const userStr = localStorage.getItem("google_auth_user");
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            processGoogleAuthSuccess(token, user);
            
            // Clean up
            localStorage.removeItem("google_auth_token");
            localStorage.removeItem("google_auth_user");
          } catch (e) {
            console.error("Failed to parse user from localStorage", e);
          }
        }
      }
    };

    const processGoogleAuthSuccess = (token: string, user: any) => {
      const userData = {
        id: user.id ?? user.userId ?? user.user_id ?? null,
        studentId: user.id ?? user.userId ?? null,
        name: user.fullName || user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Google User",
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username,
        userType: user.userType,
        status: user.status,
        provider: "GOOGLE",
      };

      AuthUtils.setAuthData(userData, token);
      if (onAuthSuccess) onAuthSuccess(userData, token);
      setGoogleLoading(false);
      // Only redirect to student portal from Navigation Sign Up, not from Book 1:1 Call
      if (!skipPortalRedirect) AuthUtils.redirectToStudentPortal();
      resetModal();
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    
    // Also check on mount in case we missed the event
    handleStorage({ key: "google_auth_token" } as StorageEvent);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [onAuthSuccess]);

  // ── Initiate Google OAuth flow ───────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    setError("");

    try {
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      const res = await fetch(`${API_BASE_URL}/auth/google/url?redirect_uri=${redirectUri}`);
      if (!res.ok) throw new Error("Failed to get Google auth URL");

      const json = await res.json();
      const authorizationUrl = json?.data?.authorizationUrl;
      if (!authorizationUrl) throw new Error("Authorization URL not found in response");

      // Open Google consent screen in a small centered popup
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authorizationUrl,
        "google-oauth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error("Popup was blocked. Please allow popups for this site.");
      }

      // Fallback timeout (5 min)
      setTimeout(() => {
        setGoogleLoading(false);
      }, 300000);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  // ── API Helper ────────────────────────────────────────────────────────────
  const apiRequest = async (endpoint: string, options: any = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        try {
          errorData = contentType?.includes("application/json")
            ? await response.json()
            : { message: await response.text() || `HTTP ${response.status}` };
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        if (response.status === 401) throw new Error(errorData.message || "Invalid email or password.");
        else if (response.status === 400) throw new Error(errorData.message || "Invalid request data.");
        else if (response.status === 404) throw new Error("API endpoint not found.");
        else if (response.status >= 500) throw new Error("Server error. Please try again later.");
        else throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();
        return jsonData.data || jsonData;
      }
      return await response.text();
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
        throw new Error("Cannot connect to server. Please check your connection.");
      }
      throw error;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      if (!formData.email.trim()) throw new Error("Email is required");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) throw new Error("Please enter a valid email address");
      if (!formData.password) throw new Error("Password is required");

      if (isLogin) {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            usernameOrEmail: formData.email,
            password: formData.password,
          }),
        });

        const userData = {
          id: response.userId,
          studentId: response.userId,
          name: response.fullName || `${response.firstName} ${response.lastName}`.trim(),
          email: response.email,
          firstName: response.firstName || "",
          lastName: response.lastName || "",
          username: response.username,
          userType: response.userType,
          status: response.status,
        };
        const token = response.accessToken;
        AuthUtils.setAuthData(userData, token);
        if (onAuthSuccess) onAuthSuccess(userData, token);
        // Only redirect to student portal from Navigation Sign Up, not from Book 1:1 Call
        if (!skipPortalRedirect) AuthUtils.redirectToStudentPortal();
        resetModal();
      } else {
        if (formData.password.length < 8) throw new Error("Password must be at least 8 characters");
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");
        if (!formData.name.trim()) throw new Error("Full name is required");

        const nameParts = formData.name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        const response = await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            firstName,
            lastName,
            email: formData.email.trim(),
            password: formData.password,
          }),
        });

        if (response.userId) {
          const loginResponse = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
              usernameOrEmail: formData.email,
              password: formData.password,
            }),
          });

          const userData = {
            id: loginResponse.userId,
            studentId: loginResponse.userId,
            name: loginResponse.fullName || `${loginResponse.firstName} ${loginResponse.lastName}`.trim(),
            email: loginResponse.email,
            firstName: loginResponse.firstName || "",
            lastName: loginResponse.lastName || "",
            username: loginResponse.username,
            userType: loginResponse.userType,
            status: loginResponse.status,
          };
          const token = loginResponse.accessToken;
          AuthUtils.setAuthData(userData, token);
          if (onAuthSuccess) onAuthSuccess(userData, token);
          // Only redirect to student portal from Navigation Sign Up, not from Book 1:1 Call
          if (!skipPortalRedirect) AuthUtils.redirectToStudentPortal();
          resetModal();
        }
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", name: "" });
    setIsLogin(initialMode === "login");
    setShowPassword(false);
    setError("");
    setLoading(false);
    setGoogleLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const isAnyLoading = loading || googleLoading;

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="w-80 max-w-xs bg-white rounded-xl shadow-xl border-0 p-0 overflow-hidden mx-2 sm:mx-0">
        <DialogDescription className="sr-only">
          {isLogin ? "Sign in to your account to continue" : "Create a new account to get started"}
        </DialogDescription>

        <div className="bg-white p-4 sm:p-5">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <img
                src="/Uni360 logo.png"
                alt="UNI 360° Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 text-[#E08D3C] hidden" />
            </div>
            <DialogTitle className="text-center text-base sm:text-lg font-bold text-gray-800">
              {isLogin ? "Welcome Back!" : "Join UNI 360°"}
            </DialogTitle>
            <p className="text-center text-gray-600 text-xs sm:text-sm px-2">
              {isLogin
                ? "Sign in to see your personalized university recommendations"
                : "Create your account to get personalized recommendations"}
            </p>
          </DialogHeader>

          <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
            {/* Error Display */}
            {error && (
              <div className="text-red-500 text-xs sm:text-sm text-center bg-red-50 p-2 sm:p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
              className="w-full h-8 sm:h-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm overflow-hidden"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-gray-500" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email/Password Form */}
            <div className="space-y-2.5 sm:space-y-3">
              {!isLogin && (
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full h-8 sm:h-9 px-2.5 sm:px-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 text-sm"
                    disabled={isAnyLoading}
                  />
                </div>
              )}

              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full h-8 sm:h-9 px-2.5 sm:px-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 text-sm"
                  disabled={isAnyLoading}
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="w-full h-8 sm:h-9 px-2.5 sm:px-3 pr-8 sm:pr-10 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 text-sm"
                  disabled={isAnyLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={isAnyLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>

              {!isLogin && (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="w-full h-8 sm:h-9 px-2.5 sm:px-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 text-sm"
                    disabled={isAnyLoading}
                  />
                </div>
              )}

              <Button
                onClick={handleFormSubmit}
                disabled={isAnyLoading}
                className="w-full h-8 sm:h-9 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                  </div>
                ) : isLogin ? (
                  "Sign In & Continue"
                ) : (
                  "Create Account & Continue"
                )}
              </Button>
            </div>

            <div className="text-center space-y-1.5 sm:space-y-2">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                disabled={isAnyLoading}
                className="text-orange-500 hover:text-[#E08D3C] font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>

              <button
                type="button"
                onClick={resetModal}
                disabled={isAnyLoading}
                className="block mx-auto text-gray-500 hover:text-[#E08D3C] text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPopup;

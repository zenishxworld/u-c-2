import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import type {
  AuthContextType,
  AuthState,
  User,
  LoginCredentials,
  SignUpCredentials,
} from "../types/auth";
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyUser,
  getGoogleAuthUrl,
  handleGoogleCallback,
  refreshToken as refreshAuthToken,
  setPassword as setPasswordApi,
} from "../services/auth.js";
import {
  setTokens,
  setUser,
  getUser,
  getToken,
  getRefreshToken,
  clearAuthData,
  isAuthenticated as checkIsAuthenticated,
  isTokenExpired,
} from "../services/utils.js";
import { clearAllProfileDrafts } from "../services/profile.js";

interface AuthAction {
  type:
    | "LOGIN_START"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILURE"
    | "LOGOUT"
    | "CLEAR_ERROR"
    | "SET_LOADING"
    | "UPDATE_USER"
    | "RESTORE_SESSION";
  payload?: any;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Generate UUID function
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null,
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Country selection state
  const [selectedCountry, setSelectedCountryState] = useState<"DE" | "UK">(
    "DE"
  );
  const [isCountryToggleDisabled, setIsCountryToggleDisabled] = useState(false);

  // Initialize country state based on user's target countries
  useEffect(() => {
    if (
      state.user?.targetCountries &&
      state.user.targetCountries.length === 1
    ) {
      const targetCountry = state.user.targetCountries[0];
      if (targetCountry === "Germany") {
        setSelectedCountryState("DE");
        setIsCountryToggleDisabled(true);
      } else if (targetCountry === "United Kingdom") {
        setSelectedCountryState("UK");
        setIsCountryToggleDisabled(true);
      }
    } else {
      // If user has both countries or no specific target, allow toggling
      setIsCountryToggleDisabled(false);
    }
  }, [state.user?.targetCountries]);

  // Country selection handler
  const setSelectedCountry = useCallback(
    (country: "DE" | "UK") => {
      if (!isCountryToggleDisabled) {
        setSelectedCountryState(country);
      }
    },
    [isCountryToggleDisabled]
  );

  // Logout function with proper cleanup
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all auth data and profile drafts
      clearAuthData();
      clearAllProfileDrafts(); // Clear all profile drafts when logging out
      dispatch({ type: "LOGOUT" });
      console.log("AuthContext: User logged out and all data cleared");
    }
  }, []);

  // Auto-refresh token before expiration
  const setupTokenRefresh = useCallback(() => {
    const token = getToken();
    const refreshToken = getRefreshToken();

    if (!token || !refreshToken) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

      if (refreshTime > 0) {
        const timeoutId = setTimeout(async () => {
          try {
            const newTokens = await refreshAuthToken(refreshToken);
            setTokens(newTokens.accessToken, newTokens.refreshToken);
            setupTokenRefresh();
          } catch (error) {
            console.error("Token refresh failed:", error);
            logout();
          }
        }, refreshTime);

        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Error setting up token refresh:", error);
    }
  }, [logout]);

  // Check for stored authentication on app load - IMPROVED PERSISTENCE
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        const storedUser = getUser();
        const token = getToken();

        console.log(
          "AuthContext: Initializing auth - stored user:",
          storedUser
        );
        console.log("AuthContext: Initializing auth - token exists:", !!token);

        if (storedUser && token) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            console.log("AuthContext: Token expired, attempting refresh...");
            const refreshToken = getRefreshToken();

            if (refreshToken) {
              try {
                const newTokens = await refreshAuthToken(refreshToken);
                setTokens(newTokens.accessToken, newTokens.refreshToken);
                console.log("AuthContext: Token refreshed successfully");
              } catch (refreshError) {
                console.error(
                  "AuthContext: Token refresh failed:",
                  refreshError
                );
                clearAuthData();
                clearAllProfileDrafts();
                if (isMounted) {
                  dispatch({ type: "LOGOUT" });
                }
                return;
              }
            } else {
              console.log("AuthContext: No refresh token available");
              clearAuthData();
              clearAllProfileDrafts();
              if (isMounted) {
                dispatch({ type: "LOGOUT" });
              }
              return;
            }
          }

          // Restore session with stored user data
          if (isMounted) {
            console.log(
              "AuthContext: Restoring session for user:",
              storedUser.name || storedUser.email
            );
            dispatch({ type: "RESTORE_SESSION", payload: storedUser });
            setupTokenRefresh();
          }
        } else {
          console.log("AuthContext: No stored user data found");
          if (isMounted) {
            dispatch({ type: "SET_LOADING", payload: false });
          }
        }
      } catch (error) {
        console.error("AuthContext: Error initializing auth:", error);
        clearAuthData();
        clearAllProfileDrafts();
        if (isMounted) {
          dispatch({ type: "LOGOUT" });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [setupTokenRefresh]);

  // Login function with cleanup for user switching
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch({ type: "LOGIN_START" });
      try {
        console.log("AuthContext: Attempting login with credentials:", {
          email: credentials.email,
        });

        // Clear previous user's data before login
        const currentUser = getUser();
        if (currentUser) {
          console.log(
            "AuthContext: Clearing previous user data before new login"
          );
          clearAllProfileDrafts();
        }

        const response = await loginUser(credentials);

        // Add UUID if not present
        const userWithUUID = {
          ...response.user,
          uuid: response.user.uuid || generateUUID(),
        };

        console.log("AuthContext: Login response received:", userWithUUID);

        // Store tokens and user data
        setTokens(response.accessToken, response.refreshToken);
        setUser(userWithUUID);

        dispatch({ type: "LOGIN_SUCCESS", payload: userWithUUID });
        setupTokenRefresh();

        console.log("AuthContext: Login successful, user state updated");
      } catch (error: any) {
        console.error("AuthContext: Login failed:", error);
        dispatch({ type: "LOGIN_FAILURE", payload: error.message });
        throw error;
      }
    },
    [setupTokenRefresh]
  );

  // Sign up function with cleanup for user switching
  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      dispatch({ type: "LOGIN_START" });
      try {
        console.log("AuthContext: Attempting signup with credentials:", {
          name: credentials.name,
          email: credentials.email,
        });

        // Clear previous user's data before signup
        const currentUser = getUser();
        if (currentUser) {
          console.log(
            "AuthContext: Clearing previous user data before new signup"
          );
          clearAllProfileDrafts();
        }

        const response = await registerUser(credentials);

        // Add UUID if not present
        const userWithUUID = {
          ...response.user,
          uuid: response.user.uuid || generateUUID(),
        };

        console.log("AuthContext: Signup response received:", userWithUUID);

        // Check if tokens are provided (backward compatibility)
        if (response.accessToken && response.refreshToken) {
          // Old flow: Tokens provided immediately
          setTokens(response.accessToken, response.refreshToken);
          setUser(userWithUUID);
          dispatch({ type: "LOGIN_SUCCESS", payload: userWithUUID });
          setupTokenRefresh();
          console.log("AuthContext: Signup successful with immediate authentication");
        } else {
          // New flow: Email verification required, no tokens yet
          setUser(userWithUUID);
          
          // Don't dispatch LOGIN_SUCCESS since user is not authenticated yet
          dispatch({ type: "SET_LOADING", payload: false });
          
          console.log("AuthContext: Signup successful, email verification required");
          console.log("Next steps:", response.nextSteps);
          
          // Return response with email verification information
          return {
            ...response,
            user: userWithUUID,
            requiresEmailVerification: response.requiresEmailVerification || true,
            message: response.welcomeMessage || "Registration successful! Please check your email to verify your account."
          };
        }

        console.log("AuthContext: Signup successful, user state updated");
      } catch (error: any) {
        console.error("AuthContext: Sign up failed:", error);
        dispatch({ type: "LOGIN_FAILURE", payload: error.message });
        throw error;
      }
    },
    [setupTokenRefresh]
  );

  // Google login — called with the { token, user } payload posted by the OAuth
  // callback popup via postMessage. Normalizes + stores user and updates state.
  const loginWithGoogle = useCallback(
    async (payload: { token: string; user: any }) => {
      dispatch({ type: "LOGIN_START" });
      try {
        console.log("AuthContext: Handling Google OAuth callback");

        // Clear previous user's data before Google login
        const currentUser = getUser();
        if (currentUser) {
          console.log(
            "AuthContext: Clearing previous user data before Google login"
          );
          clearAllProfileDrafts();
        }

        const response = handleGoogleCallback(payload);

        const userWithUUID = {
          ...response.user,
          uuid: response.user.uuid || generateUUID(),
        };

        console.log(
          "AuthContext: Google login response received:",
          userWithUUID
        );

        // handleGoogleCallback already calls setTokens + setUser internally,
        // but we dispatch to React state here to trigger re-renders.
        dispatch({ type: "LOGIN_SUCCESS", payload: userWithUUID });
        setupTokenRefresh();

        console.log("AuthContext: Google login successful, user state updated");
      } catch (error: any) {
        console.error("AuthContext: Google login failed:", error);
        dispatch({ type: "LOGIN_FAILURE", payload: error.message });
        throw error;
      }
    },
    [setupTokenRefresh]
  );

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Password reset email would be sent to ${email}`);
    } catch (error: any) {
      dispatch({ type: "LOGIN_FAILURE", payload: error.message });
      throw error;
    }
  }, []);

  // Update user profile function with real-time state update
  const updateUserProfile = useCallback(
    async (profileData: Partial<User>) => {
      try {
        const currentUser = state.user;
        if (!currentUser) {
          throw new Error("No user logged in");
        }

        // Update user in state immediately for better UX
        const updatedUser = { ...currentUser, ...profileData };
        dispatch({ type: "UPDATE_USER", payload: profileData });

        // Persist to localStorage
        setUser(updatedUser);

        console.log("AuthContext: Profile updated successfully:", updatedUser);

        return updatedUser;
      } catch (error: any) {
        console.error("AuthContext: Update profile error:", error);
        dispatch({ type: "LOGIN_FAILURE", payload: error.message });
        throw error;
      }
    },
    [state.user]
  );

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Set or change password function
  const setPassword = useCallback(
    async (data: { currentPassword?: string; newPassword: string; confirmPassword: string }) => {
      try {
        const result = await setPasswordApi(data);

        // Update user state to reflect new authProvider and hasPassword
        if (result.success) {
          const currentUser = state.user;
          if (currentUser) {
            const updatedFields: any = { hasPassword: true };
            // If user was GOOGLE-only, they are now HYBRID
            if (currentUser.authProvider === 'GOOGLE') {
              updatedFields.authProvider = 'HYBRID';
              updatedFields.provider = 'HYBRID';
            }
            dispatch({ type: "UPDATE_USER", payload: updatedFields });
            setUser({ ...currentUser, ...updatedFields });
          }
        }

        return result;
      } catch (error: any) {
        console.error("AuthContext: Set password failed:", error);
        throw error;
      }
    },
    [state.user]
  );

  // Memoize the context value
  const value: AuthContextType = useMemo(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login,
      signUp,
      logout,
      resetPassword,
      clearError,
      loginWithGoogle,
      updateUserProfile,
      setPassword,
      selectedCountry,
      isCountryToggleDisabled,
      setSelectedCountry,
    }),
    [
      state.user,
      state.isAuthenticated,
      state.isLoading,
      state.error,
      login,
      signUp,
      logout,
      resetPassword,
      clearError,
      loginWithGoogle,
      updateUserProfile,
      setPassword,
      selectedCountry,
      isCountryToggleDisabled,
      setSelectedCountry,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
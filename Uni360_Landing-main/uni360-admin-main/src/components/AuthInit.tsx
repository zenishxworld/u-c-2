// components/AuthInit.tsx - ENHANCED VERSION
import { useEffect } from 'react';
import { useAppDispatch } from '../hooks/useRedux';
import { loginSuccess, logout, setAuthLoading } from '../store/slices/authSlice';
import { setNotifications } from '../store/slices/userSlice';
import { mockNotifications } from '../services/mockData';
import { getValidAuthData, clearTokens, isTokenExpired } from '../utils/tokenStore';

export const AuthInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // ✅ Get valid auth data (returns null if expired)
        const authData = getValidAuthData();

        if (authData && authData.token && authData.user) {
          console.log("✅ Valid session found, restoring user");
          
          // Restore authenticated user
          dispatch(loginSuccess(authData.user));
          dispatch(setNotifications(mockNotifications));
          
          // ✅ Optional: Setup auto-logout timer for token expiry
          setupAutoLogout(dispatch);
        } else {
          console.log("❌ No valid session found");
          
          // Clear any stale data
          clearTokens();
          dispatch(logout());
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        clearTokens();
        dispatch(logout());
      } finally {
        // ✅ Always end loading state
        dispatch(setAuthLoading(false));
      }
    };

    initAuth();
  }, [dispatch]);

  return <>{children}</>;
};

// ✅ Setup auto-logout when token expires
function setupAutoLogout(dispatch: any) {
  // Clear any existing timeout
  if ((window as any).__authLogoutTimeout) {
    clearTimeout((window as any).__authLogoutTimeout);
  }

  // Check token expiry every minute
  const checkInterval = setInterval(() => {
    if (isTokenExpired()) {
      console.warn("⚠️ Token expired, auto-logging out");
      clearTokens();
      dispatch(logout());
      clearInterval(checkInterval);
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, 60000); // Check every 60 seconds

  // Store interval reference for cleanup
  (window as any).__authLogoutTimeout = checkInterval;

  // Cleanup on unmount
  return () => {
    clearInterval(checkInterval);
    delete (window as any).__authLogoutTimeout;
  };
}
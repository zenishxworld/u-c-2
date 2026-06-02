// hooks/useLogout.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from './useRedux';
import { logout as reduxLogout } from '../store/slices/authSlice';
import { clearTokens } from '../utils/tokenStore';
import { toast } from 'sonner';

/**
 * ✅ Centralized logout hook
 * Use this throughout your app for consistent logout behavior
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const logout = useCallback((options?: { 
    showToast?: boolean; 
    message?: string;
    redirect?: boolean;
  }) => {
    const { 
      showToast = true, 
      message = "You have been logged out",
      redirect = true 
    } = options || {};

    try {
      // Clear all auth data
      clearTokens();
      
      // Update Redux state
      dispatch(reduxLogout());
      
      // Show notification
      if (showToast) {
        toast.info(message);
      }
      
      // Redirect to login
      if (redirect) {
        navigate('/login', { replace: true });
      }
      
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  }, [dispatch, navigate]);

  return logout;
};
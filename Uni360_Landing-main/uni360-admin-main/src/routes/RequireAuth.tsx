// routes/RequireAuth.tsx - ENHANCED VERSION
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logout } from '../store/slices/authSlice';
import { isAuthValid, clearTokens } from '../utils/tokenStore';

export default function RequireAuth() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useAppSelector(s => s.auth);

  useEffect(() => {
    // ✅ Double-check auth validity on every route change
    if (isAuthenticated && !isAuthValid()) {
      console.warn("⚠️ Invalid auth state detected, logging out");
      clearTokens();
      dispatch(logout());
    }
  }, [location.pathname, isAuthenticated, dispatch]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ Check both Redux state AND token validity
  if (!isAuthenticated || !isAuthValid()) {
    console.log("🚫 Access denied - redirecting to login");
    
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location.pathname }} 
      />
    );
  }

  // ✅ User is authenticated and token is valid
  return <Outlet />;
}
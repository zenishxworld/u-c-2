import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, CheckCircle, GraduationCap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getGoogleAuthUrl } from '../../services/auth';
import type { LoginCredentials, SignUpCredentials } from '../../types/auth';

const Login: React.FC = () => {
  const { login, signUp, isLoading, error, clearError, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Toggle between login and signup
  const [isSignUp, setIsSignUp] = useState(false);

  // Login state
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // SignUp state - modified to include firstName and lastName
  const [signUpCredentials, setSignUpCredentials] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    clearError();
    setValidationErrors({});
    setSuccessMessage('');
  }, [isSignUp, clearError]);

  // Validation functions
  const validateLoginForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!loginCredentials.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginCredentials.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!loginCredentials.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignUpForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!signUpCredentials.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (signUpCredentials.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!signUpCredentials.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (signUpCredentials.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!signUpCredentials.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpCredentials.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!signUpCredentials.password) {
      errors.password = 'Password is required';
    } else if (signUpCredentials.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signUpCredentials.password)) {
      errors.password = 'Password must contain at least one uppercase, lowercase, and number';
    }

    if (!signUpCredentials.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (signUpCredentials.password !== signUpCredentials.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!signUpCredentials.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateLoginForm()) return;

    try {
      console.log('Starting login process...');
      await login(loginCredentials);
      // Navigation will be handled by the useEffect above when isAuthenticated becomes true
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateSignUpForm()) return;

    try {
      // Combine firstName and lastName into name for the SignUpCredentials type
      const signUpData: SignUpCredentials = {
        name: `${signUpCredentials.firstName.trim()} ${signUpCredentials.lastName.trim()}`,
        email: signUpCredentials.email,
        password: signUpCredentials.password,
        confirmPassword: signUpCredentials.confirmPassword,
        acceptTerms: signUpCredentials.acceptTerms,
      };

      console.log('Starting signup process with data:', {
        name: signUpData.name,
        email: signUpData.email,
        password: '[hidden]',
        confirmPassword: '[hidden]',
        acceptTerms: signUpData.acceptTerms
      });
      
      const result = await signUp(signUpData);
      
      // Check if email verification is required
      if (result && result.requiresEmailVerification) {
        console.log('Registration successful, email verification required');
        // Show success message and switch to login mode
        setSuccessMessage(result.message || 'Registration successful! Please check your email to verify your account.');
        setIsSignUp(false);
      } else {
        // Old flow: Navigation will be handled by the useEffect above when isAuthenticated becomes true
        console.log('Registration successful, user authenticated');
      }
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  // Input change handlers
  const handleLoginInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setLoginCredentials(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    clearError();
  };

  const handleSignUpInputChange = (field: string, value: string | boolean) => {
    setSignUpCredentials(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    clearError();
  };

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Listen for OAuth callback message from popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Accept messages from our own origin only
// (AuthCallback uses "*" so event.origin will match whatever domain served the callback)
if (!event.data?.type) return;
      if (event.data?.type !== 'GOOGLE_AUTH_SUCCESS') return;

      try {
        // Delegate to AuthContext — it calls handleGoogleCallback internally,
        // stores tokens/user, and dispatches LOGIN_SUCCESS to update state.
        // Add these two lines BEFORE the await, to debug what Google is actually sending back
console.log('Google OAuth raw event.data:', event.data);
console.log('Google OAuth raw user payload:', event.data.user);

// Decode the JWT to extract real user data since backend sends it in the token
const decodeJWT = (token: string) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(json);
  } catch { return {}; }
};

const decoded = decodeJWT(event.data.token);
console.log('Decoded JWT in Login.tsx:', decoded);

const firstName = decoded.firstName || decoded.first_name || decoded.given_name || '';
const lastName  = decoded.lastName  || decoded.last_name  || decoded.family_name || '';
const fullName  = decoded.fullName  || decoded.name || `${firstName} ${lastName}`.trim();

const enrichedUser = {
  ...event.data.user,
  id:        decoded.userId   || decoded.user_id || decoded.sub || event.data.user?.id || '',
  email:     decoded.email    || decoded.sub || event.data.user?.email || '',
  firstName,
  lastName,
  name:      fullName,
  fullName,
  username:  decoded.username || decoded.preferred_username || decoded.email?.split('@')[0] || '',
  userType:  decoded.userType || decoded.role || 'STUDENT',
  phone:     decoded.phone    || decoded.phoneNumber || '',
  phoneNumber: decoded.phoneNumber || decoded.phone || '',
};

console.log('Enriched user from JWT:', enrichedUser);
await loginWithGoogle({ token: event.data.token, user: enrichedUser });
        // Navigation is handled by the isAuthenticated useEffect above
      } catch (err) {
        console.error('Google callback handling failed:', err);
      } finally {
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loginWithGoogle]);

  // Initiate Google OAuth popup flow
  const handleGoogleAuth = async () => {
    if (googleLoading || isLoading) return;
    setGoogleLoading(true);

    try {
      const authorizationUrl = await getGoogleAuthUrl();

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authorizationUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      }

      // Detect if popup is closed without completing auth
      // Success is handled by the postMessage listener.
      // This timeout resets the spinner if the user closes the popup without completing auth.
      setTimeout(() => {
        setGoogleLoading(false);
      }, 300000);
    } catch (err: any) {
      console.error('Google OAuth initiation failed:', err);
      setGoogleLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(signUpCredentials.password);

  
// Animation states
// Replace the useEffect animation logic with this:

// Animation states
const [squareFlipped, setSquareFlipped] = useState(true);
const [rectangleFlipped, setRectangleFlipped] = useState(false);

useEffect(() => {
  const interval = setInterval(() => {
    setSquareFlipped(prev => !prev);
    setRectangleFlipped(prev => !prev);
  }, 4000);
  
  return () => clearInterval(interval);
}, []);

const FlipCard = ({ 
  isFlipped, 
  frontContent, 
  backContent, 
  className = "" 
}: {
  isFlipped: boolean;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`[perspective:800px] ${className}`}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 1 }}
        className="relative w-full h-full [transform-style:preserve-3d]"
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl overflow-hidden">
          {frontContent}
        </div>
        {/* Back */}
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-xl overflow-hidden">
          {backContent}
        </div>
      </motion.div>
    </div>
  );
};


  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Form */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 bg-background"
      >
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-5">
          {/* Logo and Title */}
          <div className="text-center">
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.5 }}
    className="flex items-center justify-center -space-x-2 mb-3 sm:mb-4"
  >
    <img 
      src="/assets/Uni360-logo.png" 
      alt="UNI360 Logo" 
      className="w-12 h-12 sm:w-16 sm:h-16 object-contain mt-1.5"
    />
    <span className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">UNI360°</span>
  </motion.div>
  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
    {isSignUp ? 'Create Account' : 'Welcome Back'}
  </h1>
  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 px-2">
    {isSignUp 
      ? 'Join students on their journey to Germany' 
      : 'Sign in to continue your Study in Germany/UK'
    }
  </p>
</div>
          {/* Google Auth Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading || googleLoading}
              className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-700 dark:text-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span className="truncate">Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="truncate">
                    {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                  </span>
                </>
              )}
            </button>
          </motion.div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-gray-500 dark:text-gray-400">Or</span>
            </div>
          </div>

          {/* Google First Note */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl flex items-start gap-3 shadow-sm"
          >
            <Info className="w-5 h-5 flex-shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
              <strong>Note:</strong> Please sign in with Google first, if you are a new user. You can later find your manual login username and password in your account settings.
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex items-start gap-2 text-green-700 dark:text-green-400"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{successMessage}</span>
            </motion.div>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {!isSignUp ? (
              // Login Form
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
                className="space-y-2 sm:space-y-3"
              >
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginCredentials.email}
                      onChange={(e) => handleLoginInputChange('email', e.target.value)}
                      disabled={isLoading}
                      className={`pl-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginCredentials.password}
                      onChange={(e) => handleLoginInputChange('password', e.target.value)}
                      disabled={isLoading}
                      className={`pl-10 pr-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-red-500 text-sm">{validationErrors.password}</p>
                  )}
                </div>

                {/* Remember + Forgot */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={loginCredentials.rememberMe}
                      onChange={(e) => handleLoginInputChange('rememberMe', e.target.checked)}
                      disabled={isLoading}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-500">
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 bg-[#E49B0F] hover:bg-[#D97706] text-white font-semibold rounded-xl shadow-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                
              </motion.form>
            ) : (
              // Sign Up Form
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignUpSubmit}
                className="space-y-3 sm:space-y-4"
              >
                {/* First Name and Last Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        id="firstName"
                        type="text"
                        placeholder="Enter first name"
                        value={signUpCredentials.firstName}
                        onChange={(e) => handleSignUpInputChange('firstName', e.target.value)}
                        disabled={isLoading}
                        className={`pl-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          validationErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {validationErrors.firstName && (
                      <p className="text-red-500 text-sm">{validationErrors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        id="lastName"
                        type="text"
                        placeholder="Enter last name"
                        value={signUpCredentials.lastName}
                        onChange={(e) => handleSignUpInputChange('lastName', e.target.value)}
                        disabled={isLoading}
                        className={`pl-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          validationErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {validationErrors.lastName && (
                      <p className="text-red-500 text-sm">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpCredentials.email}
                      onChange={(e) => handleSignUpInputChange('email', e.target.value)}
                      disabled={isLoading}
                      className={`pl-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={signUpCredentials.password}
                      onChange={(e) => handleSignUpInputChange('password', e.target.value)}
                      disabled={isLoading}
                      className={`pl-10 pr-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {signUpCredentials.password && (
                    <div className="mt-1.5">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-0.5 flex-1 rounded ${
                              i < passwordStrength
                                ? passwordStrength <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength <= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'} password
                      </p>
                    </div>
                  )}

                  {validationErrors.password && (
                    <p className="text-red-500 text-sm">{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={signUpCredentials.confirmPassword}
                      onChange={(e) => handleSignUpInputChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      className={`pl-10 pr-10 h-11 sm:h-12 w-full rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                        validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {signUpCredentials.confirmPassword && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {signUpCredentials.password === signUpCredentials.confirmPassword ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-600 dark:text-red-400">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}

                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-sm">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={signUpCredentials.acceptTerms}
                      onChange={(e) => handleSignUpInputChange('acceptTerms', e.target.checked)}
                      className={`mt-0.5 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded flex-shrink-0 disabled:opacity-50 ${
                        validationErrors.acceptTerms ? 'border-red-300 dark:border-red-600' : ''
                      }`}
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-5">
                      I agree to the{' '}
                      <Link to="/terms" className="text-orange-600 hover:text-orange-500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-orange-600 hover:text-orange-500">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {validationErrors.acceptTerms && (
                    <p className="text-red-500 text-sm">{validationErrors.acceptTerms}</p>
                  )}
                </div>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 bg-[#E49B0F] hover:bg-[#D97706] text-white font-semibold rounded-xl shadow-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* Sign In Link for Sign Up Form */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    disabled={isLoading}
                    className="text-orange-600 hover:text-orange-500 font-medium disabled:opacity-50"
                  >
                    Sign in
                  </button>
                </motion.p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Right Section - Illustration */}
      {/* Right Section - Image Grid */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 bg-[#C4DFF0] dark:from-gray-900 dark:to-gray-800 items-center justify-center p-8 xl:p-12"
      >
        <div className="max-w-md xl:max-w-lg w-full">
          {/* Testimonials Grid */}
          {/* Testimonials Grid */}
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 0.3, duration: 0.8 }}
  className="space-y-4 mb-6"
>
  {/* First Row - Large horizontal card + Square card with flip */}
  <div className="grid grid-cols-3 gap-3 h-28">
    <FlipCard
      isFlipped={rectangleFlipped}
  className="col-span-2"
      frontContent={
        <div className="bg-white rounded-xl p-3 shadow-lg flex flex-col justify-between overflow-hidden h-full">
          <p className="text-xs text-gray-800 leading-tight line-clamp-3">
            When I spoke with Vikrant I was already working with one consultancy who were not helping me much. I trusted Vikrant and went ahead with Ambitio and has been the best decision.
          </p>
          <div className="flex items-center gap-2 mt-1">
            
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-red-600 truncate">Vishal</h4>
              <p className="text-xs text-gray-600 truncate">UC Berkeley</p>
            </div>
          </div>
        </div>
      }
      backContent={
        <img 
          src="/assets/vadim-sherbakov-d6ebY-faOO0-unsplash.jpg"
          alt="University" 
          className="w-full h-full object-cover object-center rounded-xl"
        />
      }
    />
    <FlipCard
     isFlipped={squareFlipped}
  className="relative"
      frontContent={
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg overflow-hidden h-full">
          <img 
            src="/assets/vishal.jpg" 
            alt="Vishal" 
            className="w-full h-full object-cover"
          />
        </div>
      }
      backContent={
        <img 
  src="/assets/Lcn_logo.jpg"
  alt="LCN Logo" 
  className="w-full h-full object-contain bg-white rounded-xl"
/>
      }
    />
  </div>

  {/* Second Row - Square card with flip + Large horizontal card */}
  <div className="grid grid-cols-3 gap-3 h-28">
    <FlipCard
      isFlipped={squareFlipped}
  className="relative"
      frontContent={
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-lg overflow-hidden h-full">
          <img 
            src="/assets/siddika.jpg" 
            alt="Siddika" 
            className="w-full h-full object-cover"
          />
        </div>
      }
      backContent={
        <img 
          src="/assets/512px-Accadis_Hochschule_Bad_Homburg_logo.svg.png"
          alt="Accadis Logo" 
          className="w-full h-full object-contain bg-white rounded-xl"
        />
      }
    />
    <FlipCard
     isFlipped={rectangleFlipped}
  className="col-span-2"
      frontContent={
        <div className="bg-white rounded-xl p-3 shadow-lg flex flex-col justify-between overflow-hidden h-full">
          <p className="text-xs text-gray-800 leading-tight line-clamp-3">
            I was not sure if I have a shot at top schools in UK as I had very weak academics, I mean really weak. But Vikrant's utmost belief made me go for it, and now I am studying in my dream school.
          </p>
          <div className="flex items-center gap-2 mt-1">
            
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-blue-600 truncate">Siddika</h4>
              <p className="text-xs text-gray-600 truncate">Warwick Business School</p>
            </div>
          </div>
        </div>
      }
      backContent={
        <img 
          src="/assets/eric-sharp-JdzHrfX4l4Q-unsplash.jpg"
          alt="University" 
          className="w-full h-full object-cover object-center rounded-xl"
        />
      }
    />
  </div>

  {/* Third Row - Large horizontal card + Square card with flip */}
  <div className="grid grid-cols-3 gap-3 h-28">
    <FlipCard
      isFlipped={rectangleFlipped}
  className="col-span-2"
      frontContent={
        <div className="bg-white rounded-xl p-3 shadow-lg flex flex-col justify-between overflow-hidden h-full">
          <p className="text-xs text-gray-800 leading-tight line-clamp-3">
            My friend recommended Ambitio to me, I had a brief chat with Vikrant and got onboard. And I am really glad I did. Now, studying in a top PhD program of my niche.
          </p>
          <div className="flex items-center gap-2 mt-1">
    
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-purple-600 truncate">Dishant</h4>
              <p className="text-xs text-gray-600 truncate">UT Austin</p>
            </div>
          </div>
        </div>
      }
      backContent={
        <img 
          src="/assets/s-k-9FUJeRATuQs-unsplash.jpg"
          alt="University" 
          className="w-full h-full object-cover object-center rounded-xl"
        />
      }
    />
    <FlipCard
      isFlipped={squareFlipped}
  className="relative"
      frontContent={
        <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl shadow-lg overflow-hidden h-full">
          <img 
            src="/assets/dishant.jpg" 
            alt="Dishant" 
            className="w-full h-full object-cover"
          />
        </div>
      }
      backContent={
        <img 
          src="/assets/512px-Fachhochschule_Brandenburg_logo_alt.svg.png"
          alt="Brandenburg Logo" 
          className="w-full h-full object-contain bg-white rounded-xl"
        />
      }
    />
  </div>
</motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
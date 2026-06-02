import React from 'react';
const { useState, useEffect } = React;
import {
  User,
  Save,
  Upload,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Copy,
  ClipboardCheck,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { requestPasswordReset } from '@/services/auth';
import { uploadProfilePhoto, deleteProfilePhoto } from '@/services/profile';

// Utility function
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase();
};

// Card components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200", className)}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200", className)}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={cn("text-lg sm:text-xl font-semibold", className)} style={{ color: '#2C3539' }}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-4 sm:px-6 py-4 sm:py-6", className)}>
    {children}
  </div>
);

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Button = ({ children, variant = "primary", size = "md", className = "", onClick, ...props }: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "text-white hover:opacity-90 focus:ring-blue-300",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-300",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-300"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  const primaryStyle = variant === "primary" ? { backgroundColor: '#C4DFF0', color: '#2C3539' } : {};
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      onClick={onClick}
      style={primaryStyle}
      {...props}
    >
      {children}
    </button>
  );
};

// Password strength helper
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  return strength;
};

const getStrengthLabel = (strength: number) => {
  if (strength <= 1) return { label: 'Very Weak', color: '#ef4444' };
  if (strength === 2) return { label: 'Weak', color: '#f97316' };
  if (strength === 3) return { label: 'Fair', color: '#eab308' };
  if (strength === 4) return { label: 'Strong', color: '#22c55e' };
  return { label: 'Very Strong', color: '#16a34a' };
};

const Settings = () => {
  const { user, updateUserProfile, setPassword } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    currentLocation: '',
    targetCountries: [] as string[]
  });

  // Password management state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // If backend says "current password required" but we didn't show the field, flip this on
  const [forceShowCurrentPassword, setForceShowCurrentPassword] = useState(false);
  // Stores the newly set password temporarily for copy-to-clipboard
  const [newlySetPassword, setNewlySetPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [revealSetPassword, setRevealSetPassword] = useState(false);
  // Forgot password inline flow
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Temp password modal
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false);
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
  // Derived state — use fallback chain for provider detection
  const authProvider = user?.authProvider || (user as any)?.provider || 'LOCAL';
  const isGoogleOnly = authProvider === 'GOOGLE';
  const hasExistingPassword = user?.hasPassword === true || forceShowCurrentPassword;

  // Initialize form data with user data
  useEffect(() => {
  if (user) {
    setFormData({
      name: user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
      email: user.email || '',
      phone: user.phone || user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        nationality: user.nationality || '',
        currentLocation: user.currentLocation || '',
        targetCountries: user.targetCountries || []
      });
      setProfileImage(user.profilePhoto || null);
    }
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsSaving(true);
        // Convert to base64 for preview
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          setProfileImage(base64);
          
          // Upload to backend
          try {
            const response = await uploadProfilePhoto(base64);
            if (response?.profilePhoto) {
              await updateUserProfile({ profilePhoto: response.profilePhoto });
            }
          } catch (error) {
            console.error('Error uploading photo:', error);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error handling image upload:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsRemoving(true);
      setProfileImage(null); // Update UI immediately
      await deleteProfilePhoto();
      await updateUserProfile({ profilePhoto: null });
    } catch (error) {
      console.error('Error removing photo:', error);
      // Restore image if operation failed
      if (user?.profilePhoto) {
        setProfileImage(user.profilePhoto);
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountryToggle = (country: string) => {
    setFormData(prev => ({
      ...prev,
      targetCountries: prev.targetCountries.includes(country)
        ? prev.targetCountries.filter(c => c !== country)
        : [...prev.targetCountries, country]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      // Split name into first and last name
      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const profileData = {
        name: formData.name,
        firstName,
        lastName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        currentLocation: formData.currentLocation,
        targetCountries: formData.targetCountries
      };
      
      await updateUserProfile(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Password form handlers
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear message when user starts typing
    if (passwordMessage) setPasswordMessage(null);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setNewlySetPassword(null);
    setPasswordCopied(false);

    // Validation
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    try {
      setIsSettingPassword(true);
      const result = await setPassword({
        // Always send currentPassword if user typed one — backend decides if it's required
        currentPassword: passwordData.currentPassword || undefined,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      // Save password temporarily so user can copy it
      setNewlySetPassword(passwordData.newPassword);
      setPasswordMessage({ type: 'success', text: result.message || 'Password updated successfully!' });
      // Clear the form
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setForceShowCurrentPassword(false);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to set password. Please try again.';
      
      // If backend says current password is required, highlight it
      if (errorMsg.toLowerCase().includes('current password')) {
        setForceShowCurrentPassword(true);
        setPasswordMessage({ type: 'error', text: errorMsg });
      } else {
        setPasswordMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!newlySetPassword) return;
    try {
      await navigator.clipboard.writeText(newlySetPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 3000);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = newlySetPassword;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 3000);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setResetMessage({ type: 'error', text: 'No email address found on your account.' });
      return;
    }
    setIsSendingReset(true);
    setResetMessage(null);
    try {
      const response = await requestPasswordReset(formData.email);
      const tmp = response?.data?.temporary_password || null;
      if (tmp) {
        setTempPassword(tmp);
        setTempPasswordCopied(false);
        setShowTempPasswordModal(true);
      } else {
        setResetMessage({ type: 'success', text: 'Reset instructions sent. Check your inbox.' });
      }
    } catch (error: any) {
      setResetMessage({ type: 'error', text: error.message || 'Failed to send reset. Please try again.' });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setTempPasswordCopied(true);
      setTimeout(() => setTempPasswordCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tempPassword;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setTempPasswordCopied(true);
      setTimeout(() => setTempPasswordCopied(false), 3000);
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const strengthInfo = getStrengthLabel(passwordStrength);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: '#2C3539' }}>
                Settings
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage your account preferences and profile information.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#C4DFF0' }}>
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl font-semibold" style={{ color: '#2C3539' }}>
                          {getInitials(formData.name || 'User')}
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 p-1.5 sm:p-2 text-white rounded-full cursor-pointer hover:opacity-90 transition-colors shadow-lg"
                      style={{ backgroundColor: '#E08D3C' }}
                    >
                      <Upload size={12} className="sm:w-4 sm:h-4" />
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#2C3539' }}>
                      Profile Picture
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Upload a professional photo for your profile
                    </p>
                    <div className="flex flex-col xs:flex-row gap-2 mt-2 sm:mt-3">
                      <label htmlFor="profile-upload-2">
                        
                        <input
                          id="profile-upload-2"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isSaving || isRemoving}
                        />
                      </label>
                      {profileImage && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:border-red-400"
                          onClick={handleRemovePhoto}
                          disabled={isRemoving || isSaving}
                        >
                          {isRemoving ? 'Removing...' : 'Remove'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2C3539' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base"
                      style={{ 
                        focusRingColor: '#C4DFF0',
                        '--tw-ring-color': '#C4DFF0'
                      } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = '#C4DFF0'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2C3539' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                      onFocus={(e) => e.target.style.borderColor = '#C4DFF0'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  
                </div>
              </CardContent>
            </Card>

            {/* Password & Security Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFF3E0' }}>
                      <Shield size={20} style={{ color: '#E08D3C' }} />
                    </div>
                    <div>
                      <CardTitle>Password & Security</CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">Manage your login credentials</p>
                    </div>
                  </div>
                  {/* Auth Provider Badge */}
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5",
                    authProvider === 'GOOGLE' && "bg-red-50 text-red-700 border border-red-200",
                    authProvider === 'HYBRID' && "bg-purple-50 text-purple-700 border border-purple-200",
                    authProvider === 'LOCAL' && "bg-blue-50 text-blue-700 border border-blue-200",
                  )}>
                    {authProvider === 'GOOGLE' && (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google Only
                      </>
                    )}
                    {authProvider === 'HYBRID' && (
                      <>
                        <Shield className="w-3.5 h-3.5" />
                        Hybrid (Google + Password)
                      </>
                    )}
                    {authProvider === 'LOCAL' && (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Email + Password
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Info Banner for Google-only users */}
                {isGoogleOnly && (
                  <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">
                        Enable Email + Password Login
                      </h4>
                      <p className="text-sm text-amber-700">
                        You currently sign in with Google only. Set a password below to also log in with your email and password. 
                        Your Google Sign-In will continue to work.
                      </p>
                    </div>
                  </div>
                )}

                {/* Success / Error Messages */}
                {passwordMessage && (
                  <div className={cn(
                    "mb-6 p-4 rounded-xl flex flex-col gap-3 border",
                    passwordMessage.type === 'success' && "bg-green-50 border-green-200",
                    passwordMessage.type === 'error' && "bg-red-50 border-red-200",
                  )}>
                    <div className="flex items-start gap-3">
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={cn(
                        "text-sm font-medium",
                        passwordMessage.type === 'success' ? "text-green-700" : "text-red-700"
                      )}>
                        {passwordMessage.text}
                      </p>
                    </div>

                    {/* Copy Password UI — shown only after a successful set/change */}
                    {passwordMessage.type === 'success' && newlySetPassword && (
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                              passwordCopied
                                ? "bg-green-100 border-green-300 text-green-700"
                                : "bg-white border-green-300 text-green-700 hover:bg-green-50"
                            )}
                          >
                            {passwordCopied
                              ? <><ClipboardCheck className="w-3.5 h-3.5" /> Copied!</>
                              : <><Copy className="w-3.5 h-3.5" /> Copy Password</>
                            }
                          </button>
                          <span className="text-xs text-green-600 font-mono bg-green-100 px-2 py-1 rounded select-all border border-green-200">
                            {revealSetPassword ? newlySetPassword : '•'.repeat(newlySetPassword.length)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealSetPassword(prev => !prev)}
                            className="inline-flex items-center p-1.5 rounded-lg border border-green-300 bg-white text-green-700 hover:bg-green-50 transition-all duration-200"
                            title={revealSetPassword ? "Hide password" : "Show password"}
                          >
                            {revealSetPassword
                              ? <EyeOff className="w-3.5 h-3.5" />
                              : <Eye className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 font-medium">
                            Please copy and save your password now — it won't be shown again once you leave this page.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Password Form */}
                <form onSubmit={handleSetPassword} className="space-y-5">
                  {/* Current Password - always shown, marked optional for Google-only users */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2C3539' }}>
                      Current Password
                      {isGoogleOnly && !forceShowCurrentPassword && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(skip if setting password for the first time)</span>
                      )}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                        placeholder={isGoogleOnly && !forceShowCurrentPassword ? 'Leave empty if first time' : 'Enter your current password'}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                        onFocus={(e) => e.target.style.borderColor = '#C4DFF0'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        disabled={isSettingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Forgot password link — shown whenever the current password field is visible */}
                    {(hasExistingPassword || isGoogleOnly) && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={isSendingReset}
                            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ color: '#E08D3C' }}
                          >
                            {isSendingReset ? (
  <><Loader2 className="w-3 h-3 animate-spin" /> Sending temporary password...</>
) : (
  <>Forgot your password? Get a temporary password</>
)}
                          </button>
                        </div>
                        {resetMessage && (
                          <div className={cn(
                            "flex items-start gap-2 p-2.5 rounded-lg border text-xs",
                            resetMessage.type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                          )}>
                            {resetMessage.type === 'success'
                              ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            }
                            <span className="font-medium">{resetMessage.text}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2C3539' }}>
                      {isGoogleOnly ? 'Set Password' : 'New Password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                        placeholder={isGoogleOnly ? 'Create a password' : 'Enter new password'}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                        onFocus={(e) => e.target.style.borderColor = '#C4DFF0'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        disabled={isSettingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                              style={{
                                backgroundColor: i < passwordStrength ? strengthInfo.color : '#e5e7eb'
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-medium" style={{ color: strengthInfo.color }}>
                          {strengthInfo.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Must be 8+ characters with uppercase, lowercase, number, and special character
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2C3539' }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                        onFocus={(e) => e.target.style.borderColor = '#C4DFF0'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        disabled={isSettingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {passwordData.confirmPassword && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {passwordData.newPassword === passwordData.confirmPassword ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-green-600 font-medium">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                            <span className="text-xs text-red-600 font-medium">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSettingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                      style={{ backgroundColor: '#E08D3C' }}
                    >
                      {isSettingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {isGoogleOnly ? 'Setting Password...' : 'Changing Password...'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          {isGoogleOnly ? 'Set Password' : 'Change Password'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Temporary Password Modal ── */}
      {showTempPasswordModal && tempPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowTempPasswordModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#FFF3E0' }}>
                <KeyRound className="w-5 h-5" style={{ color: '#E08D3C' }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: '#2C3539' }}>Your Temporary Password</h3>
                <p className="text-xs text-gray-500">Generated just for you — valid for one login</p>
              </div>
            </div>

            {/* Password display */}
            <div className="rounded-xl border-2 border-dashed p-4 space-y-3" style={{ borderColor: '#E08D3C', backgroundColor: '#FFFBF5' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-bold tracking-widest select-all" style={{ color: '#2C3539' }}>
                  {tempPassword}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTempPassword}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200"
                  style={tempPasswordCopied
                    ? { backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#15803d' }
                    : { backgroundColor: '#FFF3E0', borderColor: '#E08D3C', color: '#E08D3C' }
                  }
                >
                  {tempPasswordCopied
                    ? <><ClipboardCheck className="w-3.5 h-3.5" /> Copied!</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy</>
                  }
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#FFF8E1' }}>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1.5 text-xs text-amber-800">
                  <p className="font-semibold">How to use this temporary password:</p>
                  <ol className="list-decimal list-inside space-y-1 font-medium">
                    <li>Copy the password above</li>
                    <li>Log out and sign in using your email + this password</li>
                    <li>Go to Settings → Password & Security and set a new permanent password</li>
                  </ol>
                  <p className="font-semibold text-amber-700 mt-2">⚠️ This password is shown only once. Copy it now before closing.</p>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowTempPasswordModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#E08D3C' }}
            >
              I've copied my password, close this
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Custom breakpoints */
          @media (min-width: 375px) {
            .xs\\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .xs\\:flex-row {
              flex-direction: row;
            }
            .xs\\:inline {
              display: inline;
            }
          }
          
          /* iPhone SE and small devices */
          @media (max-width: 374px) {
            .grid-cols-1 {
              grid-template-columns: 1fr;
            }
          }
          
          /* Fold devices and tablets */
          @media (min-width: 768px) and (max-width: 1023px) {
            .fold\\:grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          
          /* Large devices optimization */
          @media (min-width: 1536px) {
            .xl\\:max-w-none {
              max-width: none;
            }
          }
        `
      }} />
    </div>
  );
};

export default Settings;
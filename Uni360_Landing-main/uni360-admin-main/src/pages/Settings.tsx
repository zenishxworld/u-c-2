import React from 'react';
const { useState, useEffect } = React;
import { Save, Upload, Video } from 'lucide-react';
import { authService } from '../services/authService';
import { apiRequest } from '../services/auth';

// Mock Redux hook - in real app this would be from react-redux
const useAppDispatch = () => {
  return (action) => {
    console.log('Dispatching action:', action);
    // Simulate updating global state
    if (action.type === 'auth/updateUserProfile') {
      // Trigger custom event to notify other components
      window.dispatchEvent(new CustomEvent('profile-updated', { 
        detail: action.payload 
      }));
    }
  };
};

// Mock useAuth hook and related functions
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const storedUser = authService.getStoredUser();
        
        if (storedUser) {
          // Fetch full profile from API
          const profileData = await apiRequest('/api/v1/user/profile', 'GET');
          
          setUser({
            name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
            email: profileData.email || storedUser.email,
            phone: profileData.phoneNumber || profileData.phone || '',
            dateOfBirth: profileData.dateOfBirth || '',
            nationality: profileData.nationality || '',
            currentLocation: profileData.currentLocation || '',
            targetCountries: profileData.targetCountries || [],
            googleMeetLink: profileData.googleMeetLink || '',
            profilePhoto: profileData.profilePhoto || profileData.avatarUrl || null
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to stored user data
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser({
            name: storedUser.name || '',
            email: storedUser.email || '',
            phone: '',
            dateOfBirth: '',
            nationality: '',
            currentLocation: '',
            targetCountries: [],
            googleMeetLink: '',
            profilePhoto: storedUser.avatarUrl || null
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const updateUserProfile = async (data) => {
    try {
      await apiRequest('/api/v1/user/profile', 'PUT', data);
      
      // Refresh user data
      const profileData = await apiRequest('/api/v1/user/profile', 'GET');
      setUser({
        name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
        email: profileData.email,
        phone: profileData.phoneNumber || profileData.phone || '',
        dateOfBirth: profileData.dateOfBirth || '',
        nationality: profileData.nationality || '',
        currentLocation: profileData.currentLocation || '',
        targetCountries: profileData.targetCountries || [],
        googleMeetLink: profileData.googleMeetLink || '',
        profilePhoto: profileData.profilePhoto || profileData.avatarUrl || null
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return { user, updateUserProfile, loading };
};
const uploadProfilePhoto = async (base64) => {
  try {
    const response = await apiRequest('/api/v1/user/profile/photo', 'POST', { 
      profilePhoto: base64 
    });
    return response;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

const deleteProfilePhoto = async () => {
  try {
    await apiRequest('/api/v1/user/profile/photo', 'DELETE');
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

// Utility function
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase();
};

// Validation functions
const validateGoogleMeetLink = (url) => {
  if (!url) return true; // Optional field
  const meetPattern = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i;
  return meetPattern.test(url);
};

const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Full name is required';
  }
  
  return errors;
};

// Card components
const Card = ({ children, className = "" }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200", className)}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={cn("px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200", className)}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={cn("text-lg sm:text-xl font-semibold", className)} style={{ color: '#2C3539' }}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={cn("px-4 sm:px-6 py-4 sm:py-6", className)}>
    {children}
  </div>
);

// Button component
const Button = ({ children, variant = "primary", size = "md", className = "", onClick, disabled = false, ...props }) => {
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
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Settings = () => {
  const { user, updateUserProfile, loading } = useAuth();
  const dispatch = useAppDispatch();
  const [profileImage, setProfileImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    currentLocation: '',
    googleMeetLink: '',
    targetCountries: []
  });

  // Load initial profile data from localStorage on mount
  useEffect(() => {
    const loadInitialData = () => {
      const savedProfile = JSON.parse(localStorage.getItem('userProfile') || localStorage.getItem('authUser') || '{}');
      if (savedProfile.profilePhoto || savedProfile.profileImage || savedProfile.avatarUrl) {
        const profileImg = savedProfile.profilePhoto || savedProfile.profileImage || savedProfile.avatarUrl;
        setProfileImage(profileImg);
      }
    };
    
    loadInitialData();
  }, []);

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        nationality: user.nationality || '',
        currentLocation: user.currentLocation || '',
        googleMeetLink: user.googleMeetLink || '',
        targetCountries: user.targetCountries || []
      });
      setProfileImage(user.profilePhoto || null);
    }
  }, [user]);

  // Helper function to trigger all necessary events for profile sync
  const triggerProfileSync = (updatedData) => {
    // Update localStorage with multiple keys for compatibility
    const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const updatedUser = { ...currentUser, ...updatedData };
    
    localStorage.setItem('authUser', JSON.stringify(updatedUser));
    localStorage.setItem('userProfile', JSON.stringify(updatedUser));
    
    // Dispatch all the events that components are listening for
    window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedData }));
    window.dispatchEvent(new CustomEvent('profilePhotoChanged', { detail: updatedData }));
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedData }));
    
    // Trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'authUser',
      newValue: JSON.stringify(updatedUser),
      oldValue: JSON.stringify(currentUser)
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userProfile',
      newValue: JSON.stringify(updatedUser),
      oldValue: JSON.stringify(currentUser)
    }));

    // Redux dispatch
    dispatch({
      type: 'auth/updateUserProfile',
      payload: updatedData
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsSaving(true);
        // Convert to base64 for preview
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result;
          setProfileImage(base64);
          
          // Upload to backend
          try {
            const response = await uploadProfilePhoto(base64);
            if (response?.profilePhoto) {
              await updateUserProfile({ profilePhoto: response.profilePhoto });
              
              // Trigger sync across all components with all possible naming conventions
              triggerProfileSync({ 
                profilePhoto: response.profilePhoto,
                profileImage: response.profilePhoto,
                avatarUrl: response.profilePhoto,
                avatar: response.profilePhoto
              });
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
      
      // Trigger sync to remove profile photo from all components
      triggerProfileSync({ 
        profilePhoto: null,
        profileImage: null,
        avatarUrl: null,
        avatar: null
      });
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCountryToggle = (country) => {
    setFormData(prev => ({
      ...prev,
      targetCountries: prev.targetCountries.includes(country)
        ? prev.targetCountries.filter(c => c !== country)
        : [...prev.targetCountries, country]
    }));
  };

  const handleSaveProfile = async () => {
    // Validate form
    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});
      
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
        googleMeetLink: formData.googleMeetLink,
        targetCountries: formData.targetCountries
      };
      
      await updateUserProfile(profileData);
      
      // Trigger sync across all components
      triggerProfileSync(profileData);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      ) : (
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
                    <div className="flex flex-col gap-2 mt-2 sm:mt-3">
                      <label htmlFor="profile-upload-2">
                        <Button variant="outline" size="sm" disabled={isSaving || isRemoving}>
                          <Upload size={14} className="mr-2" />
                          {isSaving ? 'Uploading...' : 'Upload Photo'}
                        </Button>
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
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base",
                        errors.name ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-blue-300"
                      )}
                      onFocus={(e) => e.target.style.borderColor = errors.name ? '#fca5a5' : '#C4DFF0'}
                      onBlur={(e) => e.target.style.borderColor = errors.name ? '#fca5a5' : '#d1d5db'}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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

                

                
              </CardContent>
            </Card>
          </div>
        </div>
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
    </>
  );
};

export default Settings;
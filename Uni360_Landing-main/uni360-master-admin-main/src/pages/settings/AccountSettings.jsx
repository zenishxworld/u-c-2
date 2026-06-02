import React, { useState, useEffect } from "react";
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { getCurrentUser } from "../../services/authService";
import api from "../../services/api";

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    joinDate: "",
    username: "",
    employeeId: "",
    country: "",
    city: "",
    timezone: "",
    language: "",
    fullName: "",
    userType: "",
    status: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    applicationUpdates: true,
    paymentAlerts: true,
    systemMaintenance: true,
    weeklyReports: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    itemsPerPage: "25",
  });

  const tabs = [
    { id: "profile", name: "Profile", icon: UserCircleIcon },
  ];

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      const user = getCurrentUser();
      if (user) {
        setProfileData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          role: user.userType || user.roles?.[0] || "",
          department: user.department || "",
          joinDate: user.loginAt ? new Date(user.loginAt).toISOString().split('T')[0] : "",
          username: user.username || "",
          employeeId: user.employeeId || "",
          country: user.country || "",
          city: user.city || "",
          timezone: user.timezone || "UTC",
          language: user.language || "en",
          fullName: user.fullName || `${user.firstName} ${user.lastName}`,
          userType: user.userType || "",
          status: user.status || "",
        });

        setPreferences({
          language: user.language || "en",
          timezone: user.timezone || "UTC",
          dateFormat: user.dateFormat || "MM/DD/YYYY",
          itemsPerPage: user.itemsPerPage || "25",
        });
      }
    };

    loadUserData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus("");

    try {
      // Make API call to update profile
      const response = await api.put('/api/v1/users/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phone,
        department: profileData.department,
        country: profileData.country,
        city: profileData.city,
      });

      if (response.data.success) {
        // Update localStorage with new data
        const currentUser = getCurrentUser();
        const updatedUser = {
          ...currentUser,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phone,
          department: profileData.department,
          country: profileData.country,
          city: profileData.city,
          fullName: `${profileData.firstName} ${profileData.lastName}`,
        };
        localStorage.setItem('uni360_user', JSON.stringify(updatedUser));

        setSaveStatus("success");
      }
    } catch (error) {
      setSaveStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/v1/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        alert("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key) => {
    const newValue = !notifications[key];

    setNotifications((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    try {
      await api.put('/api/v1/users/notifications', {
        [key]: newValue,
      });
    } catch (error) {
      // Revert on error
      setNotifications((prev) => ({
        ...prev,
        [key]: !newValue,
      }));
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/api/v1/users/preferences', preferences);

      if (response.data.success) {
        // Update localStorage
        const currentUser = getCurrentUser();
        const updatedUser = {
          ...currentUser,
          language: preferences.language,
          timezone: preferences.timezone,
          dateFormat: preferences.dateFormat,
          itemsPerPage: preferences.itemsPerPage,
        };
        localStorage.setItem('uni360_user', JSON.stringify(updatedUser));

        alert("Preferences saved successfully!");
      }
    } catch (error) {
      alert("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Account Settings
        </h1>
        <div className="flex items-center space-x-2">
          {saveStatus === "success" && (
            <>
              <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span className="text-xs md:text-sm text-green-600">
                Changes saved successfully
              </span>
            </>
          )}
          {saveStatus === "error" && (
            <span className="text-xs md:text-sm text-red-600">
              Failed to save changes
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        {/* Settings Content */}
        <div className="w-full max-w-4xl">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-base md:text-lg font-medium text-gray-900">
                  Profile Information
                </h3>
                <div className="flex items-center space-x-2">
                  {profileData.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${profileData.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {profileData.status}
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 md:space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      readOnly
                      className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      readOnly
                      className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    readOnly
                    className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                  />
                </div>



                {/* Account Info (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileData.username}
                      readOnly
                      className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      User Type
                    </label>
                    <input
                      type="text"
                      value={profileData.userType}
                      readOnly
                      className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Organization Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profileData.role}
                      readOnly
                      className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                    />
                  </div>

                </div>

                {profileData.employeeId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={profileData.employeeId}
                        readOnly
                        className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Join Date
                      </label>
                      <input
                        type="text"
                        value={profileData.joinDate}
                        readOnly
                        className="input-field bg-gray-50 text-sm md:text-base cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Location Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">


                </div>


              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
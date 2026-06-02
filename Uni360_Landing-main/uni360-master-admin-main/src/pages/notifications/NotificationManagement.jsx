import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChartBarIcon,
  ClockIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  getNotificationOverview,
  broadcastNotification,
  getNotificationAnalytics,
  getNotificationTemplates,
} from "../../services/notificationApi";

// UNI360 brand-aligned chart colors
const COLORS = ["hsl(28, 70%, 56%)", "hsl(195, 35%, 70%)", "hsl(195, 20%, 19%)", "hsl(28, 70%, 65%)", "hsl(195, 35%, 82%)", "hsl(28, 70%, 45%)"];

const NotificationManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState({
    overview: false,
    analytics: false,
    templates: false,
    sending: false,
  });

  // Overview State
  const [overview, setOverview] = useState(null);

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    period_type: "LAST_30_DAYS",
    user_type: "",
    notification_type: "",
    start_date: "",
    end_date: "",
  });

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [templatesPage, setTemplatesPage] = useState(0);
  const [templatesSize, setTemplatesSize] = useState(20);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Notification Form State
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    type: "SYSTEM_ALERT",
    priority: "MEDIUM",
    content_type: "PLAIN",
    delivery_channels: ["IN_APP"],
    target_audience: {
      include_all_users: false,
      user_types: [],
      active_users_only: true,
    },
  });

  // User selection state
  const [selectedUserTypes, setSelectedUserTypes] = useState([]);

  const [successModal, setSuccessModal] = useState(false);

  // Fetch Overview on mount
  useEffect(() => {
    fetchOverview();
  }, []);

  // Fetch Analytics when filters change
  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab, analyticsFilters]);

  // Fetch Templates when tab is active
  useEffect(() => {
    if (activeTab === "templates") {
      fetchTemplates();
    }
  }, [activeTab, templatesPage, templatesSize]);

  const fetchOverview = async () => {
    setLoading((prev) => ({ ...prev, overview: true }));
    try {
      const response = await getNotificationOverview();
      if (response.success) {
        setOverview(response.data);
      }
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, overview: false }));
    }
  };

  const fetchAnalytics = async () => {
    setLoading((prev) => ({ ...prev, analytics: true }));
    try {
      const params = {};
      if (analyticsFilters.period_type) params.period_type = analyticsFilters.period_type;
      if (analyticsFilters.user_type) params.user_type = analyticsFilters.user_type;
      if (analyticsFilters.notification_type) params.notification_type = analyticsFilters.notification_type;
      if (analyticsFilters.start_date) params.start_date = analyticsFilters.start_date;
      if (analyticsFilters.end_date) params.end_date = analyticsFilters.end_date;

      const response = await getNotificationAnalytics(params);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  };

  const fetchTemplates = async () => {
    setLoading((prev) => ({ ...prev, templates: true }));
    try {
      const response = await getNotificationTemplates({
        page: templatesPage,
        size: templatesSize,
      });
      if (response.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, templates: false }));
    }
  };

  const handleSendNotification = async () => {
    if (!notification.title || !notification.message || selectedUserTypes.length === 0) {
      alert("Please fill in all required fields and select at least one user type.");
      return;
    }

    setLoading((prev) => ({ ...prev, sending: true }));

    const broadcastData = {
      ...notification,
      target_audience: {
        ...notification.target_audience,
        user_types: selectedUserTypes,
      },
    };
    try {
      const response = await broadcastNotification(broadcastData);
      if (response.success) {
        setSuccessModal(true);
        // Reset form
        setNotification({
          title: "",
          message: "",
          type: "SYSTEM_ALERT",
          priority: "MEDIUM",
          content_type: "PLAIN",
          delivery_channels: ["IN_APP"],
          target_audience: {
            include_all_users: false,
            user_types: [],
            active_users_only: true,
          },
        });
        setSelectedUserTypes([]);
        fetchOverview();
      } else {
        setSuccessModal({ type: "error", message: `Failed to send: ${response.message}` });
      }
    } catch (error) {
      const errorMessage = error.message || "Failed to send notification. Please try again.";
      setSuccessModal({ type: "error", message: errorMessage });
    } finally {
      setLoading((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleUserTypeToggle = (userType) => {
    setSelectedUserTypes((prev) =>
      prev.includes(userType) ? prev.filter((t) => t !== userType) : [...prev, userType]
    );
  };

  const handleAnalyticsFilterChange = (field, value) => {
    setAnalyticsFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearAnalyticsFilters = () => {
    setAnalyticsFilters({
      period_type: "LAST_30_DAYS",
      user_type: "",
      notification_type: "",
      start_date: "",
      end_date: "",
    });
  };

  const useTemplateForNotification = (template) => {
    setNotification((prev) => ({
      ...prev,
      title: template.subject_template,
      message: template.content_template,
      type: template.notification_type,
      priority: template.priority,
      content_type: template.content_type,
    }));
    setActiveTab("compose");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const notificationTypes = [
    { value: "SYSTEM_ALERT", label: "System Alert", icon: ExclamationCircleIcon },
    { value: "ADMIN_ANNOUNCEMENT", label: "Announcement", icon: InformationCircleIcon },
    { value: "GENERAL_INFO", label: "General Info", icon: InformationCircleIcon },
    { value: "TASK_COMPLETION", label: "Task Completion", icon: CheckCircleIcon },
  ];

  const priorityLevels = [
    { value: "LOW", label: "Low Priority" },
    { value: "MEDIUM", label: "Medium Priority" },
    { value: "HIGH", label: "High Priority" },
    { value: "URGENT", label: "Urgent" },
  ];

  const userTypes = [
    { value: "STUDENT", label: "Students", icon: AcademicCapIcon },
    { value: "ADMIN", label: "Admins", icon: UserGroupIcon },
  ];

  const periodTypes = [
    { value: "LAST_24_HOURS", label: "Last 24 Hours" },
    { value: "LAST_7_DAYS", label: "Last 7 Days" },
    { value: "LAST_30_DAYS", label: "Last 30 Days" },
    { value: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Notification Management
            </h1>
            <BellIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Send and manage notifications across the platform
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border rounded-t-lg">
        <nav className="flex flex-wrap gap-2 sm:gap-4 -mb-px px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-all ${activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}>
            <ChartBarIcon className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("compose")}
            className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-all ${activeTab === "compose"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}>
            <PaperAirplaneIcon className="h-4 w-4" />
            Compose
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-all ${activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}>
            <ArrowTrendingUpIcon className="h-4 w-4" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">
          {loading.overview ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading overview...</p>
            </div>
          ) : overview ? (
            <>
              {/* Stats Cards - UNI360 styled */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg border-l-4 border-primary p-6 transition-all hover:-translate-y-1"
                  style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Sent</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {overview.overview_stats?.total_sent || 0}
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                      <PaperAirplaneIcon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-lg border-l-4 border-primary-light p-6 transition-all hover:-translate-y-1"
                  style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Delivered</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {overview.overview_stats.total_delivered}
                      </p>
                      <p className="text-xs text-primary-dark mt-1">
                        {overview.overview_stats?.delivery_rate || 0}% rate
                      </p>
                    </div>
                    <div className="bg-primary-light/20 rounded-lg p-3">
                      <CheckCircleIcon className="h-7 w-7 text-primary-dark" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-lg border-l-4 border-secondary-dark p-6 transition-all hover:-translate-y-1"
                  style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Read</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {overview.overview_stats.total_read}
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        {overview.overview_stats?.read_rate || 0}% rate
                      </p>
                    </div>
                    <div className="bg-secondary/40 rounded-lg p-3">
                      <BellIcon className="h-7 w-7 text-foreground" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card rounded-lg border-l-4 border-destructive p-6 transition-all hover:-translate-y-1"
                  style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Failed</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {overview.overview_stats.total_failed}
                      </p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3">
                      <ExclamationCircleIcon className="h-7 w-7 text-destructive" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Type Distribution */}
              <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Notification Type Distribution
                </h3>
                <div className="flex items-center gap-8 flex-wrap">
                  {/* Legend on Left */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    {overview.type_distribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.type_display_name}</p>
                          <p className="text-xs text-muted-foreground">{item.count} notifications</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart on Right */}
                  <div className="flex-1 min-w-[300px]">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={overview.type_distribution}
                          dataKey="count"
                          nameKey="type_display_name"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={130}
                          paddingAngle={3}
                        >
                          {overview.type_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Recent Notifications
                  </h3>
                  <button
                    onClick={fetchOverview}
                    className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm font-medium transition-colors">
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  {overview.recent_notifications.map((notif) => (
                    <div
                      key={notif.notification_id}
                      className="border border-border rounded-lg p-4 hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground text-sm">
                            {notif.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-1 bg-secondary/50 text-secondary-foreground rounded">
                              {notif.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              To: {notif.recipient_count} recipients
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notif.sent_at)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${notif.status === "DELIVERED"
                            ? "bg-primary-light/20 text-primary-dark"
                            : "bg-secondary/50 text-secondary-foreground"
                            }`}>
                          {notif.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No overview data available
            </div>
          )}
        </motion.div>
      )}

      {/* Compose Tab */}
      {activeTab === "compose" && (
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg border border-border p-6"
            style={{ boxShadow: 'var(--uni-shadow-card)' }}>
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Compose Notification
            </h2>

            <div className="space-y-6">
              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notification Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {notificationTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() =>
                          setNotification((prev) => ({ ...prev, type: type.value }))
                        }
                        className={`p-3 rounded-lg border-2 transition-all ${notification.type === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary hover:bg-muted"
                          }`}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium text-foreground">{type.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority Level
                </label>
                <select
                  value={notification.priority}
                  onChange={(e) =>
                    setNotification((prev) => ({ ...prev, priority: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
                  {priorityLevels.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={notification.title}
                  onChange={(e) =>
                    setNotification((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter notification title..."
                  className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </label>
                <textarea
                  value={notification.message}
                  onChange={(e) =>
                    setNotification((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Enter your notification message..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none resize-none transition-all"
                />
              </div>

              {/* Recipients Selection */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Select Recipients
                </h3>

                <div className="space-y-4">
                  {!notification.target_audience.include_all_users && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        User Types *
                      </label>
                      {userTypes.map((userType) => {
                        const IconComponent = userType.icon;
                        return (
                          <div
                            key={userType.value}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {userType.label}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUserTypeToggle(userType.value)}
                              className={`p-3 rounded border-2 flex items-center justify-center transition-colors ${selectedUserTypes.includes(userType.value)
                                ? "bg-primary border-primary"
                                : "border-border hover:border-primary"
                                }`}>
                              {selectedUserTypes.includes(userType.value) && (
                                <CheckIcon className="h-4 w-4 text-primary-foreground" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected Summary */}
                  <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
                    {notification.target_audience.include_all_users
                      ? "All users will receive this notification"
                      : selectedUserTypes.length > 0
                        ? `${selectedUserTypes.join(", ")} will receive this notification`
                        : "Please select at least one user type"}
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="border-t border-border pt-6 flex justify-end">
                <button
                  onClick={handleSendNotification}
                  disabled={
                    loading.sending ||
                    !notification.title ||
                    !notification.message ||
                    selectedUserTypes.length === 0
                  }
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-md hover:shadow-lg">
                  {loading.sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                  <span>{loading.sending ? "Sending..." : "Send Notification"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6">

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Analytics Filters</h3>
              <button
                onClick={clearAnalyticsFilters}
                className="text-sm text-destructive hover:text-destructive/80 flex items-center gap-1 font-medium transition-colors">
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time Period
                </label>
                <select
                  value={analyticsFilters.period_type}
                  onChange={(e) => handleAnalyticsFilterChange("period_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
                  {periodTypes.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              {analyticsFilters.period_type === "CUSTOM" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={analyticsFilters.start_date}
                      onChange={(e) => handleAnalyticsFilterChange("start_date", e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={analyticsFilters.end_date}
                      onChange={(e) => handleAnalyticsFilterChange("end_date", e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  User Type
                </label>
                <select
                  value={analyticsFilters.user_type}
                  onChange={(e) => handleAnalyticsFilterChange("user_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
                  <option value="">All Users</option>
                  <option value="STUDENT">Students</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notification Type
                </label>
                <select
                  value={analyticsFilters.notification_type}
                  onChange={(e) => handleAnalyticsFilterChange("notification_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
                  <option value="">All Types</option>
                  <option value="SYSTEM_ALERT">System Alert</option>
                  <option value="ADMIN_ANNOUNCEMENT">Announcement</option>
                  <option value="TASK_COMPLETION">Task Completion</option>
                  <option value="STAGE_COMPLETION">Stage Completion</option>
                  <option value="WORKFLOW_UPDATE">Workflow Update</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={fetchAnalytics}
                disabled={loading.analytics}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
                {loading.analytics ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
                Apply Filters
              </button>
            </div>
          </div>

          {/* Analytics Content */}
          {loading.analytics ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading analytics...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Period Info Banner */}
              {analytics.period_info && (
                <div className="bg-secondary/30 border border-secondary rounded-lg px-5 py-3 flex flex-wrap gap-4 text-sm text-foreground">
                  <span>📅 Period: <strong>{analytics.period_info.period_type.replace(/_/g, " ")}</strong></span>
                  <span>🗓 {new Date(analytics.period_info.start_date).toLocaleDateString()} → {new Date(analytics.period_info.end_date).toLocaleDateString()}</span>
                  <span>📆 Total Days: <strong>{analytics.period_info.total_days}</strong></span>
                </div>
              )}

              {/* Performance Trends */}
              {analytics.performance_trends && (
                <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Performance Trends</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Trend:{" "}
                        <span className={`font-semibold ${analytics.performance_trends.trend_direction === "IMPROVING" ? "text-primary-dark" : "text-foreground"}`}>
                          {analytics.performance_trends.trend_direction}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Growth:{" "}
                        <span className="font-semibold text-primary">{analytics.performance_trends.growth_rate_percent || 0}%</span>
                      </span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.performance_trends.daily_metrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(195, 20%, 90%)" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis />
                      <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                      <Legend />
                      <Area type="monotone" dataKey="sent_count" stroke="hsl(28, 70%, 56%)" fill="hsl(28, 70%, 56%)" fillOpacity={0.2} strokeWidth={2} dot={{ r: 5, fill: "hsl(28, 70%, 56%)" }} name="Sent" />
                      <Area type="monotone" dataKey="delivery_rate" stroke="hsl(195, 35%, 70%)" fill="hsl(195, 35%, 70%)" fillOpacity={0.2} strokeWidth={2} dot={{ r: 5, fill: "hsl(195, 35%, 70%)" }} name="Delivery Rate %" />
                      <Area type="monotone" dataKey="read_rate" stroke="hsl(28, 70%, 65%)" fill="hsl(28, 70%, 65%)" fillOpacity={0.2} strokeWidth={2} dot={{ r: 5, fill: "hsl(28, 70%, 65%)" }} name="Read Rate %" />
                      <Area type="monotone" dataKey="click_rate" stroke="hsl(195, 20%, 19%)" fill="hsl(195, 20%, 19%)" fillOpacity={0.2} strokeWidth={2} dot={{ r: 5, fill: "hsl(195, 20%, 19%)" }} name="Click Rate %" />
                    </AreaChart>
                  </ResponsiveContainer>

                  {analytics.performance_trends.weekly_summaries?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Weekly Summaries</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {analytics.performance_trends.weekly_summaries.map((week, i) => (
                          <div key={i} className="bg-muted rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              {new Date(week.week_start).toLocaleDateString()} – {new Date(week.week_end).toLocaleDateString()}
                            </p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Sent: <strong className="text-foreground">{week.total_sent.toLocaleString()}</strong></span>
                              <span className="text-muted-foreground">Delivery: <strong className="text-primary-dark">{week.avg_delivery_rate}%</strong></span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-muted-foreground">Engagement: <strong className="text-primary">{week.avg_engagement_rate}%</strong></span>
                              <span className="text-muted-foreground">Peak: <strong className="text-foreground">{week.peak_day}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analytics.performance_trends.seasonal_patterns?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Seasonal Patterns</h4>
                      <div className="flex flex-wrap gap-3">
                        {analytics.performance_trends.seasonal_patterns.map((p, i) => (
                          <div key={i} className="bg-secondary/30 border border-secondary rounded-lg px-4 py-2 text-sm flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">{p.pattern_type.replace(/_/g, " ")}</span>
                            <span className="text-muted-foreground">— {p.description}</span>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${p.strength === "HIGH" ? "bg-primary-light/20 text-primary-dark" : "bg-muted text-muted-foreground"}`}>{p.strength}</span>
                            <span className="text-muted-foreground">{p.confidence_percent}% confidence</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Behavior */}
              {analytics.user_behavior && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Engagement by User Type</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analytics.user_behavior.engagement_by_type}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(195, 20%, 90%)" />
                          <XAxis dataKey="user_type" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avg_read_rate" fill="hsl(28, 70%, 56%)" name="Read Rate %" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avg_response_time_minutes" fill="hsl(195, 35%, 70%)" name="Response Time (min)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      {analytics.user_behavior.engagement_by_type.map((seg, i) => (
                        <div key={i} className="mt-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{seg.user_type}</span> top types:{" "}
                          {seg.top_engaging_types?.map((t) => (
                            <span key={t} className="ml-1 px-2 py-0.5 bg-secondary/30 text-foreground rounded text-xs">{t}</span>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="bg-card rounded-lg border border-border p-6" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Optimal Send Times</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Best Days:</p>
                          <div className="flex flex-wrap gap-2">
                            {analytics.user_behavior.optimal_send_times.optimal_days.map((day) => (
                              <span key={day} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium">{day}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Best Hours:</p>
                          <div className="flex flex-wrap gap-2">
                            {analytics.user_behavior.optimal_send_times.optimal_hours.map((hour) => (
                              <span key={hour} className="px-2 py-1 bg-secondary/40 text-foreground text-xs rounded font-medium">{hour}:00</span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <div className="bg-muted rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Recommended / Week</p>
                            <p className="text-xl font-bold text-primary">{analytics.user_behavior.optimal_send_times.frequency_recommendations.recommended_weekly_frequency}</p>
                          </div>
                          <div className="bg-muted rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Fatigue Threshold</p>
                            <p className="text-xl font-bold text-destructive">{analytics.user_behavior.optimal_send_times.frequency_recommendations.fatigue_threshold}</p>
                          </div>
                          <div className="bg-muted rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Current Avg / Week</p>
                            <p className="text-xl font-bold text-foreground">{analytics.user_behavior.optimal_send_times.frequency_recommendations.current_avg_frequency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No analytics data available
            </div>
          )}
        </motion.div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg border border-border p-6"
          style={{ boxShadow: 'var(--uni-shadow-card)' }}>
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Notification Templates
          </h2>

          {loading.templates ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading templates...</p>
            </div>
          ) : templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.template_id}
                  className="border border-border rounded-lg p-4 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-medium text-foreground">
                          {template.template_name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${template.status === "ACTIVE"
                            ? "bg-primary-light/20 text-primary-dark"
                            : "bg-muted text-muted-foreground"
                            }`}>
                          {template.status}
                        </span>
                        {template.productionReady && (
                          <span className="text-xs px-2 py-1 bg-secondary/40 text-foreground rounded font-medium">
                            Production Ready
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">Subject:</strong> {template.subject_template}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">Content:</strong> {template.content_template}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                          {template.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {template.notification_type}
                        </span>
                        <span className="text-xs px-2 py-1 bg-secondary/40 text-foreground rounded">
                          {template.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => useTemplateForNotification(template)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm flex-shrink-0 font-medium shadow-md hover:shadow-lg transition-all">
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No templates available</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Success/Error Modal */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center border border-border"
            >
              <div className={`mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full ${successModal === true ? "bg-primary-light/20" : "bg-destructive/10"}`}>
                {successModal === true
                  ? <CheckCircleIcon className="h-9 w-9 text-primary-dark" />
                  : <ExclamationCircleIcon className="h-9 w-9 text-destructive" />
                }
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {successModal === true ? "Notification Sent!" : "Something went wrong"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {successModal === true
                  ? "Your notification has been successfully delivered to the selected recipients."
                  : successModal.message}
              </p>
              <button
                onClick={() => setSuccessModal(false)}
                className="w-full py-2.5 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationManagement;
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
} from "../../store/slices/dashboardSlice";
import { fetchDashboardData } from "../../services/dashboardAPI";
import { fetchApplications } from "../../services/applicationService";
import {
  Users,
  FileText,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bell,
  AlertCircle,
  Activity,
} from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const [appSummary, setAppSummary] = useState(null);
  const [appSummaryLoading, setAppSummaryLoading] = useState(true);
  const {
    stats,
    userMetrics,
    applicationMetrics,
    financialMetrics,
    conversionFunnel,
    revenueData,
    agentPerformance,
    notifications,
    engagementMetrics,
    performanceMetrics,
    operationalMetrics,
    lastUpdated,
    loading,
    error,
  } = useSelector((state) => state.dashboard);

  useEffect(() => {
    const loadDashboardData = async () => {
      dispatch(fetchDashboardStart());

      try {
        const data = await fetchDashboardData();
        dispatch(fetchDashboardSuccess(data));
      } catch (error) {
        dispatch(
          fetchDashboardFailure(
            error.response?.data?.message || error.message
          )
        );
      }
    };

    const loadAppSummary = async () => {
      try {
        setAppSummaryLoading(true);
        const appsRes = await fetchApplications(0, 1);
        if (appsRes?.data?.summary) {
          setAppSummary(appsRes.data.summary);
        } else if (appsRes?.summary) {
          setAppSummary(appsRes.summary);
        }
      } catch (e) {
      } finally {
        setAppSummaryLoading(false);
      }
    };

    loadDashboardData();
    loadAppSummary();
  }, [dispatch]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Show error state if needed
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Theme color palette for KPI cards (cycles through brand colors)
  const cardThemes = [
    {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      accent: "border-l-4 border-primary",
    },
    {
      iconBg: "bg-secondary/40",
      iconColor: "text-foreground",
      accent: "border-l-4 border-secondary-dark",
    },
    {
      iconBg: "bg-primary-light/20",
      iconColor: "text-primary-dark",
      accent: "border-l-4 border-primary-light",
    },
    {
      iconBg: "bg-secondary-light/60",
      iconColor: "text-foreground",
      accent: "border-l-4 border-secondary",
    },
    {
      iconBg: "bg-primary/15",
      iconColor: "text-primary-dark",
      accent: "border-l-4 border-primary-dark",
    },
    {
      iconBg: "bg-secondary/30",
      iconColor: "text-foreground",
      accent: "border-l-4 border-secondary-dark",
    },
  ];

  // Stats Card Component
  const StatsCard = ({ title, value, icon: Icon, loading, themeIndex = 0 }) => {
    const theme = cardThemes[themeIndex % cardThemes.length];
    return (
      <div className={`bg-card rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 h-full ${theme.accent}`}>
        <div className="flex items-center justify-between gap-2 h-full">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] xl:text-[11px] font-semibold text-muted-foreground uppercase tracking-normal leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </p>
            {loading ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded mt-1.5"></div>
            ) : (
              <p className="text-lg xl:text-xl font-bold text-foreground mt-1 truncate">
                {typeof value === "number" && title.includes("Revenue")
                  ? `$${value.toLocaleString()}`
                  : value?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className={`${theme.iconBg} rounded-full p-2`}>
              <Icon className={`w-5 h-5 xl:w-6 xl:h-6 ${theme.iconColor}`} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Conversion Funnel Component
  const ConversionFunnelChart = ({ data, loading }) => {
    if (loading) {
      return (
        <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Conversion Funnel
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    const funnelData = Array.isArray(data) && data.length > 0 ? data : [];

    return (
      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
          Conversion Funnel
        </h3>
        {funnelData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No conversion data available
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {funnelData.map((item, index) => {
              const maxValue = Math.max(...funnelData.map((d) => d.count || d.value || 0));
              const percentage = maxValue > 0 ? ((item.count || item.value || 0) / maxValue) * 100 : 0;

              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {item.stage || item.name || item.label || `Stage ${index + 1}`}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {item.count || item.value || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-6 sm:h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 flex items-center justify-end px-2 sm:px-3"
                      style={{ width: `${percentage}%`, minWidth: percentage > 0 ? '30px' : '0' }}
                    >
                      {percentage > 10 && (
                        <span className="text-xs font-semibold text-primary-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Revenue Chart Component
  const RevenueChartComponent = ({ data, loading }) => {
    if (loading) {
      return (
        <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Revenue Overview
          </h3>
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </div>
      );
    }

    const revenueChartData = Array.isArray(data) && data.length > 0 ? data : [];
    const maxRevenue = Math.max(...revenueChartData.map((d) => d.revenue || d.amount || d.value || 0), 1);
    const minRevenue = Math.min(...revenueChartData.map((d) => d.revenue || d.amount || d.value || 0), 0);

    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps }, (_, i) => {
      const value = minRevenue + ((maxRevenue - minRevenue) / (yAxisSteps - 1)) * i;
      return Math.round(value);
    }).reverse();

    const createLinePath = () => {
      if (revenueChartData.length === 0) return "";
      const width = 100;
      const height = 100;
      const padding = 5;
      const points = revenueChartData.map((item, index) => {
        const x = (index / (revenueChartData.length - 1)) * (width - padding * 2) + padding;
        const value = item.revenue || item.amount || item.value || 0;
        const y = height - padding - ((value - minRevenue) / (maxRevenue - minRevenue)) * (height - padding * 2);
        return `${x},${y}`;
      });
      return `M ${points.join(' L ')}`;
    };

    const createAreaPath = () => {
      if (revenueChartData.length === 0) return "";
      const width = 100;
      const height = 100;
      const padding = 5;
      const points = revenueChartData.map((item, index) => {
        const x = (index / (revenueChartData.length - 1)) * (width - padding * 2) + padding;
        const value = item.revenue || item.amount || item.value || 0;
        const y = height - padding - ((value - minRevenue) / (maxRevenue - minRevenue)) * (height - padding * 2);
        return `${x},${y}`;
      });
      const lastX = ((revenueChartData.length - 1) / (revenueChartData.length - 1)) * (width - padding * 2) + padding;
      const firstX = padding;
      return `M ${firstX},${height - padding} L ${points.join(' L ')} L ${lastX},${height - padding} Z`;
    };

    return (
      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
          Revenue Overview
        </h3>
        {revenueChartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No revenue data available
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative h-64 sm:h-80">
              <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-muted-foreground">
                {yAxisLabels.map((label, index) => (
                  <div key={index} className="text-right pr-2">
                    ${(label / 1000).toFixed(0)}k
                  </div>
                ))}
              </div>

              <div className="absolute left-16 right-0 top-0 bottom-8">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {yAxisLabels.map((_, index) => (
                    <div key={index} className="border-t border-border"></div>
                  ))}
                </div>

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: 'hsl(28, 70%, 56%)', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: 'hsl(28, 70%, 56%)', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>
                  <path d={createAreaPath()} fill="url(#areaGradient)" />
                  <path
                    d={createLinePath()}
                    fill="none"
                    stroke="hsl(28, 70%, 56%)"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {revenueChartData.map((item, index) => {
                    const x = (index / (revenueChartData.length - 1)) * 90 + 5;
                    const value = item.revenue || item.amount || item.value || 0;
                    const y = 95 - ((value - minRevenue) / (maxRevenue - minRevenue)) * 90;
                    return (
                      <g key={index} className="group">
                        <circle cx={x} cy={y} r="3" fill="transparent" className="cursor-pointer" />
                        <circle cx={x} cy={y} r="1.2" fill="hsl(28, 70%, 56%)" className="group-hover:r-2 transition-all" />
                        <circle
                          cx={x} cy={y} r="2" fill="none"
                          stroke="hsl(28, 70%, 56%)" strokeWidth="0.3"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute inset-0 flex">
                  {revenueChartData.map((item, index) => {
                    const value = item.revenue || item.amount || item.value || 0;
                    const month = item.month || item.name || item.label || `M${index + 1}`;
                    return (
                      <div key={index} className="flex-1 relative group">
                        <div className="absolute inset-0 cursor-pointer"></div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                          <div className="bg-sidebar-background text-sidebar-foreground px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                            <div className="text-xs font-semibold text-primary-light">{month}</div>
                            <div className="text-sm font-bold">${value.toLocaleString()}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                              <div className="border-4 border-transparent border-t-sidebar-background"></div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border opacity-0 group-hover:opacity-50 transition-opacity"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-between items-center">
                {revenueChartData.map((item, index) => (
                  <div key={index} className="flex-1 text-center text-xs text-muted-foreground">
                    {item.month || item.name || item.label || `M${index + 1}`}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Revenue:{" "}
                <span className="font-bold text-foreground">
                  ${revenueChartData
                    .reduce((sum, item) => sum + (item.revenue || item.amount || item.value || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>Growth trend</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Agent Performance Component
  const AgentPerformanceTable = ({ data, loading }) => {
    if (loading) {
      return (
        <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Agent Performance
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    const performanceData = Array.isArray(data) && data.length > 0 ? data : [];

    return (
      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
          Agent Performance
        </h3>
        {performanceData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No agent performance data available
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Apps
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Conversions
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {performanceData.map((agent, index) => {
                    const applications = agent.applications || agent.totalApplications || 0;
                    const conversions = agent.conversions || agent.successfulApplications || 0;
                    const successRate = applications > 0 ? ((conversions / applications) * 100).toFixed(1) : 0;

                    return (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold text-xs sm:text-sm">
                                {(agent.name || agent.agentName || "Agent")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                            <div className="ml-2 sm:ml-4">
                              <div className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[100px] sm:max-w-none">
                                {agent.name || agent.agentName || `Agent ${index + 1}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-foreground">
                          {applications}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-foreground hidden sm:table-cell">
                          {conversions}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-primary">
                          ${(agent.revenue || agent.totalRevenue || 0).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${successRate >= 70
                                ? "bg-primary/15 text-primary-dark"
                                : successRate >= 50
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                          >
                            {successRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Notifications Panel Component
  const NotificationsPanelComponent = ({ notifications, loading }) => {
    if (loading) {
      return (
        <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Notifications
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    const notificationList = Array.isArray(notifications) && notifications.length > 0 ? notifications : [];

    return (
      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 h-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Notifications</h3>
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </div>
        {notificationList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
            {notificationList.map((notification, index) => {
              const isUrgent = notification.priority === "high" || notification.type === "urgent";
              const isWarning = notification.priority === "medium" || notification.type === "warning";

              return (
                <div
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg border-l-4 ${isUrgent
                      ? "bg-destructive/10 border-destructive"
                      : isWarning
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary/40 border-secondary-dark"
                    }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertCircle
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${isUrgent
                            ? "text-destructive"
                            : isWarning
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        {notification.title || notification.message || "Notification"}
                      </p>
                      {notification.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {notification.description}
                        </p>
                      )}
                      {notification.timestamp && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full p-4 sm:p-6">
      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4"
      >
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Students"
            value={stats?.totalStudents}
            icon={Users}
            loading={loading}
            themeIndex={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Applications"
            value={stats?.totalApplications}
            icon={FileText}
            loading={loading}
            themeIndex={1}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Universities"
            value={stats?.totalUniversities}
            icon={GraduationCap}
            loading={loading}
            themeIndex={2}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Revenue"
            value={stats?.totalRevenue}
            icon={DollarSign}
            loading={loading}
            themeIndex={3}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers}
            icon={Users}
            loading={loading}
            themeIndex={4}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title="Total Admins"
            value={stats?.totalAdmins}
            icon={Users}
            loading={loading}
            themeIndex={5}
          />
        </motion.div>
      </motion.div>

      {/* Applications Summary Section */}
      {(appSummary || appSummaryLoading) && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-card rounded-lg shadow-md p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
              <span className="h-1.5 w-8 bg-gradient-to-r from-primary to-primary-light rounded mr-3"></span>
              Applications Summary
            </h3>
          </div>
          {appSummaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
              <div className="bg-primary/10 rounded-lg p-3 sm:p-4 border border-primary/20 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-primary-dark mb-1">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{appSummary.totalApplications}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3 sm:p-4 border border-secondary-dark/30 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Submitted</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{appSummary.submittedApplications}</p>
              </div>
              <div className="bg-primary-light/20 rounded-lg p-3 sm:p-4 border border-primary-light/40 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-primary-dark mb-1">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-primary-dark">{appSummary.completedApplications}</p>
              </div>
              <div className="bg-secondary-light/60 rounded-lg p-3 sm:p-4 border border-secondary/50 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Under Review</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{appSummary.underReviewApplications}</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 sm:p-4 border border-destructive/20 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-destructive mb-1">Urgent / Unassigned</p>
                <p className="text-xl sm:text-2xl font-bold text-destructive">{appSummary.urgentApplications} <span className="text-destructive/60 font-normal">/</span> {appSummary.unassignedApplications}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 sm:p-4 border border-border flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Drafts</p>
                <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{appSummary.draftApplications}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 sm:p-4 border border-primary/20 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-primary-dark mb-1">Added This Week</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{appSummary.applicationsCreatedThisWeek}</p>
                <p className="text-[10px] sm:text-xs text-primary-dark mt-1">
                  ({appSummary.applicationsCreatedToday} today, {appSummary.applicationsCreatedThisMonth} this month)
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* System Health Banner */}
      {stats?.systemHealth && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-r from-primary/10 to-secondary/40 rounded-lg shadow-md p-3 sm:p-4 border border-primary/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  System Status: <span className="font-bold text-primary-dark">{stats.systemHealth}</span>
                </span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-border"></div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Uptime: <span className="font-semibold text-foreground">{stats.systemUptime}</span>
              </span>
            </div>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Charts and Analytics */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
      >
        <motion.div variants={itemVariants}>
          <ConversionFunnelChart data={conversionFunnel} loading={loading} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RevenueChartComponent data={revenueData} loading={loading} />
        </motion.div>
      </motion.div>

      {/* Agent Performance and Notifications */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <AgentPerformanceTable data={agentPerformance} loading={loading} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <NotificationsPanelComponent notifications={notifications} loading={loading} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
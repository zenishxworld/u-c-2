import api from './api';

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */

/**
 * Fetch KPIs (Key Performance Indicators)
 * @returns {Promise<Object>} KPIs data
 */
export const fetchKPIs = async () => {
  try {
    const response = await api.get('/api/v1/superadmin/dashboard/kpis');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch Users Analytics
 * @returns {Promise<Object>} Users analytics data
 */
export const fetchUsersAnalytics = async () => {
  try {
    const response = await api.get('/api/v1/superadmin/dashboard/users/analytics');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch Applications Analytics
 * @returns {Promise<Object>} Applications analytics data
 */
export const fetchApplicationsAnalytics = async () => {
  try {
    const response = await api.get('/api/v1/superadmin/dashboard/applications/analytics');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch all dashboard data in parallel
 * @returns {Promise<Object>} Combined dashboard data
 */
export const fetchDashboardData = async () => {
  try {
    const [kpisResponse, usersResponse, appsResponse] = await Promise.all([
      fetchKPIs(),
      fetchUsersAnalytics(),
      fetchApplicationsAnalytics(),
    ]);
    // Extract data from the response structure
    const kpisData = kpisResponse.data;
    const usersData = usersResponse;
    const appsData = appsResponse;

    // Transform the data to match dashboard component expectations
    const transformedData = {
      // Stats from KPIs systemOverview and financialMetrics
      stats: {
        totalStudents: kpisData.systemOverview.totalStudents,
        totalApplications: kpisData.systemOverview.totalApplications,
        totalUniversities: kpisData.systemOverview.totalUniversities,
        totalRevenue: kpisData.financialMetrics.totalRevenue,
        totalUsers: kpisData.systemOverview.totalUsers,
        totalAdmins: kpisData.systemOverview.totalAdmins,
        systemHealth: kpisData.systemOverview.systemHealth,
        systemUptime: kpisData.systemOverview.systemUptime,
      },

      // User metrics for charts
      userMetrics: {
        newUsersToday: kpisData.userMetrics.newUsersToday,
        newUsersThisWeek: kpisData.userMetrics.newUsersThisWeek,
        newUsersThisMonth: kpisData.userMetrics.newUsersThisMonth,
        activeUsersToday: kpisData.userMetrics.activeUsersToday,
        userGrowthRate: kpisData.userMetrics.userGrowthRate,
        userRetentionRate: kpisData.userMetrics.userRetentionRate,
      },

      // Application metrics
      applicationMetrics: {
        totalInProgress: kpisData.applicationMetrics.totalApplicationsInProgress,
        submittedToday: kpisData.applicationMetrics.applicationsSubmittedToday,
        submittedThisWeek: kpisData.applicationMetrics.applicationsSubmittedThisWeek,
        submittedThisMonth: kpisData.applicationMetrics.applicationsSubmittedThisMonth,
        completed: kpisData.applicationMetrics.applicationsCompleted,
        successRate: kpisData.applicationMetrics.applicationSuccessRate,
        averageTime: kpisData.applicationMetrics.averageApplicationTime,
      },

      // Financial metrics for revenue chart
      financialMetrics: {
        totalRevenue: kpisData.financialMetrics.totalRevenue,
        revenueToday: kpisData.financialMetrics.revenueToday,
        revenueThisWeek: kpisData.financialMetrics.revenueThisWeek,
        revenueThisMonth: kpisData.financialMetrics.revenueThisMonth,
        revenueGrowthRate: kpisData.financialMetrics.revenueGrowthRate,
        averageRevenuePerUser: kpisData.financialMetrics.averageRevenuePerUser,
        pendingPayments: kpisData.financialMetrics.pendingPayments,
        totalCommissions: kpisData.financialMetrics.totalCommissions,
      },

      // Revenue data for chart (weekly breakdown)
      revenueData: [
        { month: 'Today', revenue: kpisData.financialMetrics.revenueToday },
        { month: 'This Week', revenue: kpisData.financialMetrics.revenueThisWeek },
        { month: 'This Month', revenue: kpisData.financialMetrics.revenueThisMonth },
        { month: 'Total', revenue: kpisData.financialMetrics.totalRevenue },
      ],

      // Conversion funnel from application metrics
      conversionFunnel: [
        { 
          stage: 'Total Applications', 
          count: kpisData.systemOverview.totalApplications,
          percentage: 100 
        },
        { 
          stage: 'In Progress', 
          count: kpisData.applicationMetrics.totalApplicationsInProgress,
          percentage: kpisData.systemOverview.totalApplications > 0 
            ? (kpisData.applicationMetrics.totalApplicationsInProgress / kpisData.systemOverview.totalApplications * 100).toFixed(1)
            : 0
        },
        { 
          stage: 'Submitted This Month', 
          count: kpisData.applicationMetrics.applicationsSubmittedThisMonth,
          percentage: kpisData.systemOverview.totalApplications > 0
            ? (kpisData.applicationMetrics.applicationsSubmittedThisMonth / kpisData.systemOverview.totalApplications * 100).toFixed(1)
            : 0
        },
        { 
          stage: 'Completed', 
          count: kpisData.applicationMetrics.applicationsCompleted,
          percentage: kpisData.systemOverview.totalApplications > 0
            ? (kpisData.applicationMetrics.applicationsCompleted / kpisData.systemOverview.totalApplications * 100).toFixed(1)
            : 0
        },
      ],

      // User analytics data
      engagementMetrics: usersData.engagementMetrics,
      demographicInsights: usersData.demographicInsights,

      // Application performance
      performanceMetrics: appsData.performanceMetrics,
      workflowAnalytics: appsData.workflowAnalytics,

      // Operational metrics
      operationalMetrics: kpisData.operationalMetrics,

      // Agent performance (derived from user types)
      agentPerformance: Object.entries(usersData.demographicInsights.usersByUserType).map(([type, count]) => ({
        name: type.replace(/_/g, ' '),
        applications: Math.floor(count * 2.5), // Simulated
        conversions: Math.floor(count * 1.8), // Simulated
        revenue: count * 500,
        totalApplications: Math.floor(count * 2.5),
        successfulApplications: Math.floor(count * 1.8),
      })),

      // System notifications (derived from metrics)
      notifications: [
        {
          title: 'System Health',
          message: `System is running at ${kpisData.systemOverview.systemHealth} with ${kpisData.systemOverview.systemUptime} uptime`,
          priority: 'low',
          type: 'info',
          timestamp: kpisData.lastUpdated,
        },
        ...(kpisData.userMetrics.newUsersThisWeek > 0 ? [{
          title: 'New Users This Week',
          message: `${kpisData.userMetrics.newUsersThisWeek} new users joined this week`,
          priority: 'medium',
          type: 'info',
          timestamp: kpisData.lastUpdated,
        }] : []),
        ...(kpisData.financialMetrics.pendingPayments > 0 ? [{
          title: 'Pending Payments',
          message: `$${kpisData.financialMetrics.pendingPayments.toLocaleString()} in pending payments`,
          priority: 'high',
          type: 'warning',
          timestamp: kpisData.lastUpdated,
        }] : []),
        ...(kpisData.operationalMetrics.supportTicketsOpen > 0 ? [{
          title: 'Open Support Tickets',
          message: `${kpisData.operationalMetrics.supportTicketsOpen} support tickets need attention`,
          priority: 'high',
          type: 'urgent',
          timestamp: kpisData.lastUpdated,
        }] : []),
      ],

      // Metadata
      lastUpdated: kpisData.lastUpdated,
      dataFreshness: kpisData.dataFreshness,
    };
    return transformedData;
  } catch (error) {
    throw error;
  }
};

export default {
  fetchKPIs,
  fetchUsersAnalytics,
  fetchApplicationsAnalytics,
  fetchDashboardData,
};
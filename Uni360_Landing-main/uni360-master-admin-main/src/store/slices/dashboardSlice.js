import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stats: {
    totalStudents: 0,
    totalApplications: 0,
    totalUniversities: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalAdmins: 0,
    systemHealth: '',
    systemUptime: '',
  },
  userMetrics: {},
  applicationMetrics: {},
  financialMetrics: {},
  conversionFunnel: [],
  revenueData: [],
  agentPerformance: [],
  notifications: [],
  engagementMetrics: {},
  demographicInsights: {},
  performanceMetrics: {},
  workflowAnalytics: {},
  operationalMetrics: {},
  lastUpdated: null,
  dataFreshness: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    fetchDashboardStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDashboardSuccess: (state, action) => {
      state.loading = false;
      state.error = null;
      // Update all state properties from API response
      state.stats = action.payload.stats || initialState.stats;
      state.userMetrics = action.payload.userMetrics || {};
      state.applicationMetrics = action.payload.applicationMetrics || {};
      state.financialMetrics = action.payload.financialMetrics || {};
      state.conversionFunnel = action.payload.conversionFunnel || [];
      state.revenueData = action.payload.revenueData || [];
      state.agentPerformance = action.payload.agentPerformance || [];
      state.notifications = action.payload.notifications || [];
      state.engagementMetrics = action.payload.engagementMetrics || {};
      state.demographicInsights = action.payload.demographicInsights || {};
      state.performanceMetrics = action.payload.performanceMetrics || {};
      state.workflowAnalytics = action.payload.workflowAnalytics || {};
      state.operationalMetrics = action.payload.operationalMetrics || {};
      state.lastUpdated = action.payload.lastUpdated;
      state.dataFreshness = action.payload.dataFreshness;
    },
    fetchDashboardFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
  clearDashboardError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
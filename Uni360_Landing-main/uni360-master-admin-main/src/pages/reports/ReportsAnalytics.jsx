import React, { useState, useEffect } from "react";
import {
  DocumentChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  UsersIcon,
  BuildingLibraryIcon,
  DocumentArrowDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
} from "recharts";
import { fetchDashboardData, fetchUsersAnalytics, fetchApplicationsAnalytics } from '../../services/dashboardAPI';
import { getNotificationAnalytics } from '../../services/notificationApi';
import * as XLSX from "xlsx";
import { getAllSystemPayments } from '../../services/paymentService';

// Card components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-slate-100">
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-slate-900">{children}</h3>
);

const CardDescription = ({ children }) => (
  <p className="text-sm text-slate-400 mt-0.5">{children}</p>
);

const CardContent = ({ children }) => (
  <div className="p-6">
    {children}
  </div>
);

// Dynamic color palette generator - using theme colors
const generateColors = (count) => {
  const colors = [
    'hsl(28, 70%, 56%)',   // primary (Tiger Eye)
    'hsl(195, 35%, 70%)',  // secondary-dark (Columbia Blue dark)
    'hsl(28, 70%, 45%)',   // primary-dark
    'hsl(195, 35%, 82%)',  // secondary
    'hsl(28, 70%, 65%)',   // primary-light
    'hsl(195, 20%, 45%)',  // muted
    'hsl(195, 35%, 90%)',  // secondary-light
    'hsl(195, 20%, 19%)',  // sidebar-background (Gunmetal)
    'hsl(28, 70%, 75%)',   // primary very light
    'hsl(195, 35%, 60%)',  // secondary medium
  ];
  return colors.slice(0, count);
};

const ReportsAnalytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [usersAnalytics, setUsersAnalytics] = useState(null);
  const [applicationsAnalytics, setApplicationsAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentsData, setPaymentsData] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState({});
  const [notificationAnalytics, setNotificationAnalytics] = useState(null);

  // Fetch all analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [dashData, usersData, appsData, paymentsRaw, notifData] = await Promise.all([
          fetchDashboardData(),
          fetchUsersAnalytics(),
          fetchApplicationsAnalytics(),
          getAllSystemPayments(),
          getNotificationAnalytics({ period_type: 'LAST_30_DAYS' }),
        ]);

        const paymentsList = Array.isArray(paymentsRaw?.data?.payments)
          ? paymentsRaw.data.payments
          : Array.isArray(paymentsRaw?.payments)
            ? paymentsRaw.payments
            : Array.isArray(paymentsRaw)
              ? paymentsRaw
              : [];
        setPaymentsData(paymentsList);

        const breakdownRaw = paymentsRaw?.data?.breakdown_by_type
          || paymentsRaw?.breakdown_by_type
          || {};
        setPaymentBreakdown(breakdownRaw);
        let parsedNotifData = notifData;
        if (notifData?.data?.business_impact) {
          parsedNotifData = notifData.data;
        } else if (notifData?.data?.data?.business_impact) {
          parsedNotifData = notifData.data.data;
        } else if (notifData?.business_impact) {
          parsedNotifData = notifData;
        } else if (notifData?.data) {
          parsedNotifData = notifData.data;
        }

        setNotificationAnalytics(parsedNotifData);
        setDashboardData(dashData);
        setUsersAnalytics(usersData);
        setApplicationsAnalytics(appsData);

      } catch (err) {
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  // Prepare completely dynamic chart data from API responses
  const prepareChartData = () => {
    if (!usersAnalytics || !applicationsAnalytics || !dashboardData) {
      return {
        userEngagementData: [],
        userTypeData: [],
        authProviderData: [],
        applicationPerformanceData: [],
        workflowData: [],
        userGrowthData: [],
        performanceRadarData: [],
        paymentStatusData: [],
        completedAmount: 0,
        pendingAmount: 0,
        paymentTypeData: [],
      };
    }

    // 1. USER ENGAGEMENT DATA - From engagementMetrics
    const engagementMetrics = usersAnalytics.engagementMetrics || {};
    const userEngagementData = [
      {
        period: 'Daily',
        users: engagementMetrics.dailyActiveUsers || 0,
        label: 'Daily Active Users',
      },
      {
        period: 'Weekly',
        users: engagementMetrics.weeklyActiveUsers || 0,
        label: 'Weekly Active Users',
      },
      {
        period: 'Monthly',
        users: engagementMetrics.monthlyActiveUsers || 0,
        label: 'Monthly Active Users',
      },
    ];

    // 2. USER TYPE DISTRIBUTION - From usersByUserType
    const userTypeData = Object.entries(
      usersAnalytics.demographicInsights?.usersByUserType || {}
    ).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      value: count,
      percentage: 0,
    }));

    const totalUsers = userTypeData.reduce((sum, item) => sum + item.value, 0);
    userTypeData.forEach(item => {
      item.percentage = totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(1) : 0;
    });

    // 3. AUTH PROVIDER DISTRIBUTION
    const authProviderData = Object.entries(
      usersAnalytics.demographicInsights?.usersByAuthProvider || {}
    ).map(([provider, count]) => ({
      name: provider,
      value: count,
      percentage: 0,
    }));

    const totalAuthUsers = authProviderData.reduce((sum, item) => sum + item.value, 0);
    authProviderData.forEach(item => {
      item.percentage = totalAuthUsers > 0 ? ((item.value / totalAuthUsers) * 100).toFixed(1) : 0;
    });

    // 4. APPLICATION PERFORMANCE METRICS
    const performanceMetrics = applicationsAnalytics.performanceMetrics || {};
    const applicationPerformanceData = [
      {
        metric: 'Success Rate',
        value: parseFloat(performanceMetrics.overallSuccessRate || 0),
        target: 90,
      },
      {
        metric: 'Completion',
        value: parseFloat(performanceMetrics.completionRate || 0),
        target: 85,
      },
      {
        metric: 'SLA Compliance',
        value: parseFloat(performanceMetrics.slaCompliance || 0),
        target: 95,
      },
      {
        metric: 'Quality Score',
        value: parseFloat(performanceMetrics.qualityScore || 0),
        target: 90,
      },
      {
        metric: 'Throughput',
        value: parseFloat(performanceMetrics.applicationThroughput || 0),
        target: 15,
      },
    ];

    // 5. WORKFLOW ANALYTICS
    const workflowMetrics = applicationsAnalytics.workflowAnalytics || {};
    const workflowData = [
      {
        name: 'Automation',
        value: parseFloat(workflowMetrics.automationEfficiency || 0),
        fullMark: 100,
      },
      {
        name: 'Optimization',
        value: parseFloat(workflowMetrics.workflowOptimizationScore || 0),
        fullMark: 100,
      },
      {
        name: 'Stability',
        value: parseFloat(workflowMetrics.workflowStabilityScore || 0),
        fullMark: 100,
      },
      {
        name: 'Low Manual',
        value: 100 - parseFloat(workflowMetrics.manualInterventionRate || 0),
        fullMark: 100,
      },
    ];

    // 6. USER GROWTH TREND
    const userMetrics = dashboardData.userMetrics || {};
    const userGrowthData = [
      {
        period: 'Today',
        newUsers: userMetrics.newUsersToday || 0,
        activeUsers: engagementMetrics.dailyActiveUsers || 0,
      },
      {
        period: 'This Week',
        newUsers: userMetrics.newUsersThisWeek || 0,
        activeUsers: engagementMetrics.weeklyActiveUsers || 0,
      },
      {
        period: 'This Month',
        newUsers: userMetrics.newUsersThisMonth || 0,
        activeUsers: engagementMetrics.monthlyActiveUsers || 0,
      },
    ];

    // 7. PERFORMANCE RADAR DATA
    const performanceRadarData = [
      {
        metric: 'Success',
        value: parseFloat(performanceMetrics.overallSuccessRate || 0),
        fullMark: 100,
      },
      {
        metric: 'Completion',
        value: parseFloat(performanceMetrics.completionRate || 0),
        fullMark: 100,
      },
      {
        metric: 'SLA',
        value: parseFloat(performanceMetrics.slaCompliance || 0),
        fullMark: 100,
      },
      {
        metric: 'Quality',
        value: parseFloat(performanceMetrics.qualityScore || 0),
        fullMark: 100,
      },
      {
        metric: 'Automation',
        value: parseFloat(workflowMetrics.automationEfficiency || 0),
        fullMark: 100,
      },
    ];

    // Payment status chart data
    const completed = paymentsData.filter(p => p.status?.toLowerCase() === 'completed').length;
    const pending = paymentsData.filter(p => p.status?.toLowerCase() === 'pending').length;
    const failed = paymentsData.filter(p => p.status?.toLowerCase() === 'failed').length;

    const paymentStatusData = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Failed', value: failed, color: '#ef4444' },
    ];

    const completedAmount = paymentsData.filter(p => p.status?.toLowerCase() === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
    const pendingAmount = paymentsData.filter(p => p.status?.toLowerCase() === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

    const paymentTypeData = Object.entries(paymentBreakdown).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      value: count,
    }));

    return {
      userEngagementData,
      userTypeData,
      paymentStatusData,
      completedAmount,
      pendingAmount,
      paymentTypeData,
      authProviderData,
      applicationPerformanceData,
      workflowData,
      userGrowthData,
      performanceRadarData,
    };
  };

  const chartData = prepareChartData();

  // ── Compact KPI Card (matches PaymentManagement style) ─────────────
  const CompactKPICard = ({ item }) => {
    const colorClasses = {
      blue: { accent: 'border-l-4 border-primary', bg: 'bg-primary/10', icon: 'text-primary' },
      green: { accent: 'border-l-4 border-primary-light', bg: 'bg-primary-light/20', icon: 'text-primary-dark' },
      purple: { accent: 'border-l-4 border-secondary-dark', bg: 'bg-secondary/40', icon: 'text-foreground' },
      orange: { accent: 'border-l-4 border-secondary', bg: 'bg-secondary-light/60', icon: 'text-foreground' },
      indigo: { accent: 'border-l-4 border-primary', bg: 'bg-primary/10', icon: 'text-primary' },
      teal: { accent: 'border-l-4 border-secondary-dark', bg: 'bg-secondary/40', icon: 'text-foreground' },
      yellow: { accent: 'border-l-4 border-primary-light', bg: 'bg-primary-light/20', icon: 'text-primary-dark' },
      emerald: { accent: 'border-l-4 border-primary-light', bg: 'bg-primary-light/20', icon: 'text-primary-dark' },
      cyan: { accent: 'border-l-4 border-secondary', bg: 'bg-secondary-light/60', icon: 'text-foreground' },
      amber: { accent: 'border-l-4 border-primary', bg: 'bg-primary/10', icon: 'text-primary' },
      red: { accent: 'border-l-4 border-destructive', bg: 'bg-destructive/10', icon: 'text-destructive' },
    };

    const style = colorClasses[item.color] || colorClasses.blue;
    const Icon = item.icon;

    return (
      <div
        className={`bg-card rounded-2xl border border-border ${style.accent} p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {item.label}
            </p>
            <p className="text-xl font-bold text-foreground mt-1 truncate">
              {item.value}
            </p>
          </div>
          {Icon && (
            <div className={`p-2 rounded-xl ${style.bg} flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${style.icon}`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Mini KPI Card (matches PaymentManagement style) ─────────────────
  const MiniKPICard = ({ item }) => {
    const colorClasses = {
      blue: 'border-l-4 border-primary',
      green: 'border-l-4 border-primary-light',
      purple: 'border-l-4 border-secondary-dark',
      orange: 'border-l-4 border-secondary',
      cyan: 'border-l-4 border-secondary',
      teal: 'border-l-4 border-secondary-dark',
      amber: 'border-l-4 border-primary',
      emerald: 'border-l-4 border-primary-light',
      indigo: 'border-l-4 border-primary',
      red: 'border-l-4 border-destructive',
    };

    return (
      <div className={`bg-card rounded-xl border border-border ${colorClasses[item.color] || colorClasses.blue} p-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
          {item.label}
        </p>
        <p className="text-lg font-bold text-foreground mt-1 truncate">
          {item.value}
        </p>
      </div>
    );
  };

  // Export to Excel function
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const systemOverviewData = [
      { Section: 'SYSTEM OVERVIEW', Metric: '', Value: '' },
      { Section: '', Metric: 'Total Users', Value: dashboardData?.stats?.totalUsers || 0 },
      { Section: '', Metric: 'Total Students', Value: dashboardData?.stats?.totalStudents || 0 },
      { Section: '', Metric: 'Total Admins', Value: dashboardData?.stats?.totalAdmins || 0 },
      { Section: '', Metric: 'Total Applications', Value: dashboardData?.stats?.totalApplications || 0 },
      { Section: '', Metric: 'Total Universities', Value: dashboardData?.stats?.totalUniversities || 0 },
      { Section: '', Metric: 'System Uptime', Value: dashboardData?.stats?.systemUptime || 'N/A' },
      { Section: '', Metric: 'Total Revenue', Value: dashboardData?.stats?.totalRevenue || 0 },
      { Section: '', Metric: '', Value: '' },
      { Section: 'USER METRICS - KPI Cards', Metric: '', Value: '' },
      { Section: '', Metric: 'New Users Today', Value: dashboardData?.userMetrics?.newUsersToday || 0 },
      { Section: '', Metric: 'New Users This Week', Value: dashboardData?.userMetrics?.newUsersThisWeek || 0 },
      { Section: '', Metric: 'New Users This Month', Value: dashboardData?.userMetrics?.newUsersThisMonth || 0 },
      { Section: '', Metric: 'User Retention Rate (%)', Value: dashboardData?.userMetrics?.userRetentionRate || 0 },
      { Section: '', Metric: '', Value: '' },
      { Section: 'APPLICATION METRICS - KPI Cards', Metric: '', Value: '' },
      { Section: '', Metric: 'Total In Progress', Value: dashboardData?.applicationMetrics?.totalInProgress || 0 },
      { Section: '', Metric: 'Submitted This Month', Value: dashboardData?.applicationMetrics?.submittedThisMonth || 0 },
      { Section: '', Metric: 'Completed', Value: dashboardData?.applicationMetrics?.completed || 0 },
      { Section: '', Metric: 'Success Rate (%)', Value: dashboardData?.applicationMetrics?.successRate || 0 },
      { Section: '', Metric: '', Value: '' },
      { Section: 'FINANCIAL METRICS - KPI Cards', Metric: '', Value: '' },
      { Section: '', Metric: 'Revenue Today', Value: dashboardData?.financialMetrics?.revenueToday || 0 },
      { Section: '', Metric: 'Revenue This Week', Value: dashboardData?.financialMetrics?.revenueThisWeek || 0 },
      { Section: '', Metric: 'Revenue This Month', Value: dashboardData?.financialMetrics?.revenueThisMonth || 0 },
      { Section: '', Metric: 'Average Revenue Per User', Value: dashboardData?.financialMetrics?.averageRevenuePerUser || 0 },
    ];
    const systemSheet = XLSX.utils.json_to_sheet(systemOverviewData);
    XLSX.utils.book_append_sheet(workbook, systemSheet, 'System Overview');

    const usersSheet = XLSX.utils.json_to_sheet([
      { Section: 'ENGAGEMENT METRICS', Metric: '', Value: '' },
      { Section: '', Metric: 'Daily Active Users', Value: usersAnalytics?.engagementMetrics?.dailyActiveUsers || 0 },
      { Section: '', Metric: 'Weekly Active Users', Value: usersAnalytics?.engagementMetrics?.weeklyActiveUsers || 0 },
      { Section: '', Metric: 'Monthly Active Users', Value: usersAnalytics?.engagementMetrics?.monthlyActiveUsers || 0 },
      { Section: '', Metric: '', Value: '' },
      { Section: 'USER TYPE DISTRIBUTION', Metric: '', Value: '', Percentage: '' },
      ...Object.entries(usersAnalytics?.demographicInsights?.usersByUserType || {}).map(([type, count]) => {
        const totalUsers = Object.values(usersAnalytics?.demographicInsights?.usersByUserType || {}).reduce((a, b) => a + b, 0);
        const percentage = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : 0;
        return {
          Section: '',
          Metric: `${type} Users`,
          Value: count,
          Percentage: `${percentage}%`,
        };
      }),
      { Section: '', Metric: '', Value: '', Percentage: '' },
      { Section: 'AUTH PROVIDER DISTRIBUTION', Metric: '', Value: '', Percentage: '' },
      ...Object.entries(usersAnalytics?.demographicInsights?.usersByAuthProvider || {}).map(([provider, count]) => {
        const totalAuth = Object.values(usersAnalytics?.demographicInsights?.usersByAuthProvider || {}).reduce((a, b) => a + b, 0);
        const percentage = totalAuth > 0 ? ((count / totalAuth) * 100).toFixed(1) : 0;
        return {
          Section: '',
          Metric: `${provider} Auth`,
          Value: count,
          Percentage: `${percentage}%`,
        };
      }),
    ]);
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users Analytics');

    const appsSheet = XLSX.utils.json_to_sheet([
      { Section: 'PERFORMANCE METRICS', Metric: '', Value: '' },
      { Section: '', Metric: 'Total Processed', Value: applicationsAnalytics?.performanceMetrics?.totalApplicationsProcessed || 0 },
      { Section: '', Metric: 'Avg Processing Time (hrs)', Value: applicationsAnalytics?.performanceMetrics?.averageProcessingTimeHours || 0 },
      { Section: '', Metric: 'Success Rate (%)', Value: applicationsAnalytics?.performanceMetrics?.overallSuccessRate || 0 },
      { Section: '', Metric: 'Completion Rate (%)', Value: applicationsAnalytics?.performanceMetrics?.completionRate || 0 },
      { Section: '', Metric: 'Application Throughput', Value: applicationsAnalytics?.performanceMetrics?.applicationThroughput || 0 },
      { Section: '', Metric: 'SLA Compliance (%)', Value: applicationsAnalytics?.performanceMetrics?.slaCompliance || 0 },
      { Section: '', Metric: 'Quality Score', Value: applicationsAnalytics?.performanceMetrics?.qualityScore || 0 },
      { Section: '', Metric: '', Value: '' },
      { Section: 'WORKFLOW ANALYTICS', Metric: '', Value: '' },
      { Section: '', Metric: 'Automation Efficiency (%)', Value: applicationsAnalytics?.workflowAnalytics?.automationEfficiency || 0 },
      { Section: '', Metric: 'Manual Intervention Rate (%)', Value: applicationsAnalytics?.workflowAnalytics?.manualInterventionRate || 0 },
      { Section: '', Metric: 'Workflow Optimization Score', Value: applicationsAnalytics?.workflowAnalytics?.workflowOptimizationScore || 0 },
      { Section: '', Metric: 'Workflow Stability Score', Value: applicationsAnalytics?.workflowAnalytics?.workflowStabilityScore || 0 },
    ]);
    XLSX.utils.book_append_sheet(workbook, appsSheet, 'Applications Analytics');

    const chartDataSheet = XLSX.utils.json_to_sheet([
      { Section: 'USER ENGAGEMENT CHART DATA', Period: '', Users: '' },
      ...chartData.userEngagementData.map(item => ({
        Section: '',
        Period: item.period,
        Users: item.users,
      })),
      { Section: '', Period: '', Users: '' },
      { Section: 'USER GROWTH TREND CHART DATA', Period: '', NewUsers: '', ActiveUsers: '' },
      ...chartData.userGrowthData.map(item => ({
        Section: '',
        Period: item.period,
        NewUsers: item.newUsers,
        ActiveUsers: item.activeUsers,
      })),
      { Section: '', Period: '', NewUsers: '', ActiveUsers: '' },
      { Section: 'PERFORMANCE RADAR CHART DATA', Metric: '', Value: '', MaxValue: '' },
      ...chartData.performanceRadarData.map(item => ({
        Section: '',
        Metric: item.metric,
        Value: item.value,
        MaxValue: item.fullMark,
      })),
      { Section: '', Metric: '', Value: '', MaxValue: '' },
      { Section: 'USER TYPE CHART DATA', Type: '', Count: '', Percentage: '' },
      ...chartData.userTypeData.map(item => ({
        Section: '',
        Type: item.name,
        Count: item.value,
        Percentage: `${item.percentage}%`,
      })),
    ]);
    XLSX.utils.book_append_sheet(workbook, chartDataSheet, 'Chart Data');

    const completedCount = paymentsData.filter(p => p.status?.toLowerCase() === 'completed').length;
    const pendingCount = paymentsData.filter(p => p.status?.toLowerCase() === 'pending').length;
    const failedCount = paymentsData.filter(p => p.status?.toLowerCase() === 'failed').length;
    const completedAmount = paymentsData.filter(p => p.status?.toLowerCase() === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
    const pendingAmount = paymentsData.filter(p => p.status?.toLowerCase() === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
    const failedAmount = paymentsData.filter(p => p.status?.toLowerCase() === 'failed').reduce((s, p) => s + (p.amount || 0), 0);

    const paymentsSheet = XLSX.utils.json_to_sheet([
      { Section: 'PAYMENT STATUS SUMMARY', Status: '', Count: '', Amount: '', AvgAmount: '' },
      { Section: '', Status: 'Completed', Count: completedCount, Amount: completedAmount, AvgAmount: completedCount > 0 ? (completedAmount / completedCount).toFixed(2) : 0 },
      { Section: '', Status: 'Pending', Count: pendingCount, Amount: pendingAmount, AvgAmount: pendingCount > 0 ? (pendingAmount / pendingCount).toFixed(2) : 0 },
      { Section: '', Status: 'Failed', Count: failedCount, Amount: failedAmount, AvgAmount: failedCount > 0 ? (failedAmount / failedCount).toFixed(2) : 0 },
      { Section: '', Status: 'TOTAL', Count: completedCount + pendingCount + failedCount, Amount: completedAmount + pendingAmount + failedAmount, AvgAmount: '' },
      { Section: '', Status: '', Count: '', Amount: '', AvgAmount: '' },
      { Section: 'PAYMENT TYPE BREAKDOWN', Type: '', Count: '', Percentage: '' },
      ...Object.entries(paymentBreakdown).map(([type, count]) => {
        const total = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        return {
          Section: '',
          Type: type.replace(/_/g, ' '),
          Count: count,
          Percentage: `${percentage}%`,
        };
      }),
      { Section: '', Type: '', Count: '', Percentage: '' },
      { Section: 'AMOUNT BREAKDOWN', Status: '', Total: '' },
      { Section: '', Status: 'Completed Amount', Total: completedAmount },
      { Section: '', Status: 'Pending Amount', Total: pendingAmount },
      { Section: '', Status: 'Failed Amount', Total: failedAmount },
      { Section: '', Status: 'Grand Total', Total: completedAmount + pendingAmount + failedAmount },
    ]);
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments Analytics');

    if (paymentsData.length > 0) {
      const detailedPaymentsSheet = XLSX.utils.json_to_sheet(
        paymentsData.map((payment, index) => ({
          'S.No': index + 1,
          'Payment ID': payment.id || payment.payment_id || 'N/A',
          'Amount': payment.amount || 0,
          'Status': payment.status || 'N/A',
          'Type': payment.type || payment.payment_type || 'N/A',
          'Date': payment.createdAt || payment.date || 'N/A',
          'Description': payment.description || 'N/A',
          'User ID': payment.user_id || payment.userId || 'N/A',
          'Method': payment.method || payment.payment_method || 'N/A',
          'Reference': payment.reference || payment.transactionRef || 'N/A',
        }))
      );
      XLSX.utils.book_append_sheet(workbook, detailedPaymentsSheet, 'Payments List');
    }

    const authProviderSheet = XLSX.utils.json_to_sheet([
      { Section: 'AUTH PROVIDER DISTRIBUTION CHART', Provider: '', Count: '', Percentage: '' },
      ...chartData.authProviderData.map(item => ({
        Section: '',
        Provider: item.name,
        Count: item.value,
        Percentage: `${item.percentage}%`,
      })),
    ]);
    XLSX.utils.book_append_sheet(workbook, authProviderSheet, 'Auth Provider Data');

    const summarySheet = XLSX.utils.json_to_sheet([
      { Report: 'ANALYTICS REPORT SUMMARY', Details: '' },
      { Report: '', Details: '' },
      { Report: 'Report Generated', Details: new Date().toLocaleString('en-IN') },
      { Report: 'Last Updated', Details: usersAnalytics?.lastUpdated ? new Date(usersAnalytics.lastUpdated).toLocaleString('en-IN') : 'N/A' },
      { Report: 'Analysis Date', Details: usersAnalytics?.analysisDate || 'N/A' },
      { Report: '', Details: '' },
      { Report: 'TOTAL COUNTS', Details: '' },
      { Report: 'Total Users', Details: dashboardData?.stats?.totalUsers || 0 },
      { Report: 'Total Applications', Details: dashboardData?.stats?.totalApplications || 0 },
      { Report: 'Total Payments', Details: paymentsData.length },
      { Report: 'Completed Payments', Details: completedCount },
      { Report: 'Pending Payments', Details: pendingCount },
      { Report: 'Failed Payments', Details: failedCount },
      { Report: '', Details: '' },
      { Report: 'KEY METRICS', Details: '' },
      { Report: 'System Uptime', Details: dashboardData?.stats?.systemUptime || 'N/A' },
      { Report: 'Total Revenue', Details: dashboardData?.stats?.totalRevenue || 0 },
      { Report: 'Success Rate', Details: `${applicationsAnalytics?.performanceMetrics?.overallSuccessRate || 0}%` },
      { Report: 'SLA Compliance', Details: `${applicationsAnalytics?.performanceMetrics?.slaCompliance || 0}%` },
      { Report: 'User Retention Rate', Details: `${dashboardData?.userMetrics?.userRetentionRate || 0}%` },
      { Report: 'Quality Score', Details: applicationsAnalytics?.performanceMetrics?.qualityScore || 'N/A' },
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Report');

    XLSX.writeFile(workbook, `Analytics_Report_Complete_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium text-sm">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md shadow-sm">
          <ExclamationCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !usersAnalytics || !applicationsAnalytics) {
    return null;
  }

  // Compact KPI Cards - grouped by category
  const kpiCategories = {
    system: [
      { label: "Total Users", value: (dashboardData?.stats?.totalUsers || 0).toLocaleString(), icon: UsersIcon, color: "blue" },
      { label: "Students", value: (dashboardData?.stats?.totalStudents || 0).toLocaleString(), icon: AcademicCapIcon, color: "green" },
      { label: "Admins", value: (dashboardData?.stats?.totalAdmins || 0).toLocaleString(), icon: UserCircleIcon, color: "purple" },
      { label: "Applications", value: (dashboardData?.stats?.totalApplications || 0).toLocaleString(), icon: DocumentChartBarIcon, color: "orange" },
      { label: "Universities", value: (dashboardData?.stats?.totalUniversities || 0).toLocaleString(), icon: BuildingLibraryIcon, color: "indigo" },
      { label: "Revenue", value: `₹${((dashboardData?.stats?.totalRevenue || 0) / 1000).toFixed(0)}K`, icon: BanknotesIcon, color: "emerald" },
    ],
    users: [
      { label: "New Today", value: (dashboardData?.userMetrics?.newUsersToday || 0).toLocaleString(), color: "blue" },
      { label: "New Week", value: (dashboardData?.userMetrics?.newUsersThisWeek || 0).toLocaleString(), color: "cyan" },
      { label: "New Month", value: (dashboardData?.userMetrics?.newUsersThisMonth || 0).toLocaleString(), color: "teal" },
    ],
    applications: [
      { label: "In Progress", value: (dashboardData?.applicationMetrics?.totalInProgress || 0).toLocaleString(), color: "amber" },
      { label: "This Month", value: (dashboardData?.applicationMetrics?.submittedThisMonth || 0).toLocaleString(), color: "orange" },
      { label: "Completed", value: (dashboardData?.applicationMetrics?.completed || 0).toLocaleString(), color: "green" },
    ],
    financial: [
      { label: "Today", value: `₹${(dashboardData?.financialMetrics?.revenueToday || 0).toLocaleString()}`, color: "green" },
      { label: "This Week", value: `₹${(dashboardData?.financialMetrics?.revenueThisWeek || 0).toLocaleString()}`, color: "emerald" },
      { label: "This Month", value: `₹${(dashboardData?.financialMetrics?.revenueThisMonth || 0).toLocaleString()}`, color: "teal" },
      { label: "Per User", value: `₹${(dashboardData?.financialMetrics?.averageRevenuePerUser || 0).toLocaleString()}`, color: "indigo" },
    ],
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-1 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const userTypeColors = generateColors(chartData.userTypeData.length);
  const authProviderColors = generateColors(chartData.authProviderData.length);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Reports &amp; Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time insights and comprehensive performance metrics
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Last updated: {usersAnalytics?.lastUpdated ? new Date(usersAnalytics.lastUpdated).toLocaleString('en-IN') : 'N/A'}
            </p>
          </div>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export to Excel
          </button>
        </div>

        {/* ── KPI Cards Section ────────────────────────────────────────────── */}
        <Card>
          <CardContent>
            {/* System Overview */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center">
                <span className="h-1 w-8 bg-primary rounded mr-2"></span>
                System Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {kpiCategories.system.map((item, idx) => (
                  <CompactKPICard key={idx} item={item} />
                ))}
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">User Metrics</h3>
                <div className="grid grid-cols-3 gap-2">
                  {kpiCategories.users.map((item, idx) => (
                    <MiniKPICard key={idx} item={item} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Applications</h3>
                <div className="grid grid-cols-3 gap-2">
                  {kpiCategories.applications.map((item, idx) => (
                    <MiniKPICard key={idx} item={item} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Revenue</h3>
                <div className="grid grid-cols-2 gap-2">
                  {kpiCategories.financial.map((item, idx) => (
                    <MiniKPICard key={idx} item={item} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Live Stats</h3>
                <div className="grid grid-cols-3 gap-2">
                  <MiniKPICard item={{
                    label: "Daily Active",
                    value: (usersAnalytics?.engagementMetrics?.dailyActiveUsers || 0).toLocaleString(),
                    color: "blue"
                  }} />
                  <MiniKPICard item={{
                    label: "Weekly Active",
                    value: (usersAnalytics?.engagementMetrics?.weeklyActiveUsers || 0).toLocaleString(),
                    color: "cyan"
                  }} />
                  <MiniKPICard item={{
                    label: "Monthly Active",
                    value: (usersAnalytics?.engagementMetrics?.monthlyActiveUsers || 0).toLocaleString(),
                    color: "teal"
                  }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Users Analytics Section ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="h-1.5 w-12 bg-primary rounded mr-3"></span>
              Users Analytics
            </h2>
            <span className="text-xs text-slate-400">
              {usersAnalytics?.analysisDate || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Engagement Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>Active users across different time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData.userEngagementData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(28, 70%, 56%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(28, 70%, 56%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(28, 70%, 56%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      animationDuration={1200}
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {chartData.userEngagementData.map((item, idx) => {
                    const accents = ['border-l-4 border-primary', 'border-l-4 border-secondary-dark', 'border-l-4 border-primary-light'];
                    return (
                      <div key={idx} className={`bg-white rounded-xl border border-slate-100 ${accents[idx]} p-3 shadow-sm`}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.period}</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{item.users}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* User Type Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Type Distribution</CardTitle>
                <CardDescription>Breakdown by user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData.userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={1200}
                    >
                      {chartData.userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={userTypeColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {chartData.userTypeData.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: userTypeColors[idx] }}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{item.name}</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{item.value}</p>
                      <p className="text-xs text-slate-400">{item.percentage}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Payments Analytics Section ───────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <span className="h-1.5 w-12 bg-primary-dark rounded mr-3"></span>
            Payments Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Completed vs Pending Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completed vs Pending Payments</CardTitle>
                <CardDescription>Transaction count by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData.paymentStatusData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1200} name="Transactions">
                      {chartData.paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {chartData.paymentStatusData.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: item.color }}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.name}</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Amount Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Amount Breakdown</CardTitle>
                <CardDescription>Completed vs Pending by ₹ value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: chartData.completedAmount, color: '#10b981' },
                        { name: 'Pending', value: chartData.pendingAmount, color: '#f59e0b' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      animationDuration={1200}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-emerald-500 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">₹{chartData.completedAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-amber-500 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">₹{chartData.pendingAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Payment Type Breakdown ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Type Breakdown</CardTitle>
            <CardDescription>Transaction count by payment category</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5">
              {chartData.paymentTypeData?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0"
                    style={{ background: generateColors(10)[idx % 10] }} />
                  {item.name}
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="space-y-2.5">
              {(() => {
                const maxVal = Math.max(...(chartData.paymentTypeData?.map(d => d.value) || [1]));
                const total = chartData.paymentTypeData?.reduce((s, d) => s + d.value, 0) || 1;
                return chartData.paymentTypeData?.map((item, idx) => {
                  const pct = Math.round((item.value / maxVal) * 100);
                  const sharePct = ((item.value / total) * 100).toFixed(1);
                  const color = generateColors(10)[idx % 10];
                  const isSmall = pct < 18;
                  return (
                    <div key={idx} className="flex items-center gap-3 group relative">
                      <div className="text-right text-xs text-slate-500 shrink-0"
                        style={{ minWidth: 148, maxWidth: 148, lineHeight: 1.3 }}>
                        {item.name}
                      </div>
                      <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-visible relative">
                        <div
                          className="h-full rounded-lg flex items-center justify-end pr-2.5 transition-all duration-700 cursor-pointer relative"
                          style={{ width: `${pct}%`, background: color }}
                        >
                          {!isSmall && (
                            <span className="text-xs font-medium text-white">{item.value}</span>
                          )}

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-200 whitespace-nowrap"
                          >
                            <div className="rounded-xl px-3 py-2 shadow-lg text-white text-xs"
                              style={{ background: color }}>
                              <p className="font-semibold text-sm">{item.name}</p>
                              <p className="opacity-90 mt-0.5">{item.value} transaction{item.value !== 1 ? 's' : ''}</p>
                              <p className="opacity-75">{sharePct}% of total</p>
                            </div>
                            <div className="w-2 h-2 mx-auto rotate-45 -mt-1"
                              style={{ background: color }} />
                          </div>
                        </div>

                        {isSmall && (
                          <span className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
                            style={{ left: `calc(${pct}% + 8px)` }}>
                            {item.value}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Summary stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-primary p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pending</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {paymentsData.filter(p => p.status?.toLowerCase() === 'pending').length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-emerald-500 p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{chartData.paymentTypeData?.length || 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-secondary-dark p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {chartData.paymentTypeData?.reduce((s, d) => s + d.value, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ReportsAnalytics;
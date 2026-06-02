import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  fetchApplicationsStart,
  fetchApplicationsSuccess,
  fetchApplicationsFailure,
  setFilters,
  applyFilters,
  clearFilters,
} from "../../store/slices/applicationsSlice";
import {
  fetchApplications,
  fetchApplicationAnalytics,
  mapApplicationStatus,
  mapWorkflowStage,
  getStatusColor,
} from "../../services/applicationService";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  const displayStatus = mapApplicationStatus(status);

  const colorClasses = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const icons = {
    green: CheckCircleIcon,
    yellow: ClockIcon,
    red: XCircleIcon,
    blue: ClockIcon,
    gray: DocumentTextIcon,
  };

  const Icon = icons[color];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      <Icon className="h-3 w-3 mr-1" />
      {displayStatus}
    </span>
  );
};

const ApplicationOversight = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    applications,
    filteredApplications,
    loading,
    error,
    filters
  } = useSelector((state) => state.applications);

  const [analytics, setAnalytics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [summary, setSummary] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiSearchTerm, setApiSearchTerm] = useState("");
  const [fetchError, setFetchError] = useState(null);
  const itemsPerPage = 20;

  // Fetch applications and analytics on mount
  useEffect(() => {
    loadAnalytics();
  }, []);

  // Debounced API Search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplications(apiSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [apiSearchTerm]);

  // Real-time search and filter
  useEffect(() => {
    if (localFilters.searchTerm || Object.values(localFilters).some(v => v)) {
      filterApplicationsLocally();
    }
  }, [localFilters, applications]);

  // Function to filter applications locally on the frontend
  // Function to filter applications locally on the frontend
  // Function to filter applications locally on the frontend
  const filterApplicationsLocally = () => {
    if (!applications || applications.length === 0) return;

    const { searchTerm, status, dateFrom, dateTo } = localFilters;

    const filtered = applications.filter((app) => {
      // Search by reference number, student ID, or course
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          app.referenceNumber?.toLowerCase().includes(searchLower) ||
          app.studentId?.toString().includes(searchTerm) ||
          app.courseId?.toLowerCase().includes(searchLower) ||
          app.universityId?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter by status
      if (status && app.status !== status) return false;

      // Filter by date range
      if (dateFrom) {
        const appDate = new Date(app.createdAt);
        const fromDate = new Date(dateFrom);
        if (appDate < fromDate) return false;
      }

      if (dateTo) {
        const appDate = new Date(app.createdAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (appDate > toDate) return false;
      }

      return true;
    });

    // Update Redux with filtered results
    dispatch(setFilters(localFilters));
    dispatch(applyFilters(filtered));
  };

  // Calculate paginated applications
  const getPaginatedApplications = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil((filteredApplications?.length || 0) / itemsPerPage);

  const loadApplications = async (search = "") => {
    dispatch(fetchApplicationsStart());
    setFetchError(null);

    // fetchApplications never throws — it returns { success, data } always
    const response = await fetchApplications(0, 100, search);

    // Surface a non-blocking warning banner when backend returned an error
    if (!response.success) {
      setFetchError(response.error || 'Failed to load applications from server.');
    }

    // Save summary data (will be all-zeros on failure, which is fine)
    if (response.data.summary) {
      setSummary(response.data.summary);
    }

    // Sort applications by student name to group them visually
    const sortedApplications = (response.data.applications || []).sort((a, b) => {
      const nameA = a.studentName || 'Unknown';
      const nameB = b.studentName || 'Unknown';
      return nameA.localeCompare(nameB);
    });

    // Transform API response to match Redux state structure
    const transformedData = {
      applications: sortedApplications,
      pagination: {
        currentPage: (response.data.pagination?.currentPage ?? 0) + 1,
        totalPages: response.data.pagination?.totalPages ?? 0,
        totalCount: response.data.pagination?.totalElements ?? 0,
        pageSize: response.data.pagination?.pageSize ?? 100,
      }
    };

    dispatch(fetchApplicationsSuccess(transformedData));
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetchApplicationAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      // Don't fail the whole page if analytics fail
    }
  };

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    filterApplicationsLocally();
    setCurrentPage(1);  // ← ADD THIS LINE
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      university: "",
      status: "",
      agent: "",
      student: "",
      country: "",
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
    };
    setLocalFilters(clearedFilters);
    dispatch(clearFilters());
    setApiSearchTerm("");
    // Reset to show all applications
    dispatch(fetchApplicationsSuccess({
      applications: [],
      pagination: {}
    }));
    // Note: loadApplications is not called directly here because changing apiSearchTerm to "" 
    // will trigger the debounced useEffect and call loadApplications.
  };

  const handleExportCSV = () => {
    if (!filteredApplications || filteredApplications.length === 0) {
      alert('No data to export');
      return;
    }
    const rows = filteredApplications.map((app) => ({
      "Reference Number": app.referenceNumber || "",
      "Workflow Stage": app.workflowStage || "",
      "Assigned Admin": app.assignedAdminName || "No admin assigned yet",
      "Assigned Admin Email": app.assignedAdminEmail || "",
      "University ID": app.universityId || "",
      "Course ID": app.courseId || "",
      "Created Date": app.createdAt || "",
      "Submitted Date": app.submittedAt || "",
      "Last Updated": app.lastUpdatedAt || "",
      "Student Name": app.studentName || "",
      "Is Urgent": app.isUrgent ? "Yes" : "No",
      "Processing Time (Hours)": app.processingTimeHours || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    XLSX.writeFile(wb, `applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrgencyBadge = (isUrgent) => {
    if (!isUrgent) return null;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        Urgent
      </span>
    );
  };

  if (loading && !filteredApplications.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Application Oversight
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage and monitor all student applications
        </p>
      </div>

      {/* Application Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total", value: summary.totalApplications, icon: DocumentTextIcon, iconColor: "text-primary", bgColor: "bg-primary/10", accent: "border-l-4 border-primary" },
            { label: "Draft", value: summary.draftApplications, icon: DocumentTextIcon, iconColor: "text-muted-foreground", bgColor: "bg-muted", accent: "border-l-4 border-border" },
            { label: "Submitted", value: summary.submittedApplications, icon: ClockIcon, iconColor: "text-foreground", bgColor: "bg-secondary/40", accent: "border-l-4 border-secondary-dark" },
            { label: "Under Review", value: summary.underReviewApplications, icon: ExclamationTriangleIcon, iconColor: "text-primary-dark", bgColor: "bg-primary-light/20", accent: "border-l-4 border-primary-light" },
            { label: "Completed", value: summary.completedApplications, icon: CheckCircleIcon, iconColor: "text-foreground", bgColor: "bg-secondary-light/60", accent: "border-l-4 border-secondary" },
            { label: "Unassigned", value: summary.unassignedApplications, icon: XCircleIcon, iconColor: "text-destructive", bgColor: "bg-destructive/10", accent: "border-l-4 border-destructive" },
          ].map(({ label, value, icon: Icon, iconColor, bgColor, accent }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-card rounded-xl shadow-sm border border-border ${accent} p-4 hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search applications..."
            value={apiSearchTerm}
            onChange={(e) => setApiSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadApplications}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900">
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedApplications().map((application, index, arr) => {
                const showHeader = index === 0 || application.studentName !== arr[index - 1].studentName;
                return (
                  <React.Fragment key={application.id}>
                    {showHeader && (
                      <tr className="bg-gray-100/80 border-t-2 border-gray-200 shadow-sm">
                        <td colSpan="6" className="px-6 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs uppercase shadow-sm">
                              {(application.studentName || 'U').charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">
                                {application.studentName || 'Unknown Student'}
                              </h3>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/applications/${application.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {application.referenceNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getUrgencyBadge(application.isUrgent)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.studentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {mapWorkflowStage(application.workflowStage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.assignedAdminName ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{application.assignedAdminName}</div>
                            <div className="text-xs text-gray-500">{application.assignedAdminEmail}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            No admin assigned yet
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(application.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/applications/${application.id}`);
                          }}
                          className="text-primary-600 hover:text-primary-900">
                          View Details
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.searchTerm || Object.values(filters).some(v => v)
                ? "No applications match your filters"
                : "Get started by creating a new application"}
            </p>
          </div>
        )}
      </div>

      {/* Applications Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {getPaginatedApplications().map((application, index, arr) => {
          const showHeader = index === 0 || application.studentName !== arr[index - 1].studentName;
          return (
            <React.Fragment key={application.id}>
              {showHeader && (
                <div className="mt-6 mb-3 flex items-center space-x-3 px-1">
                  <div className="h-10 w-10 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-base uppercase shadow-sm">
                    {(application.studentName || 'U').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {application.studentName || 'Unknown Student'}
                    </h3>
                    <p className="text-xs text-gray-500">Student Profile</p>
                  </div>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-4"
                onClick={() => navigate(`/applications/${application.id}`)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {application.referenceNumber}
                    </h3>
                    <div className="mt-1">
                      {application.assignedAdminName ? (
                        <>
                          <p className="text-xs font-medium text-gray-900">{application.assignedAdminName}</p>
                          <p className="text-xs text-gray-500">{application.assignedAdminEmail}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          No admin assigned yet
                        </p>
                      )}
                    </div>
                  </div>
                  {getUrgencyBadge(application.isUrgent)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Workflow:</span>
                    <span className="text-xs text-gray-900">
                      {mapWorkflowStage(application.workflowStage)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Created:</span>
                    <span className="text-xs text-gray-900">
                      {formatDate(application.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Student Name:</span>
                    <span className="text-xs text-gray-900">
                      {application.studentName || 'N/A'}
                    </span>
                  </div>
                </div>

                <button
                  className="mt-3 w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">
                  View Details →
                </button>
              </motion.div>
            </React.Fragment>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.searchTerm || Object.values(filters).some(v => v)
                ? "No applications match your filters"
                : "Get started by creating a new application"}
            </p>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredApplications.length)}
            </span>{' '}
            of <span className="font-medium">{filteredApplications.length}</span> applications
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}
    </div >
  );
};

export default ApplicationOversight;
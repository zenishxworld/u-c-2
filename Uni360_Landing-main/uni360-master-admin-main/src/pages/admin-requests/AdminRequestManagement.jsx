import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  UserGroupIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAdmins,
  fetchAdminPermissions,
  updateAdminPermissions,
  setFilters,
  applyFilters,
  clearFilters,
  setSelectedRequest,
} from "../../store/slices/adminRequestsSlice";
import { fetchAdminFilters } from "../../services/adminService";
import { FunnelIcon, XCircleIcon } from "@heroicons/react/24/outline";

const AdminRequestManagement = () => {
  const dispatch = useDispatch();
  const {
    filteredRequests,
    selectedRequest,
    filters,
    stats,
    loading,
    error,
    permissionsLoading,
  } = useSelector((state) => state.adminRequests);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [permissionUpdates, setPermissionUpdates] = useState({
    canVerifyDocuments: false,
    canApproveApplications: false,
    canProcessPayments: false,
    canManageUsers: false,
    reason: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
const [filterConfig, setFilterConfig] = useState(null);
const [advancedFilters, setAdvancedFilters] = useState({
  role: "",
  is_active: "",
  specialization: "",
  department: "",
  permissions: [],
  quality_score_min: "",
  quality_score_max: "",
  workload_min: "",
  workload_max: "",
  sort: "created_at",
  direction: "DESC",
});

  // Fetch admins on component mount
  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    dispatch(applyFilters());
  }, [filters, dispatch]);

  // Fetch filter configuration on mount
useEffect(() => {
  const loadFilterConfig = async () => {
    try {
      const response = await fetchAdminFilters();
      if (response.success) {
        setFilterConfig(response.data);
      }
    } catch (error) {
    }
  };
  loadFilterConfig();
}, []);

  const handleSearch = (searchTerm) => {
    dispatch(setFilters({ searchTerm }));
  };

  const handleAdvancedFilterChange = (filterName, value) => {
  setAdvancedFilters(prev => ({ ...prev, [filterName]: value }));
};

const handlePermissionFilterToggle = (permission) => {
  setAdvancedFilters(prev => {
    const permissions = prev.permissions.includes(permission)
      ? prev.permissions.filter(p => p !== permission)
      : [...prev.permissions, permission];
    return { ...prev, permissions };
  });
};

const buildQueryParams = () => {
  const params = {};
  
  if (filters.searchTerm) params.search = filters.searchTerm;
  if (advancedFilters.role) params.role = advancedFilters.role;
  if (advancedFilters.is_active !== "") params.is_active = advancedFilters.is_active;
  if (advancedFilters.specialization) params.specialization = advancedFilters.specialization;
  if (advancedFilters.department) params.department = advancedFilters.department;
  if (advancedFilters.permissions.length > 0) params.permissions = advancedFilters.permissions.join(",");
  if (advancedFilters.quality_score_min) params.quality_score_min = advancedFilters.quality_score_min;
  if (advancedFilters.quality_score_max) params.quality_score_max = advancedFilters.quality_score_max;
  if (advancedFilters.workload_min) params.workload_min = advancedFilters.workload_min;
  if (advancedFilters.workload_max) params.workload_max = advancedFilters.workload_max;
  if (advancedFilters.sort) params.sort = advancedFilters.sort;
  if (advancedFilters.direction) params.direction = advancedFilters.direction;

  return params;
};

const handleApplyAdvancedFilters = () => {
  const params = buildQueryParams();
  dispatch(fetchAdmins(params));
  setShowAdvancedFilters(false);
};

const handleClearAllFilters = () => {
  setAdvancedFilters({
    role: "",
    is_active: "",
    specialization: "",
    department: "",
    permissions: [],
    quality_score_min: "",
    quality_score_max: "",
    workload_min: "",
    workload_max: "",
    sort: "created_at",
    direction: "DESC",
  });
  dispatch(clearFilters());
  dispatch(fetchAdmins());
};

const hasActiveFilters = () => {
  return filters.searchTerm ||
         advancedFilters.role ||
         advancedFilters.is_active !== "" ||
         advancedFilters.specialization ||
         advancedFilters.department ||
         advancedFilters.permissions.length > 0 ||
         advancedFilters.quality_score_min ||
         advancedFilters.quality_score_max ||
         advancedFilters.workload_min ||
         advancedFilters.workload_max;
};

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handleViewRequest = (request) => {
    dispatch(setSelectedRequest(request));
    setShowRequestModal(true);
  };

  const handleManagePermissions = async (admin) => {
    setSelectedAdmin(admin);
    
    // Fetch current permissions
    if (admin.id) {
      await dispatch(fetchAdminPermissions(admin.id));
    }
    
    // Set initial permission values
    setPermissionUpdates({
      canVerifyDocuments: admin.permissions?.canVerifyDocuments || false,
      canApproveApplications: admin.permissions?.canApproveApplications || false,
      canProcessPayments: admin.permissions?.canProcessPayments || false,
      canManageUsers: admin.permissions?.canManageUsers || false,
      reason: "",
    });
    
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async () => {
    if (selectedAdmin && permissionUpdates.reason.trim()) {
      try {
        await dispatch(
          updateAdminPermissions({
            adminUuid: selectedAdmin.id,
            permissionsData: permissionUpdates,
          })
        ).unwrap();
        
        setShowPermissionsModal(false);
        setSelectedAdmin(null);
        setPermissionUpdates({
          canVerifyDocuments: false,
          canApproveApplications: false,
          canProcessPayments: false,
          canManageUsers: false,
          reason: "",
        });
        
        // Refresh admin list
        dispatch(fetchAdmins());
      } catch (error) {
      }
    }
  };

  const handleRefresh = () => {
    dispatch(fetchAdmins());
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      active: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      inactive: "bg-red-100 text-red-800",
    };
    return `px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
      statusConfig[status] || "bg-gray-100 text-gray-800"
    }`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Admin Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage admin users and permissions
          </p>
        </div>
        
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.approved}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XMarkIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.declined}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
  className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
  <div className="flex flex-col space-y-4">
    {/* Search Bar */}
    <div className="flex gap-2">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search admins by name, username, email, employee ID..."
          value={filters.searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          showAdvancedFilters || hasActiveFilters()
            ? "bg-primary-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}>
        <FunnelIcon className="h-4 w-4" />
        Filters
        {hasActiveFilters() && (
          <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            !
          </span>
        )}
      </button>
    </div>

    {/* Quick Filters */}
    <div className="flex flex-wrap gap-2">
      

      {hasActiveFilters() && (
        <button
          onClick={handleClearAllFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">
          <XCircleIcon className="h-4 w-4" />
          Clear All
        </button>
      )}
    </div>

    {/* Advanced Filters Panel */}
    {showAdvancedFilters && filterConfig && (
      <div className="border-t pt-4 space-y-4">
        <h3 className="font-medium text-gray-900">Advanced Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Role Filter */}
          {filterConfig.availableFilters.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={advancedFilters.role}
                onChange={(e) => handleAdvancedFilterChange("role", e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Roles</option>
                {filterConfig.availableFilters.role.values.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active Status Filter */}
          {filterConfig.availableFilters.is_active && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Active Status
              </label>
              <select
                value={advancedFilters.is_active}
                onChange={(e) => handleAdvancedFilterChange("is_active", e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}

          {/* Specialization Filter */}
          {filterConfig.availableFilters.specialization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select
                value={advancedFilters.specialization}
                onChange={(e) => handleAdvancedFilterChange("specialization", e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Specializations</option>
                {filterConfig.availableFilters.specialization.values.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          {filterConfig.availableFilters.department && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={advancedFilters.department}
                onChange={(e) => handleAdvancedFilterChange("department", e.target.value)}
                placeholder="Enter department"
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Quality Score Range */}
          {filterConfig.availableFilters.quality_score && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Quality Score ({filterConfig.availableFilters.quality_score.min}-{filterConfig.availableFilters.quality_score.max})
                </label>
                <input
                  type="number"
                  min={filterConfig.availableFilters.quality_score.min}
                  max={filterConfig.availableFilters.quality_score.max}
                  step="0.1"
                  value={advancedFilters.quality_score_min}
                  onChange={(e) => handleAdvancedFilterChange("quality_score_min", e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Quality Score
                </label>
                <input
                  type="number"
                  min={filterConfig.availableFilters.quality_score.min}
                  max={filterConfig.availableFilters.quality_score.max}
                  step="0.1"
                  value={advancedFilters.quality_score_max}
                  onChange={(e) => handleAdvancedFilterChange("quality_score_max", e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Workload Range */}
          {filterConfig.availableFilters.workload && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Workload ({filterConfig.availableFilters.workload.min}-{filterConfig.availableFilters.workload.max})
                </label>
                <input
                  type="number"
                  min={filterConfig.availableFilters.workload.min}
                  max={filterConfig.availableFilters.workload.max}
                  value={advancedFilters.workload_min}
                  onChange={(e) => handleAdvancedFilterChange("workload_min", e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Workload
                </label>
                <input
                  type="number"
                  min={filterConfig.availableFilters.workload.min}
                  max={filterConfig.availableFilters.workload.max}
                  value={advancedFilters.workload_max}
                  onChange={(e) => handleAdvancedFilterChange("workload_max", e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Permissions Filter */}
        {filterConfig.availableFilters.permissions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="flex flex-wrap gap-2">
              {filterConfig.availableFilters.permissions.fields.map(permission => (
                <label
                  key={permission}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={advancedFilters.permissions.includes(permission)}
                    onChange={() => handlePermissionFilterToggle(permission)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {permission.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={advancedFilters.sort}
              onChange={(e) => handleAdvancedFilterChange("sort", e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {filterConfig.sortOptions.map(option => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <select
              value={advancedFilters.direction}
              onChange={(e) => handleAdvancedFilterChange("direction", e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleApplyAdvancedFilters}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors">
            Apply Filters
          </button>
          <button
            onClick={handleClearAllFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
            Clear All
          </button>
        </div>
      </div>
    )}
  </div>
</motion.div>

      {/* Loading State */}
      {loading && filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admins...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No admins found</p>
        </div>
      ) : (
        /* Requests Table (Desktop) / Cards (Mobile) */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.name || `${request.firstName || ''} ${request.lastName || ''}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.organization || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.position || request.role || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={getStatusBadge(request.status)}>
                        {request.status?.charAt(0).toUpperCase() +
                          request.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {request.adminType || request.roleType ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {request.adminType === "team_member"
                            ? "Team Member"
                            : request.adminType === "external_admin"
                            ? "External Admin"
                            : request.roleType || request.adminType}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDate(request.createdAt || request.submittedAt)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleManagePermissions(request)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="Manage Permissions">
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {request.name || `${request.firstName || ''} ${request.lastName || ''}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {request.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={getStatusBadge(request.status)}>
                      {request.status?.charAt(0).toUpperCase() +
                        request.status?.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-900">
                  <span className="font-medium">Organization:</span>{" "}
                  <span className="break-words">{request.organization || "N/A"}</span>
                </div>
                <div className="text-sm text-gray-900">
                  <span className="font-medium">Position:</span>{" "}
                  <span className="break-words">{request.position || request.role || "N/A"}</span>
                </div>
                <div className="text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {formatDate(request.createdAt || request.submittedAt)}
                </div>
                {(request.adminType || request.roleType) && (
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Type:</span>{" "}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                      {request.adminType === "team_member"
                        ? "Team Member"
                        : request.adminType === "external_admin"
                        ? "External Admin"
                        : request.roleType || request.adminType}
                    </span>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewRequest(request)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    title="View Details">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleManagePermissions(request)}
                    className="text-primary-600 hover:text-primary-900 p-1 rounded"
                    title="Manage Permissions">
                    <CheckIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed !mt-0 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Admin Details
              </h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.name || `${selectedRequest.firstName || ''} ${selectedRequest.lastName || ''}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span className={getStatusBadge(selectedRequest.status)}>
                      {selectedRequest.status?.charAt(0).toUpperCase() +
                        selectedRequest.status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                  Organization
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Organization
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.organization || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.position || selectedRequest.role || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRequest.bio && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                    Bio
                  </h3>
                  <p className="text-sm text-gray-900">{selectedRequest.bio}</p>
                </div>
              )}

              {(selectedRequest.specialization || selectedRequest.languages) && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedRequest.specialization && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Specialization
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedRequest.specialization}
                        </p>
                      </div>
                    )}
                    {selectedRequest.languages && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Languages
                        </label>
                        <p className="text-sm text-gray-900">
                          {Array.isArray(selectedRequest.languages)
                            ? selectedRequest.languages.join(", ")
                            : selectedRequest.languages}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.permissions && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                    Permissions
                  </h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
                    {Object.entries(selectedRequest.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                          {value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                    Documents
                  </h3>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <DocumentIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          {doc.name || doc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Management Modal */}
      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Manage Permissions
              </h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Update permissions for {selectedAdmin.name || `${selectedAdmin.firstName || ''} ${selectedAdmin.lastName || ''}`}
              </p>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Verify Documents</div>
                    <div className="text-xs text-gray-600">
                      Can verify and approve documents
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionUpdates.canVerifyDocuments}
                    onChange={(e) =>
                      setPermissionUpdates({
                        ...permissionUpdates,
                        canVerifyDocuments: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Approve Applications</div>
                    <div className="text-xs text-gray-600">
                      Can approve student applications
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionUpdates.canApproveApplications}
                    onChange={(e) =>
                      setPermissionUpdates({
                        ...permissionUpdates,
                        canApproveApplications: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Process Payments</div>
                    <div className="text-xs text-gray-600">
                      Can handle payment processing
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionUpdates.canProcessPayments}
                    onChange={(e) =>
                      setPermissionUpdates({
                        ...permissionUpdates,
                        canProcessPayments: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Manage Users</div>
                    <div className="text-xs text-gray-600">
                      Can manage user accounts
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionUpdates.canManageUsers}
                    onChange={(e) =>
                      setPermissionUpdates({
                        ...permissionUpdates,
                        canManageUsers: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for change <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={permissionUpdates.reason}
                    onChange={(e) =>
                      setPermissionUpdates({
                        ...permissionUpdates,
                        reason: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide a reason for updating permissions..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowPermissionsModal(false)}
                disabled={permissionsLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:bg-gray-300">
                Cancel
              </button>
              <button
                onClick={handleUpdatePermissions}
                disabled={!permissionUpdates.reason.trim() || permissionsLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-300 flex items-center justify-center">
                {permissionsLoading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Permissions"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestManagement;
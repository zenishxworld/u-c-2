import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
// import { usersAPI } from "../../services/apiServices";

// Dummy data for users
const dummyUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "agent",
    status: "active",
    country: "UK",
    lastLogin: "2024-01-15T10:30:00Z",
    createdAt: "2023-06-01T09:00:00Z",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "student",
    status: "active",
    country: "Germany",
    lastLogin: "2024-01-14T14:20:00Z",
    createdAt: "2023-05-15T11:30:00Z",
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    country: "UK",
    lastLogin: "2024-01-16T08:45:00Z",
    createdAt: "2023-01-01T00:00:00Z",
  },
];

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState(dummyUsers);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view', 'create', 'edit'
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 3,
    agents: 1,
    students: 1,
    admins: 1,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Commented out API call - using dummy data
      // const response = await usersAPI.getUsers(filters);
      // setUsers(response.data.users);
      // setTotalPages(response.data.totalPages);

      // Using dummy data instead
      setUsers(dummyUsers);
      setTotalPages(1);

      // Calculate stats from dummy data
      setStats({
        total: dummyUsers.length,
        agents: dummyUsers.filter((u) => u.role === "agent").length,
        students: dummyUsers.filter((u) => u.role === "student").length,
        admins: dummyUsers.filter((u) => u.role === "admin").length,
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []); // Removed filters dependency since we're using dummy data

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalMode("create");
    setShowUserModal(true);
  };

  const handleViewUser = async (userId) => {
    try {
      // Find user in dummy data
      const user = dummyUsers.find((u) => u.id === userId);

      // If the user is a student, navigate to student details page
      if (user && user.role === "student") {
        navigate(`/users/${userId}`);
      } else {
        // For other user types (admin, agent), show modal
        setSelectedUser(user);
        setModalMode("view");
        setShowUserModal(true);
      }
    } catch (error) {
    }
  };

  const handleEditUser = async (userId) => {
    try {
      // Commented out API call - using dummy data
      // const response = await usersAPI.getUser(userId);
      // setSelectedUser(response.data);

      // Find user in dummy data
      const user = dummyUsers.find((u) => u.id === userId);
      setSelectedUser(user);
      setModalMode("edit");
      setShowUserModal(true);
    } catch (error) {
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Commented out API call
        // await usersAPI.deleteUser(userId);

        // Remove from dummy data
        const updatedUsers = users.filter((u) => u.id !== userId);
        setUsers(updatedUsers);

        // Update stats
        setStats({
          total: updatedUsers.length,
          agents: updatedUsers.filter((u) => u.role === "agent").length,
          students: updatedUsers.filter((u) => u.role === "student").length,
          admins: updatedUsers.filter((u) => u.role === "admin").length,
        });
      } catch (error) {
      }
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (modalMode === "create") {
        // Commented out API call
        // await usersAPI.createUser(userData);

        // Add to dummy data
        const newUser = { ...userData, id: users.length + 1 };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
      } else if (modalMode === "edit") {
        // Commented out API call
        // await usersAPI.updateUser(selectedUser.id, userData);

        // Update in dummy data
        const updatedUsers = users.map((u) =>
          u.id === selectedUser.id ? { ...u, ...userData } : u
        );
        setUsers(updatedUsers);
      }
      setShowUserModal(false);
      // fetchUsers(); // Comment out as well
    } catch (error) {
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "agent":
        return <UserIcon className="h-5 w-5 text-blue-500" />;
      case "student":
        return <AcademicCapIcon className="h-5 w-5 text-green-500" />;
      case "admin":
        return <ShieldCheckIcon className="h-5 w-5 text-primary-500" />;
      case "sub_agent":
        return <UsersIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"
          }`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden mobile-page-container pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            User & Role Management
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            Manage users, agents, students, and administrators
          </p>
        </div>
        <div className="flex mobile-stack">
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs md:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 stats-grid">
        {[
          {
            title: "Total Users",
            value: stats.total,
            icon: UserGroupIcon,
            color: "blue",
          },
          {
            title: "Agents",
            value: stats.agents,
            icon: UserIcon,
            color: "green",
          },
          {
            title: "Students",
            value: stats.students,
            icon: AcademicCapIcon,
            color: "purple",
          },
          {
            title: "Admins",
            value: stats.admins,
            icon: ShieldCheckIcon,
            color: "orange",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 md:p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-5 w-5 md:h-6 md:w-6 text-${stat.color}-600`}
                  />
                </div>
                <div className="ml-3 md:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-base md:text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4 md:p-6 mobile-compact">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mobile-form-row">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={handleSearch}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md pl-10 input-field"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="sub_agent">Sub Agent</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-start">
            <button
              onClick={() =>
                setFilters({
                  search: "",
                  role: "",
                  status: "",
                  page: 1,
                  limit: 10,
                })
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users - Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-left py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-left py-8">
            <UserGroupIcon className="h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No users found
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="mobile-table-card bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row items-start">
                <img
                  className="h-12 w-12 rounded-full object-cover mb-2 sm:mb-0 sm:mr-4"
                  src={user.avatar}
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user.name}
                    </h4>
                    <div className="mt-1 sm:mt-0 sm:ml-2">{getStatusBadge(user.status)}</div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <div className="mt-1 flex items-start text-xs text-gray-500">
                    {getRoleIcon(user.role)}
                    <span className="ml-1 capitalize">
                      {user.role.replace("_", " ")}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{user.country}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Last login: {user.lastLogin || "Never"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-start justify-start space-x-2">
                <button
                  onClick={() => handleViewUser(user.id)}
                  className="p-2 rounded-lg text-primary-700 hover:bg-primary-50 active:bg-primary-100"
                  title="View User"
                  aria-label="View User">
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEditUser(user.id)}
                  className="p-2 rounded-lg text-green-700 hover:bg-green-50 active:bg-green-100"
                  title="Edit User"
                  aria-label="Edit User">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 rounded-lg text-red-700 hover:bg-red-50 active:bg-red-100"
                  title="Delete User"
                  aria-label="Delete User">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Users Table - Desktop/Tablet */}
      <div className="hidden sm:block bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6 responsive-table">
          {loading ? (
            <div className="text-left py-8 md:py-12">
              <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-xs md:text-sm text-gray-500">
                Loading users...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-left py-8 md:py-12">
              <UserGroupIcon className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No users found
              </h3>
              <p className="mt-1 text-xs md:text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto responsive-table">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user.uuid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          {getRoleIcon(user.role)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {user.role.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.country}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin || "Never"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="p-2 rounded-lg text-primary-700 hover:bg-primary-50 active:bg-primary-100"
                            title="View User"
                            aria-label="View User">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="p-2 rounded-lg text-green-700 hover:bg-green-50 active:bg-green-100"
                            title="Edit User"
                            aria-label="Edit User">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg text-red-700 hover:bg-red-50 active:bg-red-100"
                            title="Delete User"
                            aria-label="Delete User">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-3 sm:px-4 py-3 flex items-start justify-start border-t border-gray-200">
          <div className="flex-1 flex justify-start sm:hidden">
            <button
              onClick={() => handleFilterChange("page", filters.page - 1)}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button
              onClick={() => handleFilterChange("page", filters.page + 1)}
              disabled={filters.page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-start sm:justify-start">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{filters.page}</span>{" "}
                of <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => handleFilterChange("page", page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === filters.page
                        ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}>
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          mode={modalMode}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ user, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    country: "UK",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "student",
        status: user.status || "active",
        country: user.country || "UK",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isReadOnly = mode === "view";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end sm:items-center justify-start min-h-screen pt-0 sm:pt-4 px-0 sm:px-4 pb-0 sm:pb-20 text-left sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}></div>

        {/* Panel: full-screen on mobile, dialog on tablet/desktop */}
        <div className="inline-block align-bottom sm:align-middle bg-white rounded-none sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-screen h-screen sm:w-full sm:h-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {mode === "create"
                    ? "Create User"
                    : mode === "edit"
                      ? "Edit User"
                      : "User Details"}
                </h3>
              </div>

              <div className="space-y-4 mobile-form-group">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isReadOnly}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isReadOnly}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100">
                      <option value="student">Student</option>
                      <option value="agent">Agent</option>
                      <option value="sub_agent">Sub Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100">
                      <option value="UK">United Kingdom</option>
                      <option value="Germany">Germany</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={isReadOnly}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sticky bottom-0">
              {!isReadOnly && (
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
                  {mode === "create" ? "Create" : "Save"}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                {isReadOnly ? "Close" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
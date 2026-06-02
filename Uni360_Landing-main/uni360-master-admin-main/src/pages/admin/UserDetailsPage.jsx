import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { getUserById } from "../../services/userService";
import documentService from "../../services/documentService";
import { toast } from "react-hot-toast";

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "VERIFIED":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Unknown";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
        status
      )}`}>
      {displayStatus}
    </span>
  );
};

// Document Status Badge Component
const DocumentStatusBadge = ({ status, verificationStatus }) => {
  const statusInfo = documentService.getStatusInfo(verificationStatus, status);

  const colorClasses = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${
        colorClasses[statusInfo.color]
      }`}>
      {statusInfo.label}
    </span>
  );
};

// Toast Notification Component
const Toast = ({ toast, onRemove }) => {
  const getToastColors = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case "warning":
        return <ClockIcon className="h-5 w-5 text-yellow-400" />;
      case "info":
      default:
        return <CheckCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`max-w-sm w-full ${getToastColors(
        toast.type
      )} border rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon(toast.type)}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">{toast.title}</p>
            <p className="mt-1 text-sm">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => onRemove(toast.id)}>
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const UserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    pending: 0,
    reupload: 0,
    verified: 0,
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchDocuments();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await getUserById(userId);
      if (response.success) {
        setUser(response.data);
      } else {
        showToast("error", "Error", response.error || "Failed to fetch user details");
      }
    } catch (error) {
      showToast("error", "Error", "An error occurred while fetching user details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await documentService.fetchUserDocuments(userId);
      const transformedData = documentService.transformApiResponse(response);

      setDocuments(transformedData.allDocuments);
      setDocumentStats(transformedData.stats);
    } catch (error) {
      showToast("error", "Error", error.message || "Failed to fetch documents");
    }
  };

  const showToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleDownload = (doc) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
    } else {
      showToast("error", "Error", "Document URL not available");
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case "STUDENT":
        return <AcademicCapIcon className="h-6 w-6 text-blue-500" />;
      case "ADMIN":
        return <ShieldCheckIcon className="h-6 w-6 text-green-500" />;
      case "SUPER_ADMIN":
        return <UsersIcon className="h-6 w-6 text-primary-500" />;
      default:
        return <UserIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">User not found</h3>
          <button
            onClick={() => navigate("/dashboard/users")}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-400 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => navigate("/dashboard/users")}
              className="flex items-center gap-2 text-white hover:text-gray-200 mb-6 transition">
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Users
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-2xl font-bold">
                  {user.firstName?.charAt(0)}
                  {user.lastName?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    {getUserTypeIcon(user.userType)}
                    <span className="text-sm capitalize">
                      {user.userType?.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mt-1">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <StatusBadge status={user.status} />
                {user.emailVerified ? (
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircleIcon className="h-4 w-4" />
                    Email Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Email Not Verified
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {documentStats.total}
                  </p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-primary-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {documentStats.verified}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {documentStats.pending}
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reupload</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {documentStats.reupload}
                  </p>
                </div>
                <ExclamationCircleIcon className="h-10 w-10 text-red-500" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { id: "overview", label: "Overview", icon: UserIcon },
                  { id: "documents", label: "Documents", icon: DocumentTextIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition ${
                      activeTab === tab.id
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}>
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">First Name</p>
                          <p className="mt-1 text-gray-900">{user.firstName || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Last Name</p>
                          <p className="mt-1 text-gray-900">{user.lastName || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="mt-1 text-gray-900">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone Number</p>
                          <p className="mt-1 text-gray-900">{user.phoneNumber || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Username</p>
                          <p className="mt-1 text-gray-900">{user.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        {getUserTypeIcon(user.userType)}
                        <div>
                          <p className="text-sm font-medium text-gray-500">User Type</p>
                          <p className="mt-1 text-gray-900 capitalize">
                            {user.userType?.replace("_", " ").toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        {user.emailVerified ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email Verified</p>
                          <p className="mt-1 text-gray-900">
                            {user.emailVerified ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Registration Date</p>
                          <p className="mt-1 text-gray-900">
                            {user.registrationDaysAgo} days ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <div className="mt-1">
                            <StatusBadge status={user.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "documents" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}>
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                      <p className="text-gray-500">This user hasn't uploaded any documents yet</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile View */}
                      <div className="block lg:hidden space-y-4">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <DocumentTextIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {doc.fileName || doc.documentType}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {doc.category || doc.documentType}
                                  </p>
                                </div>
                              </div>
                              <DocumentStatusBadge
                                status={doc.status}
                                verificationStatus={doc.verificationStatus}
                              />
                            </div>
                            <div className="text-sm space-y-2 mb-3">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Uploaded:</span>
                                <span className="text-gray-900">
                                  {documentService.formatDate(doc.uploadedAt)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Size:</span>
                                <span className="text-gray-900">{doc.size}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Type:</span>
                                <span className="text-gray-900">{doc.fileType?.toUpperCase()}</span>
                              </div>
                            </div>
                            {doc.notes && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                                <p className="text-xs text-yellow-800">
                                  <strong>Notes:</strong> {doc.notes}
                                </p>
                              </div>
                            )}
                            <button
                              onClick={() => handleDownload(doc)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                              <DocumentArrowDownIcon className="h-4 w-4" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Document
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Upload Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Size
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {doc.fileName || doc.documentType}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {doc.fileType?.toUpperCase()}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {doc.category || doc.documentType}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <DocumentStatusBadge
                                    status={doc.status}
                                    verificationStatus={doc.verificationStatus}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {documentService.formatDate(doc.uploadedAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {doc.size}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    className="text-primary-600 hover:text-primary-900">
                                    <DocumentArrowDownIcon className="h-5 w-5 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsPage;
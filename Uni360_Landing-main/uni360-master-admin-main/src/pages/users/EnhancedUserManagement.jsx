import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { getAllUsers, deleteUser, getUserById, getStudentProfile } from "../../services/userService";
import documentService from "../../services/documentService";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayStatus = status ?
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() :
    "Unknown";

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
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
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[statusInfo.color]}`}>
      {statusInfo.label}
    </span>
  );
};

// Documents Modal Component
const DocumentsModal = ({ user, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, reupload: 0, verified: 0 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchDocuments();
    }
  }, [user?.id, isOpen]);

  useEffect(() => {
    if (documents.length > 0) {
      const filtered = documentService.getDocumentsByCategory(documents, activeFilter);
      setFilteredDocuments(filtered);
    }
  }, [activeFilter, documents]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentService.fetchUserDocuments(user.id);
      const transformedData = documentService.transformApiResponse(response);

      setDocuments(transformedData.allDocuments);
      setStats(transformedData.stats);
      setFilteredDocuments(transformedData.allDocuments);

      toast.success(`Loaded ${transformedData.stats.total} documents`);
    } catch (error) {
      toast.error(error.message || "Failed to fetch documents");
      setDocuments([]);
      setStats({ total: 0, pending: 0, reupload: 0, verified: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (doc) => {
    const documentId = doc.uploadId || doc.id;
    if (!documentId) {
      toast.error("Document ID not available");
      return;
    }
    setViewerDoc(doc);
    setViewerLoading(true);
    setViewerUrl(null);
    try {
      const response = await import('../../services/api').then(m => m.default.get(`/api/v1/documents/${documentId}/view-url`));
      if (response.data?.view_url) {
        setViewerUrl(response.data.view_url);
      } else {
        toast.error("Failed to get document view URL");
        setViewerDoc(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load document");
      setViewerDoc(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerDoc(null);
    setViewerUrl(null);
    setViewerLoading(false);
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      {/* Document Viewer Popup */}
      {(viewerDoc) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeViewer}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <DocumentTextIcon className="h-5 w-5 text-primary-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{viewerDoc.fileName || viewerDoc.documentType}</p>
                  <p className="text-xs text-gray-400">{viewerDoc.fileType?.toUpperCase()} · {viewerDoc.documentType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {viewerUrl && (
                  <a
                    href={viewerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 rounded-lg transition">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    Open in Tab
                  </a>
                )}
                <button
                  onClick={closeViewer}
                  className="p-1.5 hover:bg-white hover:bg-opacity-10 rounded-lg transition">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Viewer Body */}
            <div className="flex-1 bg-gray-100 overflow-hidden">
              {viewerLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                  <p className="text-gray-600 text-sm">Loading document...</p>
                </div>
              ) : viewerUrl ? (
                viewerDoc.fileType?.toUpperCase() === 'PDF' ? (
                  <iframe
                    src={viewerUrl}
                    className="w-full h-full border-0"
                    title={viewerDoc.fileName || viewerDoc.documentType}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={viewerUrl}
                      alt={viewerDoc.fileName || viewerDoc.documentType}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                  <ExclamationCircleIcon className="h-12 w-12 text-red-400" />
                  <p className="text-sm">Unable to load document</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative min-h-screen flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-6 text-white" style={{ backgroundColor: 'hsl(195, 20%, 19%)' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Documents</h2>
                    <p className="text-sm opacity-90 mt-1">{user.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm opacity-90">Total</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="text-2xl font-bold">{stats.verified}</div>
                  <div className="text-sm opacity-90">Verified</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-sm opacity-90">Pending</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <div className="text-2xl font-bold">{stats.reupload}</div>
                  <div className="text-sm opacity-90">Reupload</div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All Documents", count: stats.total },
                  { key: "verified", label: "Verified", count: stats.verified },
                  { key: "pending", label: "Pending", count: stats.pending },
                  { key: "reupload", label: "Reupload Required", count: stats.reupload },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeFilter === filter.key
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}>
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading documents...</p>
                  </div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                  <p className="text-gray-500">
                    {activeFilter === "all"
                      ? "This user hasn't uploaded any documents yet"
                      : `No ${activeFilter} documents available`}
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Desktop View */}
                  <div className="hidden lg:block">
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
                            Uploaded
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
                        {filteredDocuments.map((doc) => (
                          <motion.tr
                            key={doc.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {doc.category || doc.documentType}
                              </span>
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
                                onClick={() => handleView(doc)}
                                className="text-primary-600 hover:text-primary-900 transition"
                                title="View Document">
                                <EyeIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="lg:hidden space-y-4">
                    {filteredDocuments.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
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
                          onClick={() => handleView(doc)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                          <EyeIcon className="h-4 w-4" />
                          View Document
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, isOpen, onClose, onEdit }) => {
  const [userDetails, setUserDetails] = useState(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserDetails(user.id);
    }
  }, [user?.id, isOpen]);

  const fetchUserDetails = async (userId) => {
    setLoading(true);
    try {
      const response = await getUserById(userId);
      if (response.success) {
        setUserDetails(response.data);
      } else {
        toast.error(response.error || "Failed to fetch user details");
        setUserDetails(user);
      }
    } catch (error) {
      toast.error("An error occurred while fetching user details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userDetails) return null;

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case "STUDENT":
        return <AcademicCapIcon className="h-5 w-5 text-blue-500" />;
      case "ADMIN":
        return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
      case "SUPER_ADMIN":
        return <UsersIcon className="h-5 w-5 text-primary-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative min-h-screen flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 text-white" style={{ backgroundColor: 'hsl(195, 20%, 19%)' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-xl font-bold">
                    {userDetails.firstName?.charAt(0)}{userDetails.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{userDetails.fullName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getUserTypeIcon(userDetails.userType)}
                      <span className="text-sm capitalize">
                        {userDetails.userType?.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {/* Content */}
                <div className="px-6 py-8 space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          First Name
                        </label>
                        <p className="mt-1 text-gray-900">{userDetails.firstName || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Last Name
                        </label>
                        <p className="mt-1 text-gray-900">{userDetails.lastName || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Email
                        </label>
                        <p className="mt-1 text-gray-900">{userDetails.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Phone Number
                        </label>
                        <p className="mt-1 text-gray-900">
                          {userDetails.phoneNumber || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Username
                        </label>
                        <p className="mt-1 text-gray-900">{userDetails.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          User ID
                        </label>
                        <p className="mt-1 text-gray-900">{userDetails.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Status
                        </label>
                        <div className="mt-1">
                          <StatusBadge status={userDetails.status} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          User Type
                        </label>
                        <p className="mt-1 text-gray-900 capitalize">
                          {userDetails.userType?.replace('_', ' ').toLowerCase()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Email Verified
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          {userDetails.emailVerified ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              <span className="text-green-700">Yes</span>
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                              <span className="text-yellow-700">No</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Phone Verified
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          {userDetails.phoneVerified ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              <span className="text-green-700">Yes</span>
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                              <span className="text-yellow-700">No</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          OAuth Provider
                        </label>
                        <p className="mt-1 text-gray-900">
                          {userDetails.oauthProviderCode || "LOCAL"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Is Active
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          {userDetails.isActive ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              <span className="text-green-700">Yes</span>
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                              <span className="text-yellow-700">No</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Created At
                        </label>
                        <p className="mt-1 text-gray-900 text-sm">
                          {new Date(userDetails.createdAt).toLocaleDateString()} at{" "}
                          {new Date(userDetails.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Last Updated
                        </label>
                        <p className="mt-1 text-gray-900 text-sm">
                          {new Date(userDetails.updatedAt).toLocaleDateString()} at{" "}
                          {new Date(userDetails.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information (for Students) */}
                  {userDetails.userType === "STUDENT" && userDetails.profileId && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Profile Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Profile ID
                          </label>
                          <p className="mt-1 text-gray-900 text-sm font-mono">
                            {userDetails.profileId}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Profile Status
                          </label>
                          <p className="mt-1 text-gray-900 capitalize">
                            {userDetails.profileStatus || "-"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Completion Percentage
                          </label>
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{
                                  width: `${userDetails.profileCompletionPercentage || 0
                                    }%`,
                                }}></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {userDetails.profileCompletionPercentage || 0}%
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Profile Verified
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            {userDetails.isProfileVerified ? (
                              <>
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                <span className="text-green-700">Yes</span>
                              </>
                            ) : (
                              <>
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                <span className="text-yellow-700">No</span>
                              </>
                            )}
                          </div>
                        </div>
                        {userDetails.workflowStage && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Workflow Stage
                            </label>
                            <p className="mt-1 text-gray-900">
                              {userDetails.workflowStage?.replace(/_/g, ' ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents (for Students) */}
                  {userDetails.userType === "STUDENT" && userDetails.totalDocuments !== undefined && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Documents
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Total Documents</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {userDetails.totalDocuments || 0}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Verified Documents</p>
                          <p className="text-2xl font-bold text-green-600">
                            {userDetails.verifiedDocuments || 0}
                          </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Pending Documents</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {userDetails.pendingDocuments || 0}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Rejected Documents</p>
                          <p className="text-2xl font-bold text-red-600">
                            {userDetails.rejectedDocuments || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Close
              </button>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Student Profile Modal Component
const StudentProfileModal = ({ user, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchProfile();
    }
    return () => { setProfile(null); };
  }, [user?.id, isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getStudentProfile(user.id);
      if (response.success) {
        setProfile(response.data);
      } else {
        toast.error(response.error || "Failed to fetch student profile");
      }
    } catch (error) {
      toast.error("An error occurred while fetching student profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const formatLabel = (key) => key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

  // Format raw API values into human-readable text
  const formatValue = (val) => {
    if (val === null || val === undefined || val === "") return null;
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val.toLocaleString();
    const s = String(val);
    // Number range like "10000_20000"
    if (/^\d+_\d+$/.test(s)) {
      const [a, b] = s.split("_");
      return `${Number(a).toLocaleString()} – ${Number(b).toLocaleString()}`;
    }
    // Snake_case identifier like "self_funded", "work_in_study_country"
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(s)) {
      return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    return s;
  };

  const renderKeyValue = (label, value) => {
    if (value === null || value === undefined || value === "") return null;
    let display;
    if (typeof value === "boolean") {
      display = value
        ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircleIcon className="h-4 w-4" /> Yes</span>
        : <span className="inline-flex items-center gap-1 text-red-500"><XMarkIcon className="h-4 w-4" /> No</span>;
    } else {
      display = formatValue(value);
    }
    return (
      <div key={label} className="py-1.5">
        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 break-words">{display}</p>
      </div>
    );
  };

  // Extract data from actual API shape
  const data = profile || {};
  const userInfo = data.userInfo || {};
  const profileData = data.profileData || {};
  const overview = data.overview?.overview || {};
  const stepsStatus = data.overview?.stepsStatus || [];
  const progress = data.overview?.progress || {};
  const documents = profileData.documents || {};
  const workflowFlags = profileData.workflow_flags || {};
  const basicInfo = profileData.basic_info || {};
  const education = profileData.education || {};
  const testScores = profileData.test_scores || {};
  const preferences = profileData.preferences || {};
  const experience = profileData.experience || {};
  const financial = profileData.financial || {};
  const goals = profileData.goals || {};
  const testingCompliance = profileData.testing_compliance || {};

  const completionPct = overview.completionPercentage || 0;

  // Collect non-empty profile data sections
  const renderProfileSection = (title, obj) => {
    const entries = Object.entries(obj).filter(([, v]) => {
      if (v === null || v === undefined || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return false;
      return true;
    });
    if (entries.length === 0) return null;

    // Separate: primitives, arrays of primitives, arrays of objects, nested objects
    const simpleEntries = entries.filter(([, v]) => typeof v !== "object");
    const stringArrayEntries = entries.filter(([, v]) => Array.isArray(v) && v.length > 0 && typeof v[0] !== "object");
    const objectArrayEntries = entries.filter(([, v]) => Array.isArray(v) && v.length > 0 && typeof v[0] === "object");
    const objectEntries = entries.filter(([, v]) => typeof v === "object" && !Array.isArray(v));

    return (
      <div className="border-t border-gray-100 pt-5 mt-5">
        <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">{title}</h3>

        {/* Simple key-value pairs */}
        {simpleEntries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
            {simpleEntries.map(([k, v]) => renderKeyValue(formatLabel(k), v))}
          </div>
        )}

        {/* Arrays of strings rendered as tags */}
        {stringArrayEntries.map(([k, v]) => (
          <div key={k} className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">{formatLabel(k)}</p>
            <div className="flex flex-wrap gap-2">
              {v.map((item, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                  {formatValue(item)}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Arrays of objects rendered as cards */}
        {objectArrayEntries.map(([k, v]) => (
          <div key={k} className="mt-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">{formatLabel(k)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {v.map((item, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(item).filter(([, iv]) => iv !== null && iv !== undefined && iv !== "").map(([ik, iv]) => (
                      <div key={ik}>
                        <p className="text-xs text-gray-500">{formatLabel(ik)}</p>
                        <p className="text-sm font-medium text-gray-900">{typeof iv === "boolean" ? (iv ? "Yes" : "No") : formatValue(iv)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Nested objects */}
        {objectEntries.map(([k, v]) => {
          const nestedEntries = Object.entries(v).filter(([, nv]) => nv !== null && nv !== undefined && nv !== "");
          if (nestedEntries.length === 0) return null;
          return (
            <div key={k} className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">{formatLabel(k)}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {nestedEntries.map(([nk, nv]) => (
                  <div key={nk}>
                    <p className="text-xs text-gray-500">{formatLabel(nk)}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {typeof nv === "boolean" ? (nv ? "Yes" : "No") :
                        Array.isArray(nv) ? nv.map(formatValue).join(", ") :
                          typeof nv === "object" ? Object.entries(nv).map(([ok, ov]) => `${formatLabel(ok)}: ${formatValue(ov)}`).join(", ") :
                            formatValue(nv)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
        onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative min-h-screen flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">

            {/* ── Header ── */}
            <div className="px-6 py-6 text-white" style={{ backgroundColor: 'hsl(195, 20%, 19%)' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    {/* Completion ring */}
                    <svg className="absolute -inset-1 h-[4rem] w-[4rem]" viewBox="0 0 36 36">
                      <path className="text-white/20" stroke="currentColor" strokeWidth="2.5" fill="none"
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" />
                      <path className="text-white" stroke="currentColor" strokeWidth="2.5" fill="none"
                        strokeDasharray={`${completionPct}, 100`} strokeLinecap="round"
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{userInfo.fullName || user.fullName}</h2>
                    <div className="flex items-center flex-wrap gap-2 mt-1 text-sm opacity-90">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>{userInfo.email}</span>
                      <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs">ID: {data.userId}</span>
                      <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs capitalize">{userInfo.status?.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Profile Builder Progress */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">Profile Builder</span>
                  <span className="text-sm font-bold">{completionPct}%</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-xs opacity-80 mt-1.5">{overview.completedSteps || 0} of {overview.totalSteps || 0} stages completed</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Loading student profile...</p>
                </div>
              </div>
            ) : !profile ? (
              <div className="text-center py-16">
                <ExclamationCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No profile data available</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto px-6 py-6 space-y-0">

                {/* ── User Info ── */}
                <div>
                  <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">User Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                    {renderKeyValue("Full Name", userInfo.fullName)}
                    {renderKeyValue("Email", userInfo.email)}
                    {renderKeyValue("Phone", userInfo.phoneNumber)}
                    {renderKeyValue("User Type", userInfo.userType)}
                    {renderKeyValue("Status", userInfo.status)}
                    {renderKeyValue("User ID", data.userId)}
                  </div>
                </div>



                {/* ── Profile Data Sections ── */}
                {renderProfileSection("Basic Information", basicInfo)}
                {renderProfileSection("Education", education)}
                {renderProfileSection("Test Scores", testScores)}
                {renderProfileSection("Preferences", preferences)}
                {renderProfileSection("Work Experience", experience)}
                {renderProfileSection("Financial Information", financial)}
                {renderProfileSection("Career Goals", goals)}
                {renderProfileSection("Compliance & Consent", testingCompliance)}


              </div>
            )}

            {/* Footer */}
            <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const EnhancedUserManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    page: 0,
    size: 20,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);

  const tabs = [
    {
      id: "all",
      name: "All Users",
      icon: UserGroupIcon,
      userType: null,
    },
    {
      id: "students",
      name: "Students",
      icon: AcademicCapIcon,
      userType: "STUDENT",
    },
    {
      id: "admins",
      name: "Admins",
      icon: ShieldCheckIcon,
      userType: "ADMIN",
    },
    {
      id: "superAdmins",
      name: "Super Admins",
      icon: ShieldCheckIcon,
      userType: "SUPER_ADMIN",
    },
  ];

  // Fetch users whenever filters or tab changes
  useEffect(() => {
    fetchUsers();
  }, [activeTab, filters.status, filters.page]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters.search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const currentTab = tabs.find(tab => tab.id === activeTab);
      const params = {
        page: filters.page,
        size: filters.size,
        status: filters.status || undefined,
        search: filters.search || undefined,
        userType: currentTab?.userType || undefined,
      };
      const response = await getAllUsers(params);
      if (response.success) {
        // Set users from the response
        setUsers(response.data.users || []);

        // Set summary for the stats cards
        setSummary(response.data.summary || null);

        // Set pagination
        setPagination(response.data.pagination || {
          currentPage: 0,
          pageSize: 20,
          totalPages: 0,
          totalElements: 0,
          hasNext: false,
          hasPrevious: false,
        });
      } else {
        toast.error(response.error || "Failed to fetch users");
        setUsers([]);
      }
    } catch (error) {
      toast.error("An error occurred while fetching users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 0 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 0 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleCreateUser = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    const userType = currentTab?.userType || "STUDENT";
    navigate(`/users/create?type=${userType}`);
  };

  const handleEditUser = (userId) => {
    navigate(`/users/edit/${userId}`);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await deleteUser(userId);
        if (response.success) {
          toast.success("User deleted successfully");
          fetchUsers(); // Refresh the list
        } else {
          toast.error(response.error || "Failed to delete user");
        }
      } catch (error) {
        toast.error("An error occurred while deleting user");
      }
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    if (user.userType === "STUDENT") {
      setShowStudentProfileModal(true);
    } else {
      setShowUserModal(true);
    }
  };

  const handleViewDocuments = (user) => {
    setSelectedUser(user);
    setShowDocumentsModal(true);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFilters({ ...filters, page: 0 }); // Reset to first page on tab change
  };

  const exportToExcel = () => {
    const rows = users.map((u) => ({
      "Full Name": u.fullName || "",
      "Email": u.email || "",
      "User Type": u.userType?.replace("_", " ") || "",
      "Status": u.status || "",
      "Phone": u.phoneNumber || "",
      "Email Verified": u.emailVerified ? "Yes" : "No",
      "Registered": u.registrationDaysAgo != null ? `${u.registrationDaysAgo} days ago` : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getTabCount = (tabId) => {
    if (!summary) return 0;

    switch (tabId) {
      case "all":
        return summary.totalUsers || 0;
      case "students":
        return summary.totalStudents || 0;
      case "admins":
        return summary.totalAdmins || 0;
      case "superAdmins":
        return summary.totalSuperAdmins || 0;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent h-40 mt-3 shadow-sm md:h-auto md:pb-10 md:bg-white md:border-b md:border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row md:flex-row items-end justify-between gap-4 h-16">
            <div className="mr-2">
              <h1 className="text-3xl font-bold text-gray-900 text-left">
                User Management
              </h1>
              <p className="text-sm text-gray-500 text-left">
                Manage students, admins, and partners
              </p>
            </div>
            <button
              onClick={exportToExcel}
              disabled={users.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition disabled:opacity-50 self-end">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg shadow p-6 border-l-4 border-primary hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {summary.totalUsers}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-full p-3 ml-4">
                  <UserGroupIcon className="h-7 w-7 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6 border-l-4 border-secondary-dark hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Students</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {summary.totalStudents}
                  </p>
                </div>
                <div className="bg-secondary/40 rounded-full p-3 ml-4">
                  <AcademicCapIcon className="h-7 w-7 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6 border-l-4 border-primary-light hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Admins</p>
                  <p className="text-3xl font-bold text-primary-dark mt-2">
                    {summary.totalAdmins}
                  </p>
                </div>
                <div className="bg-primary-light/20 rounded-full p-3 ml-4">
                  <ShieldCheckIcon className="h-7 w-7 text-primary-dark" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow p-6 border-l-4 border-secondary hover:shadow-lg transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Super Admins</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {summary.totalSuperAdmins}
                  </p>
                </div>
                <div className="bg-secondary-light/60 rounded-full p-3 ml-4">
                  <UsersIcon className="h-7 w-7 text-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition ${isActive
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}>
                    <TabIcon className="h-5 w-5 mr-2" />
                    {tab.name}
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${isActive
                        ? "bg-primary-100 text-primary-700"
                        : "bg-gray-100 text-gray-700"
                        }`}>
                      {getTabCount(tab.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                <p className="text-gray-500">Try adjusting your filters or search criteria</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-bold text-sm">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.userType === "STUDENT" && (
                            <AcademicCapIcon className="h-5 w-5 text-blue-500 mr-2" />
                          )}
                          {user.userType === "ADMIN" && (
                            <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                          )}
                          {user.userType === "SUPER_ADMIN" && (
                            <UsersIcon className="h-5 w-5 text-primary-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-900 capitalize">
                            {user.userType?.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phoneNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.registrationDaysAgo} days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-primary-600 hover:text-primary-900 transition"
                            title="View User">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {user.userType === "STUDENT" && (
                            <button
                              onClick={() => handleViewDocuments(user)}
                              className="text-primary-600 hover:text-primary-900 transition"
                              title="View Documents">
                              <DocumentTextIcon className="h-4 w-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevious}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{pagination.currentPage * pagination.pageSize + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.totalElements}</span> results
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Page <span className="font-medium">{pagination.currentPage + 1}</span> of{" "}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevious}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i;
                      } else if (pagination.currentPage < 3) {
                        pageNum = i;
                      } else if (pagination.currentPage > pagination.totalPages - 4) {
                        pageNum = pagination.totalPages - 5 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.currentPage === pageNum
                            ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}>
                          {pageNum + 1}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onEdit={handleEditUser}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        user={selectedUser}
        isOpen={showStudentProfileModal}
        onClose={() => setShowStudentProfileModal(false)}
      />

      {/* Documents Modal */}
      <DocumentsModal
        user={selectedUser}
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
      />
    </div>
  );
};

export default EnhancedUserManagement;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// DocumentModal Component
const DocumentModal = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case "application":
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case "transcript":
        return <AcademicCapIcon className="h-5 w-5 text-green-500" />;
      case "statement":
        return <DocumentTextIcon className="h-5 w-5 text-primary-500" />;
      case "financial":
        return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />;
      case "letter":
        return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
      case "identity":
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status, reason = null) => {
    if (status === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending Review
        </span>
      );
    }
    if (status === "reupload_required") {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Reupload Required
          </span>
          {reason && <p className="text-xs text-red-600 mt-1">{reason}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}></div>

        {/* Full-screen on mobile, standard dialog on desktop */}
        <div className="inline-block align-bottom bg-white text-left shadow-xl transform transition-all w-full h-full sm:h-auto sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:rounded-lg overflow-hidden">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex items-center">
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={student.profilePhoto}
                  alt={student.name}
                />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  <p className="text-sm text-gray-500">{student.university}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="self-end sm:self-auto text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
              {/* Make doc tiles edge-to-edge on small screens without affecting desktop */}
              <div className="space-y-3 -mx-4 sm:mx-0">
                {student.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-none sm:rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        {getDocumentTypeIcon(doc.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.size} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start sm:items-center sm:justify-end gap-2 flex-wrap">
                        {getStatusBadge(doc.status, doc.reason)}
                        <div className="flex space-x-1">
                          <button className="p-1 text-primary-600 hover:text-primary-800" aria-label="Preview Document">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-800" aria-label="Download Document">
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse gap-3 sm:flex-row-reverse">
            <button
              onClick={() => window.open(`/users/student/${student.id}`, "_blank")}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
              View Full Profile
            </button>
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Sample student data with document statuses
  const studentsData = {
    pending: [
      {
        id: 1,
        name: "John Smith",
        email: "john.smith@email.com",
        country: "UK",
        university: "Harvard University",
        profilePhoto:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        documents: [
          {
            id: 1,
            name: "Application_Form.pdf",
            type: "application",
            size: "2.4 MB",
            uploadDate: "2025-08-27",
            status: "pending",
          },
          {
            id: 2,
            name: "Transcript.pdf",
            type: "transcript",
            size: "1.8 MB",
            uploadDate: "2025-08-26",
            status: "pending",
          },
        ],
        totalDocuments: 2,
        pendingDocuments: 2,
        lastUpdate: "2025-08-27",
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        country: "Germany",
        university: "MIT",
        profilePhoto:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        documents: [
          {
            id: 3,
            name: "Personal_Statement.pdf",
            type: "statement",
            size: "856 KB",
            uploadDate: "2025-08-25",
            status: "pending",
          },
        ],
        totalDocuments: 1,
        pendingDocuments: 1,
        lastUpdate: "2025-08-25",
      },
    ],
    reupload: [
      {
        id: 3,
        name: "Mike Wilson",
        email: "mike.wilson@email.com",
        country: "Germany",
        university: "Stanford University",
        profilePhoto:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        documents: [
          {
            id: 4,
            name: "Financial_Statement.pdf",
            type: "financial",
            size: "1.2 MB",
            uploadDate: "2025-08-20",
            status: "reupload_required",
            reason: "Document quality is too low",
          },
          {
            id: 5,
            name: "Recommendation_Letter.pdf",
            type: "letter",
            size: "945 KB",
            uploadDate: "2025-08-19",
            status: "reupload_required",
            reason: "Missing signature",
          },
        ],
        totalDocuments: 2,
        reuploadDocuments: 2,
        lastUpdate: "2025-08-20",
      },
      {
        id: 4,
        name: "Emily Brown",
        email: "emily.brown@email.com",
        country: "UK",
        university: "Yale University",
        profilePhoto:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        documents: [
          {
            id: 6,
            name: "Passport_Copy.pdf",
            type: "identity",
            size: "2.1 MB",
            uploadDate: "2025-08-22",
            status: "reupload_required",
            reason: "Expired document",
          },
        ],
        totalDocuments: 1,
        reuploadDocuments: 1,
        lastUpdate: "2025-08-22",
      },
    ],
  };

  const tabs = [
    {
      id: "pending",
      name: "Pending Documents",
      icon: ClockIcon,
      count: studentsData.pending.length,
    },
    {
      id: "reupload",
      name: "Reupload Required",
      icon: ExclamationTriangleIcon,
      count: studentsData.reupload.length,
    },
  ];

  const getCurrentStudents = () => {
    return studentsData[activeTab] || [];
  };

  const getFilteredStudents = () => {
    const currentStudents = getCurrentStudents();
    return currentStudents.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.university.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry =
        selectedCountry === "all" || student.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  };

  const getTotalStats = () => {
    return {
      total: studentsData.pending.length + studentsData.reupload.length,
      pending: studentsData.pending.length,
      reupload: studentsData.reupload.length,
      totalDocuments: [
        ...studentsData.pending,
        ...studentsData.reupload,
      ].reduce((sum, student) => sum + student.totalDocuments, 0),
    };
  };

  const stats = getTotalStats();
  const filteredStudents = getFilteredStudents();

  // Navigation functions
  const handleViewStudent = (studentId) => {
    navigate(`/users/student/${studentId}`);
  };

  const handleViewDocuments = (student) => {
    setSelectedStudent(student);
    setShowDocumentModal(true);
  };

  const handleDownloadDocuments = (student) => {
    // Mock implementation - in real app, this would download all documents
    // You can implement actual download logic here
  };

  const handleEditStudent = (studentId) => {
    // Navigate to edit mode or open edit modal
    navigate(`/users/student/${studentId}?mode=edit`);
  };

  const handleDeleteStudent = (studentId, studentName) => {
    // Mock implementation - in real app, this would show confirmation dialog
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      // You can implement actual delete logic here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:h-16 py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Document Management</h1>
              <p className="text-sm text-gray-500">Manage student documents requiring review or reupload</p>
            </div>
            <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Reupload Required</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reupload}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 px-3 sm:py-4 sm:px-6 border-b-2 font-semibold text-sm flex items-center transition-all duration-200 rounded-t-lg whitespace-nowrap min-w-0 ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-700 bg-gradient-to-b from-indigo-50 to-white shadow-md transform scale-105 z-10"
                      : "border-transparent text-gray-600 hover:text-primary-600 hover:bg-gray-50 hover:border-gray-300 hover:transform hover:scale-102"
                  }`}>
                  <Icon
                    className={`h-5 w-5 mr-2 flex-shrink-0 ${
                      activeTab === tab.id ? "text-primary-600" : "text-gray-500"
                    }`}
                  />
                  <span className="hidden sm:inline truncate">{tab.name}</span>
                  <span className="sm:hidden truncate">{tab.name.split(" ")[0]}</span>
                  <span
                    className={`ml-2 px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-indigo-2 00 text-primary-900 shadow-sm ring-1 ring-indigo-300"
                        : "bg-gray-200 text-gray-700"
                    }`}>
                    {tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-t origin-left shadow-sm"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search students or universities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center w-full sm:w-auto">
              <select
                className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}>
                <option value="all">All Countries</option>
                <option value="UK">UK</option>
                <option value="Germany">Germany</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Display */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div>
            {/* Desktop table view (unchanged) */}
            <div className="hidden md:block bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === "pending" ? "Pending Docs" : "Reupload Docs"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={student.profilePhoto}
                                alt={student.name}
                              />
                            </div>
                            <div className="ml-4">
                              <button
                                className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors cursor-pointer text-left"
                                onClick={() => handleViewStudent(student.id)}>
                                {student.name}
                              </button>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.university}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              activeTab === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {activeTab === "pending" ? student.pendingDocuments : student.reuploadDocuments} {" "}
                            documents
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(student.lastUpdate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                              onClick={() => handleViewDocuments(student)}
                              title="View Documents">
                              <FolderIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                              onClick={() => handleViewStudent(student.id)}
                              title="View Student Profile">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              onClick={() => handleDownloadDocuments(student)}
                              title="Download Documents">
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                              onClick={() => handleEditStudent(student.id)}
                              title="Edit Student">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              title="Delete Student">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card view (full-bleed) */}
            <div
              className="md:hidden -mx-4 sm:mx-0 space-y-3 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]"
            >
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  className="bg-white shadow rounded-none sm:rounded-lg p-4">
                  <div className="flex items-center">
                    <img
                      src={student.profilePhoto}
                      alt={student.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <button
                        className="text-sm font-semibold text-gray-900 hover:text-primary-600 text-left"
                        onClick={() => handleViewStudent(student.id)}>
                        {student.name}
                      </button>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">University</p>
                      <p className="text-sm text-gray-900">{student.university}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">Country</p>
                      <p className="text-sm text-gray-900">{student.country}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">
                        {activeTab === "pending" ? "Pending Docs" : "Reupload Docs"}
                      </p>
                      <span
                        className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          activeTab === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {activeTab === "pending" ? student.pendingDocuments : student.reuploadDocuments} documents
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">Last Update</p>
                      <p className="text-sm text-gray-900">{new Date(student.lastUpdate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      className="flex-1 min-w-[46%] text-primary-600 hover:text-primary-900 py-2 px-3 rounded-md border border-indigo-100 hover:bg-primary-50"
                      onClick={() => handleViewDocuments(student)}
                      title="View Documents">
                      <span className="inline-flex items-center justify-center w-full">
                        <FolderIcon className="h-4 w-4 mr-2" /> Documents
                      </span>
                    </button>
                    <button
                      className="flex-1 min-w-[46%] text-primary-600 hover:text-primary-900 py-2 px-3 rounded-md border border-primary-100 hover:bg-primary-50"
                      onClick={() => handleViewStudent(student.id)}
                      title="View Student Profile">
                      <span className="inline-flex items-center justify-center w-full">
                        <EyeIcon className="h-4 w-4 mr-2" /> Profile
                      </span>
                    </button>
                    <button
                      className="flex-1 min-w-[46%] text-green-600 hover:text-green-900 py-2 px-3 rounded-md border border-green-100 hover:bg-green-50"
                      onClick={() => handleDownloadDocuments(student)}
                      title="Download Documents">
                      <span className="inline-flex items-center justify-center w-full">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Download
                      </span>
                    </button>
                    <button
                      className="flex-1 min-w-[46%] text-gray-700 hover:text-gray-900 py-2 px-3 rounded-md border border-gray-200 hover:bg-gray-50"
                      onClick={() => handleEditStudent(student.id)}
                      title="Edit Student">
                      <span className="inline-flex items-center justify-center w-full">
                        <PencilIcon className="h-4 w-4 mr-2" /> Edit
                      </span>
                    </button>
                    <button
                      className="w-full text-red-600 hover:text-red-900 py-2 px-3 rounded-md border border-red-100 hover:bg-red-50"
                      onClick={() => handleDeleteStudent(student.id, student.name)}
                      title="Delete Student">
                      <span className="inline-flex items-center justify-center w-full">
                        <TrashIcon className="h-4 w-4 mr-2" /> Delete
                      </span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Modal */}
      <DocumentModal
        student={selectedStudent}
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
      />
    </div>
  );
};

export default DocumentManagement;

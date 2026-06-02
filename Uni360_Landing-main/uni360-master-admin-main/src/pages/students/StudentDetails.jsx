import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Mock student data
const mockStudentData = {
  id: 1,
  personalInfo: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+44 7700 900123",
    dateOfBirth: "1995-05-15",
    nationality: "British",
    address: {
      street: "123 Oxford Street",
      city: "London",
      state: "England",
      zipCode: "W1C 1DE",
      country: "United Kingdom",
    },
    profilePhoto:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
  },
  academicInfo: {
    currentEducation: "Bachelor's in Computer Science",
    institution: "University of London",
    gpa: "3.8/4.0",
    graduationYear: "2024",
    englishProficiency: {
      test: "IELTS",
      score: "7.5",
      date: "2023-08-15",
    },
  },
  applications: [
    {
      id: 1,
      university: "University of Manchester",
      program: "Computer Science MSc",
      status: "approved",
      dateSubmitted: "2024-01-15",
      documents: ["transcript", "sop", "resume", "ielts"],
    },
    {
      id: 2,
      university: "Imperial College London",
      program: "Data Science MSc",
      status: "pending",
      dateSubmitted: "2024-01-20",
      documents: ["transcript", "sop", "resume"],
    },
  ],
  documents: [
    {
      id: 1,
      name: "Academic Transcript",
      type: "transcript",
      status: "verified",
      uploadDate: "2024-01-10",
      size: "2.3 MB",
    },
    {
      id: 2,
      name: "Statement of Purpose",
      type: "sop",
      status: "verified",
      uploadDate: "2024-01-12",
      size: "1.1 MB",
    },
    {
      id: 3,
      name: "Resume/CV",
      type: "resume",
      status: "pending",
      uploadDate: "2024-01-14",
      size: "850 KB",
    },
  ],
  payments: [
    {
      id: 1,
      type: "Application Fee",
      amount: 50,
      currency: "GBP",
      status: "completed",
      date: "2024-01-15",
      university: "University of Manchester",
    },
    {
      id: 2,
      type: "Service Fee",
      amount: 500,
      currency: "GBP",
      status: "pending",
      date: "2024-01-20",
      university: "Imperial College London",
    },
  ],
  agentInfo: {
    name: "Sarah Johnson",
    email: "sarah.johnson@uni360.com",
    phone: "+44 7700 900456",
  },
  status: "active",
  registrationDate: "2023-12-01",
  lastActivity: "2024-01-16T10:30:00Z",
};

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "verified":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
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
      className={`max-w-sm w-full ${getToastColors(toast.type)} border rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">{toast.title}</p>
            <p className="mt-1 text-sm">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => onRemove(toast.id)}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-end justify-start px-4 py-6 pointer-events-none sm:p-6 z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StudentDetails = () => {
  const { id } = { id: "1" }; // Mock for demo - in real app use: useParams()
  const navigate = (path) => { 
    // Simulate navigation back to users page
    if (path === "/users") {
      window.history.back();
    }
  };
  
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast management
  const addToast = (toast) => {
    const newToast = {
      ...toast,
      id: Date.now() + Math.random(),
    };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(newToast.id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStudent(mockStudentData);
      setLoading(false);
      addToast({
        type: "success",
        title: "Student data loaded",
        message: "Student details have been successfully retrieved.",
      });
    }, 1000);
  }, [id]);

  const handleBack = () => {
    // This will navigate back to the users page
    navigate("/users");
  };

  const handleEditStudent = () => {
    addToast({
      type: "info",
      title: "Edit mode activated",
      message: "Student editing functionality will be available soon.",
    });
  };

  if (loading) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  if (!student) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Student not found</h2>
            <button
              onClick={handleBack}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Users
            </button>
          </div>
        </div>
      </>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: UserIcon },
    { id: "applications", name: "Applications", icon: AcademicCapIcon },
    { id: "documents", name: "Documents", icon: DocumentTextIcon },
    { id: "payments", name: "Payments", icon: CreditCardIcon },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
              <div className="flex items-center min-w-0">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span>Back</span>
                </button>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                    {student.personalInfo.firstName} {student.personalInfo.lastName}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">Student ID: {student.id}</p>
                </div>
              </div>
              <button
                onClick={handleEditStudent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto justify-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                <span>Edit Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-shrink-0 self-center sm:self-start">
                <img
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover"
                  src={student.personalInfo.profilePhoto}
                  alt={`${student.personalInfo.firstName} ${student.personalInfo.lastName}`}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {student.personalInfo.firstName} {student.personalInfo.lastName}
                </h2>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                  <div className="flex items-center justify-center sm:justify-start">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{student.personalInfo.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {student.personalInfo.phone}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {student.personalInfo.address.country}
                  </div>
                </div>
                <div className="mt-2 flex justify-center sm:justify-start">
                  <StatusBadge status={student.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 lg:px-6 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Personal Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd className="text-sm text-gray-900">{student.personalInfo.dateOfBirth}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                    <dd className="text-sm text-gray-900">{student.personalInfo.nationality}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900">
                      {student.personalInfo.address.street}, {student.personalInfo.address.city}, {student.personalInfo.address.zipCode}, {student.personalInfo.address.country}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                    <dd className="text-sm text-gray-900">{student.registrationDate}</dd>
                  </div>
                </dl>
              </motion.div>

              {/* Academic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Academic Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Current Education</dt>
                    <dd className="text-sm text-gray-900">{student.academicInfo.currentEducation}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Institution</dt>
                    <dd className="text-sm text-gray-900">{student.academicInfo.institution}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">GPA</dt>
                    <dd className="text-sm text-gray-900">{student.academicInfo.gpa}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">English Proficiency</dt>
                    <dd className="text-sm text-gray-900">
                      {student.academicInfo.englishProficiency.test}: {student.academicInfo.englishProficiency.score}
                    </dd>
                  </div>
                </dl>
              </motion.div>

              {/* Agent Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assigned Agent
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{student.agentInfo.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{student.agentInfo.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{student.agentInfo.phone}</dd>
                  </div>
                </dl>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{student.applications.length}</div>
                    <div className="text-sm text-gray-500">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{student.documents.length}</div>
                    <div className="text-sm text-gray-500">Documents</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "applications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Applications</h3>
              </div>
              
              {/* Mobile View */}
              <div className="block lg:hidden space-y-4 p-6">
                {student.applications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{application.university}</p>
                        <p className="text-sm text-gray-500 truncate">{application.program}</p>
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={application.status} />
                      </div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Date Submitted:</span>
                        <span className="text-gray-900">{application.dateSubmitted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Documents:</span>
                        <span className="text-gray-900">{application.documents.length} documents</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        University & Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {student.applications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{application.university}</div>
                            <div className="text-sm text-gray-500">{application.program}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={application.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {application.dateSubmitted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {application.documents.length} documents
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              </div>
              
              {/* Mobile View */}
              <div className="block lg:hidden space-y-4 p-6">
                {student.documents.map((document) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{document.name}</p>
                        <p className="text-sm text-gray-500">{document.type}</p>
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={document.status} />
                      </div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Upload Date:</span>
                        <span className="text-gray-900">{document.uploadDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Size:</span>
                        <span className="text-gray-900">{document.size}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button className="flex items-center text-primary-600 hover:text-primary-900 text-sm">
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" /> Download
                      </button>
                      <button className="flex items-center text-green-600 hover:text-green-900 text-sm">
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
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
                    {student.documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {document.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={document.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {document.uploadDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {document.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">
                            <DocumentArrowDownIcon className="h-4 w-4 inline" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <CheckCircleIcon className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              </div>
              
              {/* Mobile View */}
              <div className="block lg:hidden space-y-4 p-6">
                {student.payments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{payment.type}</p>
                        <p className="text-sm text-gray-500 truncate">{payment.university}</p>
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Amount:</span>
                        <span className="text-gray-900 font-medium">{payment.currency} {payment.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Date:</span>
                        <span className="text-gray-900">{payment.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        University
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {student.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {payment.currency} {payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.university}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDetails;
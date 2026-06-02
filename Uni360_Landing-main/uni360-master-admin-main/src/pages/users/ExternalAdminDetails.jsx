import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  AcademicCapIcon,
  ChartBarIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

// Mock external admin data
const mockExternalAdminData = {
  id: 5,
  personalInfo: {
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael@agencypartner.com",
    phone: "+44 20 7946 1234",
    dateOfBirth: "1980-07-22",
    nationality: "British",
    address: {
      street: "789 Partner Street",
      city: "London",
      state: "England",
      zipCode: "SW1A 1AA",
      country: "UK",
    },
    profilePhoto:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  },
  agencyInfo: {
    agency: "Education Partners UK",
    agencyType: "Education Consultant",
    contractStart: "2023-07-20",
    contractEnd: "2024-07-20",
    businessRegistration: "Company No. 12345678",
    website: "www.educationpartners.co.uk",
    specialization: [
      "Higher Education",
      "Vocational Training",
      "English Language",
    ],
  },
  businessMetrics: {
    managedStudents: 12,
    commission: "15%",
    totalCommissionEarned: 45000,
    averageApplicationSuccess: "85%",
    monthlyTarget: 5,
    currentMonthApplications: 3,
  },
  managedStudents: [
    {
      id: 1,
      name: "Alice Brown",
      program: "Computer Science",
      university: "University of Sydney",
      status: "approved",
      submissionDate: "2024-01-10",
    },
    {
      id: 2,
      name: "Bob Wilson",
      program: "Business Administration",
      university: "Monash University",
      status: "pending",
      submissionDate: "2024-01-15",
    },
    {
      id: 3,
      name: "Carol Davis",
      program: "Engineering",
      university: "UNSW",
      status: "approved",
      submissionDate: "2024-01-08",
    },
  ],
  commissions: [
    {
      id: 1,
      student: "Alice Brown",
      university: "University of Sydney",
      amount: 2500,
      currency: "AUD",
      status: "paid",
      date: "2024-01-20",
    },
    {
      id: 2,
      student: "Carol Davis",
      university: "UNSW",
      amount: 3000,
      currency: "AUD",
      status: "pending",
      date: "2024-01-18",
    },
    {
      id: 3,
      student: "David Lee",
      university: "University of Melbourne",
      amount: 2800,
      currency: "AUD",
      status: "paid",
      date: "2024-01-12",
    },
  ],
  performance: [
    { month: "January", applications: 3, approvals: 2, commissions: 5500 },
    { month: "December", applications: 4, approvals: 3, commissions: 7800 },
    { month: "November", applications: 2, approvals: 2, commissions: 5000 },
  ],
  status: "active",
  lastLogin: "2024-01-16T12:15:00Z",
  createdAt: "2023-07-20T10:00:00Z",
};

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
        status
      )}`}>
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

const ExternalAdminDetails = () => {
  const navigate = useNavigate();
  const [externalAdmin, setExternalAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleBackClick = () => {
    navigate("/users");
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setExternalAdmin(mockExternalAdminData);
      setLoading(false);
      addToast({
        type: "success",
        title: "Data loaded",
        message: "Details retrieved successfully.",
      });
    }, 1000);
  }, []);

  if (loading) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  if (!externalAdmin) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              External admin not found
            </h2>
            <button
              onClick={handleBackClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Users
            </button>
          </div>
        </div>
      </>
    );
  }

  const handleEditExternalAdmin = () => {
    addToast({
      type: "info",
      title: "Edit mode",
      message: "Editing functionality coming soon.",
    });
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: UserIcon },
    { id: "students", name: "Students", icon: AcademicCapIcon },
    { id: "commissions", name: "Commissions", icon: CreditCardIcon },
    { id: "performance", name: "Performance", icon: ChartBarIcon },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={handleBackClick}
                  className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <ArrowLeftIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {externalAdmin.personalInfo.firstName}{" "}
                    {externalAdmin.personalInfo.lastName}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    ID: {externalAdmin.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEditExternalAdmin}
                className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 ml-2">
                <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
              <div className="flex-shrink-0 self-center sm:self-auto">
                <img
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover"
                  src={externalAdmin.personalInfo.profilePhoto}
                  alt={`${externalAdmin.personalInfo.firstName} ${externalAdmin.personalInfo.lastName}`}
                />
              </div>
              <div className="sm:ml-6 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {externalAdmin.personalInfo.firstName}{" "}
                  {externalAdmin.personalInfo.lastName}
                </h2>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center justify-center sm:justify-start">
                    <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{externalAdmin.personalInfo.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {externalAdmin.personalInfo.phone}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <BuildingOfficeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{externalAdmin.agencyInfo.agency}</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-center sm:justify-start">
                  <StatusBadge status={externalAdmin.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Mobile tab selector */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full flex items-center justify-between py-3 text-sm font-medium text-gray-700">
                <span>
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </span>
                <Bars3Icon className="h-5 w-5" />
              </button>
              {mobileMenuOpen && (
                <div className="border-t border-gray-200">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center py-3 px-2 text-sm font-medium ${
                          activeTab === tab.id
                            ? "text-primary-600 bg-primary-50"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        }`}>
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Desktop tabs */}
            <nav className="hidden sm:flex -mb-px space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}>
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">{tab.name}</span>
                    <span className="md:hidden">
                      {tab.name === "Students" ? "Students" : 
                       tab.name === "Commissions" ? "Comm." :
                       tab.name === "Performance" ? "Perf." : tab.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Personal Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Date of Birth
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.personalInfo.dateOfBirth}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Nationality
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.personalInfo.nationality}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.personalInfo.address.street},{" "}
                      {externalAdmin.personalInfo.address.city},{" "}
                      {externalAdmin.personalInfo.address.zipCode},{" "}
                      {externalAdmin.personalInfo.address.country}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Partnership Start
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.agencyInfo.contractStart}
                    </dd>
                  </div>
                </dl>
              </motion.div>

              {/* Agency Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Agency Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Agency Type
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.agencyInfo.agencyType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Business Registration
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.agencyInfo.businessRegistration}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Website</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 break-words">
                      {externalAdmin.agencyInfo.website}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Contract Period
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {externalAdmin.agencyInfo.contractStart} -{" "}
                      {externalAdmin.agencyInfo.contractEnd}
                    </dd>
                  </div>
                </dl>
              </motion.div>

              {/* Business Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Business Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary-600">
                      {externalAdmin.businessMetrics.managedStudents}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">
                      {externalAdmin.businessMetrics.commission}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Commission</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                      {externalAdmin.businessMetrics.averageApplicationSuccess}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary-600">
                      ${externalAdmin.businessMetrics.totalCommissionEarned.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Earned</div>
                  </div>
                </div>
              </motion.div>

              {/* Specialization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Specialization
                </h3>
                <div className="flex flex-wrap gap-2">
                  {externalAdmin.agencyInfo.specialization.map((spec, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {spec}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Monthly Target
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {externalAdmin.businessMetrics.currentMonthApplications} /{" "}
                    {externalAdmin.businessMetrics.monthlyTarget} applications
                  </dd>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (externalAdmin.businessMetrics
                            .currentMonthApplications /
                            externalAdmin.businessMetrics.monthlyTarget) *
                          100
                        }%`,
                      }}></div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "students" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Managed Students
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        University
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {externalAdmin.managedStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <div className="truncate max-w-[100px] sm:max-w-none">
                            {student.program}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.university}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <StatusBadge status={student.status} />
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.submissionDate}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-3">
                            <button className="text-primary-600 hover:text-primary-900">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "commissions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Commission History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        University
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {externalAdmin.commissions.map((commission) => (
                      <tr key={commission.id}>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {commission.student}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {commission.university}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {commission.currency}{" "}
                          {commission.amount.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <StatusBadge status={commission.status} />
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {commission.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "performance" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Performance Metrics
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {externalAdmin.performance.map((period, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                        {period.month}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">
                            Applications:
                          </span>
                          <span className="text-xs sm:text-sm font-medium">
                            {period.applications}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">
                            Approvals:
                          </span>
                          <span className="text-xs sm:text-sm font-medium">
                            {period.approvals}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">
                            Success Rate:
                          </span>
                          <span className="text-xs sm:text-sm font-medium">
                            {(
                              (period.approvals / period.applications) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">
                            Commissions:
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-green-600">
                            AUD {period.commissions.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExternalAdminDetails;
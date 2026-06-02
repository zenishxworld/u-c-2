import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CreditCardIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import {
  fetchApplicationById,
  mapApplicationStatus,
  mapWorkflowStage,
  getStatusColor,
  getStudentProfileForSuperAdmin
} from "../../services/applicationService";

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

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);

  useEffect(() => {
    loadApplicationDetails();
  }, [id]);

  const loadApplicationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchApplicationById(id);
      setApplication(response.data);
      // Fetch student details from user management API
      if (response.data?.studentId) {
        await fetchStudentDetails(response.data.studentId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student details from user profile API
  const fetchStudentDetails = async (studentId) => {
    setStudentLoading(true);
    try {
      const response = await getStudentProfileForSuperAdmin(studentId);

      if (response.success && response.data) {
        const payload = response.data;
        const userInfo = payload.userInfo || {};
        const profileData = payload.profileData || {};
        const basicInfo = profileData.basic_info || {};

        setStudentDetails({
          id: payload.userId || studentId,
          name: userInfo.fullName || basicInfo.full_name || 'N/A',
          email: userInfo.email || 'N/A',
          phone: userInfo.phoneNumber || basicInfo.phone || 'N/A',
          nationality: basicInfo.nationality || 'N/A',
          profilePhoto: null,
          userType: userInfo.userType || 'STUDENT',
          status: userInfo.status || 'ACTIVE',
          profileData: profileData,
          profileOverview: payload.overview || null
        });
      } else {
        setStudentDetails(null);
      }
    } catch (err) {
      setStudentDetails(null);
    } finally {
      setStudentLoading(false);
    }
  };

  const loadDocuments = async () => {
    setDocsLoading(true);
    try {
      const response = await import('../../services/api').then(m => m.default.get(`/api/v1/admin/students/${application.studentId}/documents`));
      setDocuments(response.data?.documents || []);
    } catch (err) {
    } finally {
      setDocsLoading(false);
    }
  };

  const handleViewDocument = async (uploadId) => {
    setViewerUrl('loading');
    try {
      const response = await import('../../services/api').then(m => m.default.get(`/api/v1/documents/${uploadId}/view-url`));
      setViewerUrl(response.data?.view_url || null);
    } catch (err) {
      setViewerUrl(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-600 mx-auto" />
          <h2 className="mt-4 text-lg sm:text-xl font-bold text-gray-900">
            Error Loading Application
          </h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => navigate("/applications")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Applications
            </button>
            <button
              onClick={loadApplicationDetails}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Application not found
          </h2>
          <button
            onClick={() => navigate("/applications")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: DocumentTextIcon },
    { id: "profile", name: "Student Profile", icon: UserIcon },
    { id: "documents", name: "Documents", icon: DocumentTextIcon },
    { id: "timeline", name: "Timeline", icon: ClockIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-16 gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/applications")}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>
              <div className="ml-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Application #{application.referenceNumber}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Created on {formatDate(application.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge status={application.status} />
              {application.isUrgent && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Urgent
                </span>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Application Header - Dynamic Data Only */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary-100 flex items-center justify-center">
                {studentDetails?.profilePhoto ? (
                  <img src={studentDetails.profilePhoto} alt="Student" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-6 w-6 text-primary-500" />
                )}
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900">
                  {studentLoading ? 'Loading...' : (studentDetails?.name || 'Student')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {studentDetails?.email || `ID: ${application.studentId}`}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BuildingOffice2Icon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900">University</h3>
                <p className="text-xs sm:text-sm text-gray-500">ID: {application.universityId?.substring(0, 8)}...</p>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap gap-2 sm:gap-4 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if (tab.id === 'documents') loadDocuments(); }}
                  className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center ${activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}>
                  <Icon className="h-4 w-4 mr-1 sm:mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Student Details Card - From User Management API */}
            {studentDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Student Information
                </h3>
                <div className="space-y-4">
                  {studentDetails.profilePhoto && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={studentDetails.profilePhoto}
                        alt={studentDetails.name}
                        className="h-24 w-24 rounded-full object-cover border-2 border-primary-200"
                      />
                    </div>
                  )}
                  <dl className="space-y-2 sm:space-y-3">
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="text-xs sm:text-sm font-semibold text-gray-900">{studentDetails.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-xs sm:text-sm text-gray-900">{studentDetails.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-xs sm:text-sm text-gray-900">{studentDetails.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Nationality</dt>
                      <dd className="text-xs sm:text-sm text-gray-900">{studentDetails.nationality}</dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">User Type</dt>
                      <dd className="text-xs sm:text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {studentDetails.userType}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-xs sm:text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${studentDetails.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {studentDetails.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </motion.div>
            )}

            {/* Application Details - Real Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                Application Details
              </h3>
              <dl className="space-y-2 sm:space-y-3">
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Reference Number
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {application.referenceNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Status
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    <StatusBadge status={application.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Workflow Stage
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {mapWorkflowStage(application.workflowStage)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Created Date
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {formatDateTime(application.createdAt)}
                  </dd>
                </div>
                {application.submittedAt && (
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">
                      Submitted Date
                    </dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {formatDateTime(application.submittedAt)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {formatDateTime(application.lastUpdatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Deadline
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {formatDateTime(application.deadline)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">Course ID</dt>
                  <dd className="text-xs sm:text-sm text-gray-900">{application.courseId || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">University ID</dt>
                  <dd className="text-xs sm:text-sm text-gray-900">{application.universityId || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">
                    Processing Time
                  </dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    {application.processingTimeHours} hours
                  </dd>
                </div>
              </dl>
            </motion.div>

          </div>
        )}

        {activeTab === "profile" && studentDetails && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Education Background */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 col-span-1 md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Education Background
                </h3>
                {studentDetails.profileData?.education?.education_entries?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentDetails.profileData.education.education_entries.map((entry, idx) => (
                      <div key={idx} className="bg-gray-50 rounded p-4 border border-gray-100">
                        <div className="font-medium text-gray-900">{entry.institution_name}</div>
                        <div className="text-sm text-gray-600 mt-1 capitalize">{entry.education_level} in {entry.field_of_study}</div>
                        <div className="text-sm mt-3 pt-3 border-t border-gray-200 flex justify-between">
                          <span className="text-gray-500">GPA/Score: <span className="font-semibold text-gray-900">{entry.gpa}</span></span>
                          <span className="text-gray-500">{entry.graduation_year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No education entries found.</p>
                )}
              </div>

              {/* Study Preferences */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3">Study Preferences</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Target Intake</dt>
                    <dd className="text-sm text-gray-900 font-medium capitalize">{studentDetails.profileData?.preferences?.intake_semester} {studentDetails.profileData?.preferences?.intake_year}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Degree Level</dt>
                    <dd className="text-sm text-gray-900 capitalize">{studentDetails.profileData?.preferences?.degree_level || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Programs</dt>
                    <dd className="text-sm text-gray-900">
                      {studentDetails.profileData?.preferences?.preferred_programs?.join(', ') || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Destinations</dt>
                    <dd className="text-sm text-gray-900 capitalize">
                      {studentDetails.profileData?.preferences?.preferred_countries?.join(', ') || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Test Scores */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3">Test Scores</h3>
                <div className="space-y-4">
                  {studentDetails.profileData?.test_scores?.test_type ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{studentDetails.profileData.test_scores.test_type}</span>
                        <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded">Overall: {studentDetails.profileData.test_scores.overall_score}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between bg-gray-50 p-1.5 rounded">
                          <span className="text-gray-500">Reading</span><span className="font-medium">{studentDetails.profileData.test_scores.reading_score}</span>
                        </div>
                        <div className="flex justify-between bg-gray-50 p-1.5 rounded">
                          <span className="text-gray-500">Listening</span><span className="font-medium">{studentDetails.profileData.test_scores.listening_score}</span>
                        </div>
                        <div className="flex justify-between bg-gray-50 p-1.5 rounded">
                          <span className="text-gray-500">Speaking</span><span className="font-medium">{studentDetails.profileData.test_scores.speaking_score}</span>
                        </div>
                        <div className="flex justify-between bg-gray-50 p-1.5 rounded">
                          <span className="text-gray-500">Writing</span><span className="font-medium">{studentDetails.profileData.test_scores.writing_score}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No test scores recorded.</p>
                  )}
                </div>
              </div>

              {/* Financials & Goals */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3">Financials & Goals</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Budget Range</dt>
                    <dd className="text-sm text-gray-900">{studentDetails.profileData?.financial?.budget_range?.replace('_', ' to ') || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Funding Source</dt>
                    <dd className="text-sm text-gray-900 capitalize">
                      {studentDetails.profileData?.financial?.funding_source?.join(', ')?.replace('_', ' ') || 'N/A'}
                    </dd>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <dt className="text-xs font-medium text-gray-500">Career Goal</dt>
                    <dd className="text-sm text-gray-900">{studentDetails.profileData?.goals?.career_goals || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Motivation</dt>
                    <dd className="text-sm text-gray-900">{studentDetails.profileData?.goals?.motivation || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Documents</h3>
            {docsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-500">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No documents found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc, idx) => (
                      <tr key={doc.uploadId || idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.documentType}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{doc.documentCategory}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                            doc.verificationStatus === 'UNVERIFIED' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>{doc.verificationStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.reviewStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            doc.reviewStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>{doc.reviewStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(doc.uploadedAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewDocument(doc.uploadId)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-primary-600 border border-primary-300 rounded hover:bg-primary-50 transition">
                            <EyeIcon className="h-3.5 w-3.5 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document Viewer Popup */}
            {viewerUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setViewerUrl(null)}>
                <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-primary-400" />
                      <span className="text-sm font-semibold">Document Viewer</span>
                    </div>
                    <button onClick={() => setViewerUrl(null)} className="text-gray-400 hover:text-white transition">
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {viewerUrl === 'loading' ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                      </div>
                    ) : (
                      <iframe src={viewerUrl} className="w-full h-full border-0" title="Document Viewer" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "timeline" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">
              Application Timeline

            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {application.timeline.map((event, eventIdx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== application.timeline.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${event.status === "completed"
                              ? "bg-green-500"
                              : event.status === "current"
                                ? "bg-blue-500"
                                : "bg-gray-400"
                              }`}>
                            {event.status === "completed" ? (
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            ) : event.status === "current" ? (
                              <ClockIcon className="h-5 w-5 text-white" />
                            ) : (
                              <div className="h-2 w-2 bg-white rounded-full" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                {event.action}
                              </span>{" "}
                              by {event.actor}
                            </p>
                            <p className="mt-2 text-xs sm:text-sm text-gray-700">
                              {event.description}
                            </p>
                          </div>
                          <div className="text-right text-xs sm:text-sm whitespace-nowrap text-gray-500">
                            {event.date ? formatDate(event.date) : "Pending"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}


      </div>
    </div>
  );
};

export default ApplicationDetails;
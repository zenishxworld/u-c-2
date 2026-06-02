import api from './api';

/**
 * Fetch all applications with pagination support
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size (default: 100 to get all)
 * @returns {Promise} Application list with metadata
 */
export const fetchApplications = async (page = 0, size = 100, search = '') => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(
      `/api/v1/superadmin/dashboard/applications?${params.toString()}`
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // Gracefully handle server errors (500, 502, 503, etc.) so the dashboard
    // doesn't crash — return an empty but valid response shape instead.
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message ||
      (status ? `Server error: ${status}` : 'Unable to connect to server');

    console.warn(`[applicationService] fetchApplications failed (${status ?? 'network'}):`, errorMessage);

    // Return a safe empty payload so consumers can degrade gracefully
    return {
      success: false,
      error: errorMessage,
      data: {
        applications: [],
        pagination: {
          currentPage: 0,
          pageSize: size,
          totalPages: 0,
          totalElements: 0,
          hasNext: false,
          hasPrevious: false,
          isFirst: true,
          isLast: true,
        },
        summary: {
          totalApplications: 0,
          draftApplications: 0,
          submittedApplications: 0,
          underReviewApplications: 0,
          completedApplications: 0,
          urgentApplications: 0,
          unassignedApplications: 0,
          applicationsCreatedToday: 0,
          applicationsCreatedThisWeek: 0,
          applicationsCreatedThisMonth: 0,
        },
      },
    };
  }
};

/**
 * Fetch application analytics
 * @returns {Promise} Analytics data
 */
export const fetchApplicationAnalytics = async () => {
  try {
    const response = await api.get('/api/v1/superadmin/dashboard/applications/analytics');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    let errorMessage = 'Failed to fetch analytics';
    if (error.response) {
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Fetch users (for student/admin info)
 * @param {string} userType - Optional filter: STUDENT, ADMIN, SUPER_ADMIN
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise} User list with pagination
 */
export const fetchUsers = async (userType = null, page = 0, size = 20) => {
  try {
    const params = new URLSearchParams();
    if (userType) params.append('userType', userType);
    params.append('page', page);
    params.append('size', size);
    
    const response = await api.get(
      `/api/v1/superadmin/dashboard/users?${params.toString()}`
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw new Error('Failed to fetch users');
  }
};

/**
 * 🚧 MOCK DATA - TO BE REPLACED WITH REAL API
 * Fetch single application details
 * @param {string} id - Application ID
 * @returns {Promise} Application details
 */
export const fetchApplicationById = async (id) => {
  try {
    // TODO: Replace with real API call when available
    // const response = await applicationApi.get(`/api/v1/superadmin/dashboard/applications/${id}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 🚧 MOCK DATA - Find application from list
    const applicationsResponse = await fetchApplications();
    const application = applicationsResponse.data.applications.find(app => app.id === id);
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    // 🚧 MOCK DATA - Enhanced application details
    const mockDetails = {
      ...application,
      student: {
        id: application.studentId,
        name: `Student ${application.studentId}`, // 🚧 MOCK
        email: `student${application.studentId}@example.com`, // 🚧 MOCK
        phone: '+44 7700 900123', // 🚧 MOCK
        nationality: 'Unknown', // 🚧 MOCK
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' // 🚧 MOCK
      },
      university: {
        id: application.universityId,
        name: 'University Name', // 🚧 MOCK
        logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop', // 🚧 MOCK
        country: 'Unknown', // 🚧 MOCK
        ranking: 'N/A', // 🚧 MOCK
        location: 'Unknown' // 🚧 MOCK
      },
      program: {
        id: application.courseId,
        name: 'Course Name', // 🚧 MOCK
        duration: '12 months', // 🚧 MOCK
        startDate: 'TBD', // 🚧 MOCK
        tuitionFee: 'N/A', // 🚧 MOCK
        requirements: { // 🚧 MOCK
          gpa: 'N/A',
          englishTest: 'N/A',
          workExperience: 'N/A'
        }
      },
      agent: application.assignedAdminId ? { // 🚧 MOCK
        id: application.assignedAdminId,
        name: `Admin ${application.assignedAdminId}`,
        email: `admin${application.assignedAdminId}@uniflow.com`,
        phone: '+44 7700 900456',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=400&h=400&fit=crop&crop=face'
      } : null,
      documents: [], // 🚧 MOCK - Empty for now
      timeline: [ // 🚧 MOCK
        {
          id: 1,
          action: 'Application Created',
          date: application.createdAt,
          status: 'completed',
          actor: 'System',
          description: 'Application initialized'
        },
        application.submittedAt && {
          id: 2,
          action: 'Application Submitted',
          date: application.submittedAt,
          status: 'completed',
          actor: `Student ${application.studentId}`,
          description: 'Application submitted for review'
        },
        {
          id: 3,
          action: 'Current Stage',
          date: application.lastUpdatedAt,
          status: 'current',
          actor: application.assignedAdminId ? `Admin ${application.assignedAdminId}` : 'Unassigned',
          description: `Workflow stage: ${application.workflowStage}`
        }
      ].filter(Boolean),
      payments: [], // 🚧 MOCK - Empty for now
      notes: [] // 🚧 MOCK - Empty for now
    };
    
    return {
      success: true,
      data: mockDetails
    };
  } catch (error) {
    throw error;
  }
};

/**
 * 🚧 MOCK FUNCTION - TO BE REPLACED WITH REAL API
 * Update application status
 */
export const updateApplicationStatus = async (id, status, notes) => {
  try {
    // TODO: Replace with real API call
    // const response = await applicationApi.patch(`/api/v1/superadmin/dashboard/applications/${id}/status`, {
    //   status,
    //   notes
    // });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Status updated successfully (MOCK)'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch student profile for super admin
 * Uses the studentId from the application as the userId
 * @param {number} userId - The student's user ID (application.studentId)
 * @returns {Promise} Student profile data
 */
export const getStudentProfileForSuperAdmin = async (userId) => {
  try {
    const response = await api.get(
      `/api/v1/superadmin/dashboard/users/${userId}/profile`
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    let errorMessage = 'Failed to fetch student profile';
    if (error.response) {
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'Unable to connect to server';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Map API status to display-friendly format
 */
export const mapApplicationStatus = (status) => {
  const statusMap = {
    'draft': 'Draft',
    'IN_WORKFLOW': 'In Progress',
    'CLAIM_PENDING': 'Pending Review',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'WITHDRAWN': 'Withdrawn',
    'COMPLETED': 'Completed'
  };
  
  return statusMap[status] || status;
};

/**
 * Map workflow stage to display-friendly format
 */
export const mapWorkflowStage = (stage) => {
  const stageMap = {
    'INITIAL': 'Initial',
    'CLAIM_PENDING': 'Claim Pending',
    'DOCUMENT_VERIFICATION': 'Document Verification',
    'REVIEW': 'Under Review',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected'
  };
  
  return stageMap[stage] || stage;
};

/**
 * Get status color for badge
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'draft': 'gray',
    'IN_WORKFLOW': 'blue',
    'CLAIM_PENDING': 'yellow',
    'APPROVED': 'green',
    'REJECTED': 'red',
    'WITHDRAWN': 'gray',
    'COMPLETED': 'green'
  };
  
  return colorMap[status] || 'gray';
};

export default {
  fetchApplications,
  fetchApplicationAnalytics,
  fetchUsers,
  fetchApplicationById,
  updateApplicationStatus,
  getStudentProfileForSuperAdmin,
  mapApplicationStatus,
  mapWorkflowStage,
  getStatusColor
};
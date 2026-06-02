const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApplicationFilter {
    status?: string;
    workflowStage?: string;
    countryCode?: string;
    degreeLevel?: string;
    assignedAdminId?: number;
    isUrgent?: boolean;
    sortBy?: string;
    page?: number;
    size?: number;
}

export interface ApplicationResponse {
    success: boolean;
    data?: any[];
    message?: string;
    totalPages?: number;
    totalElements?: number;
    pagination?: {
        total: number;
        size: number;
        totalPages: number;
        page: number;
        hasPrevious: boolean;
        hasNext: boolean;
    };
    stageSummary?: {
        total: number;
        claimPending: number;
        underReview: number;
        completed: number;
    };
}

/**
 * Fetch applications with filters and pagination
 * GET /api/v1/admin/applications
 * Auth: Admin JWT token (reads from uni_access_token in localStorage)
 * 
 * Response structure:
 * {
 *   "success": true,
 *   "data": {
 *     "pagination": { total, size, totalPages, page, hasPrevious, hasNext },
 *     "applications": [{ id, studentName, universityName, ... }, ...]
 *   }
 * }
 */
export const getApplications = async (
    filters?: ApplicationFilter
): Promise<ApplicationResponse> => {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('uni_access_token');
        if (!token) {
            console.warn('❌ Token not found in localStorage');
            return {
                success: false,
                message: 'Admin JWT token not found. Please log in.',
            };
        }

        // Build query string from filters
        const params = new URLSearchParams();

        if (filters?.status) params.append('status', filters.status);
        if (filters?.workflowStage) params.append('workflowStage', filters.workflowStage);
        if (filters?.countryCode) params.append('countryCode', filters.countryCode);
        if (filters?.degreeLevel) params.append('degreeLevel', filters.degreeLevel);
        if (filters?.assignedAdminId !== undefined) {
            params.append('assignedAdminId', filters.assignedAdminId.toString());
        }
        if (filters?.isUrgent !== undefined) {
            params.append('isUrgent', filters.isUrgent.toString());
        }
        if (filters?.sortBy) params.append('sortBy', filters.sortBy);
        if (filters?.page !== undefined) params.append('page', filters.page.toString());
        if (filters?.size !== undefined) params.append('size', filters.size.toString());

        // Build full URL
        const queryString = params.toString();
        const url = `${API_BASE_URL}/api/v1/admin/applications${queryString ? '?' + queryString : ''
            }`;

        console.log('📡 Fetching applications from:', url);
        console.log('🔑 Token present:', !!token);

        // Make request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('📊 Response status:', response.status, response.statusText);

        // Handle HTTP errors
        if (!response.ok) {
            let errorBody = '';
            try {
                errorBody = await response.text();
                console.error('❌ API Error Response:', errorBody);
            } catch {
                console.error('❌ Could not parse error response');
            }

            // Try to parse as JSON for better error message
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(errorBody);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                // Not JSON, use status text
                if (errorBody) {
                    errorMessage = errorBody;
                }
            }

            console.error('🚨 Error Message:', errorMessage);

            return {
                success: false,
                message: errorMessage,
            };
        }

        // Parse response - YOUR API STRUCTURE
        const apiResponse = await response.json();
        console.log('📦 Full API Response:', apiResponse);

        const applications = apiResponse.data?.applications || [];
        const pagination = apiResponse.data?.pagination || {};
        const stageSummary = apiResponse.data?.stageSummary || {};

        console.log('✅ Applications fetched successfully. Count:', applications.length);
        console.log('📄 Pagination:', pagination);
        console.log('📊 Stage Summary:', stageSummary);

        return {
            success: true,
            data: applications,
            message: apiResponse.message,
            totalPages: pagination.totalPages || 0,
            totalElements: pagination.total || 0,
            pagination: pagination,
            stageSummary: stageSummary,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('💥 Exception caught:', errorMessage, error);
        return {
            success: false,
            message: `Error: ${errorMessage}`,
        };
    }
};

/**
 * Optional: Get a single application by ID
 * GET /api/v1/admin/applications/{id}
 */
export const getApplicationById = async (
    applicationId: string
): Promise<ApplicationResponse> => {
    try {
        const token = localStorage.getItem('uni_access_token');
        if (!token) {
            return {
                success: false,
                message: 'Admin JWT token not found',
            };
        }

        const url = `${API_BASE_URL}/api/v1/admin/applications/${applicationId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => response.statusText);
            return {
                success: false,
                message: `HTTP ${response.status}: ${errorBody}`,
            };
        }

        const apiResponse = await response.json();
        const appData = apiResponse.data?.application || apiResponse.data || {};

        return {
            success: true,
            data: [appData],
            message: apiResponse.message,
        };
    } catch (error) {
        console.error('Error fetching application:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch application',
        };
    }
};

/**
 * Optional: Update application status or other fields
 * PUT /api/v1/admin/applications/{id}
 */
export const updateApplication = async (
    applicationId: string,
    updates: any
): Promise<ApplicationResponse> => {
    try {
        const token = localStorage.getItem('uni_access_token');
        if (!token) {
            return {
                success: false,
                message: 'Admin JWT token not found',
            };
        }

        const url = `${API_BASE_URL}/api/v1/admin/applications/${applicationId}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => response.statusText);
            return {
                success: false,
                message: `HTTP ${response.status}: ${errorBody}`,
            };
        }

        const apiResponse = await response.json();
        return {
            success: true,
            data: [apiResponse.data || {}],
            message: apiResponse.message || 'Application updated successfully',
        };
    } catch (error) {
        console.error('Error updating application:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update application',
        };
    }
};
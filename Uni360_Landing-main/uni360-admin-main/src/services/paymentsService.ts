// src/services/paymentsService.ts

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface Payment {
    id: string;
    studentId?: number;
    studentName?: string;
    studentEmail?: string;
    amount: number;
    currency?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROCESSING';
    paymentPurpose: string;
    referenceId?: string;
    createdAt?: string;
    updatedAt?: string;
    // Legacy / UI-only fields kept for backward compat
    type?: string;
    dueDate?: string;
    university?: string;
    description?: string;
    receiptUrl?: string;
}

export interface PaymentsResponse {
    success: boolean;
    message?: string;
    data: {
        total: number;
        payments: Payment[];
    };
    timestamp?: string;
}

/**
 * Fetch all payments for students assigned to the current admin.
 * GET /api/v1/admin/payments
 */
export const fetchAssignedStudentPayments = async (token: string): Promise<Payment[]> => {
    if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
    }

    console.log('Fetching payments from:', `${BASE_URL}/api/v1/admin/payments`);

    try {
        const response = await fetch(`${BASE_URL}/api/v1/admin/payments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 404) {
            throw new Error('Payment endpoint not found. Please contact support or verify the API endpoint.');
        }
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
            throw new Error('Session expired. Please log in again.');
        }
        if (response.status === 403) {
            throw new Error('You do not have permission to view payments.');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message ||
                errorData.error ||
                `Failed to fetch payments: ${response.status} ${response.statusText}`
            );
        }

        const body = await response.json();

        // Handle new API shape: { data: { student_payments: [{ payments: [...] }] } }
        if (body?.data?.student_payments && Array.isArray(body.data.student_payments)) {
            const allPayments: Payment[] = [];
            body.data.student_payments.forEach((student: any) => {
                if (student.payments && Array.isArray(student.payments)) {
                    allPayments.push(...student.payments);
                }
            });
            return allPayments;
        }
        
        // Handle legacy API shape: { success, data: { payments: [] } }
        if (body?.data?.payments && Array.isArray(body.data.payments)) {
            return body.data.payments;
        }
        // Handle: { data: [] }
        if (Array.isArray(body?.data)) {
            return body.data;
        }
        // Handle: plain array
        if (Array.isArray(body)) {
            return body;
        }

        return [];
    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Network error. Please check your connection and try again.');
    }
};
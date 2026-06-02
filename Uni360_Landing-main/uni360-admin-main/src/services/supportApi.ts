import { api } from "./api";

export interface Ticket {
  id: string;
  ticketNumber: string;
  studentId: number;
  studentName: string;
  assignedAdminId?: number;
  assignedAdminName: string;
  ticketType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  subject: string;
  description: string;
  resolution?: string;
  escalated: boolean;
  escalatedToName: string;
  resolvedByName: string;
  resolvedAt?: string;
  resolvedBy?: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  hasUnreadMessages: boolean;
  open: boolean;
  resolved: boolean;
  assigned: boolean;
  highPriority: boolean;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: number;
  senderType: "ADMIN" | "STUDENT";
  message: string;
  createdAt: string;
}

export const supportApi = {
  // 1. GET List Tickets
  getTickets: async (params?: {
    assignedToMe?: boolean;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get("/api/v1/admin/support/tickets", { params });
    return response.data;
  },

  // 2. GET List Ticket Messages
  getTicketMessages: async (ticketId: string) => {
    const response = await api.get(`/api/v1/admin/support/tickets/${ticketId}/messages`);
    return response.data;
  },

  // 3. POST Send Message
  sendMessage: async (ticketId: string, message: string) => {
    const response = await api.post(`/api/v1/admin/support/tickets/${ticketId}/messages`, {
      message,
    });
    return response.data;
  },

  // 4. PUT Update Status
  updateTicketStatus: async (
    ticketId: string,
    data: {
      status: string;
      updatedBy: number;
      assignedAdminId?: number;
      resolution?: string;
    }
  ) => {
    const response = await api.put(`/api/v1/admin/support/tickets/${ticketId}/status`, data);
    return response.data;
  },

  // 5. POST Escalate
  escalateTicket: async (ticketId: string, escalatedTo: number, reason: string) => {
    const response = await api.post(`/api/v1/admin/support/tickets/${ticketId}/escalate`, {
      escalatedTo,
      reason,
    });
    return response.data;
  },
};
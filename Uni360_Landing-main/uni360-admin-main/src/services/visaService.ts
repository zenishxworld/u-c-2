// services/visaService.ts
import { apiRequest } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface VisaChecklist {
  id: string;
  country: string;
  title: string;
  items: string[];
  adminId: number;
}

export interface VisaAppointment {
  id: string;
  studentId: number;
  country: string;
  appointmentDate: string;
  appointmentTime: string;
  location: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface CreateAppointmentPayload {
  studentId: number;
  country: string;
  appointmentDate: string;
  appointmentTime: string;
  location: string;
  notes?: string;
}

export interface UpdateStatusPayload {
  status: AppointmentStatus;
  notes?: string;
}

// ─── Checklist APIs ───────────────────────────────────────────────────────────

/** POST /api/v1/admin/visa/checklist */
export async function saveVisaChecklist(payload: {
  country: string;
  title: string;
  items: string[];
}): Promise<VisaChecklist> {
  const res = await apiRequest('/api/v1/admin/visa/checklist', 'POST', payload);
  return res?.data ?? res;
}

/** GET /api/v1/admin/visa/checklist?country=XX */
export async function getVisaChecklist(country: string): Promise<VisaChecklist> {
  const res = await apiRequest(`/api/v1/admin/visa/checklist?country=${encodeURIComponent(country)}`);
  return res?.data ?? res;
}

// ─── Appointment APIs ─────────────────────────────────────────────────────────

/** POST /api/v1/admin/visa/appointments */
export async function createVisaAppointment(
  payload: CreateAppointmentPayload
): Promise<VisaAppointment> {
  const res = await apiRequest('/api/v1/admin/visa/appointments', 'POST', payload);
  return res?.data ?? res;
}

/** PUT /api/v1/admin/visa/appointments/{id}/status */
export async function updateAppointmentStatus(
  id: string,
  payload: UpdateStatusPayload
): Promise<VisaAppointment> {
  const res = await apiRequest(`/api/v1/admin/visa/appointments/${id}/status`, 'PUT', payload);
  return res?.data ?? res;
}

/** GET /api/v1/admin/visa/appointments?status=PENDING (status optional) */
export async function getAllVisaAppointments(
  status?: AppointmentStatus
): Promise<VisaAppointment[]> {
  const qs = status ? `?status=${status}` : '';
  const res = await apiRequest(`/api/v1/admin/visa/appointments${qs}`);
  // Backend might return { data: [...] } or plain array
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

/** GET /api/v1/admin/visa/appointments/student/{studentId} */
export async function getStudentVisaAppointments(
  studentId: number | string
): Promise<VisaAppointment[]> {
  const res = await apiRequest(`/api/v1/admin/visa/appointments/student/${studentId}`);
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

// ─── Meeting URL APIs ─────────────────────────────────────────────────────────

export type MeetingSection = 'VISA' | 'FINANCE';

export interface MeetingUrl {
  id?: string | number;
  section: MeetingSection;
  url: string;
  label: string;
  adminId?: number;
  createdAt?: string;
}

/** POST /api/v1/admin/meeting-urls */
export async function saveMeetingUrl(payload: {
  section: MeetingSection;
  url: string;
  label: string;
}): Promise<MeetingUrl> {
  const res = await apiRequest('/api/v1/admin/meeting-urls', 'POST', payload);
  return res?.data ?? res;
}

/** GET /api/v1/admin/meeting-urls */
export async function getMeetingUrls(): Promise<MeetingUrl[]> {
  const res = await apiRequest('/api/v1/admin/meeting-urls');
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

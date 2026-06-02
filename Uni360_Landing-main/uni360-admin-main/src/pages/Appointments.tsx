import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Plus, CheckCircle, AlertCircle,
  XCircle, Loader2, RefreshCw, Search, Globe, FileText,
  User, Edit3, Check, Info, Link, VideoIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAllVisaAppointments,
  createVisaAppointment,
  updateAppointmentStatus,
  getStudentVisaAppointments,
  getMeetingUrls,
  saveMeetingUrl,
  type VisaAppointment,
  type AppointmentStatus,
  type CreateAppointmentPayload,
} from '../services/visaService';
import { api } from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  PENDING:   { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   label: 'Pending' },
  CONFIRMED: { icon: CheckCircle,   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',label: 'Confirmed' },
  COMPLETED: { icon: Check,         color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     label: 'Completed' },
  CANCELLED: { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       label: 'Cancelled' },
};

const ALL_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const COUNTRIES = ['UK', 'Germany'];

const TOAST_DURATION = 3500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function formatTime(timeStr: string) {
  try {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return timeStr; }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }

// ─── Component ────────────────────────────────────────────────────────────────

export const Appointments: React.FC = () => {
  // Data
  const [appointments, setAppointments] = useState<VisaAppointment[]>([]);
  const [students, setStudents] = useState<{ id: number; name: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [selectedAppt, setSelectedAppt] = useState<VisaAppointment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStudentAppts, setShowStudentAppts] = useState(false);
  const [studentAppts, setStudentAppts] = useState<VisaAppointment[]>([]);
  const [studentApptLoading, setStudentApptLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  // Meeting URL state
  const DEFAULT_MEETING_URL = 'https://calendly.com/UNI360°degreetech/30min';
  const [meetingUrl, setMeetingUrl] = useState(DEFAULT_MEETING_URL);
  const [meetingLabel, setMeetingLabel] = useState('Visa Consultation Meeting');
  const [sendMeetingLink, setSendMeetingLink] = useState(true);
  const [meetingUrlLoading, setMeetingUrlLoading] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState<CreateAppointmentPayload>({
    studentId: 0,
    country: '',
    appointmentDate: '',
    appointmentTime: '',
    location: '',
    notes: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Status update form
  const [statusForm, setStatusForm] = useState<{ status: AppointmentStatus; notes: string }>({
    status: 'PENDING',
    notes: '',
  });
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION);
  }, []);

  // ── Fetch all appointments ─────────────────────────────────────────────────

  const fetchAppointments = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const filter = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await getAllVisaAppointments(filter);
      setAppointments(data);
    } catch (err: any) {
      console.error('Failed to fetch visa appointments:', err);
      if (!quiet) addToast('Could not load appointments from server.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, addToast]);

  // ── Fetch students (for dropdown) ─────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/notifications/students/dropdown');
      if (res.data?.data?.students) {
        setStudents(
          res.data.data.students.map((s: any) => ({
            id: Number(s.id),
            name: s.name,
            email: s.email,
          }))
        );
      }
    } catch {
      // non-critical, leave empty
    }
  }, []);

  // ── Fetch saved meeting URLs & pre-fill VISA url ───────────────────────────

  const fetchMeetingUrls = useCallback(async () => {
  try {
    const urls = await getMeetingUrls();
    const visaUrl = urls.find(u => u.section === 'VISA');
    if (visaUrl) {
      // only sync the label, NOT the url — keep the default Google Meet link
      setMeetingLabel(visaUrl.label || 'Visa Consultation Meeting');
    }
  } catch {
      // keep default
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchStudents();
    fetchMeetingUrls();
  }, [statusFilter]); // re-fetch when filter changes

  // ─── Derived stats ────────────────────────────────────────────────────────

  const stats = {
    total:    appointments.length,
    pending:  appointments.filter(a => a.status === 'PENDING').length,
    confirmed:appointments.filter(a => a.status === 'CONFIRMED').length,
    completed:appointments.filter(a => a.status === 'COMPLETED').length,
  };

  // ─── Filtered list ────────────────────────────────────────────────────────

  const filtered = appointments.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.country.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      String(a.studentId).includes(q) ||
      (a.notes || '').toLowerCase().includes(q);
    return matchesSearch;
  });

  // ─── Create appointment ───────────────────────────────────────────────────

  const validateCreate = () => {
    const errs: Record<string, string> = {};
    if (!createForm.studentId) errs.studentId = 'Student is required';
    if (!createForm.country) errs.country = 'Country is required';
    if (!createForm.appointmentDate) errs.appointmentDate = 'Date is required';
    if (!createForm.appointmentTime) errs.appointmentTime = 'Time is required';
    if (!createForm.location.trim()) errs.location = 'Location is required';
    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreate()) return;
    setCreateLoading(true);
    try {
      // 1. Create the appointment
      const created = await createVisaAppointment(createForm);

      // 2. Save / update the meeting URL for VISA section (fire-and-forget)
      if (sendMeetingLink && meetingUrl.trim()) {
        saveMeetingUrl({
          section: 'VISA',
          url: meetingUrl.trim(),
          label: meetingLabel.trim() || 'Visa Consultation Meeting',
        }).catch(err => console.warn('Meeting URL save failed (non-critical):', err));
      }

      setAppointments(prev => [created, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ studentId: 0, country: '', appointmentDate: '', appointmentTime: '', location: '', notes: '' });
      addToast(
        sendMeetingLink
          ? 'Appointment created & meeting link saved! 🔗'
          : 'Embassy appointment created successfully!',
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Failed to create appointment.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Update status ────────────────────────────────────────────────────────

  const openStatusModal = (appt: VisaAppointment) => {
    setSelectedAppt(appt);
    setStatusForm({ status: appt.status, notes: appt.notes || '' });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setStatusLoading(true);
    try {
      const updated = await updateAppointmentStatus(selectedAppt.id, statusForm);
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setShowStatusModal(false);
      setSelectedAppt(null);
      addToast(`Status updated to ${statusForm.status}`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to update status.', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  // ─── Student appointments ─────────────────────────────────────────────────

  const handleViewStudentAppts = async (appt: VisaAppointment) => {
    setSelectedAppt(appt);
    setShowStudentAppts(true);
    setStudentApptLoading(true);
    try {
      const data = await getStudentVisaAppointments(appt.studentId);
      setStudentAppts(data);
    } catch {
      setStudentAppts([]);
      addToast('Could not load student appointments.', 'error');
    } finally {
      setStudentApptLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 relative">

      {/* ── Toast Notifications ───────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
                t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
                                       'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> :
               t.type === 'error'   ? <AlertCircle className="w-4 h-4 shrink-0" /> :
                                      <Info className="w-4 h-4 shrink-0" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold uni-text-primary">Visa Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage embassy visa appointments for students</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAppointments(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="uni-gradient-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </Button>
        </div>
      </motion.div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total',     value: stats.total,     icon: Calendar,     color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Pending',   value: stats.pending,   icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle,  color: 'text-emerald-600',bg: 'bg-emerald-50'},
          { label: 'Completed', value: stats.completed, icon: Check,        color: 'text-blue-600',   bg: 'bg-blue-50'   },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 * i }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by country, location, student ID…"
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', ...ALL_STATUSES] as const).map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? 'uni-gradient-primary' : ''}
            >
              {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ── Appointments List ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading visa appointments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3 text-center"
        >
          <div className="p-5 bg-muted rounded-full">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No appointments found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {searchQuery ? 'Try adjusting your search or filter.' : 'Click "New Appointment" to schedule the first one.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((appt, idx) => {
              const cfg = STATUS_CONFIG[appt.status];
              const StatusIcon = cfg.icon;
              const studentName = students.find(s => s.id === appt.studentId)?.name;
              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                        {/* Left: Country flag + info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-12 h-12 uni-gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                            <Globe className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-base">{appt.country} Visa Appointment</h3>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {studentName ? `${studentName} (ID: ${appt.studentId})` : `Student ID: ${appt.studentId}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(appt.appointmentDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(appt.appointmentTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[200px]">{appt.location}</span>
                              </span>
                            </div>
                            {appt.notes && (
                              <p className="text-xs text-muted-foreground italic line-clamp-1">
                                📝 {appt.notes}
                              </p>
                            )}
                            {/* Meeting link chip — show for all VISA appointments */}
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors w-fit mt-0.5"
                            >
                              <VideoIcon className="w-3 h-3" />
                              Join Meeting
                            </a>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStudentAppts(appt)}
                            className="gap-1.5 text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            History
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStatusModal(appt)}
                            className="gap-1.5 text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Status
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════════════ MODALS ══════════════════════════════════ */}

      {/* ── Create Appointment Modal ────────────────────────────────────────── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 uni-text-accent" />
              Create Embassy Appointment
            </DialogTitle>
            <DialogDescription>
              Schedule a visa embassy appointment for a student
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3 mt-2">
            {/* Student */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Student <span className="text-red-500">*</span></label>
              <select
                className={`w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${createErrors.studentId ? 'border-red-400' : 'border-input'}`}
                value={createForm.studentId || ''}
                onChange={e => {
                  setCreateForm(p => ({ ...p, studentId: Number(e.target.value) }));
                  if (createErrors.studentId) setCreateErrors(p => ({ ...p, studentId: '' }));
                }}
              >
                <option value="">Select student</option>
                {students.length > 0
                  ? students.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)
                  : <option disabled>No students loaded — enter ID manually</option>
                }
              </select>
              {students.length === 0 && (
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Enter student ID manually"
                    className="text-sm"
                    onChange={e => setCreateForm(p => ({ ...p, studentId: Number(e.target.value) }))}
                  />
                </div>
              )}
              {createErrors.studentId && <p className="text-xs text-red-500">{createErrors.studentId}</p>}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Country <span className="text-red-500">*</span></label>
              <select
                className={`w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${createErrors.country ? 'border-red-400' : 'border-input'}`}
                value={createForm.country}
                onChange={e => {
                  setCreateForm(p => ({ ...p, country: e.target.value }));
                  if (createErrors.country) setCreateErrors(p => ({ ...p, country: '' }));
                }}
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {createErrors.country && <p className="text-xs text-red-500">{createErrors.country}</p>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Appointment Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${createErrors.appointmentDate ? 'border-red-400' : 'border-input'}`}
                  value={createForm.appointmentDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setCreateForm(p => ({ ...p, appointmentDate: e.target.value }));
                    if (createErrors.appointmentDate) setCreateErrors(p => ({ ...p, appointmentDate: '' }));
                  }}
                />
                {createErrors.appointmentDate && <p className="text-xs text-red-500">{createErrors.appointmentDate}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Appointment Time <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  className={`w-full p-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${createErrors.appointmentTime ? 'border-red-400' : 'border-input'}`}
                  value={createForm.appointmentTime}
                  onChange={e => {
                    setCreateForm(p => ({ ...p, appointmentTime: e.target.value }));
                    if (createErrors.appointmentTime) setCreateErrors(p => ({ ...p, appointmentTime: '' }));
                  }}
                />
                {createErrors.appointmentTime && <p className="text-xs text-red-500">{createErrors.appointmentTime}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. UK Visa Centre, Mumbai"
                value={createForm.location}
                className={createErrors.location ? 'border-red-400' : ''}
                onChange={e => {
                  setCreateForm(p => ({ ...p, location: e.target.value }));
                  if (createErrors.location) setCreateErrors(p => ({ ...p, location: '' }));
                }}
              />
              {createErrors.location && <p className="text-xs text-red-500">{createErrors.location}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes <span className="text-muted-foreground text-xs">(optional)</span></label>
              <textarea
                rows={3}
                placeholder="e.g. Bring original documents"
                className="w-full p-2.5 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={createForm.notes}
                onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            {/* ── Meeting Link Section ── */}
            <div className="space-y-3 p-4 rounded-xl border border-violet-200 bg-violet-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-violet-600" />
                  <label className="text-sm font-semibold text-violet-800">Meeting Link</label>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setSendMeetingLink(v => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    sendMeetingLink ? 'bg-violet-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      sendMeetingLink ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {sendMeetingLink && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-violet-700">Meeting URL</label>
                    <div className="flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                      <input
                        type="url"
                        className="flex-1 p-2 border border-violet-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                        value={meetingUrl}
                        onChange={e => setMeetingUrl(e.target.value)}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                    {meetingUrl && (
                      <a
                        href={meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <VideoIcon className="w-3 h-3" /> Preview link
                      </a>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-violet-700">Label</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-violet-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                      value={meetingLabel}
                      onChange={e => setMeetingLabel(e.target.value)}
                      placeholder="e.g. Weekly Visa Consultation"
                    />
                  </div>
                  <p className="text-xs text-violet-600 italic">
                    This link will be saved as the VISA section meeting URL.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={createLoading}>
                Cancel
              </Button>
              <Button type="submit" className="uni-gradient-primary gap-2" disabled={createLoading}>
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {createLoading ? 'Creating…' : 'Create Appointment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Update Status Modal ────────────────────────────────────────────── */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 uni-text-accent" />
              Update Appointment Status
            </DialogTitle>
            <DialogDescription>
              {selectedAppt
                ? `${selectedAppt.country} appointment — Student ID ${selectedAppt.studentId}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedAppt && (
            <form onSubmit={handleStatusUpdate} className="space-y-5 mt-1">
              {/* Current status pill */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                <span className="text-sm text-muted-foreground">Current status:</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[selectedAppt.status].bg} ${STATUS_CONFIG[selectedAppt.status].color}`}>
                  {STATUS_CONFIG[selectedAppt.status].label}
                </span>
              </div>

              {/* New status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_STATUSES.map(s => {
                    const c = STATUS_CONFIG[s];
                    const Icon = c.icon;
                    const active = statusForm.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusForm(p => ({ ...p, status: s }))}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          active ? `${c.bg} ${c.color} border-current` : 'border-border hover:border-primary/40 hover:bg-muted/40'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes <span className="text-muted-foreground text-xs">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="e.g. All documents verified"
                  className="w-full p-2.5 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={statusForm.notes}
                  onChange={e => setStatusForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowStatusModal(false)} disabled={statusLoading}>
                  Cancel
                </Button>
                <Button type="submit" className="uni-gradient-primary gap-2" disabled={statusLoading}>
                  {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {statusLoading ? 'Updating…' : 'Update Status'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Student Appointment History Modal ─────────────────────────────── */}
      <Dialog open={showStudentAppts} onOpenChange={setShowStudentAppts}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 uni-text-accent" />
              Student Appointment History
            </DialogTitle>
            <DialogDescription>
              {selectedAppt
                ? `All visa appointments for Student ID ${selectedAppt.studentId}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {studentApptLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : studentAppts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No appointments found for this student.
              </div>
            ) : (
              studentAppts.map(a => {
                const c = STATUS_CONFIG[a.status];
                const Icon = c.icon;
                return (
                  <div key={a.id} className={`p-4 rounded-xl border ${c.bg} space-y-2`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{a.country} Visa</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
                        <Icon className="w-3 h-3" />
                        {c.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(a.appointmentDate)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(a.appointmentTime)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>
                    </div>
                    {a.notes && <p className="text-xs italic text-muted-foreground">📝 {a.notes}</p>}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowStudentAppts(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
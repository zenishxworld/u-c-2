import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Calendar, IndianRupee, AlertCircle,
  CheckCircle, Clock, RefreshCw, Loader2, User, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchAssignedStudentPayments, type Payment } from '@/services/paymentsService';
import { authService } from '@/services/authService';

const statusConfig = {
  PENDING:    { icon: Clock,       color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending'    },
  COMPLETED:  { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200',   label: 'Completed'  },
  FAILED:     { icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200',         label: 'Failed'     },
  PROCESSING: { icon: Clock,       color: 'bg-blue-100 text-blue-800 border-blue-200',      label: 'Processing' },
} as const;

const formatPurpose = (p: string) =>
  p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const formatAmount = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

interface StudentGroup {
  studentId: number;
  studentName: string;
  studentEmail: string;
  payments: Payment[];
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
}

// ─── Payments Modal ──────────────────────────────────────────────────────────

const PaymentsModal: React.FC<{ group: StudentGroup; onClose: () => void }> = ({ group, onClose }) => {
  const initials = group.studentName.split(' ').map((n) => n[0]?.toUpperCase() ?? '').slice(0, 2).join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #2C3539, #3d4b52)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #E08D3C, #c97a2e)' }}>
            {initials || <User className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white capitalize">{group.studentName}</h2>
            <p className="text-sm text-gray-300 truncate">{group.studentEmail}</p>
            <p className="text-xs text-gray-400">Student ID: {group.studentId}</p>
          </div>
          <div className="text-right mr-3">
            <p className="text-xl font-bold text-white">{formatAmount(group.totalAmount)}</p>
            <p className="text-xs text-gray-300">{group.payments.length} transaction{group.payments.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status summary row */}
        <div className="px-6 py-3 flex gap-3 bg-gray-50 border-b border-gray-100">
          {group.completedCount > 0 && <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">{group.completedCount} Completed</span>}
          {group.pendingCount > 0 && <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{group.pendingCount} Pending</span>}
          {group.failedCount > 0 && <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">{group.failedCount} Failed</span>}
        </div>

        {/* Payments list */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {group.payments.map((payment) => {
            const cfg = statusConfig[payment.status as keyof typeof statusConfig];
            const StatusIcon = cfg?.icon ?? Clock;
            return (
              <div key={payment.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 p-2 rounded-lg bg-orange-100 flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{formatPurpose(payment.paymentPurpose)}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(payment.createdAt)}
                    </div>
                    {payment.razorpayOrderId && (
                      <p className="text-xs text-gray-400 font-mono mt-1 truncate">Order: {payment.razorpayOrderId}</p>
                    )}
                    {payment.razorpayPaymentId && (
                      <p className="text-xs text-gray-400 font-mono truncate">Pay ID: {payment.razorpayPaymentId}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">{formatAmount(payment.amount, payment.currency)}</p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <StatusIcon className="w-3 h-3" />
                    <Badge className={`text-xs border ${cfg?.color ?? 'bg-gray-100 text-gray-700'}`}>
                      {cfg?.label ?? payment.status}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const Payments: React.FC = () => {
  const [payments, setPayments]           = useState<Payment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filter, setFilter]               = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null);

  const token = authService.getStoredToken() ?? '';

  const loadPayments = useCallback(async () => {
    if (!token) { setError('Session expired. Please log in again.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setPayments(await fetchAssignedStudentPayments(token)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load payments'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const studentGroups: StudentGroup[] = React.useMemo(() => {
    const map = new Map<number, StudentGroup>();
    payments.forEach((p) => {
      if (!map.has(p.studentId)) {
        map.set(p.studentId, { studentId: p.studentId, studentName: p.studentName ?? `Student ${p.studentId}`, studentEmail: p.studentEmail ?? '—', payments: [], totalAmount: 0, completedCount: 0, pendingCount: 0, failedCount: 0 });
      }
      const g = map.get(p.studentId)!;
      g.payments.push(p); g.totalAmount += p.amount;
      if (p.status === 'COMPLETED') g.completedCount++;
      else if (p.status === 'PENDING') g.pendingCount++;
      else if (p.status === 'FAILED') g.failedCount++;
    });
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.payments[0]?.createdAt ?? 0).getTime() - new Date(a.payments[0]?.createdAt ?? 0).getTime()
    );
  }, [payments]);

  const filteredGroups = studentGroups.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q) || String(g.studentId).includes(q);
    const matchFilter = filter === 'all' || (filter === 'COMPLETED' && g.completedCount > 0) || (filter === 'PENDING' && g.pendingCount > 0) || (filter === 'FAILED' && g.failedCount > 0);
    return matchSearch && matchFilter;
  });

  const totalCompleted = payments.filter((p) => p.status === 'COMPLETED').length;
  const totalPending   = payments.filter((p) => p.status === 'PENDING').length;
  const totalFailed    = payments.filter((p) => p.status === 'FAILED').length;
  const grandTotal     = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uni-text-primary">Payments</h1>
          <p className="text-muted-foreground">Click any student card to view their transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPayments} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} Refresh
        </Button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
            <Button variant="ghost" size="sm" className="ml-auto text-red-600" onClick={loadPayments}>Retry</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Total Volume', value: formatAmount(grandTotal), icon: IndianRupee, color: 'text-orange-500' },
          { label: 'Completed', value: totalCompleted, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending', value: totalPending, icon: Clock, color: 'text-yellow-500' },
          { label: 'Failed', value: totalFailed, icon: AlertCircle, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-5 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </motion.div>

      {/* Search + Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by name, email or student ID…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
        <div className="flex gap-2 flex-wrap">
          {['all', 'COMPLETED', 'PENDING', 'FAILED'].map((s) => (
            <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Loading */}
      {loading && <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>}

      {/* Empty */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No students found</h3>
          <p className="text-sm text-muted-foreground mt-1">{searchQuery || filter !== 'all' ? 'Try adjusting your search or filter.' : 'No payment data yet.'}</p>
        </div>
      )}

      {/* Student Cards */}
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
          <p className="text-sm text-muted-foreground">{filteredGroups.length} student{filteredGroups.length !== 1 ? 's' : ''}</p>
          {filteredGroups.map((group, i) => {
            const initials = group.studentName.split(' ').map((n) => n[0]?.toUpperCase() ?? '').slice(0, 2).join('');
            return (
              <motion.div key={group.studentId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5" onClick={() => setSelectedGroup(group)}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E08D3C, #c97a2e)' }}>
                      {initials || <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 capitalize">{group.studentName}</p>
                      <p className="text-xs text-gray-500 truncate">{group.studentEmail}</p>
                      <p className="text-xs text-gray-400">ID: {group.studentId}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      {group.completedCount > 0 && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">{group.completedCount} completed</span>}
                      {group.pendingCount > 0 && <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{group.pendingCount} pending</span>}
                      {group.failedCount > 0 && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">{group.failedCount} failed</span>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">{formatAmount(group.totalAmount)}</p>
                      <p className="text-xs text-gray-400">{group.payments.length} transaction{group.payments.length !== 1 ? 's' : ''}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Popup Modal */}
      <AnimatePresence>
        {selectedGroup && <PaymentsModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
      </AnimatePresence>
    </div>
  );
};
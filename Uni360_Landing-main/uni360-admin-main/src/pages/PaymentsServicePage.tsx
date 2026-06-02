import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, Clock, RefreshCw, Loader2, Users,
  BarChart3, Download, Filter, ChevronDown, ChevronUp,
  DollarSign, Calendar, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { fetchAssignedStudentPayments, type Payment } from '@/services/paymentsService';

// ─── helpers ────────────────────────────────────────────────────────────────

const parseAmount = (amount: string) =>
  parseFloat(amount.replace(/[€$£,\s]/g, '')) || 0;

const getDaysUntilDue = (dueDate: string) =>
  Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);

const statusConfig = {
  pending:    { icon: Clock,       color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-400',  label: 'Pending'    },
  paid:       { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', label: 'Paid'     },
  overdue:    { icon: AlertCircle, color: 'bg-red-100 text-red-800',        dot: 'bg-red-500',    label: 'Overdue'    },
  processing: { icon: Loader2,     color: 'bg-blue-100 text-blue-800',      dot: 'bg-blue-400',   label: 'Processing' },
} as const;

type SortKey = 'dueDate' | 'amount' | 'status' | 'type';
type SortDir = 'asc' | 'desc';

// ─── component ──────────────────────────────────────────────────────────────

export const PaymentsServicePage: React.FC = () => {
  const [payments, setPayments]               = useState<Payment[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sortKey, setSortKey]                 = useState<SortKey>('dueDate');
  const [sortDir, setSortDir]                 = useState<SortDir>('asc');
  const [showFilters, setShowFilters]         = useState(false);

  const token =
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token') ||
    '';

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignedStudentPayments(token);
      setPayments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // ── sort + filter ─────────────────────────────────────────────────────────

  const filtered = payments
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.type.toLowerCase().includes(q) ||
        (p.university ?? '').toLowerCase().includes(q) ||
        (p.studentName ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === 'dueDate') diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortKey === 'amount')  diff = parseAmount(a.amount) - parseAmount(b.amount);
      if (sortKey === 'type')    diff = a.type.localeCompare(b.type);
      if (sortKey === 'status')  diff = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? diff : -diff;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── analytics ─────────────────────────────────────────────────────────────

  const totalRevenue   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseAmount(p.amount), 0);
  const totalPending   = payments.filter(p => p.status === 'pending').reduce((s, p) => s + parseAmount(p.amount), 0);
  const totalOverdue   = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + parseAmount(p.amount), 0);
  const uniqueStudents = new Set(payments.map(p => p.studentId ?? p.studentName)).size;
  const overdueCount   = payments.filter(p => p.status === 'overdue').length;

  const collectionRate = payments.length
    ? Math.round((payments.filter(p => p.status === 'paid').length / payments.length) * 100)
    : 0;

  // ── export CSV ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const rows = [
      ['ID', 'Type', 'Student', 'University', 'Amount', 'Due Date', 'Status'],
      ...payments.map(p => [
        p.id, p.type,
        p.studentName ?? '',
        p.university ?? '',
        p.amount,
        new Date(p.dueDate).toLocaleDateString(),
        p.status,
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'payments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold uni-text-primary flex items-center gap-3">
            <BarChart3 className="w-8 h-8 uni-text-accent" />
            Payments Service
          </h1>
          <p className="text-muted-foreground mt-1">
            Full overview of all student payments assigned to you
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={loading || payments.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadPayments} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm flex-1">{error}</p>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={loadPayments}>Retry</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analytics Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Collected */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">€{totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <p className="text-xs text-muted-foreground">{collectionRate}% collection rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Amount */}
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">€{totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{payments.filter(p => p.status === 'pending').length} payments awaiting</p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{totalOverdue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{overdueCount} overdue payments</p>
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">With active payments</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Status Distribution ── */}
      {!loading && payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Payment Status Distribution</CardTitle>
              <CardDescription>Visual breakdown across all statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['paid', 'pending', 'overdue', 'processing'] as const).map((status) => {
                  const count = payments.filter(p => p.status === status).length;
                  const pct   = payments.length ? (count / payments.length) * 100 : 0;
                  const cfg   = statusConfig[status];
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="text-sm w-24 capitalize">{cfg.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${cfg.dot}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Search & Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by payment type, student, or university…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                {['all', 'pending', 'paid', 'overdue', 'processing'].map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className="capitalize h-7 text-xs"
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-muted-foreground">Sort by:</span>
                {(['dueDate', 'amount', 'type', 'status'] as SortKey[]).map((key) => (
                  <Button
                    key={key}
                    variant={sortKey === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort(key)}
                    className="h-7 text-xs capitalize flex items-center gap-1"
                  >
                    {key === 'dueDate' ? 'Due Date' : key}
                    {sortKey === key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <CreditCard className="w-14 h-14 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No payments found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No student payments are assigned to you yet.'}
          </p>
        </motion.div>
      )}

      {/* ── Payments Table ── */}
      {!loading && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  All Payments
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({filtered.length} of {payments.length})
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <button className="text-left flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort('type')}>
                  Type {sortKey === 'type' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
                <span>Student</span>
                <button className="text-left flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort('amount')}>
                  Amount {sortKey === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
                <button className="text-left flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort('dueDate')}>
                  Due Date {sortKey === 'dueDate' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
                <button className="text-left flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort('status')}>
                  Status {sortKey === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </div>

              {/* Rows */}
              <div className="divide-y">
                <AnimatePresence>
                  {filtered.map((payment, i) => {
                    const cfg        = statusConfig[payment.status as keyof typeof statusConfig];
                    const StatusIcon = cfg?.icon ?? Clock;
                    const daysUntil  = getDaysUntilDue(payment.dueDate);
                    const isOverdue  = daysUntil < 0;
                    const isSoonDue  = !isOverdue && daysUntil <= 7 && payment.status === 'pending';

                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        {/* Mobile layout */}
                        <div className="md:hidden flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{payment.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.studentName ?? payment.university ?? payment.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(payment.dueDate).toLocaleDateString()}
                              </span>
                              {isOverdue && <Badge className="bg-red-100 text-red-800 text-xs py-0">{Math.abs(daysUntil)}d overdue</Badge>}
                              {isSoonDue  && <Badge className="bg-yellow-100 text-yellow-800 text-xs py-0">{daysUntil}d left</Badge>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{payment.amount}</p>
                            <Badge className={`${cfg?.color} text-xs mt-1`}>{cfg?.label}</Badge>
                          </div>
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden md:grid grid-cols-5 gap-4 items-center">
                          <div>
                            <p className="font-medium text-sm">{payment.type}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {payment.university || payment.description}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm">{payment.studentName ?? '—'}</p>
                          </div>
                          <div className="font-semibold">{payment.amount}</div>
                          <div>
                            <p className="text-sm">{new Date(payment.dueDate).toLocaleDateString()}</p>
                            {isOverdue && (
                              <Badge className="bg-red-100 text-red-800 text-xs mt-0.5">
                                {Math.abs(daysUntil)}d overdue
                              </Badge>
                            )}
                            {isSoonDue && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-0.5">
                                {daysUntil}d left
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${payment.status === 'processing' ? 'animate-spin' : ''}`} />
                            <Badge className={cfg?.color}>{cfg?.label}</Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Payment Detail Modal ── */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPayment && (() => {
            const cfg = statusConfig[selectedPayment.status as keyof typeof statusConfig];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 uni-text-accent" />
                    {selectedPayment.type}
                  </DialogTitle>
                  <DialogDescription>Payment details and processing options</DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</label>
                      <p className="text-2xl font-bold uni-text-primary mt-1">{selectedPayment.amount}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cfg?.color ?? 'bg-gray-100 text-gray-800'}>
                          {cfg?.label ?? selectedPayment.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                      <p className="mt-1 text-sm">{new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service / University</label>
                      <p className="mt-1 text-sm">{selectedPayment.university || selectedPayment.description}</p>
                    </div>
                    {selectedPayment.studentName && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</label>
                        <p className="mt-1 text-sm">{selectedPayment.studentName}</p>
                      </div>
                    )}
                    {selectedPayment.id && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment ID</label>
                        <p className="mt-1 text-sm font-mono text-muted-foreground">{selectedPayment.id}</p>
                      </div>
                    )}
                  </div>

                  {selectedPayment.status === 'pending' && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900">Payment Required</h4>
                        <p className="text-amber-800 text-sm mt-0.5">
                          This payment must be completed by the due date to proceed with the application.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPayment.status === 'overdue' && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-900">Payment Overdue</h4>
                        <p className="text-red-800 text-sm mt-0.5">
                          This payment is past its due date. Please process it immediately to avoid further delays.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    {(selectedPayment.status === 'pending' || selectedPayment.status === 'overdue') && (
                      <Button className="flex-1 uni-gradient-primary text-white">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    {selectedPayment.status === 'paid' && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => selectedPayment.receiptUrl && window.open(selectedPayment.receiptUrl, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Receipt
                      </Button>
                    )}
                    {selectedPayment.status === 'processing' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Payment is being processed…</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
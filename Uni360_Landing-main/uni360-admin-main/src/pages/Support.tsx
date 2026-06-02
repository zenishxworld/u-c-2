import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Inbox,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { apiRequest } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueryReply {
  message: string;
  repliedBy?: number;
  repliedAt?: string;
}

interface AdminQuery {
  id: string | number;
  subject: string;
  message: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  reply?: string;
  repliedBy?: number;
  repliedAt?: string;
  adminId?: number;
  replies?: QueryReply[];
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: "success" | "error" | "info" }
let _toastId = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
}

function getStatusConfig(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
      return { label: "Closed", icon: CheckCircle, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "REPLIED":
      return { label: "Replied", icon: Send, cls: "bg-violet-50 text-violet-700 border-violet-200" };
    case "IN_PROGRESS":
    case "PENDING":
      return { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { label: "Open", icon: Info, cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const Support: React.FC = () => {
  const [queries, setQueries] = useState<AdminQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [seenReplies, setSeenReplies] = useState<Set<number>>(new Set());
  const [formErrors, setFormErrors] = useState<{ subject?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Fetch queries ────────────────────────────────────────────────────────

  const fetchQueries = useCallback(async (quiet = false) => {
    if (quiet) setIsRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiRequest("/api/v1/admin/queries", "GET");
      // Backend may return array directly, or { data: [...] }, or { queries: [...] }
      let list: AdminQuery[] = [];
      if (Array.isArray(res)) list = res;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.queries)) list = res.queries;
      else if (Array.isArray(res?.data?.queries)) list = res.data.queries;
      setQueries(list);
    } catch (err: any) {
      console.error("Failed to fetch queries:", err);
      if (!quiet) addToast("Could not load queries from server.", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => { fetchQueries(); }, []);

  // ── Submit new query ─────────────────────────────────────────────────────

  const validateForm = () => {
    const errs: { subject?: string; message?: string } = {};
    if (!subject.trim()) errs.subject = "Subject is required";
    if (!message.trim()) errs.message = "Message is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("/api/v1/admin/queries", "POST", {
        subject: subject.trim(),
        message: message.trim(),
      });
      const created: AdminQuery = res?.data ?? res;
      setQueries(prev => [created, ...prev]);
      setSubject("");
      setMessage("");
      setShowCreate(false);
      addToast("Query submitted successfully! You'll receive a reply soon.", "success");
    } catch (err: any) {
      addToast(err?.message || "Failed to submit query. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const filtered = queries.filter(q => {
    const term = searchTerm.toLowerCase();
    return (
      q.subject.toLowerCase().includes(term) ||
      q.message.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: queries.length,
    pending: queries.filter(q => {
      const s = (q.status || "").toUpperCase();
      return s !== "RESOLVED" && s !== "CLOSED";
    }).length,
    resolved: queries.filter(q => {
      const s = (q.status || "").toUpperCase();
      return s === "RESOLVED" || s === "CLOSED";
    }).length,
    withReplies: queries.filter(q => !!q.reply).length,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 relative">

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
                t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                t.type === "error"   ? "bg-red-50 border-red-200 text-red-800" :
                                       "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {t.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> :
               t.type === "error"   ? <AlertCircle className="w-4 h-4 shrink-0" /> :
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
          <h1 className="text-3xl font-bold uni-text-primary">Support</h1>
          <p className="text-muted-foreground mt-1">
            Submit queries to superadmin and track replies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQueries(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="uni-gradient-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            New Query
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
          { label: "Total Queries",   value: stats.total,       icon: MessageCircle, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Pending",         value: stats.pending,     icon: Clock,         color: "text-amber-600",  bg: "bg-amber-50"  },
          { label: "Resolved",        value: stats.resolved,    icon: CheckCircle,   color: "text-emerald-600",bg: "bg-emerald-50"},
          { label: "With Replies",    value: stats.withReplies, icon: Send,          color: "text-blue-600",   bg: "bg-blue-50"   },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i }}
          >
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

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search queries by subject or message…"
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {/* ── Query List ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading queries…</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3 text-center"
        >
          <div className="p-5 bg-muted rounded-full">
            <Inbox className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No queries found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {searchTerm
              ? "Try adjusting your search."
              : 'Click "New Query" to submit your first query to superadmin.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((query, idx) => {
              const statusCfg = getStatusConfig(query.status);
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedId === query.id;
              const replies: QueryReply[] = Array.isArray(query.replies) && query.replies.length > 0
                ? query.replies
                : query.reply ? [{ message: query.reply, repliedBy: query.repliedBy, repliedAt: query.repliedAt }] : [];
              const hasReplies = replies.length > 0;
              const hasUnseenReply = hasReplies && !seenReplies.has(query.id);

              return (
                <motion.div
                  key={query.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
                    {/* ── Query Header ── */}
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 uni-gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-base">{query.subject}</h3>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusCfg.label}
                              </span>
                              {hasReplies && (
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${hasUnseenReply ? "bg-violet-600 text-white border-violet-600 animate-pulse" : "bg-violet-50 text-violet-700 border-violet-200"}`}>
                                  <Send className="w-3 h-3" />
                                  {hasUnseenReply ? "New Reply!" : "Seen"}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{query.message}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(query.createdAt)}
                              </span>
                              {query.adminId && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Admin ID: {query.adminId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 gap-1"
                          onClick={() => {
                            const next = isExpanded ? null : query.id;
                            setExpandedId(next);
                            if (next && query.reply) {
                              setSeenReplies(prev => new Set(prev).add(query.id));
                            }
                          }}
                        >
                          {isExpanded ? (
                            <><ChevronUp className="w-4 h-4" /> Hide</>
                          ) : (
                            <><ChevronDown className="w-4 h-4" /> {hasReplies ? "View Replies" : "Details"}</>
                          )}
                        </Button>
                      </div>

                      {/* ── Expanded: full chat thread ── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 border-t pt-4 space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Conversation</p>

                              {/* Original message — sent by admin (right side) */}
                              <div className="flex gap-3 justify-end">
                                <div className="max-w-[75%]">
                                  <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                                    {query.message}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 text-right px-1">
                                    You · {formatDateTime(query.createdAt)}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                  <User className="w-4 h-4" />
                                </div>
                              </div>

                              {/* All replies — received from superadmin (left side) */}
                              {hasReplies ? (
                                replies.map((r, ri) => (
                                  <div key={ri} className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                                      SA
                                    </div>
                                    <div className="max-w-[75%]">
                                      <div className="bg-violet-50 border border-violet-100 text-violet-900 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
                                        {r.message}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 px-1">
                                        Superadmin · {formatDateTime(r.repliedAt)}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                                  <Clock className="w-4 h-4" />
                                  No reply yet — superadmin will respond soon.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════ CREATE QUERY MODAL ══════════════════════════════ */}
      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) { setSubject(""); setMessage(""); setFormErrors({}); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 uni-text-accent" />
              Submit Query to Superadmin
            </DialogTitle>
            <DialogDescription>
              Describe your question or issue clearly. Superadmin will reply directly here.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="query-subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="query-subject"
                placeholder="e.g. Student document rejection process"
                value={subject}
                className={formErrors.subject ? "border-red-400" : ""}
                onChange={e => {
                  setSubject(e.target.value);
                  if (formErrors.subject) setFormErrors(p => ({ ...p, subject: undefined }));
                }}
              />
              {formErrors.subject && (
                <p className="text-xs text-red-500">{formErrors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="query-message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="query-message"
                placeholder="Describe your question in detail…"
                rows={5}
                value={message}
                className={`resize-none ${formErrors.message ? "border-red-400" : ""}`}
                onChange={e => {
                  setMessage(e.target.value);
                  if (formErrors.message) setFormErrors(p => ({ ...p, message: undefined }));
                }}
              />
              {formErrors.message && (
                <p className="text-xs text-red-500">{formErrors.message}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">{message.length} chars</p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="uni-gradient-primary gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? "Submitting…" : "Submit Query"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { getAllQueries, replyToQuery, closeQuery } from "../../services/queryService";

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  OPEN: { label: "Open", color: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800", dot: "bg-blue-400" },
  CLOSED: { label: "Closed", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-400" },
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-400" },
};

const getStatusInfo = (status = "") => {
  const key = status.toUpperCase().replace(/[\s-]/g, "_");
  return STATUS_MAP[key] ?? { label: status || "Unknown", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return dateStr; }
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

const ConfirmCloseDialog = ({ isOpen, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-500" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-11 w-11 rounded-full bg-amber-100 flex items-center justify-center">
              <ShieldExclamationIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">Close this query?</h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                This will mark the query as <span className="font-medium text-gray-700">CLOSED</span> and the admin will no longer be able to receive further replies from this thread.
                <br /><br />
                This action <span className="font-semibold text-red-600">cannot be undone</span>.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-2">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <LockClosedIcon className="h-4 w-4" />
              )}
              Yes, Close Query
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex justify-center items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── ChatModal ────────────────────────────────────────────────────────────────

// ── localStorage helpers for superadmin sent replies ─────────────────────────
const SA_STORAGE_KEY = (queryId) => `sa_replies_${queryId}`;

const loadSaReplies = (queryId) => {
  try {
    return JSON.parse(localStorage.getItem(SA_STORAGE_KEY(queryId)) ?? "[]");
  } catch { return []; }
};

const saveSaReplies = (queryId, replies) => {
  try {
    localStorage.setItem(SA_STORAGE_KEY(queryId), JSON.stringify(replies));
  } catch { }
};

const ChatModal = ({ query, isOpen, onClose, onQueryUpdated }) => {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isClosed = (query?.status ?? "").toUpperCase() === "CLOSED";

  // Superadmin replies persisted in localStorage so they always show
  const [saReplies, setSaReplies] = useState(() => query ? loadSaReplies(query.id) : []);

  // Re-load when query changes (different query opened)
  useEffect(() => {
    if (query?.id) setSaReplies(loadSaReplies(query.id));
  }, [query?.id]);

  // Merge: API replies (admin side) + persisted SA replies, sorted by time
  const apiReplies = (query?.replies ?? query?.messages ?? []).map((m) => ({
    ...m,
    _sa: false,
    _text: m.reply ?? m.message ?? m.text ?? m.content ?? "",
    _time: m.sentAt ?? m.createdAt ?? m.timestamp ?? null,
  }));

  const replies = [
    ...apiReplies,
    ...saReplies.map((r) => ({ ...r, _sa: true, _text: r.reply, _time: r.sentAt })),
  ].sort((a, b) => {
    if (!a._time) return -1;
    if (!b._time) return 1;
    return new Date(a._time) - new Date(b._time);
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [isOpen, replies?.length]);

  useEffect(() => {
    if (isOpen && !isClosed) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, isClosed]);

  if (!isOpen || !query) return null;

  const statusInfo = getStatusInfo(query.status);

  // ── send reply ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setError(null);
    setSending(true);
    const sentText = replyText.trim();
    setReplyText("");
    try {
      await replyToQuery(query.id, sentText);
      // Persist this SA reply to localStorage so it always shows
      const newReply = { reply: sentText, sentAt: new Date().toISOString(), _sa: true };
      const updated = [...loadSaReplies(query.id), newReply];
      saveSaReplies(query.id, updated);
      setSaReplies(updated);
      await onQueryUpdated();
      // Notify sidebar to refresh query count immediately after reply
      window.dispatchEvent(new Event('queriesUpdated'));
    } catch (err) {
      setReplyText(sentText); // restore on failure
      setError(err?.response?.data?.message ?? "Failed to send reply. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── close query ─────────────────────────────────────────────────────────────
  const handleConfirmClose = async () => {
    setClosing(true);
    setError(null);
    try {
      await closeQuery(query.id);
      setShowCloseConfirm(false);
      await onQueryUpdated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to close query. Please try again.");
      setShowCloseConfirm(false);
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative z-10 w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "92vh" }}
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 px-4 sm:px-5 py-4 text-white" style={{ backgroundColor: 'hsl(195, 20%, 19%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate leading-tight">
                    {query.subject ?? query.title ?? "Query"}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/70 text-xs truncate">
                      {query.adminName ?? query.createdBy ?? "Admin"}
                    </span>
                    <span className="text-white/50">·</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/15`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex-shrink-0 ml-2 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>


          </div>

          {/* ── Error banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex-shrink-0 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100 text-sm text-red-700">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-gray-50 scrollbar-hide">

            {/* Original query bubble — always shown first as admin message */}
            {(query.description ?? query.message) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="mt-auto mr-2 flex-shrink-0 h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="max-w-[75%]">
                  <p className="text-[10px] font-medium text-gray-500 mb-1 ml-1">
                    {query.adminName ?? query.createdBy ?? "Admin"}
                    <span className="font-normal text-gray-400 ml-1">· Original Query</span>
                  </p>
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed break-words shadow-sm bg-white text-gray-800 border border-gray-100">
                    {query.description ?? query.message}
                  </div>
                  {query.createdAt && (
                    <p className="text-[10px] mt-1 text-gray-400 text-left">
                      {formatTime(query.createdAt)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No replies yet</p>
                <p className="text-xs text-gray-300 mt-0.5">Start the conversation below</p>
              </div>
            ) : (
              replies.map((msg, idx) => {
                // _sa is set by us when building the merged replies array
                const isSuperAdmin = msg._sa === true;
                const text = msg._text ?? "";
                const time = msg._time ?? null;

                return (
                  <motion.div
                    key={msg.id ?? idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`flex ${isSuperAdmin ? "justify-end" : "justify-start"}`}
                  >
                    {/* Avatar for admin */}
                    {!isSuperAdmin && (
                      <div className="mt-auto mr-2 flex-shrink-0 h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    )}

                    <div className={`max-w-[75%] group`}>
                      {isSuperAdmin && (
                        <p className="text-[10px] font-medium text-primary-400 mb-1 mr-1 text-right">You</p>
                      )}
                      {!isSuperAdmin && (
                        <p className="text-[10px] font-medium text-gray-500 mb-1 ml-1">
                          {query.adminName ?? query.createdBy ?? "Admin"}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${isSuperAdmin
                          ? "bg-primary-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                          }`}
                      >
                        {text}
                      </div>
                      {time && (
                        <p
                          className={`text-[10px] mt-1 text-gray-400 ${isSuperAdmin ? "text-right" : "text-left"
                            }`}
                        >
                          {formatTime(time)}
                        </p>
                      )}
                    </div>

                    {/* Avatar for superadmin */}
                    {isSuperAdmin && (
                      <div className="mt-auto ml-2 flex-shrink-0 h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-600">SA</span>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Closed notice ── */}
          {isClosed && (
            <div className="flex-shrink-0 flex items-center justify-center gap-2 py-3 bg-emerald-50 border-t border-emerald-100 text-sm text-emerald-700">
              <LockClosedIcon className="h-4 w-4" />
              This query is closed and cannot receive new replies.
            </div>
          )}

          {/* ── Input area ── */}
          {!isClosed && (
            <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 sm:px-5 py-3">
              <div className="flex items-end gap-3">
                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="block w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none overflow-hidden transition-all disabled:opacity-50"
                    placeholder="Type your reply and press Enter…"
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      // Auto-grow
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  className="flex-shrink-0 h-11 w-11 rounded-2xl bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md transition-all"
                  aria-label="Send reply"
                >
                  {sending ? (
                    <ArrowPathIcon className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between mt-2.5">
                <p className="text-[11px] text-gray-400">
                  Press <kbd className="px-1 py-0.5 text-[10px] bg-gray-100 rounded border border-gray-200">Enter</kbd> to send,{" "}
                  <kbd className="px-1 py-0.5 text-[10px] bg-gray-100 rounded border border-gray-200">Shift+Enter</kbd> for new line
                </p>
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  disabled={closing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <LockClosedIcon className="h-3.5 w-3.5" />
                  Close Query
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Close Confirmation Dialog ── */}
      <AnimatePresence>
        {showCloseConfirm && (
          <ConfirmCloseDialog
            isOpen={showCloseConfirm}
            onConfirm={handleConfirmClose}
            onCancel={() => setShowCloseConfirm(false)}
            loading={closing}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const { label, color, dot } = getStatusInfo(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

// ─── QueryManagement ──────────────────────────────────────────────────────────

const QueryManagement = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllQueries();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.queries)
            ? data.queries
            : [];
      setQueries(list);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Unable to load queries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const stats = {
    total: queries.length,
    open: queries.filter((q) => (q.status ?? "").toUpperCase() === "OPEN").length,
    inProgress: queries.filter((q) => (q.status ?? "").toUpperCase() === "IN_PROGRESS").length,
    closed: queries.filter((q) => (q.status ?? "").toUpperCase() === "CLOSED").length,
  };

  const filteredQueries = queries.filter((q) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !s ||
      (q.subject ?? q.title ?? "").toLowerCase().includes(s) ||
      (q.adminName ?? q.createdBy ?? "").toLowerCase().includes(s) ||
      (q.description ?? q.message ?? "").toLowerCase().includes(s);
    const matchesStatus =
      statusFilter === "all" ||
      (q.status ?? "").toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Keep selectedQuery in sync whenever the queries list refreshes
  useEffect(() => {
    if (selectedQuery) {
      const fresh = queries.find((q) => q.id === selectedQuery.id);
      if (fresh) setSelectedQuery(fresh);
    }
  }, [queries]);

  const handleOpenChat = (query) => {
    setSelectedQuery(query);
    setShowModal(true);
    // Notify sidebar to refresh query count
    window.dispatchEvent(new Event('queriesUpdated'));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedQuery(null);
  };

  const handleQueryUpdated = async () => {
    const data = await getAllQueries();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.queries)
          ? data.queries
          : [];
    setQueries(list);
    // Immediately sync selectedQuery from the fresh list
    if (selectedQuery) {
      const fresh = list.find((q) => q.id === selectedQuery.id);
      if (fresh) setSelectedQuery(fresh);
    }
    // Notify sidebar to refresh query count
    window.dispatchEvent(new Event('queriesUpdated'));
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Query Management</h1>
              <p className="text-sm text-gray-500">View and respond to admin queries</p>
            </div>
            <button
              onClick={fetchQueries}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Refresh queries"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Queries", value: stats.total, icon: ChatBubbleLeftRightIcon, iconColor: "text-primary", bg: "bg-primary/10", accent: "border-l-4 border-primary" },
            { label: "Open", value: stats.open, icon: ClockIcon, iconColor: "text-foreground", bg: "bg-secondary/40", accent: "border-l-4 border-secondary-dark" },
            { label: "In Progress", value: stats.inProgress, icon: ExclamationTriangleIcon, iconColor: "text-primary-dark", bg: "bg-primary-light/20", accent: "border-l-4 border-primary-light" },
            { label: "Closed", value: stats.closed, icon: CheckCircleIcon, iconColor: "text-foreground", bg: "bg-secondary-light/60", accent: "border-l-4 border-secondary" },
          ].map(({ label, value, icon: Icon, iconColor, bg, accent }) => (
            <div key={label} className={`bg-card ${accent} rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-all hover:-translate-y-0.5`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{loading ? "—" : value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Search queries or admins…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search queries"
              />
            </div>
            <select
              className="sm:w-44 pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <ArrowPathIcon className="h-10 w-10 animate-spin mb-4 text-primary-400" />
            <p className="text-sm">Loading queries…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">{error}</p>
            <button
              onClick={fetchQueries}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-24">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No queries found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {queries.length === 0
                ? "There are no queries at the moment."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredQueries.map((query) => (
                <motion.div
                  key={`card-${query.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {query.subject ?? query.title ?? "Untitled"}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {query.description ?? query.message ?? ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={query.status} />
                    <span className="text-xs text-gray-400">{formatDate(query.createdAt)}</span>
                    <span className="text-xs font-medium text-gray-600">
                      {query.adminName ?? query.createdBy ?? ""}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleOpenChat(query)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      View / Reply
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["Subject & Description", "Admin", "Status", "Created At", "Updated At", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredQueries.map((query) => {
                    const replyCount = (query.replies ?? query.messages ?? []).length;
                    return (
                      <motion.tr
                        key={query.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="px-5 py-4 max-w-xs">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {query.subject ?? query.title ?? "Untitled"}
                          </div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {query.description ?? query.message ?? ""}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {query.adminName ?? query.createdBy ?? "—"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {query.adminEmail ?? query.email ?? ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={query.status} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(query.createdAt)}
                          <div className="text-xs text-gray-400 mt-0.5">{formatTime(query.createdAt)}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(query.updatedAt)}
                          <div className="text-xs text-gray-400 mt-0.5">{formatTime(query.updatedAt)}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenChat(query)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                            {(query.status ?? "").toUpperCase() === "CLOSED" ? "View" : "Reply"}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showModal && (
          <ChatModal
            query={selectedQuery}
            isOpen={showModal}
            onClose={handleModalClose}
            onQueryUpdated={handleQueryUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QueryManagement;
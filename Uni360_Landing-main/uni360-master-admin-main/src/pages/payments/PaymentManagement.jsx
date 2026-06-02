import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

import api from "../../services/api";

const getAllSystemPayments = async () => {
  const token = localStorage.getItem("uni360_access_token") || localStorage.getItem("token");
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/superadmin/dashboard/payments?page=0&size=100`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch (e) {
      errorBody = "Could not parse error body";
    }
    throw new Error(`HTTP ${res.status}: ${errorBody}`);
  }
  
  return res.json();
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalize = (s) => (s || "").toLowerCase();

// ── Status Badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = normalize(status);
  const styles =
    s === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : s === "pending"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        : "bg-red-50 text-red-700 ring-1 ring-red-200";
  const dotColor =
    s === "completed"
      ? "bg-emerald-500"
      : s === "pending"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};

// ── Inline SVG Icons ───────────────────────────────────────────────────────────
const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const RupeeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 4m0-10V6" />
  </svg>
);
const ListIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const TagIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const WarnIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// ── Skeleton & Empty ───────────────────────────────────────────────────────────
const LoadingSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="p-6 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={j}
            className="h-4 bg-slate-100 animate-pulse rounded flex-1"
            style={{ animationDelay: `${(i + j) * 60}ms` }}
          />
        ))}
      </div>
    ))}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
    <svg className="h-12 w-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const PaymentManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [payments, setPayments] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async (retries = 3) => {
      setLoading(true);
      setError(null);
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const token = localStorage.getItem("uni360_access_token") || localStorage.getItem("token");
          const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/superadmin/dashboard/payments?page=0&size=100`;

          const res = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const json = await res.json();

          // Backend sometimes returns 400 with R2DBC error — retry
          if (!res.ok) {
            if (attempt < retries) {
              console.warn(`Payments API attempt ${attempt} failed (${res.status}), retrying in 2s...`);
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            throw new Error(json?.message || `Request failed: ${res.status}`);
          }

          if (cancelled) return;

          const dataBlock = json?.data ?? json;

          let list = [];
          if (Array.isArray(dataBlock?.student_payments)) {
            list = dataBlock.student_payments.flatMap((s) => s.payments || []);
          } else if (Array.isArray(dataBlock?.payments)) {
            list = dataBlock.payments;
          } else if (Array.isArray(dataBlock)) {
            list = dataBlock;
          }

          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setPayments(list);
          setStudentGroups(Array.isArray(dataBlock?.student_payments) ? dataBlock.student_payments : []);
          setSummary(dataBlock);
          setLoading(false);
          return; // success — stop retrying
        } catch (err) {
          if (err.name === "AbortError" || cancelled) return;
          if (attempt === retries) {
            setError(err?.message || "Failed to load payments. Please try again.");
          }
        }
      }
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("uni360_access_token") || localStorage.getItem("token");
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/superadmin/dashboard/payments?page=0&size=100`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Request failed: ${res.status}`);

      const dataBlock = json?.data ?? json;

      let list = [];
      if (Array.isArray(dataBlock?.student_payments)) {
        list = dataBlock.student_payments.flatMap((s) => s.payments || []);
      } else if (Array.isArray(dataBlock?.payments)) {
        list = dataBlock.payments;
      } else if (Array.isArray(dataBlock)) {
        list = dataBlock;
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setPayments(list);
      setStudentGroups(Array.isArray(dataBlock?.student_payments) ? dataBlock.student_payments : []);
      setSummary(dataBlock);
    } catch (err) {
      setError(err?.message || "Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalCompleted =
    summary?.total_completed ??
    payments.filter((p) => normalize(p.status) === "completed").length;
  const totalPending =
    summary?.total_pending ??
    payments.filter((p) => normalize(p.status) === "pending").length;
  const totalAll = summary?.total ?? payments.length;
  const breakdown = summary?.breakdown_by_type ?? {};

  const completedRevenue = payments
    .filter((p) => normalize(p.status) === "completed")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const pendingAmount = payments
    .filter((p) => normalize(p.status) === "pending")
    .reduce((s, p) => s + (p.amount || 0), 0);

  // ── Filtered list for Transactions tab ────────────────────────────────────
  const filteredPayments = payments.filter((p) => {
    const matchStatus =
      statusFilter === "ALL" ||
      normalize(p.status) === normalize(statusFilter);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (p.studentName || "").toLowerCase().includes(q) ||
      (p.studentEmail || "").toLowerCase().includes(q) ||
      (p.paymentPurpose || "").toLowerCase().includes(q) ||
      (p.id || "").toLowerCase().includes(q) ||
      (p.razorpayOrderId || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportToXLSX = () => {
    const rows = filteredPayments.map((t) => ({
      "Transaction ID": t.id || "",
      "Student Name": t.studentName || "",
      "Student Email": t.studentEmail || "",
      "Payment Purpose": t.paymentPurpose || "",
      "Amount (₹)": t.amount || 0,
      Currency: t.currency || "INR",
      Status: t.status || "",
      "Razorpay Order ID": t.razorpayOrderId || "",
      "Razorpay Payment ID": t.razorpayPaymentId || "",
      "Reference ID": t.referenceId || "",
      "Created At": fmtDateTime(t.createdAt),
      "Updated At": fmtDateTime(t.updatedAt),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [36, 22, 32, 24, 12, 10, 12, 34, 34, 16, 22, 22].map(
      (wch) => ({ wch })
    );
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `Payments_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Total Payments",
      value: totalAll.toLocaleString(),
      sub: "All records",
      Icon: ListIcon,
      iconColor: "text-primary",
      bg: "bg-primary/10",
      accent: "border-l-4 border-primary",
    },
    {
      label: "Completed",
      value: totalCompleted.toLocaleString(),
      sub: fmt(completedRevenue) + " collected",
      Icon: CheckIcon,
      iconColor: "text-primary-dark",
      bg: "bg-primary-light/20",
      accent: "border-l-4 border-primary-light",
    },
    {
      label: "Pending",
      value: totalPending.toLocaleString(),
      sub: fmt(pendingAmount) + " awaiting",
      Icon: ClockIcon,
      iconColor: "text-foreground",
      bg: "bg-secondary/40",
      accent: "border-l-4 border-secondary-dark",
    },
    {
      label: "Revenue Collected",
      value: fmt(completedRevenue),
      sub: "From completed only",
      Icon: RupeeIcon,
      iconColor: "text-foreground",
      bg: "bg-secondary-light/60",
      accent: "border-l-4 border-secondary",
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", Icon: ChartIcon },
    { id: "transactions", label: "Transactions", Icon: ListIcon },
    { id: "breakdown", label: "By Type", Icon: TagIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Payments &amp; Transactions
            </h1>
            {summary && !loading && (
              <p className="text-sm text-slate-500 mt-0.5">
                {totalAll} total &middot; {totalCompleted} completed &middot;{" "}
                {totalPending} pending
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={exportToXLSX}
              disabled={loading || payments.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
            >
              <DownloadIcon className="h-4 w-4" />
              Export XLSX
            </button>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <WarnIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchPayments}
              className="ml-auto text-red-600 underline font-medium hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`bg-card rounded-2xl border border-border ${s.accent} p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {loading ? (
                      <span className="inline-block w-20 h-7 bg-muted animate-pulse rounded-md" />
                    ) : (
                      s.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-xl ${s.bg}`}>
                  <s.Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <t.Icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Recent 5 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Transactions
                </h2>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </button>
              </div>
              {loading ? (
                <LoadingSkeleton rows={5} cols={6} />
              ) : payments.length === 0 ? (
                <EmptyState message="No payments found." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {["Student", "Email", "Purpose", "Amount", "Status", "Date"].map(
                          (h) => (
                            <th key={h} className="px-6 py-3 text-left whitespace-nowrap">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-900 whitespace-nowrap">
                            {t.studentName || "—"}
                          </td>
                          <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                            {t.studentEmail || "—"}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              {t.paymentPurpose || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            {fmt(t.amount)}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                            {fmtDate(t.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending highlight */}
            {!loading &&
              payments.filter((p) => normalize(p.status) === "pending").length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-100 bg-amber-50">
                    <ClockIcon className="h-4 w-4 text-amber-600" />
                    <h2 className="text-base font-semibold text-amber-900">
                      Pending Payments
                      <span className="ml-2 text-sm font-normal text-amber-600">
                        (
                        {
                          payments.filter((p) => normalize(p.status) === "pending")
                            .length
                        }
                        )
                      </span>
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-amber-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {["Student", "Email", "Purpose", "Amount", "Order ID", "Date"].map(
                            (h) => (
                              <th key={h} className="px-6 py-3 text-left whitespace-nowrap">
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {payments
                          .filter((p) => normalize(p.status) === "pending")
                          .map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-amber-50/40 transition-colors"
                            >
                              <td className="px-6 py-3 font-medium text-slate-900 whitespace-nowrap">
                                {t.studentName || "—"}
                              </td>
                              <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                                {t.studentEmail || "—"}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                  {t.paymentPurpose || "—"}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                {fmt(t.amount)}
                              </td>
                              <td className="px-6 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                                {t.razorpayOrderId || "—"}
                              </td>
                              <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                                {fmtDate(t.createdAt)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ══ TRANSACTIONS TAB ════════════════════════════════════════════════ */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 flex-1">
                  All Transactions
                  {!loading && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({filteredPayments.length} payments · {studentGroups.length} students)
                    </span>
                  )}
                </h2>
                <input
                  type="text"
                  placeholder="Search name, email, purpose, ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {!loading && filteredPayments.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                  <span>
                    Showing {filteredPayments.length} of {payments.length} transactions
                  </span>
                  <button
                    onClick={exportToXLSX}
                    className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Export visible rows
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <LoadingSkeleton rows={8} cols={7} />
            ) : filteredPayments.length === 0 ? (
              <EmptyState message="No transactions match your filters." />
            ) : (
              (() => {
                // Group filtered payments by studentId
                const grouped = {};
                filteredPayments.forEach((p) => {
                  const key = p.studentId || "unknown";
                  if (!grouped[key]) {
                    grouped[key] = {
                      studentName: p.studentName || "Unknown Student",
                      studentEmail: p.studentEmail || "",
                      studentId: p.studentId,
                      payments: [],
                    };
                  }
                  grouped[key].payments.push(p);
                });
                const groups = Object.values(grouped).sort((a, b) =>
                  a.studentName.localeCompare(b.studentName)
                );

                return groups.map((group) => {
                  const completedCount = group.payments.filter(
                    (p) => normalize(p.status) === "completed"
                  ).length;
                  const pendingCount = group.payments.filter(
                    (p) => normalize(p.status) === "pending"
                  ).length;
                  const totalAmount = group.payments.reduce(
                    (s, p) => s + (p.amount || 0),
                    0
                  );

                  return (
                    <div
                      key={group.studentId}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Student Header */}
                      <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                        <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm uppercase shadow-sm flex-shrink-0">
                          {group.studentName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {group.studentName}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {group.studentEmail || `Student ID: ${group.studentId}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {fmt(totalAmount)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {group.payments.length} payment{group.payments.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            {completedCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {completedCount}
                              </span>
                            )}
                            {pendingCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {pendingCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment Rows */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {["Purpose", "Amount", "Status", "Order ID", "Payment ID", "Date"].map(
                                (h) => (
                                  <th key={h} className="px-6 py-2 text-left whitespace-nowrap">
                                    {h}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {group.payments.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                    {t.paymentPurpose || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                  {fmt(t.amount)}
                                  <span className="ml-1 text-xs font-normal text-slate-400">
                                    {t.currency || "INR"}
                                  </span>
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <StatusBadge status={t.status} />
                                </td>
                                <td className="px-6 py-2.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                                  {t.razorpayOrderId ? (
                                    <span title={t.razorpayOrderId}>
                                      {t.razorpayOrderId.slice(0, 18)}…
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="px-6 py-2.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                                  {t.razorpayPaymentId ? (
                                    <span title={t.razorpayPaymentId}>
                                      {t.razorpayPaymentId.slice(0, 18)}…
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-2.5 text-slate-500 whitespace-nowrap">
                                  {fmtDate(t.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        )}

        {/* ══ BY TYPE TAB ═════════════════════════════════════════════════════ */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">
                  Breakdown by Payment Type
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Transaction count and amount per category
                </p>
              </div>
              {loading ? (
                <LoadingSkeleton rows={6} cols={3} />
              ) : Object.keys(breakdown).length === 0 ? (
                <EmptyState message="No breakdown data available." />
              ) : (
                <div className="p-6 space-y-4">
                  {Object.entries(breakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const maxCount = Math.max(...Object.values(breakdown));
                      const pct = Math.round((count / maxCount) * 100);
                      const typePayments = payments.filter(
                        (p) => p.paymentPurpose === type
                      );
                      const typeAmount = typePayments.reduce(
                        (s, p) => s + (p.amount || 0),
                        0
                      );
                      const typeCompleted = typePayments.filter(
                        (p) => normalize(p.status) === "completed"
                      ).length;
                      const typePending = typePayments.filter(
                        (p) => normalize(p.status) === "pending"
                      ).length;

                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {type}
                              </span>
                              <span className="text-xs text-slate-400">
                                {count} txn{count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              {typeCompleted > 0 && (
                                <span className="text-emerald-600 font-medium">
                                  {typeCompleted} completed
                                </span>
                              )}
                              {typePending > 0 && (
                                <span className="text-amber-600 font-medium">
                                  {typePending} pending
                                </span>
                              )}
                              <span className="font-semibold text-slate-800">
                                {fmt(typeAmount)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Per-type cards */}
            {!loading && Object.keys(breakdown).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(breakdown).map((type) => {
                  const typePayments = payments.filter(
                    (p) => p.paymentPurpose === type
                  );
                  if (typePayments.length === 0) return null;
                  return (
                    <div
                      key={type}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <span className="text-sm font-semibold text-slate-800">
                          {type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {typePayments.length} records
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {typePayments.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {t.studentName || "—"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {t.studentEmail || ""} &middot; {fmtDate(t.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-900">
                                {fmt(t.amount)}
                              </span>
                              <StatusBadge status={t.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentManagement;
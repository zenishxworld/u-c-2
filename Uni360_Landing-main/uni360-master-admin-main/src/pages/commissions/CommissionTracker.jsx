import React, { useState, useEffect, useCallback } from "react";
import {
  CurrencyPoundIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  XMarkIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import {
  getEarnedCommissions,
  getCommissionStats,
  getAllUniversityCommissionRates,
  setUniversityCommissionRate,
} from "../../services/commissionService";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount ?? 0
  );

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const safeArray = (data, ...keys) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", Icon: ClockIcon },
    paid: { bg: "bg-green-100", text: "text-green-800", Icon: CheckCircleIcon },
    approved: { bg: "bg-primary-100", text: "text-purple-800", Icon: CheckCircleIcon },
    cancelled: { bg: "bg-red-100", text: "text-red-800", Icon: XCircleIcon },
    processing: { bg: "bg-blue-100", text: "text-blue-800", Icon: ClockIcon },
    completed: { bg: "bg-green-100", text: "text-green-800", Icon: CheckCircleIcon },
  };
  const { bg, text, Icon } = map[status?.toLowerCase()] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Set Commission Rate Modal
// ─────────────────────────────────────────────────────────────────────────────
const SetRateModal = ({ university, onClose, onSaved }) => {
  const [rate, setRate] = useState(university?.commissionRate ?? "");
  const [description, setDescription] = useState(university?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (rate === "" || isNaN(Number(rate))) {
      setError("Please enter a valid commission rate.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setUniversityCommissionRate(university._id || university.id, {
        commissionRate: Number(rate),
        description,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save rate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Set Commission Rate</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-medium text-gray-900">{university?.universityName || university?.name}</span>
          </p>
          {error && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 12.50"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Premium partnership rate 2024"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              Save Rate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Commission Details Modal
// ─────────────────────────────────────────────────────────────────────────────
const CommissionDetailsModal = ({ commission, onClose }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-screen items-end justify-center pt-4 px-2 pb-4 text-center sm:block sm:p-0">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div className="inline-block w-full max-w-[95vw] sm:max-w-lg align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[90dvh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Commission Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Student Name", commission.studentName],
                ["Assigned Admin", commission.assignedAdminName || "No admin assigned yet"],
                ["University", commission.universityName || commission.university],
                ["Intake", commission.intake],
                ["Tuition Fee", formatCurrency(commission.paymentAmount ?? commission.tuitionFee)],
                ["Commission Rate", `${commission.commissionRate ?? commission.rate ?? 0}%`],
                ["Commission Earned", `₹${(commission.commissionAmount ?? commission.commissionAmount_earned ?? commission.amount ?? 0).toLocaleString('en-IN')}`],
                ["Date", formatDate(commission.completedAt || commission.dateCreated || commission.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <p className="mt-1 text-sm text-gray-900">{value ?? "—"}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <StatusBadge status={commission.status} />
              </div>
            </div>
            {commission.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{commission.description}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Mobile commission card
// ─────────────────────────────────────────────────────────────────────────────
const MobileCommissionCard = ({ commission, onView }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-base font-semibold text-gray-900 truncate">
          {commission.studentName}
        </div>
        <div className="text-sm text-gray-600 truncate">
          {commission.universityName || commission.university}
        </div>
      </div>
      <button
        onClick={() => onView(commission)}
        className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        aria-label={`View details for ${commission.studentName}`}
      >
        <EyeIcon className="h-5 w-5 text-primary-600" />
      </button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="text-xs text-gray-500">Admin</div>
      <div className="text-sm text-gray-900">{commission.assignedAdminName || "No admin assigned yet"}</div>
      <div className="text-xs text-gray-500">Earned</div>
      <div className="text-sm font-semibold text-green-600">
        ₹{(commission.commissionAmount ?? commission.commissionAmount_earned ?? commission.amount ?? 0).toLocaleString('en-IN')}
      </div>
      <div className="text-xs text-gray-500">Rate</div>
      <div className="text-sm text-gray-900">{commission.commissionRate ?? commission.rate ?? 0}%</div>
      <div className="text-xs text-gray-500">Date</div>
      <div className="text-sm text-gray-900 flex items-center">
        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
        {formatDate(commission.completedAt || commission.dateCreated || commission.createdAt)}
      </div>
      <div className="text-xs text-gray-500">Status</div>
      <div><StatusBadge status={commission.status} /></div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const CommissionTracker = () => {
  // ── tabs ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("commissions"); // commissions | universities

  // ── commissions tab state ───────────────────────────────────────────────────
  const [commissions, setCommissions] = useState([]);
  const [allCommissions, setAllCommissions] = useState([]); // unfiltered, for filter dropdowns
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissionsError, setCommissionsError] = useState(null);

  // ── stats state ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ── university rates tab state ───────────────────────────────────────────────
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [universitiesError, setUniversitiesError] = useState(null);
  const [rateModalUniversity, setRateModalUniversity] = useState(null);

  // ── filters ──────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ search: "", status: "", university: "", adminName: "", intakeSeason: "" });

  // ── detail modal ─────────────────────────────────────────────────────────────
  const [selectedCommission, setSelectedCommission] = useState(null);

  // ── fetch commissions (d) ────────────────────────────────────────────────────
  const fetchCommissions = useCallback(async () => {
    setLoadingCommissions(true);
    setCommissionsError(null);
    try {
      const data = await getEarnedCommissions();
      const list = safeArray(data, "data", "commissions", "result");
      setAllCommissions(list);
      setCommissions(list);
    } catch (err) {
      setCommissionsError(err.message || "Failed to load commissions.");
    } finally {
      setLoadingCommissions(false);
    }
  }, []);

  // ── fetch stats (e) ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getCommissionStats();
      setStats(data?.data ?? data);
    } catch {
      // stats are non-critical; silently ignore
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── fetch university rates (c) ────────────────────────────────────────────────
  const fetchUniversities = useCallback(async () => {
    setLoadingUniversities(true);
    setUniversitiesError(null);
    try {
      const data = await getAllUniversityCommissionRates();
      setUniversities(safeArray(data, "data", "universities", "result"));
    } catch (err) {
      setUniversitiesError(err.message || "Failed to load university rates.");
    } finally {
      setLoadingUniversities(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
    fetchStats();
    fetchUniversities();
  }, [fetchCommissions, fetchStats, fetchUniversities]);

  // ── client-side filtering ────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = allCommissions;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.studentName || "").toLowerCase().includes(q) ||
          (c.universityName || c.university || "").toLowerCase().includes(q) ||
          (c.assignedAdminName || "").toLowerCase().includes(q)
      );
    }
    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }
    if (filters.university) {
      filtered = filtered.filter(
        (c) => (c.universityName || c.university) === filters.university
      );
    }
    if (filters.adminName) {
      filtered = filtered.filter(
        (c) => (c.assignedAdminName || "") === filters.adminName
      );
    }
    if (filters.intakeSeason) {
      filtered = filtered.filter(
        (c) => (c.intakeSeasons || c.intake || "") === filters.intakeSeason
      );
    }
    setCommissions(filtered);
  }, [filters, allCommissions]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // ── unique filter options derived from real data ──────────────────────────────
  const uniqueStatuses = [...new Set(allCommissions.map((c) => c.status).filter(Boolean))];
  const uniqueUniversities = [
    ...new Set(allCommissions.map((c) => c.universityName || c.university).filter(Boolean)),
  ];
  const uniqueAdmins = [
    ...new Set(allCommissions.map((c) => c.assignedAdminName).filter(Boolean)),
  ];
  const uniqueIntakeSeasons = [
    ...new Set(allCommissions.map((c) => c.intakeSeasons || c.intake).filter(Boolean)),
  ];

  // ── export ───────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const exportData = commissions.map((c) => ({
      "Student Name": c.studentName,
      "Assigned Admin": c.assignedAdminName || "No admin assigned yet",
      University: c.universityName || c.university,
      Intake: c.intake,
      "Payment Amount": c.paymentAmount ?? c.tuitionFee ?? 0,
      "Commission Rate (%)": c.commissionRate ?? c.rate ?? 0,
      "Commission Earned": c.commissionAmount_earned ?? c.amount ?? 0,
      Status: c.status,
      Date: c.completedAt || c.dateCreated || c.createdAt,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commissions");
    XLSX.writeFile(wb, `Commissions_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-4 px-3 sm:px-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commission &amp; Revenue Management
          </h1>
          <p className="text-sm text-gray-600">Track and manage university commissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchCommissions(); fetchStats(); fetchUniversities(); }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${loadingCommissions ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Cards (from API e) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          {
            title: "Total Earned",
            value: loadingStats ? "…" : formatCurrency(stats?.totalCommissionEarned ?? 0),
            Icon: BanknotesIcon,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            accent: "border-l-4 border-primary",
          },
          {
            title: "Completed Apps",
            value: loadingStats ? "…" : (stats?.totalCompletedApplications ?? 0),
            Icon: CheckCircleIcon,
            iconBg: "bg-primary-light/20",
            iconColor: "text-primary-dark",
            accent: "border-l-4 border-primary-light",
          },
          {
            title: "Universities",
            value: loadingStats ? "…" : (stats?.totalUniversitiesWithRates ?? 0),
            Icon: BuildingLibraryIcon,
            iconBg: "bg-secondary/40",
            iconColor: "text-foreground",
            accent: "border-l-4 border-secondary-dark",
          },
          {
            title: "Pending",
            value: loadingStats ? "…" : allCommissions.filter((c) => c.status === "pending").length,
            Icon: ClockIcon,
            iconBg: "bg-secondary-light/60",
            iconColor: "text-foreground",
            accent: "border-l-4 border-secondary",
          },
          {
            title: "Commissions",
            value: loadingStats ? "…" : allCommissions.length,
            Icon: ChartBarIcon,
            iconBg: "bg-primary/15",
            iconColor: "text-primary-dark",
            accent: "border-l-4 border-primary-dark",
          },
        ].map(({ title, value, Icon, iconBg, iconColor, accent }) => (
          <div key={title} className={`bg-card overflow-hidden shadow rounded-lg ${accent} hover:shadow-md transition-all hover:-translate-y-0.5`}>
            <div className="p-4 flex items-center">
              <div className={`flex-shrink-0 ${iconBg} rounded-lg p-2`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
                <dd className="text-lg font-bold text-foreground">{value}</dd>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Commission by University (from stats) ── */}
      {stats?.commissionByUniversity &&
        Object.keys(stats.commissionByUniversity).length > 0 && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Commission by University
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(stats.commissionByUniversity).map(([uni, amount]) => (
                <div key={uni} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-700 truncate mr-2">{uni}</span>
                  <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {[
            { id: "commissions", label: "Earned Commissions" },
            { id: "universities", label: "University Rates" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === id
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: Earned Commissions
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "commissions" && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Search */}
              <div className="relative lg:col-span-2 xl:col-span-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student, university, admin…"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Admin Name filter */}
              <select
                value={filters.adminName}
                onChange={(e) => handleFilterChange("adminName", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Admins</option>
                {uniqueAdmins.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              {/* Intake Season filter */}
              <select
                value={filters.intakeSeason}
                onChange={(e) => handleFilterChange("intakeSeason", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Intakes</option>
                {uniqueIntakeSeasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* University filter */}
              <select
                value={filters.university}
                onChange={(e) => handleFilterChange("university", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Universities</option>
                {uniqueUniversities.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>

              {/* Export */}
              <button
                onClick={handleExport}
                disabled={commissions.length === 0}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export XLSX
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 sm:p-6">
            {loadingCommissions ? (
              <div className="text-center py-12">
                <ArrowPathIcon className="mx-auto h-8 w-8 text-primary-600 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading commissions…</p>
              </div>
            ) : commissionsError ? (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center gap-2 text-sm text-red-700">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                {commissionsError}
                <button
                  onClick={fetchCommissions}
                  className="ml-auto underline text-red-600 hover:text-red-800"
                >
                  Retry
                </button>
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyPoundIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No commissions found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Student / University", "Admin", "Payment Amt", "Commission Earned", "Rate", "Date", "Status", ""].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissions.map((c, i) => (
                        <tr key={c._id || c.id || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{c.studentName}</div>
                            <div className="text-sm text-gray-500">{c.universityName || c.university}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                            {c.assignedAdminName || "No admin assigned yet"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(c.paymentAmount ?? c.tuitionFee)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₹{(c.commissionAmount ?? c.commissionAmount_earned ?? c.amount ?? 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {c.commissionRate ?? c.rate ?? 0}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(c.completedAt || c.dateCreated || c.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedCommission(c)}
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {commissions.map((c, i) => (
                    <MobileCommissionCard
                      key={c._id || c.id || i}
                      commission={c}
                      onView={setSelectedCommission}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: University Rates
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "universities" && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                University Commission Rates
              </h2>
              <span className="text-sm text-gray-500">{universities.length} universities</span>
            </div>

            {loadingUniversities ? (
              <div className="text-center py-12">
                <ArrowPathIcon className="mx-auto h-8 w-8 text-primary-600 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading university rates…</p>
              </div>
            ) : universitiesError ? (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center gap-2 text-sm text-red-700">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                {universitiesError}
                <button
                  onClick={fetchUniversities}
                  className="ml-auto underline text-red-600 hover:text-red-800"
                >
                  Retry
                </button>
              </div>
            ) : universities.length === 0 ? (
              <div className="text-center py-12">
                <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No universities found</h3>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["University", "Commission Rate", "Description", "Action"].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {universities.map((u, i) => (
                        <tr key={u._id || u.id || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {u.universityName || u.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-primary-100 text-primary-800">
                              {u.commissionRate ?? "—"}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {u.description || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setRateModalUniversity(u)}
                              className="inline-flex items-center text-primary-600 hover:text-primary-900 font-medium"
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" />
                              Edit Rate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {universities.map((u, i) => (
                    <div key={u._id || u.id || i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.universityName || u.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{u.description || "No description"}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-primary-100 text-primary-800 whitespace-nowrap">
                          {u.commissionRate ?? "—"}%
                        </span>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => setRateModalUniversity(u)}
                          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-900"
                        >
                          <PencilSquareIcon className="h-4 w-4 mr-1" />
                          Edit Rate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Commission Details Modal ── */}
      {selectedCommission && (
        <CommissionDetailsModal
          commission={selectedCommission}
          onClose={() => setSelectedCommission(null)}
        />
      )}

      {/* ── Set Rate Modal ── */}
      {rateModalUniversity && (
        <SetRateModal
          university={rateModalUniversity}
          onClose={() => setRateModalUniversity(null)}
          onSaved={() => {
            fetchUniversities();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default CommissionTracker;
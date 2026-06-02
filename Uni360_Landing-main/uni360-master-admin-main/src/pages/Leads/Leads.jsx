// src/pages/Leads/Leads.jsx
import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api.js";
import {
    Loader2, Search, RefreshCw, Phone, Mail, Filter, X, Download,
} from "lucide-react";


// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    NEW: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
};

const SUBJECT_LABELS = {
    DOCUMENT: "Documents",
    VISA: "Visa",
    ADMISSION: "Admission",
    SCHOLARSHIP: "Scholarship",
    OTHER: "Other",
};

const COUNTRY_LABELS = {
    both: "Germany & UK",
    germany: "Germany",
    uk: "UK",
};

const STATUS_OPTIONS = ["ALL", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
        {status?.replace("_", " ") ?? "—"}
    </span>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Leads = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatus] = useState("ALL");
    const [subjectFilter, setSubject] = useState("ALL");
    const [countryFilter, setCountry] = useState("ALL");

    const fetchContacts = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/api/v1/superadmin/contacts");
            const data = res.data;
            const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            setContacts([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load leads.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContacts(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return contacts.filter((c) => {
            if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
            if (subjectFilter !== "ALL" && c.subject !== subjectFilter) return false;
            if (countryFilter !== "ALL" && c.country !== countryFilter) return false;
            if (q && !(
                c.firstName?.toLowerCase().includes(q) ||
                c.lastName?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.includes(q) ||
                c.message?.toLowerCase().includes(q)
            )) return false;
            return true;
        });
    }, [contacts, search, statusFilter, subjectFilter, countryFilter]);

    const stats = useMemo(() => ({
        total: contacts.length,
        new: contacts.filter((c) => c.status === "NEW").length,
        inProgress: contacts.filter((c) => c.status === "IN_PROGRESS").length,
        resolved: contacts.filter((c) => c.status === "RESOLVED").length,
    }), [contacts]);

    const clearFilters = () => { setSearch(""); setStatus("ALL"); setSubject("ALL"); setCountry("ALL"); };
    const exportToExcel = () => {
        const rows = filtered.map((c, i) => ({
            "#": i + 1,
            "First Name": c.firstName || "",
            "Last Name": c.lastName || "",
            "Email": c.email || "",
            "Phone": c.phone || "",
            "Country": COUNTRY_LABELS[c.country] ?? c.country ?? "",
            "Subject": SUBJECT_LABELS[c.subject] ?? c.subject ?? "",
            "Message": c.message || "",
            "Status": c.status?.replace("_", " ") || "",
            "Date": formatDate(c.createdAt),
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        XLSX.writeFile(wb, `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };
    const hasFilters = search || statusFilter !== "ALL" || subjectFilter !== "ALL" || countryFilter !== "ALL";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C3539]">Leads</h1>
                        <p className="text-sm text-gray-500 mt-1">Contact form submissions from students</p>
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                        <button onClick={fetchContacts} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-[#E08D3C] hover:text-[#E08D3C] text-sm font-medium text-gray-700 transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <button onClick={exportToExcel} disabled={filtered.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600 text-sm font-medium text-white transition-colors disabled:opacity-50">
                            <Download className="w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total Leads", value: stats.total, color: "text-foreground", bg: "bg-card", accent: "border-l-4 border-primary" },
                        { label: "New", value: stats.new, color: "text-primary", bg: "bg-primary/10", accent: "border-l-4 border-primary" },
                        { label: "In Progress", value: stats.inProgress, color: "text-foreground", bg: "bg-secondary/40", accent: "border-l-4 border-secondary-dark" },
                        { label: "Resolved", value: stats.resolved, color: "text-primary-dark", bg: "bg-primary-light/20", accent: "border-l-4 border-primary-light" },
                    ].map((s) => (
                        <div key={s.label} className={`${s.bg} ${s.accent} rounded-2xl border border-border p-4 hover:shadow-md transition-all hover:-translate-y-0.5`}>
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search by name, email, phone, message..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#E08D3C] focus:ring-1 focus:ring-[#E08D3C]" />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#E08D3C] bg-white">
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</option>)}
                        </select>
                        <select value={subjectFilter} onChange={(e) => setSubject(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#E08D3C] bg-white">
                            <option value="ALL">All Subjects</option>
                            {Object.entries(SUBJECT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <select value={countryFilter} onChange={(e) => setCountry(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#E08D3C] bg-white">
                            <option value="ALL">All Countries</option>
                            {Object.entries(COUNTRY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        {hasFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-auto">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">Showing {filtered.length} of {contacts.length} leads</p>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#E08D3C]" />
                        <span className="ml-3 text-gray-500">Loading leads...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-3">⚠️</p>
                        <p className="text-gray-700 font-medium mb-2">Failed to load leads</p>
                        <p className="text-gray-400 text-sm mb-6">{error}</p>
                        <button onClick={fetchContacts}
                            className="px-6 py-2.5 bg-[#E08D3C] hover:bg-[#c77a32] text-white rounded-xl text-sm font-medium">
                            Try Again
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-gray-700 font-medium">No leads found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Desktop — full table */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm table-fixed">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[11%]">Name</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[18%]">Email</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[13%]">Phone</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[11%]">Country</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[11%]">Subject</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[9%]">Status</th>
                                        <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[14%]">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((c, i) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-2 py-3 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="px-2 py-3 font-semibold text-[#2C3539]">
                                                <p className="truncate">{c.firstName} {c.lastName}</p>
                                            </td>
                                            <td className="px-2 py-3">
                                                <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-gray-600 hover:text-[#E08D3C] min-w-0">
                                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{c.email}</span>
                                                </a>
                                            </td>
                                            <td className="px-2 py-3">
                                                <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-[#E08D3C] min-w-0">
                                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{c.phone}</span>
                                                </a>
                                            </td>
                                            <td className="px-2 py-3 text-gray-600">
                                                <p className="truncate">{COUNTRY_LABELS[c.country] ?? c.country}</p>
                                            </td>
                                            <td className="px-2 py-3">
                                                <span className="inline-flex px-2 py-0.5 rounded-full bg-[#C4DFF0] text-[#2C3539] text-xs font-medium max-w-full truncate">
                                                    {SUBJECT_LABELS[c.subject] ?? c.subject}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-gray-500">
                                                <p className="truncate" title={c.message}>{c.message || "—"}</p>
                                            </td>
                                            <td className="px-2 py-3">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="px-2 py-3 text-gray-500 text-xs">
                                                <p className="truncate">{formatDate(c.createdAt)}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile — stacked cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filtered.map((c, i) => (
                                <div key={c.id} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-[#2C3539]">{c.firstName} {c.lastName}</p>
                                            <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </div>
                                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#E08D3C] truncate">
                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{c.email}</span>
                                    </a>
                                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#E08D3C]">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />{c.phone}
                                    </a>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span>{COUNTRY_LABELS[c.country] ?? c.country}</span>
                                        <span>·</span>
                                        <span>{SUBJECT_LABELS[c.subject] ?? c.subject}</span>
                                    </div>
                                    {c.message && (
                                        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">{c.message}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leads;
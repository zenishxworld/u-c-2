import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  Mail,
  User,
  FileCheck,
  GraduationCap,
  MapPin,
  Zap,
  Calendar,
  BookOpen,
  UserCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { getApplications } from "../services/applications";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowProgress {
  currentStage: string;
  estimatedCompletion: string;
  pendingTasks: number;
  completedTasks: number;
  totalTasks: number;
  requiresAdminAction: boolean;
}

interface Application {
  id: string;
  studentName: string;
  studentEmail: string;
  universityName: string;
  courseName: string;
  countryCode: string;
  degreeLevel: string;
  status: string;
  workflowStage: string;
  isUrgent: boolean;
  priority: string;
  referenceNumber: string;
  assignedAdminName?: string;
  assignedAdminEmail?: string;
  completionPercentage?: number;
  submittedAt?: string;
  intakeTerm?: string;
  workflowProgress?: WorkflowProgress;
}

// ─── Status config ───────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { color: string; bgColor: string; dot: string; icon: React.ElementType; label: string }
> = {
  CLAIM_PENDING: {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    dot: "bg-amber-500",
    icon: AlertTriangle,
    label: "Claim Pending",
  },
  COMPLETED: {
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    dot: "bg-emerald-500",
    icon: CheckCircle,
    label: "Completed",
  },
  UNDER_REVIEW: {
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    dot: "bg-purple-500",
    icon: Clock,
    label: "Under Review",
  },
};

const degreeLevelConfig: Record<string, { color: string; bg: string }> = {
  MASTERS: { color: "text-purple-700", bg: "bg-purple-50" },
  BACHELOR: { color: "text-sky-700", bg: "bg-sky-50" },
  PHD: { color: "text-indigo-700", bg: "bg-indigo-50" },
  DIPLOMA: { color: "text-teal-700", bg: "bg-teal-50" },
};

const formatDisplayName = (str?: string) => {
  if (!str) return "—";
  return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};



const formatStudentName = (name: string): string => {
  if (!name || name === "—") return name;
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatIntakeTerm = (term?: string) => {
  if (!term) return "—";
  return term.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Applications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [kpiCounts, setKpiCounts] = useState<Record<string, number>>({});
  const [kpiLoading, setKpiLoading] = useState(true);

  // Fetch overall KPI counts using the stageSummary from the API
  const fetchKpiCounts = async () => {
    setKpiLoading(true);
    try {
      const result = await getApplications({ page: 0, size: 1 });
      
      const counts: Record<string, number> = {};
      counts["all"] = result.stageSummary?.total ?? result.pagination?.total ?? result.totalElements ?? 0;
      
      if (result.stageSummary) {
        counts["CLAIM_PENDING"] = result.stageSummary.claimPending ?? 0;
        counts["UNDER_REVIEW"] = result.stageSummary.underReview ?? 0;
        counts["COMPLETED"] = result.stageSummary.completed ?? 0;
      }
      
      setKpiCounts(counts);
    } catch {
      // silently fail – cards will show 0
    } finally {
      setKpiLoading(false);
    }
  };

  const loadApplications = async (page: number = 0, currentFilter: string = statusFilter) => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page,
        size: 10,
        sortBy: "submittedAt",
      };

      if (currentFilter !== "all") {
        if (currentFilter === "CLAIM_PENDING") {
          params.workflowStage = "CLAIM_PENDING";
        } else {
          params.status = currentFilter;
        }
      }

      const result = await getApplications(params);

      if (!result.success) {
        setError(result.message || "Failed to fetch applications");
        return;
      }

      const apps: Application[] = (result.data || []).map((app: any) => {
        const studentData = app.student || {};
        const studentName = studentData?.name?.trim() || app.studentName?.trim() || "Not Provided";
        const studentEmail = studentData?.email?.trim() || app.studentEmail?.trim() || "Not Provided";

        const rawStatus = app.status ? app.status.toUpperCase() : "UNDER_REVIEW";
        const wStage = app.workflowStage ? app.workflowStage.toUpperCase() : "—";
        const effectiveStatus = wStage === "CLAIM_PENDING" ? "CLAIM_PENDING" : rawStatus;

        return {
          id: app.id || "—",
          studentName: studentName && studentName.length > 0 ? studentName : "Not Provided",
          studentEmail: studentEmail && studentEmail.length > 0 ? studentEmail : "Not Provided",
          universityName: app.universityName || "Not Specified",
          courseName: app.programName || app.courseName || "Not Specified",
          countryCode: app.countryCode || "—",
          degreeLevel: app.degreeLevel || "Not Specified",
          status: effectiveStatus,
          workflowStage: wStage,
          isUrgent: app.isUrgent || false,
          priority: app.priority || "normal",
          referenceNumber: app.referenceNumber || "—",
          assignedAdminName: app.assignedAdmin?.name,
          assignedAdminEmail: app.assignedAdmin?.email,
          completionPercentage: app.completionPercentage ?? 0,
          submittedAt: app.submittedAt,
          intakeTerm: app.intakeTerm,
          workflowProgress: app.workflowProgress,
        };
      });

      setApplications(apps);
      setCurrentPage(page);
      setTotalPages(result.totalPages || 0);
      setTotalCount(result.pagination?.total ?? result.totalElements ?? apps.length);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiCounts();
  }, []);

  useEffect(() => {
    loadApplications(0, statusFilter);
  }, [statusFilter]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      app.universityName.toLowerCase().includes(q) ||
      app.courseName.toLowerCase().includes(q) ||
      app.studentName.toLowerCase().includes(q) ||
      app.studentEmail.toLowerCase().includes(q) ||
      app.referenceNumber.toLowerCase().includes(q) ||
      app.degreeLevel.toLowerCase().includes(q);

    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    const matchStudent = studentFilter === "all" || app.studentEmail === studentFilter;

    return matchSearch && matchStatus && matchStudent;
  });

  // Extract unique students from the loaded applications for the filter dropdown
  const uniqueStudents = Array.from(
    new Map(applications.map((app) => [app.studentEmail, app.studentName])).entries()
  ).map(([email, name]) => ({ email, name }));

  // ── Grouped list ─────────────────────────────────────────────────────────────
  const groupedApplications = filtered.reduce((acc, app) => {
    const key = app.studentEmail;
    if (!acc[key]) {
      acc[key] = {
        studentName: app.studentName,
        studentEmail: app.studentEmail,
        applications: [],
      };
    }
    acc[key].applications.push(app);
    return acc;
  }, {} as Record<string, { studentName: string; studentEmail: string; applications: Application[] }>);

  // ── Status counts (from KPI fetch, not just current page) ─────────────────
  const statusCounts = Object.keys(statusConfig).reduce((acc, s) => {
    acc[s] = kpiCounts[s] ?? 0;
    return acc;
  }, {} as Record<string, number>);

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "bg-emerald-500";
    if (pct >= 75) return "bg-blue-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-gray-300";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="uni-gradient-primary h-12 w-12 rounded-xl flex items-center justify-center shadow-md">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">Applications</h1>
            </div>
            <p className="text-muted-foreground text-sm pl-1">
              {totalCount > 0 ? `${totalCount} total applications across all pages` : "Manage and track student university applications"}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open("https://students.uni360degree.com/", "_blank", "noopener,noreferrer")}
            className="uni-btn-primary inline-flex items-center gap-2 shadow-md text-sm"
          >
            <Plus className="h-4 w-4" />
            New Application
          </motion.button>
        </motion.div>

        {/* Status Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
        >
          {/* Total Applications card */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => setStatusFilter("all")}
            className={`uni-card cursor-pointer p-4 transition-all ${
              statusFilter === "all"
                ? "uni-gradient-primary text-primary-foreground shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-md ${statusFilter === "all" ? "bg-primary-foreground/20" : "bg-indigo-50"}`}>
                <FileCheck className={`h-3.5 w-3.5 ${statusFilter === "all" ? "text-primary-foreground" : "text-indigo-600"}`} />
              </div>
              <div className="text-right flex-1">
                {kpiLoading ? (
                  <div className="h-5 w-8 bg-muted/50 animate-pulse rounded ml-auto" />
                ) : (
                  <p className={`text-xl font-bold ${statusFilter === "all" ? "text-primary-foreground" : "text-foreground"}`}>
                    {kpiCounts["all"] ?? totalCount}
                  </p>
                )}
              </div>
            </div>
            <p className={`text-xs font-medium ${statusFilter === "all" ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
              Total Applications
            </p>
          </motion.div>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const isActive = statusFilter === status;
            return (
              <motion.div
                key={status}
                whileHover={{ y: -3 }}
                onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className={`uni-card cursor-pointer p-4 transition-all ${
                  isActive
                    ? "uni-gradient-primary text-primary-foreground shadow-lg"
                    : "hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-md ${isActive ? "bg-primary-foreground/20" : config.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground" : config.color}`} />
                  </div>
                  <div className="text-right flex-1">
                    {kpiLoading ? (
                      <div className="h-5 w-8 bg-muted/50 animate-pulse rounded ml-auto" />
                    ) : (
                      <p className={`text-xl font-bold ${isActive ? "text-primary-foreground" : "text-foreground"}`}>
                        {statusCounts[status] ?? 0}
                      </p>
                    )}
                  </div>
                </div>
                <p className={`text-xs font-medium ${isActive ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  {config.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="uni-card p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by university, course, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="uni-input w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>
            
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger className="uni-input text-sm">
                <SelectValue placeholder="Filter by student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {uniqueStudents.map((student) => (
                  <SelectItem key={student.email} value={student.email}>
                    {formatStudentName(student.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="uni-input text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-9 h-9 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Fetching applications...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-destructive/10 border border-destructive/30 rounded-lg p-5 text-center"
          >
            <AlertTriangle className="h-7 w-7 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium text-sm">{error}</p>
          </motion.div>
        )}

        {/* Applications List */}
        {!loading && !error && (
          <div className="space-y-6">
            {Object.values(groupedApplications).map((group, groupIdx) => (
              <motion.div
                key={group.studentEmail}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + groupIdx * 0.05 }}
                className="uni-card overflow-hidden"
              >
                {/* ── Student Identity Header ── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl uni-gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                      {group.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {formatStudentName(group.studentName)}
                      </h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-4 h-4" />
                        {group.studentEmail}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold px-4 py-1.5 rounded-full bg-background border border-border text-muted-foreground shadow-sm">
                    {group.applications.length} Application{group.applications.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* ── Application Cards ── */}
                <div className="p-5 space-y-4">
                  {group.applications.map((app, appIdx) => {
                    const statusCfg = statusConfig[app.status] || statusConfig["UNDER_REVIEW"];
                    const degreeCfg = degreeLevelConfig[app.degreeLevel] || { color: "text-gray-600", bg: "bg-gray-100" };
                    const pct = app.completionPercentage ?? 0;

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * appIdx }}
                        onClick={() => navigate('/dashboard', { state: { openApplicationId: app.id } })}
                        className="bg-background rounded-xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                      >
                        <div className="p-5 space-y-4">
                          {/* Row 1: Reference + Status badges + Date */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-md">
                                {app.referenceNumber}
                              </span>
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusCfg.bgColor} ${statusCfg.color}`}>
                                <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                              </span>
                              {app.isUrgent && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-semibold">
                                  <Zap className="h-3.5 w-3.5" /> Urgent
                                </span>
                              )}
                              {app.priority && app.priority !== "normal" && (
                                <span className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold capitalize">
                                  {app.priority}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {formatDate(app.submittedAt)}
                            </span>
                          </div>

                          {/* Row 2: University + Course */}
                          <div>
                            <h3 className="text-lg font-bold text-foreground leading-snug">{app.universityName}</h3>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 flex-shrink-0" />
                              {app.courseName}
                            </p>
                          </div>

                          {/* Row 3: Meta chips */}
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${degreeCfg.bg} ${degreeCfg.color}`}>
                              <GraduationCap className="h-3.5 w-3.5" />
                              {formatDisplayName(app.degreeLevel)}
                            </span>
                            {app.countryCode && app.countryCode !== "—" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                                <MapPin className="h-3.5 w-3.5" />
                                {app.countryCode}
                              </span>
                            )}
                            {app.intakeTerm && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatIntakeTerm(app.intakeTerm)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {formatDisplayName(app.workflowStage)}
                            </span>
                          </div>

                          {/* Row 4: Student + Admin footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-3">
                            {/* Student ownership */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full uni-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {group.studentName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground leading-tight">{formatStudentName(group.studentName)}</p>
                                <p className="text-xs text-muted-foreground">Student</p>
                              </div>
                            </div>

                            {/* Assigned admin */}
                            {app.assignedAdminName ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground leading-tight">{formatStudentName(app.assignedAdminName)}</p>
                                  <p className="text-xs text-muted-foreground">Assigned Admin</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No admin assigned</span>
                            )}
                          </div>

                          {/* Row 5: Progress bar */}
                          {pct > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground font-medium">Application Completion</span>
                                <span className="text-sm font-bold text-foreground">{pct}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-700 ${getProgressColor(pct)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {app.workflowProgress && app.workflowProgress.totalTasks > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  {app.workflowProgress.completedTasks} / {app.workflowProgress.totalTasks} tasks completed
                                  {app.workflowProgress.requiresAdminAction && (
                                    <span className="ml-2 text-amber-600 font-semibold">· Requires Action</span>
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {/* Empty state */}
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 uni-card border-2 border-dashed"
              >
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">No applications found</h3>
                <p className="text-muted-foreground text-sm text-center max-w-sm">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search criteria or filter settings."
                    : "No applications yet. Create your first application to get started."}
                </p>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => loadApplications(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1.5 px-4 py-2 uni-gradient-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm">
                  {currentPage + 1} / {totalPages}
                </div>
                <button
                  onClick={() => loadApplications(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
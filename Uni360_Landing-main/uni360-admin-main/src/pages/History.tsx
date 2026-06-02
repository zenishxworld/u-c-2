import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Eye, Clock, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAllTasks,
  getTaskDetails,
  getApplication,
  getCourse,
  getUniversity,
  getWorkflowProgress,
} from "../services/task";

// Country config — maps API country codes to display aliases
const COUNTRY_CONFIG = {
  GB: {
    label: "UK",
    aliases: ["UK", "United Kingdom", "GB", "GBR"],
  },
  DE: {
    label: "Germany",
    aliases: ["Germany", "DE", "DEU", "Deutschland"],
  },
};

const ITEMS_PER_PAGE = 15;

// All stages across UK + Germany workflows (always shown in dropdown)
const ALL_WORKFLOW_STAGES = [
  { filterId: "APPLICATION_REVIEW",   name: "Application Review" },
  { filterId: "ACADEMIC_EVALUATION",  name: "Academic Evaluation" },
  { filterId: "CERTIFICATION_PROCESS",name: "Certification Process" },  // Germany only
  { filterId: "UNIVERSITY_SUBMISSION",name: "University Submission" },   // Germany only
  { filterId: "CONDITIONAL_OFFER",    name: "Conditional Offer" },       // UK only
  { filterId: "CAS_INTERVIEW",        name: "CAS Interview" },           // UK only
  { filterId: "FEES_PAYMENT",         name: "Fees Payment" },            // UK only
  { filterId: "UNCONDITIONAL_OFFER",  name: "Unconditional Offer" },     // UK only
  { filterId: "VISA_APPLICATION",     name: "Visa Application" },
];

const History = () => {
  const [availableFilters, setAvailableFilters] = useState({
    stages: [],
    taskStatuses: [],
    priorities: [],
  });
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [applicationsMap, setApplicationsMap] = useState({});

  // New state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedClaimedFilter, setSelectedClaimedFilter] = useState("all"); // all | claimed | unclaimed
  const [selectedCreatedFilter, setSelectedCreatedFilter] = useState("all"); // all | today | week | month
  const [currentPage, setCurrentPage] = useState(1);

  // Countries derived from API response
  const [availableCountries, setAvailableCountries] = useState([]);

  const formatDisplayName = (str) => {
    if (!str) return "N/A";
    return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const CORRECT_STAGE_MAPPING = {
    APPLICATION_REVIEW: { order: 0, displayName: "Application Review" },
    ACADEMIC_EVALUATION: { order: 1, displayName: "Academic Evaluation" },
    CERTIFICATION_PROCESS: { order: 2, displayName: "Certification Process" },
    UNIVERSITY_SUBMISSION: { order: 3, displayName: "University Submission" },
  };

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    if (selectedStage && selectedTaskType) {
      fetchFilteredTasks();
    }
  }, [selectedStage, selectedTaskType, selectedStatus, selectedPriority]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, selectedClaimedFilter, selectedCreatedFilter, applications]);

  const loadHistoryData = async () => {
    setIsLoading(true);
    try {
      const result = await getAllTasks("active=false");

      if (!result.success) {
        console.error("Failed to fetch history:", result.message);
        setIsLoading(false);
        return;
      }

      const inactiveTasks = result.data;

      const stageMap = new Map();
      const statusMap = new Map();
      const priorityMap = new Map();
      const countryCodeSet = new Set();

      inactiveTasks.forEach((task) => {
        // Collect country codes from API
        if (task.countryCode) countryCodeSet.add(task.countryCode.toUpperCase());
        if (task.country) countryCodeSet.add(task.country.toUpperCase());

        if (!stageMap.has(task.stage)) {
          stageMap.set(task.stage, {
            filterId: task.stage,
            name: formatDisplayName(task.stage),
            count: 0,
            taskTypes: new Map(),
          });
        }

        const stage = stageMap.get(task.stage);
        stage.count++;

        if (!stage.taskTypes.has(task.taskType)) {
          stage.taskTypes.set(task.taskType, {
            filterId: task.taskType,
            name: formatDisplayName(task.taskType),
            count: 0,
          });
        }
        stage.taskTypes.get(task.taskType).count++;

        if (!statusMap.has(task.taskStatus)) {
          statusMap.set(task.taskStatus, {
            filterId: task.taskStatus,
            name: formatDisplayName(task.taskStatus),
            count: 0,
          });
        }
        statusMap.get(task.taskStatus).count++;

        if (!priorityMap.has(task.priority)) {
          priorityMap.set(task.priority, {
            filterId: task.priority,
            name: `Priority ${task.priority}`,
            count: 0,
          });
        }
        priorityMap.get(task.priority).count++;
      });

      // Build country filter options from API response codes
      const countriesFromApi = [];
      Object.entries(COUNTRY_CONFIG).forEach(([code, config]) => {
        // Check if any alias from the API response matches this country
        const found = config.aliases.some((alias) => countryCodeSet.has(alias.toUpperCase()));
        if (found) {
          countriesFromApi.push({ code, ...config });
        }
      });
      // Fallback: always show both if API has no country data
      if (countriesFromApi.length === 0) {
        Object.entries(COUNTRY_CONFIG).forEach(([code, config]) => {
          countriesFromApi.push({ code, ...config });
        });
      }
      setAvailableCountries(countriesFromApi);

      const stages = Object.keys(CORRECT_STAGE_MAPPING)
        .sort((a, b) => CORRECT_STAGE_MAPPING[a].order - CORRECT_STAGE_MAPPING[b].order)
        .filter((stageName) => stageMap.has(stageName))
        .map((stageName) => {
          const stageData = stageMap.get(stageName);
          return {
            filterId: stageName,
            name: CORRECT_STAGE_MAPPING[stageName].displayName,
            order: CORRECT_STAGE_MAPPING[stageName].order,
            count: stageData.count,
            taskTypes: Array.from(stageData.taskTypes.values()),
          };
        });

      const taskStatuses = Array.from(statusMap.values());
      const priorities = Array.from(priorityMap.values()).sort((a, b) => a.filterId - b.filterId);

      setAvailableFilters({ stages, taskStatuses, priorities });

      if (stages.length > 0) {
        setSelectedStage(stages[0].filterId);
        if (stages[0].taskTypes.length > 0) {
          setSelectedTaskType(stages[0].taskTypes[0].filterId);
        }
      }

      await fetchFilteredTasks();
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredTasks = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("active", "false");

      if (selectedStage) queryParams.append("stages", selectedStage);
      if (selectedTaskType) queryParams.append("taskTypes", selectedTaskType);
      if (selectedStatus !== "all") queryParams.append("taskStatuses", selectedStatus);
      if (selectedPriority !== "all") queryParams.append("priorities", selectedPriority);

      const result = await getAllTasks(queryParams.toString());

      if (result.success) {
        await processTasksWithDetails(result.data);
      }
    } catch (err) {
      console.error("Error fetching filtered history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const processTasksWithDetails = async (tasks) => {
    const newApplicationsMap = {};

    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        let applicationData = null;
        let programName = "N/A";
        let universityName = "N/A";
        let intakeTerm = "N/A";
        let intakeYear = "";
        let referenceNumber = "";
        let countryCode = task.countryCode || task.country || "";

        if (task.applicationId) {
          const appResult = await getApplication(task.applicationId);
          if (appResult.success) {
            applicationData = appResult.data;
            intakeTerm = applicationData?.target_semester || "N/A";
            intakeYear = applicationData?.target_year || "";
            referenceNumber = applicationData?.reference_number || "";
            if (!countryCode) countryCode = applicationData?.country_code || applicationData?.country || "";

            if (applicationData.target_course_id) {
              const course = await getCourse(applicationData.target_course_id);
              if (course) {
                programName = course.name || "N/A";
                if (course.university_id) {
                  const university = await getUniversity(course.university_id);
                  if (university) {
                    universityName = university.name || "N/A";
                    if (!countryCode) countryCode = university.country_code || university.country || "";
                  }
                }
              }
            }

            newApplicationsMap[task.applicationId] = {
              universityName,
              programName,
              intakeTerm,
              intakeYear,
              referenceNumber,
            };
          }
        }

        const detailsResult = await getTaskDetails(task.taskId);
        const taskDetails = detailsResult.success ? detailsResult.data : {};

        return {
          id: task.taskId,
          taskId: task.taskId,
          applicationId: task.applicationId,
          studentName: applicationData?.studentName || taskDetails?.studentName || "N/A",
          studentEmail: applicationData?.studentEmail || taskDetails?.studentEmail || "N/A",
          university: universityName,
          course: programName,
          intake: intakeYear ? `${intakeTerm} ${intakeYear}` : intakeTerm,
          referenceNumber: referenceNumber,
          completedAt: task.completedAt || taskDetails?.completedAt || null,
          createdAt: task.createdAt || taskDetails?.createdAt || null,
          claimedAt: task.claimedAt || taskDetails?.claimedAt || null,
          claimedBy: task.claimedBy || taskDetails?.claimedBy || null,
          status: task.taskStatus,
          stage: task.stage,
          taskType: task.taskType,
          priority: task.priority,
          countryCode: countryCode?.toUpperCase() || "",
          applicationData,
        };
      })
    );

    setApplicationsMap(newApplicationsMap);
    setApplications(tasksWithDetails);
  };

  // ─── FE Filtering (search + country + claimed + created) ───────────────────
  const filteredApplications = useMemo(() => {
    let list = [...applications];

    // Search: match against ref, university, course, student name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (app) =>
          app.referenceNumber?.toLowerCase().includes(q) ||
          app.university?.toLowerCase().includes(q) ||
          app.course?.toLowerCase().includes(q) ||
          app.studentName?.toLowerCase().includes(q) ||
          app.studentEmail?.toLowerCase().includes(q)
      );
    }

    // Country filter
    if (selectedCountry !== "all") {
      const config = COUNTRY_CONFIG[selectedCountry];
      if (config) {
        const aliasesUpper = config.aliases.map((a) => a.toUpperCase());
        list = list.filter((app) => aliasesUpper.includes(app.countryCode?.toUpperCase()));
      }
    }

    // Claimed filter
    if (selectedClaimedFilter === "claimed") {
      list = list.filter((app) => !!app.claimedAt || !!app.claimedBy);
    } else if (selectedClaimedFilter === "unclaimed") {
      list = list.filter((app) => !app.claimedAt && !app.claimedBy);
    }

    // Created filter
    if (selectedCreatedFilter !== "all") {
      const now = new Date();
      list = list.filter((app) => {
        if (!app.createdAt) return false;
        const created = new Date(app.createdAt);
        if (selectedCreatedFilter === "today") {
          return created.toDateString() === now.toDateString();
        }
        if (selectedCreatedFilter === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return created >= weekAgo;
        }
        if (selectedCreatedFilter === "month") {
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return created >= monthAgo;
        }
        return true;
      });
    }

    return list;
  }, [applications, searchQuery, selectedCountry, selectedClaimedFilter, selectedCreatedFilter]);

  // ─── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / ITEMS_PER_PAGE));
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedCountry !== "all" ||
    selectedClaimedFilter !== "all" ||
    selectedCreatedFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedClaimedFilter("all");
    setSelectedCreatedFilter("all");
  };

  // ─── Detail Modal ──────────────────────────────────────────────────────────
  const DetailModal = ({ app, applicationsMap, onClose }) => {
    if (!showDetailModal || !app) return null;
    const applicationDetails = applicationsMap?.[app?.applicationId] || null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl uni-card max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-background p-6 border-b border-border z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{app.university}</h2>
                <p className="text-sm text-muted-foreground">{app.course}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="text-sm font-medium">{app.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="secondary">{formatDisplayName(app.status)}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed At</p>
                <p className="text-sm">{app.completedAt ? new Date(app.completedAt).toLocaleString() : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reference</p>
                <p className="text-sm">{app.referenceNumber}</p>
              </div>
              {app.claimedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Claimed At</p>
                  <p className="text-sm">{new Date(app.claimedAt).toLocaleString()}</p>
                </div>
              )}
              {app.createdAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{new Date(app.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-background p-6 border-t border-border">
            <Button onClick={onClose} className="uni-btn-ghost w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="uni-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task History
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            View completed and inactive tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stage Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg border border-border">
            {availableFilters.stages.map((stage) => (
              <button
                key={stage.filterId}
                onClick={() => {
                  setSelectedStage(stage.filterId);
                  if (stage.taskTypes.length > 0) {
                    setSelectedTaskType(stage.taskTypes[0].filterId);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedStage === stage.filterId
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background text-foreground border border-border hover:bg-muted"
                }`}
              >
                {stage.name} ({stage.count})
              </button>
            ))}
          </div>

          {/* Task Type Pills */}
          {selectedStage && (
            <div className="flex flex-wrap gap-2 mb-4">
              {availableFilters.stages
                .find((s) => s.filterId === selectedStage)
                ?.taskTypes?.map((taskType) => (
                  <button
                    key={taskType.filterId}
                    onClick={() => setSelectedTaskType(taskType.filterId)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                      selectedTaskType === taskType.filterId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-ring"
                    }`}
                  >
                    {taskType.name} ({taskType.count})
                  </button>
                ))}
            </div>
          )}

          

          {/* ── Search + FE Filters Row ── */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, ref, university, course…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg border border-border pl-9 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-lg border border-border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              {availableFilters.taskStatuses.map((status) => (
                <option key={status.filterId} value={status.filterId}>
                  {status.name} ({status.count})
                </option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage || "all"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") {
                  setSelectedStage(null);
                  setSelectedTaskType(null);
                } else {
                  setSelectedStage(val);
                  const stage = availableFilters.stages.find(s => s.filterId === val);
                  setSelectedTaskType(stage?.taskTypes?.[0]?.filterId || null);
                }
              }}
              className="h-9 rounded-lg border border-border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Stages</option>
              {ALL_WORKFLOW_STAGES.map((stage) => {
                const liveStage = availableFilters.stages.find(s => s.filterId === stage.filterId);
                const count = liveStage ? liveStage.count : 0;
                return (
                  <option key={stage.filterId} value={stage.filterId}>
                    {stage.name} ({count})
                  </option>
                );
              })}
            </select>

            {/* Country Filter */}
            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="h-9 rounded-lg border border-border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Countries</option>
              <option value="GB">UK</option>
              <option value="DE">Germany</option>
            </select>

            {/* Claimed Filter */}
            <select
                    value={selectedClaimedFilter}
                    onChange={(e) => setSelectedClaimedFilter(e.target.value)}
                    className="h-9 rounded-lg border border-border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">Claimed: All</option>
                    <option value="claimed">Claimed</option>
                    <option value="unclaimed">Unclaimed</option>
                  </select>

                  {/* Created Filter */}
                  <select
                    value={selectedCreatedFilter}
                    onChange={(e) => setSelectedCreatedFilter(e.target.value)}
                    className="h-9 rounded-lg border border-border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">Created: Any time</option>
                    <option value="today">Created Today</option>
                    <option value="week">Created This Week</option>
                    <option value="month">Created This Month</option>
                  </select>

                  {/* Clear all FE filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              

              {/* Results count */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {filteredApplications.length === 0
                    ? "No results"
                    : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredApplications.length
                      )} of ${filteredApplications.length} tasks`}
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {paginatedApplications.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{formatDisplayName(app.taskType)}</p>
                      <p className="text-md text-muted-foreground">Ref: {app.referenceNumber}</p>
                      <p className="text-sm text-muted-foreground">{app.university}</p>
                      <p className="text-sm text-muted-foreground">{app.course}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatDisplayName(app.status)}
                        </Badge>
                        {app.countryCode && (
                          <Badge variant="outline" className="text-xs">
                            {COUNTRY_CONFIG[app.countryCode]?.label || app.countryCode}
                          </Badge>
                        )}
                        {app.claimedAt ? (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Unclaimed
                          </Badge>
                        )}
                        {app.completedAt && (
                          <Badge variant="default" className="text-xs">
                            {new Date(app.completedAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowDetailModal(true);
                      }}
                      className="uni-btn-ghost ml-3 shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </motion.div>
                ))}

                {filteredApplications.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">
                      {hasActiveFilters ? "No results match your filters" : "No history found"}
                    </p>
                    <p className="text-sm">
                      {hasActiveFilters ? (
                        <button onClick={clearAllFilters} className="underline hover:text-foreground">
                          Clear filters
                        </button>
                      ) : (
                        "Completed tasks will appear here"
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Pagination Controls ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              {/* Left side - navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-10 w-10 flex items-center justify-center rounded-md border border-border bg-white text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and ±1 around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push("ellipsis-" + page);
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item) =>
                    typeof item === "string" ? (
                      <span key={item} className="h-10 w-10 flex items-center justify-center text-gray-400 text-sm">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                          currentPage === item
                            ? "bg-orange-400 text-white shadow-sm"
                            : "bg-white border border-border text-foreground hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 flex items-center justify-center rounded-md border border-border bg-white text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Right side - page info */}
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredApplications.length} total tasks)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedApp && (
        <DetailModal
          app={selectedApp}
          applicationsMap={applicationsMap}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
};

export default History;
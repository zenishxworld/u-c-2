import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  X,
  Send,
  Check,
  RefreshCw,
  Loader2,
  Globe,
  Bell,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  getAllTasks,
  getTaskDetails,
  claimTask,
  getWorkflowProgress,
  completeTask,
  getApplication,
  getCourse,
  getUniversity,
  getTaskRequirements,
  setApplicationFlags,
  getStudentProfileForAdmin,
  clearDashboardCache,
} from "../services/task";

// Map each country to its final workflow rules
const FINAL_WORKFLOW_RULES = {
  Germany: { stage: 'VISA_APPLICATION', taskType: 'VISA_APPLICATION_RESULT' },
  UK: { stage: 'VISA_APPLICATION', taskType: 'VISA_APPLICATION_RESULT' },
};

const WORKFLOW_SCHEMAS = {
  UK: [
    { filterId: "APPLICATION_REVIEW", name: "Application Review", taskTypes: [{ filterId: "APPLICATION_CLAIM", name: "Application Claim" }] },
    { filterId: "ACADEMIC_EVALUATION", name: "Academic Evaluation", taskTypes: [
       { filterId: "DOCUMENT_VERIFICATION", name: "Document Verification" },
       { filterId: "ACADEMIC_VERIFICATION", name: "Academic Verification" },
       { filterId: "LANGUAGE_VERIFICATION", name: "Language Verification" }
    ]},
    { filterId: "CONDITIONAL_OFFER", name: "Conditional Offer", taskTypes: [{ filterId: "CONDITIONAL_OFFER_VERIFICATION", name: "Conditional Offer Verification" }] },
    { filterId: "CAS_INTERVIEW", name: "CAS Interview", taskTypes: [
       { filterId: "CAS_INTERVIEW_SCHEDULED", name: "CAS Interview Scheduled" },
       { filterId: "CAS_INTERVIEW_COMPLETED", name: "CAS Interview Completed" },
       { filterId: "CAS_INTERVIEW_PASSED", name: "CAS Interview Passed" }
    ]},
    { filterId: "FEES_PAYMENT", name: "Fees Payment", taskTypes: [{ filterId: "TUITION_FEES_PAYMENT", name: "Tuition Fees Payment" }] },
    { filterId: "UNCONDITIONAL_OFFER", name: "Unconditional Offer", taskTypes: [{ filterId: "UNCONDITIONAL_OFFER_VERIFICATION", name: "Unconditional Offer Verification" }] },
    { filterId: "UNIVERSITY_SUBMISSION", name: "University Submission", taskTypes: [{ filterId: "UNIVERSITY_SUBMISSION", name: "University Submission" }] },
    { filterId: "VISA_APPLICATION", name: "Visa Application", taskTypes: [
       { filterId: "VISA_APPLICATION_SCHEDULED", name: "Visa Application Scheduled" },
       { filterId: "VISA_APPLICATION_COMPLETED", name: "Visa Application Completed" },
       { filterId: "VISA_APPLICATION_RESULT", name: "Visa Application Result" }
    ]}
  ],
  Germany: [
    { filterId: "APPLICATION_REVIEW", name: "Application Review", taskTypes: [{ filterId: "APPLICATION_CLAIM", name: "Application Claim" }] },
    { filterId: "ACADEMIC_EVALUATION", name: "Academic Evaluation", taskTypes: [
       { filterId: "DOCUMENT_VERIFICATION", name: "Document Verification" },
       { filterId: "ACADEMIC_VERIFICATION", name: "Academic Verification" },
       { filterId: "LANGUAGE_VERIFICATION", name: "Language Verification" }
    ]},
    { filterId: "CERTIFICATION_PROCESS", name: "Certification Process", taskTypes: [
       { filterId: "APS_CERTIFICATE", name: "APS Certificate" },
       { filterId: "PAYMENT_PROCESSING", name: "Payment Processing" }
    ]},
    { filterId: "FEES_PAYMENT", name: "Fees Payment", taskTypes: [
       { filterId: "TUITION_FEES_PAYMENT", name: "Tuition Fees Payment" },
       { filterId: "BLOCK_ACCOUNT", name: "Block Account" }
    ]},
    { filterId: "UNIVERSITY_SUBMISSION", name: "University Submission", taskTypes: [{ filterId: "UNIVERSITY_SUBMISSION", name: "University Submission" }] },
    { filterId: "VISA_APPLICATION", name: "Visa Application", taskTypes: [
       { filterId: "VISA_APPLICATION_SCHEDULED", name: "Visa Application Scheduled" },
       { filterId: "VISA_APPLICATION_COMPLETED", name: "Visa Application Completed" },
       { filterId: "VISA_APPLICATION_RESULT", name: "Visa Application Result" }
    ]}
  ]
};

const Dashboard = () => {
  const navigate = useNavigate();
  // Dynamic filter states
  const [availableFilters, setAvailableFilters] = useState({
    stages: [],
    taskTypes: [],
    taskStatuses: [],
    priorities: [],
    active: []
  });

  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedActive, setSelectedActive] = useState("true");
  const [countries, setCountries] = useState(["Germany", "UK"]);
  const [selectedCountry, setSelectedCountry] = useState("Germany");
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [claimingAppId, setClaimingAppId] = useState(null);
  const [claimError, setClaimError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationsMap, setApplicationsMap] = useState({});
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
  const [pendingTaskCompletion, setPendingTaskCompletion] = useState(null);
  const [showApplicationCompleteModal, setShowApplicationCompleteModal] = useState(false);
  const [completedAppDetails, setCompletedAppDetails] = useState(null);

  // Task Completion Related States
  const [taskRequirements, setTaskRequirements] = useState(null);
  const [completionForm, setCompletionForm] = useState({});
  const [completionFlags, setCompletionFlags] = useState({});
  const [completionErrors, setCompletionErrors] = useState({});
  const [hasLoadedRequirements, setHasLoadedRequirements] = useState(false);

  // Add these new state variables after the existing state declarations
  const [workflowConfig, setWorkflowConfig] = useState(null); // Store workflow structure
  const [stageOrder, setStageOrder] = useState([]); // Store ordered stages
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [allFetchedTasks, setAllFetchedTasks] = useState([]); // All tasks, used for country filtering

  // Student Profile Modal States
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [studentProfileData, setStudentProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const waitForBackendProcessing = (ms = 1200) => new Promise(resolve => setTimeout(resolve, ms));
  useEffect(() => {
    loadDynamicTaskData();
  }, []);

  // Re-build stages and tasks when country changes using pre-tagged tasks
  useEffect(() => {
    if (allFetchedTasks.length > 0) {
      // allFetchedTasks already have country field — just rebuild and re-fetch
      rebuildFiltersForCountry(allFetchedTasks, selectedCountry);
      // Also refresh workflow config for a matching-country application
      const countryApp = allFetchedTasks.find(t => normalizeCountryForFilter(t.country) === selectedCountry && t.applicationId);
      if (countryApp) {
        fetchWorkflowConfig(countryApp.applicationId, true);
      }
    }
  }, [selectedCountry]);

  // Load task requirements when a task is selected for the detail modal
  // Load task requirements when a task is selected for the detail modal
useEffect(() => {
  if (!selectedApp?.taskId) return;

  console.log('Loading task requirements for:', selectedApp.taskId);
  
  // Reset previous requirements immediately
  setTaskRequirements(null);
  setCompletionForm({});
  setCompletionFlags({});
  setCompletionErrors({});
  setHasLoadedRequirements(false);

  getTaskRequirements(selectedApp.taskId)
    .then((requirementsRes) => {
      if (requirementsRes.success) {
        console.log('Task requirements loaded:', requirementsRes.data);
        setTaskRequirements(requirementsRes.data);

        const formObj = {};
        requirementsRes.data.requiredFormFields?.forEach((f) => {
          formObj[f] = "";
        });
        setCompletionForm(formObj);

        // Load flags from localStorage
        const savedFlags = loadFlagsFromLocalStorage(selectedApp.applicationId);
        const flagObj = {};
        requirementsRes.data.requiredFlags?.forEach((f) => {
          flagObj[f] = savedFlags[f] === true;
        });
        setCompletionFlags(flagObj);

        console.log('Loaded flags from localStorage:', savedFlags);
        setHasLoadedRequirements(true);
      }
    })
    .catch((error) => {
      console.error('Error loading requirements:', error);
      setHasLoadedRequirements(true);
    });
}, [selectedApp?.taskId]);


  const location = useLocation();
  const openApplicationId = location.state?.openApplicationId || null;
  const restoredState = location.state?.restoredState || null;

  useEffect(() => {
    if (openApplicationId && allFetchedTasks.length > 0) {
      const rawTask = allFetchedTasks.find(t => t.applicationId === openApplicationId || t.application_id === openApplicationId);
      
      if (rawTask) {
        const country = restoredState?.selectedCountry || normalizeCountryForFilter(rawTask.country);
        if (country && country !== selectedCountry) {
          setSelectedCountry(country);
          return;
        }
        
        const targetStage = restoredState?.selectedStage || rawTask.stage;
        if (targetStage && targetStage !== selectedStage) {
          setSelectedStage(targetStage);
          if (restoredState?.selectedTaskType !== undefined) {
             setSelectedTaskType(restoredState.selectedTaskType);
          } else {
             // Auto-clear subtask type on stage change so it doesn't stay filtered out
             setSelectedTaskType(null);
          }
          return;
        }

        if (restoredState?.selectedTaskType !== undefined && restoredState.selectedTaskType !== selectedTaskType) {
            setSelectedTaskType(restoredState.selectedTaskType);
            return;
        }
        
        const processedApp = applications.find(a => a.applicationId === openApplicationId);
        if (processedApp && !showDetailModal) {
          setTaskRequirements(null);
          setCompletionForm({});
          setCompletionFlags({});
          setCompletionErrors({});
          setHasLoadedRequirements(false);
          
          setSelectedApp(processedApp);
          setShowDetailModal(true);
          navigate('.', { replace: true, state: {} });
        }
      } else {
        // Fallback catch if the target is completely untrackable, just clear the payload state and do nothing safely
        navigate('.', { replace: true, state: {} });
      }
    }
  }, [openApplicationId, allFetchedTasks, applications, selectedCountry, selectedStage, selectedTaskType, showDetailModal, navigate, restoredState]);

  useEffect(() => {
  const anyOpen = showDetailModal || showStudentProfileModal || showNotificationModal ||
    showCompletionModal || showErrorModal || showConfirmCompleteModal || showApplicationCompleteModal;
  document.body.style.overflow = anyOpen ? 'hidden' : '';
  return () => { document.body.style.overflow = ''; };
}, [showDetailModal, showStudentProfileModal, showNotificationModal,
    showCompletionModal, showErrorModal, showConfirmCompleteModal, showApplicationCompleteModal]);

  // Reload tasks when filters change
  useEffect(() => {
    if (selectedStage) {
      console.log('🔄 Filter changed - Fetching tasks for:', {
        stage: selectedStage,
        taskType: selectedTaskType,
        status: selectedStatus,
        priority: selectedPriority
      });
      fetchFilteredTasks();
    } else {
      console.log('⏸️ Waiting for stage to be selected');
    }
  }, [selectedStage, selectedTaskType, selectedStatus, selectedPriority, selectedActive]);

  // Helper functions to save/load flags from localStorage
  const getFlagsStorageKey = (applicationId) => `flags_${applicationId}`;

  const saveFlagsToLocalStorage = (applicationId, flags) => {
    try {
      localStorage.setItem(getFlagsStorageKey(applicationId), JSON.stringify(flags));
    } catch (error) {
      console.error('Error saving flags to localStorage:', error);
    }
  };

  const loadFlagsFromLocalStorage = (applicationId) => {
    try {
      const saved = localStorage.getItem(getFlagsStorageKey(applicationId));
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading flags from localStorage:', error);
      return {};
    }
  };

  const fetchWorkflowConfig = async (applicationId, forceRefresh = false) => {
    if (workflowConfig && !forceRefresh) return workflowConfig; // Return cached config

    setIsLoadingWorkflow(true);
    try {
      if (!applicationId) {
        console.log('No application ID provided');
        return null;
      }

      const progressResult = await getWorkflowProgress(applicationId);
      if (progressResult.success && progressResult.data?.allStages) {
        const config = progressResult.data.allStages;
        setWorkflowConfig(config);

        // Extract and store stage order
        const orderedStages = config
          .sort((a, b) => a.order - b.order)
          .map(stage => ({
            filterId: stage.stageName,
            name: stage.displayName,
            order: stage.order,
            tasks: stage.tasks.map(task => ({
              filterId: task.taskType,
              name: task.displayName
            }))
          }));

        setStageOrder(orderedStages);
        console.log('✅ Workflow config loaded:', orderedStages);
        return config;
      }
    } catch (error) {
      console.error('Error fetching workflow config:', error);
    } finally {
      setIsLoadingWorkflow(false);
    }
    return null;
  };

  // Normalize country name to match selectedCountry format ("UK" or "Germany")
  // Handles all known backend variants: DE, de, Germany, germany, Deutschland, UK, United Kingdom, GB, Great Britain
  const normalizeCountryForFilter = (c) => {
    if (!c) return null;
    const lower = c.trim().toLowerCase();
    const ukVariants = ["uk", "united kingdom", "united kingdoms", "gb", "great britain", "england"];
    const deVariants = ["de", "germany", "deutschland", "ger"];
    if (ukVariants.includes(lower)) return "UK";
    if (deVariants.includes(lower)) return "Germany";
    return null;
  };

  // Rebuild stages/filters from a set of tasks filtered by country
  const rebuildFiltersForCountry = (tasks, country) => {
    const countryTasks = tasks.filter(task => {
      const normalized = normalizeCountryForFilter(task.country);
      return normalized === country;
    });

    console.log(`🌍 Rebuilding for country: ${country}, tasks: ${countryTasks.length}/${tasks.length}`);

    // Pre-initialize hardcoded skeleton structure
    const skeleton = WORKFLOW_SCHEMAS[country] || [];
    const stageMap = new Map();
    const statusMap = new Map();
    const priorityMap = new Map();

    // Setup base structure
    skeleton.forEach((stg, i) => {
      const taskTypesMap = new Map();
      stg.taskTypes.forEach(tt => {
        taskTypesMap.set(tt.filterId, {
          filterId: tt.filterId,
          name: tt.name,
          count: 0,
          originalOrder: taskTypesMap.size
        });
      });
      stageMap.set(stg.filterId, {
        filterId: stg.filterId,
        name: stg.name,
        count: 0,
        order: i,
        taskTypes: taskTypesMap
      });
    });

    countryTasks.forEach((task) => {
      const isActive = task.active !== false;

      // Force UI to only use frontend-configured schema
      if (!stageMap.has(task.stage)) {
        return; // Ignore dynamic backend stages
      }
      
      const stage = stageMap.get(task.stage);

      if (!stage.taskTypes.has(task.taskType)) {
        return; // Ignore dynamic backend task types
      }

      if (isActive) {
        stage.count++;
        stage.taskTypes.get(task.taskType).count++;

        if (!statusMap.has(task.taskStatus)) {
          statusMap.set(task.taskStatus, { filterId: task.taskStatus, name: formatDisplayName(task.taskStatus), count: 0 });
        }
        statusMap.get(task.taskStatus).count++;

        if (!priorityMap.has(task.priority)) {
          priorityMap.set(task.priority, { filterId: task.priority, name: `Priority ${task.priority}`, count: 0 });
        }
        priorityMap.get(task.priority).count++;
      }
    });

    let stages = Array.from(stageMap.values())
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        filterId: s.filterId,
        name: s.name,
        count: s.count,
        taskTypes: Array.from(s.taskTypes.values()).sort((ta, tb) => ta.originalOrder - tb.originalOrder),
      }));

    const taskStatuses = Array.from(statusMap.values());
    const priorities = Array.from(priorityMap.values()).sort((a, b) => a.filterId - b.filterId);

    setAvailableFilters({ stages, taskStatuses, priorities, taskTypes: [], active: [] });

    // Retain selected stage across country load if valid, otherwise reset
    if (stages.length > 0) {
      if (!stages.find(s => s.filterId === selectedStage)) {
         setSelectedStage(stages[0].filterId);
         setSelectedTaskType(null);
      }
    } else {
      setSelectedStage(null);
      setSelectedTaskType(null);
      setApplications([]);
    }
  };

  const loadDynamicTaskData = async () => {
    setIsLoading(true);

    try {
      console.log("Loading tasks and workflow configuration...");

      // 1. Load ALL tasks (active + inactive) to build complete structure
      const allResult = await getAllTasks("");
      if (!allResult.success) {
        console.error("Failed to fetch tasks:", allResult.message);
        setIsLoading(false);
        return;
      }

      const allTasks = allResult.data;
      console.log(`Loaded ${allTasks.length} total tasks`);

      // 2. Country tabs are always Germany + UK (fixed)
      setCountries(["Germany", "UK"]);

      // 3. Build applicationId → country map by resolving app→course→university
      //    This is needed because raw tasks have no country field.
      console.log("Building applicationId→country map...");
      const uniqueAppIds = [...new Set(allTasks.map(t => t.applicationId || t.application_id).filter(Boolean))];
      const appCountryMap = new Map();

      await Promise.all(uniqueAppIds.map(async (appId) => {
        try {
          const appResult = await getApplication(appId);
          if (appResult.success && appResult.data?.target_course_id) {
            const course = await getCourse(appResult.data.target_course_id);
            if (course?.university_id) {
              const university = await getUniversity(course.university_id);
              if (university?.country) {
                const normalized = normalizeCountryForFilter(university.country);
                if (normalized) appCountryMap.set(appId, normalized);
              }
            }
          }
        } catch (e) {
          // skip — this application just won't be country-tagged
        }
      }));

      console.log(`Country map built: ${appCountryMap.size} applications resolved`);
      appCountryMap.forEach((country, appId) => {
        console.log(`  ${appId} → ${country}`);
      });

      // 4. Fetch workflow config from current-country application first, then fallback to any
      const countryMatchTask = allTasks.find(task => (task.applicationId || task.application_id) && appCountryMap.get(task.applicationId || task.application_id) === selectedCountry);
      const fallbackTask = allTasks.find(task => (task.applicationId || task.application_id));
      const workflowTask = countryMatchTask || fallbackTask;
      if (workflowTask) {
        await fetchWorkflowConfig(workflowTask.applicationId || workflowTask.application_id);
      }

      // 5. Tag each raw task with its resolved country
      const taggedTasks = allTasks.map(task => ({
        ...task,
        applicationId: task.applicationId || task.application_id, // Normalize applicationId
        country: appCountryMap.get(task.applicationId || task.application_id) || null,
      }));

      // Store tagged tasks — used by rebuildFiltersForCountry & country switching
      setAllFetchedTasks(taggedTasks);

      // 6. Build initial stages for the currently selected country
      rebuildFiltersForCountry(taggedTasks, selectedCountry);

    } catch (err) {
      console.error("Error loading dynamic task data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Replace the fetchFilteredTasks function
  const fetchFilteredTasks = async (overrideStage = undefined, overrideTaskType = undefined, freshTaggedTasks = undefined) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();

      queryParams.append('active', 'true');

      const activeStage = overrideStage !== undefined ? overrideStage : selectedStage;
      const activeTaskType = overrideTaskType !== undefined ? overrideTaskType : selectedTaskType;

      if (activeStage) {
        queryParams.append('stages', activeStage);
        // Only filter by taskType if one is explicitly selected
        if (activeTaskType) {
          queryParams.append('taskTypes', activeTaskType);
        }
      } else {
        // No stage selected yet — show nothing
        setApplications([]);
        setIsLoading(false);
        return;
      }

      if (selectedStatus !== 'all') queryParams.append('taskStatuses', selectedStatus);
      if (selectedPriority !== 'all') queryParams.append('priorities', selectedPriority);

      console.log('🔍 Fetching tasks with filters:', queryParams.toString());

      // Use freshTaggedTasks if provided (avoids stale closure), otherwise fall back to state
      const activeTags = freshTaggedTasks || allFetchedTasks;

      const result = await getAllTasks(queryParams.toString());
      if (result.success) {
        console.log(`📋 Found ${result.data.length} tasks for ${activeStage} > ${activeTaskType || 'ALL'}`);
        // Pre-filter by country using the active tag list and enforce frontend schema
        const countryTagged = result.data.map(task => ({
          ...task,
          applicationId: task.applicationId || task.application_id // Normalize applicationId
        })).filter(task => {
          const taggedTask = activeTags.find(t => t.taskId === task.taskId);
          if (!taggedTask) return false;
          
          // Must match selected country
          if (normalizeCountryForFilter(taggedTask.country) !== selectedCountry) return false;
          
          // Enforce Frontend Workflow Schema
          const schema = WORKFLOW_SCHEMAS[selectedCountry];
          if (!schema) return false;
          
          const matchingStage = schema.find(s => s.filterId === task.stage);
          if (!matchingStage) return false; // Stage not in FE schema
          
          const matchingTaskType = matchingStage.taskTypes.find(tt => tt.filterId === task.taskType);
          if (!matchingTaskType) return false; // Task type not in FE schema
          
          return true;
        });
        console.log(`🌍 Country-filtered to ${countryTagged.length} tasks for ${selectedCountry} (schema enforced)`);
        await processTasksWithDetails(countryTagged);
      }
    } catch (err) {
      console.error("Error fetching filtered tasks:", err);
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
        let institutionType = "N/A";
        let uniCountry = null;

        // Kick off workflow progress + task details in parallel immediately
        const progressPromise = task.applicationId
          ? getWorkflowProgress(task.applicationId)
          : Promise.resolve(null);
        const detailsPromise = getTaskDetails(task.taskId);

        // Fetch Application (cache hit after loadDynamicTaskData)
        if (task.applicationId) {
          const appResult = await getApplication(task.applicationId);
          if (appResult.success) {
            applicationData = appResult.data;

            intakeTerm = applicationData?.target_semester || "N/A";
            intakeYear = applicationData?.target_year || "";
            referenceNumber = applicationData?.reference_number || "";

            // Fetch Course (cache hit)
            if (applicationData.target_course_id) {
              const course = await getCourse(applicationData.target_course_id);
              if (course) {
                programName = course.name || "N/A";

                // Fetch University (cache hit)
                if (course.university_id) {
                  const university = await getUniversity(course.university_id);
                  if (university) {
                    universityName = university.name || "N/A";
                    institutionType = university.institutionType || university.institution_type || "N/A";
                    uniCountry = university.country || null;
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
              institutionType,
            };
          }
        }

        // Resolve parallel promises
        const [progressResult, detailsResult] = await Promise.all([
          progressPromise,
          detailsPromise,
        ]);

        const progress = progressResult?.success ? progressResult.data : null;
        const taskDetails = detailsResult?.success ? detailsResult.data : {};
        
        // Extract student details dynamically with fallbacks
        const studentObj = applicationData?.student || taskDetails?.student || {};
        const name = studentObj.name || studentObj.fullName || applicationData?.studentName || taskDetails?.studentName || "N/A";
        const email = studentObj.email || applicationData?.studentEmail || taskDetails?.studentEmail || "N/A";
        const phone = studentObj.phoneNumber || studentObj.phone || applicationData?.phoneNumber || applicationData?.phone || taskDetails?.phoneNumber || "N/A";

        return {
          id: task.taskId,
          taskId: task.taskId,
          applicationId: task.applicationId,
          studentName: name,
          studentEmail: email,
          phone: phone,
          cgpa: applicationData?.cgpa || taskDetails?.cgpa || "N/A",
          university: universityName !== "N/A" ? universityName : (applicationData?.universityName || "N/A"),
          course: programName !== "N/A" ? programName : (applicationData?.courseName || applicationData?.programName || "N/A"),
          intake: intakeYear ? `${intakeTerm} ${intakeYear}` : (intakeTerm !== "N/A" ? intakeTerm : (applicationData?.intakeTerm || "N/A")),
          institutionType: institutionType !== "N/A" ? institutionType : (applicationData?.institutionType || "N/A"),
          country: uniCountry || applicationData?.countryCode || applicationData?.country || taskDetails?.country || "N/A",
          city: applicationData?.city || taskDetails?.city || "N/A",
          referenceNumber: referenceNumber,
          submittedAt: applicationData?.submittedAt || taskDetails?.submittedAt || null,
          completionPercentage: applicationData?.completionPercentage || progress?.percentage || 0,
          status: task.taskStatus,
          stage: task.stage,
          taskType: task.taskType,
          priority: task.priority,
          assignedTo: task.assignee || taskDetails?.assignedTo || null,
          assignedAdminName: applicationData?.assigned_admin_name || null,
          assignedAdminEmail: applicationData?.assigned_admin_email || null,
          isClaimable: isTaskClaimable(task),
          progress,
          applicationData
        };
      })
    );

    console.log('Processed tasks with details:', tasksWithDetails.length);

    setApplicationsMap(newApplicationsMap);
    setApplications(tasksWithDetails);
  };



  const isTaskClaimable = (task) => {
    if (task.stage === "APPLICATION_REVIEW") {
      return true;
    }

    // Default claimable logic
    return task.taskStatus === "CREATED" && (!task.assignee || task.assignee === null);
  };

  const formatDisplayName = (str) => {
    if (!str) return "N/A";
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const updateFilterCounts = (allTasks) => {
    // Rebuild filter counts without changing selected filters
    const stageMap = new Map();
    const statusMap = new Map();
    const priorityMap = new Map();
    const activeMap = new Map();

    allTasks.forEach((task) => {
      // Stages
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

      // Task Types
      if (!stage.taskTypes.has(task.taskType)) {
        stage.taskTypes.set(task.taskType, {
          filterId: task.taskType,
          name: formatDisplayName(task.taskType),
          count: 0,
        });
      }
      stage.taskTypes.get(task.taskType).count++;

      // Statuses
      if (!statusMap.has(task.taskStatus)) {
        statusMap.set(task.taskStatus, {
          filterId: task.taskStatus,
          name: formatDisplayName(task.taskStatus),
          count: 0,
        });
      }
      statusMap.get(task.taskStatus).count++;

      // Priorities
      if (!priorityMap.has(task.priority)) {
        priorityMap.set(task.priority, {
          filterId: task.priority,
          name: `Priority ${task.priority}`,
          count: 0,
        });
      }
      priorityMap.get(task.priority).count++;

      // Active states
      const activeValue = task.active !== undefined ? task.active.toString() : 'true';
      if (!activeMap.has(activeValue)) {
        activeMap.set(activeValue, {
          filterId: activeValue,
          name: activeValue === 'true' ? 'Active' : 'Inactive',
          count: 0,
        });
      }
      activeMap.get(activeValue).count++;
    });

    // Convert to arrays
    const stages = Array.from(stageMap.values()).map((stage: any) => ({
      filterId: stage.filterId,
      name: stage.name,
      count: stage.count,
      taskTypes: Array.from((stage.taskTypes as Map<string, any>).values()).sort((a: any, b: any) => b.count - a.count),
    }));

    const taskStatuses = Array.from(statusMap.values());
    const priorities = Array.from(priorityMap.values()).sort((a: any, b: any) => a.filterId - b.filterId);
    const active = Array.from(activeMap.values());

    // Update filter state
    setAvailableFilters({
      stages,
      taskTypes: [],
      taskStatuses,
      priorities,
      active,
    });

    console.log('Filter counts updated');
  };

  // refreshAllDataAfterTaskAction function
  const refreshAllDataAfterTaskAction = async (applicationId) => {
    console.log('🔄 FULL REFRESH: Reloading filters and tasks...');
    setIsLoading(true);

    try {
      await waitForBackendProcessing(1200);

      // Clear cached workflow data so we get fresh state from the backend
      clearDashboardCache(applicationId);

      // ✅ Retry logic for workflow state with exponential backoff
      let workflowState = null;
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries && !workflowState?.success) {
        workflowState = await getWorkflowProgress(applicationId);
        if (!workflowState.success) {
          const waitTime = 400 * (retries + 1);
          console.log(`⚠️ Retry ${retries + 1}/${maxRetries} - Waiting ${waitTime}ms...`);
          await waitForBackendProcessing(waitTime);
          retries++;
        }
      }

      if (!workflowState.success || !workflowState.data) {
        console.error('❌ Failed to get workflow progress after retries');
        await fetchFilteredTasks();
        setIsLoading(false);
        return;
      }

      const newStage = workflowState.data.stage;
      const newTaskType = workflowState.data.currentStep;
      console.log('✅ Task moved to:', { newStage, newTaskType });

      // Reload ALL tasks and rebuild country map
      const allTasksResult = await getAllTasks("");
      if (!allTasksResult.success) {
        console.error('Failed to fetch all tasks');
        setIsLoading(false);
        return;
      }

      const allTasks = allTasksResult.data;

      // Re-resolve country for each application (reuse existing approach)
      const uniqueAppIds = [...new Set(allTasks.filter(t => t.applicationId).map(t => t.applicationId))];
      const appCountryMap = new Map();
      await Promise.all(uniqueAppIds.map(async (appId) => {
        try {
          const appResult = await getApplication(appId);
          if (appResult.success && appResult.data?.target_course_id) {
            const course = await getCourse(appResult.data.target_course_id);
            if (course?.university_id) {
              const university = await getUniversity(course.university_id);
              if (university?.country) {
                const normalized = normalizeCountryForFilter(university.country);
                if (normalized) appCountryMap.set(appId, normalized);
              }
            }
          }
        } catch (e) { /* skip */ }
      }));

      const taggedTasks = allTasks.map(task => ({
        ...task,
        country: appCountryMap.get(task.applicationId) || null,
      }));

      // Update the stored tagged tasks
      setAllFetchedTasks(taggedTasks);

      // Rebuild filters for the current country only (country-aware)
      rebuildFiltersForCountry(taggedTasks, selectedCountry);

      console.log('✅ Updated all filters for country:', selectedCountry);

      // Switch to the NEW stage
      setSelectedStage(newStage);
      setSelectedTaskType(newTaskType || null);
      setSelectedActive('true');

      // Small delay before fetching to ensure state is set
      await waitForBackendProcessing(200);

      // Fetch tasks for the NEW stage (already country-filtered in fetchFilteredTasks)
      await fetchFilteredTasks(newStage, newTaskType || null, taggedTasks);

      console.log('FULL REFRESH COMPLETE!');

    } catch (error) {
      console.error('❌ Error in full refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats dynamically
  // Calculate stats from ALL tasks (including APPLICATION_CLAIM), filtered by selected country
const countryAllTasks = allFetchedTasks.filter(
  t => normalizeCountryForFilter(t.country) === selectedCountry
);

const uniqueApplicationIds = new Set(
  countryAllTasks
    .filter(t => t.taskType !== 'APPLICATION_CLAIM') // exclude unclaimed — count only real in-progress apps
    .map(t => t.applicationId)
    .filter(Boolean)
);
const totalApplications = uniqueApplicationIds.size;

const activeApplicationIds = new Set(
  countryAllTasks
    .filter(t =>
      t.taskType !== 'APPLICATION_CLAIM' &&
      t.taskStatus &&
      !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(t.taskStatus.toUpperCase())
    )
    .map(t => t.applicationId)
    .filter(Boolean)
);
const activeApplications = activeApplicationIds.size;

// Derive claimPendingCount from availableFilters so it always matches
// the APPLICATION_REVIEW > APPLICATION_CLAIM count shown in the stage tab.
const applicationReviewStage = availableFilters.stages.find(
  s => s.filterId === 'APPLICATION_REVIEW'
);
const claimPendingCount =
  applicationReviewStage?.taskTypes?.find(tt => tt.filterId === 'APPLICATION_CLAIM')?.count ?? 0;

  const statsCards = [
    {
      title: "Total Applications",
      value: totalApplications.toString(),
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: `${totalApplications} applications`,
    },
    {
      title: "Active Applications",
      value: activeApplications.toString(),
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: "In progress",
    },
    {
      title: "Claims Pending",
      value: claimPendingCount.toString(),
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-100",
      change: claimPendingCount === 1 ? "1 application awaiting claim" : `${claimPendingCount} applications awaiting claim`,
    },
  ];

  // Replace handleClaimApplication function
  const handleClaimApplication = async (taskId) => {
    setClaimingAppId(taskId);
    setClaimError(null);

    try {
      const app = applications.find(a => a.taskId === taskId);

      const result = await claimTask(taskId);

      if (result.success) {
        console.log('✅ Task claimed successfully');

        clearDashboardCache(app?.applicationId);
        await waitForBackendProcessing(1200);
        await refreshAllDataAfterTaskAction(app.applicationId);

      } else {
        let errorMessage = result.message || 'Failed to claim application';

        if (errorMessage.includes('not claimable')) {
          errorMessage = 'This task is not available for claiming.';
        } else if (errorMessage.includes('already claimed')) {
          errorMessage = 'This task has already been claimed by another admin.';
        }

        setClaimError(errorMessage);
        setShowErrorModal(true);
        await fetchFilteredTasks();
      }
    } catch (error) {
      console.error('Error claiming application:', error);
      setClaimError('An unexpected error occurred while claiming the application');
      setShowErrorModal(true);
    } finally {
      setClaimingAppId(null);
    }
  };

  const handleCompleteTask = async (taskId, applicationId, skipConfirmation = false) => {
    console.log(' Starting task completion', { taskId, applicationId });

    console.log('📍 Current State:', {
      selectedStage,
      selectedTaskType,
      selectedActive,
      appStage: selectedApp?.stage,
      appTaskType: selectedApp?.taskType
    });

    setCompletionErrors({});
    setClaimingAppId(taskId);

    try {
      // ✅ AUTO-CLAIM: If task is claimable, claim it first
      if (selectedApp?.isClaimable) {
        console.log('🔥 Task is claimable, claiming first...');
        const claimResult = await claimTask(taskId);

        if (!claimResult.success) {
          setClaimError(claimResult.message || 'Failed to claim task');
          setShowErrorModal(true);
          setClaimingAppId(null);
          return;
        }

        console.log('✅ Task claimed successfully - backend has moved it to next stage');

        // ✅ Wait for backend to process with proper delay
        clearDashboardCache(applicationId);
        await waitForBackendProcessing(1200);
        await refreshAllDataAfterTaskAction(applicationId);

        // Close modal and move to next task directly
        setShowDetailModal(false);

        // Reset state
        setTaskRequirements(null);
        setCompletionForm({});
        setCompletionFlags({});
        setHasLoadedRequirements(false);
        setClaimingAppId(null);

        return; // ✅ STOP HERE - claiming is done, task has moved
      }

      // Show confirmation modal before completing (unless already confirmed)
      if (!skipConfirmation) {
        setPendingTaskCompletion({ taskId, applicationId });
        setShowConfirmCompleteModal(true);
        setClaimingAppId(null);
        return;
      }

      // Validate required flags (skip for APPLICATION_REVIEW stage)
      if (taskRequirements?.requiredFlags &&
        taskRequirements.requiredFlags.length > 0 &&
        selectedApp?.stage !== 'APPLICATION_REVIEW') {
        const uncheckedFlags = taskRequirements.requiredFlags.filter(
          flag => !completionFlags[flag]
        );

        if (uncheckedFlags.length > 0) {
          console.error('Unchecked required flags:', uncheckedFlags);
          setClaimError(`Please check all required flags: ${uncheckedFlags.join(', ')}`);
          setShowErrorModal(true);
          setClaimingAppId(null);
          return;
        }
      }

      // Build taskResults
      const taskResults = {};

      if (taskRequirements?.requiredFormFields && taskRequirements.requiredFormFields.length > 0) {
        const missingFields = taskRequirements.requiredFormFields.filter(
          field => !completionForm[field] || completionForm[field].trim() === ''
        );

        if (missingFields.length > 0) {
          const errMap = {};
          missingFields.forEach(f => errMap[f] = "This field is required");
          setCompletionErrors(errMap);
          setClaimError(`Please fill in required fields: ${missingFields.join(', ')}`);
          setShowErrorModal(true);
          setClaimingAppId(null);
          return;
        }

        taskRequirements.requiredFormFields.forEach(field => {
          if (completionForm[field]) {
            taskResults[field] = completionForm[field];
          }
        });
      } else if (taskRequirements?.requiredFlags && taskRequirements.requiredFlags.length > 0) {
        // For flag-only tasks, send empty taskResults
        // Flags are already set via setApplicationFlags
      } else if (!taskRequirements ||
        (!taskRequirements.requiredFormFields?.length && !taskRequirements.requiredFlags?.length)) {
        // Task has NO requirements - allow completion with empty taskResults
        console.log('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Task has no requirements, completing automatically');
      }

      const payload = {
        completionNotes: "Task completed successfully",
        taskResults: taskResults
      };

      console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Âµ Calling /complete API with payload:', payload);
      const result = await completeTask(taskId, payload);

      if (!result.success) {
        let errorMessage = 'Failed to complete task';

        if (result.error?.response?.data) {
          const errorData = result.error.response.data;
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (result.message) {
          errorMessage = result.message;
        }

        setClaimError(errorMessage);
        setShowErrorModal(true);
        setClaimingAppId(null);
        return;
      }

      setShowDetailModal(false);

      // Check if this was the final step for the current country
      const rules = FINAL_WORKFLOW_RULES[selectedCountry] || { stage: null, taskType: null };
      const isLastStage = selectedApp && selectedApp.stage === rules.stage && (!rules.taskType || selectedApp.taskType === rules.taskType);

      if (isLastStage) {
        // Wait for backend processing and refresh to fully complete first
        await waitForBackendProcessing(1200);
        await refreshAllDataAfterTaskAction(applicationId);

        // Only THEN show the completion popup after loading is done
        setCompletedAppDetails({
          university: selectedApp?.university || 'N/A',
          course: selectedApp?.course || 'N/A',
          referenceNumber: selectedApp?.referenceNumber || '',
          country: selectedCountry,
        });
        setShowApplicationCompleteModal(true);
      } else {
        await waitForBackendProcessing(1200);
        // Normal flow — refresh and move to next stage
        await refreshAllDataAfterTaskAction(applicationId);
      }

      // Reset state
      setTaskRequirements(null);
      setCompletionForm({});
      setCompletionFlags({});
      setHasLoadedRequirements(false);

    } catch (error) {
      console.error('❌ Unexpected error during task completion:', error);

      let errorMessage = 'An unexpected error occurred';

      if (error.response?.data?.error?.fieldErrors) {
        // Handle validation errors from API
        const fieldErrors = error.response.data.error.fieldErrors;
        if (fieldErrors.recommendation) {
          errorMessage = fieldErrors.recommendation;
        } else if (fieldErrors.missingFlags) {
          errorMessage = `Missing required flags: ${fieldErrors.missingFlags}`;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setClaimError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setClaimingAppId(null);
    }
  };


  const getApplicationsForCurrentView = () => {
    // Filter by selected country using normalized comparison
    return applications.filter(app => {
      const normalized = normalizeCountryForFilter(app.country);
      return normalized === selectedCountry;
    });
  };

  // DetailModal rendering logic - inlined to prevent scroll reset on re-render
  const renderDetailModal = () => {
    const app = selectedApp;
    if (!showDetailModal || !app) return null;

    const applicationDetails = applicationsMap?.[app?.applicationId] || null;

    const hasValue = (value, defaultValue = "N/A") => {
      return value && value !== defaultValue && value !== "Student Name" && value !== "University Name";
    };

    const displayUniversity = applicationDetails?.universityName || app.university || "N/A";
    const displayProgram = applicationDetails?.programName || app.course || "N/A";
    const displayIntake = applicationDetails?.intakeTerm
      ? `${applicationDetails.intakeTerm} ${applicationDetails.intakeYear}`
      : app.intake || "N/A";

    const studentInfo = [];
    if (hasValue(app.studentName)) studentInfo.push({ label: "Name", value: app.studentName });
    if (hasValue(app.studentEmail)) studentInfo.push({ label: "Email", value: app.studentEmail });
    if (hasValue(app.phone)) studentInfo.push({ label: "Phone", value: app.phone });
    if (hasValue(app.cgpa)) studentInfo.push({ label: "CGPA", value: app.cgpa });

    const applicationInfo = [];
    if (hasValue(displayUniversity, "N/A")) applicationInfo.push({ label: "University", value: displayUniversity });
    if (hasValue(displayProgram, "N/A")) applicationInfo.push({ label: "Program", value: displayProgram });
    if (hasValue(displayIntake, "N/A")) applicationInfo.push({ label: "Intake", value: displayIntake });
    if (hasValue(app.country)) applicationInfo.push({ label: "Country", value: app.country });
    if (hasValue(app.city)) applicationInfo.push({ label: "City", value: app.city });
    if (hasValue(applicationDetails?.referenceNumber || app.referenceNumber)) {
      applicationInfo.push({ label: "Reference", value: applicationDetails?.referenceNumber || app.referenceNumber });
    }
    if (hasValue(applicationDetails?.institutionType || app.institutionType)) {
      applicationInfo.push({
        label: "Institution Type",
        value: applicationDetails?.institutionType || app.institutionType
      });
    }
    if (app.submittedAt) applicationInfo.push({ label: "Submitted", value: new Date(app.submittedAt).toLocaleDateString() });
    // Show assigned admin info only for non-APPLICATION_REVIEW stages
    if (app.stage !== 'APPLICATION_REVIEW' && (app.assignedAdminName || app.assignedAdminEmail)) {
      applicationInfo.push({ label: "Assigned Admin", value: app.assignedAdminName || '—' });
      if (app.assignedAdminEmail) {
        applicationInfo.push({ label: "Admin Email", value: app.assignedAdminEmail });
      }
    }

    const taskInfo = [];
    taskInfo.push({ label: "Type", value: formatDisplayName(app.taskType) });
    taskInfo.push({ label: "Status", value: app.status, isBadge: true });

    taskInfo.push({ label: "Stage", value: formatDisplayName(app.stage) });

    const onClose = () => {
      setShowDetailModal(false);
      setHasLoadedRequirements(false);
      setSelectedApp(null);
    };

    let resourceLink = null;
    const currentCountry = selectedCountry || app.country;
    if (currentCountry === 'Germany') {
      if (app.stage === 'CERTIFICATION_PROCESS' && app.taskType === 'APS_CERTIFICATE') {
        resourceLink = 'https://aps-india.de/';
      } else if (app.stage === 'UNIVERSITY_SUBMISSION') {
        resourceLink = 'https://www.daad.de/en/';
      } else if (app.stage === 'VISA_APPLICATION') {
        if (app.taskType === 'VISA_APPLICATION_COMPLETED') resourceLink = 'https://videx.diplo.de/videx/visum-erfassung/de/videx-kurzfristiger-aufenthalt';
        else if (['VISA_APPLICATION_SCHEDULED', 'VISA_APPLICATION_RESULT'].includes(app.taskType)) resourceLink = 'https://www.vfsglobal.com/en/individuals/index.html';
      }
    } else if (currentCountry === 'UK') {
      if (app.stage === 'CAS_INTERVIEW') {
        if (['CAS_INTERVIEW_SCHEDULED', 'CAS_INTERVIEW_COMPLETED', 'CAS_INTERVIEW_PASSED'].includes(app.taskType)) resourceLink = 'https://www.ucas.com/';
      } else if (app.stage === 'UNIVERSITY_SUBMISSION') {
        resourceLink = 'https://www.daad.de/en/';
      } else if (app.stage === 'VISA_APPLICATION') {
        if (['VISA_APPLICATION_COMPLETED', 'VISA_APPLICATION_SCHEDULED', 'VISA_APPLICATION_RESULT'].includes(app.taskType)) resourceLink = 'https://www.gov.uk/student-visa';
      }
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl uni-card max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-background p-6 border-b border-border z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {hasValue(displayUniversity) ? displayUniversity : 'Task Details'}
                  </h2>
                  {hasValue(displayProgram) && (
                    <p className="text-sm text-muted-foreground">{displayProgram}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {app.stage === 'APPLICATION_REVIEW' && (
                  <Button
                    onClick={async () => {
                      const studentId = applicationDetails?.student_id || app.applicationData?.student_id || app.applicationData?.userId || app.applicationData?.user_id;
                      if (!studentId) {
                        setClaimError("Student ID could not be found for this application.");
                        setShowErrorModal(true);
                        return;
                      }
                      setIsLoadingProfile(true);
                      setShowStudentProfileModal(true);
                      const res = await getStudentProfileForAdmin(studentId);
                      setIsLoadingProfile(false);
                      if (res.success && res.data) {
                        setStudentProfileData(res.data);
                      } else {
                        setStudentProfileData(null);
                        setClaimError(res.message || "Failed to load student profile");
                        setShowErrorModal(true);
                      }
                    }}
                    className="uni-btn-secondary h-8 text-sm px-3"
                    size="sm"
                    disabled={isLoadingProfile}
                  >
                    {isLoadingProfile ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-1" /> View Student Details</>
                    )}
                  </Button>
                )}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {studentInfo.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Student Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {studentInfo.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {applicationInfo.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Application Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {applicationInfo.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {taskRequirements && (taskRequirements.requiredFlags?.length > 0 || taskRequirements.requiredFormFields?.length > 0) && (
              <div className="space-y-4 p-4 border rounded mt-4 bg-blue-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-foreground">Complete Task Requirements</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  Please fill in all required fields and check all required items below.
                </p>

                {/* Quick Access Links */}
                <div className={`grid gap-3 p-3 bg-white rounded-lg border border-blue-200 ${resourceLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <button
                    type="button"
                    onClick={() => {
                        const targetStudentId = applicationDetails?.student_id || app.applicationData?.student_id || app.applicationData?.userId || app.applicationData?.user_id;
                        navigate('/documents', { 
                          state: { 
                            applicationId: app.applicationId, 
                            studentId: targetStudentId,
                            dashboardState: {
                              selectedCountry,
                              selectedStage,
                              selectedTaskType
                            }
                          } 
                        });
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <FileText className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">View Documents</p>
                      <p className="text-xs text-gray-500">Check uploaded files</p>
                    </div>
                  </button>

                  {resourceLink && (
                    <button
                      type="button"
                      onClick={() => window.open(resourceLink, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                    >
                      <Globe className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900">Application Resources</p>
                        <p className="text-xs text-gray-500">Access external links</p>
                      </div>
                    </button>
                  )}
                </div>

                {taskRequirements.requiredFlags?.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm text-blue-900">Required Checks</p>
                    {taskRequirements.requiredFlags.map((flag) => (
                      <label
                        key={flag}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-blue-100 ${completionFlags[flag] ? 'bg-green-50 border border-green-200' : ''
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={completionFlags[flag] || false}
                          onChange={(e) => {
                            const isChecked = e.target.checked;

                            // Update state immediately (optimistic update)
                            const newFlags = {
                              ...completionFlags,
                              [flag]: isChecked,
                            };
                            setCompletionFlags(newFlags);

                            // Save to localStorage immediately
                            saveFlagsToLocalStorage(app.applicationId, newFlags);

                            // Fire-and-forget: save to backend in background without awaiting
                            const flagPayload = {
                              flags: { [flag]: isChecked },
                              notes: `Admin ${isChecked ? 'checked' : 'unchecked'} ${flag}`
                            };

                            setApplicationFlags(app.applicationId, flagPayload)
                              .then((result) => {
                                if (!result.success) {
                                  // Revert on backend failure
                                  setCompletionFlags((prev) => ({
                                    ...prev,
                                    [flag]: !isChecked,
                                  }));
                                  saveFlagsToLocalStorage(app.applicationId, {
                                    ...newFlags,
                                    [flag]: !isChecked,
                                  });
                                }
                              })
                              .catch((error) => {
                                console.error('Error updating flag:', error);
                                // Revert on error
                                setCompletionFlags((prev) => ({
                                  ...prev,
                                  [flag]: !isChecked,
                                }));
                                saveFlagsToLocalStorage(app.applicationId, {
                                  ...newFlags,
                                  [flag]: !isChecked,
                                });
                              });
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="capitalize text-sm">{formatDisplayName(flag)}</span>
                        {completionFlags[flag] && (
                          <Check className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {taskRequirements.requiredFormFields?.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium text-sm text-blue-900">Required Details</p>
                    {taskRequirements.requiredFormFields.map((field) => (
                      <div key={field}>
                        <label className="text-sm font-medium capitalize block mb-1">
                          {formatDisplayName(field)} *
                        </label>
                        <input
                          type="text"
                          className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter ${formatDisplayName(field)}`}
                          value={completionForm[field] || ''}
                          onChange={(e) =>
                            setCompletionForm((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                        />
                        {completionErrors[field] && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {completionErrors[field]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}


              </div>
            )}

            {app.progress && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Application Progress</h3>
                </div>
                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-primary">
                      {app.completionPercentage || app.progress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${app.completionPercentage || app.progress.percentage}%` }}
                    />
                  </div>
                  {app.progress.currentStep && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Step</p>
                        <p className="font-medium text-foreground">{formatDisplayName(app.progress.currentStep)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stage</p>
                        <p className="font-medium text-foreground">{formatDisplayName(app.progress.stage)}</p>
                      </div>
                    </div>
                  )}
                  {app.progress.completedSteps && app.progress.completedSteps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Completed Steps</p>
                      <div className="flex flex-wrap gap-1.5">
                        {app.progress.completedSteps.map((step, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            {formatDisplayName(step)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-background p-6 border-t border-border">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="uni-btn-ghost"
              >
                Cancel
              </Button>

              {isTaskClaimable(app) && app.status !== "CLAIMED" && (
                <Button
                  onClick={() => {
                    handleCompleteTask(app.taskId, app.applicationId);
                    onClose();
                  }}
                  className="uni-btn-primary"
                  disabled={claimingAppId === app.taskId}
                >
                  {claimingAppId === app.taskId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Claim Task
                    </>
                  )}
                </Button>
              )}

              {!app.isClaimable &&
                app.status !== "COMPLETED" &&
                taskRequirements && (
                  <Button
                    onClick={() => handleCompleteTask(app.taskId, app.applicationId)}
                    className="uni-btn-secondary"
                    disabled={claimingAppId === app.taskId}
                  >
                    {claimingAppId === app.taskId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Task
                      </>
                    )}
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>
    , document.body);
  };

 const StudentProfileModal = () => (
    showStudentProfileModal && createPortal(
       <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStudentProfileModal(false)} />
        <div className="relative w-full max-w-2xl uni-card max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-background p-6 border-b border-border z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Student Profile Details</h2>
              </div>
              <button onClick={() => setShowStudentProfileModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {isLoadingProfile ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : studentProfileData ? (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Full Name</p>
                    <p className="font-semibold">{studentProfileData.userInfo?.fullName || studentProfileData.profileData?.basic_info?.full_name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                    <p className="font-semibold">{studentProfileData.userInfo?.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Phone Number</p>
                    <p className="font-semibold">{studentProfileData.userInfo?.phoneNumber || studentProfileData.profileData?.basic_info?.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Account Status & ID</p>
                    <div className="flex items-center gap-2">
                       <Badge variant={studentProfileData.userInfo?.status === 'ACTIVE' ? 'default' : 'secondary'} className={studentProfileData.userInfo?.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                         {studentProfileData.userInfo?.status || 'N/A'}
                       </Badge>
                       <span className="text-sm font-semibold text-muted-foreground">ID: {studentProfileData.userId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Profile Data - Basic Info */}
                {studentProfileData.profileData?.basic_info && (
                  <div className="pt-2 border-t border-border">
                    <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p className="text-sm font-medium">{studentProfileData.profileData.basic_info.date_of_birth || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm font-medium capitalize">{studentProfileData.profileData.basic_info.gender || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nationality</p>
                        <p className="text-sm font-medium capitalize">{studentProfileData.profileData.basic_info.nationality || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Country / City</p>
                        <p className="text-sm font-medium">{studentProfileData.profileData.basic_info.current_country || '-'} / {studentProfileData.profileData.basic_info.current_city || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Passport Number</p>
                        <p className="text-sm font-medium">{studentProfileData.profileData.basic_info.passport_number || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Emergency Contact</p>
                        <p className="text-sm font-medium">{studentProfileData.profileData.basic_info.emergency_contact_name || '-'} ({studentProfileData.profileData.basic_info.emergency_contact_phone || '-'})</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic & Test Scores */}
                <div className="pt-4 border-t border-border">
                   <h3 className="text-lg font-semibold mb-3">Academics & Tests</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Education Details */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-primary">Education Entries</h4>
                        {studentProfileData.profileData?.education?.education_entries?.length > 0 ? (
                            studentProfileData.profileData.education.education_entries.map((edu, idx) => (
                               <div key={idx} className="bg-muted p-3 rounded-md text-sm mb-2 shadow-sm border border-border">
                                  <p><span className="text-muted-foreground mr-1">Institution:</span> {edu.institution_name}</p>
                                  <p><span className="text-muted-foreground mr-1">Level:</span> <span className="capitalize">{edu.education_level?.replace('_', ' ')}</span></p>
                                  <p><span className="text-muted-foreground mr-1">Field:</span> <span className="uppercase">{edu.field_of_study}</span></p>
                                  <p><span className="text-muted-foreground mr-1">GPA:</span> {edu.gpa}%</p>
                                  <p><span className="text-muted-foreground mr-1">Grad Year:</span> {edu.graduation_year}</p>
                                  {edu.academic_honors && <p><span className="text-muted-foreground mr-1">Honors:</span> {edu.academic_honors}</p>}
                               </div>
                            ))
                        ) : <p className="text-sm text-muted-foreground">No education entries found.</p>}
                      </div>

                      {/* Test Scores */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-primary">Standardized Test Scores</h4>
                        {studentProfileData.profileData?.test_scores?.test_type ? (
                           <div className="bg-muted p-3 rounded-md text-sm shadow-sm border border-border">
                              <p><span className="text-muted-foreground mr-1">Type:</span> {studentProfileData.profileData.test_scores.test_type}</p>
                              <p><span className="text-muted-foreground mr-1">Overall:</span> {studentProfileData.profileData.test_scores.overall_score}</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 bg-background p-2 rounded">
                                <p><span className="text-muted-foreground mr-1">Reading:</span> {studentProfileData.profileData.test_scores.reading_score || '-'}</p>
                                <p><span className="text-muted-foreground mr-1">Writing:</span> {studentProfileData.profileData.test_scores.writing_score || '-'}</p>
                                <p><span className="text-muted-foreground mr-1">Speaking:</span> {studentProfileData.profileData.test_scores.speaking_score || '-'}</p>
                                <p><span className="text-muted-foreground mr-1">Listening:</span> {studentProfileData.profileData.test_scores.listening_score || '-'}</p>
                              </div>
                              {studentProfileData.profileData.test_scores.test_date && <p className="mt-2 text-xs"><span className="text-muted-foreground">Date:</span> {studentProfileData.profileData.test_scores.test_date}</p>}
                           </div>
                        ) : <p className="text-sm text-muted-foreground">No primary test scores.</p>}
                      </div>
                   </div>
                </div>

                {/* Preferences & Goals & Financial */}
                <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <h3 className="text-lg font-semibold mb-3">Study Preferences</h3>
                     {studentProfileData.profileData?.preferences ? (
                       <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border">
                         <p><span className="text-muted-foreground mr-1">Degree Level:</span> {studentProfileData.profileData.preferences.degree_level || '-'}</p>
                         <p><span className="text-muted-foreground mr-1">Intake:</span> <span className="capitalize">{studentProfileData.profileData.preferences.intake_semester || '-'}</span> {studentProfileData.profileData.preferences.intake_year || '-'}</p>
                         <p><span className="text-muted-foreground mr-1">Countries:</span> <span className="capitalize">{studentProfileData.profileData.preferences.preferred_countries?.join(', ') || '-'}</span></p>
                         <p><span className="text-muted-foreground mr-1">Programs:</span> {(studentProfileData.profileData.preferences.preferred_programs || []).join(', ') || '-'}</p>
                         <p><span className="text-muted-foreground mr-1">Accommodation:</span> {studentProfileData.profileData.preferences.accommodation_preference || '-'}</p>
                         <p><span className="text-muted-foreground mr-1">Ranking Pref:</span> {studentProfileData.profileData.preferences.university_ranking_preference || '-'}</p>
                       </div>
                     ) : <p className="text-sm text-muted-foreground">No preferences.</p>}

                     <h3 className="text-lg font-semibold mt-4 mb-3">Financial Planning</h3>
                     {studentProfileData.profileData?.financial ? (
                       <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border">
                           <p><span className="text-muted-foreground mr-1">Budget Range:</span> ${studentProfileData.profileData.financial.budget_range?.replace('_', ' - $') || '-'}</p>
                           <p><span className="text-muted-foreground mr-1">Funding Sources:</span> <span className="capitalize">{(studentProfileData.profileData.financial.funding_source || []).join(', ')?.replace(/_/g, ' ')}</span></p>
                           <p><span className="text-muted-foreground mr-1">Sponsor Name:</span> {studentProfileData.profileData.financial.sponsor_name || '-'}</p>
                       </div>
                     ) : <p className="text-sm text-muted-foreground">No financial data.</p>}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Experience & Skills</h3>
                    {studentProfileData.profileData?.experience ? (
                       <div className="space-y-3 text-sm bg-muted/30 p-3 rounded-lg border border-border">
                         <div className="space-y-1">
                           <p><span className="text-muted-foreground mr-1">Work Experience:</span> {studentProfileData.profileData.experience.has_work_experience ? 'Yes' : 'No'}</p>
                           <p><span className="text-muted-foreground mr-1">Total Years:</span> {studentProfileData.profileData.experience.total_experience_years || '0'}</p>
                           <p><span className="text-muted-foreground mr-1">Skills:</span> {studentProfileData.profileData.experience.skills || '-'}</p>
                           <p><span className="text-muted-foreground mr-1">Summary:</span> {studentProfileData.profileData.experience.experience_summary || '-'}</p>
                         </div>
                         <div className="space-y-1 border-t border-border pt-2">
                           <p><span className="text-muted-foreground mr-1">Projects:</span> {studentProfileData.profileData.experience.projects || '-'}</p>
                           <p><span className="text-muted-foreground mr-1">Volunteer Work:</span> {studentProfileData.profileData.experience.volunteer_work || '-'}</p>
                           <p><span className="text-muted-foreground mr-1">Extracurriculars:</span> {studentProfileData.profileData.experience.extracurricular_activities || '-'}</p>
                         </div>
                       </div>
                    ) : <p className="text-sm text-muted-foreground">No experience details.</p>}
                  </div>
                </div>

                {/* Detailed Goals & Motivations */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold mb-3">Detailed Goals & Motivations</h3>
                  {studentProfileData.profileData?.goals ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <div className="space-y-3">
                        <div><span className="font-semibold block text-primary">Motivation</span><span className="italic">{studentProfileData.profileData.goals.motivation || '-'}</span></div>
                        <div><span className="font-semibold block text-primary">Academic Goals</span>{studentProfileData.profileData.goals.academic_goals || '-'}</div>
                      </div>
                      <div className="space-y-3">
                        <div><span className="font-semibold block text-primary">Career Goals</span>{studentProfileData.profileData.goals.career_goals || '-'}</div>
                        <div><span className="font-semibold block text-primary">Post Study Plans</span><span className="capitalize">{studentProfileData.profileData.goals.post_study_plans?.replace(/_/g, ' ') || '-'}</span></div>
                        <div><span className="font-semibold block text-primary">Preferred Career Path</span><span className="capitalize">{studentProfileData.profileData.goals.preferred_career_path?.replace(/_/g, ' ') || '-'}</span></div>
                      </div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No goals detailed.</p>}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No profile data found.</p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowStudentProfileModal(false)} className="uni-btn-ghost">
              Close
            </Button>
          </div>
        </div>
      </div>
, document.body)
  );

  const NotificationModal = () => (
    showNotificationModal && createPortal(
       <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotificationModal(false)} />
        <div className="relative w-full max-w-md uni-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-secondary" />
                <h2 className="text-xl font-semibold text-foreground">Send Notification</h2>
              </div>
              <button onClick={() => setShowNotificationModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <textarea
              placeholder="Type your message..."
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full min-h-[100px] uni-input"
            />
          </div>
          <div className="p-6 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNotificationModal(false)} className="uni-btn-ghost">
              Cancel
            </Button>
            <Button onClick={() => {
              console.log("Sending notification:", notificationMessage);
              setShowNotificationModal(false);
              setNotificationMessage("");
            }} className="uni-btn-secondary">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    , document.body)
  );

  const CompletionModal = () => (
    showCompletionModal && createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCompletionModal(false)} />
        <div className="relative w-full max-w-md uni-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 text-secondary">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold text-foreground">Task Completed!</h2>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              {notificationMessage || "The task has been successfully completed."}
            </p>
          </div>
          <div className="p-6 border-t border-border flex justify-center">
            <Button onClick={() => setShowCompletionModal(false)} className="uni-btn-secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
    , document.body)
  );

  const ErrorModal = () => (
    showErrorModal && createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowErrorModal(false)} />
        <div className="relative w-full max-w-md uni-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-xl font-semibold text-foreground">Error</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-muted-foreground">
              {claimError || 'An error occurred.'}
            </p>
          </div>
          <div className="p-6 border-t border-border flex justify-center">
            <Button onClick={() => setShowErrorModal(false)} className="uni-btn-ghost">
              Close
            </Button>
          </div>
        </div>
      </div>
    , document.body)
  );

  const ConfirmCompleteModal = () => (
    showConfirmCompleteModal && createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
          setShowConfirmCompleteModal(false);
          setPendingTaskCompletion(null);
        }} />
        <div className="relative w-full max-w-md uni-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold text-foreground">Confirm Task Completion</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to complete this task? This action will move the application to the next stage.
            </p>
            {taskRequirements?.requiredFlags && taskRequirements.requiredFlags.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Completed checks:</p>
                <div className="space-y-1">
                  {taskRequirements.requiredFlags.map((flag) => (
                    <div key={flag} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="capitalize">{formatDisplayName(flag)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-border flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmCompleteModal(false);
                setPendingTaskCompletion(null);
              }}
              className="uni-btn-ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmCompleteModal(false);
                if (pendingTaskCompletion) {
                  handleCompleteTask(
                    pendingTaskCompletion.taskId,
                    pendingTaskCompletion.applicationId,
                    true // Skip confirmation on retry
                  );
                  setPendingTaskCompletion(null);
                }
              }}
              className="uni-btn-primary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, Complete Task
            </Button>
          </div>
        </div>
      </div>
    , document.body)
  );

  const ApplicationCompleteModal = () =>
    showApplicationCompleteModal && createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowApplicationCompleteModal(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md uni-card overflow-hidden"
        >
          {/* Decorative top gradient bar */}
          <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />

          <div className="p-8 text-center space-y-5">
            {/* Animated checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground">
              Application Complete! 
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              All workflow stages for this{' '}
              <span className="font-semibold text-foreground">
                {completedAppDetails?.country}
              </span>{' '}
              application have been successfully completed.
            </p>

            {completedAppDetails && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm text-left">
                {completedAppDetails.university !== 'N/A' && (
                  <p>
                    <span className="text-muted-foreground">University:</span>{' '}
                    <span className="font-medium text-foreground">
                      {completedAppDetails.university}
                    </span>
                  </p>
                )}
                {completedAppDetails.course !== 'N/A' && (
                  <p>
                    <span className="text-muted-foreground">Program:</span>{' '}
                    <span className="font-medium text-foreground">
                      {completedAppDetails.course}
                    </span>
                  </p>
                )}
                {completedAppDetails.referenceNumber && (
                  <p>
                    <span className="text-muted-foreground">Reference:</span>{' '}
                    <span className="font-medium text-foreground">
                      {completedAppDetails.referenceNumber}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-8 pb-8 flex flex-col gap-3">
            <Button
              onClick={() => {
                setShowApplicationCompleteModal(false);
                setCompletedAppDetails(null);
                navigate('/applications');
              }}
              className="w-full uni-btn-primary py-3 text-base font-semibold"
            >
              Go to Applications
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowApplicationCompleteModal(false);
                setCompletedAppDetails(null);
              }}
              className="w-full uni-btn-ghost"
            >
              Stay on Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
, document.body);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="uni-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-secondary mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Multi-Stage Workflow Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="uni-card">
          <CardHeader>
            <CardTitle className="text-foreground">Multi-Stage Workflow Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage applications through the complete workflow pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>

            {/* Country Toggle */}
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg border border-border">
                
                {countries.map((country) => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      selectedCountry === country
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-background text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    
                    {country}
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic Stage Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg border border-border">
              {(availableFilters.stages)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((stage) => (
                  <button
                    key={stage.filterId}
                    onClick={() => {
                      setSelectedActive('true');
                      setSelectedStage(stage.filterId);
                      // Switching stages always clears subtask selection (show all subtasks)
                      setSelectedTaskType(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedStage === stage.filterId && selectedActive === 'true'
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background text-foreground border border-border hover:bg-muted"
                      }`}
                  >
                    {stage.name} ({stage.count})
                  </button>
                ))}
            </div>

            {/* Dynamic Task Type Pills — click to select, click again to deselect (shows all tasks in stage) */}
            {selectedStage && selectedActive === 'true' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {availableFilters.stages
                  .find(s => s.filterId === selectedStage)
                  ?.taskTypes?.map((taskType) => (
                    <button
                      key={taskType.filterId}
                      onClick={() => {
                        // Toggle: clicking the already-selected subtask deselects it (shows all)
                        if (selectedTaskType === taskType.filterId) {
                          setSelectedTaskType(null);
                        } else {
                          setSelectedTaskType(taskType.filterId);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${selectedTaskType === taskType.filterId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-ring"
                        }`}
                    >
                      {taskType.name} ({taskType.count})
                    </button>
                  ))}
              </div>
            )}

            {/* Dynamic Filter Bar */}
            {/* Dynamic Filter Bar */}
            {selectedStage && selectedTaskType && (
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 rounded-lg border px-3 text-sm bg-white"
                >
                  <option value="all">All Statuses</option>
                  {availableFilters.taskStatuses.map(status => (
                    <option key={status.filterId} value={status.filterId}>
                      {status.name} ({status.count})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="h-9 rounded-lg border px-3 text-sm bg-white"
                >
                  <option value="all">All Priorities</option>
                  {availableFilters.priorities.map(priority => (
                    <option key={priority.filterId} value={priority.filterId}>
                      {priority.name} ({priority.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Applications List */}
            <div className="space-y-3 sm:space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {getApplicationsForCurrentView().map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 mb-2 sm:mb-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div>
                            <p className="font-semibold text-foreground text-sm sm:text-base">
                              {formatDisplayName(app.taskType)}
                            </p>
                            <p className="text-md text-muted-foreground">Ref: {app.referenceNumber}</p>
                            <p className="text-sm sm:text-sm text-muted-foreground">{app.university}</p>
                            <p className="text-sm text-muted-foreground">{app.course}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {formatDisplayName(app.taskType)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {formatDisplayName(app.status)}
                              </Badge>

                              {app.completionPercentage > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {app.completionPercentage}% Complete
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
  variant="outline"
  size="sm"
  onClick={() => {
    // Reset all task-related state before opening new task
    setTaskRequirements(null);
    setCompletionForm({});
    setCompletionFlags({});
    setCompletionErrors({});
    setHasLoadedRequirements(false);
    
    setSelectedApp(app);
    setShowDetailModal(true);
  }}
  className="uni-btn-ghost text-xs sm:text-sm"
>
                          <Eye className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                          View Detail
                        </Button>

                        {app.isClaimable && app.status !== "CLAIMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleClaimApplication(app.taskId)}
                            disabled={claimingAppId === app.taskId}
                            className="uni-btn-primary text-xs sm:text-sm"
                          >
                            {claimingAppId === app.taskId ? (
                              <>
                                <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 mr-2 animate-spin" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                                Claim
                              </>
                            )}
                          </Button>
                        )}

                        {!isTaskClaimable(app) && app.status !== "COMPLETED" && (

                          <Button
  size="sm"
  onClick={() => {
    // Reset all task-related state before opening new task
    setTaskRequirements(null);
    setCompletionForm({});
    setCompletionFlags({});
    setCompletionErrors({});
    setHasLoadedRequirements(false);
    
    setSelectedApp(app);
    setShowDetailModal(true);
  }}
  className="uni-btn-secondary text-xs sm:text-sm"
>
                            <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {getApplicationsForCurrentView().length === 0 && (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <FileText className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-base sm:text-lg font-medium">
                    No tasks in this stage
                  </p>
                  <p className="text-xs sm:text-sm">Tasks will appear here as applications are assigned for {selectedCountry}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      {renderDetailModal()}
      <StudentProfileModal />
      <NotificationModal />
      <ErrorModal />
      <ConfirmCompleteModal />
      <ApplicationCompleteModal />
    </div>
  );
};

export default Dashboard;
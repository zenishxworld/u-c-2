import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Circle,
  Loader2,
  Building2,
  MapPin,
  Mail,
  Calendar,
  FileText,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Eye,
  Edit,
  Send,
  Download,
  ChevronRight,
  Package,
  AlertTriangle,
} from "lucide-react";

import { 
  getStudentApplications, 
  getApplicationById,
  updateApplication,
  submitApplication,
  getApplicationProgress 
} from "../services/studentProfile";
import { universityAPI } from "../services/api";

type CountryTab = "DE" | "UK" | "ALL";

const normalizeApiCountry = (val?: string) => {
  const s = (val || "").toLowerCase().replace(/[\s_\-]+/g, "_");
  if (["de", "deu", "ger", "germany", "deutschland"].includes(s)) return "germany";
  if (["uk", "gb", "gbr", "united_kingdom", "unitedkingdom", "great_britain", "england", "britain"].includes(s))
    return "united_kingdom";
  if (s.includes("german") || s.includes("deutsch")) return "germany";
  if (s.includes("kingdom") || s.includes("brit") || s.includes("england")) return "united_kingdom";
  return "";
};

const toTabCountry = (apiCountry?: string): CountryTab => {
  const normalized = normalizeApiCountry(apiCountry);
  if (normalized === "germany") return "DE";
  if (normalized === "united_kingdom") return "UK";
  return "ALL";
};

const getStatusConfig = (status?: string) => {
  const normalizedStatus = (status || "draft").toLowerCase().replace(/_/g, '_');
  
  const statusMap: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Circle },
    submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: Clock },
    in_workflow: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Clock },
    submission_successful: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    under_review: { label: "Under Review", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
    offer: { label: "Offer Received", color: "bg-green-100 text-green-800", icon: CheckCircle },
    accepted: { label: "Accepted", color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
    waitlist: { label: "Waitlisted", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
    withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-800", icon: XCircle },
    claim_pending: { label: "Claim Pending", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  };

  return statusMap[normalizedStatus] || statusMap.draft;
};

const getProgress = (completionPercentage?: number) => {
  // Always use API data if available, never fallback to hard-coded values
  return completionPercentage ?? 0;
};

// Application Details Modal Component
const ApplicationDetailsModal = ({ application, isOpen, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && application) {
      loadProgress();
    }
  }, [isOpen, application]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadProgress = async () => {
  try {
    setLoading(true);
    setError("");
    const progressData = await getApplicationProgress(application.id);
    console.log('Application progress:', progressData);
    setProgress(progressData?.data || progressData);
  } catch (err) {
    console.error('Error loading progress:', err);
    
    // Check if error is about missing workflow
    const errorMessage = err?.message || '';
    if (errorMessage.includes('No workflow instance found') || errorMessage.includes('workflow')) {
      // This is expected for draft applications - show a friendly message
      setProgress(null);
      setError(''); // Don't show error for this case
      console.log('No workflow found - application may be in draft state');
    } else {
      setError('Failed to load application progress');
    }
  } finally {
    setLoading(false);
  }
};

  if (!isOpen || !application) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] sticky top-0 z-10">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{application.universityName}</h2>
                <p className="text-white text-opacity-90">{application.programName}</p>
                <p className="text-sm text-white text-opacity-80 mt-1">
                  Reference: {application.referenceNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
              <span className="ml-2 text-gray-600">Loading details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Application Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <div className="flex items-center gap-2">
                    {(() => {
  const conf = getStatusConfig(application.status);
  const IconComp = conf.icon;
  if (conf.label === "Draft") return null;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${conf.color}`}>
      <div className="inline-flex items-center gap-1">
        <IconComp className="w-4 h-4" />
        {conf.label}
      </div>
    </span>
  );
})()}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Intake</label>
                  <p className="text-gray-900">{application.intakeTerm || ''}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Submitted Date</label>
                  <p className="text-gray-900">
                    {application.submittedAt 
                      ? new Date(application.submittedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Not submitted yet'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Deadline</label>
                  <p className="text-gray-900">{application.deadline || ''}</p>
                </div>
              </div>

              {/* Progress Section */}
              {/* Progress Section */}
{loading ? (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-[#E08D3C]" />
  </div>
) : progress && progress.completionPercentage !== undefined ? (
  <div className="space-y-4">
    <h3 className="text-lg font-bold text-[#2C3539] flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-[#E08D3C]" />
      Application Progress
    </h3>
    
    {/* Progress Bar */}
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 font-medium">Overall Completion</span>
        <span className="text-[#E08D3C] font-bold">
          {progress.completionPercentage || 0}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-[#E08D3C] to-[#C4DFF0] h-3 rounded-full transition-all duration-500" 
          style={{ width: `${progress.completionPercentage || 0}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">
        {progress.stepsCompleted || 0} of {progress.totalSteps || 0} steps completed
      </p>
    </div>

    {/* Document Progress */}
    {progress.documentProgress && (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Document Status
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-700">Academic Documents:</span>
            <p className="font-medium text-blue-900">
              {progress.documentProgress.academicDocuments || 'Not Submitted'}
            </p>
          </div>
          <div>
            <span className="text-blue-700">English Proficiency:</span>
            <p className="font-medium text-blue-900">
              {progress.documentProgress.englishProficiency || 'Not Submitted'}
            </p>
          </div>
          <div>
            <span className="text-blue-700">Financial Documents:</span>
            <p className="font-medium text-blue-900">
              {progress.documentProgress.financialDocuments || 'Not Submitted'}
            </p>
          </div>
          <div>
            <span className="text-blue-700">Personal Documents:</span>
            <p className="font-medium text-blue-900">
              {progress.documentProgress.personalDocuments || 'Not Submitted'}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Stage Progress */}
    {progress.stageProgress && progress.stageProgress.length > 0 && (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Workflow Stages</h4>
        {progress.stageProgress.map((stage, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  stage.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  stage.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <h5 className="font-semibold text-gray-900">{stage.stageName}</h5>
                  <p className="text-xs text-gray-600">{stage.stageInstructions}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                stage.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                stage.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {stage.status?.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Tasks: {stage.completedTasks || 0} / {stage.totalTasks || 0} completed
            </div>
            {stage.startedAt && (
              <div className="text-xs text-gray-500 mt-1">
                Started: {new Date(stage.startedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Action Required Alert */}
    {progress.requiresStudentAction && (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Action Required</h4>
            <p className="text-sm text-yellow-700">
              Your attention is needed to proceed with this application.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
) : (application.status?.toUpperCase() === 'DRAFT' || 
     application.status?.toLowerCase() === 'draft' ||
     application.completion_percentage === 0) ? (
  // Show friendly message for draft applications without workflow
  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
    <Package className="w-12 h-12 text-blue-400 mx-auto mb-3" />
    <h4 className="font-semibold text-blue-900 mb-2">Application in Draft</h4>
    <p className="text-sm text-blue-700">
      Complete and submit your application to start the workflow process. 
      Progress tracking will be available after submission.
    </p>
  </div>
) : (
  // Show generic message for other cases
  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
    <h4 className="font-semibold text-gray-700 mb-2">Workflow Starting</h4>
    <p className="text-sm text-gray-600">
      The workflow process is being initialized for this application. 
      Progress details will be available shortly.
    </p>
  </div>
)}

              {/* University Contact Info */}
              {application.adminEmail && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${application.adminEmail}`} className="text-[#E08D3C] hover:underline">
                      {application.adminEmail}
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            Close
          </button>
          
        </div>
      </div>
    </div>
   , document.body);
};

export default function Applications() {
  const navigate = useNavigate();
  const { selectedCountry: navbarCountry } = useOutletContext<{ selectedCountry: "DE" | "UK" }>();

  const [selectedCountry, setSelectedCountry] = useState<CountryTab>("ALL");
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
const [submittingAppId, setSubmittingAppId] = useState(null);
const [submitSuccessModal, setSubmitSuccessModal] = useState({ isOpen: false, data: null });
const [allCountriesCount, setAllCountriesCount] = useState(0);
const [germanyCount, setGermanyCount] = useState(0);
const [ukCount, setUkCount] = useState(0);
const [submitFormData, setSubmitFormData] = useState({
  confirmationStatement: "",
  agreeToTerms: false,
  additionalNotes: ""
});

  useEffect(() => {
    loadApplications();
  }, []);

  // Auto-refresh every 30 seconds to catch new applications
  useEffect(() => {
    const interval = setInterval(() => {
      loadApplications(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

useEffect(() => {
  loadApplications();
}, [selectedCountry]);

useEffect(() => {
  if (isSubmitModalOpen || submitSuccessModal.isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [isSubmitModalOpen, submitSuccessModal.isOpen]);

// Sync with navbar country toggle
useEffect(() => {
  if (navbarCountry) {
    setSelectedCountry(navbarCountry);
  }
}, [navbarCountry]);

  const loadApplications = async (silent = false) => {
  if (!silent) {
    setLoading(true);
  } else {
    setRefreshing(true);
  }
  setError("");

  try {
    // Build country code parameter based on selected tab
    // Always fetch ALL — filter client-side so counts stay correct
    const countryCode = undefined;

    console.log('=== FETCHING APPLICATIONS FROM API ===');
    console.log('Fetching all, filtering client-side for:', selectedCountry);

    const response = await getStudentApplications(undefined);
    console.log('Raw applications response:', response);
    
    let apps = [];
    
    // Handle different response structures
    if (response?.data?.applications) {
      apps = response.data.applications;
    } else if (Array.isArray(response?.data)) {
      apps = response.data;
    } else if (Array.isArray(response)) {
      apps = response;
    } else if (response?.applications) {
      apps = response.applications;
    }

    console.log('Parsed applications:', apps);
    console.log('Total applications found:', apps.length);

    // Enrich applications with university data
    const enriched = await Promise.all(
      apps.map(async (app: any) => {
        const universityId = app.targetUniversityId || app.target_university_id || app.university;
        
        console.log(`Enriching application ${app.id}:`, { universityId });
        
        try {
          const universityData = universityId 
            ? await universityAPI.getUniversityById(universityId).catch(err => {
                console.warn('Failed to fetch university:', err);
                return null;
              }) 
            : null;

// Debug logging
console.log('Application data from API:', {
  id: app.id,
  country_code: app.country_code,
  countryCode: app.countryCode,
  program_level: app.program_level,
  programLevel: app.programLevel,
  application_type: app.application_type,
  applicationType: app.applicationType
});

// Extract country_code from API response
const country_code = app.country_code || app.countryCode || "";

// Get program_level from the target course since API doesn't return it
let program_level = app.program_level || app.programLevel || "";

// If not in app, try to get from course via API
if (!program_level && (app.targetCourseId || app.target_course_id)) {
  try {
    const courseId = app.targetCourseId || app.target_course_id;
    console.log(`Fetching course data for: ${courseId}`);
    
    // Fetch all courses to find the one for this application
    const { getAllCourses } = await import('../services/studentProfile');
    const courses = await getAllCourses();
    const targetCourse = courses.find(c => c.id === courseId);
    
    if (targetCourse && targetCourse.degreeLevel) {
      program_level = targetCourse.degreeLevel;
      console.log(`✅ Found program_level from course: ${program_level}`);
    }
  } catch (err) {
    console.warn('Could not fetch course data:', err);
  }
}

// Final fallback: derive from program name
if (!program_level) {
  const programName = (app.programName || app.program_name || '').toLowerCase();
  if (programName.includes('master')) {
    program_level = 'MASTERS';
  } else if (programName.includes('bachelor')) {
    program_level = 'BACHELORS';
  } else if (programName.includes('phd') || programName.includes('doctorate')) {
    program_level = 'DOCTORATE';
  }
  console.log(`Derived program_level from program name: ${program_level}`);
}

          // Format intake term
          let formattedIntake = app.intakeTerm || app.intake_term || '';
          if (formattedIntake) {
            // Handle SUMMER_2026, summer_2026, Summer 2026, etc.
            formattedIntake = formattedIntake
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }

          // Format deadline
          let formattedDeadline = null;
          if (app.workflowProgress?.estimatedCompletion) {
            try {
              const date = new Date(app.workflowProgress.estimatedCompletion);
              formattedDeadline = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            } catch (e) {
              console.warn('Error parsing deadline:', e);
            }
          } else if (app.deadline) {
            try {
              const date = new Date(app.deadline);
              formattedDeadline = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            } catch (e) {
              console.warn('Error parsing deadline:', e);
            }
          }

          // Fetch dynamic progress
          let dynamicCompletionPercentage = app.completionPercentage || app.completion_percentage || 0;
          try {
            const { getApplicationProgress } = await import('../services/studentProfile');
            const progRes = await getApplicationProgress(app.id);
            const progressData = progRes?.data || progRes;
            if (progressData && progressData.completionPercentage !== undefined) {
              dynamicCompletionPercentage = progressData.completionPercentage;
            }
          } catch (err) {
            console.warn(`Could not fetch dynamic progress for app ${app.id}:`, err);
          }

          return {
            ...app,
            id: app.id,
            country_code: country_code,
            program_level: program_level,
            universityName: app.universityName || app.university_name || universityData?.name || "University",
            programName: app.programName || app.program_name || app.targetCourseName || app.target_course_name || "Program",
            intakeTerm: formattedIntake,
            status: app.status || 'DRAFT',
            completionPercentage: dynamicCompletionPercentage,
            referenceNumber: app.referenceNumber || app.reference_number || app.refNumber || null,
            universityData,
            adminName: universityData?.admin_name || null,
            adminEmail: universityData?.contact_email || null,
            deadline: formattedDeadline === "TBA" ? null : formattedDeadline,
            submittedAt: app.submittedAt || app.submitted_at,
            city: universityData?.city || "",
            country: universityData?.country || "",
            workflowProgress: app.workflowProgress || app.workflow_progress || {
              estimatedCompletion: app.deadline || app.estimated_completion,
              pendingTasks: app.pending_tasks || 0,
              requiresStudentAction: app.requires_student_action || false,
            },
          };
        } catch (enrichErr) {
          console.warn('Error enriching application:', enrichErr);
          return {
            ...app,
            id: app.id,
            universityName: app.universityName || "University",
            programName: app.programName || "Program",
            status: app.status || 'DRAFT',
            completionPercentage: app.completionPercentage || 0,
            universityData: null,
            adminName: "Admissions Office",
            adminEmail: "admissions@university.edu",
            deadline: "TBA",
            city: "",
            country: "",
          };
        }
      })
    );

    console.log('âœ… Enriched applications:', enriched);
    setApplications(enriched);
    
    // Update the count for whichever tab is currently selected
// Compute all counts at once from full data
    setAllCountriesCount(enriched.length);
    setGermanyCount(enriched.filter(app =>
      toTabCountry(app.countryCode || app.country_code || app.country || "") === "DE"
    ).length);
    setUkCount(enriched.filter(app =>
      toTabCountry(app.countryCode || app.country_code || app.country || "") === "UK"
    ).length);
    
  } catch (err) {
    console.error("âŒ Error loading applications:", err);
    setError("Failed to load applications. Please check your connection.");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleNewApplication = () => {
    navigate("/universities");
  };

  const handleViewDetails = async (applicationId: string) => {
    try {
      console.log("Loading details for application:", applicationId);
      
      // Find application in current state first
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        setSelectedApplication(app);
        setIsDetailsModalOpen(true);
      } else {
        // Fetch fresh data if not found
        const appData = await getApplicationById(applicationId);
        setSelectedApplication(appData?.data || appData);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading application details:', error);
      alert('Failed to load application details');
    }
  };

  const handleRefresh = () => {
  loadApplications(false);
};

const handleSubmitApplication = async () => {
  try {
    setLoading(true);
    
    // Get the selected application
    const app = applications.find(a => a.id === submittingAppId);
    
    // Prepare the EXACT same payload as Postman
    const payload = {
      confirmationStatement: submitFormData.confirmationStatement || "TESTING confiramtion.",
      agreeToTerms: submitFormData.agreeToTerms,
      additionalNotes: submitFormData.additionalNotes || "TESTING."
      // ❌ REMOVE territory and degreeLevel - Postman doesn't send these!
    };

    console.log('=== SUBMITTING APPLICATION ===');
    console.log('Application ID:', submittingAppId);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await submitApplication(submittingAppId, payload);

    // Success handling
    setSubmitSuccessModal({
      isOpen: true,
      data: {
        universityName: app?.universityName,
        referenceNumber: response.data?.referenceNumber || response?.referenceNumber || app?.referenceNumber,
        status: response.data?.status || 'Submitted',
        submittedAt: response.data?.submittedAt
      }
    });

    setIsSubmitModalOpen(false);
    setSubmittingAppId(null);
    await loadApplications(); // Refresh the list

  } catch (error) {
    console.error('Error submitting application:', error);
    
    const errorMessage = error?.message || '';
    
    // Show error modal
    setSubmitSuccessModal({
      isOpen: true,
      data: {
        error: errorMessage || 'Failed to submit application. Please try again.',
        referenceNumber: applications.find(a => a.id === submittingAppId)?.referenceNumber
      }
    });
    
    setIsSubmitModalOpen(false);
    setSubmittingAppId(null);
  } finally {
    setLoading(false);
  }
};

const openSubmitModal = (appId: string) => {
  setSubmittingAppId(appId);
  setIsSubmitModalOpen(true);
  setSubmitFormData({
    confirmationStatement: "",
    agreeToTerms: false,
    additionalNotes: "",
    territory: "",
    degreeLevel: ""
  });
};

  // Filter applications by selected country using countryCode from API
  const filteredApplications = selectedCountry === "ALL"
    ? applications
    : applications.filter(app =>
        toTabCountry(app.countryCode || app.country_code || app.country || "") === selectedCountry
      );

  if (loading && !refreshing) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
          <span className="ml-2 text-gray-600">Loading your applications...</span>
        </div>
      </motion.div>
    );
  }

  if (error && applications.length === 0) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">âš ï¸</div>
          <h3 className="font-bold text-xl text-[#2C3539] mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-[#E08D3C] hover:bg-[#c77a32] text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  const container = { 
    hidden: { opacity: 0 }, 
    show: { opacity: 1, transition: { staggerChildren: 0.1 } } 
  };
  
  const item = { 
    hidden: { y: 20, opacity: 0 }, 
    show: { y: 0, opacity: 1 } 
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">My Applications</h1>
            {applications.length > 0 && (
              <span className="bg-[#E08D3C] text-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                {applications.length}
              </span>
            )}
            {refreshing && (
              <Loader2 className="w-5 h-5 animate-spin text-[#E08D3C]" />
            )}
          </div>
          <p className="text-muted-foreground">
            Track and manage your university applications
          </p>
        </div>

        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              className="bg-[#E08D3C] hover:bg-[#c77a32] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              onClick={handleNewApplication}>
              <Plus className="w-4 h-4" />
              New Application
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {applications.length > 0 && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}>
          <div className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-orange-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(249,115,22,0.2)] hover:border-orange-400/50 transition-all duration-500 rounded-xl" style={{ background: "linear-gradient(160deg, #fff7ed 0%, #ffffff 60%, #ffedd5 100%)" }}>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {applications.filter(a => {
                const status = (a.status || '').toUpperCase();
                return ['DRAFT', 'SUBMITTED', 'IN_WORKFLOW', 'CLAIM_PENDING', 'SUBMISSION_SUCCESSFUL'].includes(status);
              }).length}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">In Progress</div>
          </div>
          
          <div className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-green-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.2)] hover:border-green-400/50 transition-all duration-500 rounded-xl" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #dcfce7 100%)" }}>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {applications.filter(a => {
                const status = (a.status || '').toUpperCase();
                return ['OFFER', 'ACCEPTED'].includes(status);
              }).length}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Offers</div>
          </div>
          
          <div className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-red-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(239,68,68,0.2)] hover:border-red-400/50 transition-all duration-500 rounded-xl" style={{ background: "linear-gradient(160deg, #fef2f2 0%, #ffffff 60%, #fee2e2 100%)" }}>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {applications.filter(a => a.workflowProgress?.requiresStudentAction).length}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Need Action</div>
          </div>
          
          <div className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-blue-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.2)] hover:border-blue-400/50 transition-all duration-500 rounded-xl" style={{ background: "linear-gradient(160deg, #eff6ff 0%, #ffffff 60%, #dbeafe 100%)" }}>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {applications.length}
            </div>
            <div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Total</div>
          </div>
        </motion.div>
      )}
      

      {/* Country Tabs */}
      <div className="flex gap-2 sm:border-b border-gray-200 overflow-x-auto pb-1 hide-scrollbar">
        <button
  onClick={() => setSelectedCountry("ALL")}
  className={`px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
    selectedCountry === "ALL"
      ? "border-b-2 border-[#E08D3C] text-[#E08D3C]"
      : "text-gray-600 hover:text-[#E08D3C]"
  }`}>
  All Countries
  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-foreground">
    {allCountriesCount}
  </span>
</button>
<button
  onClick={() => setSelectedCountry("DE")}
  className={`px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
    selectedCountry === "DE"
      ? "border-b-2 border-[#E08D3C] text-[#E08D3C]"
      : "text-gray-600 hover:text-[#E08D3C]"
  }`}>
  Germany
  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-foreground">
    {germanyCount}
  </span>
</button>
<button
  onClick={() => setSelectedCountry("UK")}
  className={`px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
    selectedCountry === "UK"
      ? "border-b-2 border-[#E08D3C] text-[#E08D3C]"
      : "text-gray-600 hover:text-[#E08D3C]"
  }`}>
  <span className="hidden sm:inline">United Kingdom</span>
  <span className="sm:hidden">UK</span>
  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full text-foreground">
    {ukCount}
  </span>
</button>
        
      </div>

      {/* Applications List */}
      <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
        {filteredApplications.length > 0 ? (
  filteredApplications.map((application) => {
    const conf = getStatusConfig(application.status);
const IconComp = conf.icon;
    const progress = getProgress(application.completionPercentage);

            return (
              <motion.div key={application.id} variants={item} whileHover={{ y: -2, scale: 1.01 }}>
                <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500 border-2 border-gray-200/80">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* University Info */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl flex-shrink-0">
                        {application.universityData?.image_url ? (
                          <img 
                            src={application.universityData.image_url} 
                            alt={application.universityName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg sm:text-xl mb-0.5 sm:mb-1 text-[#2C3539] break-words line-clamp-2">
                              {application.universityName}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-700 font-medium mb-1 sm:mb-2 line-clamp-2">
                              {application.programName}
                            </p>
                          </div>
                          {conf.label !== "Draft" && (
                            <span className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap self-start sm:self-auto ${conf.color}`}>
                              <div className="inline-flex items-center gap-1">
                                <IconComp className="w-3 h-3" />
                                {conf.label}
                              </div>
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#E08D3C]" />
                            <span>{application.city || ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#E08D3C]" />
                            <span>Intake: {application.intakeTerm || ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#E08D3C]" />
                            <span>Deadline: {application.deadline || ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#E08D3C]" />
                            <span>Ref: {application.referenceNumber || ""}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">
                              Application Progress
                            </span>
                            <span className="text-[#E08D3C] font-bold">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-[#E08D3C] to-[#C4DFF0] h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Draft</span>
                            <span>In Review</span>
                            <span>Decision</span>
                          </div>
                        </div>

                        {/* Workflow Info */}
                        {application.workflowProgress && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-start gap-2">
                              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div className="flex-1 text-xs">
                                <p className="text-blue-900 font-medium mb-1">Workflow Status</p>
                                <div className="space-y-1 text-blue-700">
                                  {application.workflowProgress.requiresStudentAction && (
                                    <p className="font-medium">âš ï¸ Action required from your side</p>
                                  )}
                                  <p>
                                    Pending tasks: {application.workflowProgress.pendingTasks || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-40">
                      <button
              onClick={() => handleViewDetails(application.id)}
              className="px-4 py-2 bg-white border-2 border-[#2C3539] text-[#2C3539] rounded-lg hover:bg-[#2C3539] hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-all">
              <Eye className="w-4 h-4" />
              View Details
            </button>
                      


                      {application.workflowProgress?.requiresStudentAction && (
                        <button
                          className="px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-200 text-sm font-medium flex items-center justify-center gap-2 transition-all">
                          <AlertCircle className="w-4 h-4" />
                          Action Needed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="border-2 border-dashed border-gray-200/80 bg-white/40 backdrop-blur-sm rounded-xl p-12 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              {selectedCountry === "ALL" 
                ? "No applications yet" 
                : `No applications for ${selectedCountry === "DE" ? "Germany" : "United Kingdom"}`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {selectedCountry === "ALL"
                ? "Start your journey by browsing universities and programs that match your profile."
                : `Browse universities in ${selectedCountry === "DE" ? "Germany" : "United Kingdom"} to start applying.`}
            </p>
            <button
              onClick={handleNewApplication}
              className="px-6 py-3 bg-[#E08D3C] text-white rounded-lg hover:bg-[#c77a32] font-medium inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Browse Universities
            </button>
          </div>
        )}
      </motion.div>

      

      {/* Application Details Modal */}
      {/* Application Details Modal */}
<ApplicationDetailsModal
  application={selectedApplication}
  isOpen={isDetailsModalOpen}
  onClose={() => {
    setIsDetailsModalOpen(false);
    setSelectedApplication(null);
  }}
  onRefresh={handleRefresh}
/>

{/* Submit Application Modal */}
{isSubmitModalOpen && createPortal(
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
    <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C]">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Submit Application</h2>
              <p className="text-white text-opacity-90">Review and confirm your submission</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSubmitModalOpen(false);
              setSubmittingAppId(null);
            }}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Important Notice */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Important Notice</h4>
              <p className="text-sm text-yellow-700">
                Once submitted, your application will be sent to the university for review. 
                Please ensure all information is accurate and complete before proceeding.
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Statement */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Confirmation Statement <span className="text-red-500">*</span>
          </label>
          <textarea
            value={submitFormData.confirmationStatement}
            onChange={(e) => setSubmitFormData({ ...submitFormData, confirmationStatement: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E08D3C] focus:border-transparent"
            rows={3}
            placeholder="Enter your confirmation statement..."
          />
          <p className="text-xs text-gray-500">
            Please confirm that all information provided is accurate
          </p>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Additional Notes (Optional)
          </label>
          <textarea
            value={submitFormData.additionalNotes}
            onChange={(e) => setSubmitFormData({ ...submitFormData, additionalNotes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E08D3C] focus:border-transparent"
            rows={3}
            placeholder="Any additional information you'd like to include..."
          />
        </div>

        {/* Terms Agreement */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={submitFormData.agreeToTerms}
              onChange={(e) => setSubmitFormData({ ...submitFormData, agreeToTerms: e.target.checked })}
              className="mt-1 w-5 h-5 text-[#E08D3C] border-gray-300 rounded focus:ring-[#E08D3C]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                I agree to the terms and conditions <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                By checking this box, you confirm that all information provided is accurate and you 
                agree to the university's application terms and conditions.
              </p>
            </div>
          </label>
        </div>

        {/* What Happens Next */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            What Happens Next?
          </h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Document verification will begin</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>You will receive email notifications for any updates</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Processing typically takes 72 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Keep your reference number safe for tracking</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
        <button
          onClick={() => {
            setIsSubmitModalOpen(false);
            setSubmittingAppId(null);
          }}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Cancel
        </button>
        <button
          onClick={handleSubmitApplication}
          disabled={loading || !submitFormData.agreeToTerms || !submitFormData.confirmationStatement}
          className="px-6 py-2 bg-[#E08D3C] text-white rounded-lg hover:bg-[#c77a32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  </div>
, document.body)}


{/* Success/Error Modal */}
{submitSuccessModal.isOpen && createPortal(
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
      {/* Content */}
      <div className="p-8 text-center space-y-6">
        {submitSuccessModal.data?.error ? (
          <>
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Submission Failed</h2>
            <p className="text-gray-600">{submitSuccessModal.data.error}</p>
            <p className="text-sm text-gray-500">Please refresh the page and try again.</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Application Submitted Successfully!</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">University:</span>
                <span className="font-semibold text-gray-900">{submitSuccessModal.data?.universityName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reference Number:</span>
                <span className="font-mono font-bold text-[#E08D3C]">{submitSuccessModal.data?.referenceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">{submitSuccessModal.data?.status}</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 text-left">
                Please keep your reference number safe for tracking
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 pb-8">
        <button
          onClick={() => setSubmitSuccessModal({ isOpen: false, data: null })}
          className="w-full px-6 py-3 bg-[#E08D3C] text-white rounded-xl hover:bg-[#c77a32] transition-colors font-semibold shadow-lg">
          Close
        </button>
      </div>
    </div>
  </div>
, document.body)}
    </motion.div>
  );
}
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle, Calendar, Eye, Info, X, File, Loader2, AlertCircle, FolderUp, Download } from "lucide-react";
import { makeAuthenticatedRequest } from "@/services/tokenService";
import { downloadDocumentById } from "@/services/document";
import { Trash2, ExternalLink, Clock, XCircle } from "lucide-react";
import { getStudentProfile } from "@/services/studentProfile";


type Country = "DE" | "UK";

interface ContextType {
  selectedCountry: Country;
}

interface Document {
  id: string;
  field: string;
  label: string;
  required: boolean;
  priority: "high" | "medium" | "low";
  description: string;
  status: "pending" | "uploaded" | "rejected";
  uploadDate?: string;
  fileName?: string;
  rejectionReason?: string;
  uploadedId?: string;
  acceptedFormats?: string[];
  maxFileSize?: string;
  daysUntilDeadline?: number;
  submissionDeadline?: string;
  // New fields from API
  workflowId?: string;
  fileSize?: number;
  verificationStatus?: string;
  reviewStatus?: string;
  statusDisplay?: string;
  reviewedAt?: string;
  viewUrlAvailable?: boolean;
  canDelete?: boolean;
}

interface OverviewSummary {
  total_required: number;
  uploaded_count: number;
  verified_count: number;
  pending_review_count: number;
  rejected_count: number;
  overall_status: string;
  total_pending?: number;
  total_uploaded?: number;
}

/* helpers */

const getPriorityColor = (priority: Document["priority"]) => {
  switch (priority) {
    case "high": return "border-red-200 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(239,68,68,0.3)] hover:border-red-400";
    case "medium": return "border-yellow-200 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(234,179,8,0.3)] hover:border-yellow-400";
    default: return "border-green-200 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.3)] hover:border-green-400";
  }
};

const getStatusColor = (status: Document["status"]) => {
  switch (status) {
    case "uploaded": return "bg-green-100 text-green-800";
    case "pending": return "bg-orange-100 text-orange-800";
    case "rejected": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const validateFileType = (file: File) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  return allowedTypes.includes(file.type);
};

const validateFileSize = (file: File, maxSizeMB: number = 10) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

const normalizeApiCountry = (val?: string) => {
  const s = (val || "").toLowerCase().replace(/\s+/g, "_");
  if (["de", "ger", "germany"].includes(s)) return "germany";
  if (["uk", "gb", "united_kingdom", "unitedkingdom", "great_britain"].includes(s))
    return "united_kingdom";
  if (s.includes("german")) return "germany";
  if (s.includes("kingdom") || s.includes("brit")) return "united_kingdom";
  return "";
};

/* card */

const DocumentCard = ({
  document,
  onFileSelect,
  onUploadOne,
  onView,
  onDownload,
  onRemoveFile,
  onDelete,
  selectedFile,
  uploadError,
  uploading,
  s3Health,
}: {
  document: Document;
  onFileSelect: (doc: Document, file: File) => void;
  onUploadOne: (doc: Document) => void;
  onView: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onRemoveFile: (docId: string) => void;
  onDelete: (doc: Document) => void;
  selectedFile?: File;
  uploadError?: string;
  uploading?: boolean;
  s3Health?: boolean | null;
}) => {
  const isUploaded = document.status === "uploaded";
  const isRejected = document.status === "rejected";
  const isPending = document.status === "pending";
  const canUpload = (isPending || isRejected) && !!selectedFile;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(document, file);
  };

  return (
    <div className="opacity-0 translate-y-5 animate-fadeInUp">
      <Card className={cn("border-l-4 bg-white/70 backdrop-blur-sm transition-all duration-500", getPriorityColor(document.priority))}>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <h3 className="font-semibold text-base sm:text-lg">{document.label}</h3>
                <Badge className={cn("rounded-full text-[10px] sm:text-xs", getStatusColor(document.status))}>{document.status}</Badge>
                

              </div>
              <p className="text-muted-foreground mb-2 text-sm">{document.description}</p>
              
              {/* APS Certificate Special Info */}
              {document.field === 'APS_CERTIFICATE' && isPending && (
                <div className="mb-3 p-2.5 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-start gap-2.5 max-w-xl">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    <strong>Note:</strong> Applying for the APS Certificate requires a fee of <strong>₹18,000</strong> plus applicable shipping charges. Please ensure this is prepared before applying. For further details contact our team from WhatsApp chat. 
                  </p>
                </div>
              )}

              {document.submissionDeadline && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2 bg-gray-100 dark:bg-gray-800 w-fit px-2 py-1 rounded-md">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {new Date(document.submissionDeadline).toLocaleDateString()} ({document.daysUntilDeadline} days left)
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-col sm:flex-row mt-2 sm:mt-0">
  

              {(isPending || isRejected) && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer">
                    <Button size="sm" className={cn("rounded-full", isRejected ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")} asChild>
                      <span><Upload className="w-4 h-4 mr-2" />Choose file</span>
                    </Button>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                  </label>

                  <Button size="sm" variant="outline" disabled={!canUpload || uploading} onClick={() => onUploadOne(document)} className="rounded-full" title={s3Health === false ? "Storage service unavailable" : ""}>
                    {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>) : (<><Upload className="w-4 h-4 mr-2" />Upload</>)}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {uploadError && <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded">{uploadError}</div>}

          {selectedFile && (
            <div className="mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2 min-w-0">
                  <File className="w-4 h-4 text-blue-600 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-blue-800 truncate">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <Button size="sm" variant="outline" className="text-destructive hover:bg-red-50 flex-shrink-0 h-8 sm:h-9" onClick={() => onRemoveFile(document.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {isUploaded && document.fileName && (
  <div className="mt-4 p-2 sm:p-3 bg-green-50 rounded-lg">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 sm:mt-0 flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-medium text-green-800 truncate">{document.fileName}</span>
          {document.uploadDate && <span className="text-[10px] sm:text-xs text-green-600 mt-0.5 sm:mt-0 whitespace-nowrap">Uploaded on {document.uploadDate}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {document.statusDisplay && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] sm:text-xs px-2.5 py-0.5 border font-medium tracking-wide shadow-sm flex items-center gap-1",
              document.statusDisplay.toLowerCase().includes('verified') 
                ? "bg-emerald-500 text-white border-transparent hover:bg-emerald-600" 
                : document.statusDisplay.toLowerCase().includes('review') 
                  ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/90"
                  : document.statusDisplay.toLowerCase().includes('reject')
                    ? "bg-red-500 text-white border-transparent hover:bg-red-600"
                    : "bg-white text-gray-700 border-gray-200"
            )}
          >
            {document.statusDisplay.toLowerCase().includes('verified') && <CheckCircle className="w-3 h-3" />}
            {document.statusDisplay.toLowerCase().includes('review') && <Clock className="w-3 h-3" />}
            {document.statusDisplay.toLowerCase().includes('reject') && <XCircle className="w-3 h-3" />}
            {document.statusDisplay.replace(/✅|✓|✔️|⏳|❌|✖️/g, '').trim()}
          </Badge>
        )}
        {/* ✓ ADD THIS VIEW BUTTON */}
        {document.uploadedId && document.viewUrlAvailable !== false && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onView(document)}
              className="rounded-full text-blue-600 hover:bg-blue-50 text-xs sm:text-sm h-7 sm:h-9"
              title="View document"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDownload(document)}
              className="rounded-full text-green-600 hover:bg-green-50 text-xs sm:text-sm h-7 sm:h-9"
              title="Download document"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>
    </div>
    {document.fileSize && document.fileSize > 0 && (
      <div className="text-xs text-green-600 mt-1">
        Size: {formatFileSize(document.fileSize)}
      </div>
    )}
  </div>
)}

          {document.status === "rejected" && document.rejectionReason && (
            <div className="mt-4 bg-white rounded-lg p-3 border border-red-200">
              <p className="text-sm text-red-700 font-medium">Reason for rejection:</p>
              <p className="text-sm text-red-600">{document.rejectionReason}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            {document.acceptedFormats?.join(", ") || "PDF, JPG, PNG, DOC, DOCX"} (max {document.maxFileSize || "10MB"})
          </p>
        </div>
      </Card>
    </div>
  );
};

/* page */

export default function Documents() {
  const { selectedCountry } = useOutletContext<ContextType>();
  const [requirementsModal, setRequirementsModal] = useState(false);
  const [viewerModal, setViewerModal] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string>("");
  const [viewerLoading, setViewerLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadingOne, setUploadingOne] = useState<Record<string, boolean>>({});
  const [overviewSummary, setOverviewSummary] = useState<OverviewSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [s3Health, setS3Health] = useState<boolean | null>(null);
const [s3HealthChecked, setS3HealthChecked] = useState(false);

const [activeTab, setActiveTab] = useState<string>("pending");

// Bulk upload state
const [bulkUploadModal, setBulkUploadModal] = useState(false);
const [bulkFiles, setBulkFiles] = useState<Record<string, File>>({});
const [bulkUploading, setBulkUploading] = useState(false);
const [bulkUploadError, setBulkUploadError] = useState("");
const [bulkUploadSuccess, setBulkUploadSuccess] = useState("");
const [totalPendingCount, setTotalPendingCount] = useState<number>(0);

// Custom document state
const [customDocName, setCustomDocName] = useState("");
const [customDocFile, setCustomDocFile] = useState<File | null>(null);
const [customUploading, setCustomUploading] = useState(false);
const [customUploadError, setCustomUploadError] = useState("");


const BULK_DOCUMENT_TYPES = [
  { key: 'PASSPORT', label: 'Passport' },
  { key: 'TRANSCRIPT', label: 'Academic Transcript' },
  { key: 'DIPLOMA', label: 'Diploma' },
  { key: 'ENGLISH_TEST', label: 'English Test (IELTS/TOEFL/PTE)' },
  { key: 'SOP', label: 'Statement of Purpose' },
  { key: 'LOR', label: 'Letter of Recommendation' },
  { key: 'CV', label: 'CV / Resume' },
  { key: 'LEAVING_CERTIFICATE', label: 'School Leaving Certificate' },
  { key: 'TWELFTH_MARKSHEET', label: '12th Standard Marksheet' },
  { key: 'TENTH_MARKSHEET', label: '10th Standard Marksheet' },
];
  
  // NEW: Application selection state
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const countryName = selectedCountry === "DE" ? "Germany" : "UK";

  // NEW: Fetch applications on component mount and country change
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoadingApplications(true);
        console.log('[Documents] Fetching applications...');
        
        const response = await makeAuthenticatedRequest('/api/v1/students/applications', {
          method: 'GET',
        });
        
        console.log('[Documents] Applications response:', response);
        
        let apps = [];
        if (response?.data?.applications) {
          apps = response.data.applications;
        } else if (Array.isArray(response?.data)) {
          apps = response.data;
        } else if (Array.isArray(response)) {
          apps = response;
        } else if (response?.applications) {
          apps = response.applications;
        }
        
        console.log('[Documents] Parsed applications:', apps);
        setApplications(apps);
        
        // Auto-select latest application based on selected country
        if (apps.length > 0) {
          const targetCountry = selectedCountry === 'DE' ? 'germany' : 'united_kingdom';
          
          // Sort applications by creation date descending to get the latest
          const sortedApps = [...apps].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime();
            return dateB - dateA;
          });

          const matchingApp = sortedApps.find(app => {
            const appCountry = normalizeApiCountry(app.country || app.universityData?.country);
            return appCountry === targetCountry;
          });
          
          // Use matching app or fallback to first app (which is now the latest)
          const appToSelect = matchingApp || sortedApps[0];
          console.log('[Documents] Auto-selecting latest application:', appToSelect);
          setSelectedApplication(appToSelect.id);
        }
      } catch (error) {
        console.error('[Documents] Error fetching applications:', error);
        setApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [selectedCountry]);

  // Check S3 health on mount
useEffect(() => {
  const checkS3Health = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/v1/documents/s3-health', {
        method: 'GET',
      });
      
      console.log('[Documents] S3 Health response:', response);
      
      if (response.success) {
        setS3Health(response.s3_health);
      } else {
        setS3Health(false);
      }
    } catch (error) {
      console.error('[Documents] S3 health check failed:', error);
      setS3Health(false);
    } finally {
      setS3HealthChecked(true);
    }
  };

  checkS3Health();
}, []);

 // ✅ Enhanced logging in the useEffect that fetches documents
useEffect(() => {
  const fetchData = async () => {
    if (!selectedApplication) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch sequentially to avoid overwhelming the backend R2DBC connection pool
      const pendingResponse = await makeAuthenticatedRequest(`/api/v1/students/documents/pending?application_id=${selectedApplication}`, { method: 'GET' }).catch((e) => { console.error('Pending docs error:', e); return null; });
      const uploadedResponse = await makeAuthenticatedRequest(`/api/v1/students/documents/uploaded?application_id=${selectedApplication}`, { method: 'GET' }).catch((e) => { console.error('Uploaded docs error:', e); return null; });
      const myDocsResponse = await makeAuthenticatedRequest(`/api/v1/documents/my`, { method: 'GET' }).catch((e) => { console.error('My docs error:', e); return null; });
      const overviewResponse = await makeAuthenticatedRequest(`/api/v1/students/documents/overview?application_id=${selectedApplication}`, { method: 'GET' }).catch((e) => { console.error('Overview error:', e); return null; });
      const profileResponse = await getStudentProfile().catch((e) => { console.error('Profile error:', e); return null; });
      
      console.log("[Documents] Pending response:", pendingResponse);
      console.log("[Documents] Uploaded response:", uploadedResponse);
      console.log("[Documents] My documents response:", myDocsResponse);
      console.log("[Documents] Profile response:", profileResponse);
      
      if (pendingResponse && typeof pendingResponse.total_pending === "number") {
        setTotalPendingCount(pendingResponse.total_pending);
      } else {
        setTotalPendingCount(pendingResponse?.pending_documents?.length || 0);
      }
      
      // Create a map of filename to document ID from /my endpoint
      const filenameToIdMap = new Map();
      if (myDocsResponse?.documents) {
        myDocsResponse.documents.forEach((doc: any) => {
          filenameToIdMap.set(doc.original_filename, doc.id);
        });
      }
      
      console.log("[Documents] ðŸ—ºï¸ Filename to ID map:", Array.from(filenameToIdMap.entries()));
      
      // Map pending documents
      const pendingMapped: Document[] = (pendingResponse?.pending_documents || []).map((doc: any, idx: number) => ({
        id: `pending-${doc.document_type}-${idx}`,
        field: doc.document_type,
        label: doc.display_name,
        required: doc.is_required,
        priority: (doc.priority_level?.toLowerCase() || "medium") as Document["priority"],
        description: doc.description,
        status: "pending" as const,
        acceptedFormats: doc.accepted_formats,
        maxFileSize: doc.max_file_size,
        daysUntilDeadline: doc.days_until_deadline,
        submissionDeadline: doc.submission_deadline,
      }));

      // âœ… Map uploaded documents and match with /my documents to get correct IDs
      const uploadedMapped: Document[] = (uploadedResponse?.uploaded_documents || []).map((doc: any, idx: number) => {
        const isRejected = doc.review_status === 'REJECTED' || doc.verification_status === 'REJECTED';
        
        // âœ… Try to find matching document ID from /my endpoint
        let documentId = filenameToIdMap.get(doc.file_name);
        
        // Fallback to upload_id if not found
        if (!documentId) {
          documentId = doc.upload_id || doc.document_id || doc.id;
        }
        
        console.log(`[Documents] ðŸ“„ Mapping document: ${doc.document_type}`, {
          file_name: doc.file_name,
          matched_id: documentId,
          from_my_endpoint: filenameToIdMap.has(doc.file_name)
        });
        
        return {
          id: `uploaded-${doc.document_type}-${idx}`,
          field: doc.document_type,
          label: doc.display_name || doc.document_type,
          required: false,
          priority: "medium" as const,
          description: doc.description || "",
          status: isRejected ? "rejected" : "uploaded" as const,
          uploadDate: doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : undefined,
          fileName: doc.file_name,
          uploadedId: documentId,  // âœ… ID from /my endpoint
          workflowId: doc.workflow_id,
          verificationStatus: doc.verification_status,
          reviewStatus: doc.review_status,
          statusDisplay: doc.status_display,
          reviewedAt: doc.reviewed_at,
          viewUrlAvailable: doc.view_url_available !== false,
          canDelete: doc.can_delete,
          rejectionReason: isRejected ? (doc.review_notes || doc.rejection_notes || "Document rejected. Please re-upload.") : undefined,
        };
      });

      // Map Profile Builder documents (Passport and Academic Transcripts)
      const profileBuilderDocs: Document[] = [];
      // (Removed mapping as per user request to not show these in uploaded section)

      const allDocs = [...pendingMapped, ...uploadedMapped];
      console.log("[Documents] ðŸ“Š Final mapped documents:", allDocs);
      setDocuments(allDocs);
      
      // ... rest of overview summary code stays the same ...
      
    } catch (error) {
      console.error("[Documents] Error fetching data:", error);
      setSubmitError("Failed to load documents. Please try again.");
      setDocuments([]);
      setOverviewSummary(null);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [selectedApplication]);

  const visibleDocuments = documents.filter(doc => {
    if (selectedCountry === "UK") {
      const lowerName = (doc.label || doc.field || "").toLowerCase();
      if (lowerName.includes("aps") || lowerName.includes("german language")) {
        return false;
      }
    }
    return true;
  });

  const documentsByStatus = {
    pending: visibleDocuments.filter((d) => d.status === "pending"),
    uploaded: visibleDocuments.filter((d) => d.status === "uploaded"),
    rejected: visibleDocuments.filter((d) => d.status === "rejected"),
  };

  const handleFileSelect = (doc: Document, file: File) => {
    if (!validateFileType(file)) {
      setUploadErrors((prev) => ({ ...prev, [doc.id]: "Invalid file type. Please upload PDF, JPG, JPEG, PNG, DOC, or DOCX files." }));
      return;
    }
    if (!validateFileSize(file)) {
      setUploadErrors((prev) => ({ ...prev, [doc.id]: "File size too large. Maximum allowed size is 10MB." }));
      return;
    }
    setSelectedFiles((prev) => ({ ...prev, [doc.id]: file }));
    setUploadErrors((prev) => ({ ...prev, [doc.id]: "" }));
  };

  const handleRemoveFile = (docId: string) => {
    setSelectedFiles((prev) => { const next = { ...prev }; delete next[docId]; return next; });
    setUploadErrors((prev) => { const next = { ...prev }; delete next[docId]; return next; });
  };

  const handleViewDocument = async (doc: Document) => {
  console.log("[Documents] ðŸ” VIEW DOCUMENT CALLED:");
  console.log("  Document object:", doc);
  console.log("  uploadedId:", doc.uploadedId);
  
  if (!doc.uploadedId) {
    console.error("[Documents] âŒ No document ID available");
    alert("Document ID not available. Cannot view document.");
    return;
  }

  const apiUrl = `/api/v1/documents/${doc.uploadedId}/view-url`;
  console.log(`[Documents] ðŸ“¡ Making request to: ${apiUrl}`);

  try {
    setViewerLoading(true);
    setViewerModal(true); // âœ… Open modal immediately
    
    const response = await makeAuthenticatedRequest(apiUrl, { method: 'GET' });
    console.log('[Documents] âœ… View URL response:', response);

    const viewUrl = response.view_url || response.url || response.data?.view_url;

    if (viewUrl) {
      console.log('[Documents] âœ… Setting viewer URL:', viewUrl);
      setViewerUrl(viewUrl);
    } else {
      console.error('[Documents] âŒ No view_url in response:', response);
      setViewerModal(false);
      alert("Unable to generate view URL. Please try again.");
    }
  } catch (error: any) {
    console.error('[Documents] âŒ Failed to get view URL:', error);
    setViewerModal(false);
    alert(`Failed to view document: ${error.message || 'Please try again or contact support'}`);
  } finally {
    setViewerLoading(false);
  }
};
  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.uploadedId) {
      alert("Document ID not available. Cannot download document.");
      return;
    }
    
    try {
      // Use the dedicated download service to fetch the Blob securely
      const blob = await downloadDocumentById(doc.uploadedId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || `document-${doc.uploadedId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (apiError) {
      console.warn("Dedicated download service failed, falling back to view URL...", apiError);
      const apiUrl = `/api/v1/documents/${doc.uploadedId}/view-url`;
      try {
        const response = await makeAuthenticatedRequest(apiUrl, { method: 'GET' });
        const viewUrl = response.view_url || response.url || response.data?.view_url;
        if (viewUrl) {
          try {
            const fileResp = await fetch(viewUrl);
            const blob = await fileResp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.fileName || `document-${doc.uploadedId}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (fetchError) {
            // Force download via target=_blank fallback
            const a = document.createElement('a');
            a.href = viewUrl;
            a.target = '_blank';
            a.download = doc.fileName || `document-${doc.uploadedId}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else {
          alert("Unable to generate download URL.");
        }
      } catch (error: any) {
        alert(`Failed to download document: ${error.message || 'Please try again'}`);
      }
    }
  };

  // Upload single document - UPDATED with application_id
 const handleUploadOne = async (doc: Document) => {
  if (s3Health === false) {
    alert("Document storage service is currently unavailable. Please try again later.");
    return;
  }

  const file = selectedFiles[doc.id];
  if (!file) {
    alert("Please choose a file for this document.");
    return;
  }

  if (!selectedApplication) {
    alert("Please select an application first.");
    return;
  }

  try {
    setUploadingOne(prev => ({ ...prev, [doc.id]: true }));
    setUploadErrors(prev => ({ ...prev, [doc.id]: "" }));

    const formData = new FormData();
    formData.append("application_id", selectedApplication);
    formData.append("document_type", doc.field);
    formData.append("file", file);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("uni360_access_token");

    console.log("[Documents] Uploading document:", {
      application_id: selectedApplication,
      document_type: doc.field,
      file_name: file.name
    });

    const response = await fetch(`${BASE_URL}/api/v1/students/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const uploadResponse = await response.json();
    console.log("[Documents] âœ… Upload response:", uploadResponse);

    // âœ… NOW fetch /api/v1/documents/my to get the actual document ID
    console.log("[Documents] ðŸ” Fetching all documents to find uploaded document ID...");
    
    const myDocsResponse = await makeAuthenticatedRequest('/api/v1/documents/my', {
      method: 'GET'
    });
    
    console.log("[Documents] ðŸ“‹ My documents response:", myDocsResponse);

    // âœ… Find the document we just uploaded by matching filename
    const uploadedDoc = myDocsResponse.documents?.find((d: any) => 
      d.original_filename === file.name || 
      d.original_filename.includes(file.name.split('.')[0])
    );

    if (!uploadedDoc) {
      console.error("[Documents] âŒ Could not find uploaded document in /my response");
      console.error("[Documents] Looking for filename:", file.name);
      console.error("[Documents] Available documents:", myDocsResponse.documents?.map((d: any) => d.original_filename));
      
      // Still mark as uploaded
      setDocuments(prev =>
        prev.map(d =>
          d.id === doc.id
            ? {
                ...d,
                status: "uploaded",
                fileName: file.name,
                uploadDate: new Date().toLocaleDateString(),
                rejectionReason: undefined,
              }
            : d
        )
      );
      
      handleRemoveFile(doc.id);
      alert("Document uploaded but ID not found. Please refresh the page to view it.");
      return;
    }

    // âœ… Extract the document ID from /my response
    const documentId = uploadedDoc.id;
    console.log("[Documents] âœ… Found document ID for viewing:", documentId);
    console.log("[Documents] Document details:", {
      id: documentId,
      filename: uploadedDoc.original_filename,
      file_url: uploadedDoc.file_url,
      upload_purpose: uploadedDoc.upload_purpose
    });

    // âœ… Update document with the correct ID for viewing
    setDocuments(prev =>
      prev.map(d =>
        d.id === doc.id
          ? {
              ...d,
              status: "uploaded",
              uploadedId: documentId,  // âœ… This is the ID from /my endpoint
              fileName: file.name,
              uploadDate: new Date().toLocaleDateString(),
              rejectionReason: undefined,
            }
          : d
      )
    );

    handleRemoveFile(doc.id);
    setActiveTab("uploaded");
    
  } catch (e: any) {
    console.error("[Documents] âŒ Upload failed:", e);
    setUploadErrors(prev => ({
      ...prev,
      [doc.id]: e.message || "Upload failed. Please try again.",
    }));
  } finally {
    setUploadingOne(prev => ({ ...prev, [doc.id]: false }));
  }
};

  

  // Submit all selected documents - UPDATED with application_id
  const handleSubmitAll = async () => {
    if (s3Health === false) {
    alert("Document storage service is currently unavailable. Please try again later.");
    return;
  }
    const files = Object.values(selectedFiles);
    if (files.length === 0) {
      alert("Please select at least one file to upload.");
      return;
    }

    // VALIDATION: Check if application is selected
    if (!selectedApplication) {
      alert("Please select an application first.");
      return;
    }

    const missingRequired = documents.filter((d) => d.required && d.status === "pending" && !selectedFiles[d.id]);
    if (missingRequired.length > 0) {
      alert(`Missing required documents: ${missingRequired.map((d) => d.label).join(", ")}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('uni360_access_token');

      console.log('[Documents] Submitting all documents for application:', selectedApplication);

      const uploadPromises = Object.entries(selectedFiles).map(async ([docId, file]) => {
        const doc = documents.find((d) => d.id === docId);
        if (!doc) return;

        const formData = new FormData();
        formData.append('application_id', selectedApplication!); // âœ… CRITICAL FIX
        formData.append('document_type', doc.field);
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/api/v1/students/documents/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to upload ${doc.label}`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);

      setDocuments((prev) =>
        prev.map((d) =>
          selectedFiles[d.id]
            ? { ...d, status: "uploaded", uploadDate: new Date().toLocaleDateString(), rejectionReason: undefined }
            : d
        )
      );
      
      setSelectedFiles({});
      alert("All documents uploaded successfully!");
    } catch (error: any) {
      console.error("[Documents] Upload error:", error);
      setSubmitError(error.message || "Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Custom Document
  const handleCustomUpload = async () => {
    if (s3Health === false) {
      alert("Document storage service is currently unavailable. Please try again later.");
      return;
    }

    if (!customDocFile) {
      setCustomUploadError("Please choose a file.");
      return;
    }

    if (!customDocName.trim()) {
      setCustomUploadError("Please enter a document name.");
      return;
    }

    if (!selectedApplication) {
      alert("Please select an application first.");
      return;
    }

    try {
      setCustomUploading(true);
      setCustomUploadError("");

      const formData = new FormData();
      formData.append("application_id", selectedApplication);
      formData.append("document_type", "OTHER_DOC");
      formData.append("notes", customDocName);
      formData.append("file", customDocFile);

      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem("uni360_access_token");

      const response = await fetch(`${BASE_URL}/api/v1/students/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Refresh to get uploaded doc id
      const myDocsResponse = await makeAuthenticatedRequest('/api/v1/documents/my', { method: 'GET' });
      const uploadedDoc = myDocsResponse.documents?.find((d: any) => 
        d.original_filename === customDocFile.name || 
        d.original_filename.includes(customDocFile.name.split('.')[0])
      );

      const newDoc: Document = {
        id: `custom-${Date.now()}`,
        field: "OTHER_DOC",
        label: customDocName,
        required: false,
        priority: "low",
        description: "Custom uploaded document",
        status: "uploaded",
        uploadDate: new Date().toLocaleDateString(),
        fileName: customDocFile.name,
        uploadedId: uploadedDoc?.id,
        viewUrlAvailable: uploadedDoc ? true : false,
        statusDisplay: "Uploaded"
      };

      setDocuments(prev => [...prev, newDoc]);
      setCustomDocFile(null);
      setCustomDocName("");
      setActiveTab("uploaded");
      
    } catch (e: any) {
      console.error("[Documents] Custom upload failed:", e);
      setCustomUploadError(e.message || "Upload failed. Please try again.");
    } finally {
      setCustomUploading(false);
    }
  };

  // Bulk upload all documents at once
  const handleBulkUpload = async () => {
    if (s3Health === false) {
      setBulkUploadError("Document storage service is currently unavailable. Please try again later.");
      return;
    }

    const fileKeys = Object.keys(bulkFiles);
    if (fileKeys.length === 0) {
      setBulkUploadError("Please select at least one file to upload.");
      return;
    }

    if (!selectedApplication) {
      setBulkUploadError("Please select an application first before uploading.");
      return;
    }

    try {
      setBulkUploading(true);
      setBulkUploadError("");
      setBulkUploadSuccess("");

      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('uni360_access_token');

      console.log('[Documents] Bulk uploading documents one by one:', fileKeys);

for (const docType of fileKeys) {
  const formData = new FormData();
  formData.append('application_id', selectedApplication);
  formData.append('document_type', docType);
  formData.append('file', bulkFiles[docType]);

  const response = await fetch(`${BASE_URL}/api/v1/students/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to upload ${docType} (status ${response.status})`);
  }

  console.log(`[Documents] Uploaded ${docType} successfully`);
}

      setBulkUploadSuccess(`Successfully uploaded ${fileKeys.length} document(s)!`);
      setBulkFiles({});

      // Refresh documents list after 1.5s
      setTimeout(() => {
        setBulkUploadModal(false);
        setBulkUploadSuccess("");
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('[Documents] Bulk upload error:', error);
      const msg = error.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setBulkUploadError('Upload failed — total file size may be too large for the server. Try uploading fewer documents at a time, or use smaller files (under 2MB each).');
      } else {
        setBulkUploadError(msg || 'Bulk upload failed. Please try again.');
      }
    } finally {
      setBulkUploading(false);
    }
  };

  const stats = {
  pending: overviewSummary?.total_pending || documentsByStatus.pending.length,
  uploaded: overviewSummary?.total_uploaded || documentsByStatus.uploaded.length,
  rejected: overviewSummary?.rejected_count || documentsByStatus.rejected.length,
  verified: overviewSummary?.verified_count || 0,
};

  const keyFor = (doc: Document, bucket: "pending" | "uploaded" | "rejected", i: number) =>
    `${doc.id}::${bucket}::${i}`;

  if (loading || loadingApplications) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (!overviewSummary && documents.length === 0) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Documents</h1>
            <p className="text-muted-foreground">Upload and manage your {countryName} visa application documents</p>
          </div>
          <Button variant="outline" onClick={() => setRequirementsModal(true)} className="flex items-center gap-2 self-start sm:self-auto">
            <Info className="w-4 h-4" />
            <span>Requirements Info</span>
          </Button>
        </div>
        <Card className="p-8 text-center bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents available</h3>
          <p className="text-muted-foreground">Please create a {countryName} visa application first to manage documents.</p>
        </Card>
      </div>
    );
  }

  

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Documents</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Upload and manage your {countryName} visa application documents</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            onClick={() => {
              setBulkUploadError('');
              setBulkUploadSuccess('');
              setBulkFiles({});
              setBulkUploadModal(true);
            }}
            disabled={totalPendingCount === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-[#E08D3C] to-[#c97a30] hover:from-[#c97a30] hover:to-[#b56d28] text-white shadow-md hover:shadow-[0_10px_30px_-10px_rgba(224,141,60,0.4)] transition-all duration-300"
          >
            <FolderUp className="w-4 h-4" />
            <span>Bulk Upload</span>
          </Button>
          <Button variant="outline" onClick={() => setRequirementsModal(true)} className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>Requirements Info</span>
          </Button>
        </div>
      </div>

      {/* S3 Health Status Banner */}
{s3HealthChecked && s3Health === false && (
  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
      <div>
        <h4 className="font-semibold text-red-900 mb-1">Storage Service Unavailable</h4>
        <p className="text-sm text-red-700">
          The document storage service is currently unavailable. Please try again later or contact support if the issue persists.
        </p>
      </div>
    </div>
  </div>
)}

{s3HealthChecked && s3Health === true && (
  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
    <div className="flex items-center gap-2">
      <CheckCircle className="w-4 h-4 text-green-600" />
      <p className="text-sm text-green-700 font-medium">
        Document storage is operational
      </p>
    </div>
  </div>
)}

      {submitError && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{submitError}</div>}


      {/* No applications warning */}
      {applications.length === 0 && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">No Applications Found</h4>
              <p className="text-sm text-red-700">
                You need to create an application first before uploading documents. Please go to the Applications page to create one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Country Info Banner */}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-orange-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(249,115,22,0.2)] hover:border-orange-400/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #fff7ed 0%, #ffffff 60%, #ffedd5 100%)" }}><div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pending}</div><div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Pending Upload</div></Card>
        <Card className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-green-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.2)] hover:border-green-400/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #dcfce7 100%)" }}><div className="text-xl sm:text-2xl font-bold text-green-600">{stats.uploaded}</div><div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Uploaded</div></Card>
        <Card className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-red-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(239,68,68,0.2)] hover:border-red-400/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #fef2f2 0%, #ffffff 60%, #fee2e2 100%)" }}><div className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</div><div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Re-upload Needed</div></Card>
        <Card className="p-3 sm:p-4 text-center bg-white/70 backdrop-blur-sm border-2 border-blue-200/50 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.2)] hover:border-blue-400/50 transition-all duration-500" style={{ background: "linear-gradient(160deg, #eff6ff 0%, #ffffff 60%, #dbeafe 100%)" }}><div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.verified}</div><div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">Verified</div></Card>
      </div>

      {/* Documents Tabs */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white h-auto p-1 sm:p-1.5 gap-1 sm:gap-0">
            <TabsTrigger value="pending" className="rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm px-1 py-1.5 sm:px-3 sm:py-1.5 whitespace-normal sm:whitespace-nowrap leading-tight text-center">Pending ({documentsByStatus.pending.length})</TabsTrigger>
            <TabsTrigger value="uploaded" className="rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm px-1 py-1.5 sm:px-3 sm:py-1.5 whitespace-normal sm:whitespace-nowrap leading-tight text-center">Uploaded ({documentsByStatus.uploaded.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg sm:rounded-xl text-[10px] xs:text-xs sm:text-sm px-1 py-1.5 sm:px-3 sm:py-1.5 whitespace-normal sm:whitespace-nowrap leading-tight text-center">Re-upload ({documentsByStatus.rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {documentsByStatus.pending.length === 0 ? (
                <Card className="p-8 text-center bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-sm">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All documents uploaded!</h3>
                  <p className="text-muted-foreground">You have no pending document uploads for {countryName}.</p>
                </Card>
              ) : (
                documentsByStatus.pending.map((doc, i) => (
                  <DocumentCard
  key={keyFor(doc, "pending", i)}
  document={doc}
  onFileSelect={handleFileSelect}
  onUploadOne={handleUploadOne}
  onView={handleViewDocument}  // Ã¢Å“â€¦ ADD THIS
  onDownload={handleDownloadDocument}
  onRemoveFile={handleRemoveFile}
  onDelete={() => {}}
  selectedFile={selectedFiles[doc.id]}
  uploadError={uploadErrors[doc.id]}
  uploading={uploadingOne[doc.id]}
  s3Health={s3Health}
/>
                ))
              )}

              {/* Custom Document Upload Card */}
              <div className="opacity-0 translate-y-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                <Card className="border-l-4 border-gray-200 bg-white/70 backdrop-blur-sm transition-all duration-500 shadow-sm hover:shadow-md">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg">Add Other Document</h3>
                          <Badge className="rounded-full text-[10px] sm:text-xs bg-gray-100 text-gray-800">Optional</Badge>
                        </div>
                        <p className="text-muted-foreground mb-3 text-sm">Upload any additional documents not listed above.</p>
                        
                        <input
                          type="text"
                          placeholder="Enter document name (e.g. Portfolio)"
                          value={customDocName}
                          onChange={(e) => {
                            setCustomDocName(e.target.value);
                            if (customUploadError) setCustomUploadError("");
                          }}
                          className="w-full sm:max-w-xs h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="flex gap-2 flex-col sm:flex-row mt-2 sm:mt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer">
                            <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700" asChild>
                              <span><Upload className="w-4 h-4 mr-2" />Choose file</span>
                            </Button>
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (!validateFileType(file)) {
                                    setCustomUploadError("Invalid file type.");
                                    return;
                                  }
                                  if (!validateFileSize(file)) {
                                    setCustomUploadError("File too large (max 10MB).");
                                    return;
                                  }
                                  setCustomDocFile(file);
                                  setCustomUploadError("");
                                }
                              }} 
                              className="hidden" 
                            />
                          </label>

                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={!customDocFile || !customDocName.trim() || customUploading} 
                            onClick={handleCustomUpload} 
                            className="rounded-full"
                          >
                            {customUploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>) : (<><Upload className="w-4 h-4 mr-2" />Upload</>)}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {customUploadError && <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded">{customUploadError}</div>}

                    {customDocFile && (
                      <div className="mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-2 min-w-0">
                            <File className="w-4 h-4 text-blue-600 mt-0.5 sm:mt-0 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-blue-800 truncate">
                              {customDocFile.name} ({formatFileSize(customDocFile.size)})
                            </span>
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-red-50 h-8 w-8 p-0" onClick={() => setCustomDocFile(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="uploaded">
            <div className="space-y-4">
              {documentsByStatus.uploaded.length === 0 ? (
                <Card className="p-8 text-center bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-sm">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
                  <p className="text-muted-foreground">Upload your {countryName} documents to see them here.</p>
                </Card>
              ) : (
                documentsByStatus.uploaded.map((doc, i) => (
<DocumentCard
  key={keyFor(doc, "uploaded", i)}
  document={doc}
  onFileSelect={handleFileSelect}
  onUploadOne={handleUploadOne}
  onView={handleViewDocument}   // âœ… FIX ADDED
  onDownload={handleDownloadDocument}
  onRemoveFile={handleRemoveFile}
  onDelete={() => {}}
  s3Health={s3Health}
/>

                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="space-y-4">
              {documentsByStatus.rejected.length === 0 ? (
                <Card className="p-8 text-center bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-sm">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No re-uploads needed!</h3>
                  <p className="text-muted-foreground">All your {countryName} documents have been approved.</p>
                </Card>
              ) : (
                documentsByStatus.rejected.map((doc, i) => (
                  <DocumentCard
  key={keyFor(doc, "rejected", i)}
  document={doc}
  onFileSelect={handleFileSelect}
  onUploadOne={handleUploadOne}
  onView={handleViewDocument}    // âœ… FIX ADDED
  onDownload={handleDownloadDocument}
  onRemoveFile={handleRemoveFile}
  onDelete={() => {}}
  selectedFile={selectedFiles[doc.id]}
  uploadError={uploadErrors[doc.id]}
  uploading={uploadingOne[doc.id]}
  s3Health={s3Health}
/>

                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={requirementsModal} onOpenChange={setRequirementsModal}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl flex-shrink-0">
  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-blue-900">
    <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
    Document Requirements
  </DialogTitle>
  <DialogDescription className="text-blue-600/70 text-sm mt-0.5">
    Important information about document requirements and submission guidelines.
  </DialogDescription>
</DialogHeader>
          
          <div className="space-y-5 overflow-y-auto px-6 py-5 flex-1 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-300" style={{ scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }}>
            <div>
              <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
  <span className="w-1 h-4 bg-blue-500 rounded-full inline-block"></span>
  Document Guidelines
</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>All documents must be clear and legible</li>
                <li>Accepted formats: PDF, JPG, PNG, DOC, DOCX</li>
                <li>Maximum file size: 10MB per document</li>
                <li>Documents should be in English or officially translated</li>
                <li>Each document must be linked to an active application</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Specific Document Requirements:</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                  <p className="font-medium text-foreground mb-1">Passport</p>
                  <p>Must be valid for at least 6 months beyond your intended stay. Ensure both the photo page and address page (if applicable) are clearly scanned without glare.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                  <p className="font-medium text-foreground mb-1">Academic Transcripts & Degree</p>
                  <p>Must be official documents. If the original is not in English (or the destination country's language), you must provide a certified/notarized translation along with the original scan.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                  <p className="font-medium text-foreground mb-1">Statement of Purpose (SOP)</p>
                  <p>Usually 1 to 2 pages long. Must clearly outline your academic background, motivation for the specific course, and your future career goals. Plagiarism is strictly checked.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                  <p className="font-medium text-foreground mb-1">Letter of Recommendation (LOR)</p>
                  <p>Should be written on official institutional or company letterhead. Must include the recommender's official contact information, designation, and signature.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-150">
                  <p className="font-medium text-foreground mb-1">Financial Proof / Blocked Account</p>
                  <p>Proof of sufficient funds must meet the exact monetary amount specified by the embassy for your intended year of study. Bank letters must be recently issued.</p>
                </div>
              </div>
            </div>
            
            {overviewSummary && (
              <div>
                <h4 className="font-semibold mb-2">Your Progress:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Total Required: {overviewSummary.total_required}</p>
                  <p>Uploaded: {overviewSummary.uploaded_count}</p>
                  <p>Verified: {overviewSummary.verified_count}</p>
                  <p>Pending Review: {overviewSummary.pending_review_count}</p>
                  <p>Rejected: {overviewSummary.rejected_count}</p>
                </div>
              </div>
            )}

            {selectedApplication && applications.length > 0 && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-2 text-blue-900">Current Application:</h4>
                <div className="text-sm text-blue-700">
                  {(() => {
                    const app = applications.find(a => a.id === selectedApplication);
                    if (app) {
                      return (
                        <div>
                          <p className="font-medium">{app.universityName || app.university || 'University'}</p>
                          <p>{app.programName || app.course || 'Program'}</p>
                          {app.referenceNumber && <p className="text-xs mt-1">Ref: {app.referenceNumber}</p>}
                        </div>
                      );
                    }
                    return <p>No application selected</p>;
                  })()}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={viewerModal} onOpenChange={setViewerModal}>
  <DialogContent className="max-w-6xl w-[95vw] sm:w-[90vw] md:w-[95vw] h-[90vh] p-0 flex flex-col">
    <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
      <DialogTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Document Viewer
        </span>
        
      </DialogTitle>
    </DialogHeader>
    
    <div className="flex-1 overflow-hidden p-4">
            {viewerLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading document...</span>
              </div>
            ) : viewerUrl ? (
              <iframe
  src={viewerUrl}
  className="w-full h-full border-0 rounded-lg"
  title="Document Viewer"
  onError={() => {
    alert("Failed to load document. Please try opening in a new tab.");
  }}
/>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load document</h3>
                  <p className="text-muted-foreground">Please try again or open in a new tab.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={bulkUploadModal} onOpenChange={setBulkUploadModal}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 via-amber-50 to-sky-50 rounded-t-2xl flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900">
              <FolderUp className="w-5 h-5 flex-shrink-0 text-[#E08D3C]" />
              Bulk Upload Documents
            </DialogTitle>
            <DialogDescription className="text-[#E08D3C]/70 text-sm mt-0.5">
              Upload multiple documents at once. Select a file for each document type you want to upload.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f5d0a9 transparent' }}>
            {bulkUploadError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{bulkUploadError}</span>
              </div>
            )}

            {bulkUploadSuccess && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{bulkUploadSuccess}</span>
              </div>
            )}

            {!selectedApplication && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Please wait while your latest application is selected, or create one if you have none.</span>
              </div>
            )}

            {documentsByStatus.pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-gray-600 font-medium">No pending documents</p>
                <p className="text-sm text-gray-500 mt-1">You have no documents pending for bulk upload.</p>
              </div>
            ) : documentsByStatus.pending.map((pendingDoc) => {
              const docType = { key: pendingDoc.field, label: pendingDoc.label || pendingDoc.field };
              const selectedFile = bulkFiles[docType.key];
              return (
                <div
                  key={docType.key}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-300",
                    selectedFile
                      ? "bg-orange-50/60 border-[#E08D3C]/30 shadow-sm"
                      : "bg-white border-gray-200 hover:border-[#E08D3C]/40 hover:shadow-[0_4px_16px_-4px_rgba(224,141,60,0.15)]"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedFile ? "bg-[#E08D3C]/15" : "bg-gray-100"
                    )}>
                      {selectedFile
                        ? <CheckCircle className="w-4 h-4 text-[#E08D3C]" />
                        : <FileText className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{docType.label}</p>
                      {selectedFile && (
                        <p className="text-xs text-[#E08D3C] truncate mt-0.5">
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedFile && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-red-600 hover:bg-red-50 border-red-200"
                        onClick={() => {
                          setBulkFiles(prev => {
                            const next = { ...prev };
                            delete next[docType.key];
                            return next;
                          });
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    )}
                    <label className="cursor-pointer">
                      <Button size="sm" className={cn("h-8 rounded-lg", selectedFile ? "bg-[#E08D3C] hover:bg-[#c97a30]" : "bg-[#E08D3C] hover:bg-[#c97a30]")} asChild>
                        <span>
                          <Upload className="w-3 h-3 mr-1.5" />
                          {selectedFile ? 'Change' : 'Choose File'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!validateFileType(file)) {
                            setBulkUploadError(`Invalid file type for ${docType.label}. Allowed: PDF, JPG, PNG, DOC, DOCX.`);
                            return;
                          }
                          if (!validateFileSize(file)) {
                            setBulkUploadError(`File too large for ${docType.label}. Max 10MB.`);
                            return;
                          }
                          setBulkUploadError('');
                          setBulkFiles(prev => ({ ...prev, [docType.key]: file }));
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-2xl">
            <p className="text-xs text-gray-500">
              {Object.keys(bulkFiles).length} of {documentsByStatus.pending.length} documents selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setBulkUploadModal(false)} disabled={bulkUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpload}
                disabled={bulkUploading || Object.keys(bulkFiles).length === 0 || !selectedApplication}
                className="bg-gradient-to-r from-[#E08D3C] to-[#c97a30] hover:from-[#c97a30] hover:to-[#b56d28] text-white min-w-[140px] shadow-md hover:shadow-[0_10px_30px_-10px_rgba(224,141,60,0.4)] transition-all duration-300"
              >
                {bulkUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><FolderUp className="w-4 h-4 mr-2" />Upload All</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/918799142717"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-3 sm:p-4 rounded-full shadow-[0_4px_12px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_16px_rgba(37,211,102,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
        aria-label="Contact us on WhatsApp"
        title="Contact Support"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
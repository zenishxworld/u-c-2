export const DASHBOARD_MAPPINGS = {
  // ------------------------------
  // BOOLEAN NORMALIZATION
  // ------------------------------
  true: "Active",
  false: "Inactive",
  "true": "Active",
  "false": "Inactive",

  // ------------------------------
  // TASK STATUSES
  // ------------------------------
  CREATED: "Created",
  CLAIMED: "Claimed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  PENDING: "Pending",

  // ------------------------------
  // PRIORITIES
  // ------------------------------
  1: "Low Priority",
  2: "Medium Priority",
  3: "High Priority",
  4: "Critical Priority",

  // ------------------------------
  // STAGES
  // ------------------------------
  APPLICATION_REVIEW: "Application Review",
  ACADEMIC_EVALUATION: "Academic Evaluation",
  CERTIFICATION_PROCESS: "Certification Process",
  FINAL_APPROVAL: "Final Approval",

  // ------------------------------
  // TASK TYPES
  // ------------------------------
  APPLICATION_CLAIM: "Application Claim",
  DOCUMENT_VERIFICATION: "Document Verification",
  LANGUAGE_VERIFICATION: "Language Verification",
  ACADEMIC_VERIFICATION: "Academic Verification",
  CERTIFICATION_PROCESSING: "Certification Processing",
  CERTIFICATE_ISSUANCE: "Certificate Issuance",
  FINAL_VERIFICATION: "Final Verification",

  // ------------------------------
  // WORKFLOW FIELDS
  // ------------------------------
  current: "Current Step",
  total: "Total Steps",
  percentage: "Progress Percentage",
  stage: "Workflow Stage",
  currentStep: "Current Step",
  completedSteps: "Completed Steps",
  remainingSteps: "Remaining Steps",
  nextTask: "Next Task",
  allStages: "All Stages",
  tasks: "Tasks",

  // ------------------------------
  // ACTIONS
  // ------------------------------
  COMPLETE: "Complete Task",
  REASSIGN: "Reassign Task",
  ADD_COMMENT: "Add Comment",

  // ------------------------------
  // FORM FIELDS
  // ------------------------------
  completionNotes: "Completion Notes",
  verificationStatus: "Verification Status",

  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_REVIEW: "Needs Review",

  // ------------------------------
  // VALIDATION RULES
  // ------------------------------
  ADMIN_CONFIRMATION: "Admin Confirmation Required",
  DOCUMENT_UPLOADED: "Document Upload Required",

  // ------------------------------
  // FLAGS
  // ------------------------------
  language_test_uploaded: "Language Test Uploaded",
  language_score_verified: "Language Score Verified",
  documents_uploaded: "Documents Uploaded",
  terms_accepted: "Terms Accepted",
  background_check_consent: "Background Check Consent",
  gpa_calculated: "GPA Calculated",
  data_accuracy_declaration: "Data Accuracy Declaration",
  third_party_sharing_consent: "Third Party Sharing Consent",
  has_work_experience: "Has Work Experience",
  scholarship_interest: "Scholarship Interest",
  universityPortalId: "University Portal ID",
  transcript_verified: "Transcript Verified",
  gdpr_consent: "GDPR Consent",
  diploma_verified: "Diploma Verified",
  loan_interest: "Loan Interest",
  data_retention_consent: "Data Retention Consent",
  submissionNotes: "Submission Notes",
  financial_documents_available: "Financial Documents Available",
  degree_verified: "Degree Verified",
  marketing_consent: "Marketing Consent",
  academic_documents_uploaded: "Academic Documents Uploaded",
  privacy_policy_accepted: "Privacy Policy Accepted",

  // ------------------------------
  // COMMON SYSTEM FIELDS
  // ------------------------------
  taskId: "Task ID",
  id: "ID",
  applicationId: "Application ID",
  workflowInstanceId: "Workflow Instance ID",
  ownerId: "Owner ID",
  assignee: "Assigned To",
  assignedTo: "Assigned To",
  owner: "Owner",
  deleted: "Deleted",
  updatedAt: "Updated At",
  createdAt: "Created At",
  dueDate: "Due Date",
  suspended: "Suspended",
  active: "Active",
};

export const autoFormat = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
};

export const getDashboardLabel = (key) => {
  if (key === null || key === undefined) return "";
  return (
    DASHBOARD_MAPPINGS[key] ||
    DASHBOARD_MAPPINGS[key.toString()] ||
    autoFormat(key)
  );
};

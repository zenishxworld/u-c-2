import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  getPendingDocuments, 
  getReviewedDocuments,
  getStudentDocuments, 
  updateDocumentStatus,
  uploadDocument,
  getDocumentViewUrl,
  getStudentsList, 
  getMyDocuments,
  deleteDocument,
  downloadDocument
} from "../services/documentService";
import {
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Types
interface StudentDoc {
  id: number;
  workflowId: string;
  documentId?: string;  // uploadId from API - used for view-url API
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: "pending" | "reupload_required" | "verified" | "rejected";
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  verificationStatus?: "VERIFIED" | "UNVERIFIED";
  reason?: string;
  reviewNotes?: string;
  fileUrl?: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  country: string;
  university: string;
  profilePhoto: string;
  documents: StudentDoc[];
  totalDocuments: number;
  pendingDocuments?: number;
  reuploadDocuments?: number;
  lastUpdate: string;
}

type TabId = "pending" | "verified" | "reupload";

// DocumentViewer Component
interface DocumentViewerProps {
  document: StudentDoc | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, isOpen, onClose }) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViewUrl = async () => {
      if (!isOpen || !document) {
        setViewUrl(null);
        setError(null);
        return;
      }

      // Always hit the view-url API using documentId (uploadId)
      if (!document.documentId) {
        setError("Document ID not available. Cannot load preview.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching view URL for documentId:', document.documentId);
        const result = await getDocumentViewUrl(document.documentId);

        if (result.success && result.viewUrl) {
          console.log('View URL fetched successfully:', result.viewUrl);
          setViewUrl(result.viewUrl);
        } else {
          console.error('Failed to get view URL:', result.message);
          setError(result.message || "Failed to load document");
        }
      } catch (err) {
        console.error("Error fetching view URL:", err);
        setError("Failed to load document preview");
      } finally {
        setLoading(false);
      }
    };

    fetchViewUrl();
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{document.name}</h3>
                <p className="text-sm text-gray-500">Uploaded on {new Date(document.uploadDate).toLocaleDateString()}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 bg-gray-50 rounded-lg border-2 border-gray-300 min-h-[500px] flex flex-col items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading document...</p>
                </div>
              ) : error ? (
                <div className="text-center p-8">
                  <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
                  <p className="text-lg text-red-600 mb-2">Unable to Load Document</p>
                  <p className="text-sm text-gray-500 max-w-md">{error}</p>
                </div>
              ) : viewUrl ? (
                <iframe
                  src={viewUrl}
                  className="w-full h-[500px] rounded-lg"
                  title={document.name}
                />
              ) : (
                <>
                  <DocumentTextIcon className="mx-auto h-24 w-24 text-gray-400 mb-6" />
                  <p className="text-lg text-gray-500 mb-2">Document Preview</p>
                  <p className="text-sm text-gray-400">
                    {document.size} • {document.type} Document
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ApprovalModal Component - must be outside DocumentModal to prevent remount on state change
interface ApprovalModalProps {
  isOpen: boolean;
  action: 'approve' | 'reject' | null;
  notes: string;
  processing: boolean;
  onNotesChange: (val: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen, action, notes, processing, onNotesChange, onSubmit, onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                action === 'approve' ? 'bg-green-100' : 'bg-red-100'
              } sm:mx-0 sm:h-10 sm:w-10`}>
                {action === 'approve' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {action === 'approve' ? 'Approve Document' : 'Reject Document'}
                </h3>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes {action === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder={action === 'approve' ? "Optional: Add any comments..." : "Required: Please explain why this document is being rejected..."}
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={processing || (action === 'reject' && !notes.trim())}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                action === 'approve' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              } ${processing || (action === 'reject' && !notes.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={onSubmit}
            >
              {processing ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
            </button>
            <button
              type="button"
              disabled={processing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DocsListPopup Component - Shows grouped docs for a student in verified/reupload tabs
interface DocsListPopupProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDocument: (doc: StudentDoc) => void;
  activeTab: TabId;
}

const DocsListPopup: React.FC<DocsListPopupProps> = ({ student, isOpen, onClose, onViewDocument, activeTab }) => {
  if (!isOpen || !student) return null;

  const isVerified = activeTab === 'verified';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Documents List */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <h4 className="text-md font-medium text-gray-900">
                    {isVerified ? 'Verified Documents' : 'Reupload Required'}
                  </h4>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {student.documents.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {student.documents.map((doc) => (
                  <div
                    key={`${doc.workflowId}-${doc.id}`}
                    className={`border rounded-lg p-4 transition-all ${
                      isVerified
                        ? 'border-green-200 bg-green-50/30 hover:bg-green-50'
                        : 'border-red-200 bg-red-50/30 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <h5 className="text-sm font-medium text-gray-900">{doc.name}</h5>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                        {(doc.reviewNotes || doc.reason) && (
                          <p className={`mt-2 text-sm text-gray-600 p-2 rounded border ${
                            isVerified
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <span className="font-medium">
                              {isVerified ? 'Verification Notes:' : 'Rejection Reason:'}
                            </span>{' '}
                            {doc.reviewNotes || doc.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center ml-4">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                          onClick={() => onViewDocument(doc)}
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DocumentModal Component
interface DocumentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDocument: (document: StudentDoc) => void;
  onRefresh: () => void;
  onBackToDashboard?: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ 
  student, 
  isOpen, 
  onClose, 
  onViewDocument,
  onRefresh,
  onBackToDashboard
}) => {
  const navigate = useNavigate();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [localDocs, setLocalDocs] = useState<StudentDoc[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync localDocs whenever student changes
  useEffect(() => {
    if (student) {
      setLocalDocs(student.documents);
    }
  }, [student]);

  // Separate documents by status
  const pendingDocs = localDocs.filter(d => d.status === "pending" || d.reviewStatus === "PENDING");
  const verifiedDocs = localDocs.filter(d => d.status === "verified" || d.reviewStatus === "APPROVED" || d.verificationStatus === "VERIFIED");
  const rejectedDocs = localDocs.filter(d => d.status === "rejected" || d.reviewStatus === "REJECTED" || d.status === "reupload_required");

  if (!isOpen || !student) return null;

  const handleApproveDocument = async (workflowId: string, notes: string) => {
    setProcessing(true);
    try {
      const payload = {
        verification_status: "VERIFIED",
        review_status: "APPROVED",
        review_notes: notes || "Document approved - meets requirements"
      };

      console.log('Approving document:', workflowId, payload);
      const result = await updateDocumentStatus(workflowId, payload);
      
      if (result.success) {
        console.log('Document approved successfully:', result);
        
        // Remove the actioned document from local list
        const updatedDocs = localDocs.filter(d => d.workflowId !== workflowId);
        setLocalDocs(updatedDocs);
        
        // Show success message
        setSuccessMessage('Document approved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Close approval sub-modal
        setShowApprovalModal(false);
        setSelectedWorkflowId(null);
        setReviewNotes("");
        
        // Refresh background data
        onRefresh();
        
        // Close the whole modal if no more documents
        if (updatedDocs.length === 0) {
          setTimeout(() => {
            if (onBackToDashboard) onBackToDashboard();
            else onClose();
          }, 1000);
        }
      } else {
        alert(result.message || 'Failed to approve document');
      }
    } catch (error) {
      console.error('Error approving document:', error);
      alert('An error occurred while approving the document');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDocument = async (workflowId: string, notes: string) => {
    setProcessing(true);
    try {
      const payload = {
        verification_status: "VERIFIED",
        review_status: "REJECTED",
        review_notes: notes || "Document rejected - please reupload"
      };

      console.log('Rejecting document:', workflowId, payload);
      const result = await updateDocumentStatus(workflowId, payload);
      
      if (result.success) {
        console.log('Document rejected successfully:', result);
        
        // Remove the actioned document from local list
        const updatedDocs = localDocs.filter(d => d.workflowId !== workflowId);
        setLocalDocs(updatedDocs);
        
        // Show success message
        setSuccessMessage('Document rejected successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Close approval sub-modal
        setShowApprovalModal(false);
        setSelectedWorkflowId(null);
        setReviewNotes("");
        
        // Refresh background data
        onRefresh();
        
        // Close the whole modal if no more documents
        if (updatedDocs.length === 0) {
          setTimeout(() => {
            if (onBackToDashboard) onBackToDashboard();
            else onClose();
          }, 1000);
        }
      } else {
        alert(result.message || 'Failed to reject document');
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('An error occurred while rejecting the document');
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (workflowId: string, action: 'approve' | 'reject') => {
    setSelectedWorkflowId(workflowId);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = () => {
    if (!selectedWorkflowId || !approvalAction) return;
    
    if (approvalAction === 'approve') {
      handleApproveDocument(selectedWorkflowId, reviewNotes);
    } else {
      handleRejectDocument(selectedWorkflowId, reviewNotes);
    }
  };

  const handleViewProfile = () => {
    navigate(`/students/${student.id}`);
    onClose();
  };

  // Use localDocs for rendering so we get immediate UI updates
  // Now separated into pending, verified, and rejected sections

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          ></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              {/* Success notification */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">{successMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <img
                    src={student.profilePhoto}
                    alt={student.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {onBackToDashboard && (
                    <button
                      onClick={onBackToDashboard}
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      &larr; Back to Dashboard
                    </button>
                  )}
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                {/* Pending Documents Section */}
                {pendingDocs.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                        <h4 className="text-md font-medium text-gray-900">Pending Review</h4>
                      </div>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {pendingDocs.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pendingDocs.map((doc) => (
                        <div key={`${doc.workflowId}-${doc.id}`} className="border border-yellow-200 rounded-lg p-4 hover:bg-yellow-50 transition-all bg-yellow-50/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                <h5 className="text-sm font-medium text-gray-900">{doc.name}</h5>
                              </div>
                              <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                                <span>{doc.type}</span>
                                <span>•</span>
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                              {doc.documentId && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Document ID: {doc.documentId}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                                onClick={() => onViewDocument(doc)}
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                View
                              </button>
                              <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                                onClick={() => openApprovalModal(doc.workflowId, 'approve')}
                              >
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                onClick={() => openApprovalModal(doc.workflowId, 'reject')}
                              >
                                <XCircleIcon className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Documents Section */}
                {verifiedDocs.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <h4 className="text-md font-medium text-gray-900">Verified Documents</h4>
                      </div>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {verifiedDocs.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {verifiedDocs.map((doc) => (
                        <div key={`${doc.workflowId}-${doc.id}`} className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-all bg-green-50/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                <h5 className="text-sm font-medium text-gray-900">{doc.name}</h5>
                              </div>
                              <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                                <span>{doc.type}</span>
                                <span>•</span>
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                              {doc.reviewNotes && (
                                <p className="mt-2 text-sm text-gray-600 bg-green-50 p-2 rounded">
                                  <span className="font-medium">Verification Notes:</span> {doc.reviewNotes}
                                </p>
                              )}
                              {doc.documentId && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Document ID: {doc.documentId}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                                onClick={() => onViewDocument(doc)}
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reupload Required Section */}
                {rejectedDocs.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        <h4 className="text-md font-medium text-gray-900">Reupload Required</h4>
                      </div>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {rejectedDocs.length}
                      </span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {rejectedDocs.map((doc) => (
                        <div key={`${doc.workflowId}-${doc.id}`} className="border border-red-200 rounded-lg p-4 hover:bg-red-50 transition-all bg-red-50/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                                <h5 className="text-sm font-medium text-gray-900">{doc.name}</h5>
                              </div>
                              <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                                <span>{doc.type}</span>
                                <span>•</span>
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                              {(doc.reviewNotes || doc.reason) && (
                                <p className="mt-2 text-sm text-gray-600 bg-red-50 p-2 rounded border border-red-200">
                                  <span className="font-medium">Rejection Reason:</span> {doc.reviewNotes || doc.reason}
                                </p>
                              )}
                              {doc.documentId && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Document ID: {doc.documentId}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                                onClick={() => onViewDocument(doc)}
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Documents */}
                {pendingDocs.length === 0 && verifiedDocs.length === 0 && rejectedDocs.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">All documents processed!</p>
                    <p className="mt-1 text-sm text-gray-500">No pending, verified, or rejected documents for this student.</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ApprovalModal
        isOpen={showApprovalModal}
        action={approvalAction}
        notes={reviewNotes}
        processing={processing}
        onNotesChange={setReviewNotes}
        onSubmit={handleApprovalSubmit}
        onClose={() => { setShowApprovalModal(false); setReviewNotes(""); }}
      />
    </>
  );
};

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [returnAppId, setReturnAppId] = useState<string | null>(location.state?.applicationId || null);
  const incomingStudentId = location.state?.studentId || null;
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<StudentDoc | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<boolean>(false);
  const [showDocsListPopup, setShowDocsListPopup] = useState<boolean>(false);
  const [docsListStudent, setDocsListStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowDocuments, setWorkflowDocuments] = useState<any[]>([]);
  const [reviewedDocuments, setReviewedDocuments] = useState<any[]>([]);
  const [reviewedLoading, setReviewedLoading] = useState<boolean>(false);
  const [studentsMap, setStudentsMap] = useState<Record<number, { name: string; email: string }>>({});

 useEffect(() => {
    fetchPendingDocuments();
    fetchReviewedDocuments();
    fetchStudentsList();
  }, []);

  const fetchStudentsList = async () => {
  const result = await getStudentsList();
  if (result.success && result.data.length > 0) {
    const map: Record<number, { name: string; email: string }> = {};
    result.data.forEach((s: any) => {
      if (s.id) {
        map[s.id] = { name: s.name, email: s.email };
      }
    });
    setStudentsMap(map);
  }
};

  const fetchPendingDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const workflowResult = await getPendingDocuments();
      
      if (workflowResult.success) {
        setWorkflowDocuments(workflowResult.data);
        console.log('Fetched workflow documents:', workflowResult.data);
      } else {
        setError(workflowResult.message || 'Failed to load documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('An error occurred while fetching documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewedDocuments = async () => {
    setReviewedLoading(true);
    try {
      const result = await getReviewedDocuments();
      if (result.success) {
        setReviewedDocuments(result.data);
        console.log('Fetched reviewed documents:', result.data);
      }
    } catch (err) {
      console.error('Error fetching reviewed documents:', err);
    } finally {
      setReviewedLoading(false);
    }
  };

  const transformWorkflowToStudents = (workflows: any[]): Student[] => {
  const grouped = workflows.reduce((acc, wf) => {
    const studentId = wf.student_id;
    if (!acc[studentId]) acc[studentId] = [];
    acc[studentId].push(wf);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped).map(([studentId, docs]) => {
    const firstDoc = docs[0];

    // All workflows from pending-review API are pending unless rejected
    const reuploadDocs = docs.filter(d => d.workflow_stage === 'REJECTED');
    const pendingDocs = docs.filter(d => d.workflow_stage !== 'REJECTED');

    return {
      id: parseInt(studentId),
      name: studentsMap[parseInt(studentId)]?.name || `Student ${studentId}`,
      email: studentsMap[parseInt(studentId)]?.email || `student${studentId}@university.edu`,
      country: "Unknown",
      university: "Unknown",
      profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      documents: docs.map((doc, idx) => ({
        id: idx,
        workflowId: doc.workflow_id,   // ← snake_case from API
        documentId: undefined,          // pending-review doesn't return uploadId; fetched on modal open
        name: doc.file_name || 'Unknown Document',
        type: doc.document_type || 'GENERAL',
        size: "Unknown",
        uploadDate: doc.uploaded_at,
        status: doc.workflow_stage === 'REJECTED' ? 'reupload_required' as const : 'pending' as const,
        reason: undefined,
        fileUrl: undefined,
      })),
      totalDocuments: docs.length,
      pendingDocuments: pendingDocs.length,
      reuploadDocuments: reuploadDocs.length,
      lastUpdate: firstDoc.uploaded_at,
    };
  });
};
  const transformReviewedToStudents = (workflows: any[]): Student[] => {
    const grouped = workflows.reduce((acc, wf) => {
      const studentId = wf.student_id;
      if (!acc[studentId]) acc[studentId] = [];
      acc[studentId].push(wf);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([studentId, docs]) => {
      const firstDoc = docs[0];

      return {
        id: parseInt(studentId),
        name: studentsMap[parseInt(studentId)]?.name || `Student ${studentId}`,
        email: studentsMap[parseInt(studentId)]?.email || `student${studentId}@university.edu`,
        country: "Unknown",
        university: "Unknown",
        profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
        documents: docs.map((doc: any, idx: number) => ({
          id: idx,
          workflowId: doc.workflow_id,
          documentId: doc.upload_id || undefined,
          name: doc.file_name || 'Unknown Document',
          type: doc.document_type || 'GENERAL',
          size: "Unknown",
          uploadDate: doc.uploaded_at || doc.reviewed_at,
          status: doc.review_status === 'APPROVED' ? 'verified' as const : 
                 doc.review_status === 'REJECTED' ? 'rejected' as const : 'pending' as const,
          reviewStatus: doc.review_status,
          verificationStatus: doc.verification_status,
          reviewNotes: doc.review_notes,
          reason: doc.review_notes,
          fileUrl: undefined,
        })),
        totalDocuments: docs.length,
        pendingDocuments: 0,
        reuploadDocuments: 0,
        lastUpdate: firstDoc.reviewed_at || firstDoc.uploaded_at || new Date().toISOString(),
      };
    });
  };

  const getCurrentStudents = (): Student[] => {
    if (activeTab === 'verified') {
      const allReviewed = transformReviewedToStudents(reviewedDocuments);
      // Filter to only students who have at least one APPROVED doc
      return allReviewed
        .map(s => ({
          ...s,
          documents: s.documents.filter(d => d.reviewStatus === 'APPROVED'),
          totalDocuments: s.documents.filter(d => d.reviewStatus === 'APPROVED').length,
        }))
        .filter(s => s.totalDocuments > 0);
    }
    
    if (activeTab === 'reupload') {
      const allReviewed = transformReviewedToStudents(reviewedDocuments);
      // Filter to only students who have at least one REJECTED doc
      return allReviewed
        .map(s => ({
          ...s,
          documents: s.documents.filter(d => d.reviewStatus === 'REJECTED'),
          totalDocuments: s.documents.filter(d => d.reviewStatus === 'REJECTED').length,
        }))
        .filter(s => s.totalDocuments > 0);
    }
    
    const transformed = transformWorkflowToStudents(workflowDocuments);
    return transformed.filter(s => s.pendingDocuments && s.pendingDocuments > 0);
  };

  const getFilteredStudents = (): Student[] => {
    const currentStudents = getCurrentStudents();
    return currentStudents.filter((student) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.university.toLowerCase().includes(term);
      const matchesCountry = selectedCountry === "all" || student.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  };

  const getTotalStats = () => {
    const transformed = transformWorkflowToStudents(workflowDocuments);
    const pendingStudents = transformed.filter(s => s.pendingDocuments && s.pendingDocuments > 0);
    const reuploadStudents = transformed.filter(s => s.reuploadDocuments && s.reuploadDocuments > 0);
    
    // Calculate total unique students across pending and reviewed documents
    const allStudentIds = new Set([
      ...workflowDocuments.map(wf => wf.student_id),
      ...reviewedDocuments.map(wf => wf.student_id)
    ].filter(Boolean));
    
    // Total documents across all stages
    const totalDocuments = workflowDocuments.length + reviewedDocuments.length;
    
    return { 
      total: allStudentIds.size, 
      pending: pendingStudents.length, 
      reupload: reuploadStudents.length, 
      totalDocuments 
    };
  };

  const stats = getTotalStats();
  const filteredStudents = getFilteredStudents();

  const verifiedDocCount = reviewedDocuments.filter((wf: any) => wf.review_status === 'APPROVED').length;
  const reuploadDocCount = reviewedDocuments.filter((wf: any) => wf.review_status === 'REJECTED').length;

  const tabs: { id: TabId; name: string; icon: typeof ClockIcon; count: number }[] = [
    {
      id: "pending",
      name: "Documents Pending Review",
      icon: ClockIcon,
      count: stats.pending,
    },
    {
      id: "verified",
      name: "Verified Documents",
      icon: CheckCircleIcon,
      count: verifiedDocCount,
    },
    {
      id: "reupload",
      name: "Reupload Required",
      icon: ExclamationTriangleIcon,
      count: reuploadDocCount,
    },
  ];

  const handleViewStudent = (studentId: number) => {
    navigate(`/students/${studentId}?source=documents`);
  };

  const handleViewDocuments = async (student: Student) => {
  setSelectedStudent(student);
  setShowDocumentModal(true);

  // Fetch real document details (with uploadId/fileUrl) for this student
  const result = await getStudentDocuments(student.id);
  if (result.success && result.data.length > 0) {
    // Get the set of workflow IDs from the pending-review list for this student
    const pendingWorkflowIds = new Set(
      student.documents.map(d => d.workflowId)
    );

    const enrichedDocs: StudentDoc[] = result.data
      .filter((doc: any) => {
        // Only include documents that are in the pending workflow list
        // OR that have a pending/uploaded review status
        return pendingWorkflowIds.has(doc.workflowId) || 
               (!doc.reviewStatus || doc.reviewStatus === 'PENDING' || doc.reviewStatus === 'UPLOADED');
      })
      .map((doc: any, idx: number) => ({
        id: idx,
        workflowId: doc.workflowId,
        documentId: doc.uploadId,           // ← this is what view-url needs
        name: doc.originalFilename || 'Unknown Document',
        type: doc.documentType || 'GENERAL',
        size: doc.formattedFileSize || 'Unknown',
        uploadDate: doc.uploadedAt || doc.workflowCreatedAt,
        status: (doc.reviewStatus === 'REJECTED' || doc.verificationStatus === 'REJECTED')
          ? 'reupload_required' as const
          : 'pending' as const,
        reason: doc.verificationNotes || doc.reviewNotes,
        fileUrl: doc.fileUrl,
      }));

    // If no enriched docs match, fall back to the original pending docs
    // (they already have workflowId for approve/reject)
    if (enrichedDocs.length > 0) {
      setSelectedStudent(prev => prev ? { ...prev, documents: enrichedDocs } : prev);
    }
  }
};

  const handleViewDocument = (document: StudentDoc) => {
    console.log('Viewing document:', document);
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };

  const handleViewGroupedDocs = (student: Student) => {
    if (student.documents.length === 1) {
      // Single doc - directly open viewer
      handleViewDocument(student.documents[0]);
    } else {
      // Multiple docs - show popup with docs list
      setDocsListStudent(student);
      setShowDocsListPopup(true);
    }
  };

  const handleDownloadDocuments = async (student: Student) => {
    for (const doc of student.documents) {
      if (doc.documentId) {
        console.log('Downloading document with ID:', doc.documentId);
        const viewUrlResult = await getDocumentViewUrl(doc.documentId);
        if (viewUrlResult.success && viewUrlResult.viewUrl) {
          await downloadDocument(viewUrlResult.viewUrl, doc.name);
        } else {
          console.error('Failed to get view URL for download:', viewUrlResult.message);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.warn(`Document ${doc.name} doesn't have a documentId (uploadId)`);
      }
    }
  };

  const handleEditStudent = (studentId: number) => {
    navigate(`/students/${studentId}?mode=edit&source=documents`);
  };

  const handleDeleteStudent = (studentId: number, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      console.log(`Deleting student ${studentId}`);
    }
  };

  useEffect(() => {
    if (incomingStudentId && Object.keys(studentsMap).length > 0) {
      if (workflowDocuments.length > 0) {
        const allStudents = transformWorkflowToStudents(workflowDocuments);
        const target = allStudents.find(s => s.id === parseInt(incomingStudentId as unknown as string));
        
        if (target && !showDocumentModal) {
          handleViewDocuments(target);
          navigate('.', { replace: true, state: {} });
        } else if (!showDocumentModal) {
          const simulated: Student = {
            id: parseInt(incomingStudentId as unknown as string),
            name: studentsMap[parseInt(incomingStudentId as unknown as string)]?.name || `Student ${incomingStudentId}`,
            email: studentsMap[parseInt(incomingStudentId as unknown as string)]?.email || `student${incomingStudentId}@UNI360°.com`,
            country: "Unknown",
            university: "Unknown",
            profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
            documents: [],
            totalDocuments: 0,
            lastUpdate: new Date().toISOString()
          };
          handleViewDocuments(simulated);
          navigate('.', { replace: true, state: {} });
        }
      } else if (!loading && !showDocumentModal) {
        const simulated: Student = {
          id: parseInt(incomingStudentId as unknown as string),
          name: studentsMap[parseInt(incomingStudentId as unknown as string)]?.name || `Student ${incomingStudentId}`,
          email: studentsMap[parseInt(incomingStudentId as unknown as string)]?.email || `student${incomingStudentId}@UNI360°.com`,
          country: "Unknown",
          university: "Unknown",
          profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
          documents: [],
          totalDocuments: 0,
          lastUpdate: new Date().toISOString()
        };
        handleViewDocuments(simulated);
        navigate('.', { replace: true, state: {} });
      }
    }
  }, [incomingStudentId, workflowDocuments, studentsMap, loading, showDocumentModal, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
              <p className="text-sm text-gray-500">Manage student documents requiring review or reupload</p>
            </div>

          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Reupload Required</p>
                <p className="text-2xl font-bold text-gray-900">{reuploadDocCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search students or universities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative group py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${isActive
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                    <span
                      className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                        isActive ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-t origin-left shadow-sm"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchPendingDocuments}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students/Documents Display */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "pending" ? (
          /* ===== PENDING TAB: Grouped by student ===== */
          filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending documents</h3>
              <p className="mt-1 text-sm text-gray-500">All documents have been reviewed.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Docs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <button className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer text-left" onClick={() => handleViewStudent(student.id)}>
                                {student.name}
                              </button>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.university}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {student.pendingDocuments} documents
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(student.lastUpdate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex justify-center">
                            <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors" onClick={() => handleViewDocuments(student)} title="View Documents">
                              <FolderIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* ===== VERIFIED / REUPLOAD TABS: Grouped by student ===== */
          filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              {activeTab === "verified" ? (
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              ) : (
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab === "verified" ? "verified" : "reupload required"} documents
              </h3>
              <p className="mt-1 text-sm text-gray-500">No documents found in this category.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Student</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Documents</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Last Update</th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
    </tr>
  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <button className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer text-left" onClick={() => handleViewStudent(student.id)}>
                                {student.name}
                              </button>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            activeTab === "verified"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {student.totalDocuments} {student.totalDocuments === 1 ? 'document' : 'documents'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(student.lastUpdate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex justify-center">
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                              onClick={() => handleViewGroupedDocs(student)}
                              title="View Documents"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              View
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Document Modal */}
      <DocumentModal 
        student={selectedStudent} 
        isOpen={showDocumentModal} 
        onClose={() => {
           setShowDocumentModal(false);
        }}
        onBackToDashboard={returnAppId ? () => {
           setShowDocumentModal(false);
           navigate('/dashboard', { state: { openApplicationId: returnAppId, restoredState: location.state?.dashboardState } });
        } : undefined}
        onViewDocument={handleViewDocument}
        onRefresh={() => { fetchPendingDocuments(); fetchReviewedDocuments(); }}
      />
      
      {/* Document Viewer */}
      <DocumentViewer 
        document={selectedDocument} 
        isOpen={showDocumentViewer} 
        onClose={() => setShowDocumentViewer(false)} 
      />

      {/* Docs List Popup for Verified/Reupload tabs */}
      <DocsListPopup
        student={docsListStudent}
        isOpen={showDocsListPopup}
        onClose={() => setShowDocsListPopup(false)}
        onViewDocument={handleViewDocument}
        activeTab={activeTab}
      />

    </div>
  );
};
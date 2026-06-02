import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Download,
  Eye,
  Check,
  X,
  AlertCircle,
  FileText,
  Building,
  Globe,
  CreditCard,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Application {
  id: string;
  applicationNumber: string;
  submissionDate: string;
  status: "pending" | "approved" | "rejected" | "in_review";
  program: string;
  startDate: string;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
  university: {
    id: string;
    name: string;
    country: string;
    website: string;
    logo?: string;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    status: "approved" | "pending" | "rejected" | "reupload_required";
    uploadDate: string;
    url?: string;
    rejectionReason?: string;
  }[];
  timeline: {
    date: string;
    status: string;
    description: string;
  }[];
  notes: {
    date: string;
    content: string;
    author: string;
  }[];
  payments: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: "completed" | "pending" | "failed" | "refunded";
    date: string;
    paymentMethod?: string;
    transactionId?: string;
    dueDate?: string;
  }[];
}

const mockApplication: Application = {
  id: "app1",
  applicationNumber: "APP-2025-001",
  submissionDate: "2025-02-15T14:30:00Z",
  status: "in_review",
  program: "Master of Computer Science",
  startDate: "2025-09-01",
  student: {
    id: "stu1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 123-456-7890",
  },
  university: {
    id: "uni1",
    name: "Technical University of Munich",
    country: "Germany",
    website: "https://www.tum.de/",
  },
  documents: [
    {
      id: "doc1",
      name: "Passport",
      type: "Identity",
      status: "approved",
      uploadDate: "2025-01-10",
      url: "#",
    },
    {
      id: "doc2",
      name: "Academic Transcript",
      type: "Academic",
      status: "rejected",
      uploadDate: "2025-01-15",
      url: "#",
      rejectionReason:
        "Transcript is not authenticated. Please provide a certified copy.",
    },
    {
      id: "doc3",
      name: "Letter of Recommendation",
      type: "Reference",
      status: "pending",
      uploadDate: "2025-01-20",
      url: "#",
    },
    {
      id: "doc4",
      name: "Statement of Purpose",
      type: "Personal",
      status: "reupload_required",
      uploadDate: "2025-01-22",
      url: "#",
      rejectionReason:
        "Statement exceeds page limit. Please reformat according to guidelines.",
    },
  ],
  timeline: [
    {
      date: "2025-02-15T14:30:00Z",
      status: "Application Submitted",
      description: "Application submitted by the student.",
    },
    {
      date: "2025-02-16T09:15:00Z",
      status: "Document Review Started",
      description: "Application documents are under review.",
    },
    {
      date: "2025-02-20T11:45:00Z",
      status: "Document Review Completed",
      description: "All documents have been reviewed.",
    },
    {
      date: "2025-02-21T13:20:00Z",
      status: "In Review",
      description: "Application is under review by admissions committee.",
    },
  ],
  notes: [
    {
      date: "2025-02-16T10:30:00Z",
      content: "Student called to confirm receipt of application.",
      author: "Admin Staff",
    },
    {
      date: "2025-02-18T14:45:00Z",
      content: "Requested additional clarification on work experience.",
      author: "Admissions Officer",
    },
  ],
  payments: [
    {
      id: "pay1",
      type: "Application Fee",
      amount: 75,
      currency: "EUR",
      status: "completed",
      date: "2025-02-15T14:30:00Z",
      paymentMethod: "Credit Card",
      transactionId: "TXN-APP-001",
    },
    {
      id: "pay2",
      type: "Service Fee",
      amount: 500,
      currency: "EUR",
      status: "pending",
      date: "2025-02-20T00:00:00Z",
      paymentMethod: "Bank Transfer",
      dueDate: "2025-02-25T23:59:59Z",
    },
    {
      id: "pay3",
      type: "Document Verification",
      amount: 25,
      currency: "EUR",
      status: "completed",
      date: "2025-02-16T11:15:00Z",
      paymentMethod: "PayPal",
      transactionId: "TXN-DOC-002",
    },
  ],
};

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  approved: { color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
  in_review: { color: "bg-blue-100 text-blue-800", label: "In Review" },
};

const documentStatusConfig = {
  approved: { color: "bg-green-100 text-green-800", icon: Check },
  pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  rejected: { color: "bg-red-100 text-red-800", icon: X },
  reupload_required: {
    color: "bg-orange-100 text-orange-800",
    icon: AlertCircle,
  },
};

const paymentStatusConfig = {
  completed: { color: "bg-green-100 text-green-800", icon: Check },
  pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  failed: { color: "bg-red-100 text-red-800", icon: X },
  refunded: { color: "bg-gray-100 text-gray-800", icon: AlertCircle },
};

const ApplicationDetails: React.FC = () => {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<
    Application["documents"][0] | null
  >(null);
  const [documentAction, setDocumentAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newNote, setNewNote] = useState("");
  const [notificationSent, setNotificationSent] = useState<
    Record<string, boolean>
  >({}); // Track sent notifications
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    // Mock API call - replace with actual API
    setApplication(mockApplication);
  }, [id]);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/applications/${id}/${tab}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleDocumentAction = (
    action: "approve" | "reject",
    reason?: string
  ) => {
    if (!selectedDocument) return;

    // Mock API call to update document status
    console.log(`${action} document ${selectedDocument.id}`, reason);

    // Update local state
    if (application) {
      const updatedDocuments = application.documents.map((doc) =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              status:
                action === "approve"
                  ? ("approved" as const)
                  : ("rejected" as const),
              rejectionReason: reason,
            }
          : doc
      );
      setApplication({ ...application, documents: updatedDocuments });
    }

    setSelectedDocument(null);
    setDocumentAction(null);
    setRejectionReason("");
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !application) return;

    const newNoteObj = {
      date: new Date().toISOString(),
      content: newNote,
      author: "Admin User", // Replace with actual user name
    };

    // Update local state
    setApplication({
      ...application,
      notes: [...application.notes, newNoteObj],
    });

    setNewNote("");
  };

  const handleNotifyStudent = (documentId: string, documentName: string) => {
    // In a real application, you'd call an API endpoint here to send the notification

    // Mark this document as having been notified
    setNotificationSent((prev) => ({
      ...prev,
      [documentId]: true,
    }));

    // Add a note about the notification
    if (application) {
      const notificationNote = {
        date: new Date().toISOString(),
        content: `Notification sent to student about document: ${documentName}`,
        author: "Admin User", // Replace with actual user name
      };

      setApplication({
        ...application,
        notes: [...application.notes, notificationNote],
      });
    }

    // Show confirmation to the admin
    toast({
      title: "Notification Sent",
      description: `Student has been notified about ${documentName}`,
      variant: "success",
    });
  };

  if (!application) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center flex-wrap flex-row justify-start gap-4">
        <Button variant="ghost" onClick={() => navigate("/applications")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-12 w-12">
            <AvatarImage src={application.university.logo} />
            <AvatarFallback className="uni-gradient-primary text-white">
              {getInitials(application.university.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold uni-text-primary">
              {application.program}
            </h1>
            <p className="text-muted-foreground">
              Application ID: {application.applicationNumber}
            </p>
          </div>
          <Badge className={statusConfig[application.status].color}>
            {statusConfig[application.status].label}
          </Badge>
        </div>
      </motion.div>

      {/* Application Details Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Pending Documents Alert Section */}
            {application.documents.some(
              (doc) =>
                doc.status === "rejected" || doc.status === "reupload_required"
            ) && (
              <Card className="border-yellow-300 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-yellow-800 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Pending Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.documents
                      .filter(
                        (doc) =>
                          doc.status === "pending" ||
                          doc.status === "reupload_required"
                      )
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-white p-3 rounded-md border border-yellow-200">
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <Badge
                              className={
                                documentStatusConfig[doc.status].color
                              }>
                              {doc.status === "pending"
                                ? "Pending Review"
                                : "Reupload Required"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-500 text-white hover:bg-blue-600"
                              onClick={() =>
                                handleNotifyStudent(doc.id, doc.name)
                              }
                              disabled={notificationSent[doc.id]}>
                              {notificationSent[doc.id]
                                ? "Notification Sent"
                                : "Notify Student"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Program
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 uni-text-accent" />
                      <p>{application.program}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Submission Date
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 uni-text-accent" />
                      <p>
                        {new Date(
                          application.submissionDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Start Date
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 uni-text-accent" />
                      <p>
                        {new Date(application.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>University Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      University
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Building className="w-4 h-4 uni-text-accent" />
                      <p>{application.university.name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 uni-text-accent" />
                      <p>{application.university.country}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Website
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Globe className="w-4 h-4 uni-text-accent" />
                      <a
                        href={application.university.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline">
                        {application.university.website}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Name
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <p>{application.student.name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4 uni-text-accent" />
                      <p>{application.student.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 uni-text-accent" />
                      <p>{application.student.phone}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/students/${application.student.id}`)
                      }>
                      View Student Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Documents</CardTitle>
                <CardDescription>
                  Review and manage submitted documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.documents.map((doc) => {
                    const DocStatusIcon = documentStatusConfig[doc.status].icon;
                    return (
                      <div
                        key={doc.id}
                        className="p-4 border rounded-md flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2 rounded-md ${
                              documentStatusConfig[doc.status].color
                            }`}>
                            <DocStatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Type: {doc.type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded on{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                            {doc.rejectionReason && (
                              <p className="text-sm text-red-600 mt-1">
                                {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex w-72 gap-2 flex-wrap flex-row justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDocument(doc)}>
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          {(doc.status === "rejected" ||
                            doc.status === "reupload_required") && (
                            <Button
                              size="sm"
                              className="bg-blue-500 text-white hover:bg-blue-600"
                              onClick={() =>
                                handleNotifyStudent(doc.id, doc.name)
                              }
                              disabled={notificationSent[doc.id]}>
                              {notificationSent[doc.id]
                                ? "Notification Sent"
                                : "Notify Student"}
                            </Button>
                          )}
                          {doc.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setDocumentAction("approve");
                                }}>
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setDocumentAction("reject");
                                }}>
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
                <CardDescription>Track application progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-muted pl-6 py-2 ml-4">
                  {application.timeline.map((event, index) => (
                    <div key={index} className="mb-8 relative">
                      <div className="absolute -left-[29px] rounded-full bg-primary w-4 h-4"></div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()} at{" "}
                          {new Date(event.date).toLocaleTimeString()}
                        </p>
                        <h4 className="font-medium mt-1">{event.status}</h4>
                        <p className="text-sm">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Track payments and billing for this application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden">
                  <div className="space-y-4">
                    {application.payments.map((payment) => {
                      const PaymentStatusIcon =
                        paymentStatusConfig[payment.status].icon;
                      return (
                        <div
                          key={payment.id}
                          className="p-4 border rounded-md flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-md ${
                                paymentStatusConfig[payment.status].color
                              }`}>
                              <PaymentStatusIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium">{payment.type}</h4>
                              <p className="text-sm text-muted-foreground">
                                Amount: {payment.currency} {payment.amount}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Date:{" "}
                                {new Date(payment.date).toLocaleDateString()}
                              </p>
                              {payment.dueDate &&
                                payment.status === "pending" && (
                                  <p className="text-xs text-red-600">
                                    Due:{" "}
                                    {new Date(
                                      payment.dueDate
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              {payment.paymentMethod && (
                                <p className="text-xs text-muted-foreground">
                                  Method: {payment.paymentMethod}
                                </p>
                              )}
                              {payment.transactionId && (
                                <p className="text-xs text-muted-foreground">
                                  Transaction ID: {payment.transactionId}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              className={
                                paymentStatusConfig[payment.status].color
                              }>
                              {payment.status.charAt(0).toUpperCase() +
                                payment.status.slice(1)}
                            </Badge>
                            {payment.status === "completed" && (
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {application.payments.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        No payments found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Payment information will appear here once available.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Notes</CardTitle>
                <CardDescription>
                  Internal notes about this application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Textarea
                      placeholder="Add a new note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="mb-2"
                    />
                    <Button onClick={handleAddNote}>Add Note</Button>
                  </div>

                  <div className="space-y-4">
                    {application.notes.map((note, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">{note.author}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(note.date).toLocaleDateString()} at{" "}
                            {new Date(note.date).toLocaleTimeString()}
                          </p>
                        </div>
                        <p>{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Document View Dialog */}
      {selectedDocument && !documentAction && (
        <Dialog
          open={!!selectedDocument}
          onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedDocument.name}</DialogTitle>
              <DialogDescription>
                Uploaded on{" "}
                {new Date(selectedDocument.uploadDate).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-[400px] bg-muted rounded-md flex items-center justify-center">
              <FileText className="w-16 h-16 text-muted-foreground" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Reject Dialog */}
      {selectedDocument && documentAction === "reject" && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setSelectedDocument(null);
            setDocumentAction(null);
            setRejectionReason("");
          }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this document.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDocument(null);
                    setDocumentAction(null);
                    setRejectionReason("");
                  }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDocumentAction("reject", rejectionReason)
                  }
                  disabled={!rejectionReason.trim()}>
                  Reject Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Approve Dialog */}
      {selectedDocument && documentAction === "approve" && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setSelectedDocument(null);
            setDocumentAction(null);
          }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this document?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDocument(null);
                  setDocumentAction(null);
                }}>
                Cancel
              </Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleDocumentAction("approve")}>
                Approve Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ApplicationDetails;
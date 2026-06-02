import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ApplicationStatus =
  | "submitted"
  | "document_required"
  | "accepted"
  | "rejected"
  | "in_review";

interface Application {
  id: string;
  university: string;
  course: string;
  status: ApplicationStatus;
  adminName: string;
  adminEmail: string;
  progress: number;
}

const getStatusVariant = (
  status: ApplicationStatus
): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case "submitted":
      return "default";
    case "document_required":
      return "outline";
    case "accepted":
      return "secondary";
    case "rejected":
      return "destructive";
    case "in_review":
      return "default";
    default:
      return "default";
  }
};

const formatStatus = (status: ApplicationStatus) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  status: "active" | "pending" | "completed" | "inactive";
  country: string;
  intakeYear: string;
  preferredCountries: string[];
  applications: Application[];
  profileCompletion: number;
  lastActive: string;
  assignedCounselor?: string;
  dateOfBirth: string;
  passportNumber: string;
  address: string;
  emergencyContact: string;
  education: {
    degree: string;
    institution: string;
    gpa: string;
    graduationYear: string;
  }[];
  experience: {
    company: string;
    position: string;
    duration: string;
    description: string;
  }[];
  testScores: {
    ielts?: string;
    toefl?: string;
    gre?: string;
    gmat?: string;
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
}

const mockStudent: Student = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phone: "+1 234-567-8900",
  status: "active",
  country: "USA",
  intakeYear: "2024",
  preferredCountries: ["Germany", "Netherlands"],
  applications: [
    {
      id: "app1",
      university: "Technical University of Munich",
      course: "Master in Computer Science",
      status: "submitted",
      adminName: "Dr. Sarah Wilson",
      adminEmail: "sarah.wilson@UNI360°.com",
      progress: 65,
    },
    {
      id: "app2",
      university: "TU Berlin",
      course: "Master in Data Science",
      status: "document_required",
      adminName: "Prof. James Smith",
      adminEmail: "james.smith@UNI360°.com",
      progress: 40,
    },
    {
      id: "app3",
      university: "University of Amsterdam",
      course: "Master in Artificial Intelligence",
      status: "accepted",
      adminName: "Dr. Maria Garcia",
      adminEmail: "maria.garcia@UNI360°.com",
      progress: 95,
    },
  ],
  profileCompletion: 85,
  lastActive: "2024-01-22T10:30:00Z",
  assignedCounselor: "Dr. Smith",
  dateOfBirth: "1998-05-15",
  passportNumber: "US123456789",
  address: "123 Main St, New York, NY 10001",
  emergencyContact: "+1 234-567-8901",
  education: [
    {
      degree: "Bachelor of Computer Science",
      institution: "New York University",
      gpa: "3.8/4.0",
      graduationYear: "2022",
    },
  ],
  experience: [
    {
      company: "Tech Corp",
      position: "Software Developer",
      duration: "2022-2024",
      description: "Developed web applications using React and Node.js",
    },
  ],
  testScores: {
    ielts: "7.5",
    gre: "320",
    toefl: "110",
  },
  documents: [
    {
      id: "1",
      name: "Bachelor Transcript",
      type: "Academic",
      status: "approved",
      uploadDate: "2024-01-15",
      url: "#",
    },
    {
      id: "2",
      name: "Statement of Purpose",
      type: "Application",
      status: "pending",
      uploadDate: "2024-01-20",
      url: "#",
    },
    {
      id: "3",
      name: "Passport Copy",
      type: "Identity",
      status: "rejected",
      uploadDate: "2024-01-18",
      url: "#",
      rejectionReason:
        "Image quality is too low. Please upload a clearer scan.",
    },
    {
      id: "4",
      name: "IELTS Certificate",
      type: "Test Score",
      status: "reupload_required",
      uploadDate: "2024-01-12",
      url: "#",
      rejectionReason:
        "Certificate has expired. Please upload updated certificate.",
    },
  ],
};

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  completed: { color: "bg-blue-100 text-blue-800", label: "Completed" },
  inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
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

export const StudentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<
    Student["documents"][0] | null
  >(null);
  const [documentAction, setDocumentAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notificationSent, setNotificationSent] = useState<
    Record<string, boolean>
  >({});

  // Get the source parameter to determine where to navigate back to
  const source = searchParams.get('source');
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Mock API call - replace with actual API
    setStudent(mockStudent);
  }, [id]);

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
    if (student) {
      const updatedDocuments = student.documents.map((doc) =>
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
      setStudent({ ...student, documents: updatedDocuments });
    }

    setSelectedDocument(null);
    setDocumentAction(null);
    setRejectionReason("");
  };

  const handleNotifyStudent = (documentId: string, documentName: string) => {
    // In a real application, you'd call an API endpoint here to send the notification

    // Mark this document as having been notified
    setNotificationSent((prev) => ({
      ...prev,
      [documentId]: true,
    }));

    // Show confirmation to the admin
    toast({
      title: "Notification Sent",
      description: `Student has been notified about ${documentName}`,
      variant: "success",
    });
  };

  // Enhanced back navigation based on source parameter
  const handleBackNavigation = () => {
    if (source === 'documents') {
      navigate('/documents');
    } else {
      // Default behavior - go to students section
      navigate('/students');
    }
  };

  // Dynamic back button text based on source
  const getBackButtonText = () => {
    if (source === 'documents') {
      return 'Back to Documents';
    } else {
      return 'Back to Students';
    }
  };

  // Function to get page title based on mode and source
  const getPageContext = () => {
    if (mode === 'edit') {
      return 'Edit Student';
    } else if (source === 'documents') {
      return 'Student Details (from Documents)';
    } else {
      return 'Student Details';
    }
  };

  if (!student) {
    return <div className="p-6">Loading...</div>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Dynamic Back Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center flex-wrap flex-row justify-start gap-4">
        <Button variant="ghost" onClick={handleBackNavigation}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {getBackButtonText()}
        </Button>
        <div className="flex items-center gap-3 w-full">
          <Avatar className="h-12 w-12">
            <AvatarImage src={student.profileImage} />
            <AvatarFallback className="uni-gradient-primary text-white">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold uni-text-primary">
              {student.name}
            </h1>
            <p className="text-muted-foreground">Student ID: {student.id}</p>
            {source && (
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                Viewing from {source === 'documents' ? 'Documents' : 'Students'} section
              </p>
            )}
          </div>
          <Badge className={statusConfig[student.status].color}>
            {statusConfig[student.status].label}
          </Badge>
        </div>
      </motion.div>

      {/* Student Details Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <Tabs defaultValue={source === 'documents' ? 'documents' : 'profile'} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="academics">Academics & Experience</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            {source === 'documents' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800 font-medium">
                    Viewing documents from Document Management section
                  </p>
                </div>
              </div>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  Review and manage student documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.documents.map((doc) => {
                    const StatusIcon = documentStatusConfig[doc.status].icon;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 uni-text-accent" />
                          <div>
                            <h4 className="font-medium">{doc.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {doc.type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded:{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                            {doc.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1">
                                {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={documentStatusConfig[doc.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {doc.status.replace("_", " ")}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDocument(doc)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
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
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleDocumentAction("approve")}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setDocumentAction("reject");
                                }}>
                                <X className="w-4 h-4" />
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

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Student's university applications and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>University</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.applications?.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>{application.university}</TableCell>
                          <TableCell>{application.course}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(application.status)}>
                              {formatStatus(application.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Progress
                              value={application.progress}
                              className="w-[60px]"
                            />
                          </TableCell>
                          <TableCell>{application.adminName}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/applications/${application.id}`)
                              }>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(!student.applications ||
                    student.applications.length === 0) && (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 uni-text-accent mx-auto mb-4" />
                      <h3 className="text-lg font-medium">
                        No Applications Yet
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        This student hasn't submitted any applications
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Pending Documents Alert Section */}
            {student.documents.some(
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
                    {student.documents
                      .filter(
                        (doc) =>
                          doc.status === "rejected" ||
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

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4 uni-text-accent" />
                      <p>{student.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 uni-text-accent" />
                      <p>{student.phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Country
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 uni-text-accent" />
                      <p>{student.country}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 uni-text-accent" />
                      <p>{student.dateOfBirth}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Passport Number
                    </label>
                    <p className="mt-1">{student.passportNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p className="mt-1">{student.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Emergency Contact
                    </label>
                    <p className="mt-1">{student.emergencyContact}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Assigned Counselor
                    </label>
                    <p className="mt-1">{student.assignedCounselor}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Intake Year
                    </label>
                    <p className="mt-1">{student.intakeYear}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Preferred Countries
                    </label>
                    <div className="mt-2 flex gap-2">
                      {student.preferredCountries.map((country) => (
                        <Badge key={country} variant="outline">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academics" className="space-y-6">
            {/* Academic Background Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 uni-text-accent" />
                    Education History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.education.map((edu, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <h4 className="font-semibold text-lg uni-text-primary">{edu.degree}</h4>
                      <p className="text-muted-foreground font-medium">{edu.institution}</p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          GPA: {edu.gpa}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Graduated: {edu.graduationYear}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 uni-text-accent" />
                    Test Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(student.testScores).map(([test, score]) => (
                      <div
                        key={test}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
                        <h4 className="font-semibold uppercase text-gray-700">{test}</h4>
                        <p className="text-3xl font-bold uni-text-accent mt-2">
                          {score}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Experience Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 uni-text-accent" />
                  Professional Experience
                </CardTitle>
                <CardDescription>
                  Work history and professional background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.experience.map((exp, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg uni-text-primary">{exp.position}</h4>
                          <p className="text-muted-foreground font-medium">{exp.company}</p>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {exp.duration}
                        </Badge>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Document View/Action Modal */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => {
          setSelectedDocument(null);
          setDocumentAction(null);
          setRejectionReason("");
        }}>
        <DialogContent className="max-w-2xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.name}</DialogTitle>
                <DialogDescription>
                  {selectedDocument.type} • Uploaded{" "}
                  {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Document preview placeholder */}
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Document preview would appear here
                  </p>
                </div>

                {documentAction === "reject" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Rejection Reason
                    </label>
                    <Textarea
                      placeholder="Please provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDocument(null);
                      setDocumentAction(null);
                      setRejectionReason("");
                    }}>
                    Close
                  </Button>

                  {selectedDocument.status === "pending" && (
                    <>
                      {documentAction === "reject" ? (
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() =>
                            handleDocumentAction("reject", rejectionReason)
                          }
                          disabled={!rejectionReason.trim()}>
                          Reject Document
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDocumentAction("reject")}>
                            Reject
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleDocumentAction("approve")}>
                            Approve
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
import React, { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  UserPlus,
  GraduationCap,
  FileText,
  Target,
  Building,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Check,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";


interface ProfileFormData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  academics: {
    educationLevel: string;
    fieldOfStudy: string;
    institution: string;
    graduationYear: string;
    gpa: string;
    gradingSystem: string;
  };
  testScores: {
    ieltsOverall: string;
    ieltsListening: string;
    ieltsReading: string;
    ieltsWriting: string;
    ieltsSpeaking: string;
    toeflTotal: string;
    greTotal: string;
    gmatTotal: string;
  };
  experience: {
    workExperience: string;
    internships: string;
    projects: string;
    certifications: string;
  };
  preferences: {
    targetCountries: string[];
    preferredPrograms: string[];
    studyLevel: string;
    intakePreference: string;
  };
  university: {
    universityId: string;
    universityName: string;
    course: string;
    degreeLevel: string;
    startDate: string;
  };
  applicationDetails: {
    adminName: string;
    adminEmail: string;
    notes: string;
    priority: string;
  };
}

interface StudentDropdown {
  id: number;
  name: string;
  email: string;
  userType: string;
  status: string;
}

interface University {
  id: string;
  name: string;
  country: string;
}

interface Course {
  id?: string;
  name: string;
}



const NewApplication: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Main flow state
  const [step, setStep] = useState<
    "select-type" | "existing-student" | "profile-builder"
  >("select-type");
  const [studentType, setStudentType] = useState<"existing" | "new" | "">("");

  // Existing student flow
  const [students, setStudents] = useState<StudentDropdown[]>([]);
const [selectedStudent, setSelectedStudent] = useState<StudentDropdown | null>(null);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [universities, setUniversities] = useState<University[]>([]);
const [courses, setCourses] = useState<Course[]>([]);
const [loadingUniversities, setLoadingUniversities] = useState(false);
const [loadingCourses, setLoadingCourses] = useState(false);


  // Profile builder flow state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [formData, setFormData] = useState<ProfileFormData>({
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      nationality: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
    },
    academics: {
      educationLevel: "",
      fieldOfStudy: "",
      institution: "",
      graduationYear: "",
      gpa: "",
      gradingSystem: "",
    },
    testScores: {
      ieltsOverall: "",
      ieltsListening: "",
      ieltsReading: "",
      ieltsWriting: "",
      ieltsSpeaking: "",
      toeflTotal: "",
      greTotal: "",
      gmatTotal: "",
    },
    experience: {
      workExperience: "",
      internships: "",
      projects: "",
      certifications: "",
    },
    preferences: {
      targetCountries: [],
      preferredPrograms: [],
      studyLevel: "",
      intakePreference: "",
    },
    university: {
      universityId: "",
      universityName: "",
      course: "",
      degreeLevel: "",
      startDate: "",
    },
    applicationDetails: {
      adminName: "",
      adminEmail: "",
      notes: "",
      priority: "",
    },
  });

  const profileBuilderSteps = [
    { id: 1, title: "Personal Information", icon: User },
    { id: 2, title: "Academic Background", icon: GraduationCap },
    { id: 3, title: "Test Scores", icon: FileText },
    { id: 4, title: "Experience", icon: Target },
    { id: 5, title: "Study Preferences", icon: Globe },
    { id: 6, title: "University Selection", icon: Building },
    { id: 7, title: "Application Details", icon: Mail },
    { id: 8, title: "Review & Submit", icon: Check },
  ];

  const handleStudentTypeSelect = (type: "existing" | "new") => {
    setStudentType(type);
    if (type === "existing") {
      setStep("existing-student");
    } else {
      setStep("profile-builder");
    }
  };

  const handleExistingStudentSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedStudent) newErrors.student = "Please select a student";
    if (!selectedUniversity)
      newErrors.university = "Please select a university";
    if (!selectedCourse) newErrors.course = "Please select a course";
    if (!adminName) newErrors.adminName = "Admin name is required";
    if (!adminEmail) newErrors.adminEmail = "Admin email is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Submit application
        toast({
          title: "Application Created Successfully",
          description: `Application for ${selectedStudent?.name} has been created.`,
        });
        navigate("/applications");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create application. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Profile builder helper functions
  const handleInputChange = (
    section: keyof ProfileFormData,
    field: string,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  useEffect(() => {
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("uni_access_token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/notifications/students/dropdown`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Client-ID": "uniflow",
          },
        }
      );

      const json = await res.json();

      if (json.success) {
        setStudents(json.data.students);
      }
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  fetchStudents();
}, []);

useEffect(() => {
  const fetchUniversities = async () => {
    try {
      setLoadingUniversities(true);
      const token = localStorage.getItem("uni_access_token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/universities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Client-ID": "uniflow",
          },
        }
      );

      const json = await res.json();

      if (json.success) {
        setUniversities(json.data.data || json.data);
      }
    } catch (err) {
      console.error("Failed to fetch universities", err);
    } finally {
      setLoadingUniversities(false);
    }
  };

  fetchUniversities();
}, []);

const getCoursesByUniversityId = (universityId: string) => {
  const university = universities.find((u) => u.id === universityId);
  return university?.courses || [];
};


  const validateCurrentStep = () => {
    const newErrors: { [key: string]: string } = {};

    switch (currentStep) {
      case 1: // Personal Info
        if (!formData.personal.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        if (!formData.personal.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        if (!formData.personal.email.trim()) {
          newErrors.email = "Email is required";
        }
        break;

      case 2: // Academic Background
        if (!formData.academics.educationLevel) {
          newErrors.educationLevel = "Education level is required";
        }
        if (!formData.academics.institution.trim()) {
          newErrors.institution = "Institution name is required";
        }
        if (!formData.academics.fieldOfStudy.trim()) {
          newErrors.fieldOfStudy = "Field of study is required";
        }
        break;

      case 6: // University Selection
        if (!formData.university.universityId) {
          newErrors.university = "Please select a university";
        }
        if (!formData.university.course) {
          newErrors.course = "Please select a course";
        }
        break;

      case 7: // Application Details
        if (!formData.applicationDetails.adminName.trim()) {
          newErrors.adminName = "Admin name is required";
        }
        if (!formData.applicationDetails.adminEmail.trim()) {
          newErrors.adminEmail = "Admin email is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const calculateProgress = () => {
    return (completedSteps.length / profileBuilderSteps.length) * 100;
  };

  const handleProfileBuilderSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      // Submit the complete profile
      toast({
        title: "Application Created Successfully",
        description:
          "New student application has been created with complete profile.",
      });
      navigate("/applications");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create application. Please try again.",
        variant: "destructive",
      });
    }
  };

  

  

  const renderError = (field: string) => {
    return errors[field] ? (
      <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
    ) : null;
  };

  // Student Type Selection
  if (step === "select-type") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate("/applications")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
            <div>
              <h1 className="text-3xl font-bold">New Application</h1>
              <p className="text-muted-foreground">
                Choose how you want to create the application
              </p>
            </div>
          </div>

          {/* Student Type Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Existing Student Card */}
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardContent
                className="p-8 text-center"
                onClick={() => handleStudentTypeSelect("existing")}>
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Existing Student</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Quick application creation for students who already have
                  profiles in the system. Select student, choose university, and
                  submit.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Process:
                  </p>
                  <p className="text-xs text-blue-600">
                    Select Student → Choose University & Course → Add Admin
                    Details → Submit
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800">
                  Fast Track - 2 Minutes
                </Badge>
              </CardContent>
            </Card>

            {/* New Student Card */}
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardContent
                className="p-8 text-center"
                onClick={() => handleStudentTypeSelect("new")}>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">New Student</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Complete profile creation for new students. Collect personal
                  details, academic background, test scores, and preferences.
                </p>
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Process:
                  </p>
                  <p className="text-xs text-green-600">
                    Personal Info → Academics → Test Scores → Experience →
                    Preferences → University → Submit
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800">
                  Complete Profile - 10 Minutes
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Existing Student Flow
  if (step === "existing-student") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => setStep("select-type")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Selection
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                Create Application - Existing Student
              </h1>
              <p className="text-muted-foreground">
                Select student and university details
              </p>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student Selection */}
              {/* Student Selection */}
<div>
  <label className="block text-sm font-medium mb-2">
    Student *
  </label>
  <Select
    value={selectedStudent?.id?.toString() || ""}
    onValueChange={(value) => {
      const student = students.find((s) => s.id.toString() === value);
      setSelectedStudent(student || null);
    }}
  >
    <SelectTrigger className={errors.student ? "border-red-500" : ""}>
      <SelectValue placeholder="Select a student" />
    </SelectTrigger>
    <SelectContent>
      {students.map((student) => (
        <SelectItem key={student.id} value={student.id.toString()}>
          {student.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {renderError("student")}
</div>

{/* Student Email - Read Only */}
{selectedStudent && (
  <div>
    <label className="block text-sm font-medium mb-2">
      Student Email
    </label>
    <Input
      value={selectedStudent.email}
      readOnly
      disabled
      className="bg-muted"
    />
  </div>
)}

              {/* University Selection */}
              {/* University Selection */}
<div>
  <label className="block text-sm font-medium mb-2">
    University *
  </label>
  <Select
    value={selectedUniversity}
    onValueChange={(value) => {
      setSelectedUniversity(value);
      setSelectedCourse("");
      const university = universities.find((u) => u.id === value);
      setCourses(university?.courses || []);
    }}
  >
    <SelectTrigger
      className={errors.university ? "border-red-500" : ""}>
      <SelectValue placeholder="Select university" />
    </SelectTrigger>
    <SelectContent>
      {universities.map((university) => (
        <SelectItem key={university.id} value={university.id}>
          {university.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {renderError("university")}
</div>

{/* University Country - Read Only */}
{selectedUniversity && (
  <div>
    <label className="block text-sm font-medium mb-2">
      Country
    </label>
    <Input
      value={universities.find((u) => u.id === selectedUniversity)?.country || ""}
      readOnly
      disabled
      className="bg-muted"
    />
  </div>
)}

              {/* Course Selection */}
              {selectedUniversity && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Course *
                  </label>
                  <Select
                    value={selectedCourse}
                    onValueChange={setSelectedCourse}>
                    <SelectTrigger
                      className={errors.course ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
  {courses.map((course: any) => (
    <SelectItem key={course.id} value={course.id}>
      {course.name}
    </SelectItem>
  ))}
</SelectContent>
                  </Select>
                  {renderError("course")}
                </div>
              )}

              {/* Admin Details */}
              
              {/* Notes */}
              

              {/* Selected Student Preview */}
              {selectedStudent && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Selected Student Preview
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
  <strong>Name:</strong> {selectedStudent.name}
</div>
<div>
  <strong>Email:</strong> {selectedStudent.email}
</div>
<div>
  <strong>Status:</strong> {selectedStudent.status}
</div>
<div>
  <strong>User Type:</strong> {selectedStudent.userType}
</div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleExistingStudentSubmit} className="px-8">
                  Create Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Profile Builder Flow - Complete Implementation
  if (step === "profile-builder") {
    const renderStepContent = () => {
      switch (currentStep) {
        case 1: // Personal Information
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name *
                  </label>
                  <Input
                    value={formData.personal.firstName}
                    onChange={(e) =>
                      handleInputChange("personal", "firstName", e.target.value)
                    }
                    placeholder="John"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name *
                  </label>
                  <Input
                    value={formData.personal.lastName}
                    onChange={(e) =>
                      handleInputChange("personal", "lastName", e.target.value)
                    }
                    placeholder="Smith"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.personal.email}
                    onChange={(e) =>
                      handleInputChange("personal", "email", e.target.value)
                    }
                    placeholder="john.smith@email.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <Input
                    value={formData.personal.phone}
                    onChange={(e) =>
                      handleInputChange("personal", "phone", e.target.value)
                    }
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.personal.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange(
                        "personal",
                        "dateOfBirth",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nationality
                  </label>
                  <Select
                    value={formData.personal.nationality}
                    onValueChange={(value) =>
                      handleInputChange("personal", "nationality", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="american">American</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="british">British</SelectItem>
                      <SelectItem value="canadian">Canadian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Address
                </label>
                <Input
                  value={formData.personal.address}
                  onChange={(e) =>
                    handleInputChange("personal", "address", e.target.value)
                  }
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    value={formData.personal.city}
                    onChange={(e) =>
                      handleInputChange("personal", "city", e.target.value)
                    }
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Postal Code
                  </label>
                  <Input
                    value={formData.personal.postalCode}
                    onChange={(e) =>
                      handleInputChange(
                        "personal",
                        "postalCode",
                        e.target.value
                      )
                    }
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Country
                  </label>
                  <Select
                    value={formData.personal.country}
                    onValueChange={(value) =>
                      handleInputChange("personal", "country", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="in">India</SelectItem>
                      <SelectItem value="cn">China</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          );

        case 2: // Academic Background
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Education Level *
                  </label>
                  <Select
                    value={formData.academics.educationLevel}
                    onValueChange={(value) =>
                      handleInputChange("academics", "educationLevel", value)
                    }>
                    <SelectTrigger
                      className={errors.educationLevel ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="bachelor">
                        Bachelor's Degree
                      </SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.educationLevel && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.educationLevel}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Field of Study *
                  </label>
                  <Input
                    value={formData.academics.fieldOfStudy}
                    onChange={(e) =>
                      handleInputChange(
                        "academics",
                        "fieldOfStudy",
                        e.target.value
                      )
                    }
                    placeholder="Computer Science"
                    className={errors.fieldOfStudy ? "border-red-500" : ""}
                  />
                  {errors.fieldOfStudy && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fieldOfStudy}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution *
                </label>
                <Input
                  value={formData.academics.institution}
                  onChange={(e) =>
                    handleInputChange(
                      "academics",
                      "institution",
                      e.target.value
                    )
                  }
                  placeholder="University of California, Berkeley"
                  className={errors.institution ? "border-red-500" : ""}
                />
                {errors.institution && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.institution}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Graduation Year
                  </label>
                  <Select
                    value={formData.academics.graduationYear}
                    onValueChange={(value) =>
                      handleInputChange("academics", "graduationYear", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => 2024 - i).map(
                        (year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GPA</label>
                  <Input
                    value={formData.academics.gpa}
                    onChange={(e) =>
                      handleInputChange("academics", "gpa", e.target.value)
                    }
                    placeholder="3.8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Grading System
                  </label>
                  <Select
                    value={formData.academics.gradingSystem}
                    onValueChange={(value) =>
                      handleInputChange("academics", "gradingSystem", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.0">4.0 Scale</SelectItem>
                      <SelectItem value="10.0">10.0 Scale</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          );

        case 3: // Test Scores
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <p className="text-muted-foreground mb-4">
                Add your test scores (all optional but recommended for
                international applications)
              </p>

              <div className="space-y-4">
                <h4 className="font-medium">IELTS Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Overall
                    </label>
                    <Input
                      value={formData.testScores.ieltsOverall}
                      onChange={(e) =>
                        handleInputChange(
                          "testScores",
                          "ieltsOverall",
                          e.target.value
                        )
                      }
                      placeholder="7.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Listening
                    </label>
                    <Input
                      value={formData.testScores.ieltsListening}
                      onChange={(e) =>
                        handleInputChange(
                          "testScores",
                          "ieltsListening",
                          e.target.value
                        )
                      }
                      placeholder="8.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reading
                    </label>
                    <Input
                      value={formData.testScores.ieltsReading}
                      onChange={(e) =>
                        handleInputChange(
                          "testScores",
                          "ieltsReading",
                          e.target.value
                        )
                      }
                      placeholder="7.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Writing
                    </label>
                    <Input
                      value={formData.testScores.ieltsWriting}
                      onChange={(e) =>
                        handleInputChange(
                          "testScores",
                          "ieltsWriting",
                          e.target.value
                        )
                      }
                      placeholder="7.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Speaking
                    </label>
                    <Input
                      value={formData.testScores.ieltsSpeaking}
                      onChange={(e) =>
                        handleInputChange(
                          "testScores",
                          "ieltsSpeaking",
                          e.target.value
                        )
                      }
                      placeholder="8.5"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    TOEFL Total
                  </label>
                  <Input
                    value={formData.testScores.toeflTotal}
                    onChange={(e) =>
                      handleInputChange(
                        "testScores",
                        "toeflTotal",
                        e.target.value
                      )
                    }
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GRE Total
                  </label>
                  <Input
                    value={formData.testScores.greTotal}
                    onChange={(e) =>
                      handleInputChange(
                        "testScores",
                        "greTotal",
                        e.target.value
                      )
                    }
                    placeholder="320"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GMAT Total
                  </label>
                  <Input
                    value={formData.testScores.gmatTotal}
                    onChange={(e) =>
                      handleInputChange(
                        "testScores",
                        "gmatTotal",
                        e.target.value
                      )
                    }
                    placeholder="700"
                  />
                </div>
              </div>
            </motion.div>
          );

        case 4: // Experience
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <p className="text-muted-foreground mb-4">
                Share your experience and achievements (all optional)
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Work Experience
                </label>
                <Textarea
                  rows={4}
                  value={formData.experience.workExperience}
                  onChange={(e) =>
                    handleInputChange(
                      "experience",
                      "workExperience",
                      e.target.value
                    )
                  }
                  placeholder="Describe your work experience, roles, and key achievements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Internships
                </label>
                <Textarea
                  rows={4}
                  value={formData.experience.internships}
                  onChange={(e) =>
                    handleInputChange(
                      "experience",
                      "internships",
                      e.target.value
                    )
                  }
                  placeholder="List your internships and key learning experiences..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Projects
                </label>
                <Textarea
                  rows={4}
                  value={formData.experience.projects}
                  onChange={(e) =>
                    handleInputChange("experience", "projects", e.target.value)
                  }
                  placeholder="Describe significant projects you've worked on..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Certifications
                </label>
                <Textarea
                  rows={3}
                  value={formData.experience.certifications}
                  onChange={(e) =>
                    handleInputChange(
                      "experience",
                      "certifications",
                      e.target.value
                    )
                  }
                  placeholder="List any relevant certifications or courses..."
                />
              </div>
            </motion.div>
          );

        case 5: // Study Preferences
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Study Level
                </label>
                <Select
                  value={formData.preferences.studyLevel}
                  onValueChange={(value) =>
                    handleInputChange("preferences", "studyLevel", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select study level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">Bachelor's</SelectItem>
                    <SelectItem value="master">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Intake Preference
                </label>
                <Select
                  value={formData.preferences.intakePreference}
                  onValueChange={(value) =>
                    handleInputChange("preferences", "intakePreference", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intake preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fall-2024">Fall 2024</SelectItem>
                    <SelectItem value="spring-2025">Spring 2025</SelectItem>
                    <SelectItem value="fall-2025">Fall 2025</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">
                  Target Countries
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Germany",
                    "United States",
                    "United Kingdom",
                    "Canada",
                    "Australia",
                    "Switzerland",
                  ].map((country) => (
                    <div key={country} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={country}
                        checked={formData.preferences.targetCountries.includes(
                          country
                        )}
                        onChange={(e) => {
                          const current = formData.preferences.targetCountries;
                          const updated = e.target.checked
                            ? [...current, country]
                            : current.filter((c) => c !== country);
                          handleInputChange(
                            "preferences",
                            "targetCountries",
                            updated
                          );
                        }}
                        className="rounded"
                      />
                      <label htmlFor={country} className="text-sm">
                        {country}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">
                  Preferred Programs
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Computer Science",
                    "Data Science",
                    "Engineering",
                    "Business Administration",
                    "Medicine",
                    "Law",
                    "Psychology",
                    "Physics",
                    "Mathematics",
                    "Arts",
                  ].map((program) => (
                    <div key={program} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={program}
                        checked={formData.preferences.preferredPrograms.includes(
                          program
                        )}
                        onChange={(e) => {
                          const current =
                            formData.preferences.preferredPrograms;
                          const updated = e.target.checked
                            ? [...current, program]
                            : current.filter((p) => p !== program);
                          handleInputChange(
                            "preferences",
                            "preferredPrograms",
                            updated
                          );
                        }}
                        className="rounded"
                      />
                      <label htmlFor={program} className="text-sm">
                        {program}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );

        case 6: // University Selection
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div>
                <label className="block text-sm font-medium mb-2">
                  University *
                </label>
                <Select
                  value={formData.university.universityId}
                  onValueChange={(value) => {
  const uni = universities.find((u) => u.id === value);

  handleInputChange("university", "universityId", value);
  handleInputChange("university", "universityName", uni?.name || "");
  handleInputChange("university", "course", "");
}}
>
                  <SelectTrigger
                    className={errors.university ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{university.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {university.country}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.university && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.university}
                  </p>
                )}
              </div>

              {formData.university.universityId && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Course *
                  </label>
                  <Select
                    value={formData.university.course}
                    onValueChange={(value) =>
                      handleInputChange("university", "course", value)
                    }>
                    <SelectTrigger
                      className={errors.course ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCoursesByUniversityId(
  formData.university.universityId
).map((course: any) => (
  <SelectItem key={course.id} value={course.id}>
    {course.name}
  </SelectItem>
))}
                    </SelectContent>
                  </Select>
                  {errors.course && (
                    <p className="text-red-500 text-sm mt-1">{errors.course}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Degree Level
                  </label>
                  <Select
                    value={formData.university.degreeLevel}
                    onValueChange={(value) =>
                      handleInputChange("university", "degreeLevel", value)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">Bachelor's</SelectItem>
                      <SelectItem value="master">Master's</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preferred Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.university.startDate}
                    onChange={(e) =>
                      handleInputChange(
                        "university",
                        "startDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </motion.div>
          );

        case 7: // Application Details
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Admin Name *
                  </label>
                  <Input
                    value={formData.applicationDetails.adminName}
                    onChange={(e) =>
                      handleInputChange(
                        "applicationDetails",
                        "adminName",
                        e.target.value
                      )
                    }
                    placeholder="John Smith"
                    className={errors.adminName ? "border-red-500" : ""}
                  />
                  {errors.adminName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.adminName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Admin Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.applicationDetails.adminEmail}
                    onChange={(e) =>
                      handleInputChange(
                        "applicationDetails",
                        "adminEmail",
                        e.target.value
                      )
                    }
                    placeholder="admin@UNI360°.com"
                    className={errors.adminEmail ? "border-red-500" : ""}
                  />
                  {errors.adminEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.adminEmail}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority Level
                </label>
                <Select
                  value={formData.applicationDetails.priority}
                  onValueChange={(value) =>
                    handleInputChange("applicationDetails", "priority", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  rows={4}
                  value={formData.applicationDetails.notes}
                  onChange={(e) =>
                    handleInputChange(
                      "applicationDetails",
                      "notes",
                      e.target.value
                    )
                  }
                  placeholder="Additional notes or special requirements..."
                />
              </div>
            </motion.div>
          );

        case 8: // Review & Submit
          return (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  Review Your Application
                </h3>
                <p className="text-muted-foreground">
                  Please review all the information before submitting
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Name:</strong> {formData.personal.firstName}{" "}
                      {formData.personal.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {formData.personal.email}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {formData.personal.phone || "Not provided"}
                    </p>
                    <p>
                      <strong>Nationality:</strong>{" "}
                      {formData.personal.nationality || "Not provided"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Academic Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Education:</strong>{" "}
                      {formData.academics.educationLevel}
                    </p>
                    <p>
                      <strong>Institution:</strong>{" "}
                      {formData.academics.institution}
                    </p>
                    <p>
                      <strong>Field:</strong> {formData.academics.fieldOfStudy}
                    </p>
                    <p>
                      <strong>GPA:</strong>{" "}
                      {formData.academics.gpa || "Not provided"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      University Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>University:</strong>{" "}
                      {formData.university.universityName}
                    </p>
                    <p>
                      <strong>Course:</strong> {formData.university.course}
                    </p>
                    <p>
                      <strong>Degree Level:</strong>{" "}
                      {formData.university.degreeLevel || "Not specified"}
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {formData.university.startDate || "Not specified"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Application Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Admin:</strong>{" "}
                      {formData.applicationDetails.adminName}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {formData.applicationDetails.adminEmail}
                    </p>
                    <p>
                      <strong>Priority:</strong>{" "}
                      {formData.applicationDetails.priority || "Not set"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {formData.preferences.targetCountries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Study Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>
                      <strong>Target Countries:</strong>{" "}
                      {formData.preferences.targetCountries.join(", ")}
                    </p>
                    {formData.preferences.preferredPrograms.length > 0 && (
                      <p>
                        <strong>Preferred Programs:</strong>{" "}
                        {formData.preferences.preferredPrograms.join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          );

        default:
          return <div>Invalid step</div>;
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => setStep("select-type")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Selection
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                Create Application - New Student
              </h1>
              <p className="text-muted-foreground">
                Complete student profile builder
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(calculateProgress())}% complete
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {/* Steps */}
          <div className="flex flex-wrap gap-2 mb-8">
            {profileBuilderSteps.map((step) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-green-100 text-green-800"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.id}</span>
                  {isCompleted && <Check className="w-3 h-3 ml-1" />}
                </div>
              );
            })}
          </div>

          {/* Form Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(
                  profileBuilderSteps[currentStep - 1].icon,
                  {
                    className: "w-5 h-5",
                  }
                )}
                {profileBuilderSteps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < profileBuilderSteps.length ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleProfileBuilderSubmit}
                className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Create Application
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NewApplication;

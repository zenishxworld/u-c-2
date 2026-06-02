import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Eye, MapPin, Calendar, Check, Mail, ArrowRight, GraduationCap, CheckCircle, X, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '../services/api';
import { getStudentProfileForAdmin } from '../services/task';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  status: 'active' | 'inactive' | 'suspended';
  userType: string;
  country?: string;
  intakeYear?: string;
  preferredCountries?: string[];
  applications?: number;
  profileCompletion?: number;
  lastActive?: string;
  assignedCounselor?: string;
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 234-567-8900',
    status: 'active',
    country: 'USA',
    intakeYear: '2024',
    preferredCountries: ['Germany', 'Netherlands'],
    applications: 3,
    profileCompletion: 85,
    lastActive: '2024-01-22T10:30:00Z',
    assignedCounselor: 'Dr. Smith'
  },
  {
    id: '2',
    name: 'Raj Patel',
    email: 'raj.patel@email.com',
    phone: '+91 98765-43210',
    status: 'pending',
    country: 'India',
    intakeYear: '2024',
    preferredCountries: ['Germany', 'UK'],
    applications: 1,
    profileCompletion: 60,
    lastActive: '2024-01-21T14:20:00Z',
    assignedCounselor: 'Prof. Wilson'
  },
  {
    id: '3',
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+34 612-345-678',
    status: 'completed',
    country: 'Spain',
    intakeYear: '2023',
    preferredCountries: ['Germany', 'Switzerland'],
    applications: 5,
    profileCompletion: 100,
    lastActive: '2024-01-20T09:00:00Z',
    assignedCounselor: 'Dr. Brown'
  }
];

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800', label: 'Active' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
  inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
  suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' }
};

// Generate intake preferences for Germany and UK till 2030
const generateIntakePreferences = () => {
  const intakes = [];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year <= 2027; year++) {
    intakes.push(`Winter ${year} (Germany)`);
    intakes.push(`Summer ${year} (Germany)`);
    intakes.push(`September ${year} (UK)`);
    intakes.push(`January ${year + 1} (UK)`);
  }

  intakes.push("Flexible");
  return intakes;
};

export const Students: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingCV, setIsProcessingCV] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  // --- Profile popup state ---
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
const [totalStudents, setTotalStudents] = useState(0);
const [activeStudents, setActiveStudents] = useState(0);
const [inactiveStudents, setInactiveStudents] = useState(0);
const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    educationLevel: '',
    fieldOfStudy: '',
    graduationYear: '',
    gpa: '',
    gradingSystem: '',
    ieltsOverall: '',
    ieltsListening: '',
    ieltsReading: '',
    ieltsWriting: '',
    ieltsSpeaking: '',
    toeflTotal: '',
    greTotal: '',
    gmatTotal: '',
    workExperience: '',
    internships: '',
    projects: '',
    certifications: '',
    targetCountries: [] as string[],
    preferredPrograms: [] as string[],
    studyLevel: '',
    intakePreference: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/notifications/students/dropdown');
      
      if (response.data.success && response.data.data?.students) {
        const apiStudents = response.data.data.students;
        const summary = response.data.data.summary;
        
        // Transform API students to component format
        const transformedStudents = apiStudents.map((student: any) => ({
          id: student.id.toString(),
          name: student.name,
          email: student.email,
          phone: 'N/A', // API doesn't provide
          status: student.status === 'ACTIVE' ? 'active' : student.status === 'SUSPENDED' ? 'suspended' : 'inactive',
          userType: student.userType,
          country: 'N/A', // API doesn't provide
          intakeYear: '2024', // Default
          preferredCountries: [],
          applications: 0, // API doesn't provide
          profileCompletion: student.status === 'ACTIVE' ? 75 : 0,
          lastActive: new Date().toISOString(),
        }));
        
        setStudents(transformedStudents);
        
        // Set summary stats from API
        setTotalStudents(summary.totalStudents);
        setActiveStudents(summary.activeStudents);
        setInactiveStudents(summary.totalStudents - summary.activeStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents(mockStudents); // Fallback
      setTotalStudents(mockStudents.length);
      setActiveStudents(mockStudents.filter(s => s.status === 'active').length);
    } finally {
      setIsLoading(false);
    }
  };

  fetchStudents();
}, []);

  const filteredStudents = students.filter(student => {
  const matchesSearch = 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase());
  
  const matchesFilter = filter === 'all' || student.status === filter;
  
  return matchesSearch && matchesFilter;
});

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Generate graduation years from 1990 to 2025
  const generateGraduationYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year.toString());
    }
    return years;
  };

  // Mock CV/Resume processing function
  const processUploadedCV = async (file: File): Promise<any> => {
    setIsProcessingCV(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data - in reality, this would use OCR/AI to extract information
    const mockExtractedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1 555-123-4567',
      educationLevel: "Master's Degree",
      fieldOfStudy: 'Computer Science',
      graduationYear: '2022',
      gpa: '3.8',
      workExperience: '2 years',
      nationality: 'United States'
    };
    
    setIsProcessingCV(false);
    return mockExtractedData;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size should be less than 5MB');
      return;
    }

    setUploadedFile(file);
    
    try {
      const extractedData = await processUploadedCV(file);
      
      // Update form data with extracted information
      setFormData(prev => ({
        ...prev,
        ...extractedData
      }));
      
      // Clear any existing errors for fields that were populated
      const newErrors = { ...errors };
      Object.keys(extractedData).forEach(key => {
        if (newErrors[key]) delete newErrors[key];
      });
      setErrors(newErrors);
      
    } catch (error) {
      console.error('Error processing CV:', error);
      alert('Error processing CV. Please fill the form manually.');
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateNumericInput = (value: string, min?: number, max?: number): boolean => {
    if (value === "") return true;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    if (min !== undefined && numValue < min) return false;
    if (max !== undefined && numValue > max) return false;
    return true;
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (formStep) {
      case 1: // Personal Info
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        if (formData.phone && !validatePhoneNumber(formData.phone)) {
          newErrors.phone = "Please enter a valid phone number";
        }
        break;

      case 2: // Academic Background
        if (!formData.educationLevel) {
          newErrors.educationLevel = "Highest qualification is required";
        }
        if (!formData.fieldOfStudy.trim()) {
          newErrors.fieldOfStudy = "Field of study is required";
        }
        if (formData.gpa && !validateNumericInput(formData.gpa, 0, 10)) {
          newErrors.gpa = "Please enter a valid GPA (0-10)";
        }
        break;

      case 3: // Test Scores
        if (formData.ieltsOverall && !validateNumericInput(formData.ieltsOverall, 0, 9)) {
          newErrors.ieltsOverall = "IELTS score must be between 0-9";
        }
        if (formData.toeflTotal && !validateNumericInput(formData.toeflTotal, 0, 100)) {
          newErrors.toeflTotal = "TOEFL score must be between 0-100";
        }
        if (formData.greTotal && !validateNumericInput(formData.greTotal, 0, 345)) {
          newErrors.greTotal = "GRE score must be between 0-345";
        }
        if (formData.gmatTotal && !validateNumericInput(formData.gmatTotal, 0, 650)) {
          newErrors.gmatTotal = "GMAT score must be between 0-650";
        }
        break;

      case 4: // Experience
        // Optional fields, no validation required
        break;

      case 5: // Preferences
        if (formData.targetCountries.length > 1) {
          newErrors.targetCountries = "Please select only one target country";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === "phone") {
      value = value.replace(/[^0-9\s\-\(\)\+]/g, "");
    } else if (
      field === "gpa" ||
      field.includes("ielts") ||
      field.includes("toefl") ||
      field.includes("gre") ||
      field.includes("gmat")
    ) {
      value = value.replace(/[^0-9\.]/g, "");
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const calculateProfileCompletion = (data: typeof formData): number => {
    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'nationality',
      'educationLevel', 'fieldOfStudy', 'graduationYear', 'gpa', 'gradingSystem',
      'ieltsOverall', 'ieltsListening', 'ieltsReading', 'ieltsWriting', 'ieltsSpeaking',
      'toeflTotal', 'greTotal', 'gmatTotal', 'workExperience', 'internships',
      'projects', 'certifications', 'studyLevel', 'intakePreference'
    ];
    const filledFields = fields.filter(field => data[field] && data[field] !== '' && (!Array.isArray(data[field]) || data[field].length > 0));
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const handleAddStudent = async () => {
    if (!validateCurrentStep()) return;

    // Prepare post data aligned with expected API body structure (full profile data + computed fields)
    const postData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      status: 'pending',
      country: formData.nationality || 'Unknown',
      intakeYear: formData.intakePreference ? formData.intakePreference.split(' ')[1]?.replace(/[()]/g, '') || 'Unknown' : 'Unknown',
      preferredCountries: formData.targetCountries.length > 0 ? formData.targetCountries : ['Unknown'],
      applications: 0,
      profileCompletion: calculateProfileCompletion(formData),
      lastActive: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/students/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      const newStudent = await response.json(); // Expect response body matching created object structure as per JSON examples

      setStudents(prev => [...prev, newStudent]);

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        educationLevel: '',
        fieldOfStudy: '',
        graduationYear: '',
        gpa: '',
        gradingSystem: '',
        ieltsOverall: '',
        ieltsListening: '',
        ieltsReading: '',
        ieltsWriting: '',
        ieltsSpeaking: '',
        toeflTotal: '',
        greTotal: '',
        gmatTotal: '',
        workExperience: '',
        internships: '',
        projects: '',
        certifications: '',
        targetCountries: [],
        preferredPrograms: [],
        studyLevel: '',
        intakePreference: '',
      });
      setUploadedFile(null);
      setFormStep(1);
      setShowAddStudentForm(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding student:', error);
      // Fallback to client-side add until API is ready
      const fallbackStudent: Student = {
        id: `${Date.now()}`,
        name: postData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'pending',
        country: postData.country,
        intakeYear: postData.intakeYear,
        preferredCountries: postData.preferredCountries,
        applications: 0,
        profileCompletion: postData.profileCompletion,
        lastActive: postData.lastActive,
        assignedCounselor: undefined,
      };
      setStudents(prev => [...prev, fallbackStudent]);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        educationLevel: '',
        fieldOfStudy: '',
        graduationYear: '',
        gpa: '',
        gradingSystem: '',
        ieltsOverall: '',
        ieltsListening: '',
        ieltsReading: '',
        ieltsWriting: '',
        ieltsSpeaking: '',
        toeflTotal: '',
        greTotal: '',
        gmatTotal: '',
        workExperience: '',
        internships: '',
        projects: '',
        certifications: '',
        targetCountries: [],
        preferredPrograms: [],
        studyLevel: '',
        intakePreference: '',
      });
      setUploadedFile(null);
      setFormStep(1);
      setShowAddStudentForm(false);
      setShowSuccessModal(true);
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && formStep < 5) {
      setFormStep(formStep + 1);
    }
  };

  const prevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const handleStudentClick = async (studentId: string) => {
    setSelectedProfileId(studentId);
    setShowProfileModal(true);
    setIsProfileLoading(true);
    setProfileData(null);
    try {
      const result = await getStudentProfileForAdmin(studentId);
      if (result.success) {
        setProfileData(result.data);
      } else {
        setProfileData({ error: result.message || 'Failed to load profile' });
      }
    } catch (err) {
      setProfileData({ error: 'Unexpected error loading profile' });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const renderError = (fieldName: string) => {
    if (errors[fieldName]) {
      return <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>;
    }
    return null;
  };

  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* CV/Resume Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary rounded-full">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload CV/Resume</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload your CV or resume to automatically fill some fields
                  </p>
                </div>
                
                {uploadedFile ? (
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    <span>{uploadedFile.name}</span>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="cv-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="cv-upload"
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </label>
                  </div>
                )}
                
                {isProcessingCV && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Processing CV...</span>
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or fill manually</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input
                  placeholder="Alex"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {renderError("firstName")}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input
                  placeholder="Johnson"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {renderError("lastName")}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <Input
                type="email"
                placeholder="alex.johnson@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {renderError("email")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {renderError("phone")}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nationality</label>
              <select
                value={formData.nationality}
                onChange={(e) => handleInputChange("nationality", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select your nationality</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="China">China</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div>
              <label className="block text-sm font-medium mb-2">Highest Qualification *</label>
              <select
                value={formData.educationLevel}
                onChange={(e) => handleInputChange("educationLevel", e.target.value)}
                className={`w-full px-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.educationLevel ? "border-red-500" : ""}`}
              >
                <option value="">Select qualification</option>
                <option value="High School Diploma">High School Diploma</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="PhD">PhD</option>
              </select>
              {renderError("educationLevel")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Field of Study *</label>
              <Input
                placeholder="Computer Science"
                value={formData.fieldOfStudy}
                onChange={(e) => handleInputChange("fieldOfStudy", e.target.value)}
                className={errors.fieldOfStudy ? "border-red-500" : ""}
              />
              {renderError("fieldOfStudy")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Graduation Year</label>
                <select
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange("graduationYear", e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select year</option>
                  {generateGraduationYears().map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GPA/Grade</label>
                <Input
                  placeholder="3.8"
                  value={formData.gpa}
                  onChange={(e) => handleInputChange("gpa", e.target.value)}
                  className={errors.gpa ? "border-red-500" : ""}
                />
                {renderError("gpa")}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Grading System</label>
              <select
                value={formData.gradingSystem}
                onChange={(e) => handleInputChange("gradingSystem", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select system</option>
                <option value="4.0 Scale">4.0 Scale</option>
                <option value="10.0 Scale">10.0 Scale</option>
                <option value="Percentage">Percentage</option>
                <option value="First Class/Second Class">First Class/Second Class</option>
              </select>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">IELTS Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Overall Band</label>
                  <Input
                    placeholder="7.5"
                    value={formData.ieltsOverall}
                    onChange={(e) => handleInputChange("ieltsOverall", e.target.value)}
                    className={errors.ieltsOverall ? "border-red-500" : ""}
                  />
                  {renderError("ieltsOverall")}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Listening</label>
                  <Input
                    placeholder="8.0"
                    value={formData.ieltsListening}
                    onChange={(e) => handleInputChange("ieltsListening", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reading</label>
                  <Input
                    placeholder="7.5"
                    value={formData.ieltsReading}
                    onChange={(e) => handleInputChange("ieltsReading", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Writing</label>
                  <Input
                    placeholder="7.0"
                    value={formData.ieltsWriting}
                    onChange={(e) => handleInputChange("ieltsWriting", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Speaking</label>
                  <Input
                    placeholder="7.5"
                    value={formData.ieltsSpeaking}
                    onChange={(e) => handleInputChange("ieltsSpeaking", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Other Test Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">TOEFL Total (0-100)</label>
                  <Input
                    placeholder="100"
                    value={formData.toeflTotal}
                    onChange={(e) => handleInputChange("toeflTotal", e.target.value)}
                    className={errors.toeflTotal ? "border-red-500" : ""}
                  />
                  {renderError("toeflTotal")}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GRE Total (0-345)</label>
                  <Input
                    placeholder="320"
                    value={formData.greTotal}
                    onChange={(e) => handleInputChange("greTotal", e.target.value)}
                    className={errors.greTotal ? "border-red-500" : ""}
                  />
                  {renderError("greTotal")}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GMAT Total (0-650)</label>
                  <Input
                    placeholder="650"
                    value={formData.gmatTotal}
                    onChange={(e) => handleInputChange("gmatTotal", e.target.value)}
                    className={errors.gmatTotal ? "border-red-500" : ""}
                  />
                  {renderError("gmatTotal")}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div>
              <label className="block text-sm font-medium mb-2">Work Experience</label>
              <select
                value={formData.workExperience}
                onChange={(e) => handleInputChange("workExperience", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select years of experience</option>
                <option value="0 years">0 years</option>
                <option value="1 year">1 year</option>
                <option value="2 years">2 years</option>
                <option value="3 years">3 years</option>
                <option value="4 years">4 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Internships</label>
              <textarea
                rows={4}
                placeholder="List your internships and key achievements..."
                value={formData.internships}
                onChange={(e) => handleInputChange("internships", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Projects</label>
              <textarea
                rows={4}
                placeholder="Describe your academic and personal projects..."
                value={formData.projects}
                onChange={(e) => handleInputChange("projects", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Certifications</label>
              <textarea
                rows={3}
                placeholder="List your professional certifications and courses..."
                value={formData.certifications}
                onChange={(e) => handleInputChange("certifications", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Study Level</label>
                <select
                  value={formData.studyLevel}
                  onChange={(e) => handleInputChange("studyLevel", e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select study level</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Intake Preference</label>
                <select
                  value={formData.intakePreference}
                  onChange={(e) => handleInputChange("intakePreference", e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select intake</option>
                  {generateIntakePreferences().map((intake) => (
                    <option key={intake} value={intake}>{intake}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Country</label>
              <p className="text-sm text-muted-foreground mb-3">
                Please select your target country (optional)
              </p>
              {formData.targetCountries.length === 1 && formData.targetCountries[0] !== "Both" && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Selecting a specific country will lock the country toggle in your navigation bar to that country.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Germany", "United Kingdom", "Both"].map((country) => (
                  <label key={country} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="targetCountry"
                      checked={formData.targetCountries.includes(country)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange("targetCountries", [country]);
                        }
                      }}
                      className="rounded border-border focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm">{country}</span>
                  </label>
                ))}
              </div>
              {renderError("targetCountries")}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold uni-text-primary">Student Management</h1>
          <p className="text-muted-foreground">Manage and track student applications</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">All registered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
  {activeStudents}
</div>
            <p className="text-xs text-muted-foreground">Currently applying</p>
          </CardContent>
        </Card>
        
        <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Inactive/Suspended</CardTitle>
    <div className="h-2 w-2 bg-red-500 rounded-full" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {inactiveStudents}
    </div>
    <p className="text-xs text-muted-foreground">Suspended accounts</p>
  </CardContent>
</Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
  {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.profileCompletion || 0), 0) / students.length) : 0}%
</div>
            <p className="text-xs text-muted-foreground">Profile completion</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive', 'suspended'].map((status) => (
  <Button
    key={status}
    variant={filter === status ? 'default' : 'outline'}
    size="sm"
    onClick={() => setFilter(status)}
    className="capitalize"
  >
    {status}
  </Button>
))}
        </div>
      </motion.div>

      
      {/* Students List */}
      <Card>
        <CardContent className="p-0">
           {isLoading ? (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading students...</p>
      </div>
    </div>
  ) : (
    
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Status</th>
                  
                  
                  <th className="p-4 font-medium">Last Active</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.profileImage} />
                          <AvatarFallback className="uni-gradient-primary text-white">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
  <Mail className="w-3 h-3" />
  {student.email}
</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={statusConfig[student.status as keyof typeof statusConfig]?.color || statusConfig.active.color}>
  {statusConfig[student.status as keyof typeof statusConfig]?.label || student.status}
</Badge>
                    </td>
                    
                    
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentClick(student.id);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Form Modal */}
      <Dialog open={showAddStudentForm} onOpenChange={setShowAddStudentForm}>
        <DialogContent className="max-w-2xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student profile for the UNI360° system
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .overflow-y-auto::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="space-y-6 pr-2">
              {renderFormStep()}
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={formStep === 1}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddStudentForm(false)}
              >
                Cancel
              </Button>
              {formStep < 5 ? (
                <Button 
                  className="uni-gradient-primary"
                  onClick={nextStep}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  className="uni-gradient-primary"
                  onClick={handleAddStudent}
                >
                  Add Student
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Success!</h3>
              <p className="text-sm text-muted-foreground">
                New student has been added successfully
              </p>
            </div>
            <Button 
              className="uni-gradient-primary px-8"
              onClick={() => setShowSuccessModal(false)}
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Student Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={(open) => { setShowProfileModal(open); if (!open) setProfileData(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:text-sidebar-foreground [&>button]:top-4 [&>button]:right-4 [&>button:hover]:text-sidebar-foreground/70 [&>button]:opacity-100">

          {isProfileLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading student profile...</p>
              </div>
            </div>
          ) : profileData?.error ? (
            <div className="flex items-center justify-center h-64 text-red-500 p-8">
              <p>{profileData.error}</p>
            </div>
          ) : profileData ? (() => {
            const p = profileData;
            const ui = p.userInfo || {};
            const pd = p.profileData || {};
            const overview = p.overview?.overview || {};
            const stepsStatus = p.overview?.stepsStatus || [];
            const basic = pd.basic_info || {};
            const education = pd.education?.education_entries || [];
            const testScores = pd.test_scores || {};
            const prefs = pd.preferences || {};
            const experience = pd.experience || {};
            const financial = pd.financial || {};
            const goals = pd.goals || {};
            const flags = pd.workflow_flags || {};
            const compliance = pd.testing_compliance || {};
            const documents = pd.documents || {};

            const fmt = (key: string) =>
              key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

            const InfoRow = ({ label, value }: { label: string; value?: any }) => (
              value !== undefined && value !== '' && value !== null ? (
                <div className="flex justify-between items-start py-1.5 border-b border-muted last:border-0">
                  <span className="text-xs text-muted-foreground w-2/5">{label}</span>
                  <span className="text-xs font-medium text-right w-3/5 break-words">{String(value)}</span>
                </div>
              ) : null
            );

            const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
                  <span className="text-primary">{icon}</span>
                  <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                <div className="px-4 py-3">{children}</div>
              </div>
            );

            return (
              <>
                {/* Header Banner */}
                <div className="bg-sidebar p-6 text-sidebar-foreground rounded-t-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-sidebar-foreground/30">
                      <AvatarFallback className="bg-sidebar-foreground/10 text-sidebar-foreground text-xl font-bold">
                        {getInitials(ui.fullName || basic.full_name || 'S')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-sidebar-foreground">{ui.fullName || basic.full_name || 'N/A'}</h2>
                      <p className="text-sidebar-foreground/70 text-sm">{ui.email || 'N/A'}</p>
                      <p className="text-sidebar-foreground/60 text-sm">{ui.phoneNumber || basic.phone || 'N/A'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={`${ui.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'} text-white border-0`}>
                        {ui.status || 'N/A'}
                      </Badge>
                      <div className="text-sidebar-foreground/70 text-xs">User ID: {p.userId}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-sidebar-foreground/70 mb-1">
                      <span>Profile Completion</span>
                      <span>{overview.completionPercentage ?? 0}% ({overview.completedSteps}/{overview.totalSteps} steps)</span>
                    </div>
                    <div className="w-full bg-sidebar-foreground/20 rounded-full h-2">
                      <div
                        className="bg-sidebar-primary rounded-full h-2 transition-all"
                        style={{ width: `${overview.completionPercentage ?? 0}%` }}
                      />
                    </div>
                    
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>

                  {/* Basic Info */}
                  <SectionCard title="Basic Information" icon={<Users className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-x-6">
                      <InfoRow label="Full Name" value={basic.full_name} />
                      <InfoRow label="Date of Birth" value={basic.date_of_birth} />
                      <InfoRow label="Gender" value={basic.gender || '—'} />
                      <InfoRow label="Nationality" value={basic.nationality} />
                      <InfoRow label="Phone" value={basic.phone} />
                      <InfoRow label="Current Country" value={basic.current_country} />
                      <InfoRow label="Passport Number" value={basic.passport_number || '—'} />
                      <InfoRow label="Emergency Contact" value={basic.emergency_contact_name || '—'} />
                    </div>
                  </SectionCard>

                  {/* Education */}
                  <SectionCard title="Education Background" icon={<GraduationCap className="w-4 h-4" />}>
                    <div className="space-y-3">
                      {education.length > 0 ? education.map((edu: any, i: number) => (
                        <div key={i} className="bg-muted/40 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-semibold">{edu.institution_name}</p>
                              <p className="text-xs text-muted-foreground">{fmt(edu.education_level)} · {edu.field_of_study}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">{edu.gpa}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">{edu.graduation_year}</p>
                            </div>
                          </div>
                          {edu.academic_honors && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> {edu.academic_honors}
                            </p>
                          )}
                        </div>
                      )) : <p className="text-sm text-muted-foreground">No education entries</p>}
                    </div>
                  </SectionCard>

                  {/* Test Scores & Preferences - 2 col */}
                  <div className="grid grid-cols-2 gap-4">
                    <SectionCard title="Test Scores" icon={<FileText className="w-4 h-4" />}>
                      <InfoRow label="Test Type" value={testScores.test_type} />
                      <InfoRow label="Overall Score" value={testScores.overall_score} />
                      <InfoRow label="Reading" value={testScores.reading_score || '—'} />
                      <InfoRow label="Writing" value={testScores.writing_score || '—'} />
                      <InfoRow label="Speaking" value={testScores.speaking_score || '—'} />
                      <InfoRow label="Listening" value={testScores.listening_score || '—'} />
                      <InfoRow label="Test Date" value={testScores.test_date || '—'} />
                    </SectionCard>

                    <SectionCard title="Study Preferences" icon={<MapPin className="w-4 h-4" />}>
                      <InfoRow label="Degree Level" value={prefs.degree_level} />
                      <InfoRow label="Intake" value={`${prefs.intake_semester} ${prefs.intake_year}`} />
                      <InfoRow label="Ranking Pref." value={fmt(prefs.university_ranking_preference || '')} />
                      <InfoRow label="Accommodation" value={prefs.accommodation_preference || '—'} />
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground mb-1">Preferred Countries</p>
                        <div className="flex flex-wrap gap-1">
                          {(prefs.preferred_countries || []).map((c: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs capitalize">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Preferred Programs</p>
                        <div className="flex flex-wrap gap-1">
                          {(prefs.preferred_programs || []).map((pg: string, i: number) => (
                            <Badge key={i} className="text-xs bg-primary/10 text-primary border-0">{pg}</Badge>
                          ))}
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  {/* Experience */}
                  <SectionCard title="Experience" icon={<Calendar className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-x-6">
                      <InfoRow label="Summary" value={experience.experience_summary} />
                      <InfoRow label="Has Work Experience" value={experience.has_work_experience ? 'Yes' : 'No'} />
                      <InfoRow label="Total Years" value={experience.total_experience_years || '—'} />
                      <InfoRow label="Skills" value={experience.skills} />
                      <InfoRow label="Projects" value={experience.projects} />
                      <InfoRow label="Volunteer Work" value={experience.volunteer_work || '—'} />
                      <InfoRow label="Extracurriculars" value={experience.extracurricular_activities || '—'} />
                    </div>
                  </SectionCard>

                  {/* Financial & Goals - 2 col */}
                  <div className="grid grid-cols-2 gap-4">
                    <SectionCard title="Financial Information" icon={<Check className="w-4 h-4" />}>
                      <InfoRow label="Budget Range" value={fmt(financial.budget_range || '')} />
                      <InfoRow label="Sponsor" value={financial.sponsor_name} />
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground mb-1">Funding Source</p>
                        <div className="flex flex-wrap gap-1">
                          {(financial.funding_source || []).map((f: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{fmt(f)}</Badge>
                          ))}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Career Goals" icon={<ArrowRight className="w-4 h-4" />}>
                      <InfoRow label="Motivation" value={goals.motivation} />
                      <InfoRow label="Career Goals" value={goals.career_goals || '—'} />
                      <InfoRow label="Academic Goals" value={goals.academic_goals || '—'} />
                      <InfoRow label="Post Study Plans" value={goals.post_study_plans || '—'} />
                      <InfoRow label="Career Path" value={goals.preferred_career_path || '—'} />
                    </SectionCard>
                  </div>

                </div>
              </>
            );
          })() : null}

        </DialogContent>
      </Dialog>

    </div>
  );
};
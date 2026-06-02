import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  FileText,
  Zap,
  Download,
  ArrowRight,
  User,
  Briefcase,
  Wand2,
  Copy,
  RefreshCw,
  Sparkles,
  CheckCircle,
  Clock,
  Settings,
  Save,
  Eye,
  History,
  X,
  ChevronLeft,
  Menu,
  Lock,
  CreditCard,
  Shield,
  DollarSign,
  Unlock,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  BookOpen,
  Award,
  Languages,
  Star,
  Plus,
  Minus,
  AlertCircle,
  ClipboardList
} from "lucide-react";
import { getStudentProfile } from "@/services/studentProfile";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders, makeAuthenticatedRequest } from "@/services/tokenService";
import { checkPaymentHealth, verifyPayment } from "@/services/payment.js";
import RazorpayButton from "@/components/RazorpayButton";
import jsPDF from "jspdf";

// n8n SOP Generator Configuration
// n8n Configuration - Add at the top of AITools.tsx (around line 30)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.uni360degree.com';

const N8N_CONFIG = {
  sop: {
    webhookUrl: `${API_BASE_URL}/api/v1/ai/sop/generate`,
    timeout: 120000,
  },
  lor: {
    webhookUrl: `${API_BASE_URL}/api/v1/ai/lor/generate`,
    timeout: 120000,
  },
  cover: {
    webhookUrl: `${API_BASE_URL}/api/v1/ai/cover-letter/generate`,
    timeout: 120000,
  }
};

const highlightDynamicText = (text: string, tool: string, formData: any) => {
  if (!text) return '';
  let highlightedText = text;
  
  let terms: string[] = [];
  
  if (tool === 'sop') {
    if (formData.university) terms.push(formData.university);
    if (formData.program) terms.push(formData.program);
    if (formData.motivation) terms.push(formData.motivation);
  } else if (tool === 'lor') {
    if (formData.lorUniversityName) terms.push(formData.lorUniversityName);
    if (formData.lorField) terms.push(formData.lorField);
    if (formData.lorSkillsArray && Array.isArray(formData.lorSkillsArray)) {
      terms.push(...formData.lorSkillsArray);
      terms.push(formData.lorSkillsArray.join(', '));
    } else if (formData.lorSkills) {
      terms.push(formData.lorSkills);
    }
  } else if (tool === 'cover') {
    if (formData.universityName) terms.push(formData.universityName);
    if (formData.universityLocation) terms.push(formData.universityLocation);
    if (formData.courseName) terms.push(formData.courseName);
    if (formData.tuitionFees) terms.push(formData.tuitionFees);
    if (formData.blockedAccountBank) terms.push(formData.blockedAccountBank);
    if (formData.blockedAccountBalance) terms.push(formData.blockedAccountBalance);
  }

  const uniqueTerms = Array.from(new Set(terms))
    .filter(t => t && String(t).trim().length > 1)
    .sort((a, b) => String(b).length - String(a).length);

  uniqueTerms.forEach(term => {
    const termStr = String(term);
    const escapedTerm = termStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})(?![^<]*>)`, 'gi');
    highlightedText = highlightedText.replace(regex, '<strong>$1</strong>');
  });

  highlightedText = highlightedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return highlightedText;
};

const AITools = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState(null);
  const [showPrerequisiteModal, setShowPrerequisiteModal] = useState(false);
  const [pendingToolId, setPendingToolId] = useState(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [formData, setFormData] = useState({});
  const [workExperiences, setWorkExperiences] = useState([{ company: '', position: '', duration: '', description: '' }]);
  const [educationEntries, setEducationEntries] = useState([{ institution: '', degree: '', year: '', grade: '' }]);
  const [languages, setLanguages] = useState([{ language: '', proficiency: 'Basic' }]);
  const [skills, setSkills] = useState(['']);
  const [sopType, setSopType] = useState(''); // Add this line
  const [generatedContent, setGeneratedContent] = useState(null);
const [generationError, setGenerationError] = useState(null);
const [paymentHealthy, setPaymentHealthy] = useState(true);
const [verifying, setVerifying] = useState(false);
const [verifyError, setVerifyError] = useState(null);
const [verified, setVerified] = useState(false);
const [activeTab, setActiveTab] = useState<'tools' | 'history'>('tools');
const [docHistory, setDocHistory] = useState<Array<{
  id: string;
  toolId: string;
  toolName: string;
  title: string;
  text: string;
  wordCount: number;
  generatedAt: string;
}>>(() => {
  try {
    const stored = localStorage.getItem('aitools_history');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
});
const [viewingDoc, setViewingDoc] = useState<string | null>(null);
const [manualToolModal, setManualToolModal] = useState<string | null>(null);
const [manualFormData, setManualFormData] = useState<Record<string, string>>({});
const [manualSubmitted, setManualSubmitted] = useState(false);
const [errorModal, setErrorModal] = useState(false);


  // Enhanced AI tools data
  const aiTools = [
    {
      id: 'sop',
      name: "SOP Generator",
      title: 'Statement of Purpose Generator',
      description: "Create compelling Statements of Purpose tailored to your target universities",
      icon: FileText,
      features: ["University-specific customization", "Multiple tone options", "Real-time preview", "Export formats"],
      color: "bg-blue-100 text-blue-600",
      bgGradient: "from-blue-500 to-blue-600",
      price: "₹1",
      isPremium: true
    },
    {
      id: 'lor',
      name: "LOR Generator", 
      title: 'Letter of Recommendation Assistant',
      description: "Generate professional Letters of Recommendation with proper formatting",
      icon: User,
      features: ["Academic/Professional templates", "Multiple formats", "Export to PDF/DOC", "Customizable"],
      color: "bg-green-100 text-green-600",
      bgGradient: "from-green-500 to-green-600",
      price: "₹1",
      isPremium: true
    },
    {
  id: 'cover',
  name: "Cover Letter Generator",
  title: 'Professional Cover Letter Generator',
  description: "Create compelling cover letters tailored to your job applications",
  icon: FileText,
  features: ["Job-specific customization", "Multiple formats", "Real-time preview", "Export options"],
  color: "bg-purple-100 text-purple-600",
  bgGradient: "from-purple-500 to-purple-600",
  price: "₹1",
  isPremium: true
}
  ];

  

  // Mock templates
  const templates = {
    sop: [
      { id: '1', name: 'Engineering Focus', description: 'For technical programs' },
      { id: '2', name: 'Business School', description: 'For MBA and business programs' },
      { id: '3', name: 'Research Oriented', description: 'For PhD and research programs' }
    ],
    lor: [
      { id: '1', name: 'Academic Supervisor', description: 'From professor or advisor' },
      { id: '2', name: 'Professional Manager', description: 'From work supervisor' },
      { id: '3', name: 'Research Mentor', description: 'For research-focused programs' }
    ],
    cv: [
      { id: '1', name: 'Modern Professional', description: 'Clean and contemporary design' },
      { id: '2', name: 'Academic Format', description: 'For academic positions' },
      { id: '3', name: 'Creative Portfolio', description: 'For design and creative fields' }
    ]
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { scale: 0.9, opacity: 0 },
    show: { scale: 1, opacity: 1 }
  };

  // Load profile data when SOP tool is selected
// Load profile data when SOP, LOR, or Cover Letter tool is selected
useEffect(() => {
  if ((selectedTool === 'sop' || selectedTool === 'lor' || selectedTool === 'cover') && generationStep === 1) {
    loadProfileData();
  }
}, [selectedTool, generationStep]);

// ADD AFTER LINE 195 (after the }, [selectedTool, generationStep]); block):

useEffect(() => {
  const anyModalOpen = !!selectedTool || !!viewingDoc || !!manualToolModal || errorModal || showPrerequisiteModal;
  document.body.style.overflow = anyModalOpen ? 'hidden' : '';
  return () => { document.body.style.overflow = ''; };
}, [selectedTool, viewingDoc, manualToolModal, errorModal, showPrerequisiteModal]);

useEffect(() => {
  if (generationStep === 0.5) {
    setVerified(false);
    setVerifyError(null);
    checkPaymentHealth().then((ok) => setPaymentHealthy(ok));
  }
}, [generationStep]);

// n8n SOP Generator API Integration
// n8n SOP Generator API Integration
const generateSOPWithN8N = async (formData) => {
  try {
    console.log('[SOP Generator] Starting generation with API...');
    console.log('[SOP Generator] formData received:', formData);

    const requestPayload = {
  university: formData.university || '',
  program: formData.program || '',
  motivation: formData.motivation || '',
  tone: formData.tone || 'PROFESSIONAL',
  word_limit: formData.wordLimit ? Number(formData.wordLimit) : 800,
  additional_requirements: formData.additionalRequirements || '',
};

    console.log('[SOP Generator] Sending to backend:', requestPayload);

    const result = await makeAuthenticatedRequest(N8N_CONFIG.sop.webhookUrl, {
      method: 'POST',
      body: requestPayload,
    });

    console.log('[SOP Generator] Success:', result);

    const text = result.data?.generatedSop || result.generatedSop || result.data?.sop || result.sop || (typeof result === 'string' ? result : '');
    return {
      success: true,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length
    };

  } catch (error) {
    console.error('[SOP Generator] Error:', error);
    throw error;
  }
};

// n8n LOR Generator API Integration
const generateLORWithN8N = async (formData) => {
  try {
    console.log('[LOR Generator] Starting generation with API...');
    console.log('[LOR Generator] Form data:', formData);

    // Build comma-separated skills string from tag array (or fallback to plain string)
    const skillsArray = formData.lorSkillsArray || [];
    const skills = skillsArray.length > 0
      ? skillsArray.join(', ')
      : (formData.lorSkills || '');

    const requestPayload = {
      senior_name: formData.seniorName || '',
      university_name: formData.lorUniversityName || '',
      field: formData.lorField || '',
      skills,
      recommender_designation: formData.recommenderDesignation || 'Professor',
      relationship_type: formData.relationshipType || 'Academic Advisor',
      relationship_duration: formData.relationshipDuration || '2 years',
      recommendation_level: formData.recommendationLevel || 'highly recommend',
      tone: formData.tone || 'PROFESSIONAL',
    };

    console.log('[LOR Generator] Request payload:', requestPayload);

    const result = await makeAuthenticatedRequest(N8N_CONFIG.lor.webhookUrl, {
      method: 'POST',
      body: requestPayload,
    });

    console.log('[LOR Generator] Success:', result);

    const text = result.data?.generatedLor || result.generatedLor || result.data?.lor || result.lor || (typeof result === 'string' ? result : '');
    return {
      success: true,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length
    };

  } catch (error) {
    console.error('[LOR Generator] Error:', error);
    throw error;
  }
};

// n8n Cover Letter Generator API Integration
const generateCoverLetterWithN8N = async (formData) => {
  try {
    console.log('[Cover Letter Generator] Starting generation with API...');
    console.log('[Cover Letter Generator] Form data:', formData);

    const requestPayload = {
      university_name: formData.universityName || '',
      university_location: formData.universityLocation || '',
      passport_number: formData.passportNumber || '',
      course_name: formData.courseName || '',
      course_duration: formData.courseDuration || '',
      course_start_date: formData.courseStartDate || '',
      tuition_fees: '1500 EUR per semester',
      blocked_account_bank: formData.blockedAccountBank || '',
      blocked_account_balance: formData.blockedAccountBalance || '',
      visa_type: formData.visaType || 'National Visa for Study',
      tone: formData.tone || 'PROFESSIONAL',
    };

    console.log('[Cover Letter Generator] Request payload:', requestPayload);

    const result = await makeAuthenticatedRequest(N8N_CONFIG.cover.webhookUrl, {
      method: 'POST',
      body: requestPayload,
    });

    console.log('[Cover Letter Generator] Success:', result);

    const text = result.data?.generatedCoverLetter || result.generatedCoverLetter
      || result.data?.coverLetter || result.coverLetter
      || result.data?.cover_letter || result.cover_letter
      || (typeof result === 'string' ? result : '');
    return {
      success: true,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length
    };

  } catch (error) {
    console.error('[Cover Letter Generator] Error:', error);
    throw error;
  }
};

const loadProfileData = async () => {
  try {
    const result = await makeAuthenticatedRequest('/api/v1/students/profile', {
      method: 'GET',
    });

    console.log('[Profile Data] Full response:', result);

    // Profile API returns: { data: { basic_info: {...}, education: {...}, preferences: {...}, experience: {...}, financial: {...}, goals: {...}, ... } }
    const profileData = result.data || result;

    // Helper to find education entries by level
    const eduEntries = profileData?.education?.education_entries || [];
    const findEdu = (level) => eduEntries.find(e =>
      (e.education_level || '').toLowerCase() === level.toLowerCase()
    ) || {};
    const sscEntry = findEdu('SSC');
    const hscEntry = findEdu('HSC');
    const bachelorsEntry = eduEntries.find(e =>
      ['bachelors', 'bachelor', 'undergraduate'].includes((e.education_level || '').toLowerCase())
    ) || {};

    console.log('[Profile Data] Education entries:', eduEntries);

    // Map profile data for SOP
    if (selectedTool === 'sop') {
      const mappedData = {
        university: '',  // not in profile — user must enter target university
        program: '',     // user must enter target program

        degreeLevel: profileData.preferences?.degree_level || '',
        motivation: profileData.goals?.motivation || '',
        careerGoals: profileData.goals?.career_goals || '',
        experienceSummary: profileData.experience?.experience_summary || '',
        tone: 'PROFESSIONAL',
        wordLimit: '800',
        additionalRequirements: '',
      };
      console.log('[Profile Data] Mapped SOP data:', mappedData);
      setFormData(mappedData);
    }
    // Map profile data for LOR
    else if (selectedTool === 'lor') {
      const mappedData = {
        seniorName: '',
        lorUniversityName: '',  // user must enter target university
        lorField: bachelorsEntry.field_of_study || profileData.preferences?.preferred_programs?.[0] || '',
        // Convert profile skills string into array for tag input
        lorSkillsArray: profileData.experience?.skills
          ? profileData.experience.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        lorSkillInput: '',
        recommenderDesignation: 'Professor',
        relationshipType: 'Academic Advisor',
        relationshipDuration: '2 years',
        recommendationLevel: 'highly recommend',
        tone: 'PROFESSIONAL',
      };
      console.log('[Profile Data] Mapped LOR data:', mappedData);
      setFormData(mappedData);
    }
    // Map profile data to form fields for Cover Letter
    else if (selectedTool === 'cover') {
      const mappedData = {
        studentName: profileData.basic_info?.full_name || '',
        passportNumber: profileData.basic_info?.passport_number || '',
        // Course fields — left blank for user to fill (not in profile)
        universityName: '',
        universityLocation: '',
        courseName: '',
        courseDuration: '',
        courseStartDate: '',
        tuitionFees: '',
        blockedAccountBank: '',
        blockedAccountBalance: '',
        sponsorName: profileData.financial?.sponsor_name || '',
        // Education from profile
        sscSchool: sscEntry.institution_name || '',
        sscYear: sscEntry.graduation_year ? String(sscEntry.graduation_year) : '',
        sscMarks: sscEntry.gpa || '',
        hscInstitution: hscEntry.institution_name || '',
        hscYear: hscEntry.graduation_year ? String(hscEntry.graduation_year) : '',
        hscMarks: hscEntry.gpa || '',
        bachelorsUniversity: bachelorsEntry.institution_name || '',
        bachelorsCourse: bachelorsEntry.field_of_study || '',
        bachelorsCgpa: bachelorsEntry.gpa || '',
        visaType: 'National Visa for Study',
        tone: 'PROFESSIONAL',
      };
      console.log('[Profile Data] Mapped Cover Letter data:', mappedData);
      setFormData(mappedData);
    }
  } catch (error) {
    console.error('[Profile Data] Error loading profile data:', error);
    alert('Failed to load profile data. Please check if you are logged in.');
  }
};
const startGeneration = (toolId) => {
  setPendingToolId(toolId);
  setShowPrerequisiteModal(true);
  setIsMobileMenuOpen(false);
};

const continueToGeneration = () => {
  const tool = aiTools.find(t => t.id === pendingToolId);
  setSelectedTool(pendingToolId);
  setGenerationStep(1);
  setShowPrerequisiteModal(false);
};

  const handlePayment = () => {
  // Mark as paid
  setPaymentStatus(prev => ({ ...prev, [selectedTool]: true }));
  
  // If SOP, start generation immediately after payment
  if (selectedTool === 'sop') {
    setGenerationStep(2);
    setTimeout(() => simulateGeneration(null, true), 100);
  } else {
    setGenerationStep(2);
    setTimeout(() => simulateGeneration(selectedTool, true), 100);
  }
};

  const simulateGeneration = async (toolOverride = null, skipPaymentCheck = false) => {
  const activeTool = toolOverride ?? selectedTool;

  // 🔒 Payment guard — never hit the API if payment is not done
  // skipPaymentCheck is true when called directly after payment (state not yet updated)
  const tool = aiTools.find(t => t.id === activeTool);
  if (!skipPaymentCheck && tool?.isPremium && !paymentStatus[activeTool] && activeTool !== 'lor') {
    setGenerationStep(0.5); // redirect to payment screen
    return;
  }

  setIsGenerating(true);
  setGenerationError(null); // Clear previous errors
  
  try {
    console.log('[AITools] Starting generation for tool:', selectedTool);
    console.log('[AITools] Form data:', formData);
    
    let result;
    
    // Call the appropriate generation function based on selected tool
    if (activeTool === 'sop') {
  result = await generateSOPWithN8N(formData);
} else if (activeTool === 'lor') {
  result = await generateLORWithN8N(formData);
} else if (activeTool === 'cover') {
  result = await generateCoverLetterWithN8N(formData);
}
    
    console.log('[AITools] Generation result:', result);
    
    // Only proceed to step 3 if we got a successful result
    // Only proceed to step 3 if we got a successful result
if (result && result.success) {
  result.text = highlightDynamicText(result.text, activeTool, formData);
  setGeneratedContent(result);

  // Save to history
  const currentTool = aiTools.find(t => t.id === (toolOverride ?? selectedTool));
  const historyEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    toolId: toolOverride ?? selectedTool,
    toolName: currentTool?.name || 'AI Document',
    title: currentTool?.title || 'Generated Document',
    text: result.text,
    wordCount: result.wordCount,
    generatedAt: new Date().toISOString(),
  };
  setDocHistory(prev => {
    const updated = [historyEntry, ...prev];
    try { localStorage.setItem('aitools_history', JSON.stringify(updated)); } catch {}
    return updated;
  });

  // Wait before showing output screen
  setTimeout(() => {
    setIsGenerating(false);
    setGenerationStep(3);
    setPaymentStatus(prev => ({ ...prev, [activeTool]: false }));
  }, 20000);
  
} else {
  throw new Error('Generation failed - no content received');
}
    
  } catch (error) {
    console.error('[AITools] Generation error:', error);
    setIsGenerating(false);
    setGenerationError(error.message || 'Failed to generate document. Please try again.');
    setErrorModal(true); // show the error popup
  }
};

  const resetGeneration = () => {
  setSelectedTool(null);
  setGenerationStep(0);
  setIsGenerating(false);
  setFormData({});
  setSopType('');
  setGeneratedContent(null);
  setPaymentStatus({});
};

  const updateFormData = (field, value) => {
  setFormData(prev => {
    const updated = { ...prev, [field]: value };
    
    // Clear Bachelor's fields when checkbox is unchecked
    if (field === 'hasBachelors' && !value) {
      delete updated.bachelorsUniversityName;
      delete updated.bachelorsCourseName;
      delete updated.bachelorsStartDate;
      delete updated.bachelorsEndDate;
      delete updated.bachelorsCGPA;
    }
    
    // Clear Master's fields when checkbox is unchecked
    if (field === 'hasMasters' && !value) {
      delete updated.mastersUniversityName;
      delete updated.mastersCourseName;
      delete updated.mastersStartDate;
      delete updated.mastersEndDate;
      delete updated.mastersCGPA;
    }
    
    // Clear HSC fields when switching to Diploma
    if (field === 'afterSSCType' && value === 'diploma') {
      delete updated.hscSchoolName;
      delete updated.hscPassingDate;
      delete updated.hscMarks;
    }
    
    // Clear Diploma fields when switching to HSC
    if (field === 'afterSSCType' && value === 'hsc') {
      delete updated.diplomaUniversityName;
      delete updated.diplomaCourseName;
      delete updated.diplomaStartDate;
      delete updated.diplomaEndDate;
      delete updated.diplomaCGPA;
    }
    
    return updated;
  });
};

  const addArrayItem = (arrayName, newItem) => {
    switch (arrayName) {
      case 'workExperiences':
        setWorkExperiences(prev => [...prev, newItem]);
        break;
      case 'educationEntries':
        setEducationEntries(prev => [...prev, newItem]);
        break;
      case 'languages':
        setLanguages(prev => [...prev, newItem]);
        break;
      case 'skills':
        setSkills(prev => [...prev, '']);
        break;
    }
  };

  const removeArrayItem = (arrayName, index) => {
    switch (arrayName) {
      case 'workExperiences':
        setWorkExperiences(prev => prev.filter((_, i) => i !== index));
        break;
      case 'educationEntries':
        setEducationEntries(prev => prev.filter((_, i) => i !== index));
        break;
      case 'languages':
        setLanguages(prev => prev.filter((_, i) => i !== index));
        break;
      case 'skills':
        setSkills(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    switch (arrayName) {
      case 'workExperiences':
        setWorkExperiences(prev => prev.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        ));
        break;
      case 'educationEntries':
        setEducationEntries(prev => prev.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        ));
        break;
      case 'languages':
        setLanguages(prev => prev.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        ));
        break;
      case 'skills':
        setSkills(prev => prev.map((item, i) => 
          i === index ? value : item
        ));
        break;
    }
  };

  const getToolIcon = (type) => {
    switch (type) {
      case 'sop': return <FileText size={16} className="text-blue-600" />;
      case 'lor': return <User size={16} className="text-green-600" />;
      case 'cv': return <Briefcase size={16} className="text-purple-600" />;
      default: return <Bot size={16} className="text-gray-600" />;
    }
  };

  const renderPaymentModal = () => {
  const currentTool = aiTools.find(tool => tool.id === selectedTool);
  if (!currentTool) return null;
  const IconComponent = currentTool.icon;

  return (
    <motion.div
      className="space-y-6 text-center py-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex justify-center">
        <div className={`p-4 rounded-full text-white bg-gradient-to-r ${currentTool.bgGradient}`}>
          <Lock size={32} />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Premium Tool Access</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {currentTool.title} is a premium tool that requires payment to access
        </p>
        <div className="text-3xl font-bold text-primary mb-2">{currentTool.price}</div>
        <p className="text-sm text-gray-500">One-time payment • Lifetime access</p>
      </div>

      <div className="space-y-3 text-left max-w-md mx-auto">
        <h4 className="font-semibold text-center">What you get:</h4>
        {currentTool.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* Health check failed */}
      {!paymentHealthy && (
        <div className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 max-w-md mx-auto">
          <X size={16} className="flex-shrink-0" />
          Payment service is currently unavailable. Please try again later.
        </div>
      )}

      {/* Verify error */}
      {verifyError && (
        <div className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 max-w-md mx-auto">
          <X size={16} className="flex-shrink-0" />
          {verifyError}
        </div>
      )}

      

      {/* Verified success */}
      {verified && (
        <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 max-w-md mx-auto">
          <CheckCircle size={16} className="flex-shrink-0" />
          Payment verified! Receipt downloaded. Unlocking tool…
        </div>
      )}

      {/* Razorpay button — shown only when healthy and not yet verified */}
      {!verified && paymentHealthy && (
        <div className="flex justify-center">
          <RazorpayButton
            amount={100}
            label={`Pay ${currentTool.price} with Razorpay`}
            description={`${currentTool.name} — Uni360`}
            notes={{ purpose: `${currentTool.name} Access`, toolId: selectedTool, section: "AI_TOOLS" }}
            receipt={`ai_tool_${selectedTool}_${Date.now()}`}
            paymentType="AI_TOOLS"
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white"
            onSuccess={async (paymentData) => {
  console.log('[AITools] Payment success, paymentData:', paymentData);
  // RazorpayButton already verifies internally — onSuccess only fires
  // after backend verification passes. Skip double-verify.
  setVerified(true);
  downloadReceipt(paymentData);
  setTimeout(() => {
    handlePayment();
  }, 1500);
}}
            onFailure={(err) => {
              console.error('[AITools] Payment failed:', err);
              setVerifyError("Payment failed. Please try again.");
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Shield size={12} />
        <span>Secure payment powered by Razorpay</span>
      </div>
    </motion.div>
  );
};

  const downloadReceipt = (paymentData: any) => {
  const currentTool = aiTools.find(t => t.id === selectedTool);
  const doc = new jsPDF();
  const pageW = 210;

  const logo = new Image();
  logo.src = "/assets/Uni360-logo.png";
  try { doc.addImage(logo, "PNG", 14, 10, 28, 14); } catch {}

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Uni360",                    pageW - 14, 14, { align: "right" });
  doc.text("support@uni360degree.com",  pageW - 14, 19, { align: "right" });
  doc.text("https://uni360degree.com",  pageW - 14, 24, { align: "right" });

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 30, pageW - 14, 30);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Payment Receipt", pageW / 2, 46, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Receipt No: ", 14, 58);
  doc.setFont("helvetica", "bold");
  doc.text(paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A", 38, 58);
  doc.setFont("helvetica", "normal");
  doc.text("Date: ", 14, 65);
  doc.setFont("helvetica", "bold");
  doc.text(new Date().toLocaleString(), 26, 65);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 71, pageW - 14, 71);

  doc.setFillColor(240, 240, 245);
  doc.rect(14, 75, 182, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Details",     60,  82, { align: "center" });
  doc.text("Information", 150, 82, { align: "center" });

  const rows: [string, string][] = [
    ["Name",        user?.name || user?.fullName || user?.firstName || "Student"],
    ["Tool",        currentTool?.title ?? "AI Tool"],
    ["Purpose",     `${currentTool?.name ?? "AI Tool"} Access`],
    ["Amount Paid", currentTool?.price ?? "N/A"],
    ["Transaction ID", paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"],
    ["Payment ID",  paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"],
    ["Order ID",    paymentData?.orderId ?? paymentData?.razorpay_order_id ?? "N/A"],
    ["Status",      "Verified ✓"],
  ];

  let y = 92;
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 255);
      doc.rect(14, y - 5, 182, 10, "F");
    }
    doc.setDrawColor(230, 230, 230);
    doc.rect(14, y - 5, 182, 10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(label, 18, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(label === "Status" ? 22 : 30, label === "Status" ? 163 : 30, label === "Status" ? 74 : 30);
    doc.text(value, 100, y);
    y += 10;
  });

  doc.setDrawColor(220, 220, 220);
  doc.line(14, y + 4, pageW - 14, y + 4);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Issued by: ", 14, y + 14);
  doc.setFont("helvetica", "bold");
  doc.text("Uni360", 36, y + 14);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your payment!", 14, y + 22);

  doc.save(`ai_tool_receipt_${selectedTool}_${paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? Date.now()}.pdf`);
};

  const renderSOPForm = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="space-y-6"
  >
    <h3 className="text-lg font-semibold">Statement of Purpose Details</h3>

    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Academic Information</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Target University *</label>
          <input
            type="text"
            placeholder="e.g., Technical University of Munich"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.university || ''}
            onChange={(e) => updateFormData('university', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Enter the name of your target university</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Program *</label>
          <input
            type="text"
            placeholder="e.g., MSc Computer Science"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.program || ''}
            onChange={(e) => updateFormData('program', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Enter your program/course name</p>
        </div>
      </div>

      

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Motivation *</label>
        <textarea
          placeholder="Why do you want to study this program? What drives your passion for this field?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
          value={formData.motivation || ''}
          onChange={(e) => updateFormData('motivation', e.target.value)}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile goals</p>
      </div>

      

      <div>
        <label className="block text-sm font-medium mb-1">Experience Summary</label>
        <textarea
          placeholder="Briefly describe your work/research experience relevant to this program (optional)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
          value={formData.experienceSummary || ''}
          onChange={(e) => updateFormData('experienceSummary', e.target.value)}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile experience</p>
      </div>
    </div>

    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Generation Settings</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.tone || 'PROFESSIONAL'}
            onChange={(e) => updateFormData('tone', e.target.value)}
          >
            <option value="PROFESSIONAL">Professional</option>
            <option value="FORMAL">Formal</option>
            <option value="CONVERSATIONAL">Conversational</option>
            <option value="ACADEMIC">Academic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Word Limit</label>
          <input
            type="number"
            placeholder="e.g., 800"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.wordLimit || '800'}
            onChange={(e) => updateFormData('wordLimit', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Additional Requirements</label>
        <textarea
          placeholder="e.g., Mention my keen interest in cloud architecture."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
          value={formData.additionalRequirements || ''}
          onChange={(e) => updateFormData('additionalRequirements', e.target.value)}
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">Any specific topics or instructions to include</p>
      </div>
    </div>
  </motion.div>
);

 const renderLORForm = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="space-y-6"
  >
    <h3 className="text-lg font-semibold">Letter of Recommendation Details</h3>

    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Recommender Information</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name of Senior Writing LOR *</label>
          <input
            type="text"
            placeholder="e.g., Prof. Dr. Mueller"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.seniorName || ''}
            onChange={(e) => updateFormData('seniorName', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Full name and title of the person writing the recommendation</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">University Name *</label>
          <input
            type="text"
            placeholder="e.g., Technical University of Munich"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.lorUniversityName || ''}
            onChange={(e) => updateFormData('lorUniversityName', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">University where the recommender works or student is applying to</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Field / Subject *</label>
          <input
            type="text"
            placeholder="e.g., Computer Science"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.lorField || ''}
            onChange={(e) => updateFormData('lorField', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">The academic field or subject area</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills *</label>
          <p className="text-xs text-gray-500 mb-2">Type a skill and press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 border rounded text-xs">Enter</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 border rounded text-xs">,</kbd> to add it</p>

          {/* Tag display */}
          {(formData.lorSkillsArray || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.lorSkillsArray || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => {
                      const arr = (formData.lorSkillsArray || []).filter((_, i) => i !== idx);
                      updateFormData('lorSkillsArray', arr);
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <input
            type="text"
            placeholder="e.g., Python, Machine Learning..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.lorSkillInput || ''}
            onChange={(e) => updateFormData('lorSkillInput', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = (formData.lorSkillInput || '').trim().replace(/,$/, '');
                if (val) {
                  const arr = [...(formData.lorSkillsArray || []), val];
                  updateFormData('lorSkillsArray', arr);
                  updateFormData('lorSkillInput', '');
                }
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile — add or remove skills as needed</p>
        </div>
      </div>
    </div>

    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Recommender &amp; Relationship Details</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recommender Designation</label>
          <input
            type="text"
            placeholder="e.g., Professor"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.recommenderDesignation || 'Professor'}
            onChange={(e) => updateFormData('recommenderDesignation', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Relationship Type</label>
          <input
            type="text"
            placeholder="e.g., Academic Advisor"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.relationshipType || 'Academic Advisor'}
            onChange={(e) => updateFormData('relationshipType', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Relationship Duration</label>
          <input
            type="text"
            placeholder="e.g., 2 years"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.relationshipDuration || '2 years'}
            onChange={(e) => updateFormData('relationshipDuration', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Recommendation Level</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.recommendationLevel || 'highly recommend'}
            onChange={(e) => updateFormData('recommendationLevel', e.target.value)}
          >
            <option value="highly recommend">Highly Recommend</option>
            <option value="recommend">Recommend</option>
            <option value="strongly recommend">Strongly Recommend</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tone</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
          value={formData.tone || 'PROFESSIONAL'}
          onChange={(e) => updateFormData('tone', e.target.value)}
        >
          <option value="PROFESSIONAL">Professional</option>
          <option value="FORMAL">Formal</option>
          <option value="CONVERSATIONAL">Conversational</option>
          <option value="ACADEMIC">Academic</option>
        </select>
      </div>
    </div>
  </motion.div>
);
 const renderCoverLetterForm = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="space-y-6"
  >
    <h3 className="text-lg font-semibold">Cover Letter Details</h3>

    {/* Passport */}
    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Student Information</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Passport Number *</label>
        <input
          type="text"
          placeholder="e.g., T1234567"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
          value={formData.passportNumber || ''}
          onChange={(e) => updateFormData('passportNumber', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
      </div>
    </div>

    {/* University & Course */}
    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">University & Course</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">University Name *</label>
          <input
            type="text"
            placeholder="e.g., Technical University of Munich"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.universityName || ''}
            onChange={(e) => updateFormData('universityName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">University Location *</label>
          <input
            type="text"
            placeholder="e.g., Munich, Germany"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.universityLocation || ''}
            onChange={(e) => updateFormData('universityLocation', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Course Name *</label>
          <input
            type="text"
            placeholder="e.g., MSc Computer Science"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.courseName || ''}
            onChange={(e) => updateFormData('courseName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Course Duration *</label>
          <input
            type="text"
            placeholder="e.g., 2 years"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.courseDuration || ''}
            onChange={(e) => updateFormData('courseDuration', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Course Start Date *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.courseStartDate || ''}
            onChange={(e) => updateFormData('courseStartDate', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tuition Fees (In EUR) *</label>
          <input
            type="text"
            placeholder="e.g., 1500"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.tuitionFees || ''}
            onChange={(e) => updateFormData('tuitionFees', e.target.value)}
          />
        </div>
      </div>
    </div>

    {/* Blocked Account */}
    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Blocked Account Details</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Blocked Account Bank *</label>
          <input
            type="text"
            placeholder="e.g., Expatrio"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.blockedAccountBank || ''}
            onChange={(e) => updateFormData('blockedAccountBank', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Blocked Account Balance *</label>
          <input
            type="text"
            placeholder="e.g., 11208 EUR"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.blockedAccountBalance || ''}
            onChange={(e) => updateFormData('blockedAccountBalance', e.target.value)}
          />
        </div>
      </div>
    </div>

    <div className="border-t pt-6">
      <h4 className="font-semibold mb-4 text-primary">Visa &amp; Generation Settings</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Visa Type</label>
          <input
            type="text"
            placeholder="e.g., National Visa for Study"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.visaType || 'National Visa for Study'}
            onChange={(e) => updateFormData('visaType', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
            value={formData.tone || 'PROFESSIONAL'}
            onChange={(e) => updateFormData('tone', e.target.value)}
          >
            <option value="PROFESSIONAL">Professional</option>
            <option value="FORMAL">Formal</option>
            <option value="CONVERSATIONAL">Conversational</option>
            <option value="ACADEMIC">Academic</option>
          </select>
        </div>
      </div>
    </div>
  </motion.div>
);

  const renderPrerequisiteModal = () => {
    if (!pendingToolId) return null;
    const currentTool = aiTools.find(tool => tool.id === pendingToolId);
    if (!currentTool) return null;

    let fields = [];
    if (pendingToolId === 'sop') {
      fields = [
        "Full Name", "Gender", "Nationality", "Home Country", "Working Professional", 
        "Degree Level", "Institution Name (Last institution)", "Graduation Year", 
        "CGPA or Percentage", "Motivation", "Experience", "Major Projects", 
        "Key Strengths", "IELTS / Exam Scores"
      ];
    } else if (pendingToolId === 'lor') {
      fields = [
        "Name", "Gender", "Location (Current location)", "Field in which you studied", 
        "Skills", "Projects"
      ];
    } else if (pendingToolId === 'cover') {
      fields = [
        "Name", "Gender", "Passport", "Nationality", "Sponsor Name", 
        "SSC School Name", "SSC Passing Month", "SSC Passing Year", 
        "HSC School Name", "HSC Passing Month", "HSC Passing Year", 
        "Bachelor's University Name", "Bachelor's University Course", "Bachelor's University CGPA"
      ];
    }

    return createPortal(
      <AnimatePresence>
        <motion.div
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-[#E08D3C]/5 dark:bg-[#E08D3C]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E08D3C]/15 text-[#E08D3C]">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Action Required</h3>
                  <p className="text-xs text-muted-foreground">Complete Profile Builder</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPrerequisiteModal(false)}>
                <X size={20} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Please fill these details perfectly in the <strong>Profile Builder</strong>, as they will be fetched directly from there for your {currentTool.name} generation:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {fields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-[#E08D3C] flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/profilebuilder')} className="w-full sm:w-auto">
                <User size={16} className="mr-2" />
                Go to Profile Builder
              </Button>
              <Button onClick={continueToGeneration} className="w-full sm:w-auto bg-[#E08D3C] hover:bg-[#c77a32] text-white">
                <CheckCircle size={16} className="mr-2" />
                I have filled these
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    , document.body);
  };



  const renderGenerationModal = () => {
    const currentTool = aiTools.find(tool => tool.id === selectedTool);
    if (!currentTool) return null;

    const IconComponent = currentTool.icon;
    const isPaymentRequired = currentTool.isPremium && !paymentStatus[selectedTool];

    return createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetGeneration();
            }
          }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white bg-gradient-to-r ${currentTool.bgGradient}`}>
                  <IconComponent size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    {currentTool.title}
                    {currentTool.isPremium && !paymentStatus[selectedTool] && (
                      <Lock size={16} className="text-yellow-600" />
                    )}
                    {paymentStatus[selectedTool] && (
                      <Unlock size={16} className="text-green-600" />
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {generationStep === 0.5 ? 'Payment Required' : 
                     generationStep === 0 ? 'Getting Started' :
                     `Step ${generationStep} of 3`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetGeneration}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {generationStep === 0.5 && renderPaymentModal()}
              
              {generationStep === 1 && (
                <>
                  {selectedTool === 'sop' && renderSOPForm()}
                  {selectedTool === 'lor' && renderLORForm()}
                  {selectedTool === 'cover' && renderCoverLetterForm()}
                </>
              )}

              {generationStep === 2 && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="space-y-6 text-center py-8"
  >
    {!generationError ? (
      // Loading state
      <>
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-200 border-t-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">AI is working its magic...</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Creating your personalized document using advanced AI algorithms
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            This may take 30-60 seconds. Please don't close this window.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Processing...</span>
            <span>{isGenerating ? 'In Progress' : 'Complete'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: isGenerating ? "75%" : "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </div>
      </>
    ) : (
      // Error state
      <>
        <div className="flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <X className="text-red-600 dark:text-red-400" size={32} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Generation Failed</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {generationError}
          </p>
        </div>

        {/* Retry and Cancel buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setGenerationError(null);
              setGenerationStep(1);
            }}
          >
            <ChevronLeft size={18} className="mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => {
              setGenerationError(null);
              simulateGeneration();
            }}
          >
            <RefreshCw size={18} className="mr-2" />
            Retry
          </Button>
        </div>
      </>
    )}
  </motion.div>
)}

              {generationStep === 3 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-2 text-green-600 mb-4">
      <CheckCircle size={20} />
      <span className="font-semibold">Document Generated Successfully!</span>
    </div>

    {/* Document Info Card */}
    <div className="border-2 border-primary/20 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${aiTools.find(t => t.id === selectedTool)?.bgGradient}`}>
          <FileText className="text-white" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-lg">
            {selectedTool === 'sop' ? 'Statement of Purpose' : 
             selectedTool === 'lor' ? 'Letter of Recommendation' : 
             'Cover Letter'}.docx
          </h4>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date().toLocaleDateString()} • {generatedContent?.wordCount || 0} words
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-muted-foreground text-center">
          Your document is ready! Click the buttons below to view or download.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          size="lg"
          className="w-full"
          onClick={() => {
            // Find the latest history entry for this tool and open the proper view modal
            const latest = docHistory.find(d => d.toolId === selectedTool);
            if (latest) {
              setViewingDoc(latest.id);
            }
          }}
        >
          <Eye size={18} className="mr-2" />
          View Document
        </Button>
        <Button 
          size="lg"
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => {
            if (generatedContent?.text) {
              // Create a proper Word document structure
              const formattedContent = generatedContent.text ? generatedContent.text.replace(/\n/g, '<br>') : '';
              const docContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                  <title>${selectedTool === 'sop' ? 'Statement of Purpose' : selectedTool === 'lor' ? 'Letter of Recommendation' : 'Cover Letter'}</title>
                  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
                </head>
                <body>
                  <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 2;">
                    ${formattedContent}
                  </div>
                </body>
                </html>
              `;
              
              const blob = new Blob([docContent], { type: 'application/msword' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const fileName = selectedTool === 'sop' ? 'Statement_of_Purpose.doc' : 
                              selectedTool === 'lor' ? 'Letter_of_Recommendation.doc' : 
                              'Cover_Letter.doc';
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }}
        >
          <Download size={18} className="mr-2" />
          Download as Word
        </Button>
      </div>
    </div>

    {/* Generate Another Button */}
    <div className="text-center pt-4">
      <Button
  variant="outline"
  onClick={() => {
    setPaymentStatus(prev => ({ ...prev, [selectedTool]: false }));
    setGenerationStep(1);
    setGeneratedContent(null);
  }}
>
  <RefreshCw size={18} className="mr-2" />
  Generate Another {selectedTool === 'sop' ? 'SOP' : selectedTool === 'lor' ? 'LOR' : 'Document'}
</Button>
    </div>
  </motion.div>
)}
            </div>

            {/* Footer Actions */}
            {(generationStep === 1 || generationStep === 3) && (
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-3">
                  {generationStep === 1 && (
  <>
    <Button
      variant="outline"
      className="w-full sm:flex-1"
      onClick={resetGeneration}
    >
      Cancel
    </Button>
    <Button
  size="lg"
  className="w-full sm:flex-1"
  onClick={() => {
    const tool = aiTools.find(t => t.id === selectedTool);
    
    // SOP validation
    if (selectedTool === 'sop') {
      const requiredFields = [
        { key: 'university', label: 'Target University' },
        { key: 'program', label: 'Program' },
        { key: 'degreeLevel', label: 'Degree Level' },
        { key: 'motivation', label: 'Motivation' },
        { key: 'careerGoals', label: 'Career Goals' },
      ];

      const missing = requiredFields.filter(f => !formData[f.key]).map(f => f.label);

      if (missing.length > 0) {
        alert(`Please fill in all required SOP fields:\n• ${missing.join('\n• ')}`);
        return;
      }
      
      if (tool.isPremium && !paymentStatus[selectedTool]) {
  setGenerationStep(0.5);
} else {
  setGenerationStep(2);
  setTimeout(() => simulateGeneration(), 100);
}
      return;
    }
    
    // LOR validation
    if (selectedTool === 'lor') {
      const lorRequired = [
        { key: 'seniorName', label: 'Name of Senior Writing LOR' },
        { key: 'lorUniversityName', label: 'University Name' },
        { key: 'lorField', label: 'Field / Subject' },
      ];

      const lorMissing = lorRequired.filter(f => !formData[f.key]).map(f => f.label);
      if (lorMissing.length > 0) {
        alert(`Please fill in all required LOR fields:\n• ${lorMissing.join('\n• ')}`);
        return;
      }

      const skillsArr = formData.lorSkillsArray || [];
      if (skillsArr.length === 0 && !(formData.lorSkills || '').trim()) {
        alert('Please add at least one skill.');
        return;
      }

      if (tool.isPremium && !paymentStatus[selectedTool]) {
        setGenerationStep(0.5);
      } else {
        setGenerationStep(2);
        setTimeout(() => simulateGeneration(), 100);
      }
      return;
    }
    
    // Cover Letter validation
    if (selectedTool === 'cover') {
      const coverRequired = [
        { key: 'passportNumber',       label: 'Passport Number' },
        { key: 'universityName',       label: 'University Name' },
        { key: 'universityLocation',   label: 'University Location' },
        { key: 'courseName',           label: 'Course Name' },
        { key: 'courseDuration',       label: 'Course Duration' },
        { key: 'courseStartDate',      label: 'Course Start Date' },
        { key: 'tuitionFees',          label: 'Tuition Fees' },
        { key: 'blockedAccountBank',   label: 'Blocked Account Bank' },
        { key: 'blockedAccountBalance', label: 'Blocked Account Balance' },
      ];

      const coverMissing = coverRequired.filter(f => !formData[f.key]).map(f => f.label);
      if (coverMissing.length > 0) {
        alert(`Please fill in all required fields:\n• ${coverMissing.join('\n• ')}`);
        return;
      }

      if (tool.isPremium && !paymentStatus[selectedTool]) {
  setGenerationStep(0.5);
} else {
  setGenerationStep(2);
  setTimeout(() => simulateGeneration(), 100);
}
      return;
    }
  }}
>
  Continue
  <ArrowRight size={16} className="ml-2" />
</Button>
  </>
)}
                  
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    , document.body);
  };

  const renderTemplates = () => (
    <AnimatePresence>
      {showTemplates && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6"
        >
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Available Templates</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
                className="sm:hidden"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-6">
              {Object.entries(templates).map(([type, typeTemplates]) => (
                <div key={type}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    {getToolIcon(type)}
                    {type.toUpperCase()} Templates
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {typeTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                      >
                        <h5 className="font-medium mb-1 text-sm sm:text-base">
                          {template.name}
                        </h5>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  

  // ── Inline view modal for history ────────────────────────────────────────
  const renderHistoryViewModal = () => {
    if (!viewingDoc) return null;
    const doc = docHistory.find(d => d.id === viewingDoc);
    if (!doc) return null;
    return createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setViewingDoc(null); }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-bold text-lg">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(doc.generatedAt).toLocaleString()} · {doc.wordCount} words
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}><X size={20} /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-sans" dangerouslySetInnerHTML={{ __html: doc.text }} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingDoc(null)}>Close</Button>
              <Button onClick={() => {
                const tool = aiTools.find(t => t.id === doc.toolId);
                const formattedText = doc.text ? doc.text.replace(/\n/g, '<br>') : '';
                const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>${doc.title}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--></head><body><div style="font-family:'Times New Roman',serif;font-size:12pt;line-height:2;">${formattedText}</div></body></html>`;
                const blob = new Blob([docContent], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${doc.title.replace(/\s+/g, '_')}_${new Date(doc.generatedAt).toLocaleDateString('en-GB').replace(/\//g, '-')}.doc`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                <Download size={16} className="mr-2" />Download as Word
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    , document.body);
  };

  // ── History tab panel ─────────────────────────────────────────────────────
  const renderHistoryTab = () => {
    const toolColors: Record<string, string> = {
      sop:   'from-blue-500 to-blue-600',
      lor:   'from-green-500 to-green-600',
      cover: 'from-purple-500 to-purple-600',
    };
    const toolBadgeColors: Record<string, string> = {
      sop:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      lor:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      cover: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    };

    if (docHistory.length === 0) {
      return (
        <motion.div
          className="flex flex-col items-center justify-center py-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
            <History size={36} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Documents you generate with the AI tools will appear here for easy access.
          </p>
          <Button className="mt-6" onClick={() => setActiveTab('tools')}>
            <Sparkles size={16} className="mr-2" />Go to AI Tools
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{docHistory.length} document{docHistory.length !== 1 ? 's' : ''} generated</p>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => {
              if (confirm('Clear all history? This cannot be undone.')) {
                setDocHistory([]);
                localStorage.removeItem('aitools_history');
              }
            }}
          >
            <X size={14} className="mr-1" />Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docHistory.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className="p-5 flex flex-col gap-3 bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500"
                style={{ background: doc.toolId.includes('sop') ? "linear-gradient(160deg, #eff6ff 0%, #ffffff 60%, #dbeafe 100%)" : doc.toolId.includes('lor') ? "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #dcfce7 100%)" : "linear-gradient(160deg, #faf5ff 0%, #ffffff 60%, #f3e8ff 100%)" }}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${toolColors[doc.toolId] || 'from-gray-400 to-gray-500'}`}>
                    <FileText size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${toolBadgeColors[doc.toolId] || 'bg-gray-100 text-gray-700'}`}>
                        {doc.toolName}
                      </span>
                      <span className="text-xs text-muted-foreground">{doc.wordCount} words</span>
                    </div>
                    <h4 className="font-semibold text-sm truncate">{doc.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Clock size={10} className="inline mr-1" />
                      {new Date(doc.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Preview snippet */}
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-2">
                  {doc.text.replace(/<[^>]*>?/gm, '').slice(0, 180)}{doc.text.replace(/<[^>]*>?/gm, '').length > 180 ? '…' : ''}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewingDoc(doc.id)}>
                    <Eye size={14} className="mr-1" />View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                    const formattedText = doc.text ? doc.text.replace(/\n/g, '<br>') : '';
                    const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>${doc.title}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--></head><body><div style="font-family:'Times New Roman',serif;font-size:12pt;line-height:2;">${formattedText}</div></body></html>`;
                    const blob = new Blob([docContent], { type: 'application/msword' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${doc.title.replace(/\s+/g, '_')}.doc`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}>
                    <Download size={14} className="mr-1" />Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                    onClick={() => {
                      const updated = docHistory.filter(d => d.id !== doc.id);
                      setDocHistory(updated);
                      try { localStorage.setItem('aitools_history', JSON.stringify(updated)); } catch {}
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // ── Manual Tools data ─────────────────────────────────────────────────────
  const manualTools = [
    {
      id: 'manual_sop',
      name: 'SOP Generator',
      title: 'Statement of Purpose',
      description: 'A compelling Statement of Purpose personally written by our expert consultants, tailored to your target university and program.',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      bgGradient: 'from-blue-500 to-blue-600',
      price: '₹1',
      priceValue: 1,
      deliveryTime: '24–48 hours',
      checklist: [
        'Updated Resume/CV',
        'Academic Transcripts (Latest)',
        'Name of Target University and specific Program',
        'Brief summary of your motivation, projects, and career goals'
      ],
    },
    {
      id: 'manual_lor',
      name: 'LOR Generator',
      title: 'Letter of Recommendation',
      description: 'A professional Letter of Recommendation drafted by our specialists with the right tone, structure and academic language.',
      icon: User,
      color: 'bg-green-100 text-green-600',
      bgGradient: 'from-green-500 to-green-600',
      price: '₹1',
      priceValue: 1,
      deliveryTime: '24–48 hours',
      checklist: [
        'Recommender\'s Full Name & Official Designation',
        'Your Academic Transcripts',
        'Updated Resume/CV',
        'Key Skills, Projects, or Achievements you want highlighted'
      ],
    },
    {
      id: 'manual_cover',
      name: 'Cover Letter Generator',
      title: 'Cover Letter',
      description: 'A tailored Cover Letter for your university/visa application, crafted by our experienced consultants to make a strong impression.',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      bgGradient: 'from-purple-500 to-purple-600',
      price: '₹1',
      priceValue: 1,
      deliveryTime: '24–48 hours',
      checklist: [
        'Updated Resume/CV',
        'Passport Copy (if applying for Visa)',
        'University Admission Letter (if applicable)',
        'Details of Blocked Account / Finances (if applicable)'
      ],
    },
  ];

  // ── Manual Tool Request Modal ──────────────────────────────────────────────
  const renderManualToolModal = () => {
    if (!manualToolModal) return null;
    const tool = manualTools.find(t => t.id === manualToolModal);
    if (!tool) return null;
    const IconComponent = tool.icon;

    return createPortal(
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setManualToolModal(null); setManualSubmitted(false); } }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.bgGradient}`}>
                  <IconComponent size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{tool.name} — Manual Request</h3>
                  <p className="text-xs text-muted-foreground">Delivery: {tool.deliveryTime} · {tool.price}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setManualToolModal(null); setManualSubmitted(false); }}>
                <X size={20} />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {manualSubmitted ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-10 text-center gap-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-green-700 dark:text-green-400">Payment Successful!</h4>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    Your payment was successful. We have opened your email client to send the required documents. If it didn't open automatically, please email us directly with the requested documents.
                  </p>
                  <Button className="mt-4 w-full" onClick={() => { setManualToolModal(null); setManualSubmitted(false); }}>
                    Close
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                    <Shield size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      To begin crafting your <strong>{tool.name}</strong>, we need a few documents from you. After completing the payment, your email client will automatically open so you can securely attach and send us the required items.
                    </p>
                  </div>

                  {/* Document Checklist */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      Required Documents Checklist
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                      <ul className="space-y-3">
                        {tool.checklist.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Important Note */}
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Please ensure you have these documents ready to attach to the email after payment.
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            {!manualSubmitted && (
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <RazorpayButton
                  amount={tool.priceValue * 100}
                  label={`Pay ${tool.price} & Proceed`}
                  description={`${tool.name} Manual Service — Uni360`}
                  notes={{ purpose: `${tool.name} Manual Access`, toolId: tool.id, section: "AI_TOOLS" }}
                  receipt={`manual_tool_${tool.id}_${Date.now()}`}
                  paymentType="AI_TOOLS"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
                  onSuccess={(paymentData) => {
                    console.log('Manual Tool Payment Success:', paymentData);
                    setManualSubmitted(true);
                    
                    // Format checklist for email body
                    const checklistText = tool.checklist.map(item => `• ${item}`).join('%0D%0A');
                    const subject = encodeURIComponent(`Documents for ${tool.title} Application`);
                    const body = encodeURIComponent(`Hi Uni360 Support Team,%0D%0A%0D%0AHere are the required documents for my ${tool.title} request.%0D%0A%0D%0APayment Reference ID: ${paymentData.razorpay_payment_id}%0D%0A%0D%0AI have attached the following items:%0D%0A${checklistText}%0D%0A%0D%0A[Please attach your files here before sending]%0D%0A%0D%0AThank you!`);
                    
                    // Open mail client
                    window.location.href = `mailto:support@uni360degree.com?subject=${subject}&body=${body}`;
                  }}
                  onFailure={(err) => {
                    console.error('Payment failed', err);
                    alert("Payment failed. Please try again.");
                  }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    , document.body);
  };

  // ── Manual Tools Section renderer ─────────────────────────────────────────
  const renderManualToolsSection = () => (
    <motion.div
      className="mt-12 space-y-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      {/* Section Header */}
      <div className="flex flex-col items-center justify-center mb-8 mt-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E08D3C]/10 text-[#E08D3C] mb-4">
          <BookOpen size={24} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">Manual Services</h2>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base px-4">
          Prefer a human touch? Our expert team can manually craft and perfect your documents within 24-48 hours.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex-shrink-0 flex items-center justify-center">
          <Shield size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">How Manual AI Tools Work</h4>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            Unlike our instant AI generators, these documents are <strong>personally crafted by our expert admin team</strong>. 
            Simply complete the payment, and your email client will automatically open so you can attach and send us your required documents directly. 
            Your polished document will be delivered to your registered email within <strong>24–48 hours</strong>.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { icon: CheckCircle, text: 'Expert-level quality' },
              { icon: Shield, text: 'Secure & confidential' },
              { icon: Clock, text: '24–48 hr delivery' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <Icon size={13} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Tool Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {manualTools.map((tool, idx) => {
          const IconComponent = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Card 
                className="p-5 sm:p-6 h-full flex flex-col bg-white dark:bg-[#121212] border border-[#E08D3C]/20 shadow-sm hover:shadow-[0_8px_30px_rgb(224,141,60,0.12)] hover:border-[#E08D3C]/60 transition-all duration-300 relative rounded-2xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E08D3C]/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E08D3C]/10 flex items-center justify-center flex-shrink-0 text-[#E08D3C]">
                    <IconComponent size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight group-hover:text-[#E08D3C] transition-colors duration-300">{tool.name}</h3>
                    <div className="text-xs font-semibold text-[#E08D3C] uppercase tracking-wider mt-1">Delivered in {tool.deliveryTime}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{tool.price}</div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-6 flex-1 leading-relaxed">
                  {tool.description}
                </p>

                {/* Steps */}
                <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50">
                  {['View document checklist', 'Complete secure payment', 'Email us your details', 'Receive final document'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500">
                        {i + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full rounded-xl bg-[#E08D3C] text-white hover:bg-[#c97b31] shadow-sm hover:shadow-md transition-all h-12 text-sm font-semibold border-none"
                  onClick={() => { setManualToolModal(tool.id); setManualFormData({}); setManualSubmitted(false); }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Request Service
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div 
        className="text-center max-w-2xl mx-auto"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">AI-Powered Tools</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Generate professional documents with our AI assistants
        </p>
      </motion.div>

      {/* Important Note Alert */}
<motion.div
  className="max-w-3xl mx-auto"
  initial={{ y: -10, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-lg">
    <div className="flex items-start gap-3">
      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1 text-sm sm:text-base">
        Important: Complete Your Profile First
        </h3>
        <p className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm leading-relaxed">
          Please fill out your <strong>Profile Builder</strong> with <strong>accurate and detailed information</strong> before using these AI tools. The quality and accuracy of generated documents depend entirely on your profile data. Incomplete or vague information will result in poorly generated documents.
        </p>
      </div>
    </div>
  </div>
</motion.div>

      {/* Prerequisite Modal */}
      {showPrerequisiteModal && renderPrerequisiteModal()}

      {/* Tab Switcher */}
      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'tools'
                ? 'bg-white dark:bg-gray-700 shadow text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={15} />
            AI Tools
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-gray-700 shadow text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History size={15} />
            History
            {docHistory.length > 0 && (
              <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {docHistory.length}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Mobile Action Buttons — only in tools tab */}
      {activeTab === 'tools' && (
        <div className="flex flex-wrap gap-2 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Eye size={16} className="mr-1" />
            Templates
          </Button>
        </div>
      )}

      

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tools' ? (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* AI Tools Grid */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {aiTools.map((tool, index) => {
                const IconComponent = tool.icon;
                const isUnlocked = !tool.isPremium || paymentStatus[tool.id];
                
                return (
                  <motion.div
                    key={tool.id}
                    variants={item}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className="p-4 sm:p-6 h-full flex flex-col bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-md hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500 relative"
                      style={{ background: tool.id.includes('sop') ? "linear-gradient(160deg, #eff6ff 0%, #ffffff 60%, #dbeafe 100%)" : tool.id.includes('lor') ? "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #dcfce7 100%)" : "linear-gradient(160deg, #faf5ff 0%, #ffffff 60%, #f3e8ff 100%)" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${tool.color}`}>
                          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        {tool.isPremium && !isUnlocked && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{tool.price}</div>
                            <div className="text-xs text-gray-500">one-time</div>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg sm:text-xl mb-2">{tool.name}</h3>
                      <p className="text-muted-foreground text-sm sm:text-base mb-4 flex-1">{tool.description}</p>
                      
                      <div className="space-y-2 mb-4 sm:mb-6">
                        {tool.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                            <CheckCircle size={13} className="text-[#E08D3C] flex-shrink-0" />
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full rounded-xl group"
                        onClick={() => startGeneration(tool.id)}
                        variant={tool.isPremium && !isUnlocked ? 'default' : 'default'}
                      >
                        {tool.isPremium && !isUnlocked ? (
                          <><CreditCard className="w-4 h-4 mr-2" />Buy & Open Tool</>
                        ) : (
                          <>Open Tool<ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Templates Section */}
            {renderTemplates()}

            {/* ── Manual AI Tools Section ── */}
            {renderManualToolsSection()}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderHistoryTab()}
          </motion.div>
        )}
      </AnimatePresence>

     

      {/* Generation Modal */}
      {selectedTool && renderGenerationModal()}

      {/* History view modal */}
      {renderHistoryViewModal()}

      {/* Manual Tool Request Modal */}
      {/* Manual Tool Request Modal */}
      {renderManualToolModal()}

      {/* Generation Error Modal */}
      {errorModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center gap-4 border border-red-100">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Generation Failed</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Something went wrong while generating your document. Please make sure your
              <strong> Profile Builder</strong> is completely filled with accurate details, and all
              <strong> form fields</strong> in this tool are properly filled before trying again.
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => { setErrorModal(false); setGenerationStep(1); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Fix Form
              </button>
              <button
                onClick={() => { setErrorModal(false); resetGeneration(); navigate('/profilebuilder'); }}
                className="flex-1 px-4 py-2 bg-[#E08D3C] text-white rounded-xl hover:bg-[#c77a32] transition-colors text-sm font-medium"
              >
                Go to Profile Builder
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:hidden" />
    </motion.div>
  );
};

export default AITools;   
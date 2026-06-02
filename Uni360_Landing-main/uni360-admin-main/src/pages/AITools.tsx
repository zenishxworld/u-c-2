import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createPortal } from "react-dom";
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
  Loader2,
} from "lucide-react";
import { apiRequest } from "../services/api";

/* ─────────────────────────────────────────────────────────────── */
/*  Smart response-text extractor                                   */
/* ─────────────────────────────────────────────────────────────── */

/** Recursively search a response object for the first non-empty string value */
function extractText(val: unknown): string | null {
  if (typeof val === "string") {
    let trimmed = val.trim();
    
    // Attempt to extract JSON from strings that have trailing text (like "385 words") or markdown blocks
    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const inner = extractText(parsed);
        if (inner) return inner;
      } catch { /* not valid JSON, fall through */ }
    }
    
    // A real document will be significantly longer than a short status message "LOR generated successfully"
    if (trimmed.length > 50) return trimmed;
  }
  if (val && typeof val === "object") {
    // 1. Strongly preferred keys that mean "This is the document"
    const preferred = [
      "generatedLor", "generatedSop", "generatedCoverLetter",
      "generatedlor", "generatedsop", "generatedcoverletter",
      "lor", "sop", "statementOfPurpose", "coverLetter", "cover_letter",
      "content", "generatedContent", "text", "generatedText",
      "result", "output", "letter", "document", "body",
    ];
    
    for (const k of preferred) {
      if (k in val) {
        const found = extractText((val as Record<string, unknown>)[k]);
        if (found) return found;
      }
    }
    
    // 2. Wrapers: If it is nested inside another key like "data" or "response", drill down
    const wrappers = ["data", "response", "payload", "choice", "message"];
    for (const k of wrappers) {
      if (k in val) {
        const found = extractText((val as Record<string, unknown>)[k]);
        if (found) return found;
      }
    }

    // 3. Fallback: iterate all remaining keys, skip booleans/numbers
    for (const k of Object.keys(val)) {
      const v = (val as Record<string, unknown>)[k];
      if (typeof v === "boolean" || typeof v === "number") continue;
      const found = extractText(v);
      if (found) return found;
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Inline markdown renderer helpers                               */
/* ─────────────────────────────────────────────────────────────── */

/** Render a single text segment, converting **bold** to <strong> */
function renderInline(text: string, key: number) {
  const parts: React.ReactNode[] = [];
  const boldRe = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={`t${key}-${i++}`}>{text.slice(last, m.index)}</span>);
    parts.push(<strong key={`b${key}-${i++}`} className="font-semibold">{m[1]}</strong>);
    last = boldRe.lastIndex;
  }
  if (last < text.length) parts.push(<span key={`t${key}-${i}`}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

/** Turn a raw AI response string into nicely formatted JSX nodes */
function parseDocumentContent(raw: string): React.ReactNode[] {
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let bulletGroup: string[] = [];

  const flushBullets = (key: number) => {
    if (!bulletGroup.length) return;
    nodes.push(
      <ul key={`ul-${key}`} className="list-disc list-inside space-y-1 my-3 pl-2">
        {bulletGroup.map((b, i) => (
          <li key={i} className="text-gray-800 dark:text-gray-200 leading-relaxed text-[13.5px]">
            {renderInline(b, i)}
          </li>
        ))}
      </ul>
    );
    bulletGroup = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();

    // H1
    if (/^# /.test(line)) {
      flushBullets(idx);
      nodes.push(
        <h1 key={idx} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2 tracking-tight">
          {renderInline(line.replace(/^# /, ""), idx)}
        </h1>
      );
      return;
    }
    // H2
    if (/^## /.test(line)) {
      flushBullets(idx);
      nodes.push(
        <h2 key={idx} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-1.5 border-b border-gray-200 dark:border-gray-700 pb-1">
          {renderInline(line.replace(/^## /, ""), idx)}
        </h2>
      );
      return;
    }
    // H3
    if (/^### /.test(line)) {
      flushBullets(idx);
      nodes.push(
        <h3 key={idx} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-1">
          {renderInline(line.replace(/^### /, ""), idx)}
        </h3>
      );
      return;
    }
    // Bullet / dash / star
    if (/^[-*•] /.test(line)) {
      bulletGroup.push(line.replace(/^[-*•] /, ""));
      return;
    }
    // Blank line – flush bullets and add spacing
    if (line.trim() === "") {
      flushBullets(idx);
      nodes.push(<div key={idx} className="h-2" />);
      return;
    }
    // Regular paragraph
    flushBullets(idx);
    nodes.push(
      <p key={idx} className="text-gray-800 dark:text-gray-200 leading-[1.85] text-[13.5px] mb-2">
        {renderInline(line, idx)}
      </p>
    );
  });

  flushBullets(lines.length);
  return nodes;
}

/** Strip markdown symbols for plain-text Word export */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,3} /gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^[-*•] /gm, "• ");
}

/* ─────────────────────────────────────────────────────────────── */
/*  Highlight Post-processor                                        */
/* ─────────────────────────────────────────────────────────────── */
function highlightOutput(text: string, tool: string, formData: Record<string, string | boolean>) {
  if (!text) return text;
  let result = text;
  
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightField = (fieldName: string) => {
    const val = formData[fieldName];
    if (val && typeof val === 'string' && val.trim().length > 1) {
      const regex = new RegExp(`(${escapeRegex(val.trim())})`, 'gi');
      result = result.replace(regex, (match, p1, offset, string) => {
        // Check if already bolded
        if (string.substring(offset - 2, offset) === '**' && string.substring(offset + match.length, offset + match.length + 2) === '**') {
          return match;
        }
        return `**${match}**`;
      });
    }
  };

  if (tool === 'sop') {
    ['university', 'degreeLevel', 'program', 'workExperience', 'ielts_score', 'german_language_level', 'areasOfInterest'].forEach(highlightField);
  } else if (tool === 'lor') {
    ['universityName', 'location', 'field', 'skills'].forEach(highlightField);
  } else if (tool === 'cover') {
    ['courseName', 'universityName', 'universityLocation', 'tuitionFees', 'blockedAccountBankName', 'blockedAccountBalance'].forEach(highlightField);
  }

  return result;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Utilities                                                       */
/* ─────────────────────────────────────────────────────────────── */

/** Download a plain-text string as a properly formatted .doc Word file */
function downloadAsWord(content: string, filename: string) {
  const paragraphs = content
    .split(/\n/)
    .map((line) => {
      let escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
      escaped = escaped.replace(/^### (.+)/, "<b>$1</b>");
      escaped = escaped.replace(/^## (.+)/, "<b style='font-size:14pt'>$1</b>");
      escaped = escaped.replace(/^# (.+)/, "<b style='font-size:16pt'>$1</b>");
      escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      escaped = escaped.replace(/^[-*•] (.+)/, "&bull; $1");
      
      return `<p style="margin:0 0 8pt 0;line-height:1.6;">${escaped || "&nbsp;"}</p>`;
    })
    .join("\n");

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${filename}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Normal</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { margin: 1in; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    color: #000;
    line-height: 1.6;
  }
  p { margin: 0 0 8pt 0; }
</style>
</head>
<body>
${paragraphs}
</body>
</html>`;

  const blob = new Blob(["\uFEFF" + html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Loading-step messages                                           */
/* ─────────────────────────────────────────────────────────────── */
const LOADING_STEPS = [
  "Understanding your profile…",
  "Crafting your narrative…",
  "Refining tone and language…",
  "Polishing structure and flow…",
  "Finalising your document…",
];

/* ─────────────────────────────────────────────────────────────── */
/*  Main Component                                                  */
/* ─────────────────────────────────────────────────────────────── */
const AITools = () => {
  /* ── Core wizard state ── */
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0); // 0=closed 1=form 2=loading/result
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});

  /* ── Result / error state ── */
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  /* ── View-document modal ── */
  const [showViewModal, setShowViewModal] = useState(false);

  /* ── Loading animation ── */
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Validation errors ── */
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /* ── Session history ── */
  type HistoryItem = {
    id: string;
    type: string;
    title: string;
    content: string;
    createdAt: string;
    wordCount: number;
  };
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('aitools_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [historyViewItem, setHistoryViewItem] = useState<HistoryItem | null>(null);

  /* ─────────────────────── AI tools metadata ─────────────────── */
  const aiTools = [
    {
      id: "sop",
      name: "SOP Generator",
      title: "Statement of Purpose Generator",
      description:
        "Create compelling Statements of Purpose tailored to your target universities",
      icon: FileText,
      features: [
        "University-specific customisation",
        "Multiple tone options",
        "Real-time preview",
        "Word export",
      ],
      color: "bg-blue-100 text-blue-600",
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      id: "lor",
      name: "LOR Generator",
      title: "Letter of Recommendation Assistant",
      description:
        "Generate professional Letters of Recommendation with proper formatting",
      icon: User,
      features: [
        "Academic / Professional templates",
        "Multiple formats",
        "Word export",
        "Fully customisable",
      ],
      color: "bg-green-100 text-green-600",
      bgGradient: "from-green-500 to-green-600",
    },
    {
      id: "cover",
      name: "Cover Letter Generator",
      title: "Professional Cover Letter Generator",
      description:
        "Create compelling cover letters tailored to your visa applications",
      icon: Briefcase,
      features: [
        "Visa-specific customisation",
        "Multiple formats",
        "Real-time preview",
        "Word export",
      ],
      color: "bg-purple-100 text-purple-600",
      bgGradient: "from-purple-500 to-purple-600",
    },
  ];

  /* ─────────────────────── Helpers ─────────────────────────────── */
  const getToolIcon = (type: string) => {
    switch (type) {
      case "sop":
        return <FileText size={16} className="text-blue-600" />;
      case "lor":
        return <User size={16} className="text-green-600" />;
      case "cover":
        return <Briefcase size={16} className="text-purple-600" />;
      default:
        return <Bot size={16} className="text-gray-600" />;
    }
  };

  const getDocumentFilename = () => getFilenameForType(selectedTool || "");

  const getFilenameForType = (type: string) => {
    const names: Record<string, string> = {
      sop: "Statement_of_Purpose",
      lor: "Letter_of_Recommendation",
      cover: "Cover_Letter",
    };
    return names[type] || "AI_Generated_Document";
  };

  /* ─────────────────────── Form helpers ────────────────────────── */
  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors.length) setValidationErrors([]);
  };

  /* ─────────────────────── Validation ─────────────────────────── */
  const validateSOP = () => {
    const required = [
      "fullName",
      "nationality",
      "homeCountry",
      "intendedCountry",
      "university",
      "degreeLevel",
      "program",
      "fieldOfStudy",
      "institutionName",
      "graduationYear",
      "motivation",
      "areasOfInterest",
      "whyProgram",
      "whyUniversity",
      "shortTermGoal",
      "longTermGoal",
      "returnReason",
      "keyStrengths",
    ];
    return required.filter((k) => !String(formData[k] || "").trim());
  };

  const validateLOR = () => {
    const required = [
      "seniorName",
      "studentName",
      "universityName",
      "location",
      "field",
      "skills",
    ];
    return required.filter((k) => !String(formData[k] || "").trim());
  };

  const validateCover = () => {
    const required = [
      "studentName",
      "passportNumber",
      "courseName",
      "universityName",
      "universityLocation",
      "courseDuration",
      "courseStartDate",
      "tuitionFees",
      "blockedAccountBankName",
      "blockedAccountBalance",
      "sponsorName",
      "sscSchoolName",
      "sscPassingDate",
      "sscMarks",
      "hscSchoolName",
      "hscPassingDate",
      "hscMarks",
      "bachelorsUniversityName",
      "bachelorsCourseName",
      "bachelorsCGPA",
    ];
    return required.filter((k) => !String(formData[k] || "").trim());
  };

  const buildSOPPayload = () => {
    const boldInstruction = "Please highlight the following details in the output with bold letters: University, Degree Level, Program, Work Experience, IELTS score, German language level, and Areas of Interest.";
    const userReq = formData.sop_additional_requirements ? String(formData.sop_additional_requirements).trim() : "";
    return {
      fullName: formData.fullName,
      gender: formData.gender || "",
      nationality: formData.nationality,
      homeCountry: formData.homeCountry,
      intendedCountry: formData.intendedCountry,
      current_status: formData.current_status || "",
      university: formData.university,
      degreeLevel: formData.degreeLevel,
      program: formData.program,
      fieldOfStudy: formData.fieldOfStudy,
      institutionName: formData.institutionName,
      graduationYear: formData.graduationYear,
      cgpa_or_percentage: formData.cgpa_or_percentage || "",
      motivation: formData.motivation,
      experienceType: formData.experienceType || "Internship",
      workExperience: formData.workExperience || "",
      experience_details: formData.experience_details || "",
      major_projects: formData.major_projects || "",
      areasOfInterest: formData.areasOfInterest,
      whyProgram: formData.whyProgram,
      whyUniversity: formData.whyUniversity,
      keyStrengths: formData.keyStrengths,
      shortTermGoal: formData.shortTermGoal,
      longTermGoal: formData.longTermGoal,
      returnReason: formData.returnReason,
      internship_details: formData.internship_details || "",
      certifications: formData.certifications || "",
      why_country: formData.why_country || "",
      challenges_overcome: formData.challenges_overcome || "",
      ielts_score: formData.ielts_score || "",
      german_language_level: formData.german_language_level || "",
      tone: formData.sop_tone || "PROFESSIONAL",
      word_limit: formData.sop_word_limit ? parseInt(formData.sop_word_limit as string) : 800,
      additional_requirements: userReq ? `${userReq}\n\n${boldInstruction}` : boldInstruction,
    };
  };

  const buildLORPayload = () => {
    const boldInstruction = "Please highlight the following details in the output with bold letters: University Name, Location, Field, and Best at (Skills).";
    const userReq = formData.lor_additional_requirements ? String(formData.lor_additional_requirements).trim() : "";
    return {
      "Name of the senior writing LOR": formData.seniorName,
      "Student Name": formData.studentName,
      "Gender": formData.lorGender || "",
      "University Name": formData.universityName,
      "Location": formData.location,
      "Field": formData.field,
      "Recommender Designation": formData.recommenderDesignation || "",
      "Relationship Type": formData.relationshipType || "",
      "Relationship Duration": formData.relationshipDuration || "",
      "Best at (Skills)": formData.skills,
      "Projects (Optional)": formData.projects || "",
      "Recommendation Level": formData.recommendationLevel || "strongly recommend",
      "Analytical Skills": formData.analyticalSkills || "",
      "Leadership Skills": formData.leadershipSkills || "",
      "Teamwork": formData.teamwork || "",
      "Research Ability": formData.researchAbility || "",
      "Class Rank": formData.classRank || "",
      "tone": formData.lor_tone || "ACADEMIC",
      "word_limit": formData.lor_word_limit ? parseInt(formData.lor_word_limit as string) : 400,
      "additional_requirements": userReq ? `${userReq}\n\n${boldInstruction}` : boldInstruction,
    };
  };

  const buildCoverPayload = () => {
    const boldInstruction = "Please highlight the following details in the output with bold letters: Course Name, University Name, University Location, Tuition Fees, Blocked Account Bank Name, and Blocked Account Balance.";
    const userReq = formData.cover_additional_requirements ? String(formData.cover_additional_requirements).trim() : "";
    return {
      "Student Name": formData.studentName,
      "Gender": formData.coverGender || "",
      "Passport Number": formData.passportNumber,
      "Nationality": formData.coverNationality || "",
      "Target Country": formData.targetCountry || "",
      "Visa Type": formData.visaType || "",
      "Course Name": formData.courseName,
      "University Name": formData.universityName,
      "University Location": formData.universityLocation,
      "Course Duration": formData.courseDuration,
      "Course Start Date": formData.courseStartDate,
      "Tuition Fees": formData.tuitionFees,
      "Blocked Account Bank Name": formData.blockedAccountBankName,
      "Blocked Account Balance": formData.blockedAccountBalance,
      "Sponsor Name": formData.sponsorName,
      "Source of Funds": formData.sourceOfFunds || "",
      "Accommodation Details": formData.accommodationDetails || "",
      "Gap Reason": formData.gapReason || "",
      "Current Company": formData.currentCompany || "",
      "Future Return Plan": formData.futureReturnPlan || "",
      "SSC School Name": formData.sscSchoolName,
      "SSC Passing Month and Year": formData.sscPassingDate,
      "SSC Marks or Percentage": formData.sscMarks,
      "HSC School Name": formData.hscSchoolName,
      "HSC Passing Month and Year": formData.hscPassingDate,
      "HSC Marks or Percentage": formData.hscMarks,
      "Bachelors University Name": formData.bachelorsUniversityName,
      "Bachelors Course Name": formData.bachelorsCourseName,
      "Bachelors Course Percentage or CGPA": formData.bachelorsCGPA,
      "tone": formData.cover_tone || "FORMAL",
      "word_limit": formData.cover_word_limit ? parseInt(formData.cover_word_limit as string) : 600,
      "additional_requirements": userReq ? `${userReq}\n\n${boldInstruction}` : boldInstruction,
    };
  };

  /* ─────────────────────── Start loading ticker ────────────────── */
  const startLoadingTicker = () => {
    setLoadingStep(0);
    let idx = 0;
    loadingInterval.current = setInterval(() => {
      idx = Math.min(idx + 1, LOADING_STEPS.length - 1);
      setLoadingStep(idx);
    }, 7000);
  };

  const stopLoadingTicker = () => {
    if (loadingInterval.current) {
      clearInterval(loadingInterval.current);
      loadingInterval.current = null;
    }
  };

  /* ─────────────────────── Generate ────────────────────────────── */
  const handleGenerate = async () => {
    // Validate first
    let errors: string[] = [];
    if (selectedTool === "sop") errors = validateSOP();
    else if (selectedTool === "lor") errors = validateLOR();
    else if (selectedTool === "cover") errors = validateCover();

    if (errors.length) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setGenerateError(null);
    setGeneratedContent(null);
    setIsGenerating(true);
    setGenerationStep(2);
    startLoadingTicker();

    try {
      let endpoint = "";
      let payload: Record<string, any> = {};

      if (selectedTool === "sop") {
        endpoint = "/api/v1/admin/ai/sop/generate";
        payload = buildSOPPayload();
      } else if (selectedTool === "lor") {
        endpoint = "/api/v1/admin/ai/lor/generate";
        payload = buildLORPayload();
      } else if (selectedTool === "cover") {
        endpoint = "/api/v1/admin/ai/cover-letter/generate";
        payload = buildCoverPayload();
      }

      const response = await apiRequest(endpoint, "POST", payload);

      // Recursively extract the first meaningful string from anywhere in the response
      let text = extractText(response);

      if (!text) throw new Error("No content in server response.");
      
      // Dynamically highlight fields
      if (selectedTool) {
        text = highlightOutput(text, selectedTool, formData);
      }

      setGeneratedContent(text);

      // Save to session history
      const toolLabels: Record<string, string> = { sop: "SOP", lor: "LOR", cover: "Cover Letter" };
      const label = toolLabels[selectedTool!] || "Document";
      const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      setHistoryItems((prev) => {
        const updated = [
          {
            id: Date.now().toString(),
            type: selectedTool!,
            title: `${label} – ${date}`,
            content: text,
            createdAt: new Date().toISOString(),
            wordCount: text.trim().split(/\s+/).length,
          },
          ...prev,
        ];
        try { localStorage.setItem('aitools_history', JSON.stringify(updated)); } catch {}
        return updated;
      });
    } catch (err: any) {
      setGenerateError(
        err?.message || "Failed to generate document. Please try again."
      );
    } finally {
      stopLoadingTicker();
      setIsGenerating(false);
    }
  };

  /* ─────────────────────── Wizard control ──────────────────────── */
  const startGeneration = (toolId: string) => {
    setSelectedTool(toolId);
    setGenerationStep(1);
    setFormData({});
    setGeneratedContent(null);
    setGenerateError(null);
    setValidationErrors([]);
  };

  const resetGeneration = () => {
    stopLoadingTicker();
    setSelectedTool(null);
    setGenerationStep(0);
    setIsGenerating(false);
    setFormData({});
    setGeneratedContent(null);
    setGenerateError(null);
    setValidationErrors([]);
    setShowViewModal(false);
  };

  /* cleanup on unmount */
  useEffect(() => () => stopLoadingTicker(), []);

  useEffect(() => {
  if (selectedTool) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => { document.body.style.overflow = ''; };
}, [selectedTool]);

useEffect(() => {
  if (showViewModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => { document.body.style.overflow = ''; };
}, [showViewModal]);

  /* ═══════════════════════════════════════════════════════════════ */
  /*  FORM RENDERERS                                                  */
  /* ═══════════════════════════════════════════════════════════════ */

  /* ── Shared input styles (red when field has error) ── */
  const inpCls = (field?: string) =>
    [
      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 text-sm transition-colors",
      field && validationErrors.includes(field)
        ? "border-red-400 dark:border-red-500 focus:ring-red-400 bg-red-50 dark:bg-red-900/10"
        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500",
    ].join(" ");

  const taCls = (field?: string) => inpCls(field) + " resize-none";

  /* ─────────────────────── SOP Form ────────────────────────────── */
  const renderSOPForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold">Statement of Purpose Details</h3>

      {/* Personal Information */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Personal Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input type="text" placeholder="Your full name" className={inpCls("fullName")}
              value={(formData.fullName as string) || ""}
              onChange={(e) => updateFormData("fullName", e.target.value)} />
            {validationErrors.includes("fullName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select className={inpCls()}
              value={(formData.gender as string) || ""}
              onChange={(e) => updateFormData("gender", e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nationality *</label>
            <input type="text" placeholder="e.g. Indian, American" className={inpCls("nationality")}
              value={(formData.nationality as string) || ""}
              onChange={(e) => updateFormData("nationality", e.target.value)} />
            {validationErrors.includes("nationality") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Status</label>
            <input type="text" placeholder="e.g. Working Professional, Student" className={inpCls()}
              value={(formData.current_status as string) || ""}
              onChange={(e) => updateFormData("current_status", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Home Country *</label>
            <input type="text" placeholder="Your home country" className={inpCls("homeCountry")}
              value={(formData.homeCountry as string) || ""}
              onChange={(e) => updateFormData("homeCountry", e.target.value)} />
            {validationErrors.includes("homeCountry") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Intended Country of Study *</label>
            <input type="text" placeholder="e.g. Germany, USA, UK" className={inpCls("intendedCountry")}
              value={(formData.intendedCountry as string) || ""}
              onChange={(e) => updateFormData("intendedCountry", e.target.value)} />
            {validationErrors.includes("intendedCountry") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
      </div>

      {/* University & Program */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">University & Program Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">University Name *</label>
            <input type="text" placeholder="e.g. Technical University of Munich" className={inpCls("university")}
              value={(formData.university as string) || ""}
              onChange={(e) => updateFormData("university", e.target.value)} />
            {validationErrors.includes("university") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Degree Level *</label>
            <select className={inpCls("degreeLevel")}
              value={(formData.degreeLevel as string) || ""}
              onChange={(e) => updateFormData("degreeLevel", e.target.value)}>
              <option value="">Select degree level</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
            </select>
            {validationErrors.includes("degreeLevel") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Program / Course Name *</label>
            <input type="text" placeholder="e.g. MSc Computer Science" className={inpCls("program")}
              value={(formData.program as string) || ""}
              onChange={(e) => updateFormData("program", e.target.value)} />
            {validationErrors.includes("program") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Field of Study *</label>
            <input type="text" placeholder="e.g. Computer Science" className={inpCls("fieldOfStudy")}
              value={(formData.fieldOfStudy as string) || ""}
              onChange={(e) => updateFormData("fieldOfStudy", e.target.value)} />
            {validationErrors.includes("fieldOfStudy") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
      </div>

      {/* Academic Background */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Academic Background</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Institution Name *</label>
            <input type="text" placeholder="Your current / previous institution" className={inpCls("institutionName")}
              value={(formData.institutionName as string) || ""}
              onChange={(e) => updateFormData("institutionName", e.target.value)} />
            {validationErrors.includes("institutionName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Graduation Year *</label>
            <input type="text" placeholder="e.g. 2023 (YYYY)" className={inpCls("graduationYear")}
              value={(formData.graduationYear as string) || ""}
              onChange={(e) => updateFormData("graduationYear", e.target.value)} />
            {validationErrors.includes("graduationYear") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">CGPA or Percentage</label>
            <input type="text" placeholder="e.g. 8.9 CGPA or 85%" className={inpCls()}
              value={(formData.cgpa_or_percentage as string) || ""}
              onChange={(e) => updateFormData("cgpa_or_percentage", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Certifications</label>
            <input type="text" placeholder="e.g. AWS Certified Solutions Architect" className={inpCls()}
              value={(formData.certifications as string) || ""}
              onChange={(e) => updateFormData("certifications", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Motivation & Experience */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Motivation & Experience</h4>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Motivation *</label>
          <textarea rows={3} placeholder="What motivates you to pursue this field…" className={taCls("motivation")}
            value={(formData.motivation as string) || ""}
            onChange={(e) => updateFormData("motivation", e.target.value)} />
          {validationErrors.includes("motivation") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Experience Type</label>
            <select className={inpCls()}
              value={(formData.experienceType as string) || ""}
              onChange={(e) => updateFormData("experienceType", e.target.value)}>
              <option value="">Select experience type</option>
              <option value="Internship">Internship</option>
              <option value="Work Experience">Work Experience</option>
              <option value="Research">Research</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Project Work">Project Work</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Work Experience Summary</label>
          <textarea rows={3} placeholder="Describe your internships, jobs, projects…" className={taCls()}
            value={(formData.workExperience as string) || ""}
            onChange={(e) => updateFormData("workExperience", e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Experience Details</label>
          <textarea rows={2} placeholder="Specific achievements, e.g. 'reduced response times by 15%'" className={taCls()}
            value={(formData.experience_details as string) || ""}
            onChange={(e) => updateFormData("experience_details", e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Internship Details</label>
          <textarea rows={2} placeholder="Details about specific internships" className={taCls()}
            value={(formData.internship_details as string) || ""}
            onChange={(e) => updateFormData("internship_details", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Major Projects</label>
          <textarea rows={2} placeholder="e.g. Built a decentralized file storage system" className={taCls()}
            value={(formData.major_projects as string) || ""}
            onChange={(e) => updateFormData("major_projects", e.target.value)} />
        </div>
      </div>

      {/* Program & University Fit */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Program & University Fit</h4>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Areas of Interest *</label>
          <textarea rows={2} placeholder="e.g. Machine Learning, Data Engineering" className={taCls("areasOfInterest")}
            value={(formData.areasOfInterest as string) || ""}
            onChange={(e) => updateFormData("areasOfInterest", e.target.value)} />
          {validationErrors.includes("areasOfInterest") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Why This Program? *</label>
          <textarea rows={3} placeholder="Explain why you chose this specific program…" className={taCls("whyProgram")}
            value={(formData.whyProgram as string) || ""}
            onChange={(e) => updateFormData("whyProgram", e.target.value)} />
          {validationErrors.includes("whyProgram") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Why This University? *</label>
          <textarea rows={3} placeholder="Explain why you chose this specific university…" className={taCls("whyUniversity")}
            value={(formData.whyUniversity as string) || ""}
            onChange={(e) => updateFormData("whyUniversity", e.target.value)} />
          {validationErrors.includes("whyUniversity") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
      </div>

      {/* Career Goals */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Career Goals & Future Plans</h4>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Short-Term Career Goal *</label>
          <textarea rows={2} placeholder="Immediate goals after completing this program…" className={taCls("shortTermGoal")}
            value={(formData.shortTermGoal as string) || ""}
            onChange={(e) => updateFormData("shortTermGoal", e.target.value)} />
          {validationErrors.includes("shortTermGoal") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Long-Term Career Goal *</label>
          <textarea rows={2} placeholder="Where you see yourself in 5–10 years…" className={taCls("longTermGoal")}
            value={(formData.longTermGoal as string) || ""}
            onChange={(e) => updateFormData("longTermGoal", e.target.value)} />
          {validationErrors.includes("longTermGoal") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reason to Return to Home Country *</label>
          <textarea rows={3} placeholder="Your plans to return and contribute…" className={taCls("returnReason")}
            value={(formData.returnReason as string) || ""}
            onChange={(e) => updateFormData("returnReason", e.target.value)} />
          {validationErrors.includes("returnReason") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
      </div>

      {/* Key Strengths */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Personal Strengths</h4>
        <div>
          <label className="block text-sm font-medium mb-1">Key Strengths *</label>
          <textarea rows={3} placeholder="e.g. Python, Java, problem solving, teamwork" className={taCls("keyStrengths")}
            value={(formData.keyStrengths as string) || ""}
            onChange={(e) => updateFormData("keyStrengths", e.target.value)} />
          {validationErrors.includes("keyStrengths") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
      </div>
      
      {/* Additional Details */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Additional Details</h4>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Why this Country?</label>
          <textarea rows={2} placeholder="Reasons for choosing this specific country" className={taCls()}
            value={(formData.why_country as string) || ""}
            onChange={(e) => updateFormData("why_country", e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Challenges Overcome</label>
          <textarea rows={2} placeholder="Any academic or personal challenges you've overcome" className={taCls()}
            value={(formData.challenges_overcome as string) || ""}
            onChange={(e) => updateFormData("challenges_overcome", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">IELTS Score</label>
            <input type="text" placeholder="e.g. 7.5" className={inpCls()}
              value={(formData.ielts_score as string) || ""}
              onChange={(e) => updateFormData("ielts_score", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">German Language Level</label>
            <input type="text" placeholder="e.g. A2, B1" className={inpCls()}
              value={(formData.german_language_level as string) || ""}
              onChange={(e) => updateFormData("german_language_level", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Generation Settings */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Generation Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tone</label>
            <select className={inpCls()}
              value={(formData.sop_tone as string) || "PROFESSIONAL"}
              onChange={(e) => updateFormData("sop_tone", e.target.value)}>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ACADEMIC">Academic</option>
              <option value="CONVINCING">Convincing</option>
              <option value="NARRATIVE">Narrative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Word Limit</label>
            <input type="number" placeholder="e.g. 800" className={inpCls()}
              value={(formData.sop_word_limit as string) || ""}
              onChange={(e) => updateFormData("sop_word_limit", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Additional Requirements</label>
          <textarea rows={2} placeholder="Any other instructions for the AI" className={taCls()}
            value={(formData.sop_additional_requirements as string) || ""}
            onChange={(e) => updateFormData("sop_additional_requirements", e.target.value)} />
        </div>
      </div>
    </motion.div>
  );

  /* ─────────────────────── LOR Form ────────────────────────────── */
  const renderLORForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <h3 className="text-lg font-semibold">Letter of Recommendation Details</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name of the Senior Writing LOR *</label>
          <input type="text" placeholder="e.g. Prof. Dr. Hans Müller" className={inpCls("seniorName")}
            value={(formData.seniorName as string) || ""}
            onChange={(e) => updateFormData("seniorName", e.target.value)} />
          {validationErrors.includes("seniorName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Recommender Designation</label>
          <input type="text" placeholder="e.g. Professor & Head of CS Department" className={inpCls()}
            value={(formData.recommenderDesignation as string) || ""}
            onChange={(e) => updateFormData("recommenderDesignation", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Student Name *</label>
          <input type="text" placeholder="e.g. Rahul Sharma" className={inpCls("studentName")}
            value={(formData.studentName as string) || ""}
            onChange={(e) => updateFormData("studentName", e.target.value)} />
          {validationErrors.includes("studentName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select className={inpCls()}
            value={(formData.lorGender as string) || ""}
            onChange={(e) => updateFormData("lorGender", e.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">University Name *</label>
        <input type="text" placeholder="e.g. Technical University of Munich" className={inpCls("universityName")}
          value={(formData.universityName as string) || ""}
          onChange={(e) => updateFormData("universityName", e.target.value)} />
        {validationErrors.includes("universityName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location *</label>
        <input type="text" placeholder="e.g. Munich, Germany" className={inpCls("location")}
          value={(formData.location as string) || ""}
          onChange={(e) => updateFormData("location", e.target.value)} />
        {validationErrors.includes("location") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Field *</label>
        <input type="text" placeholder="e.g. Computer Science" className={inpCls("field")}
          value={(formData.field as string) || ""}
          onChange={(e) => updateFormData("field", e.target.value)} />
        {validationErrors.includes("field") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Relationship Type</label>
          <input type="text" placeholder="e.g. Project Supervisor and Professor" className={inpCls()}
            value={(formData.relationshipType as string) || ""}
            onChange={(e) => updateFormData("relationshipType", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Relationship Duration</label>
          <input type="text" placeholder="e.g. 2 years (Duration in months/years)" className={inpCls()}
            value={(formData.relationshipDuration as string) || ""}
            onChange={(e) => updateFormData("relationshipDuration", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Best at (Skills) *</label>
        <input type="text" placeholder="e.g. Python, Machine Learning, Data Structures" className={inpCls("skills")}
          value={(formData.skills as string) || ""}
          onChange={(e) => updateFormData("skills", e.target.value)} />
        {validationErrors.includes("skills") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        <p className="text-xs text-gray-500 mt-1">Comma-separated list of skills</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Projects (Optional)</label>
        <textarea rows={2} placeholder="e.g. AI-based traffic prediction system" className={taCls()}
          value={(formData.projects as string) || ""}
          onChange={(e) => updateFormData("projects", e.target.value)} />
      </div>

      {/* Assessment Section */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Student Assessment</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Recommendation Level</label>
          <select className={inpCls()}
            value={(formData.recommendationLevel as string) || "strongly recommend"}
            onChange={(e) => updateFormData("recommendationLevel", e.target.value)}>
            <option value="highly recommend">Highly Recommend</option>
            <option value="strongly recommend">Strongly Recommend</option>
            <option value="recommend">Recommend</option>
            <option value="recommend with reservations">Recommend with reservations</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Analytical Skills</label>
            <input type="text" placeholder="e.g. Excellent, always achieves top grades" className={inpCls()}
              value={(formData.analyticalSkills as string) || ""}
              onChange={(e) => updateFormData("analyticalSkills", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Leadership Skills</label>
            <input type="text" placeholder="e.g. Led a team of 4 in the hackathon" className={inpCls()}
              value={(formData.leadershipSkills as string) || ""}
              onChange={(e) => updateFormData("leadershipSkills", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Teamwork</label>
            <input type="text" placeholder="e.g. Collaborative, coordinates effectively" className={inpCls()}
              value={(formData.teamwork as string) || ""}
              onChange={(e) => updateFormData("teamwork", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Research Ability</label>
            <input type="text" placeholder="e.g. Shows great initiative" className={inpCls()}
              value={(formData.researchAbility as string) || ""}
              onChange={(e) => updateFormData("researchAbility", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Class Rank</label>
          <input type="text" placeholder="e.g. Top 5% out of 120 students" className={inpCls()}
            value={(formData.classRank as string) || ""}
            onChange={(e) => updateFormData("classRank", e.target.value)} />
        </div>
      </div>

      {/* Generation Settings */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Generation Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tone</label>
            <select className={inpCls()}
              value={(formData.lor_tone as string) || "ACADEMIC"}
              onChange={(e) => updateFormData("lor_tone", e.target.value)}>
              <option value="ACADEMIC">Academic</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="GLOWING">Glowing</option>
              <option value="MODERATE">Moderate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Word Limit</label>
            <input type="number" placeholder="e.g. 400" className={inpCls()}
              value={(formData.lor_word_limit as string) || ""}
              onChange={(e) => updateFormData("lor_word_limit", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Additional Requirements</label>
          <textarea rows={2} placeholder="Any other instructions for the AI" className={taCls()}
            value={(formData.lor_additional_requirements as string) || ""}
            onChange={(e) => updateFormData("lor_additional_requirements", e.target.value)} />
        </div>
      </div>
    </motion.div>
  );

  /* ─────────────────────── Cover Letter Form ───────────────────── */
  const renderCoverLetterForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold">Cover Letter Details</h3>

      {/* Student & Course */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Student & Course Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student Name *</label>
            <input type="text" placeholder="Full name on passport" className={inpCls("studentName")}
              value={(formData.studentName as string) || ""}
              onChange={(e) => updateFormData("studentName", e.target.value)} />
            {validationErrors.includes("studentName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select className={inpCls()}
              value={(formData.coverGender as string) || ""}
              onChange={(e) => updateFormData("coverGender", e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Passport Number *</label>
            <input type="text" placeholder="e.g. A1234567" className={inpCls("passportNumber")}
              value={(formData.passportNumber as string) || ""}
              onChange={(e) => updateFormData("passportNumber", e.target.value)} />
            {validationErrors.includes("passportNumber") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nationality</label>
            <input type="text" placeholder="e.g. Indian" className={inpCls()}
              value={(formData.coverNationality as string) || ""}
              onChange={(e) => updateFormData("coverNationality", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Country</label>
            <input type="text" placeholder="e.g. Germany" className={inpCls()}
              value={(formData.targetCountry as string) || ""}
              onChange={(e) => updateFormData("targetCountry", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Visa Type</label>
            <input type="text" placeholder="e.g. National Visa for Study" className={inpCls()}
              value={(formData.visaType as string) || ""}
              onChange={(e) => updateFormData("visaType", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Name *</label>
            <input type="text" placeholder="e.g. MSc Computer Science" className={inpCls("courseName")}
              value={(formData.courseName as string) || ""}
              onChange={(e) => updateFormData("courseName", e.target.value)} />
            {validationErrors.includes("courseName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">University Name *</label>
            <input type="text" placeholder="e.g. Technical University of Munich" className={inpCls("universityName")}
              value={(formData.universityName as string) || ""}
              onChange={(e) => updateFormData("universityName", e.target.value)} />
            {validationErrors.includes("universityName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">University Location *</label>
            <input type="text" placeholder="City, Country" className={inpCls("universityLocation")}
              value={(formData.universityLocation as string) || ""}
              onChange={(e) => updateFormData("universityLocation", e.target.value)} />
            {validationErrors.includes("universityLocation") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Duration *</label>
            <input type="text" placeholder="e.g. 2 years (Duration in months/years)" className={inpCls("courseDuration")}
              value={(formData.courseDuration as string) || ""}
              onChange={(e) => updateFormData("courseDuration", e.target.value)} />
            {validationErrors.includes("courseDuration") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Start Date *</label>
            <input type="date" className={inpCls("courseStartDate")}
              value={(formData.courseStartDate as string) || ""}
              onChange={(e) => updateFormData("courseStartDate", e.target.value)} />
            {validationErrors.includes("courseStartDate") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tuition Fees *</label>
            <input type="text" placeholder="e.g. 1500 EUR/semester (Amount & Currency)" className={inpCls("tuitionFees")}
              value={(formData.tuitionFees as string) || ""}
              onChange={(e) => updateFormData("tuitionFees", e.target.value)} />
            {validationErrors.includes("tuitionFees") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
      </div>

      {/* Blocked Account */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Blocked Account & Sponsorship</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Blocked Account Bank Name *</label>
            <input type="text" placeholder="e.g. Expatrio" className={inpCls("blockedAccountBankName")}
              value={(formData.blockedAccountBankName as string) || ""}
              onChange={(e) => updateFormData("blockedAccountBankName", e.target.value)} />
            {validationErrors.includes("blockedAccountBankName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Blocked Account Balance *</label>
            <input type="text" placeholder="e.g. 11208 EUR (Amount & Currency)" className={inpCls("blockedAccountBalance")}
              value={(formData.blockedAccountBalance as string) || ""}
              onChange={(e) => updateFormData("blockedAccountBalance", e.target.value)} />
            {validationErrors.includes("blockedAccountBalance") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sponsor Name *</label>
          <input type="text" placeholder="e.g. Self-sponsored / Father's name" className={inpCls("sponsorName")}
            value={(formData.sponsorName as string) || ""}
            onChange={(e) => updateFormData("sponsorName", e.target.value)} />
          {validationErrors.includes("sponsorName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Source of Funds</label>
          <input type="text" placeholder="e.g. Personal Savings and Educational Loan" className={inpCls()}
            value={(formData.sourceOfFunds as string) || ""}
            onChange={(e) => updateFormData("sourceOfFunds", e.target.value)} />
        </div>
      </div>

      {/* Additional Applicant Details */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Additional Applicant Details</h4>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Accommodation Details</label>
          <textarea rows={2} placeholder="e.g. Temporary Airbnb booked in Munich" className={taCls()}
            value={(formData.accommodationDetails as string) || ""}
            onChange={(e) => updateFormData("accommodationDetails", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gap Reason</label>
            <input type="text" placeholder="e.g. N/A or working on a startup" className={inpCls()}
              value={(formData.gapReason as string) || ""}
              onChange={(e) => updateFormData("gapReason", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Company</label>
            <input type="text" placeholder="e.g. XYZ Corp" className={inpCls()}
              value={(formData.currentCompany as string) || ""}
              onChange={(e) => updateFormData("currentCompany", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Future Return Plan</label>
          <textarea rows={2} placeholder="e.g. Return home to join a multinational tech consultancy" className={taCls()}
            value={(formData.futureReturnPlan as string) || ""}
            onChange={(e) => updateFormData("futureReturnPlan", e.target.value)} />
        </div>
      </div>

      {/* SSC */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">SSC (10th Grade) Details *</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">SSC School Name *</label>
            <input type="text" placeholder="School name" className={inpCls("sscSchoolName")}
              value={(formData.sscSchoolName as string) || ""}
              onChange={(e) => updateFormData("sscSchoolName", e.target.value)} />
            {validationErrors.includes("sscSchoolName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SSC Passing Month and Year *</label>
            <input type="month" className={inpCls("sscPassingDate")}
              value={(formData.sscPassingDate as string) || ""}
              onChange={(e) => updateFormData("sscPassingDate", e.target.value)} />
            {validationErrors.includes("sscPassingDate") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SSC Marks or Percentage *</label>
          <input type="text" placeholder="e.g. 92%" className={inpCls("sscMarks")}
            value={(formData.sscMarks as string) || ""}
            onChange={(e) => updateFormData("sscMarks", e.target.value)} />
          {validationErrors.includes("sscMarks") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
      </div>

      {/* HSC */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">HSC (12th Grade) Details *</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">HSC School Name *</label>
            <input type="text" placeholder="School name" className={inpCls("hscSchoolName")}
              value={(formData.hscSchoolName as string) || ""}
              onChange={(e) => updateFormData("hscSchoolName", e.target.value)} />
            {validationErrors.includes("hscSchoolName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">HSC Passing Month and Year *</label>
            <input type="month" className={inpCls("hscPassingDate")}
              value={(formData.hscPassingDate as string) || ""}
              onChange={(e) => updateFormData("hscPassingDate", e.target.value)} />
            {validationErrors.includes("hscPassingDate") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HSC Marks or Percentage *</label>
          <input type="text" placeholder="e.g. 88%" className={inpCls("hscMarks")}
            value={(formData.hscMarks as string) || ""}
            onChange={(e) => updateFormData("hscMarks", e.target.value)} />
          {validationErrors.includes("hscMarks") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
      </div>

      {/* Bachelor's */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Bachelor's Details *</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bachelors University Name *</label>
            <input type="text" placeholder="University name" className={inpCls("bachelorsUniversityName")}
              value={(formData.bachelorsUniversityName as string) || ""}
              onChange={(e) => updateFormData("bachelorsUniversityName", e.target.value)} />
            {validationErrors.includes("bachelorsUniversityName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bachelors Course Name *</label>
            <input type="text" placeholder="e.g. B.Tech Computer Engineering" className={inpCls("bachelorsCourseName")}
              value={(formData.bachelorsCourseName as string) || ""}
              onChange={(e) => updateFormData("bachelorsCourseName", e.target.value)} />
            {validationErrors.includes("bachelorsCourseName") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bachelors Course Percentage or CGPA *</label>
          <input type="text" placeholder="e.g. 8.4 CGPA or 78%" className={inpCls("bachelorsCGPA")}
            value={(formData.bachelorsCGPA as string) || ""}
            onChange={(e) => updateFormData("bachelorsCGPA", e.target.value)} />
          {validationErrors.includes("bachelorsCGPA") && <p className="text-red-500 text-xs mt-1">This field is required</p>}
        </div>
      </div>

      {/* Generation Settings */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4 text-primary">Generation Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tone</label>
            <select className={inpCls()}
              value={(formData.cover_tone as string) || "FORMAL"}
              onChange={(e) => updateFormData("cover_tone", e.target.value)}>
              <option value="FORMAL">Formal</option>
              <option value="CONVINCING">Convincing</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="CONFIDENT">Confident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Word Limit</label>
            <input type="number" placeholder="e.g. 600" className={inpCls()}
              value={(formData.cover_word_limit as string) || ""}
              onChange={(e) => updateFormData("cover_word_limit", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Additional Requirements</label>
          <textarea rows={2} placeholder="Any other instructions for the AI" className={taCls()}
            value={(formData.cover_additional_requirements as string) || ""}
            onChange={(e) => updateFormData("cover_additional_requirements", e.target.value)} />
        </div>
      </div>
    </motion.div>
  );

  /* ═══════════════════════════════════════════════════════════════ */
  /*  GENERATION MODAL                                               */
  /* ═══════════════════════════════════════════════════════════════ */
  const renderGenerationModal = () => {
    const currentTool = aiTools.find((t) => t.id === selectedTool);
    if (!currentTool) return null;
    const IconComponent = currentTool.icon;

     return createPortal(
      <AnimatePresence>
        <motion.div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGenerating) resetGeneration();
          }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white bg-gradient-to-r ${currentTool.bgGradient}`}>
                  <IconComponent size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">{currentTool.title}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {generationStep === 1
                      ? "Fill in the details below"
                      : isGenerating
                      ? "AI is working…"
                      : generatedContent
                      ? "Document ready!"
                      : "Generation failed"}
                  </p>
                </div>
              </div>
              {!isGenerating && (
                <Button variant="ghost" size="sm" onClick={resetGeneration}>
                  <X size={20} />
                </Button>
              )}
            </div>

            {/* ── Modal Body ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">

              {/* STEP 1 – Form */}
              {generationStep === 1 && (
                <>
                  {/* Validation banner */}
                  {validationErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700 dark:text-red-400">
                        <p className="font-medium mb-1">Please fill in all required fields:</p>
                        <ul className="list-disc ml-4 space-y-0.5">
                          {validationErrors.map((f) => (
                            <li key={f} className="capitalize">
                              {f.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {selectedTool === "sop" && renderSOPForm()}
                  {selectedTool === "lor" && renderLORForm()}
                  {selectedTool === "cover" && renderCoverLetterForm()}
                </>
              )}

              {/* STEP 2 – Loading */}
              {generationStep === 2 && isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  {/* Glowing orb */}
                  <div className="relative mb-10">
                    {/* Outer glow rings */}
                    <motion.div
                      className="absolute -inset-8 rounded-full opacity-20"
                      style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-4 rounded-full opacity-30"
                      style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                    {/* Core orb */}
                    <motion.div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)" }}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      {/* Inner shimmer */}
                      <motion.div
                        className="absolute inset-2 rounded-full opacity-40"
                        style={{ background: "linear-gradient(135deg, white, transparent)" }}
                        animate={{ rotate: [0, -360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      <Sparkles className="text-white relative z-10" size={32} />
                    </motion.div>
                  </div>

                  {/* Animated headline */}
                  <motion.h3
                    className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    AI is crafting your document
                  </motion.h3>

                  {/* Pulsing dots */}
                  <div className="flex items-center gap-1.5 mb-5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-indigo-500"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                    This usually takes <span className="font-semibold text-gray-700 dark:text-gray-300">30–40 seconds</span>. Please keep this window open.
                  </p>
                </motion.div>
              )}

              {/* STEP 2 – Error */}
              {generationStep === 2 && !isGenerating && generateError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={28} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-red-600">Generation Failed</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
                    {generateError}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetGeneration}>
                      <ChevronLeft size={16} className="mr-1" />
                      Back
                    </Button>
                    <Button onClick={() => { setGenerationStep(1); setGenerateError(null); }}>
                      <RefreshCw size={16} className="mr-2" />
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 – Success summary */}
              {generationStep === 2 && !isGenerating && generatedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-5"
                  >
                    <CheckCircle size={36} className="text-green-500" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Document Ready!</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                    Your AI-generated document has been created successfully.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setShowViewModal(true)}
                      className="gap-2"
                    >
                      <Eye size={16} />
                      View Document
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadAsWord(generatedContent, getDocumentFilename())}
                      className="gap-2"
                    >
                      <Download size={16} />
                      Download as Word
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setGenerationStep(1); setGeneratedContent(null); }}
                      className="gap-2"
                    >
                      <RefreshCw size={16} />
                      Regenerate
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Modal Footer ── */}
            {generationStep === 1 && (
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={resetGeneration}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleGenerate}
                  >
                    <Wand2 size={16} />
                    Generate with AI
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
     , document.body);
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  VIEW DOCUMENT MODAL                                            */
  /* ═══════════════════════════════════════════════════════════════ */
  const renderViewModal = () => {
    // Supports both: viewing current generation AND history items
    const activeContent = historyViewItem?.content ?? generatedContent;
    const activeType   = historyViewItem?.type   ?? selectedTool;
    const activeTitle  = historyViewItem?.title;

    if (!showViewModal || !activeContent) return null;

    const filename = getFilenameForType(activeType || "");
    const wordCount = activeContent.trim().split(/\s+/).length;

    const closeModal = () => {
      setShowViewModal(false);
      setHistoryViewItem(null);
    };

     return createPortal(
      <AnimatePresence>
        <motion.div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowViewModal(false); }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col mx-4 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                <h2 className="font-bold text-lg">
                  {activeTitle || filename.replace(/_/g, " ")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(stripMarkdown(activeContent));
                  }}
                >
                  <Copy size={14} />
                  Copy
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => downloadAsWord(activeContent, filename)}
                >
                  <Download size={14} />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={closeModal}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Toolbar strip */}
              <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/50 text-xs text-gray-400">
                <span className="font-medium text-gray-600 dark:text-gray-300">Document Preview</span>
                <span className="ml-auto">{wordCount} words</span>
              </div>
              {/* Paper */}
              <div className="mx-auto my-6 px-10 py-8 max-w-2xl bg-white dark:bg-gray-950 shadow-md rounded-sm border border-gray-100 dark:border-gray-800"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {parseDocumentContent(activeContent)}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-500">{wordCount} words</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={closeModal}>
                  Close
                </Button>
                {!historyViewItem && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { closeModal(); setGenerationStep(1); setGeneratedContent(null); }}
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    , document.body);
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  HISTORY (mock)                                                 */
  /* ═══════════════════════════════════════════════════════════════ */
  const generationHistory = [
    { id: "1", type: "sop", title: "Computer Science SOP – TU Munich", createdAt: "2024-02-15T10:30:00Z", status: "completed", wordCount: 847 },
    { id: "2", type: "cover", title: "Cover Letter – Germany Visa", createdAt: "2024-02-12T14:20:00Z", status: "completed", wordCount: 456 },
    { id: "3", type: "lor", title: "Professor LOR Template", createdAt: "2024-02-10T09:15:00Z", status: "draft", wordCount: 623 },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = { hidden: { scale: 0.9, opacity: 0 }, show: { scale: 1, opacity: 1 } };

  /* ═══════════════════════════════════════════════════════════════ */
  /*  RENDER                                                         */
  /* ═══════════════════════════════════════════════════════════════ */
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">AI-Powered Tools</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Generate professional documents instantly with our AI assistants
        </p>
      </motion.div>

      {/* Desktop action row */}
      <div className="hidden sm:flex justify-end gap-3">
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
          <History size={18} className="mr-2" />
          {showHistory ? "Hide" : "View"} History
        </Button>
      </div>

      {/* Tools grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {aiTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <motion.div
              key={tool.id}
              variants={item}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 sm:p-6 h-full flex flex-col hover:shadow-lg transition-all duration-200">
                <div className="flex items-start mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tool.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-lg sm:text-xl mb-2">{tool.name}</h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-4 flex-1">
                  {tool.description}
                </p>
                <div className="space-y-2 mb-5">
                  {tool.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full rounded-xl group"
                  onClick={() => startGeneration(tool.id)}
                >
                  Open Tool
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* History section */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History size={20} />
                  Recent Generations
                  {historyItems.length > 0 && (
                    <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {historyItems.length}
                    </span>
                  )}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  <X size={16} />
                </Button>
              </div>

              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                  <Sparkles size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No documents generated yet</p>
                  <p className="text-xs mt-1">Generate a document above and it will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((hItem, index) => (
                    <motion.div
                      key={hItem.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Left: icon + title + meta */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">{getToolIcon(hItem.type)}</div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm truncate">{hItem.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Clock size={11} />
                            <span>{new Date(hItem.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{hItem.wordCount} words</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <CheckCircle className="text-green-600 hidden sm:block" size={15} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => {
                            setHistoryViewItem(hItem);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye size={13} />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() =>
                            downloadAsWord(
                              hItem.content,
                              getFilenameForType(hItem.type)
                            )
                          }
                        >
                          <Download size={13} />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                          onClick={() => {
                            const updated = historyItems.filter(d => d.id !== hItem.id);
                            setHistoryItems(updated);
                            try { localStorage.setItem('aitools_history', JSON.stringify(updated)); } catch {}
                          }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {selectedTool && renderGenerationModal()}
      {renderViewModal()}

      {/* Mobile bottom spacer */}
      <div className="h-20 sm:hidden" />
    </motion.div>
  );
};

export default AITools;
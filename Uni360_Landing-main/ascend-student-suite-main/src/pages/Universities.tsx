import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudentProfile } from "@/services/studentProfile";
import { makeAuthenticatedRequest } from "@/services/tokenService";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Heart,
  MapPin,
  Star,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ExternalLink,
  Bookmark,
  Loader2,
  Building2,
  ChevronLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  Lock,
  Upload,
  Check,
  AlertCircle,      // ADD THIS
  ChevronRight,
  Award,
} from "lucide-react";
import { universityAPI } from "@/services/api";
import { 
  createApplication, 
  submitApplication,
  getAllCourses,
  fetchAllFavoriteCourses,
  addCourseToFavorites,
  removeCourseFromFavorites,
  getFavoriteCourses,
  getApplicationById, 
  getProfileProgress
} from "@/services/studentProfile";
import { useAuth } from "@/contexts/AuthContext";
import RazorpayButton from "@/components/RazorpayButton";
import { checkPaymentHealth, verifyPayment } from "@/services/payment.js";
import jsPDF from "jspdf";

type Country = "DE" | "UK";

interface ContextType {
  selectedCountry: Country;
}

const filters = [
  "All",
  "Low Tuition",
];

// Course Modal Component
const CourseModal = ({ 
  university, 
  isOpen, 
  onClose, 
  setSelectedCourse, 
  setSelectedUniversity, 
  setIsPaymentModalOpen, 
  setIsFormModalOpen,
  fetchAndProcessProfile,
  checkProfileCompletion,
  setShowProfileIncompleteModal,
  setShowDocumentsIncompleteModal,
  onCourseFavoriteToggled,  // NEW: notify parent when a course favourite is toggled
  onCourseFavoriteAdded,    // NEW: notify parent when a course is added to favorites successfully
}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(9);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDegreeType, setSelectedDegreeType] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && university) {
      loadCourses();
    }
  }, [isOpen, university]);

const loadCourses = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log('[CourseModal] Reading courses from university object (embedded in list API)...');
    console.log('[CourseModal] Selected university:', university?.name);

    // ── PRIMARY: use courses already embedded in the university object ────────
    // The GET /api/v1/universities list endpoint returns each university with a
    // nested `courses` array, so we avoid an extra round-trip.
    const rawCourses: any[] = university?.courses || [];
    console.log('[CourseModal] Courses from university object:', rawCourses.length);

    // Map to the internal format the rest of the UI expects
    const mappedCourses = rawCourses.map((course: any) => ({
      // ── Keep ALL original API fields (needed by backend when creating application) ──
      id: course.id,
      universityId: course.universityId ?? university?.id,
      universityName: course.universityName ?? university?.name,
      universityCode: course.universityCode ?? university?.code,
      universityCountry: course.universityCountry ?? university?.country,
      name: course.name,
      courseCode: course.courseCode,
      degreeLevel: course.degreeLevel ?? course.degree_level,
      degreeType: course.degreeType ?? course.degree_type,
      fieldOfStudy: course.fieldOfStudy ?? course.field_of_study ?? course.subject_area,
      studyMode: course.studyMode ?? course.study_mode,
      durationYears: course.durationYears ?? course.duration_years,
      tuitionInternational: course.tuitionInternational ?? course.tuition_fee ?? course.tuition_fee_international,
      currency: course.currency ?? 'EUR',
      scholarshipsAvailable: course.scholarshipsAvailable ?? course.scholarships_available,
      intakeSeasons: course.intakeSeasons ?? (course.intake_season ? [course.intake_season] : []),
      applicationDeadline: course.applicationDeadline,
      careerOpportunities: course.careerOpportunities ?? [],
      isPopular: course.isPopular ?? course.is_popular,
      rating: course.rating,
      hasApplied: course.hasApplied ?? course.has_applied,
      isFavorite: course.isFavorite ?? course.is_favorite,
      canApplyNow: course.canApplyNow ?? course.can_apply_now,

      // ── Mapped / display fields ───────────────────────────────────────────
      university_id: course.universityId ?? university?.id,
      subject_area: course.fieldOfStudy ?? course.field_of_study ?? course.subject_area ?? '',
      degree_type: (course.degreeLevel ?? course.degree_level ?? 'masters').toLowerCase(),
      degree_level: course.degreeType ?? course.degree_type,
      language: course.language ?? 'English',
      duration_months: ((course.durationYears ?? course.duration_years) || 2) * 12,
      duration_years: course.durationYears ?? course.duration_years,
      intake_season: (course.intakeSeasons ?? [])[0] ?? course.intake_season ?? 'WINTER',
      tuition_fee: course.tuitionInternational ?? course.tuition_fee ?? course.tuition_fee_international ?? 0,
      min_gpa: course.min_gpa ?? '2.5',
      min_ielts: course.min_ielts ?? '6.5',
      study_mode: course.studyMode ?? course.study_mode,
      scholarships_available: course.scholarshipsAvailable ?? course.scholarships_available,
      is_popular: course.isPopular ?? course.is_popular,
      has_applied: course.hasApplied ?? course.has_applied,
      is_favorite: course.isFavorite ?? course.is_favorite,
      can_apply_now: course.canApplyNow ?? course.can_apply_now,
      description: course.description ?? `${course.degreeType ?? course.degree_type ?? ''} in ${course.fieldOfStudy ?? course.field_of_study ?? ''}`,
    }));

    console.log('[CourseModal] ✅ Mapped courses:', mappedCourses.length);
    setCourses(mappedCourses);

    /* ── COMMENTED OUT: separate courses API (mixed data in DB — restore when clean) ──
    console.log('[CourseModal] Fetching ALL courses from API...');
    const response = await getAllCourses();
    console.log('[CourseModal] Raw courses API response:', response);

    let coursesArray = [];
    if (Array.isArray(response)) {
      coursesArray = response;
    } else if (response?.data && Array.isArray(response.data)) {
      coursesArray = response.data;
    }

    console.log('[CourseModal] Total courses from API:', coursesArray.length);

    const universityCourses = coursesArray.filter(
      course => course.universityId === university.id
    );

    console.log('[CourseModal] Courses for this university:', universityCourses.length);

    const mappedCoursesFromApi = universityCourses.map(course => ({
      id: course.id,
      universityId: course.universityId,
      universityName: course.universityName,
      universityCode: course.universityCode,
      universityCountry: course.universityCountry,
      name: course.name,
      courseCode: course.courseCode,
      degreeLevel: course.degreeLevel,
      degreeType: course.degreeType,
      fieldOfStudy: course.fieldOfStudy,
      studyMode: course.studyMode,
      durationYears: course.durationYears,
      tuitionInternational: course.tuitionInternational,
      currency: course.currency,
      scholarshipsAvailable: course.scholarshipsAvailable,
      intakeSeasons: course.intakeSeasons || [],
      applicationDeadline: course.applicationDeadline,
      careerOpportunities: course.careerOpportunities || [],
      isPopular: course.isPopular,
      rating: course.rating,
      hasApplied: course.hasApplied,
      isFavorite: course.isFavorite,
      canApplyNow: course.canApplyNow,
      university_id: course.universityId,
      subject_area: course.fieldOfStudy,
      degree_type: course.degreeLevel?.toLowerCase() || 'masters',
      degree_level: course.degreeType,
      language: 'English',
      duration_months: (course.durationYears || 3) * 12,
      duration_years: course.durationYears,
      intake_season: course.intakeSeasons?.[0] || 'WINTER',
      tuition_fee: course.tuitionInternational || 0,
      min_gpa: '2.5',
      min_ielts: '6.5',
      study_mode: course.studyMode,
      scholarships_available: course.scholarshipsAvailable,
      is_popular: course.isPopular,
      has_applied: course.hasApplied,
      is_favorite: course.isFavorite,
      can_apply_now: course.canApplyNow,
      description: `${course.degreeType} in ${course.fieldOfStudy}`,
    }));

    setCourses(mappedCoursesFromApi);
    ── END COMMENTED OUT ── */

  } catch (err) {
    console.error("❌ Error loading courses:", err);
    setError("Failed to load courses. Please try again.");
    setCourses([]);
  } finally {
    setLoading(false);
  }
};


  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !searchQuery ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subject_area.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDegree =
        selectedDegreeType === "all" ||
        course.degree_type === selectedDegreeType;
      const matchesSubject =
        selectedSubject === "all" || course.subject_area === selectedSubject;
      const matchesLanguage =
        selectedLanguage === "all" ||
        course.language.toLowerCase() === selectedLanguage.toLowerCase();

      return (
        matchesSearch && matchesDegree && matchesSubject && matchesLanguage
      );
    });
  }, [
    courses,
    searchQuery,
    selectedDegreeType,
    selectedSubject,
    selectedLanguage,
  ]);

  const uniqueSubjects = [
    ...new Set(courses.map((course) => course.subject_area)),
  ];
  const uniqueLanguages = [
    ...new Set(courses.map((course) => course.language)),
  ];

  const formatTuition = (tuition) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(tuition));
  };

  const formatDuration = (months) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} year${years > 1 ? "s" : ""}`;
      }
      return `${years}y ${remainingMonths}m`;
    }
    return `${months} months`;
  };

// Modify the handleApplyNow function in CourseModal (around line 180)
// REPLACE the entire handleApplyNow function with:
const handleApplyNow = async (course) => {
  console.log('=== COURSE SELECTED FOR APPLICATION ===');
  console.log('Course ID:', course.id);
  console.log('Course degreeLevel:', course.degreeLevel);
  console.log('University ID:', university.id);
  console.log('University Country:', course.universityCountry || university.country);
  
  if (!course || !course.id) {
    alert('Error: Invalid course selected. Please try again.');
    return;
  }
  
  if (!university || !university.id) {
    alert('Error: University information missing. Please try again.');
    return;
  }
  
  // CRITICAL: Store course and university in parent state
  // Make sure we're passing the FULL course object with all fields
  console.log('Setting selectedCourse and selectedUniversity...');
  setSelectedCourse(course);
  setSelectedUniversity(university);
  
  // Check if profile is complete
  console.log('Checking profile completion...');
  const isComplete = await checkProfileCompletion();
  
  if (!isComplete) {
    // Store the course and university for return after profile completion
    sessionStorage.setItem('returnToUniversity', JSON.stringify({
      universityId: university.id,
      universityName: university.name,
      courseId: course.id,
      courseName: course.name,
      courseDegreeLevel: course.degreeLevel, // Store this too
      timestamp: Date.now()
    }));
    
    console.log('Profile incomplete, showing profile modal...');
    onClose();
    setShowProfileIncompleteModal(true);
    return;
  }
  
  // Profile is complete, now check if documents are uploaded
  // try {
  //   console.log('Checking pending documents...');
  //   const pendingResponse = await makeAuthenticatedRequest('/api/v1/students/documents/pending', { method: 'GET' });
  //   if (pendingResponse && pendingResponse.total_pending > 0) {
  //     console.log('Documents incomplete, showing documents modal...');
  //     onClose();
  //     setShowDocumentsIncompleteModal(true);
  //     return;
  //   }
  // } catch (error) {
  //   console.error('Error checking documents:', error);
  // }

  // Profile is complete and documents are uploaded, proceed normally
  console.log('Profile complete, fetching profile data...');
  await fetchAndProcessProfile();
  
  console.log('Closing course modal...');
  onClose();
  
  // THEN open form modal with a small delay
  setTimeout(() => {
    console.log('Opening form modal...');
    setIsFormModalOpen(true);
  }, 100);
};

const handleFavoriteClick = async (courseId, isFavorite) => {
  // ── Optimistic update: flip the heart instantly ──────────────────
  const newFav = !isFavorite;
  setCourses(prev =>
    prev.map(c =>
      c.id === courseId
        ? { ...c, isFavorite: newFav, is_favorite: newFav }
        : c
    )
  );

  // Notify parent immediately so the university card heart updates too
  if (onCourseFavoriteToggled) {
    onCourseFavoriteToggled(courseId, newFav);
  }

  try {
    console.log(`[CourseModal] Toggling favorite for course ${courseId}, was: ${isFavorite}`);
    if (isFavorite) {
      await removeCourseFromFavorites(courseId);
      console.log(`[CourseModal] ✅ Removed course ${courseId} from favorites`);
    } else {
      await addCourseToFavorites(courseId);
      console.log(`[CourseModal] ✅ Added course ${courseId} to favorites`);
      if (onCourseFavoriteAdded) {
        onCourseFavoriteAdded();
      }
    }
    // API confirmed — no reload needed; UI is already correct.
  } catch (error) {
    console.error('[CourseModal] Error toggling favorite:', error);

    // 409 = "already in favorites" → optimistic state is correct, keep it.
    if (error?.message?.includes('409') || error?.message?.includes('already in favorites')) {
      console.log('[CourseModal] 409 — course already in favorites, UI state is correct.');
      return;
    }

    // Any other error → roll back both local state and parent
    setCourses(prev =>
      prev.map(c =>
        c.id === courseId
          ? { ...c, isFavorite, is_favorite: isFavorite }
          : c
      )
    );
    if (onCourseFavoriteToggled) {
      onCourseFavoriteToggled(courseId, isFavorite); // revert parent too
    }
    alert('Failed to update favorites. Please try again.');
  }
};

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 sm:p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-gray-200 relative"
        onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-gray-200/50 bg-white/40 backdrop-blur-md flex-shrink-0 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3539] mb-2 leading-tight flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-[#E08D3C]" />
              {university.name} Courses
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-gray-600 text-sm">
              <span className="flex items-center gap-1.5 bg-gray-100/80 border border-gray-200/60 px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-[#E08D3C]" />
                {university.city}, {university.country}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/60 rounded-full text-gray-600 transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200/50 bg-white/40 backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 shadow-sm w-full h-10"
                />
              </div>
              <Select value={selectedDegreeType || "all"} onValueChange={(val) => setSelectedDegreeType(val)}>
                <SelectTrigger className="flex-1 h-10 rounded-lg border border-gray-200 text-sm px-3 bg-white shadow-sm outline-none whitespace-nowrap min-w-[140px]">
                  <SelectValue placeholder="All Degrees" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="all">All Degrees</SelectItem>
                  <SelectItem value="bachelors">Bachelor's</SelectItem>
                  <SelectItem value="masters">Master's</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSubject || "all"} onValueChange={(val) => setSelectedSubject(val)}>
                <SelectTrigger className="flex-1 h-10 rounded-lg border border-gray-200 text-sm px-3 bg-white shadow-sm outline-none whitespace-nowrap min-w-[140px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.filter(Boolean).map((subject, index) => (
                    <SelectItem key={`subject-${index}-${subject}`} value={String(subject)}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLanguage || "all"} onValueChange={(val) => setSelectedLanguage(val)}>
                <SelectTrigger className="flex-1 h-10 rounded-lg border border-gray-200 text-sm px-3 bg-white shadow-sm outline-none whitespace-nowrap min-w-[140px]">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.filter(Boolean).map((language, index) => (
                    <SelectItem key={`language-${index}-${language}`} value={String(language)}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E08D3C]" />
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </div>

          {/* Courses List */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
                <span className="ml-2 text-[#2C3539] font-medium">Loading courses...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white/60 backdrop-blur rounded-xl border border-gray-200/60 shadow-sm max-w-md mx-auto">
                <BookOpen className="w-12 h-12 text-[#E08D3C]/50 mx-auto mb-4" />
                <p className="text-[#2C3539] font-medium">{error}</p>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {filteredCourses.map((course, index) => (
  <Card
    key={course.id || `course-${index}`}
    className="p-4 hover:border-[#E08D3C]/50 border border-gray-200/80 bg-white/70 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group flex flex-col h-full">
                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between items-start gap-3">
  <h3 className="font-bold text-lg text-[#2C3539] line-clamp-2 flex-1 leading-tight group-hover:text-[#E08D3C] transition-colors">
    {course.name}
  </h3>
  <div className="flex items-center gap-2 flex-shrink-0">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleFavoriteClick(course.id, course.is_favorite);
      }}
      className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${
        course.is_favorite
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50'
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
      }`}
      title={course.is_favorite ? 'Remove from wishlist' : 'Add to wishlist'}>
      <Heart className={`w-4 h-4 transition-transform duration-200 ${course.is_favorite ? 'fill-current scale-110' : ''}`} />
    </button>
    <Badge
      className={`text-xs px-2.5 py-0.5 border-none shadow-sm ${
        course.degree_type === "phd"
          ? "bg-purple-100/80 text-purple-800"
          : course.degree_type === "masters"
          ? "bg-[#C4DFF0]/60 text-[#2C3539]"
          : "bg-emerald-100/80 text-emerald-800"
      }`}>
      {course.degree_type.charAt(0).toUpperCase() +
        course.degree_type.slice(1)}
    </Badge>
  </div>
</div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-xs bg-[#C4DFF0]/20 border-[#C4DFF0]/40 text-[#2C3539]">
                          <BookOpen className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          {course.subject_area}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-indigo-50/50 border-indigo-100/50 text-[#2C3539]">
                          <Globe className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          {course.language}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-emerald-50/50 border-emerald-100/50 text-[#2C3539]">
                          <Clock className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          {formatDuration(course.duration_months)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-purple-50/50 border-purple-100/50 text-[#2C3539]">
                          <Calendar className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          {course.intake_season}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100/80">
                        <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-lg p-2 border border-[#E08D3C]/10">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Tuition Fee</span>
                          <p className="font-bold text-[#2C3539] leading-tight">
                            {formatTuition(course.tuition_fee)}
                          </p>
                        </div>
                        <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Duration</span>
                          <p className="font-semibold text-[#2C3539] leading-tight">
                            {formatDuration(course.duration_months)}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Min GPA</span>
                          <p className="font-semibold text-[#2C3539] leading-tight">{course.min_gpa}</p>
                        </div>
                        <div className="bg-purple-50/50 rounded-lg p-2 border border-purple-100/50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Min IELTS</span>
                          <p className="font-semibold text-[#2C3539] leading-tight">{course.min_ielts}</p>
                        </div>
                      </div>

                      {course.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 pt-1 border-t border-gray-100/80">
                          {course.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Apply Now Button Pushed to Bottom */}
                    <div className="flex justify-end gap-2 pt-3 mt-auto border-t border-gray-100/80">
                      <Button
                        size="sm"
                        className="bg-[#2C3539] hover:bg-[#E08D3C] text-white font-medium transition-colors shadow-sm px-6"
                        onClick={() => handleApplyNow(course)}>
                        Apply Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/60 backdrop-blur rounded-xl border border-gray-200/60 shadow-sm max-w-md mx-auto">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#2C3539] mb-2">
                  No courses found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  , document.body);
};

// Documents Incomplete Modal
// const DocumentsIncompleteModal = ({ isOpen, onClose }) => {
//   const navigate = useNavigate();
  
//   if (!isOpen) return null;

//   const handleGoToDocuments = () => {
//     onClose();
//     navigate("/documents");
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
//       <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
//         {/* Header */}
//         <div className="p-6 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] text-white rounded-t-lg">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <AlertCircle className="w-8 h-8" />
//               <div>
//                 <h2 className="text-xl font-bold">Upload Your Documents</h2>
//                 <p className="text-sm text-white text-opacity-90">Required to apply</p>
//               </div>
//             </div>
//             <Button 
//               variant="ghost" 
//               size="sm" 
//               onClick={onClose} 
//               className="text-white hover:bg-white hover:bg-opacity-20"
//             >
//               <X className="w-5 h-5" />
//             </Button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-4">
//           <div className="text-center">
//             <p className="text-gray-700 mb-4">
//               To Apply for this University, please upload all the pending required documents in the documents section.
//             </p>

//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
//               <div className="space-y-2">
//                 <div className="flex items-start gap-2 text-sm text-blue-800">
//                   <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
//                   <span>Ensure all required documents are uploaded</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="flex gap-3">
//             <Button
//               variant="outline"
//               onClick={onClose}
//               className="flex-1 h-11"
//             >
//               Maybe Later
//             </Button>
//             <Button
//               onClick={handleGoToDocuments}
//               className="flex-1 h-11 bg-[#E08D3C] hover:bg-[#c77a32] text-white font-semibold"
//             >
//               Go to Documents
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// Wishlist Limit Popup
const WishlistLimitPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Action Required</h2>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              You have added 3 or more universities to your wishlist! To continue building your profile, please upload your documents and start applying.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-center">
  <Button
    onClick={() => { onClose(); }}
    className="px-6 py-2 h-9 text-sm bg-[#E08D3C] hover:bg-[#c77a32] text-white font-semibold rounded-md"
  >
    Apply in University
  </Button>
</div>
        </div>
      </div>
    </div>
  , document.body);
};

// Profile Incomplete Modal
const ProfileIncompleteModal = ({ isOpen, onClose, profilePercentage }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoToProfile = () => {
    onClose();
    navigate("/profilebuilder");
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Complete Your Profile</h2>
                <p className="text-sm text-white text-opacity-90">Required to apply</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              To make your application process smooth and easy, please complete your profile first.
            </p>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Profile Completion</span>
                <span className="font-semibold text-[#E08D3C]">{profilePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-[#E08D3C] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${profilePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Discover the best courses for you</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-fill application forms instantly</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-blue-800">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Boost your acceptance chances</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleGoToProfile}
              className="flex-1 h-11 bg-[#E08D3C] hover:bg-[#c77a32] text-white font-semibold"
            >
              Complete Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
};

const generateFormFields = (course, university) => {
  const fields = [];
  
  // Section 1: Personal Information (Always Required)
  fields.push({
    section: 'Personal Information',
    sectionNumber: 1,
    fields: [
      {
        id: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'Enter your full name',
        validation: (value) => value?.trim() ? null : 'Full name is required'
      },
      {
        id: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'your.email@example.com',
        validation: (value) => {
          if (!value?.trim()) return 'Email is required';
          if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
          return null;
        }
      },
      {
        id: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: '+1234567890',
        validation: (value) => value?.trim() ? null : 'Phone number is required'
      },
      {
        id: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        max: (() => {
          const d = new Date();
          d.setFullYear(d.getFullYear() - 15);
          return d.toISOString().split('T')[0];
        })(),
        validation: (value) => {
          if (!value) return 'Date of birth is required';
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          const monthDiff = new Date().getMonth() - new Date(value).getMonth();
          const exactAge = monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < new Date(value).getDate()) ? age - 1 : age;
          if (exactAge < 15) return 'You must be at least 15 years old to apply';
          return null;
        }
      },
      {
        id: 'nationality',
        label: 'Nationality',
        type: 'text',
        required: true,
        placeholder: 'Your nationality',
        validation: (value) => value?.trim() ? null : 'Nationality is required'
      },
      {
        id: 'passportNumber',
        label: 'Passport Number',
        type: 'text',
        required: false,
        placeholder: 'Optional'
      }
    ]
  });
  
  // Section 2: Academic Background (Dynamic based on degree level)
  const academicFields = [];
  
  // Previous degree required for Masters/PhD
  if (course.degree_type === 'masters' || course.degree_type === 'phd') {
    academicFields.push({
      id: 'previousDegree',
      label: 'Previous Degree',
      type: 'text',
      required: true,
      placeholder: 'e.g., Bachelor of Science in Computer Science',
      validation: (value) => value?.trim() ? null : 'Previous degree is required for graduate programs'
    });
    
    academicFields.push({
      id: 'previousUniversity',
      label: 'Previous University',
      type: 'text',
      required: true,
      placeholder: 'Name of your previous university',
      validation: (value) => value?.trim() ? null : 'Previous university is required'
    });
    
    academicFields.push({
      id: 'graduationYear',
      label: 'Graduation Year',
      type: 'number',
      required: true,
      placeholder: 'e.g., 2023',
      validation: (value) => {
        if (!value) return 'Graduation year is required';
        const year = parseInt(value);
        if (year < 1950 || year > new Date().getFullYear() + 1) return 'Invalid year';
        return null;
      }
    });
  }
  
  // For PhD, add research experience
  if (course.degree_type === 'phd') {
    academicFields.push({
      id: 'researchExperience',
      label: 'Research Experience',
      type: 'textarea',
      required: true,
      placeholder: 'Describe your research experience and interests...',
      rows: 4,
      validation: (value) => {
        if (!value?.trim()) return 'Research experience is required for PhD programs';
        if (value.trim().length < 100) return 'Please provide at least 100 characters';
        return null;
      }
    });
    
    academicFields.push({
      id: 'publications',
      label: 'Publications (if any)',
      type: 'textarea',
      required: false,
      placeholder: 'List your publications...',
      rows: 3
    });
  }
  
  // GPA/Grade (Always required)
  academicFields.push({
    id: 'gpa',
    label: `GPA / Grade ${course.min_gpa ? `(Min: ${course.min_gpa})` : ''}`,
    type: 'text',
    required: true,
    placeholder: course.min_gpa ? `Minimum: ${course.min_gpa}` : 'Your GPA or grade',
    validation: (value) => value?.trim() ? null : 'GPA/Grade is required'
  });
  
  academicFields.push({
    id: 'gradingSystem',
    label: 'Grading System',
    type: 'select',
    required: false,
    options: [
      { value: '', label: 'Select grading system' },
      { value: '4.0', label: '4.0 Scale' },
      { value: '10.0', label: '10.0 Scale' },
      { value: '100', label: 'Percentage (100)' },
      { value: 'other', label: 'Other' }
    ]
  });
  
  fields.push({
    section: 'Academic Background',
    sectionNumber: 2,
    fields: academicFields
  });
  
  // Section 3: Language Proficiency (Dynamic based on course requirements)
  const languageFields = [];
  
  languageFields.push({
    id: 'languageTest',
    label: `Language Test ${course.min_ielts ? `(Min IELTS: ${course.min_ielts})` : ''}`,
    type: 'select',
    required: course.min_ielts ? true : false,
    options: [
      { value: '', label: 'Select test type' },
      { value: 'IELTS', label: 'IELTS' },
      { value: 'TOEFL', label: 'TOEFL' },
      { value: 'PTE', label: 'PTE' },
      { value: 'Duolingo', label: 'Duolingo English Test' },
      { value: 'Cambridge', label: 'Cambridge English' },
      { value: 'other', label: 'Other' }
    ],
    validation: course.min_ielts 
      ? (value) => value ? null : 'Language test is required for this course'
      : null
  });
  
  languageFields.push({
    id: 'languageScore',
    label: 'Score',
    type: 'text',
    required: course.min_ielts ? true : false,
    placeholder: course.min_ielts ? `Minimum: ${course.min_ielts}` : 'Your score',
    validation: course.min_ielts
      ? (value) => value?.trim() ? null : 'Language score is required'
      : null
  });
  
  languageFields.push({
    id: 'testDate',
    label: 'Test Date',
    type: 'date',
    required: false,
    placeholder: 'When did you take the test?'
  });
  
  fields.push({
    section: 'Language Proficiency',
    sectionNumber: 3,
    fields: languageFields
  });
  
  // Section 4: Work Experience (For Masters/PhD or Professional programs)
  if (course.degree_type === 'masters' || course.degree_type === 'phd' || 
      course.name?.toLowerCase().includes('mba') || 
      course.name?.toLowerCase().includes('executive')) {
    fields.push({
      section: 'Work Experience',
      sectionNumber: 4,
      fields: [
        {
          id: 'workExperience',
          label: 'Work Experience',
          type: 'textarea',
          required: course.degree_type === 'phd' || course.name?.toLowerCase().includes('mba'),
          placeholder: 'Describe your relevant work experience...',
          rows: 4,
          validation: (course.degree_type === 'phd' || course.name?.toLowerCase().includes('mba'))
            ? (value) => {
                if (!value?.trim()) return 'Work experience is required for this program';
                if (value.trim().length < 50) return 'Please provide at least 50 characters';
                return null;
              }
            : null
        },
        {
          id: 'yearsOfExperience',
          label: 'Years of Experience',
          type: 'number',
          required: false,
          placeholder: 'e.g., 3',
          min: 0,
          max: 50
        }
      ]
    });
  }
  
  // Add this BEFORE the "Letter of Motivation" section

// Section: Intake Preference (Dynamic based on available intakes)
const intakeSectionNumber = fields.length + 1;
const intakeFields = [];

// Get available intake seasons from course
const availableIntakes = course.intake_season 
  ? [course.intake_season] 
  : ['WINTER', 'SUMMER', 'SPRING', 'FALL'];

// Current year and next 2 years
const currentYear = new Date().getFullYear();
const availableYears = [currentYear, currentYear + 1, currentYear + 2];

intakeFields.push({
  id: 'targetSemester',
  label: 'Preferred Intake Season',
  type: 'select',
  required: true,
  options: [
    { value: '', label: 'Select intake season' },
    { value: 'WINTER', label: 'Winter' },
    { value: 'SUMMER', label: 'Summer' },
    { value: 'SPRING', label: 'Spring' },
    { value: 'FALL', label: 'Fall' },
  ],
  validation: (value) => value ? null : 'Please select your preferred intake season'
});

intakeFields.push({
  id: 'targetYear',
  label: 'Preferred Intake Year',
  type: 'select',
  required: true,
  options: [
    { value: '', label: 'Select year' },
    ...availableYears.map(year => ({
      value: year.toString(),
      label: year.toString()
    }))
  ],
  validation: (value) => value ? null : 'Please select your preferred intake year'
});

fields.push({
  section: 'Intake Preference',
  sectionNumber: intakeSectionNumber,
  fields: intakeFields
});

  // Section 5: Letter of Motivation (Always Required)
  const motivationSectionNumber = fields.length + 1;
  fields.push({
    section: 'Letter of Motivation',
    sectionNumber: motivationSectionNumber,
    fields: [
      {
        id: 'motivation',
        label: 'Why do you want to study this course?',
        type: 'textarea',
        required: true,
        placeholder: `Explain your motivation for applying to ${course.name} at ${university?.name}...\n\nMinimum 100 characters required.`,
        rows: 6,
        validation: (value) => {
          if (!value?.trim()) return 'Letter of motivation is required';
          if (value.trim().length < 100) return 'Motivation letter should be at least 100 characters';
          return null;
        },
        showCharCount: true,
        minChars: 100
      },
      {
        id: 'careerGoals',
        label: 'Career Goals',
        type: 'textarea',
        required: false,
        placeholder: 'What are your career goals after completing this program?',
        rows: 3
      }
    ]
  });
  
  // Section 6: Additional Documents/Information
  const additionalSectionNumber = fields.length + 1;
  const additionalFields = [];
  
  // For specific programs, add specific requirements
  if (course.field_of_study?.toLowerCase().includes('art') || 
      course.field_of_study?.toLowerCase().includes('design')) {
    additionalFields.push({
      id: 'portfolioLink',
      label: 'Portfolio Link',
      type: 'url',
      required: true,
      placeholder: 'https://yourportfolio.com',
      validation: (value) => {
        if (!value?.trim()) return 'Portfolio is required for this program';
        try {
          new URL(value);
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    });
  }
  
  if (course.field_of_study?.toLowerCase().includes('music')) {
    additionalFields.push({
      id: 'auditionLink',
      label: 'Audition/Performance Link',
      type: 'url',
      required: false,
      placeholder: 'https://youtube.com/...'
    });
  }
  
  additionalFields.push({
    id: 'additionalInfo',
    label: 'Additional Information',
    type: 'textarea',
    required: false,
    placeholder: 'Share any additional information that supports your application...',
    rows: 3
  });
  
  if (additionalFields.length > 0) {
    fields.push({
      section: 'Additional Information',
      sectionNumber: additionalSectionNumber,
      fields: additionalFields
    });
  }
  
  return fields;
};

// ============ DYNAMIC APPLICATION FORM ============
// ============ DYNAMIC APPLICATION FORM ============
const DynamicApplicationFormModal = ({ 
  university, 
  course, 
  isOpen, 
  onClose, 
  onSubmit, 
  profileData, 
  profileLoading,
  user,
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Check if user has filled anything before closing
  const hasUnsavedData = () => {
    const metaKeys = ['targetCourse','targetCourseId','targetUniversity','targetUniversityId','degreeLevel','intakeSeason'];
    return Object.entries(formData).some(([k, v]) => !metaKeys.includes(k) && v !== '' && v !== undefined && v !== null);
  };

  const handleRequestClose = () => {
    if (hasUnsavedData()) {
      setShowLeaveConfirm(true);
    } else {
      onClose();
    }
  };

  const convertDateFormat = (dateStr) => {
    if (!dateStr) return '';
    // Convert "2003-05-05" to "05-05-2003"
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  // Generate dynamic form fields when course changes
// Modify DynamicApplicationFormModal useEffect (around line 780)
// REPLACE the entire useEffect with:
  useEffect(() => {
    if (isOpen && course && university) {
      console.log('[DynamicForm] Generating form fields for course:', course.name);
      
      const fields = generateFormFields(course, university);
      setFormFields(fields);
      
      // Initialize form data with profile data if available
      const initialData = {
        // Hidden metadata
        targetCourse: course.name,
        targetCourseId: course.id,
        targetUniversity: university.name,
        targetUniversityId: university.id,
        degreeLevel: course.degree_type,
        intakeSeason: course.intake_season,
      };

      // Fetch fresh profile data directly from the API every time form opens
      // This avoids timing issues with parent state propagation
      const fillFormFromProfile = async () => {
        try {
          const { makeAuthenticatedRequest } = await import('@/services/tokenService');
          const raw = await makeAuthenticatedRequest('/api/v1/students/profile', { method: 'GET' });
          // API returns { success, message, data: { basic_info, education, test_scores, preferences, ... } }
          const profile = raw?.data || raw;
          console.log('[DynamicForm] 🔑 Fresh profile fetched:', profile);
          fillInitialData(profile, fields, initialData);
        } catch (err) {
          console.error('[DynamicForm] Could not fetch profile, trying prop fallback:', err);
          // Fallback to prop if fetch fails
          if (profileData) fillInitialData(profileData, fields, initialData);
          else applyEmptyDefaults(fields, initialData);
        }
      };

      fillFormFromProfile();

      setErrors({});
      console.log('[DynamicForm] Generated', fields.length, 'sections');
    }
  }, [isOpen, course, university, user]);

  // Separated fill logic for reuse
  const fillInitialData = (profileData, fields, initialData) => {
      // Auto-fill from profile if available
      if (profileData) {
        console.log('[DynamicForm] Auto-filling with profile data:', profileData);
        
        // Support both old key "testing_basic_info" and new key "basic_info"
        const basicInfo = profileData.basic_info || profileData.testing_basic_info || {};
        const education = profileData.education || {};
        const testScores = profileData.test_scores || {};
        const experience = profileData.experience || {};
        const preferences = profileData.preferences || {};
        
        // ── Personal Information ──────────────────────────────────────────
        // Full name: combine from user auth object first, fallback to profileData
        initialData.fullName = 
          (user?.firstName && user?.lastName)
            ? `${user.firstName} ${user.lastName}`.trim()
            : (user?.first_name && user?.last_name)
            ? `${user.first_name} ${user.last_name}`.trim()
            : user?.name || 
              basicInfo.full_name ||
              profileData?.full_name || 
              `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || 
              '';

        initialData.email = user?.email || profileData?.email || '';

        // Phone: check basicInfo first, then top-level profileData
        initialData.phone = 
          basicInfo.phone || 
          profileData?.phone || 
          '';

        // Date of Birth: HTML date inputs need YYYY-MM-DD format (do NOT convert)
        initialData.dateOfBirth = 
          basicInfo.date_of_birth || 
          profileData?.date_of_birth || 
          '';

        // Nationality
        initialData.nationality = 
          basicInfo.nationality || 
          profileData?.nationality || 
          '';

        initialData.passportNumber = 
          basicInfo.passport_number || 
          profileData?.passport_number || 
          '';
        
        // ── Academic Background (from education_entries array) ─────────────
        // Education data is stored as an array of entries, pick the latest/highest one
        const educationEntries = education.education_entries || [];
        const latestEdu = educationEntries.length > 0 
          ? educationEntries[educationEntries.length - 1] 
          : {};
        
        console.log('[DynamicForm] Education entries:', educationEntries.length, 'Latest:', latestEdu);

        // Map education_level + field_of_study → "Previous Degree"
        const levelLabels = {
          SSC: 'SSC', HSC: 'HSC', high_school: 'High School',
          bachelors: "Bachelor's", masters: "Master's", phd: 'PhD', other: 'Other'
        };
        const degreeLabel = levelLabels[latestEdu.education_level] || latestEdu.education_level || '';
        const fieldLabel = latestEdu.field_of_study || '';
        initialData.previousDegree = degreeLabel && fieldLabel 
          ? `${degreeLabel} in ${fieldLabel}` 
          : degreeLabel || fieldLabel || '';

        initialData.previousUniversity = latestEdu.institution_name || '';
        initialData.graduationYear = latestEdu.end_year || latestEdu.graduation_year || '';
        initialData.gpa = latestEdu.gpa || '';
        initialData.gradingSystem = education.grading_system || '';
        
        // ── Research/Work Experience ──────────────────────────────────────
        initialData.researchExperience = '';
        initialData.publications = '';
        
        // Work experience - combine if available
        // Profile builder uses: company_name, job_title, start_date, end_date, description
        if (experience.has_work_experience && experience.work_experiences?.length > 0) {
          const workExpText = experience.work_experiences
            .map(exp => `${exp.job_title || exp.title || ''} at ${exp.company_name || exp.company || ''} ${exp.start_date ? `(${exp.start_date}${exp.end_date ? ' - ' + exp.end_date : ' - Present'})` : ''}`.trim())
            .join('\n');
          initialData.workExperience = workExpText;
        } else if (experience.experience_summary) {
          initialData.workExperience = experience.experience_summary;
        } else if (experience.volunteer_work) {
          initialData.workExperience = `Volunteer: ${experience.volunteer_work}`;
        } else {
          initialData.workExperience = '';
        }
        
        initialData.yearsOfExperience = experience.total_experience_years || '';
        
        // ── Language Proficiency ──────────────────────────────────────────
        // Profile API uses object fields for each test: ielts, toefl, pte, duolingo, etc.
        let selectedTestName = '';
        let selectedTestScore = '';
        let selectedTestDate = '';

        const languageTestKeys = [
          { key: 'ielts', value: 'IELTS' },
          { key: 'toefl', value: 'TOEFL' },
          { key: 'pte', value: 'PTE' },
          { key: 'duolingo', value: 'Duolingo' },
        ];

        for (const test of languageTestKeys) {
          const testData = testScores[test.key];
          if (testData && testData.overall_score) {
            selectedTestName = test.value;
            selectedTestScore = testData.overall_score;
            selectedTestDate = testData.test_date || '';
            break; // take the first valid language test found
          }
        }
        
        // If not found in primary language tests, check 'other'
        if (!selectedTestName && testScores.other && testScores.other.overall_score) {
           const examName = (testScores.other.exam_name || '').toLowerCase();
           if (examName.includes('cambridge') || examName.includes('c1') || examName.includes('c2') || examName.includes('english')) {
             selectedTestName = 'Cambridge';
           } else {
             selectedTestName = 'other';
           }
           selectedTestScore = testScores.other.overall_score;
           selectedTestDate = testScores.other.test_date || '';
        }

        // Fallback for older profiles that might still have the old test_score_entries array format
        const testScoreEntries = testScores.test_score_entries || [];
        const latestTest = testScoreEntries.length > 0 ? testScoreEntries[0] : {};

        initialData.languageTest = selectedTestName || latestTest.test_type || testScores.test_type || '';
        initialData.languageScore = selectedTestScore || latestTest.overall_score || testScores.overall_score || '';
        // Test date: HTML date input needs YYYY-MM-DD (do NOT convert)
        initialData.testDate = selectedTestDate || latestTest.test_date || testScores.test_date || '';
        
        // ── Intake Preferences ────────────────────────────────────────────
        // intake_semester is an array like ["Winter (Nov-Dec)"], pick first value
        // Dropdown options use uppercase season names: "WINTER", "SUMMER", "SPRING", "FALL"
        // So we extract just the season keyword and uppercase it
        const intakeSemesterArr = preferences.intake_semester || [];
        const rawIntakeSemester = Array.isArray(intakeSemesterArr) ? intakeSemesterArr[0] || '' : intakeSemesterArr || '';
        // Extract season keyword: "Winter (Nov-Dec)" → "WINTER", "Summer" → "SUMMER"
        const seasonKeyword = rawIntakeSemester.split(/[\s(]/)[0].toUpperCase();
        initialData.targetSemester = seasonKeyword || '';
        initialData.targetYear = preferences.intake_year ? String(preferences.intake_year) : '';
        
        console.log('[DynamicForm] 🔍 Mapped fields debug:', {
          graduationYear: initialData.graduationYear,
          languageTest: initialData.languageTest,
          languageScore: initialData.languageScore,
          targetSemester: initialData.targetSemester,
          targetYear: initialData.targetYear,
          rawIntakeSemester,
          rawTestScores: testScores,
          rawLatestTest: latestTest,
          rawLatestEdu: latestEdu,
        });
        
        // Leave motivation and additional info empty for user to fill
        initialData.motivation = '';
        initialData.careerGoals = '';
        initialData.additionalInfo = '';
        initialData.portfolioLink = '';
        initialData.auditionLink = '';
        
        console.log('[DynamicForm] ✅ Auto-filled data:', initialData);
      } else {
        applyEmptyDefaults(fields, initialData);
      }
      setFormData({...initialData});
  };

  const applyEmptyDefaults = (fields, initialData) => {
    fields.forEach(section => {
      section.fields.forEach(field => {
        if (!initialData[field.id]) {
          initialData[field.id] = '';
        }
      });
    });
    setFormData({...initialData});
  };

  // Check if user is returning from profile builder


  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    formFields.forEach(section => {
      section.fields.forEach(field => {
        if (field.validation) {
          const error = field.validation(formData[field.id]);
          if (error) {
            newErrors[field.id] = error;
          }
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert('Please fill in all required fields correctly.');
      return;
    }
    
    console.log('[DynamicForm] Form validated, submitting:', formData);
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit(formData, university);
    }, 1000);
  };

  // Check if profile is complete before allowing application


  // Render different field types
  const renderField = (field) => {
    const hasError = errors[field.id];
    const value = formData[field.id] || '';
    
    switch (field.type) {
      case 'select':
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.id} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
           <Select value={value || ""} onValueChange={(val) => handleInputChange(field.id, val)}>
  <SelectTrigger 
    id={field.id}
    className={cn(
      "w-full h-9 rounded-md border text-xs px-3 bg-white",
      hasError ? "border-red-500" : "border-gray-300"
    )}>
    <SelectValue placeholder="— Choose from dropdown —" />
  </SelectTrigger>
              <SelectContent position="popper" className="z-[99999]">
               {field.options
  .filter(option => option.value !== '')
  .map(option => (
    <SelectItem key={option.value} value={option.value}>
      {option.label}
    </SelectItem>
  ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-red-500 text-[10px] mt-0.5">{hasError}</p>}
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.id} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={field.rows || 3}
              placeholder={field.placeholder}
              className={cn("border-gray-300 text-xs", hasError && "border-red-500")}
            />
            {field.showCharCount && (
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>{value.length} / {field.minChars} minimum</span>
                {hasError && <span className="text-red-500">{hasError}</span>}
              </div>
            )}
            {!field.showCharCount && hasError && (
              <p className="text-red-500 text-[10px] mt-0.5">{hasError}</p>
            )}
          </div>
        );
        
      default: // text, email, tel, date, number, url
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.id} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className={cn("border-gray-300 h-9 text-xs", hasError && "border-red-500")}
            />
            {hasError && <p className="text-red-500 text-[10px] mt-0.5">{hasError}</p>}
          </div>
        );
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !course) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-3">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Compact */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">{course.name}</h2>
                <p className="text-xs text-white text-opacity-90">{university?.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestClose}
              className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Course Summary - Compact */}
        <div className="p-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-blue-600 block mb-0.5">Degree Level:</span>
              <p className="font-semibold text-blue-900 capitalize text-xs">{course.degree_type}</p>
            </div>
            <div>
              <span className="text-blue-600 block mb-0.5">Duration:</span>
              <p className="font-semibold text-blue-900 text-xs">{course.duration_years} years</p>
            </div>
            <div>
              <span className="text-blue-600 block mb-0.5">Tuition Fee:</span>
              <p className="font-semibold text-blue-900 text-xs">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: course.currency || 'EUR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(course.tuition_fee || 0)}
              </p>
            </div>
            <div>
              <span className="text-blue-600 block mb-0.5">Intake:</span>
              <p className="font-semibold text-blue-900 text-xs">{course.intake_season}</p>
            </div>
          </div>
        </div>

        {/* Requirements Notice - Compact */}
        <div className="p-3 bg-yellow-50 border-b border-yellow-100 flex-shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <h4 className="font-semibold text-yellow-900 mb-1">Minimum Requirements</h4>
              <div className="text-yellow-700 space-y-0.5">
                <p>• Min GPA: <strong>{course.min_gpa || 'N/A'}</strong> | Min IELTS: <strong>{course.min_ielts || 'N/A'}</strong></p>
                {(course.degree_type === 'masters' || course.degree_type === 'phd') && (
                  <p>• Bachelor's degree required</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {profileLoading && (
          <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-shrink-0">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs text-blue-700">Loading your profile data...</span>
          </div>
        )}

        {profileData && !profileLoading && (
          <div className="p-3 bg-green-50 border-b border-green-100 flex items-start gap-2 flex-shrink-0">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-700">
              <p className="font-semibold mb-1">Profile data loaded</p>
              <p>Some fields have been auto-filled from your profile. Please review and complete remaining fields.</p>
            </div>
          </div>
        )}

        {/* Dynamic Form Sections - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((section) => (
              <div key={section.sectionNumber} className="space-y-3">
                <h3 className="text-sm font-bold text-[#2C3539] flex items-center pb-2 border-b border-gray-200">
                  <span className="w-6 h-6 rounded-full bg-[#E08D3C] text-white flex items-center justify-center mr-2 text-xs font-bold">
                    {section.sectionNumber}
                  </span>
                  {section.section}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.fields.map((field) => {
                    // Full width for textareas and certain fields
                    const isFullWidth = field.type === 'textarea' || 
                                       field.id === 'email' ||
                                       field.id === 'portfolioLink' ||
                                       field.id === 'auditionLink';
                    
                    return (
                      <div key={field.id} className={isFullWidth ? "md:col-span-2" : ""}>
                        {renderField(field)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Footer - Compact & Sticky */}
        <div className="p-3 border-t border-gray-200 bg-white flex justify-between items-center gap-3 rounded-b-lg flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleRequestClose}
            disabled={loading}
            className="px-4 py-2 h-9 text-xs">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 h-9 bg-[#E08D3C] hover:bg-[#c77a32] text-white text-xs font-semibold">
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Processing...
              </>
            ) : (
              <>
                Create Application
                <ChevronRight className="w-3 h-3 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Leave Confirmation Dialog ─────────────────────────────── */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="bg-white rounded-xl shadow-2xl p-6 mx-4 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-[#E08D3C]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Leave Application?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to leave? Your progress will be lost and you'll need to start again.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-10 text-sm font-semibold border-gray-300">
                Stay
              </Button>
              <Button
                type="button"
                onClick={() => { setShowLeaveConfirm(false); onClose(); }}
                className="flex-1 h-10 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white">
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  , document.body);
};
// ============ END DYNAMIC FORM ============

// ── Consulting Fee Info Modal ─────────────────────────────────────────────────
const PublicUniversityPaymentPlanModal = ({ isOpen, onClose, onSelectPlan }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-2">Public University Application</h2>
        <p className="text-gray-500 text-center mb-8">Choose an application plan to continue.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan 1: Single */}
          <div className="border-2 border-gray-200 rounded-xl p-6 flex flex-col hover:border-[#C4DFF0] transition-colors cursor-pointer group" onClick={() => onSelectPlan({ type: 'single', amount: 1 })}>
            <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-[#2C3539]">Single Application</h3>
            <div className="text-3xl font-bold text-[#E08D3C] mb-4">₹1 <span className="text-sm font-normal text-gray-400 line-through">₹2,349</span></div>
            <ul className="space-y-3 mb-6 flex-1 text-sm text-gray-600">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Apply to 1 public university</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Profile evaluation</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Application processing support</li>
            </ul>
            <Button className="w-full bg-white border border-[#E08D3C] text-[#E08D3C] hover:bg-[#E08D3C] hover:text-white transition-colors" onClick={() => onSelectPlan({ type: 'single', amount: 1 })}>Select Single</Button>
          </div>
          
          {/* Plan 2: 5 Unis */}
          <div className="border-2 border-[#E08D3C] bg-orange-50/30 rounded-xl p-6 flex flex-col relative cursor-pointer group hover:bg-orange-50/50 transition-colors" onClick={() => onSelectPlan({ type: 'bundle', amount: 5 })}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E08D3C] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">5-University Bundle</h3>
            <div className="text-3xl font-bold text-[#E08D3C] mb-1">₹5 <span className="text-sm font-normal text-gray-400 line-through">₹9,999</span></div>
            <div className="text-xs text-gray-500 mb-4 line-through">₹11,745 (Save 15%)</div>
            <ul className="space-y-3 mb-6 flex-1 text-sm text-gray-600">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Apply to 5 public universities</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Premium profile evaluation</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Priority application processing</li>
            </ul>
            <Button className="w-full bg-[#E08D3C] hover:bg-[#c77a32] text-white transition-colors" onClick={(e) => { e.stopPropagation(); onSelectPlan({ type: 'bundle', amount: 5 }); }}>Select Bundle</Button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
};

const BundleUsageModal = ({ isOpen, remaining, onProceed }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl flex flex-col items-center text-center relative">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-[#2C3539] mb-4">Application Used!</h2>
        <p className="text-gray-600 mb-6 text-sm">
          We have successfully deducted <strong>1 application</strong> from your 5-University Bundle. You have <strong>{remaining} application{remaining !== 1 ? 's' : ''}</strong> remaining.
        </p>
        <Button onClick={onProceed} className="w-full bg-[#E08D3C] hover:bg-[#c77a32] text-white">
          Proceed
        </Button>
      </div>
    </div>
  , document.body);
};

// ── Payment Modal (Razorpay) ─────────────────────────────────────────────────
const PaymentModal = ({ university, isOpen, onClose, onSuccess, course, paymentPlan }) => {
  const { user } = useAuth();
  const [paymentHealthy, setPaymentHealthy] = useState(true);
  const [verifying, setVerifying]           = useState(false);
  const [verifyError, setVerifyError]       = useState<string | null>(null);
  const [verified, setVerified]             = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setVerified(false);
      setVerifyError(null);
      checkPaymentHealth().then((ok) => setPaymentHealthy(ok));
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const downloadReceipt = (paymentData: any) => {
    const doc = new jsPDF();
    const pageW = 210;

    // ── Logo ──────────────────────────────────────────────────────
    const logo = new Image();
    logo.src = "/assets/Uni360-logo.png";
    try { doc.addImage(logo, "PNG", 14, 10, 28, 14); } catch {}

    // ── Top right contact ─────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Uni360",                    pageW - 14, 14, { align: "right" });
    doc.text("support@uni360degree.com",  pageW - 14, 19, { align: "right" });
    doc.text("https://uni360degree.com",  pageW - 14, 24, { align: "right" });

    // ── Divider ───────────────────────────────────────────────────
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 30, pageW - 14, 30);

    // ── Title ─────────────────────────────────────────────────────
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Payment Receipt", pageW / 2, 46, { align: "center" });

    // ── Receipt No & Date ─────────────────────────────────────────
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

    // ── Divider ───────────────────────────────────────────────────
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 71, pageW - 14, 71);

    // ── Table header ──────────────────────────────────────────────
    doc.setFillColor(240, 240, 245);
    doc.rect(14, 75, 182, 10, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Details",     60,  82, { align: "center" });
    doc.text("Information", 150, 82, { align: "center" });

    // ── Table rows ────────────────────────────────────────────────
    const rows: [string, string][] = [
      ["Name",         user?.name || user?.fullName || user?.firstName || "Student"],
      ["University",   university?.name ?? "N/A"],
      ["Course",       course?.name     ?? "N/A"],
      ["Purpose",      paymentPlan?.type === 'bundle' ? "5-University Application Bundle" : "Single University Application Fee"],
      ["Amount Paid",  `₹${paymentPlan?.amount || 1}`],
      ["Transaction ID", paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"],
      ["Payment ID",   paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? "N/A"],
      ["Order ID",     paymentData?.orderId ?? paymentData?.razorpay_order_id ?? "N/A"],
      ["Status",       "Verified ✓"],
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

    // ── Footer ────────────────────────────────────────────────────
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

    doc.save(`app_receipt_${paymentData?.paymentId ?? paymentData?.razorpay_payment_id ?? Date.now()}.pdf`);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#C4DFF0] to-[#E08D3C] rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <CreditCard className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Application Fee</h2>
              <p className="text-xs opacity-90">{paymentPlan?.type === 'bundle' ? '5-University Bundle' : 'Single Application'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Fee summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{paymentPlan?.type === 'bundle' ? '5-University Bundle' : 'Single Application Fee'}</span>
              <span className="font-medium">₹{paymentPlan?.amount || 1}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-[#E08D3C]">₹{paymentPlan?.amount || 1}</span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 text-center">
            <p className="text-xs text-green-700 font-medium">{paymentPlan?.type === 'bundle' ? 'Apply to 5 public universities!' : 'Apply to this public university.'}</p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Secured by Razorpay · UPI, Card, Net Banking accepted
          </p>

          {/* Health check failed */}
          {!paymentHealthy && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Payment service is currently unavailable. Please try again later.
            </div>
          )}

          {/* Verify error */}
          {verifyError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {verifyError}
            </div>
          )}

          {/* Verifying spinner */}
          {verifying && (
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying payment…
            </div>
          )}

          {/* Verified success state */}
          {verified && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <Check className="w-4 h-4 flex-shrink-0" />
              Payment verified! Receipt downloaded. Redirecting…
            </div>
          )}

          {/* Razorpay button — already verifies signature internally before calling onSuccess */}
          {!verified && paymentHealthy && (
            <RazorpayButton
              amount={(paymentPlan?.amount || 1) * 100}
              label={`Pay ₹${paymentPlan?.amount || 1} & Submit Application`}
              description={paymentPlan?.type === 'bundle' ? `5-University Bundle` : `Application fee — ${university?.name}`}
              notes={{ purpose: "Application Fee", section: "UNIVERSITIES", plan: paymentPlan?.type }}
              receipt={`af_${(university?.id ?? '').slice(0, 8)}_${Date.now().toString().slice(-8)}`}
              paymentType="CONSULTANCY_FEES"
              className="w-full bg-[#2C3539] hover:bg-[#1e2529] text-white"
              onSuccess={(paymentData) => {
                // RazorpayButton already verified the signature before calling this.
                // Just download the receipt and proceed.
                console.log('[Universities] ✅ Payment verified by RazorpayButton:', paymentData);
                setVerified(true);
                downloadReceipt(paymentData);
                setTimeout(() => onSuccess(university), 1500);
              }}
              onFailure={(err) => {
                console.error('[Universities] Payment failed:', err);
                setVerifyError("Payment failed. Please try again.");
              }}
            />
          )}

          {!verified && (
            <Button variant="ghost" className="w-full text-sm text-gray-500" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  , document.body);
};

// ── Submission Result Popup ───────────────────────────────────────────────────
const SubmissionResultPopup = ({ isOpen, success, data, error, onClose, university }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl flex flex-col items-center text-center">
        {success ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#2C3539] mb-8 leading-tight">
              Application Submitted<br/>Successfully!
            </h2>
            
            <div className="w-full text-left space-y-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">University:</span>
                <span className="font-semibold text-right max-w-[60%] text-[#2C3539]">{university?.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Reference Number:</span>
                <span className="font-semibold text-[#E08D3C]">
                  {data?.referenceNumber || data?.application_id || data?.id || "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Status:</span>
                <span className="font-semibold text-green-600 uppercase">
                  {data?.status || "SUBMISSION_SUCCESSFUL"}
                </span>
              </div>
            </div>

            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-xs text-left mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Please keep your reference number safe for tracking</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[#2C3539] mb-4">
              Submission Failed
            </h2>
            <p className="text-gray-600 mb-8 text-sm px-2">
              {error || "An unexpected error occurred while submitting your application."}
            </p>
          </>
        )}

        <Button 
          className="w-full bg-[#E08D3C] hover:bg-[#c77a32] text-white py-6 text-base font-semibold rounded-xl transition-colors"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  , document.body);
};

// ── Application Submit Popup ───────────────────────────────────────────────────
const ApplicationSubmitPopup = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
  confirmationStatement: "I confirm my application to this course",
  agreeToTerms: true,
  additionalNotes: "No additional notes."
});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
confirmationStatement: "I confirm my application to this course",
  agreeToTerms: true,
  additionalNotes: "No additional notes."
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#2C3539]">
          <Check className="w-5 h-5 text-[#E08D3C]" />
          Submit Application
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <Label className="font-semibold text-gray-700">Confirmation Statement</Label>
            <Input 
              value={formData.confirmationStatement}
              onChange={e => setFormData({...formData, confirmationStatement: e.target.value})}
              placeholder="e.g., I confirm my application to this course"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-semibold text-gray-700">Additional Notes</Label>
            <Textarea 
              value={formData.additionalNotes}
              onChange={e => setFormData({...formData, additionalNotes: e.target.value})}
              placeholder="Any additional information you want to provide (optional)..."
              className="mt-1"
            />
          </div>
          <div className="flex items-start gap-2 pt-2">
            <input 
              type="checkbox" 
              id="agreeTerms"
              checked={formData.agreeToTerms}
              onChange={e => setFormData({...formData, agreeToTerms: e.target.checked})}
              className="mt-1"
            />
            <Label htmlFor="agreeTerms" className="text-sm cursor-pointer text-gray-600">
              I confirm that the information provided is accurate and I agree to the terms and conditions.
            </Label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button 
            className="bg-[#E08D3C] hover:bg-[#c77a32] text-white" 
            onClick={() => onSubmit(formData)}
            disabled={isSubmitting || !formData.agreeToTerms}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : "Submit Application"}
          </Button>
        </div>
      </div>
    </div>
  , document.body);
};

const UniversityDetailsModal = ({ isOpen, onClose, university, universityStats, onViewCourses }) => {
  const stats = universityStats || {};

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !university) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 sm:p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-gray-200 relative"
        onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}
      >
        {/* Header Image & Close */}
        <div className="relative h-48 sm:h-56 overflow-hidden flex-shrink-0">
          <img
            src={university.image_url || "https://images.unsplash.com/photo-1562774053-701939374585?w=1000&q=80"}
            alt={university.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C3539]/90 via-[#2C3539]/40 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              {university.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
              <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-[#E08D3C]" />
                {university.city}, {university.country}
              </span>
              {(university.ranking || university.qsRanking) && (
                <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5 text-yellow-400" />
                  QS: #{university.qsRanking || university.ranking}
                </span>
              )}
              {university.universityType && (
                <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full capitalize">
                  <Building2 className="w-3.5 h-3.5 text-green-400" />
                  {university.universityType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Stats & Description */}
            <div className="space-y-6">
              {/* Stats Grid exactly like Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-xl px-4 py-3 border border-[#E08D3C]/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-4 h-4 text-[#E08D3C]" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Courses</span>
                  </div>
                  <div className="text-xl font-bold text-[#2C3539] leading-none">
                    {stats.totalCourses || university.total_courses || 0}
                  </div>
                </div>

                {(university.tuition_display || (stats.tuitionRange && stats.tuitionRange.min > 0)) ? (
                  <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-4 py-3 border border-[#C4DFF0]/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wide font-medium">Tuition Fees</span>
                    </div>
                    <div className="text-sm font-bold text-[#2C3539] leading-tight">
                      {university.tuition_display || new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.tuitionRange.min)}
                    </div>
                  </div>
                ) : university.totalStudents ? (
                  <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-4 py-3 border border-[#C4DFF0]/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-4 h-4 text-[#2C3539]" />
                      <span className="text-[10px] text-gray-600 uppercase tracking-wide font-medium">Students</span>
                    </div>
                    <div className="text-sm font-bold text-[#2C3539] leading-tight">
                      {new Intl.NumberFormat('en', { notation: 'compact' }).format(university.totalStudents)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-4 py-3 border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Levels</span>
                    </div>
                    <div className="text-sm font-bold text-[#2C3539] leading-tight">
                      {stats.degreeTypes?.length || 0} types
                    </div>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="bg-white/60 backdrop-blur rounded-xl p-5 border border-gray-200/60 shadow-sm">
                <h3 className="font-semibold text-[#2C3539] mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#E08D3C]" />
                  About University
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {university.description || `Experience world-class education at ${university.name}, located in the beautiful city of ${university.city}, ${university.country}.`}
                </p>
                {university.website && (
                  <a href={university.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    <Globe className="w-4 h-4" /> Visit Official Website
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Features & Quick Info */}
            <div className="space-y-6">
              
              {/* Features List */}
              <div className="bg-white/60 backdrop-blur rounded-xl p-5 border border-gray-200/60 shadow-sm">
                <h3 className="font-semibold text-[#2C3539] mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#E08D3C]" />
                  Campus Facilities
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Scholarships", available: university.scholarshipsAvailable, icon: DollarSign },
                    { label: "Accommodation", available: university.accommodationAvailable, icon: MapPin },
                    { label: "Career Services", available: university.careerServices, icon: Award },
                    { label: "Int'l Office", available: university.internationalOffice, icon: Globe },
                    { label: "Library", available: university.libraryServices, icon: BookOpen },
                  ].map((feature, idx) => feature.available ? (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{feature.label}</span>
                    </div>
                  ) : null)}
                  
                  {/* Provide fallback if nothing is true */}
                  {![university.scholarshipsAvailable, university.accommodationAvailable, university.careerServices, university.internationalOffice, university.libraryServices].some(Boolean) && (
                    <span className="text-xs text-gray-500 italic col-span-2">No special facilities listed.</span>
                  )}
                </div>
              </div>

              {/* Programs */}
              {stats.subjects && stats.subjects.length > 0 && (
                <div className="bg-white/60 backdrop-blur rounded-xl p-5 border border-gray-200/60 shadow-sm">
                  <h3 className="font-semibold text-[#2C3539] mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#E08D3C]" />
                    Popular Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.subjects.slice(0, 8).map((subject, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <Button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            className="bg-[#2C3539] hover:bg-[#E08D3C] text-white"
            onClick={() => {
              onClose();
              if (onViewCourses) onViewCourses(university);
            }}
          >
            View Courses
          </Button>
        </div>
      </motion.div>
    </div>
  , document.body);
};

export default function Universities() {
  const { selectedCountry } = useOutletContext<ContextType>();
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();
  const { user } = useAuth();

  // API data states
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple favorites (keep using in-memory storage for React artifact)
  // Favorites from API
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDegreeType, setSelectedDegreeType] = useState("all");
  const [selectedIntakeSeason, setSelectedIntakeSeason] = useState("all");
  const [tuitionRange, setTuitionRange] = useState("all");
  const [gpaRange, setGpaRange] = useState("all");
  // New filter states for dynamic API filters
const [universityType, setUniversityType] = useState("all");
const [institutionType, setInstitutionType] = useState("all");
const [universityRanking, setUniversityRanking] = useState("all");
const [scholarshipsOnly, setScholarshipsOnly] = useState(false);

const [courseSearch, setCourseSearch] = useState("");
const [courseDegreeLevel, setCourseDegreeLevel] = useState("all");
const [courseStudyMode, setCourseStudyMode] = useState("all");
const [courseTuitionMin, setCourseTuitionMin] = useState("");
const [courseTuitionMax, setCourseTuitionMax] = useState("");
const [courseDuration, setCourseDuration] = useState("");

// ADD these alongside your existing filter states:
const [statusFilter, setStatusFilter] = useState("");
const [institutionTypeFilter, setInstitutionTypeFilter] = useState("");
const [universityTypeFilter, setUniversityTypeFilter] = useState("");
const [worldRankingMin, setWorldRankingMin] = useState("");
const [worldRankingMax, setWorldRankingMax] = useState("");
const [nationalRankingMin, setNationalRankingMin] = useState("");
const [nationalRankingMax, setNationalRankingMax] = useState("");
const [qsRankingMin, setQsRankingMin] = useState("");
const [qsRankingMax, setQsRankingMax] = useState("");
const [tuitionMin, setTuitionMin] = useState("");
const [tuitionMax, setTuitionMax] = useState("");
const [tuitionCurrency, setTuitionCurrency] = useState("");
const [financialAidAvailable, setFinancialAidAvailable] = useState(false);
const [foundedYearMin, setFoundedYearMin] = useState("");
const [foundedYearMax, setFoundedYearMax] = useState("");
const [languageOfInstruction, setLanguageOfInstruction] = useState("");
const [availableLanguages, setAvailableLanguages] = useState([]); // from /universities API

const [verificationStatus, setVerificationStatus] = useState("");
const [isFeatured, setIsFeatured] = useState(false);
const [accommodationAvailable, setAccommodationAvailable] = useState(false);
const [internationalOffice, setInternationalOffice] = useState(false);
const [careerServices, setCareerServices] = useState(false);
const [libraryServices, setLibraryServices] = useState(false);
const [healthServices, setHealthServices] = useState(false);
const [sportsFacilities, setSportsFacilities] = useState(false);
const [totalStudentsMin, setTotalStudentsMin] = useState("");
const [totalStudentsMax, setTotalStudentsMax] = useState("");

const [statusOptions, setStatusOptions] = useState([]);
const [verificationStatusOptions, setVerificationStatusOptions] = useState([]);
const [currencyOptions, setCurrencyOptions] = useState([]);

// API Pagination filters (NEW - for backend integration)
  const [apiPage, setApiPage] = useState(1); // 1-based page number
  const [apiSize, setApiSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [apiCountry, setApiCountry] = useState("");
  const [apiDegreeLevel, setApiDegreeLevel] = useState("");

  // Filter options from API
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  // Store filter options from API
const [universityRankings, setUniversityRankings] = useState([]);
const [tuitionOptions, setTuitionOptions] = useState([]);
const [hasScholarships, setHasScholarships] = useState(false);

  // Modal states
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [showDocumentsIncompleteModal, setShowDocumentsIncompleteModal] = useState(false);
  const [showWishlistLimitPopup, setShowWishlistLimitPopup] = useState(false);
  const [showPublicUniPlanModal, setShowPublicUniPlanModal] = useState(false);
  const [showBundleUsageModal, setShowBundleUsageModal] = useState({ isOpen: false, remaining: 0 });
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<{ type: 'single' | 'bundle', amount: number } | null>(null);
const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(0);
  const [submitAppPopupOpen, setSubmitAppPopupOpen] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState(null);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [submissionResult, setSubmissionResult] = useState({
    isOpen: false,
    success: false,
    data: null,
    error: null
  });

  // Public Uni 5-Bundle payment status (persisted in localStorage)
  const [publicUniPlan, setPublicUniPlan] = useState(() => {
    try {
      const stored = localStorage.getItem('uni360_public_uni_plan');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  // Course statistics for universities
  const [universityStats, setUniversityStats] = useState({});
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Add this right after your state declarations to debug
useEffect(() => {
  console.log('=== STATE UPDATE ===');
  console.log('selectedUniversity:', selectedUniversity?.name || 'null');
  console.log('selectedCourse:', selectedCourse?.name || 'null');
  console.log('isModalOpen:', isModalOpen);
  console.log('isFormModalOpen:', isFormModalOpen);
  console.log('isPaymentModalOpen:', isPaymentModalOpen);
}, [selectedUniversity, selectedCourse, isModalOpen, isFormModalOpen, isPaymentModalOpen]);

  // Load initial data
 // Load initial data once on mount
  useEffect(() => {
    loadFilterOptions();
    loadData();
    loadFavorites();
  }, []); // Only runs once on mount

  // Check if user is returning from profile builder
useEffect(() => {
  const checkReturnFromProfile = async () => {
    const returnData = sessionStorage.getItem('returnToUniversity');
    
    if (returnData) {
      try {
        const { universityId, universityName, timestamp } = JSON.parse(returnData);
        
        // Check if timestamp is recent (within 1 hour)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - timestamp < oneHour) {
          console.log('[Universities] User returned from profile builder');
          
          // Check if profile is now complete
          const isComplete = await checkProfileCompletion();
          
          if (isComplete) {
            // Find the university
            const uni = universities.find(u => u.id === universityId);
            
            if (uni) {
              console.log('[Universities] Profile complete, opening course modal for:', universityName);
              setSelectedUniversity(uni);
              setIsModalOpen(true);
            }
          }
        }
        
        // Clear the return data
        sessionStorage.removeItem('returnToUniversity');
      } catch (error) {
        console.error('[Universities] Error processing return from profile:', error);
        sessionStorage.removeItem('returnToUniversity');
      }
    }
  };
  
  if (universities.length > 0) {
    checkReturnFromProfile();
  }
}, [universities]);

  // Load data when filters change (debounced to avoid excessive calls)
  // Load data when filters change (debounced to avoid excessive calls)
useEffect(() => {
  // Skip the initial render (already handled by first useEffect)
  const timer = setTimeout(() => {
    if (showFavorites) {
      loadFavorites(); // Load favorites when in wishlist view
    } else {
      loadData(); // Load universities when in main view
    }
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [
  selectedCountry,
  searchQuery,
  selectedCity,
  selectedState,
  selectedCourseFilter,
  selectedLanguage,
  selectedDegreeType,
  selectedIntakeSeason,
  tuitionRange,
  gpaRange,
  universityType,
  institutionType,
  universityRanking,
  scholarshipsOnly,
  showFavorites,
  courseSearch,
  courseDegreeLevel,
  courseStudyMode,
  courseTuitionMin,
  courseTuitionMax,
  courseDuration,
  // ADD THESE API FILTERS:
  apiPage,
  apiCountry,
  apiDegreeLevel,
  statusFilter,
  institutionTypeFilter,
  universityTypeFilter,
  worldRankingMin, worldRankingMax,
  nationalRankingMin, nationalRankingMax,
  qsRankingMin, qsRankingMax,
  tuitionMin, tuitionMax, tuitionCurrency,
  financialAidAvailable,
  foundedYearMin, foundedYearMax,
  languageOfInstruction,
  selectedCity,
  verificationStatus,
  isFeatured,
  accommodationAvailable,
  internationalOffice,
  careerServices,
  libraryServices,
  healthServices,
  sportsFacilities,
  totalStudentsMin, totalStudentsMax,
]);
  // Load universities only
 const loadData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Build parameters - API uses 1-based page numbers
    const params: Record<string, any> = {
  page: apiPage - 1,
  size: apiSize,
};
if (apiCountry)                     params.country = apiCountry;
if (apiDegreeLevel)                 params.degreeLevel = apiDegreeLevel;
if (searchQuery.trim())             params.search = searchQuery.trim();
if (statusFilter)                   params.status = statusFilter;
if (institutionTypeFilter)          params.type = institutionTypeFilter;
if (universityTypeFilter)           params.type = universityTypeFilter;
if (worldRankingMin)                params.worldRankingMin = worldRankingMin;
if (worldRankingMax)                params.worldRankingMax = worldRankingMax;
if (nationalRankingMin)             params.nationalRankingMin = nationalRankingMin;
if (nationalRankingMax)             params.nationalRankingMax = nationalRankingMax;
if (qsRankingMin)                   params.qsRankingMin = qsRankingMin;
if (qsRankingMax)                   params.qsRankingMax = qsRankingMax;
if (tuitionMin)                     params.tuitionMin = tuitionMin;
if (tuitionMax)                     params.tuitionMax = tuitionMax;
if (tuitionCurrency)                params.currency = tuitionCurrency;
if (scholarshipsOnly)               params.scholarshipsAvailable = true;
if (financialAidAvailable)          params.financialAidAvailable = true;
if (foundedYearMin)                 params.foundedYearMin = foundedYearMin;
if (foundedYearMax)                 params.foundedYearMax = foundedYearMax;
if (languageOfInstruction)          params.languageOfInstruction = languageOfInstruction;
if (selectedCity && selectedCity !== 'all') params.city = selectedCity;
if (verificationStatus)             params.verificationStatus = verificationStatus;
if (isFeatured)                     params.isFeatured = true;
if (accommodationAvailable)         params.accommodationAvailable = true;
if (internationalOffice)            params.internationalOffice = true;
if (careerServices)                 params.careerServices = true;
if (libraryServices)                params.libraryServices = true;
if (healthServices)                 params.healthServices = true;
if (sportsFacilities)               params.sportsFacilities = true;
if (totalStudentsMin)               params.totalStudentsMin = totalStudentsMin;
if (totalStudentsMax)               params.totalStudentsMax = totalStudentsMax;

if (courseSearch.trim()) params.course_search = courseSearch.trim();
if (courseDegreeLevel && courseDegreeLevel !== 'all') params.degree_level = courseDegreeLevel;
if (courseStudyMode && courseStudyMode !== 'all') params.study_mode = courseStudyMode;
if (courseTuitionMin !== "") params.course_tuition_min = Number(courseTuitionMin);
if (courseTuitionMax !== "") params.course_tuition_max = Number(courseTuitionMax);
if (courseDuration !== "") params.course_duration = Number(courseDuration);

    console.log('[Universities] API Request:', params);

    const raw = await universityAPI.getUniversities(params);

    console.log('[Universities] Raw API response:', JSON.stringify(raw)?.slice(0, 300));

    // Handle all possible response shapes from makeAuthenticatedRequest:
    // Shape A (most likely): { success, data: { totalCount, data: [...], page, size, hasMore } }
    // Shape B: { data: { totalCount, data: [...] } }  (no success wrapper)
    // Shape C: { totalCount, data: [...] }             (already unwrapped)
    // Shape D: [...]                                    (plain array)
    let universitiesArray = [];
    let total = 0;

    if (raw?.data?.data && Array.isArray(raw.data.data)) {
      // Shape A or B — most common
      universitiesArray = raw.data.data;
      total = raw.data.totalCount ?? raw.data.total ?? universitiesArray.length;
    } else if (raw?.data && Array.isArray(raw.data)) {
      // Shape: { data: [...] }
      universitiesArray = raw.data;
      total = raw.totalCount ?? raw.total ?? universitiesArray.length;
    } else if (raw?.totalCount !== undefined && Array.isArray(raw?.data)) {
      // Shape C
      universitiesArray = raw.data;
      total = raw.totalCount;
    } else if (Array.isArray(raw)) {
      // Shape D
      universitiesArray = raw;
      total = raw.length;
    }

    console.log('[Universities] Parsed:', universitiesArray.length, 'universities, total:', total);

    setTotalCount(total);
    calculateUniversityStats(universitiesArray);
    setUniversities(universitiesArray);
  } catch (err) {
    setError("Failed to load data. Please try again.");
    console.error("Error loading data:", err);
    setUniversities([]);
    setTotalCount(0);
  } finally {
    setLoading(false);
  }
};

  // Calculate course statistics for each university
  const calculateUniversityStats = (universitiesData) => {
  const stats = {};

  universitiesData.forEach((university) => {
    // Use courses from the university object directly
    const universityCourses = university.courses || [];

    const tuitionFees = universityCourses
      .map((course) => parseFloat(course.tuition_fee_international || course.tuition_fee) || 0)
      .filter((fee) => fee > 0);

    stats[university.id] = {
      totalCourses: universityCourses.length,
      degreeTypes: [
        ...new Set(universityCourses.map((course) => 
          (course.degree_level || course.degree_type || '').toLowerCase()
        ))
      ].filter(Boolean),
      subjects: [
        ...new Set(universityCourses.map((course) => 
          course.field_of_study || course.subject_area
        ))
      ].filter(Boolean).slice(0, 3),
      languages: [
        ...new Set(universityCourses.map((course) => course.language))
      ].filter(Boolean),
      tuitionRange: tuitionFees.length > 0
        ? {
            min: Math.min(...tuitionFees),
            max: Math.max(...tuitionFees),
          }
        : null,
      intakeSeasons: [
        ...new Set(universityCourses.map((course) => course.intake_season))
      ].filter(Boolean),
    };
  });

  setUniversityStats(stats);
};

  // Load filter options from API
  const loadFilterOptions = async () => {
  try {
    console.log('[Universities] Loading filter options from new endpoint...');

    // Fetch general filters AND city-specific filters in parallel
    const [filtersResponse, cityFiltersResponse] = await Promise.all([
      universityAPI.getDynamicFilters(),
      universityAPI.getDynamicFilters('city'),
    ]);

    console.log('[Universities] Raw filters response:', filtersResponse);
    console.log('[Universities] Raw city filters response:', cityFiltersResponse);

    // Extract general filters array
    const filtersArray = filtersResponse?.data?.filters || filtersResponse?.filters || (Array.isArray(filtersResponse) ? filtersResponse : []);

    // Extract city list from the dedicated filterBy=city endpoint
    const cityFiltersArray = cityFiltersResponse?.data?.filters || cityFiltersResponse?.filters || (Array.isArray(cityFiltersResponse) ? cityFiltersResponse : []);

    // Build sorted city list from the dedicated city endpoint
    const cityList: string[] = cityFiltersArray
      .filter((f: any) => f.filterParam === 'city' && f.filterId)
      .map((f: any) => f.filterId as string)
      .sort((a: string, b: string) => a.localeCompare(b));

    console.log('[Universities] Extracted filters array:', filtersArray);
    console.log('[Universities] City list from API:', cityList);

    const filterMap: Record<string, any[]> = {
      country: [],
      type: [],
      institutionType: [],
      ranking: [],
      tuition: [],
      scholarshipsAvailable: [],
      city: [],
      status: [],
      verificationStatus: [],
      currency: [],
    };

    filtersArray.forEach((filter: any) => {
      const { filterParam, filterId } = filter;
      if (filterMap.hasOwnProperty(filterParam)) {
        if (!filterMap[filterParam].includes(filterId)) {
          filterMap[filterParam].push(filterId);
        }
      }
    });

    setUniversityRankings(filterMap.ranking || []);
    setTuitionOptions(filterMap.tuition || []);
    setHasScholarships(filtersArray.some((f: any) => f.filterParam === 'scholarshipsAvailable' && f.filterId === true));
    setSubjectAreas(filterMap.type || []);
    setDegreeTypes(filterMap.institutionType || []);
    // Use dedicated city endpoint data for the full dynamic city list
    setCities(cityList.length > 0 ? cityList : (filterMap.city || []));
    setStatusOptions(filterMap.status || []);
    setVerificationStatusOptions(filterMap.verificationStatus || []);
    setCurrencyOptions(filterMap.currency || []);
    setStates([]);

    console.log('[Universities] ✅ Filter options loaded successfully, cities:', cityList.length);
  } catch (err) {
    console.error('[Universities] Error loading filter options:', err);

    // Fallback to empty arrays
    setCities([]);
    setStates([]);
    setSubjectAreas([]);
    setDegreeTypes([]);
    setUniversityRankings([]);
    setTuitionOptions([]);
    setHasScholarships(false);
  }
};

// Load favorite courses using the dedicated backend endpoint
const loadFavorites = async () => {
  try {
    setFavoritesLoading(true);
    console.log('[Universities] loadFavorites — fetching favorites directly from API...');

    const favoriteCourses: any[] = await getFavoriteCourses();

    console.log('[Universities] total favorites found:', favoriteCourses.length);

    // Group by university so we can render the university header
    const universitiesWithFavorites: Record<string, any> = {};
    favoriteCourses.forEach((course: any) => {
      const uniId = course.universityId ?? course.university_id;
      if (!uniId) return;

      if (!universitiesWithFavorites[uniId]) {
        const fullUni = universities.find(u => u.id === uniId);
        universitiesWithFavorites[uniId] = {
          ...(fullUni ?? {}),
          id: uniId,
          name: course.universityName ?? fullUni?.name,
          code: course.universityCode ?? fullUni?.code,
          country: course.universityCountry ?? fullUni?.country,
          city: fullUni?.city ?? course.universityCountry,
          image_url: fullUni?.image_url ?? null,
          total_courses: 0,
          courses: [],
        };
      }

      universitiesWithFavorites[uniId].courses.push({
        ...course,
        isFavorite: true,
        is_favorite: true,
      });
      universitiesWithFavorites[uniId].total_courses++;
    });

    const favoritesArray = Object.values(universitiesWithFavorites);
    console.log('[Universities] grouped into', favoritesArray.length, 'universities');
    calculateUniversityStats(favoritesArray);
    setFavorites(favoritesArray);

  } catch (error) {
    console.error('[Universities] Error loading favorites:', error);
    setFavorites([]);
  } finally {
    setFavoritesLoading(false);
  }
};

  // Add to favorites
  // Add to favorites (API integrated)
const addToFavorites = async (universityId) => {
  try {
    const university = universities.find((uni) => uni.id === universityId);
    
    if (!university) {
      console.error('University not found');
      return;
    }
    
    if (university.courses && university.courses.length > 0) {
      const firstCourse = university.courses[0];
      console.log(`[Favorites] Adding course ${firstCourse.id} to favorites`);
      
      await addCourseToFavorites(firstCourse.id);
      
      await loadFavorites();
      console.log('[Favorites] ✅ Added to favorites');
    } else {
      alert('No courses available to add to favorites');
    }
  } catch (error) {
    // 409 = already in favorites — treat as success, just reload
    if (error?.message?.includes('409') || error?.message?.includes('already in favorites')) {
      console.log('[Favorites] Course already in favorites, reloading list');
      await loadFavorites();
    } else {
      console.error('[Favorites] Error adding to favorites:', error);
      alert('Failed to add to favorites. Please try again.');
    }
  }
};

// Remove from favorites (API integrated)
const removeFromFavorites = async (universityId) => {
  try {
    const university = favorites.find((fav) => fav.id === universityId);
    
    if (!university) {
      console.error('University not found in favorites');
      return;
    }
    
    // Remove all courses from this university from favorites
    const courseIds = university.courses.map(course => course.id);
    
    console.log(`[Favorites] Removing ${courseIds.length} courses from favorites`);
    
    for (const courseId of courseIds) {
      await removeCourseFromFavorites(courseId);
    }
    
    // Reload favorites
    await loadFavorites();
    
    console.log('[Favorites] ✅ Removed from favorites');
  } catch (error) {
    console.error('[Favorites] Error removing from favorites:', error);
    alert('Failed to remove from favorites. Please try again.');
  }
};

// Check if university has ANY favourite course.
// Priority: (1) embedded isFavorite from the universities list API response
// (already present on page load), (2) wishlist favorites array (loaded on demand).
const isFavorite = (universityId) => {
  // Check wishlist / favorites array (populated when wishlist tab is opened)
  if (favorites.some((fav) => fav.id === universityId)) return true;

  // Check embedded courses returned by the universities list API
  // — these already carry isFavorite:true/false from the backend
  const uni = universities.find((u) => u.id === universityId);
  return (uni?.courses ?? []).some(
    (c) => c.isFavorite === true || c.is_favorite === true
  );
};

// Called by CourseModal when a course heart is toggled—keeps university
// cards in sync without re-fetching the full university list.
const handleCourseFavoriteToggled = (courseId: string, isFavorited: boolean) => {
  setUniversities((prev) =>
    prev.map((uni) => ({
      ...uni,
      courses: (uni.courses ?? []).map((c) =>
        c.id === courseId
          ? { ...c, isFavorite: isFavorited, is_favorite: isFavorited }
          : c
      ),
    }))
  );
};

const checkWishlistLimit = async () => {
  try {
    const favoriteCourses = await getFavoriteCourses();
    const uniqueUnis = new Set(favoriteCourses.map(c => c.universityId ?? c.university_id));
    if (uniqueUnis.size >= 3) {
      setShowWishlistLimitPopup(true);
    }
  } catch (error) {
    console.error('Error checking wishlist limit', error);
  }
};

  // Handle form submit - opens payment OR skips if consulting fee already paid
  // Handle form submit - creates application FIRST, then checks payment
  const handleFormSubmit = async (formData, university) => {
    console.log("Form submitted:", formData);
    
    // CRITICAL: Ensure university is preserved
    if (!university && selectedUniversity) {
      console.log("Using selectedUniversity from state");
      university = selectedUniversity;
    }
    
    if (!university) {
      console.error("No university available in handleFormSubmit");
      alert("Error: University information missing. Please try again.");
      return;
    }
    
    // Ensure university state is set
    setSelectedUniversity(university);
    
    // Close form modal
    setIsFormModalOpen(false);
    
    try {
      setLoading(true);

      if (!user || !user.id) {
        console.error('No user ID available');
        alert('Unable to create application: User not authenticated');
        return;
      }

      if (!selectedCourse?.id) {
        alert('Error: Please select a course before applying.');
        setIsModalOpen(true);
        return;
      }

      // Determine semester from course intake seasons
      let targetSemester = "WINTER";
      if (selectedCourse.intakeSeasons && selectedCourse.intakeSeasons.length > 0) {
        const season = selectedCourse.intakeSeasons[0].toUpperCase();
        const semesterMap = {
          'FALL': 'WINTER',
          'WINTER': 'WINTER', 
          'SPRING': 'SUMMER',
          'SUMMER': 'SUMMER',
        };
        targetSemester = semesterMap[season] || 'WINTER';
      }

      const numericStudentId = Number(user.id);
      if (isNaN(numericStudentId)) {
        console.error('Invalid user ID:', user.id);
        alert('Error: Invalid user session. Please log out and log back in.');
        return;
      }

      const applicationData = {
        studentId: numericStudentId,
        targetUniversityId: university.id,
        targetCourseId: selectedCourse.id,
        targetSemester: targetSemester,
        targetYear: 2026,
      };

      console.log('=== CREATING APPLICATION ===');
      const response = await createApplication(applicationData);
      const applicationId = response?.data?.id || response?.id;
      
      if (!applicationId) {
        throw new Error('Application created but no ID returned');
      }

      console.log('✅ Application ID:', applicationId);
      setCreatedApplicationId(applicationId);

      // Now check payment
      if (university.universityType === "private") {
        console.log('[Universities] Private university — skipping payment');
        setTimeout(() => setSubmitAppPopupOpen(true), 100);
      } else {
        // Public University
        const hasActivePlan = publicUniPlan && publicUniPlan.userId === user?.id && publicUniPlan.remaining > 0;
        
        if (hasActivePlan) {
          // Decrement the plan and submit
          const updatedPlan = { ...publicUniPlan, remaining: publicUniPlan.remaining - 1 };
          setPublicUniPlan(updatedPlan);
          localStorage.setItem('uni360_public_uni_plan', JSON.stringify(updatedPlan));
          setShowBundleUsageModal({ isOpen: true, remaining: updatedPlan.remaining });
        } else {
          // Show the plan selection modal
          setTimeout(() => setShowPublicUniPlanModal(true), 100);
        }
      }
    } catch (error) {
      console.error('❌ Error creating application:', error);
      let errorMessage = 'Failed to create application. ';
      if (error.message?.includes('UUID')) {
        errorMessage += 'Invalid university or course information.';
      } else if (error.message?.includes('401') || error.message?.includes('authenticated')) {
        errorMessage += 'Authentication failed. Please log in again.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success - just record payment and open submit popup
  const handlePaymentSuccess = async (university) => {
    console.log("=== PAYMENT SUCCESS ===");
    
    if (selectedPaymentPlan?.type === 'bundle') {
      const newPlan = {
        userId: user?.id || 'unknown',
        remaining: 4, // 5 total, but 1 is used immediately for this application
        purchasedAt: new Date().toISOString()
      };
      setPublicUniPlan(newPlan);
      localStorage.setItem('uni360_public_uni_plan', JSON.stringify(newPlan));
      console.log('[Universities] ✅ Bundle plan saved to localStorage');
    }
    
    setIsPaymentModalOpen(false);
    setSelectedPaymentPlan(null);
    
    // Application is already created, now open submit popup
    setTimeout(() => {
      setSubmitAppPopupOpen(true);
    }, 100);
  };

  const handleFinalSubmit = async (submitData) => {
    try {
      setIsSubmittingApp(true);
      const res = await submitApplication(createdApplicationId, submitData);
      
      setSubmissionResult({
        isOpen: true,
        success: true,
        data: res?.data || res,
        error: null
      });
      
    } catch (error) {
      setSubmissionResult({
        isOpen: true,
        success: false,
        data: null,
        error: error.message || "Failed to submit application. Please try again."
      });
    } finally {
      setIsSubmittingApp(false);
      setSubmitAppPopupOpen(false);
    }
  };

  // Get filtered universities based on current view
  const filteredUniversities = useMemo(() => {
    let filtered = showFavorites ? favorites : universities;

    switch (activeFilter) {
      case "Low Tuition":
        filtered = filtered.filter((uni) => {
          const stats = universityStats[uni.id];
          return stats && stats.tuitionRange && stats.tuitionRange.min < 15000;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [universities, favorites, showFavorites, activeFilter, universityStats]);

  // Pagination - driven entirely by API; totalCount comes from server
const totalPages = Math.ceil((showFavorites ? filteredUniversities.length : totalCount) / apiSize) || 1;
const currentUniversities = filteredUniversities; // API already returns only 20 per page

// Reset to page 1 when filters change
// Reset to page 1 when filters change
useEffect(() => {
  setApiPage(1); // Reset to first page whenever filters change
}, [searchQuery, activeFilter, selectedCity, selectedState, selectedCourseFilter,
    selectedLanguage, selectedDegreeType, selectedIntakeSeason, tuitionRange,
    gpaRange, scholarshipsOnly, universityType, institutionType, universityRanking,
    apiCountry, apiDegreeLevel, showFavorites]);


// Add this helper function to convert date format (add after filteredUniversities useMemo, around line 150)
  const convertDateFormat = (dateStr) => {
    if (!dateStr) return '';
    // Convert "2003-05-05" to "05-05-2003"
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  // Add this function to fetch and process profile data (add after convertDateFormat)
  const fetchAndProcessProfile = async () => {
    try {
      setProfileLoading(true);
      console.log('[Profile] Fetching student profile...');
      
      const response = await getStudentProfile();
      
      console.log('[Profile] Profile API response:', response);
      
      const profile = response?.data || response;
      
      setProfileData(profile);
      
      return profile;
    } catch (error) {
      console.error('[Profile] Error fetching profile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Check if profile is complete before allowing application
  const checkProfileCompletion = async () => {
    try {
      console.log('[Universities] Checking profile completion...');
      const progressData = await getProfileProgress();
      const progress = progressData?.data?.percentage || progressData?.percentage || 0;
      
      console.log('[Universities] Profile completion:', progress + '%');
      setProfileCompletionPercentage(progress);
      
      return progress >= 100;
    } catch (error) {
      console.error('[Universities] Error checking profile completion:', error);
      return false;
    }
  };


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  // Format currency
  const formatTuition = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Enhanced University Card Component
const UniversityCard = ({ university }) => {
  const stats = universityStats[university.id] || {};

  const handleLearnMore = () => {
    setSelectedUniversity(university);
    setIsModalOpen(true);
  };

  const handleViewDetails = () => {
    setSelectedUniversity(university);
    setIsDetailsModalOpen(true);
  };

  // Universal university campus image
  const HEADER_IMAGE = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80";

  return (
    <Card className="group relative overflow-hidden border-2 border-gray-200 shadow-md hover:border-[#E08D3C]/60 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] h-full flex flex-col"
      style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}>
      
      {/* Removed top accent bar */}

      {/* Hero Image Section with Name Overlay */}
      <div className="relative h-36 sm:h-40 overflow-hidden">
        {/* Background Image */}
        <img
          src={HEADER_IMAGE}
          alt="University campus"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
        />
        
        {/* Dark gradient overlay - bottom heavy for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C3539] via-[#2C3539]/60 to-transparent" />
        
        {/* Subtle brand color tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E08D3C]/10 via-transparent to-[#C4DFF0]/10" />

        {/* Top Row - Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          {university.match_score ? (
            <div className="bg-white/95 backdrop-blur-sm text-[#2C3539] text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E08D3C]" />
              {university.match_score}% Match
            </div>
          ) : <div />}
          
          {university.isFeatured && (
            <div className="bg-white/95 backdrop-blur-sm text-amber-700 text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-current" />
              Featured
            </div>
          )}
        </div>

        {/* Bottom Section - University Info Overlaid on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
          <div className="flex items-end gap-3">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white shadow-lg ring-2 ring-white/30 p-0.5">
                {university.image_url ? (
                  <img
                    src={university.image_url}
                    alt={university.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-gradient-to-br from-[#C4DFF0] to-[#E08D3C] rounded-lg items-center justify-center ${
                    university.image_url ? "hidden" : "flex"
                  }`}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Name & Location */}
            <div className="flex-1 min-w-0 pb-0.5">
              <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1 leading-tight tracking-tight drop-shadow-md">
                {university.name}
              </h3>
              <p className="text-[11px] text-white/85 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {university.city}
                  {university.country ? `, ${university.country}` : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pt-4 pb-4 flex flex-col flex-1">
        
        {/* Ranking Pills Row */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
          {university.ranking && (
            <div className="inline-flex items-center gap-1 bg-[#C4DFF0]/40 text-[#2C3539] text-[10px] px-2 py-0.5 rounded-full font-semibold border border-[#C4DFF0]">
              <Star className="w-2.5 h-2.5 fill-current text-[#E08D3C]" />
              #{university.ranking}
            </div>
          )}
          {university.qsRanking && (
            <div className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-purple-100">
              QS #{university.qsRanking}
            </div>
          )}
          {university.is_partner && (
            <div className="bg-[#2C3539] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Partner
            </div>
          )}
        </div>

        {/* Stats Grid - Premium Look */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Total Courses */}
          <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-xl px-3 py-1.5 border border-[#E08D3C]/10">
            <div className="flex items-center gap-1.5 mb-0.5">
              <BookOpen className="w-3 h-3 text-[#E08D3C]" />
              <span className="text-[9px] text-gray-500 uppercase tracking-wide font-medium">Courses</span>
            </div>
            <div className="text-base font-bold text-[#2C3539] leading-none">
              {stats.totalCourses || university.total_courses || 0}
            </div>
          </div>

          {/* Tuition or Students */}
          {(university.tuition_display || (stats.tuitionRange && stats.tuitionRange.min > 0)) ? (
            <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-1.5 border border-[#C4DFF0]/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] text-gray-600 uppercase tracking-wide font-medium">Tuition Fees</span>
              </div>
              <div className="text-xs font-bold text-[#2C3539] leading-tight">
                {university.tuition_display || formatTuition(stats.tuitionRange.min)}
              </div>
            </div>
          ) : university.totalStudents ? (
            <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-1.5 border border-[#C4DFF0]/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="w-3 h-3 text-[#2C3539]" />
                <span className="text-[9px] text-gray-600 uppercase tracking-wide font-medium">Students</span>
              </div>
              <div className="text-xs font-bold text-[#2C3539] leading-tight">
                {new Intl.NumberFormat('en', { notation: 'compact' }).format(university.totalStudents)}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-3 py-1.5 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <GraduationCap className="w-3 h-3 text-gray-500" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wide font-medium">Levels</span>
              </div>
              <div className="text-xs font-bold text-[#2C3539] leading-tight">
                {stats.degreeTypes?.length || 0} types
              </div>
            </div>
          )}
        </div>

        {/* Degree Types Badges */}
        {((stats.degreeTypes && stats.degreeTypes.length > 0) || university.universityType) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {stats.degreeTypes?.slice(0, 3).map((degree) => (
              <span
                key={degree}
                className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200 font-medium capitalize">
                {degree}
              </span>
            ))}
            {university.universityType && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200 font-medium capitalize">
                {university.universityType}
              </span>
            )}
          </div>
        )}

        {/* Subjects line */}
        {stats.subjects && stats.subjects.length > 0 && (
          <div className="mb-3 px-2.5 py-1.5 bg-gray-50/50 rounded-lg border border-gray-100">
            <p className="text-[10px] text-gray-500 mb-0.5 font-medium uppercase tracking-wide">Popular</p>
            <p className="text-[11px] text-gray-700 line-clamp-1 font-medium">
              {stats.subjects.slice(0, 2).join(" • ")}
            </p>
          </div>
        )}

        {/* Feature Icons Row */}
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          {(university.financialAidAvailable || university.scholarshipsAvailable) && (
            <div className="group/icon relative">
              <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center hover:bg-green-100 transition-colors">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#2C3539] text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Scholarships
              </div>
            </div>
          )}
          {university.accommodationAvailable && (
            <div className="group/icon relative">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center hover:bg-blue-100 transition-colors">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#2C3539] text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Housing
              </div>
            </div>
          )}
          {university.careerServices && (
            <div className="group/icon relative">
              <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center hover:bg-purple-100 transition-colors">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#2C3539] text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Career
              </div>
            </div>
          )}
          {university.internationalOffice && (
            <div className="group/icon relative">
              <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center hover:bg-orange-100 transition-colors">
                <Globe className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#2C3539] text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Int'l Office
              </div>
            </div>
          )}
          {university.libraryServices && (
            <div className="group/icon relative">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center hover:bg-amber-100 transition-colors">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#2C3539] text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                Library
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Buttons */}
        <div className="flex gap-2 pt-3 border-t border-blue-100/50">
          <Button
  size="sm"
  variant="ghost"
  className="flex-1 bg-gradient-to-r from-[#C4DFF0] to-[#a8d4ec] hover:from-[#E08D3C] hover:to-[#c77a32] text-[#2C3539] hover:text-white font-semibold rounded-lg transition-all duration-300 text-xs h-9 group/btn shadow-sm hover:shadow-md"
  onClick={handleLearnMore}>
  <span className="flex items-center gap-1">
    {stats.totalCourses > 0 ? "View Courses" : "Learn More"}
    <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
  </span>
</Button>
          <Button
            size="sm"
            className="flex-1 bg-[#2C3539] hover:bg-[#E08D3C] text-white font-semibold rounded-lg transition-all duration-300 text-xs h-9 shadow-sm hover:shadow-md group/btn"
            onClick={handleViewDetails}>
            <span className="flex items-center gap-1">
              View Details
              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}>
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-4">
          {showFavorites && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavorites(false)}
              className="flex items-center space-x-2 text-gray-600 hover:text-[#E08D3C]">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Button>
          )}
          <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
              {showFavorites ? "Your Wishlist" : "Universities"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {showFavorites
                ? "Your saved universities"
                : `Discover universities and courses in ${
                    selectedCountry === "DE" ? "Germany" : "United Kingdom"
                  } matched to your profile`}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className={`rounded-pill transition-all duration-200 ${
            showFavorites
              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
              : "hover:bg-[#E08D3C] hover:text-white hover:border-[#E08D3C]"
          }`}
          onClick={() => setShowFavorites(!showFavorites)}>
          <Heart
            className={`w-4 h-4 mr-2 ${showFavorites ? "fill-current" : ""}`}
          />
          {showFavorites
            ? "View All Universities"
            : `Wishlist ${favorites.reduce((acc, u) => acc + (u.courses?.length ?? 0), 0) > 0 ? `(${favorites.reduce((acc, u) => acc + (u.courses?.length ?? 0), 0)})` : ''}`}
        </Button>
      </motion.div>

      {!showFavorites && (
  <motion.div
    className="space-y-4"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.1 }}>
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search universities and courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 rounded-lg border-gray-300 focus:border-[#E08D3C] focus:ring-[#E08D3C] text-sm"
        />
      </div>
      <Button 
        variant="outline" 
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className="h-10 px-4 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-600 flex-shrink-0"
      >
        <Filter className="w-4 h-4 mr-2" />
        {showAdvancedFilters ? "Hide Filters" : "Filters"}
      </Button>
    </div>

    {showAdvancedFilters && (
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-6 p-5 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden"
      >
  {/* Clear Filters Button */}
  <div className="col-span-full flex justify-end border-b border-gray-100 pb-4 mb-2">
    <button
      onClick={() => {
        setApiCountry('');
        setUniversityTypeFilter('');
        setApiDegreeLevel('');
        setUniversityRanking('all');
        setInstitutionTypeFilter('');
        setSelectedLanguage('');
        setMinTuition('');
        setMaxTuition('');
        setSelectedCity('all');
        setTotalStudentsMin('');
        setTotalStudentsMax('');
        setAccommodationAvailable(false);
        setHealthServices(false);
        setSportsFacilities(false);
        setFinancialAidAvailable(false);
        setCourseSearch('');
        setCourseDegreeLevel('all');
        setCourseStudyMode('all');
        setCourseTuitionMin('');
        setCourseTuitionMax('');
        setCourseDuration('');
        setApiPage(1);
      }}
      className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 bg-red-50/50 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 hover:border-red-200 transition-all duration-200 shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
      </svg>
      Clear Filters
    </button>
  </div>

  {/* Country */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Country</label>
    <Select value={apiCountry || "all"} onValueChange={(val) => { setApiCountry(val === "all" ? "" : val); setApiPage(1); }}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Countries" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Countries</SelectItem>
        <SelectItem value="GB">United Kingdom</SelectItem>
        <SelectItem value="DE">Germany</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* University Type - CHANGED */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">University Type</label>
    <Select value={universityTypeFilter || "all"} onValueChange={(val) => { setUniversityTypeFilter(val === "all" ? "" : val); setApiPage(1); }}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All University Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All University Types</SelectItem>
        {subjectAreas.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Degree Level */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Degree Level</label>
    <Select value={apiDegreeLevel || "all"} onValueChange={(val) => { setApiDegreeLevel(val === "all" ? "" : val); setApiPage(1); }}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Degree Levels" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Degree Levels</SelectItem>
        <SelectItem value="BACHELORS">Bachelors</SelectItem>
        <SelectItem value="MASTERS">Masters</SelectItem>
        <SelectItem value="PHD">PhD</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Ranking */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Ranking</label>
    <Select value={universityRanking || "all"} onValueChange={(val) => setUniversityRanking(val)}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Rankings" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Rankings</SelectItem>
        {universityRankings.map((ranking) => (
          <SelectItem key={ranking} value={ranking}>
            {ranking}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Institution Type - PUBLIC/PRIVATE */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Institution Type</label>
    <Select value={institutionTypeFilter || "all"} onValueChange={(val) => { setInstitutionTypeFilter(val === "all" ? "" : val); setApiPage(1); }}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Institution Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Institution Types</SelectItem>
        <SelectItem value="public">PUBLIC</SelectItem>
        <SelectItem value="private">PRIVATE</SelectItem>
      </SelectContent>
    </Select>
  </div> */}

  {/* Language - CHANGED */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Language</label>
    <Select value={languageOfInstruction || "all"} onValueChange={(val) => { setLanguageOfInstruction(val === "all" ? "" : val); setApiPage(1); }}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Languages" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Languages</SelectItem>
        <SelectItem value="English">English</SelectItem>
        <SelectItem value="German">German</SelectItem>
        <SelectItem value="French">French</SelectItem>
        <SelectItem value="Spanish">Spanish</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Degree Type */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Degree</label>
    <Select value={selectedDegreeType || "all"} onValueChange={(val) => setSelectedDegreeType(val)}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Degrees" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Degrees</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Intake Season */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Intake</label>
    <Select value={selectedIntakeSeason || "all"} onValueChange={(val) => setSelectedIntakeSeason(val)}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Intakes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Intakes</SelectItem>
      </SelectContent>
    </Select>
  </div> */}

  {/* Tuition Min - CHANGED */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Min Tuition (In EUR)</label>
    <input
      type="number"
      placeholder="e.g. 0"
      value={tuitionMin}
      onChange={(e) => { setTuitionMin(e.target.value); setApiPage(1); }}
      className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
    />
  </div>

  {/* Tuition Max - NEW */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Max Tuition (In EUR)</label>
    <input
      type="number"
      placeholder="e.g. 15000"
      value={tuitionMax}
      onChange={(e) => { setTuitionMax(e.target.value); setApiPage(1); }}
      className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
    />
  </div>

  {/* GPA */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Min GPA</label>
    <Select value={gpaRange || "all"} onValueChange={(val) => setGpaRange(val)}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All GPA" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All GPA</SelectItem>
      </SelectContent>
    </Select>
  </div> */}

  {/* World Ranking Min - NEW */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">World Rank Min</label>
    <input
      type="number"
      placeholder="e.g. 1"
      value={worldRankingMin}
      onChange={(e) => { setWorldRankingMin(e.target.value); setApiPage(1); }}
      className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
    />
  </div> */}

  {/* World Ranking Max - NEW */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">World Rank Max</label>
    <input
      type="number"
      placeholder="e.g. 100"
      value={worldRankingMax}
      onChange={(e) => { setWorldRankingMax(e.target.value); setApiPage(1); }}
      className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
    />
  </div> */}

  {/* City - NEW */}
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">City</label>
    <Select value={selectedCity || "all"} onValueChange={(val) => { setSelectedCity(val === "all" ? "" : val); setApiPage(1); }}>
      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
        <SelectValue placeholder="All Cities" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Cities</SelectItem>
        {cities.map((city) => (
          <SelectItem key={city} value={city}>{city}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Total Students Min - NEW */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Min Students</label>
    <input
      type="number"
      placeholder="e.g. 1000"
      value={totalStudentsMin}
      onChange={(e) => { setTotalStudentsMin(e.target.value); setApiPage(1); }}
      className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
    />
  </div> */}

  {/* Total Students Max - NEW */}
  {/* <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Max Students</label>
    <input
      type="number"
      placeholder="e.g. 50000"
      value={totalStudentsMax}
      onChange={(e) => { setTotalStudentsMax(e.target.value); setApiPage(1); }}
      className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
    />
  </div> */}

  <div className="col-span-full pt-4 mt-2 border-t border-gray-100">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 block mb-3">Course Search Options</label>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Course Search</label>
        <input
          type="text"
          placeholder="e.g. Machine Learning"
          value={courseSearch}
          onChange={(e) => { setCourseSearch(e.target.value); setApiPage(1); }}
          className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
        />
      </div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Degree Level (Course)</label>
        <Select value={courseDegreeLevel} onValueChange={(val) => { setCourseDegreeLevel(val); setApiPage(1); }}>
          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="BACHELORS">Bachelors</SelectItem>
            <SelectItem value="MASTERS">Masters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Study Mode</label>
        <Select value={courseStudyMode} onValueChange={(val) => { setCourseStudyMode(val); setApiPage(1); }}>
          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:ring-2 focus:ring-[#E08D3C]/30 focus:border-[#E08D3C] [&>svg]:text-[#E08D3C] [&>svg]:opacity-100 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="FULL_TIME">Full Time</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Course Duration (Years)</label>
        <input
          type="number"
          placeholder="e.g. 2"
          value={courseDuration}
          onChange={(e) => { setCourseDuration(e.target.value); setApiPage(1); }}
          className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Min Course Tuition</label>
        <input
          type="number"
          placeholder="e.g. 0"
          value={courseTuitionMin}
          onChange={(e) => { setCourseTuitionMin(e.target.value); setApiPage(1); }}
          className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Max Course Tuition</label>
        <input
          type="number"
          placeholder="e.g. 5000"
          value={courseTuitionMax}
          onChange={(e) => { setCourseTuitionMax(e.target.value); setApiPage(1); }}
          className="h-11 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white text-sm px-4 w-full shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E08D3C]/20 focus:border-[#E08D3C]"
        />
      </div>
    </div>
  </div>

  {/* Toggle Options Row */}
  <div className="col-span-full pt-4 mt-2 border-t border-gray-100">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 block mb-3">Campus Features & Options</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Scholarships Checkbox */}
      <label className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/80 hover:bg-white hover:border-[#E08D3C]/40 hover:shadow-md transition-all duration-200 cursor-pointer group">
        <input
          type="checkbox"
          id="scholarships"
          checked={scholarshipsOnly}
          onChange={(e) => { setScholarshipsOnly(e.target.checked); setApiPage(1); }}
          className="w-4 h-4 rounded border-gray-300 text-[#E08D3C] focus:ring-[#E08D3C] cursor-pointer"
          disabled={!hasScholarships}
        />
        <span className="text-sm font-medium text-gray-700 group-hover:text-[#E08D3C] transition-colors">
          Scholarships
        </span>
      </label>

      {/* Financial Aid Checkbox - NEW */}
      <label className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/80 hover:bg-white hover:border-[#E08D3C]/40 hover:shadow-md transition-all duration-200 cursor-pointer group">
        <input
          type="checkbox"
          id="financialAid"
          checked={financialAidAvailable}
          onChange={(e) => { setFinancialAidAvailable(e.target.checked); setApiPage(1); }}
          className="w-4 h-4 rounded border-gray-300 text-[#E08D3C] focus:ring-[#E08D3C] cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700 group-hover:text-[#E08D3C] transition-colors">
          Financial Aid
        </span>
      </label>

      {/* Boolean / Features - NEW */}
      {[
        { id: "accommodation", label: "Accommodation", checked: accommodationAvailable, setter: setAccommodationAvailable },
        { id: "healthServices", label: "Health Services", checked: healthServices, setter: setHealthServices },
        { id: "sportsFacilities", label: "Sports Facilities", checked: sportsFacilities, setter: setSportsFacilities },
      ].map((feature) => (
        <label key={feature.id} className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl border border-gray-200/80 hover:bg-white hover:border-[#E08D3C]/40 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <input
            type="checkbox"
            id={feature.id}
            checked={feature.checked}
            onChange={(e) => { feature.setter(e.target.checked); setApiPage(1); }}
            className="w-4 h-4 rounded border-gray-300 text-[#E08D3C] focus:ring-[#E08D3C] cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-[#E08D3C] transition-colors truncate">
            {feature.label}
          </span>
        </label>
      ))}
    </div>
  </div>
      </motion.div>
    )}

    

    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <motion.button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={cn(
  "h-9 px-5 rounded-full text-sm font-semibold transition-all duration-200 min-w-[90px] flex items-center justify-center border shadow-sm",
activeFilter === filter
  ? "bg-gradient-to-r from-[#E08D3C] to-[#f0a855] text-white border-transparent shadow-lg shadow-orange-200/60 scale-[1.03]"
  : "bg-white text-gray-500 border-gray-200 hover:border-[#E08D3C]/60 hover:text-[#E08D3C] hover:bg-orange-50/60 hover:shadow-md"
)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          {filter}
        </motion.button>
      ))}
    </div>
  </motion.div>
)}

      {/* ── WISHLIST VIEW ─────────────────────────────────────────── */}
      {showFavorites ? (
        <div className="space-y-8">
          {favoritesLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#E08D3C]" />
              <span className="ml-3 text-gray-600 text-lg">Loading your wishlist...</span>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-red-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">No favourite courses yet</h3>
                <p className="text-gray-500 mb-8 text-base leading-relaxed">
                  Explore universities, open a course, and tap the{" "}
                  <Heart className="w-4 h-4 inline text-red-400 fill-current" /> icon to save it here.
                </p>
                <Button
                  onClick={() => setShowFavorites(false)}
                  className="bg-[#E08D3C] hover:bg-[#c77a32] text-white font-bold px-8 py-3 rounded-lg text-base">
                  Browse Universities
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                  <span className="font-semibold text-gray-700">
                    {favorites.reduce((acc, u) => acc + (u.courses?.length ?? 0), 0)} favourite course{favorites.reduce((acc, u) => acc + (u.courses?.length ?? 0), 0) !== 1 ? "s" : ""} across {favorites.length} universit{favorites.length !== 1 ? "ies" : "y"}
                  </span>
                </div>
                
              </div>

              {/* One section per university */}
              {favorites.map((university) => (
                <div key={university.id} className="space-y-4">
                  {/* University header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      {university.image_url ? (
                        <img src={university.image_url} alt={university.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-[#2C3539] text-base leading-tight">{university.name}</h2>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[university.city, university.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-red-50 text-red-600 border-red-200 text-xs">
                      {university.courses?.length ?? 0} saved
                    </Badge>
                  </div>

                  {/* Course cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4">
                    {(university.courses ?? []).map((course: any, idx: number) => (
                      <motion.div
                        key={course.id ?? `fav-${idx}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                        <Card className="p-4 h-full flex flex-col border border-gray-100 hover:border-red-200 transition-colors duration-200">
                          {/* Card header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className="font-bold text-sm text-[#2C3539] line-clamp-2 flex-1 leading-snug">
                              {course.name}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Heart className="w-4 h-4 text-red-500 fill-current" />
                              <Badge className={`text-xs px-1.5 py-0.5 ${
                                (course.degreeLevel ?? course.degree_type ?? "").toLowerCase() === "phd"
                                  ? "bg-purple-100 text-purple-800"
                                  : (course.degreeLevel ?? course.degree_type ?? "").toLowerCase() === "masters" || (course.degreeLevel ?? course.degree_type ?? "").toLowerCase() === "master"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {(course.degreeLevel ?? course.degreeType ?? course.degree_type ?? "").replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>

                          {/* Subject & language tags */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(course.fieldOfStudy ?? course.field_of_study ?? course.subject_area) && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                <BookOpen className="w-3 h-3" />
                                {course.fieldOfStudy ?? course.field_of_study ?? course.subject_area}
                              </span>
                            )}
                            {(course.studyMode ?? course.study_mode) && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                <Clock className="w-3 h-3" />
                                {course.studyMode ?? course.study_mode}
                              </span>
                            )}
                            {((course.intakeSeasons ?? [])[0] ?? course.intake_season) && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {(course.intakeSeasons ?? [])[0] ?? course.intake_season}
                              </span>
                            )}
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3 mt-auto">
                            {(course.tuitionInternational ?? course.tuition_fee) && (
                              <div>
                                <span className="text-gray-400 block">Tuition</span>
                                <span className="font-semibold text-[#E08D3C]">
                                  {new Intl.NumberFormat("en-US", { style: "currency", currency: course.currency ?? "EUR", minimumFractionDigits: 0 }).format(
                                    parseFloat(course.tuitionInternational ?? course.tuition_fee ?? 0)
                                  )}
                                </span>
                              </div>
                            )}
                            {(course.durationYears ?? course.duration_years) && (
                              <div>
                                <span className="text-gray-400 block">Duration</span>
                                <span className="font-semibold text-gray-700">
                                  {course.durationYears ?? course.duration_years} yr{(course.durationYears ?? course.duration_years) !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                            {course.scholarshipsAvailable && (
                              <div className="col-span-2">
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                  <Star className="w-3 h-3" /> Scholarships available
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 text-xs gap-1"
                              onClick={async () => {
                                try {
                                  await removeCourseFromFavorites(course.id);
                                  await loadFavorites();
                                } catch (e) {
                                  console.error("Error removing from favourites:", e);
                                }
                              }}>
                              <Heart className="w-3 h-3 fill-current" /> Unfavourite
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-[#2C3539] hover:bg-[#1e2529] text-white text-xs"
                              onClick={() => {
                                setSelectedUniversity(university);
                                setIsModalOpen(true);
                              }}>
                              View Courses
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        variants={container}
        initial="hidden"
        animate="show">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
            <span className="ml-2 text-gray-600">
              Loading universities and courses...
            </span>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-bold text-xl text-[#2C3539] mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={loadData}
              className="bg-[#E08D3C] hover:bg-[#c77a32] text-white font-bold px-6 py-3 rounded-lg">
              Try Again
            </Button>
          </div>
        ) : filteredUniversities.length > 0 ? (
          currentUniversities.map((university) => (
            <motion.div
              key={university.id}
              variants={item}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}>
              <UniversityCard university={university} />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              No universities found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria.
            </p>
            {searchQuery && (
              <p className="text-sm text-gray-400">
                Searched for universities and courses matching: "{searchQuery}"
              </p>
            )}
          </div>
        )}
      </motion.div>
      )}

      {/* Pagination Controls */}
      {/* Pagination Controls */}
      {!loading && !error && (showFavorites ? filteredUniversities.length > 0 : totalCount > 0) && (
        <div className="flex items-center justify-center gap-2 mt-8 pb-8">
          <Button
            onClick={() => {
              setApiPage(prev => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={apiPage === 1}
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= apiPage - 1 && pageNumber <= apiPage + 1)
              ) {
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => {
                      setApiPage(pageNumber);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    variant={apiPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-10 w-10 p-0",
                      apiPage === pageNumber && "bg-[#E08D3C] hover:bg-[#c77a32] text-white"
                    )}>
                    {pageNumber}
                  </Button>
                );
              } else if (
                pageNumber === apiPage - 2 ||
                pageNumber === apiPage + 2
              ) {
                return <span key={pageNumber} className="px-2">...</span>;
              }
              return null;
            })}
          </div>

          <Button
            onClick={() => {
              setApiPage(prev => Math.min(prev + 1, totalPages));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={apiPage === totalPages}
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="ml-4 text-sm text-gray-600">
            Page {apiPage} of {totalPages} ({totalCount} total universities)
          </span>
        </div>
      )}

      <UniversityDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        university={selectedUniversity} 
        universityStats={selectedUniversity ? universityStats[selectedUniversity?.id] : {}}
        onViewCourses={(uni) => {
          setSelectedUniversity(uni);
          setIsModalOpen(true);
        }}
      />

      {/* Course Selection Modal - Opens First */}
{/* Course Selection Modal - Opens First */}
<CourseModal
  university={selectedUniversity}
  isOpen={isModalOpen}
  onClose={() => {
    console.log("Closing course modal, NOT clearing selectedUniversity");
    setIsModalOpen(false);
  }}
  setSelectedCourse={setSelectedCourse}
  setSelectedUniversity={setSelectedUniversity}
  setIsPaymentModalOpen={setIsPaymentModalOpen}
  setIsFormModalOpen={setIsFormModalOpen}
  fetchAndProcessProfile={fetchAndProcessProfile}
  checkProfileCompletion={checkProfileCompletion}
  setShowProfileIncompleteModal={setShowProfileIncompleteModal}
  setShowDocumentsIncompleteModal={setShowDocumentsIncompleteModal}
  onCourseFavoriteToggled={handleCourseFavoriteToggled}
  onCourseFavoriteAdded={checkWishlistLimit}
/>

{/* Dynamic Application Form Modal - Opens Second */}
<DynamicApplicationFormModal
  university={selectedUniversity}
  course={selectedCourse}
  isOpen={isFormModalOpen}
  onClose={() => {
    setIsFormModalOpen(false);
  }}
  onSubmit={handleFormSubmit}
  profileData={profileData}
  profileLoading={profileLoading}
  user={user}
/>

{/* Payment Modal - Opens Third */}
{/* Payment Modal - Opens Third */}
<PaymentModal
  university={selectedUniversity}
  course={selectedCourse}
  paymentPlan={selectedPaymentPlan}
  isOpen={isPaymentModalOpen}
  onClose={() => {
    console.log("Payment modal closing");
    setIsPaymentModalOpen(false);
    // Don't clear university/course on close - user might reopen
  }}
  onSuccess={(uni) => {
    console.log("Payment success callback, uni param:", uni);
    // Pass the university explicitly
    handlePaymentSuccess(uni || selectedUniversity);
  }}
/>

<PublicUniversityPaymentPlanModal
  isOpen={showPublicUniPlanModal}
  onClose={() => setShowPublicUniPlanModal(false)}
  onSelectPlan={(plan) => {
    setSelectedPaymentPlan(plan);
    setShowPublicUniPlanModal(false);
    setTimeout(() => {
      setIsPaymentModalOpen(true);
    }, 100);
  }}
/>

<BundleUsageModal
  isOpen={showBundleUsageModal.isOpen}
  remaining={showBundleUsageModal.remaining}
  onProceed={() => {
    setShowBundleUsageModal({ isOpen: false, remaining: 0 });
    setTimeout(() => setSubmitAppPopupOpen(true), 100);
  }}
/>

{/* Profile Incomplete Modal */}
<ProfileIncompleteModal
  isOpen={showProfileIncompleteModal}
  onClose={() => {
    setShowProfileIncompleteModal(false);
    setSelectedUniversity(null);
  }}
  profilePercentage={profileCompletionPercentage}
/>

{/* <DocumentsIncompleteModal
  isOpen={showDocumentsIncompleteModal}
  onClose={() => {
    setShowDocumentsIncompleteModal(false);
    setSelectedUniversity(null);
  }}
/> */}

<WishlistLimitPopup
  isOpen={showWishlistLimitPopup}
  onClose={() => setShowWishlistLimitPopup(false)}
/>

<ApplicationSubmitPopup
  isOpen={submitAppPopupOpen}
  onClose={() => setSubmitAppPopupOpen(false)}
  onSubmit={handleFinalSubmit}
  isSubmitting={isSubmittingApp}
/>

<SubmissionResultPopup
  isOpen={submissionResult.isOpen}
  success={submissionResult.success}
  data={submissionResult.data}
  error={submissionResult.error}
  university={selectedUniversity}
  onClose={() => {
    setSubmissionResult({ ...submissionResult, isOpen: false });
    if (submissionResult.success) {
      setSelectedUniversity(null);
      setSelectedCourse(null);
      navigate("/applications");
    }
  }}
/>


      
    </motion.div>
  );
}

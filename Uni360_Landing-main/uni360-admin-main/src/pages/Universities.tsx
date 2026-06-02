import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Search,
  Heart,
  MapPin,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Globe,
  Star,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  X,
  Calendar,
  Filter,
  Badge as BadgeIcon,
} from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";

// Import your API services
import {
  universityAPI,
  courseAPI,
  wishlistAPI,
} from "@/services/universities.js";

const filters = ["All", "Top 50", "High Match", "Low Tuition", "High Acceptance"];

const COUNTRY_NAMES: Record<string, string> = {
  "GB": "United Kingdom",
  "DE": "Germany",
  // Add more as needed
};

/** ---------- Helper Functions ---------- */
const toArray = <T,>(maybe: any, fallback: T[] = []): T[] =>
  Array.isArray(maybe) ? maybe : fallback;

const safeLower = (s?: string | null) => (typeof s === "string" ? s.toLowerCase() : "");

const formatMoney = (amount: number | string | null | undefined, currency = "EUR") => {
  const n = Number(amount);
  if (!isFinite(n)) return "N/A";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
};

/** ---------- University Details Modal ---------- */
const UniversityDetailsModal = ({ isOpen, onClose, university, onViewCourses }) => {
  if (!isOpen || !university) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 sm:p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}
      >
        {/* Hero Image */}
        <div className="relative h-48 sm:h-56 overflow-hidden flex-shrink-0">
          <img
            src={university.image_url || "https://images.unsplash.com/photo-1562774053-701939374585?w=1000&q=80"}
            alt={university.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C3539]/90 via-[#2C3539]/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">{university.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
              <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-[#E08D3C]" />
                {[university.city, university.country].filter(Boolean).join(", ")}
              </span>
              {(university.qsRanking || university.ranking) && (
                <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                  QS #{university.qsRanking || university.ranking}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#E08D3C]/10 rounded-xl p-3 border border-[#E08D3C]/20 text-center">
              <BookOpen className="w-5 h-5 text-[#E08D3C] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#2C3539]">{toArray(university.courses).length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Courses</p>
            </div>
            {university.totalStudents && (
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
                <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-[#2C3539]">
                  {new Intl.NumberFormat('en', { notation: 'compact' }).format(university.totalStudents)}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Students</p>
              </div>
            )}
            {(university.qsRanking || university.ranking) && (
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 text-center">
                <Star className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-[#2C3539]">#{university.qsRanking || university.ranking}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">QS Rank</p>
              </div>
            )}
            {university.foundedYear && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
                <GraduationCap className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-[#2C3539]">{university.foundedYear}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Founded</p>
              </div>
            )}
          </div>

          {/* About */}
          <div className="bg-white/60 rounded-xl p-5 border border-gray-200/60">
            <h3 className="font-semibold text-[#2C3539] mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E08D3C]" /> About
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {university.description ||
                `${university.name} is located in ${university.city}, ${university.country}. It offers a wide range of programs for international students.`}
            </p>
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Globe className="w-4 h-4" /> Visit Official Website
              </a>
            )}
          </div>

          {/* Facilities */}
          {[
            { label: "Scholarships", available: university.scholarshipsAvailable || university.financialAidAvailable, icon: DollarSign, color: "green" },
            { label: "Accommodation", available: university.accommodationAvailable, icon: Building2, color: "blue" },
            { label: "Career Services", available: university.careerServices, icon: TrendingUp, color: "purple" },
            { label: "Int'l Office", available: university.internationalOffice, icon: Globe, color: "orange" },
            { label: "Library", available: university.libraryServices, icon: BookOpen, color: "amber" },
          ].some(f => f.available) && (
            <div className="bg-white/60 rounded-xl p-5 border border-gray-200/60">
              <h3 className="font-semibold text-[#2C3539] mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#E08D3C]" /> Facilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Scholarships", available: university.scholarshipsAvailable || university.financialAidAvailable },
                  { label: "Accommodation", available: university.accommodationAvailable },
                  { label: "Career Services", available: university.careerServices },
                  { label: "Int'l Office", available: university.internationalOffice },
                  { label: "Library", available: university.libraryServices },
                  { label: "Health Services", available: university.healthServices },
                  { label: "Sports", available: university.sportsFacilities },
                ].filter(f => f.available).map((f, i) => (
                  <span key={i} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                    ✓ {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white/60 flex justify-end gap-3 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            className="bg-[#2C3539] hover:bg-[#E08D3C] text-white"
            onClick={() => { onClose(); onViewCourses(university); }}
          >
            View Courses
          </Button>
        </div>
      </motion.div>
    </div>
 , document.body);
};


/** ---------- Course Modal ---------- */
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
  onCourseFavoriteToggled,
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
  const navigate = useNavigate();  // ← add this line back

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

      const rawCourses: any[] = university?.courses || [];
      console.log('[CourseModal] Courses from university object:', rawCourses.length);

      const mappedCourses = rawCourses.map((course: any) => ({
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

      return matchesSearch && matchesDegree && matchesSubject && matchesLanguage;
    });
  }, [courses, searchQuery, selectedDegreeType, selectedSubject, selectedLanguage]);

  const uniqueSubjects = [...new Set(courses.map((course) => course.subject_area))];
  const uniqueLanguages = [...new Set(courses.map((course) => course.language))];

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

    console.log('Setting selectedCourse and selectedUniversity...');
    setSelectedCourse(course);
    setSelectedUniversity(university);

    console.log('Checking profile completion...');
    const isComplete = await checkProfileCompletion();

    if (!isComplete) {
      sessionStorage.setItem('returnToUniversity', JSON.stringify({
        universityId: university.id,
        universityName: university.name,
        courseId: course.id,
        courseName: course.name,
        courseDegreeLevel: course.degreeLevel,
        timestamp: Date.now()
      }));

      console.log('Profile incomplete, showing profile modal...');
      onClose();
      setShowProfileIncompleteModal(true);
      return;
    }

    console.log('Profile complete, fetching profile data...');
    await fetchAndProcessProfile();

    console.log('Closing course modal...');
    onClose();

    setTimeout(() => {
      console.log('Opening form modal...');
      setIsFormModalOpen(true);
    }, 100);
  };

  const handleFavoriteClick = async (courseId, isFavorite) => {
    const newFav = !isFavorite;
    setCourses(prev =>
      prev.map(c =>
        c.id === courseId
          ? { ...c, isFavorite: newFav, is_favorite: newFav }
          : c
      )
    );

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
      }
    } catch (error) {
      console.error('[CourseModal] Error toggling favorite:', error);

      if (error?.message?.includes('409') || error?.message?.includes('already in favorites')) {
        console.log('[CourseModal] 409 — course already in favorites, UI state is correct.');
        return;
      }

      setCourses(prev =>
        prev.map(c =>
          c.id === courseId
            ? { ...c, isFavorite, is_favorite: isFavorite }
            : c
        )
      );
      if (onCourseFavoriteToggled) {
        onCourseFavoriteToggled(courseId, isFavorite);
      }
      alert('Failed to update favorites. Please try again.');
    }
  };

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
                  <motion.div
                    key={course.id || `course-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                    <Card className="p-4 h-full flex flex-col border border-gray-100 hover:border-[#E08D3C]/40 transition-colors duration-200">

                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-bold text-sm text-[#E08D3C] line-clamp-2 flex-1 leading-snug">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          
                          <Badge className={`text-xs px-1.5 py-0.5 ${
                            course.degree_type === "phd"
                              ? "bg-purple-100 text-purple-800"
                              : course.degree_type === "masters"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {course.degree_type.charAt(0).toUpperCase() + course.degree_type.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {course.subject_area && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                            <BookOpen className="w-3 h-3" />{course.subject_area}
                          </span>
                        )}
                        {course.language && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                            <Globe className="w-3 h-3" />{course.language}
                          </span>
                        )}
                        {course.intake_season && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                            <Calendar className="w-3 h-3" />{course.intake_season}
                          </span>
                        )}
                        {course.study_mode && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                            <Clock className="w-3 h-3" />{course.study_mode}
                          </span>
                        )}
                      </div>

                     {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3 mt-auto">
                        <div className="border border-gray-200 rounded-lg p-2.5 bg-[#FFF8F2]">
                          <span className="text-gray-400 uppercase tracking-wide text-[10px] font-medium block mb-1">Tuition Fee</span>
                          <span className="font-bold text-[#2C3539] text-sm">
                            {course.tuition_fee > 0 ? formatTuition(course.tuition_fee) : "€0"}
                          </span>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                          <span className="text-gray-400 uppercase tracking-wide text-[10px] font-medium block mb-1">Duration</span>
                          <span className="font-bold text-[#2C3539] text-sm">
                            {course.duration_years ? `${course.duration_years} year${course.duration_years !== 1 ? "s" : ""}` : "N/A"}
                          </span>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                          <span className="text-gray-400 uppercase tracking-wide text-[10px] font-medium block mb-1">Min GPA</span>
                          <span className="font-bold text-[#2C3539] text-sm">{course.min_gpa || "N/A"}</span>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                          <span className="text-gray-400 uppercase tracking-wide text-[10px] font-medium block mb-1">Min IELTS</span>
                          <span className="font-bold text-[#2C3539] text-sm">{course.min_ielts || "N/A"}</span>
                        </div>
                        {course.scholarships_available && (
                          <div className="col-span-2">
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                              <Star className="w-3 h-3" /> Scholarships available
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {course.description && (
                        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{course.description}</p>
                      )}

                      {/* Apply button */}
                      {/* Apply button */}
                      <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          className="bg-[#2C3539] hover:bg-[#E08D3C] text-white font-medium transition-colors text-xs px-5"
                          onClick={() => window.open("https://students.uni360degree.com/dashboard", "_blank", "noopener,noreferrer")}>
                          Apply Now
                        </Button>
                      </div>

                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/60 backdrop-blur rounded-xl border border-gray-200/60 shadow-sm max-w-md mx-auto">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#2C3539] mb-2">No courses found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  , document.body);
};

/** ---------- Main Component ---------- */
export default function Universities() {
  const [selectedCountry, setSelectedCountry] = useState("Germany");
  const [activeFilter, setActiveFilter] = useState("All");

  // Data states
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteCourses, setFavoriteCourses] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<Record<string, boolean>>({});

  // Server-side pagination
  const [apiPage, setApiPage] = useState(1);   // 1-based UI; sent as page-1 (0-indexed) to API
  const [apiSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Server-side API filters (sent as query params)
  const [apiCountry, setApiCountry] = useState("all");       // "all" | "GB" | "DE"
  const [apiDegreeLevel, setApiDegreeLevel] = useState("all"); // "all" | "MASTERS" | "BACHELORS" | "PHD"

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDegreeType, setSelectedDegreeType] = useState("all");
  const [selectedIntakeSeason, setSelectedIntakeSeason] = useState("all");
  const [tuitionRange, setTuitionRange] = useState("all");
  const [gpaRange, setGpaRange] = useState("all");
  const [selectedUniversityType, setSelectedUniversityType] = useState("all");
  const [sortBy, setSortBy] = useState("world_ranking");

  // Filter options from API
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [subjectAreas, setSubjectAreas] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [universityTypes, setUniversityTypes] = useState<string[]>([]);

  // Modal state
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Auth states
  const [authUser, setAuthUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const loadingFavoritesRef = useRef(false);

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    checkAuthenticationStatus();
  }, []);

  useEffect(() => {
  if (isDetailsModalOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => { document.body.style.overflow = ''; };
}, [isDetailsModalOpen]);

useEffect(() => {
  if (isModalOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => { document.body.style.overflow = ''; };
}, [isModalOpen]);

  // Check authentication - check both localStorage and sessionStorage
  const checkAuthenticationStatus = () => {
    // First try sessionStorage (universities.js style)
    let savedToken = null;
    let savedAuth = null;
    
    try {
      savedToken = sessionStorage.getItem('authToken');
      const userStr = sessionStorage.getItem('authUser');
      savedAuth = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.log('[Auth] sessionStorage failed, trying localStorage');
    }
    
    // If not in sessionStorage, try localStorage (api.ts style)
    if (!savedToken) {
      try {
        savedToken = localStorage.getItem('uni_access_token');
        const userStr = localStorage.getItem('uni_user');
        savedAuth = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.log('[Auth] localStorage also failed');
      }
    }

    console.log('[Auth] Token found:', !!savedToken);
    console.log('[Auth] User found:', savedAuth);

    if (savedAuth && savedToken) {
      setAuthUser(savedAuth);
      setAuthToken(savedToken);
      setTimeout(() => {
        loadFavoriteCourses(savedToken);
      }, 50);
    } else {
      setAuthUser(null);
      setAuthToken(null);
      setFavoriteCourses(new Set());
    }
  };

  // Load favorite courses
  const loadFavoriteCourses = async (token: string) => {
    if (loadingFavoritesRef.current) return;
    try {
      loadingFavoritesRef.current = true;
      console.log('[Favorites] Loading favorite courses...');
      
      const response = await wishlistAPI.getFavoriteCourses(token);
      console.log('[Favorites] API response:', response);
      
      // Handle different response structures
      let coursesList = [];
      if (Array.isArray(response)) {
        coursesList = response;
      } else if (response?.courses) {
        coursesList = response.courses;
      } else if (response?.data) {
        coursesList = Array.isArray(response.data) ? response.data : response.data.courses || [];
      }
      
      const ids = new Set<string>();
      for (const c of coursesList) {
        if (c?.id) ids.add(String(c.id));
      }
      
      console.log('[Favorites] Loaded favorite course IDs:', Array.from(ids));
      setFavoriteCourses(ids);
    } catch (e) {
      console.error("Error loading favorite courses:", e);
      setFavoriteCourses(new Set());
    } finally {
      loadingFavoritesRef.current = false;
    }
  };

  // Toggle favorite course
  const toggleFavoriteCourse = async (courseId: string) => {
    console.log('[Favorites] Toggle called for course:', courseId);
    console.log('[Favorites] Current authToken:', authToken ? 'exists' : 'null');
    console.log('[Favorites] Current authUser:', authUser);
    
    if (!authToken) {
      // Try to get token again
      const token = localStorage.getItem('uni_access_token') || 
                    sessionStorage.getItem('authToken');
      
      if (!token) {
        alert("Please sign in to save favorite courses. No authentication token found.");
        return;
      }
      
      // Update state with found token
      setAuthToken(token);
      console.log('[Favorites] Found token, retrying...');
    }
    
    const isFav = favoriteCourses.has(courseId);
    console.log(`[Favorites] Toggling course ${courseId}, currently favorite: ${isFav}`);

    // Optimistic update
    setFavoriteCourses((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
    
    setLoadingFavorites((prev) => ({ ...prev, [courseId]: true }));

    try {
      const token = authToken || localStorage.getItem('uni_access_token') || 
                    sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      if (isFav) {
        await wishlistAPI.removeFromFavorites(token, courseId);
        console.log(`[Favorites] ✅ Removed course ${courseId}`);
      } else {
        await wishlistAPI.addToFavorites(token, courseId);
        console.log(`[Favorites] ✅ Added course ${courseId}`);
      }
    } catch (e: any) {
      console.error("Error toggling favorite:", e);
      console.error("Error details:", e.response?.data || e.message);
      
      // Revert on failure
      setFavoriteCourses((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(courseId);
        else next.delete(courseId);
        return next;
      });
      
      const errorMsg = e.response?.data?.message || e.message || "Failed to update favorites";
      alert(`Error: ${errorMsg}. Please try again or sign in.`);
    } finally {
      setLoadingFavorites((prev) => {
        const copy = { ...prev };
        delete copy[courseId];
        return copy;
      });
    }
  };

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const [citiesData, statesData, countriesData, languagesData, typesData, subjectsData] =
        await Promise.all([
          universityAPI.getCities(),
          universityAPI.getStates(),
          universityAPI.getCountries(),
          universityAPI.getLanguages(),
          universityAPI.getTypes(),
          courseAPI.getSubjectAreas(),
        ]);

      // AFTER — add a helper that extracts the string value from either a string or an object
const extractStrings = (raw: any): string[] => {
  const arr = Array.isArray(raw) ? raw : raw?.data || [];
  return arr.map((item: any) =>
    typeof item === "string" ? item : (item?.filterId ?? item?.name ?? item?.value ?? String(item))
  ).filter(Boolean);
};

setCities(extractStrings(citiesData));
setStates(extractStrings(statesData));
setCountries(extractStrings(countriesData));
setLanguages(extractStrings(languagesData));
setUniversityTypes(extractStrings(typesData));
setSubjectAreas(extractStrings(subjectsData));
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  };

  // Re-fetch whenever any server-side param changes (debounced for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUniversities();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    selectedCountry, selectedCity, selectedState,
    selectedLanguage, selectedUniversityType,
    apiPage, apiCountry, apiDegreeLevel, searchQuery,
  ]);

  const loadUniversities = async () => {
    if (loadingRef.current) return;
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Build params - mirrors ?page=0&size=20&country=GB&search=Oxford
      const params: any = {
        page: apiPage - 1,   // API is 0-indexed: page 1 -> ?page=0
        size: apiSize,
        active: true,
      };

      // API-level filters → sent as query params
      if (apiCountry && apiCountry !== "all") params.country = apiCountry;
      else if (selectedCountry && selectedCountry !== "all") params.country = selectedCountry;
      if (apiDegreeLevel && apiDegreeLevel !== "all") params.degreeLevel = apiDegreeLevel;

      // Other filters
      if (selectedCity && selectedCity !== "all") params.city = selectedCity;
      if (selectedState && selectedState !== "all") params.state = selectedState;
      if (selectedUniversityType && selectedUniversityType !== "all") params.type = selectedUniversityType;
      if (selectedLanguage && selectedLanguage !== "all") params.language_of_instruction = selectedLanguage;

      // Search → ?search=Oxford (resets to page 1 handled in onChange)
      if (searchQuery.trim()) params.search = searchQuery.trim();

      console.log('[Universities] API params:', params);
      const raw = await universityAPI.getUniversities(params);
      console.log('[Universities] Raw response:', JSON.stringify(raw)?.slice(0, 400));

      // Parse response — universities.js returns full response from apiRequest
      // apiRequest does: return jsonResponse.data || jsonResponse
      // So shape is typically: { totalCount, data: [...], page, size, hasMore }
      let universitiesList: any[] = [];
      let total = 0;

      if (raw?.totalCount !== undefined && Array.isArray(raw?.data)) {
        // Shape A (most common): { totalCount: 42, data: [...] }
        universitiesList = raw.data;
        total = raw.totalCount;
      } else if (raw?.data?.totalCount !== undefined && Array.isArray(raw?.data?.data)) {
        // Shape B (double-wrapped): { data: { totalCount: 42, data: [...] } }
        universitiesList = raw.data.data;
        total = raw.data.totalCount;
      } else if (Array.isArray(raw?.data)) {
        // Shape: { data: [...] } no totalCount
        universitiesList = raw.data;
        total = raw.total ?? raw.totalCount ?? universitiesList.length;
      } else if (Array.isArray(raw)) {
        // Plain array fallback
        universitiesList = raw;
        total = raw.length;
      }

      console.log(`[Universities] Page ${apiPage}: ${universitiesList.length} universities, total: ${total}`);
      setTotalCount(total);
      setUniversities(universitiesList);
    } catch (err) {
      setError("Failed to load universities. Please try again.");
      console.error("Error loading universities:", err);
      setUniversities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Favorites management (local)
  const addToFavorites = (universityId: string) => {
    const uni = universities.find((u) => u.id === universityId);
    if (uni && !favorites.some((f) => f.id === universityId)) {
      setFavorites((prev) => [...prev, uni]);
    }
  };

  const removeFromFavorites = (universityId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== universityId));
  };

  const isFavorite = (universityId: string) => favorites.some((f) => f.id === universityId);

  // Filter universities
  const filteredUniversities = useMemo(() => {
    let source = showFavorites ? favorites : universities;
    let filtered = [...source];

    const q = safeLower(searchQuery.trim());
    if (q) {
      filtered = filtered.filter(
        (uni) =>
          safeLower(uni.name).includes(q) ||
          safeLower(uni.city).includes(q) ||
          safeLower(uni.short_name).includes(q)
      );
    }

    if (selectedCity !== "all") {
      filtered = filtered.filter((u) => u.city === selectedCity);
    }

    if (selectedCourse !== "all") {
      filtered = filtered.filter((u) =>
        toArray(u.courses).some((c: any) => 
          (c?.field_of_study === selectedCourse || c?.fieldOfStudy === selectedCourse)
        )
      );
    }

    switch (activeFilter) {
      case "Top 50":
        filtered = filtered.filter((u) => Number(u.world_ranking || u.ranking || 0) > 0 && (u.world_ranking || u.ranking) <= 50);
        break;
      case "High Match":
        filtered = filtered.filter((u) => Number(u.match_score || 0) >= 80);
        break;
      case "Low Tuition":
        filtered = filtered.filter(
          (u) => Number(u.tuition_fee_international ?? Infinity) < 15000
        );
        break;
      case "High Acceptance":
        filtered = filtered.filter((u) => Number(u.acceptance_rate || 0) >= 20);
        break;
      default:
        break;
    }

    // Sort
    if (sortBy === "world_ranking") {
      filtered.sort((a, b) => {
        const av = Number(a.world_ranking || a.ranking || 999999);
        const bv = Number(b.world_ranking || b.ranking || 999999);
        return av - bv;
      });
    } else if (sortBy === "name") {
      filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else if (sortBy === "student_population") {
      filtered.sort((a, b) => {
        const av = Number(a.student_population ?? 0);
        const bv = Number(b.student_population ?? 0);
        return bv - av;
      });
    }

    return filtered;
  }, [
    universities,
    favorites,
    showFavorites,
    activeFilter,
    searchQuery,
    selectedCity,
    selectedCourse,
    sortBy,
  ]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  // University Card Component
  const UniversityCard = ({ university }: { university: any }) => {
    const [heartLoading, setHeartLoading] = useState(false);

    const handleHeartClick = async () => {
      if (heartLoading) return;
      setHeartLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 200));
        if (isFavorite(university.id)) removeFromFavorites(university.id);
        else addToFavorites(university.id);
      } finally {
        setHeartLoading(false);
      }
    };

    const handleLearnMore = () => {
      setSelectedUniversity(university);
      setIsModalOpen(true);
    };

    const handleViewDetails = () => {
      setSelectedUniversity(university);
      setIsDetailsModalOpen(true);
    };

    const coursesCount = toArray(university.courses).length;

    const HEADER_IMAGE = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80";

    return (
      <Card className="group relative overflow-hidden border-2 border-gray-200 shadow-md hover:border-[#E08D3C]/60 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] h-full flex flex-col"
        style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}>

        {/* Hero Image Section with Name Overlay */}
        <div className="relative h-36 sm:h-40 overflow-hidden flex-shrink-0">
          {/* Background Image */}
          <img
            src={HEADER_IMAGE}
            alt="University campus"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
          />
          
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C3539] via-[#2C3539]/60 to-transparent" />
          
          {/* Subtle brand color tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E08D3C]/10 via-transparent to-[#C4DFF0]/10" />

          {/* Top Row - Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
            <div className="flex gap-2">
              {university.match_score && (
                <div className="bg-white/95 backdrop-blur-sm text-[#2C3539] text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E08D3C]" />
                  {university.match_score}% Match
                </div>
              )}
              {university.isFeatured && (
                <div className="bg-white/95 backdrop-blur-sm text-amber-700 text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Featured
                </div>
              )}
            </div>
            
          </div>

          {/* Bottom Section - University Info Overlaid on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
            <div className="flex items-end gap-3">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white shadow-lg ring-2 ring-white/30 p-0.5">
                  {university.image_url || university.logo ? (
                    <img
                      src={university.image_url || university.logo}
                      alt={university.name}
                      className="w-full h-full object-cover rounded-lg bg-white"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                        ((e.target as HTMLElement).nextSibling as HTMLElement).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gradient-to-br from-[#C4DFF0] to-[#E08D3C] rounded-lg items-center justify-center ${
                      (university.image_url || university.logo) ? "hidden" : "flex"
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-xl px-3 py-2 border border-[#E08D3C]/10">
              <div className="flex items-center gap-1.5 mb-0.5">
                <BookOpen className="w-3 h-3 text-[#E08D3C]" />
                <span className="text-[9px] text-gray-500 uppercase tracking-wide font-medium">Courses</span>
              </div>
              <div className="text-base font-bold text-[#2C3539] leading-none">
                {coursesCount || 0}
              </div>
            </div>

            {Number.isFinite(Number(university.tuition_fee_international)) && Number(university.tuition_fee_international) > 0 ? (
              <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-2 border border-[#C4DFF0]/40">
                <div className="mb-0.5">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide font-medium">Tuition Fees</span>
                </div>
                <div className="text-xs font-bold text-[#2C3539] leading-tight">
                  {formatMoney(Number(university.tuition_fee_international), university.currency || 'EUR')}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-2 border border-[#C4DFF0]/40">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <GraduationCap className="w-3 h-3 text-[#2C3539]" />
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide font-medium">Levels</span>
                </div>
                <div className="text-xs font-bold text-[#2C3539] leading-tight">
                  {[...new Set(toArray(university.courses).map((c: any) =>
                    (c.degreeLevel ?? c.degree_level ?? '').toLowerCase()
                  ))].filter(Boolean).length} types
                </div>
              </div>
            )}
          </div>

          {/* Degree Type Badges */}
          {(() => {
            const degreeTypes = [...new Set(toArray(university.courses).map((c: any) =>
              (c.degreeLevel ?? c.degree_level ?? '').toLowerCase()
            ))].filter(Boolean);
            return degreeTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {degreeTypes.slice(0, 3).map((d: string) => (
                  <span key={d} className="text-[11px] px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200 font-medium capitalize">
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </span>
                ))}
              </div>
            ) : null;
          })()}

          {/* Popular Subjects */}
          {(() => {
            const subjects = [...new Set(toArray(university.courses).map((c: any) =>
              c.fieldOfStudy ?? c.field_of_study ?? c.subject_area
            ))].filter(Boolean);
            return subjects.length > 0 ? (
              <div className="mb-3">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Popular</p>
                <p className="text-[11px] text-gray-700 line-clamp-1 font-medium">
                  {subjects.slice(0, 2).join(" • ")}
                </p>
              </div>
            ) : null;
          })()}

          <div className="flex-1" />

          {/* CTA Buttons */}
          <div className="flex gap-2 pt-3 border-t border-blue-100/50 mt-auto">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 bg-gradient-to-r from-[#C4DFF0] to-[#a8d4ec] hover:from-[#E08D3C] hover:to-[#c77a32] text-[#2C3539] hover:text-white font-semibold rounded-lg transition-all duration-300 text-xs h-9 group/btn shadow-sm hover:shadow-md"
              onClick={handleLearnMore}>
              <span className="flex items-center gap-1">
                View Courses
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
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          {showFavorites && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavorites(false)}
              className="flex items-center space-x-2 text-gray-600 hover:text-[#E08D3C]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{showFavorites ? "Your Wishlist" : "Universities"}</h1>
            <p className="text-muted-foreground">
              {showFavorites
                ? "Your saved universities"
                : `Discover universities and courses in ${selectedCountry} matched to your profile`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={apiCountry}
            onChange={(e) => { setApiCountry(e.target.value); setApiPage(1); }}
            className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
          >
            <option value="all">All Countries</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
          </select>
          
                  
          
        </div>
      </motion.div>

      {/* Search and Filters */}
      {!showFavorites && (
        <motion.div
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Primary Filters */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
            <div className="relative xs:col-span-2 sm:col-span-3 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search universities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setApiPage(1); // reset to page 1 → ?page=0&search=Oxford
                }}
                className="pl-10 h-10 rounded-lg border-gray-300 focus:border-[#E08D3C] focus:ring-[#E08D3C] text-sm"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Cities</option>
              {toArray(cities).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All States</option>
              {toArray(states).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Subjects</option>
              {toArray(subjectAreas).map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Languages</option>
              {toArray(languages).map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
            {/* Degree level → ?degreeLevel=MASTERS sent to backend */}
            <select
              value={apiDegreeLevel}
              onChange={(e) => { setApiDegreeLevel(e.target.value); setApiPage(1); }}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Degrees</option>
              <option value="BACHELORS">Bachelor's</option>
              <option value="MASTERS">Master's</option>
              <option value="PHD">PhD</option>
            </select>

            <select
              value={selectedIntakeSeason}
              onChange={(e) => setSelectedIntakeSeason(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Intakes</option>
              <option value="winter">Winter</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
            </select>

            

            <select
              value={tuitionRange}
              onChange={(e) => setTuitionRange(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Tuition</option>
              <option value="0-10000">Under €10,000</option>
              <option value="10000-20000">€10,000 - €20,000</option>
              <option value="20000-30000">€20,000 - €30,000</option>
              <option value="30000+">€30,000+</option>
            </select>

            <select
              value={gpaRange}
              onChange={(e) => setGpaRange(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All GPA</option>
              <option value="0-2.5">2.5 and below</option>
              <option value="2.5-3.0">2.5 - 3.0</option>
              <option value="3.0-3.5">3.0 - 3.5</option>
              <option value="3.5+">3.5+</option>
            </select>

            <select
              value={selectedUniversityType}
              onChange={(e) => setSelectedUniversityType(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="all">All Types</option>
              {toArray(universityTypes).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-lg border-gray-300 text-sm px-3 bg-white"
            >
              <option value="world_ranking">Ranking (Best First)</option>
              <option value="name">Name (A to Z)</option>
              <option value="student_population">Most Students</option>
            </select>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "h-10 px-6 rounded-full text-sm font-medium transition-all min-w-[100px] flex items-center justify-center",
                  activeFilter === filter ? "bg-[#E08D3C] text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Universities Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
            <span className="ml-2 text-gray-600">Loading universities...</span>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-bold text-xl text-[#2C3539] mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={loadUniversities}
              className="bg-[#E08D3C] hover:bg-[#c77a32] text-white font-bold px-6 py-3 rounded-lg"
            >
              Try Again
            </Button>
          </div>
        ) : filteredUniversities.length > 0 ? (
          filteredUniversities.map((university) => (
            <motion.div key={university.id} variants={item} whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }}>
              <UniversityCard university={university} />
            </motion.div>
          ))
        ) : showFavorites ? (
          <div className="col-span-full text-center py-16">
            <div className="max-w-md mx-auto">
              <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-600 mb-4">No favorites yet</h3>
              <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                Start exploring universities and save your favorites by clicking the heart icon on any university card!
              </p>
              <Button
                onClick={() => setShowFavorites(false)}
                className="bg-[#E08D3C] hover:bg-[#c77a32] text-white font-bold px-8 py-3 rounded-lg text-lg"
              >
                Browse Universities
              </Button>
            </div>
          </div>
        ) : (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No universities found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria.</p>
            {searchQuery && <p className="text-sm text-gray-400">Searched for: "{searchQuery}"</p>}
          </div>
        )}
      </motion.div>

      {/* Server-side Pagination */}
      {!loading && !error && !showFavorites && totalCount > apiSize && (() => {
        const totalPages = Math.ceil(totalCount / apiSize);
        return (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pb-4">
            <button
              onClick={() => { setApiPage(p => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={apiPage === 1}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-[#2C3539] hover:border-[#E08D3C] hover:text-[#E08D3C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - apiPage) <= 1)
              .reduce((acc: (number | string)[], page, idx, arr) => {
                if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(page);
                return acc;
              }, [])
              .map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => { setApiPage(page as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                      apiPage === page
                        ? "bg-[#E08D3C] text-white hover:bg-[#c77a32]"
                        : "border border-gray-300 bg-white text-[#2C3539] hover:border-[#E08D3C] hover:text-[#E08D3C]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

            <button
              onClick={() => { setApiPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={apiPage === totalPages}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-[#2C3539] hover:border-[#E08D3C] hover:text-[#E08D3C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="ml-2 text-sm text-gray-500">
              Page {apiPage} of {totalPages} · {totalCount} universities
            </span>
          </div>
        );
      })()}

      {/* University Details Modal */}
      <UniversityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        university={selectedUniversity}
        onViewCourses={(uni) => {
          setSelectedUniversity(uni);
          setIsModalOpen(true);
        }}
      />

      {/* Course Modal */}
      <CourseModal
        university={selectedUniversity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUniversity(null);
        }}
        favoriteCourses={favoriteCourses}
        toggleFavoriteCourse={toggleFavoriteCourse}
        loadingFavorites={loadingFavorites}
      />

      {/* Recommendations Footer */}
      {!showFavorites && (
        <motion.div
          className="text-center py-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-muted-foreground mb-4">Can&apos;t find what you&apos;re looking for?</p>
          <Button variant="outline" className="rounded-pill">
            Get Personalized Recommendations
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
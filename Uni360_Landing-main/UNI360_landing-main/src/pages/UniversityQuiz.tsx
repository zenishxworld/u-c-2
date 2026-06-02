// UniversityQuiz.tsx - With Favorite Courses Functionality
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight,
  GraduationCap,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  Globe,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Languages,
  Building2,
  TrendingUp,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  Heart,
  Award,
  ChevronLeft,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Quiz from "@/components/Quiz";
import AuthPopup from "@/components/AuthPopup";
import {
  universityAPI,
  courseAPI,
  authAPI,
  apiUtils,
  wishlistAPI,
  quizAPI,
} from "@/services/api.js";
import { DialogDescription } from "@/components/ui/dialog";

const UniversityDetailsModal = ({ isOpen, onClose, university, universityStats, onViewCourses }) => {
  if (!isOpen || !university) return null;
  
  const stats = universityStats || {};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6" onClick={onClose}>
      <div 
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
                {university.city}{university.country ? `, ${university.country}` : ""}
              </span>
              {(university.ranking || university.qsRanking) && (
                <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5 text-yellow-400" />
                  QS: #{university.qsRanking || university.ranking}
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

                {(university.tuition_display || (stats.tuitionRange && stats.tuitionRange.min > 0) || university.tuition_fee) ? (
                  <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-4 py-3 border border-[#C4DFF0]/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wide font-medium">Tuition Fees</span>
                    </div>
                    <div className="text-sm font-bold text-[#2C3539] leading-tight">
                      {university.tuition_display || new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats.tuitionRange?.min || university.tuition_fee || 0)}
                    </div>
                  </div>
                ) : university.student_population ? (
                  <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-4 py-3 border border-[#C4DFF0]/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-4 h-4 text-[#2C3539]" />
                      <span className="text-[10px] text-gray-600 uppercase tracking-wide font-medium">Students</span>
                    </div>
                    <div className="text-sm font-bold text-[#2C3539] leading-tight">
                      {new Intl.NumberFormat('en', { notation: 'compact' }).format(university.student_population)}
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
                    { label: "Scholarships", available: university.scholarshipsAvailable || university.financialAidAvailable, icon: DollarSign },
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
                  {![university.scholarshipsAvailable, university.financialAidAvailable, university.accommodationAvailable, university.careerServices, university.internationalOffice, university.libraryServices].some(Boolean) && (
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
  if (onViewCourses) onViewCourses(university);
}}
          >
            View Courses
          </Button>
        </div>
      </div>
    </div>
  );
};

const UniversityQuiz = () => {
  // Quiz-related states
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [userData, setUserData] = useState({ name: "", email: "" });

  // University data states
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // Filter states - All default to "all" instead of ""
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedIntake, setSelectedIntake] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedUniversityType, setSelectedUniversityType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortBy, setSortBy] = useState("world_ranking");

  // Filter options from API
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [countries, setCountries] = useState([]);
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [universityTypes, setUniversityTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [verificationStatuses, setVerificationStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Navigation states
  const [selectedCountries, setSelectedCountries] = useState(["Germany"]);

  // Mobile filters toggle state
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Authentication states
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  
  // Favorite courses state
  const [favoriteCourses, setFavoriteCourses] = useState(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState({});

  // Server-side pagination (mirrors Universities.tsx)
  const [apiPage, setApiPage] = useState(1); // 1-based; converted to 0-based before API call
  const [apiSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // API-driven filter states (sent as query params, not applied client-side)
  const [apiCountry, setApiCountry] = useState("all");       // "all" | "DE" | "GB"
  const [apiDegreeLevel, setApiDegreeLevel] = useState("all"); // "all" | "MASTERS" | "BACHELORS" | "PHD"

  // New Categorical API filters
  const [apiStatus, setApiStatus] = useState("all");
  const [apiVerificationStatus, setApiVerificationStatus] = useState("all");
  const [apiCurrency, setApiCurrency] = useState("all");

  // New Boolean API filters
  const [apiIsFeatured, setApiIsFeatured] = useState("all");
  const [apiFinancialAid, setApiFinancialAid] = useState("all");
  const [apiAccommodation, setApiAccommodation] = useState("all");
  const [apiInternationalOffice, setApiInternationalOffice] = useState("all");
  const [apiCareerServices, setApiCareerServices] = useState("all");
  const [apiLibraryServices, setApiLibraryServices] = useState("all");
  const [apiHealthServices, setApiHealthServices] = useState("all");
  const [apiSportsFacilities, setApiSportsFacilities] = useState("all");

  // New Numeric API filters
  const [apiWorldRanking, setApiWorldRanking] = useState("");
  const [apiNationalRanking, setApiNationalRanking] = useState("");
  const [apiQsRanking, setApiQsRanking] = useState("");
  const [apiTotalStudents, setApiTotalStudents] = useState("");

  const [cachedUniversityDetails, setCachedUniversityDetails] = useState({});

  const loadingRef = useRef(false);
const loadingFavoritesRef = useRef(false);
  
// Stable reference to prevent unnecessary re-renders
const handleCloseModal = useCallback(() => {
  setSelectedUniversity(null);
}, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Check if we should auto-open the quiz
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("openQuiz") === "true") {
      setShowQuiz(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Load initial data and check authentication
  useEffect(() => {
    loadFilterOptions();
    checkAuthenticationStatus();

    // Listen for auth changes from other components
    const handleStorageChange = (e) => {
      if (e.key === "authUser" || e.key === "authToken") {
        checkAuthenticationStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for auth errors
    const handleAuthError = () => {
      handleLogout();
    };

    window.addEventListener("auth-error", handleAuthError);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, []);

  // Check authentication status from AuthUtils
  // Check authentication status from AuthUtils
const checkAuthenticationStatus = () => {
  const savedAuth = apiUtils.getAuthUser();
  const savedToken = apiUtils.getAuthToken();

  if (savedAuth && savedToken) {
    setAuthUser(savedAuth);
    setAuthToken(savedToken);
    // Load favorite courses when authenticated - delay to prevent render conflicts
    setTimeout(() => {
      loadFavoriteCourses(savedToken);
    }, 100);
  } else {
    setAuthUser(null);
    setAuthToken(null);
    setFavoriteCourses(new Set());
  }
};

  // Load favorite courses
  // Load favorite courses
const loadFavoriteCourses = async (token) => {
  // Prevent duplicate calls
  if (loadingFavoritesRef.current) return;
  
  try {
    loadingFavoritesRef.current = true;
    const response = await wishlistAPI.getFavoriteCourses(token);
    
    // Extract course IDs from the response
    const courseIds = new Set();
    if (Array.isArray(response)) {
      response.forEach(course => {
        if (course.id) courseIds.add(course.id);
      });
    } else if (response?.courses && Array.isArray(response.courses)) {
      response.courses.forEach(course => {
        if (course.id) courseIds.add(course.id);
      });
    }
    
    setFavoriteCourses(courseIds);
  } catch (error) {
    console.error("Error loading favorite courses:", error);
    setFavoriteCourses(new Set());
  } finally {
    loadingFavoritesRef.current = false;
  }
};

  // Toggle favorite course
// Toggle favorite course
const toggleFavoriteCourse = async (courseId) => {
  // Check if user is authenticated
  if (!authToken) {
    setShowAuthPopup(true);
    return;
  }

  const isFavorite = favoriteCourses.has(courseId);

  // Optimistically update UI immediately (no waiting for API)
  if (isFavorite) {
    setFavoriteCourses(prev => {
      const newSet = new Set(prev);
      newSet.delete(courseId);
      return newSet;
    });
  } else {
    setFavoriteCourses(prev => new Set([...prev, courseId]));
  }

  // Set loading state for this specific course
  setLoadingFavorites(prev => ({ ...prev, [courseId]: true }));

  try {
    if (isFavorite) {
      // Remove from favorites
      await wishlistAPI.removeFromFavorites(authToken, courseId);
    } else {
      // Add to favorites
      await wishlistAPI.addToFavorites(authToken, courseId);
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    // Revert the optimistic update on error
    if (isFavorite) {
      setFavoriteCourses(prev => new Set([...prev, courseId]));
    } else {
      setFavoriteCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
    // Show error message to user
    alert(error.message || "Failed to update favorites. Please try again.");
  } finally {
    // Clear loading state
    setLoadingFavorites(prev => {
      const newState = { ...prev };
      delete newState[courseId];
      return newState;
    });
  }
};

  // Reload when page or non-search filters change — immediate, no debounce
  useEffect(() => {
    loadUniversities();
  }, [apiPage, apiCountry, apiDegreeLevel, selectedCity, selectedState, selectedUniversityType, selectedLanguage]);

  // Reload on any server-side filter or page change (includes search, debounced)
useEffect(() => {
  const timer = setTimeout(() => {
    loadUniversities();
  }, 300);
  return () => clearTimeout(timer);
}, [
  apiPage, apiCountry, apiDegreeLevel, selectedCity, selectedState, selectedUniversityType, selectedLanguage, searchQuery,
  apiStatus, apiVerificationStatus, apiCurrency, apiIsFeatured, apiFinancialAid, apiAccommodation, apiInternationalOffice,
  apiCareerServices, apiLibraryServices, apiHealthServices, apiSportsFacilities, apiWorldRanking, apiNationalRanking,
  apiQsRanking, apiTotalStudents
]);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      // API is 1-based: page=1 → first 20, page=2 → next 20, etc.
      const params: Record<string, any> = {
        page: apiPage - 1, // pass directly — no offset adjustment needed
        size: apiSize,
      };

      // API-level filters sent as query params
      if (apiCountry && apiCountry !== "all")         params.country     = apiCountry;
      if (apiDegreeLevel && apiDegreeLevel !== "all") params.degreeLevel = apiDegreeLevel;
      if (searchQuery.trim())                         params.search      = searchQuery.trim();

      // Additional client filters also forwarded to API where supported
      if (selectedCity && selectedCity !== "all")                     params.city                   = selectedCity;
      if (selectedState && selectedState !== "all")                   params.state                  = selectedState;
      if (selectedUniversityType && selectedUniversityType !== "all") params.type                   = selectedUniversityType;
      if (selectedLanguage && selectedLanguage !== "all")             params.language_of_instruction = selectedLanguage;

      if (apiStatus && apiStatus !== "all") params.status = apiStatus;
      if (apiVerificationStatus && apiVerificationStatus !== "all") params.verificationStatus = apiVerificationStatus;
      if (apiCurrency && apiCurrency !== "all") params.currency = apiCurrency;

      if (apiIsFeatured !== "all") params.isFeatured = apiIsFeatured === "yes";
      if (apiFinancialAid !== "all") params.financialAidAvailable = apiFinancialAid === "yes";
      if (apiAccommodation !== "all") params.accommodationAvailable = apiAccommodation === "yes";
      if (apiInternationalOffice !== "all") params.internationalOffice = apiInternationalOffice === "yes";
      if (apiCareerServices !== "all") params.careerServices = apiCareerServices === "yes";
      if (apiLibraryServices !== "all") params.libraryServices = apiLibraryServices === "yes";
      if (apiHealthServices !== "all") params.healthServices = apiHealthServices === "yes";
      if (apiSportsFacilities !== "all") params.sportsFacilities = apiSportsFacilities === "yes";

      if (apiWorldRanking) params.worldRanking = apiWorldRanking;
      if (apiNationalRanking) params.nationalRanking = apiNationalRanking;
      if (apiQsRanking) params.qsRanking = apiQsRanking;
      if (apiTotalStudents) params.totalStudents = apiTotalStudents;

      const raw = await universityAPI.getUniversities(params);

      // Your API response shape (after apiRequest unwraps .data wrapper):
      //   { data: [...], totalCount: 193, page: 1, size: 20, hasMore: true }
      // apiRequest does: return jsonResponse.data || jsonResponse
      // So raw is either:
      //   Shape A (unwrapped): { data: [...], totalCount, page, size, hasMore }  ← most likely
      //   Shape B (nested):    { data: { data: [...], totalCount, ... } }
      //   Shape C (plain arr): [...]

      let universitiesArray: any[] = [];
      let total = 0;

      if (Array.isArray(raw?.data) && raw?.totalCount !== undefined) {
        // Shape A — direct { data: [], totalCount }
        universitiesArray = raw.data;
        total             = raw.totalCount;
      } else if (Array.isArray(raw?.data?.data) && raw?.data?.totalCount !== undefined) {
        // Shape B — nested { data: { data: [], totalCount } }
        universitiesArray = raw.data.data;
        total             = raw.data.totalCount;
      } else if (Array.isArray(raw)) {
        // Shape C — plain array (no pagination metadata)
        universitiesArray = raw;
        total             = raw.length;
      } else if (Array.isArray(raw?.data)) {
        // Fallback — { data: [] } with no totalCount
        universitiesArray = raw.data;
        total             = raw.total ?? raw.totalCount ?? raw.data.length;
      }

      setTotalCount(total);
      setUniversities(universitiesArray);
    } catch (err) {
      setError("Failed to load universities. Please try again.");
      console.error("[UniversityQuiz] Error loading universities:", err);
      setUniversities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const loadFilterOptions = async () => {
    try {
      const fetchDynamicFilter = async (filterBy) => {
        try {
          const res = await universityAPI.getFilters(filterBy);
          return [...new Set((res || []).map(i => i.filterId || i))];
        } catch {
          return [];
        }
      };

      const [citiesData, statesData, countriesData, languagesData, typesData, subjectsData, statusData, verificationStatusData, currencyData] = await Promise.all([
        universityAPI.getCities(),
        universityAPI.getStates(),
        universityAPI.getCountries(),
        universityAPI.getLanguages(),
        universityAPI.getTypes(),
        courseAPI.getSubjectAreas(),
        fetchDynamicFilter("status"),
        fetchDynamicFilter("verificationStatus"),
        fetchDynamicFilter("currency"),
      ]);

      setCities(citiesData || []);
      setStates(statesData || []);
      setCountries(countriesData || []);
      setLanguages(languagesData || []);
      setUniversityTypes(typesData || []);
      setSubjectAreas(subjectsData || []);
      setStatuses(statusData || []);
      setVerificationStatuses(verificationStatusData || []);
      setCurrencies(currencyData || []);
    } catch (err) {
      console.error("Error loading filter options:", err);
      setCities([]);
      setStates([]);
      setCountries([]);
      setLanguages([]);
      setUniversityTypes([]);
      setSubjectAreas([]);
      setStatuses([]);
      setVerificationStatuses([]);
      setCurrencies([]);
    }
  };

  // Authentication handlers
  // Authentication handlers
const handleAuthSuccess = async (userData, token) => {
  // Close auth popup first to prevent interference
  setShowAuthPopup(false);
  
  // Set auth data synchronously
  setAuthUser(userData);
  setAuthToken(token);
  apiUtils.setAuthData(userData, token);
  
  // Load favorites in background without awaiting
  setTimeout(() => {
    loadFavoriteCourses(token).catch(err => {
      console.error("Error loading favorites after auth:", err);
    });
  }, 100);
};
  const handleLogout = () => {
    setAuthUser(null);
    setAuthToken(null);
    setFavoriteCourses(new Set());
    apiUtils.clearAuthData();
  };

  // ─── Build matched-universities list from quiz answers ───────────────────
  // Scores each loaded university against the quiz answers and returns the
  // top matches in the format the quiz API expects.
  const buildMatchedUniversities = (answersMap: Record<number, string>) => {
    const budget = answersMap[2] ?? "";
    const field  = answersMap[1] ?? "";

    // Simple heuristic: prefer Germany unis for lower budgets
    const preferGermany =
      budget.includes("Under $15,000") || budget.includes("$15,000 - $25,000");

    return universities
      .map((uni) => {
        let score = 60; // base score
        if (preferGermany && uni.country?.toLowerCase().includes("germany")) score += 20;
        if (!preferGermany && uni.country?.toLowerCase().includes("uk")) score += 20;
        const hasCourseMatch = uni.courses?.some(
          (c) =>
            c.field_of_study?.toLowerCase().includes(field.toLowerCase()) ||
            c.subject_area?.toLowerCase().includes(field.toLowerCase())
        );
        if (hasCourseMatch) score += 15;
        if (uni.world_ranking && uni.world_ranking <= 200) score += 5;
        return { name: uni.name?.normalize("NFC") ?? "", matchPercentage: Math.min(score, 99) };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5); // top 5 matches
  };

  // ─── Submit quiz to API (fire-and-forget, non-blocking) ───────────────────
  const submitQuizResults = async (answersMap: Record<number, string>, user: any) => {
    const token = apiUtils.getAuthToken();
    if (!token || !user) {
      console.warn("[UniversityQuiz] No token or user — skipping quiz submission.");
      return;
    }
    try {
      const matchedUniversities = buildMatchedUniversities(answersMap);
      const totalAnswered = Object.keys(answersMap).length;
      const score = Math.round((totalAnswered / 5) * 100);

      const answers = [
        { questionId: "q1_education_level",    answer: answersMap[0] ?? "" },
        { questionId: "q2_field_of_study",     answer: answersMap[1] ?? "" },
        { questionId: "q3_budget",             answer: answersMap[2] ?? "" },
        { questionId: "q4_work_while_studying", answer: answersMap[3] ?? "" },
        { questionId: "q5_post_study_goals",   answer: answersMap[4] ?? "" },
      ];

      // user comes from Quiz.tsx and may only have {name, email} — always
      // cross-check with sessionStorage which holds the full profile after login.
      // Backend login response uses "userId" — resolve from all possible field names
      const storedUser = apiUtils.getAuthUser();
      const resolvedStudentId =
        Number(user?.id) ||
        Number(user?.userId) ||
        Number(user?.studentId) ||
        Number(storedUser?.id) ||
        Number(storedUser?.userId) ||
        Number(storedUser?.studentId) ||
        0;

      if (!resolvedStudentId) {
        console.warn("[UniversityQuiz] studentId could not be resolved — skipping submission.");
        return;
      }

      await quizAPI.submitQuiz(
        { studentId: resolvedStudentId, score, matchedUniversities, answers },
        token
      );
    } catch (err) {
      console.error("[UniversityQuiz] Quiz submission failed (non-blocking):", err);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (answers, userData) => {
    setQuizAnswers(answers);
    setUserData(userData);
    setShowQuiz(false);
    setShowResults(true);
    getQuizRecommendations(answers);
    // Submit to API in the background
    await submitQuizResults(answers, userData);
  };

  // Updated to handle navigation from quiz for signed-in users
  const handleNavigateToUniversities = async (answers, userData) => {
    setQuizAnswers(answers);
    setUserData(userData);
    setShowQuiz(false);
    setShowResults(true);
    getQuizRecommendations(answers);
    window.scrollTo(0, 0);

    // Ensure auth data is in sessionStorage BEFORE submitting.
    // When coming from Quiz's AuthPopup, setAuthData may not have run yet.
    const token = apiUtils.getAuthToken() ?? (userData as any)?.token ?? null;
    if (userData && token && !apiUtils.getAuthUser()?.id) {
      apiUtils.setAuthData(userData, token);
    }

    await submitQuizResults(answers, userData);
  };

  const getQuizRecommendations = (answers) => {
    const budget = answers[2];
    const field = answers[1];

    // Apply quiz-based filters
    if (
      budget?.includes("Under $15,000") ||
      budget?.includes("$15,000 - $25,000")
    ) {
      setApiCountry("DE");
setApiPage(1);
    }
  };

  const handleNavigationCountrySelect = (countries) => {
    setSelectedCountries(countries);

    if (countries.length === 0) {
      setSelectedCountry("all");
    } else if (countries.length === 1) {
      setSelectedCountry(countries[0]);
    } else {
      setSelectedCountry("all");
    }
  };

  const handleApply = () => {
    window.open("https://students.uni360degree.com/", "_blank", "noopener,noreferrer");
  };

  // Static options
  const intakes = [
    { value: "all", label: "All Intakes" },
    { value: "winter", label: "Winter" },
    { value: "summer", label: "Summer" },
    { value: "both", label: "Both" },
  ];

  const sortOptions = [
    { value: "world_ranking", label: "World Ranking (Best First)" },
    { value: "world_ranking-desc", label: "World Ranking (Worst First)" },
    { value: "name", label: "Name (A to Z)" },
    { value: "name-desc", label: "Name (Z to A)" },
    { value: "student_population", label: "Most Students" },
    { value: "student_population-desc", label: "Least Students" },
  ];

  // Filter and sort universities
  // NOTE: search, country, city, state, language, type are now handled server-side.
  // Only course-subject filtering and sort remain client-side.
  const filteredUniversities = useMemo(() => {
    let filtered = [...universities];

    // Filter by courses (subject area) — not yet a server-side param
    if (selectedCourse && selectedCourse !== "all") {
      filtered = filtered.filter((uni) =>
        uni.courses?.some((course) =>
          course.field_of_study?.toLowerCase().includes(selectedCourse.toLowerCase())
        )
      );
    }

    // Sort universities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "world_ranking":
          return (a.world_ranking || 9999) - (b.world_ranking || 9999);
        case "world_ranking-desc":
          return (b.world_ranking || 0) - (a.world_ranking || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "student_population":
          return (b.student_population || 0) - (a.student_population || 0);
        case "student_population-desc":
          return (a.student_population || 0) - (b.student_population || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    universities,
    selectedCourse,
    sortBy,
  ]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCourse("all");
    setSelectedCountry("all");
    setSelectedCountries(["Germany"]);
    setSelectedIntake("all");
    setSelectedLanguage("all");
    setSelectedState("all");
    setSelectedCity("all");
    setSelectedUniversityType("all");
    // reset server-side params too
    setApiPage(1);
    setApiCountry("all");
    setApiDegreeLevel("all");
    setApiStatus("all");
    setApiVerificationStatus("all");
    setApiCurrency("all");
    setApiIsFeatured("all");
    setApiFinancialAid("all");
    setApiAccommodation("all");
    setApiInternationalOffice("all");
    setApiCareerServices("all");
    setApiLibraryServices("all");
    setApiHealthServices("all");
    setApiSportsFacilities("all");
    setApiWorldRanking("");
    setApiNationalRanking("");
    setApiQsRanking("");
    setApiTotalStudents("");
  };

  // Reset to page 1 when sort or subject-area filter changes (client-side only filters)
  useEffect(() => {
    setApiPage(1);
  }, [sortBy, selectedCourse]);

  // University Card Component
  const UniversityCard = ({ university }) => {
    // Universal university campus image
    const HEADER_IMAGE = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80";

    const degreeTypes = university.courses 
      ? [...new Set(university.courses.map(c => c.degree_level || c.degree_type || "masters"))].filter(Boolean).slice(0, 3) 
      : [];
    const subjects = university.courses 
      ? [...new Set(university.courses.map(c => c.field_of_study || c.subject_area))].filter(Boolean).slice(0, 2) 
      : [];

    return (
      <Card className="group relative overflow-hidden border-2 border-gray-200 shadow-md hover:border-[#E08D3C]/60 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] h-full flex flex-col"
        style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}>
        
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
            {university.matchPercentage || university.match_score ? (
              <div className="bg-white/95 backdrop-blur-sm text-[#2C3539] text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E08D3C]" />
                {university.matchPercentage || university.match_score}% Match
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
            {university.world_ranking && (
              <div className="inline-flex items-center gap-1 bg-[#C4DFF0]/40 text-[#2C3539] text-[10px] px-2 py-0.5 rounded-full font-semibold border border-[#C4DFF0]">
                <Star className="w-2.5 h-2.5 fill-current text-[#E08D3C]" />
                #{university.world_ranking}
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
                {university.courses?.length || university.total_courses || 0}
              </div>
            </div>

            {/* Tuition or Students */}
            {university.tuition_fee_international !== undefined ? (
              <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-1.5 border border-[#C4DFF0]/40">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide font-medium">Tuition Fees</span>
                </div>
                <div className="text-xs font-bold text-[#2C3539] leading-tight">
                  {university.currency || ""} {university.tuition_fee_international}/yr
                </div>
              </div>
            ) : university.student_population ? (
              <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-1.5 border border-[#C4DFF0]/40">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Users className="w-3 h-3 text-[#2C3539]" />
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide font-medium">Students</span>
                </div>
                <div className="text-xs font-bold text-[#2C3539] leading-tight">
                  {new Intl.NumberFormat('en', { notation: 'compact' }).format(university.student_population)}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-3 py-1.5 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <GraduationCap className="w-3 h-3 text-gray-500" />
                  <span className="text-[9px] text-gray-500 uppercase tracking-wide font-medium">Levels</span>
                </div>
                <div className="text-xs font-bold text-[#2C3539] leading-tight">
                  {degreeTypes.length || 0} types
                </div>
              </div>
            )}
          </div>

          {/* Degree Types Badges */}
          {degreeTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {degreeTypes.map((degree) => (
                <span
                  key={degree}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200 font-medium capitalize">
                  {degree}
                </span>
              ))}
            </div>
          )}

          {/* Subjects line */}
          {subjects.length > 0 && (
            <div className="mb-3 px-2.5 py-1.5 bg-gray-50/50 rounded-lg border border-gray-100">
              <p className="text-[10px] text-gray-500 mb-0.5 font-medium uppercase tracking-wide">Popular</p>
              <p className="text-[11px] text-gray-700 line-clamp-1 font-medium">
                {subjects.join(" • ")}
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
              onClick={() => {
                setSelectedUniversity(university);
                setIsModalOpen(true);
              }}>
              <span className="flex items-center gap-1">
                {university.courses?.length > 0 ? "View Courses" : "Learn More"}
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </span>
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-[#2C3539] hover:bg-[#E08D3C] text-white font-semibold rounded-lg transition-all duration-300 text-xs h-9 shadow-sm hover:shadow-md group/btn"
              onClick={() => {
                setSelectedUniversity(university);
                setIsDetailsModalOpen(true);
              }}>
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

  // Introductory Card Component
  

  // University Modal Component — mirrors CourseModal in Universities.tsx
  const UniversityModal = ({ university, onClose, handleApply }) => {
    const [courseSearch, setCourseSearch] = useState("");
    const [selectedDegreeType, setSelectedDegreeType] = useState("all");
    const [selectedSubject, setSelectedSubject] = useState("all");
    const [selectedLanguage, setSelectedLanguage] = useState("all");

    const courses = university?.courses || [];

    const formatTuition = (tuition) => {
      if (!tuition || tuition === 0) return "€0";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parseFloat(tuition));
    };

    const formatDuration = (months) => {
      if (!months) return "—";
      if (months >= 12) {
        const years = Math.floor(months / 12);
        const rem = months % 12;
        return rem === 0 ? `${years} year${years > 1 ? "s" : ""}` : `${years}y ${rem}m`;
      }
      return `${months} months`;
    };

    // Normalise each course so field names match what Universities.tsx expects
    const normalisedCourses = useMemo(() => courses.map((c) => ({
      ...c,
      subject_area: c.field_of_study ?? c.subject_area ?? "",
      language: c.language_of_instruction ?? c.language ?? "English",
      degree_type: (c.degree_level ?? c.degree_type ?? "masters").toLowerCase(),
      duration_months: c.duration_months ?? ((c.duration_years ?? 2) * 12),
      intake_season: c.intake ?? c.intake_season ?? "",
      tuition_fee: c.tuition_fee_international ?? c.tuition_fee ?? 0,
      min_gpa: c.min_gpa ?? "2.5",
      min_ielts: c.min_ielts ?? "6.5",
    })), [courses]);

    const uniqueSubjects = [...new Set(normalisedCourses.map((c) => c.subject_area).filter(Boolean))];
    const uniqueLanguages = [...new Set(normalisedCourses.map((c) => c.language).filter(Boolean))];

    const filteredCourses = useMemo(() => normalisedCourses.filter((course) => {
      const matchesSearch =
        !courseSearch ||
        course.name?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.subject_area?.toLowerCase().includes(courseSearch.toLowerCase());
      const matchesDegree = selectedDegreeType === "all" || course.degree_type === selectedDegreeType;
      const matchesSubject = selectedSubject === "all" || course.subject_area === selectedSubject;
      const matchesLanguage =
        selectedLanguage === "all" ||
        course.language?.toLowerCase() === selectedLanguage.toLowerCase();
      return matchesSearch && matchesDegree && matchesSubject && matchesLanguage;
    }), [normalisedCourses, courseSearch, selectedDegreeType, selectedSubject, selectedLanguage]);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6" onClick={onClose}>
        <div
          className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2 border-gray-200 relative"
          onClick={(e) => e.stopPropagation()}
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
                  {university.city}{university.country ? `, ${university.country}` : ""}
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-10 bg-white border-gray-200 shadow-sm"
                  />
                </div>
                <select
                  value={selectedDegreeType}
                  onChange={(e) => setSelectedDegreeType(e.target.value)}
                  className="h-10 rounded-lg border-gray-200 text-sm px-3 bg-white shadow-sm outline-none">
                  <option value="all">All Degrees</option>
                  <option value="bachelors">Bachelor's</option>
                  <option value="masters">Master's</option>
                  <option value="phd">PhD</option>
                </select>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="h-10 rounded-lg border-gray-200 text-sm px-3 bg-white shadow-sm outline-none">
                  <option value="all">All Subjects</option>
                  {uniqueSubjects.map((subject, index) => (
                    <option key={`subject-${index}-${subject}`} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="h-10 rounded-lg border-gray-200 text-sm px-3 bg-white shadow-sm outline-none">
                  <option value="all">All Languages</option>
                  {uniqueLanguages.map((language, index) => (
                    <option key={`language-${index}-${language}`} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#E08D3C]" />
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
            </div>

            {/* Course Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              toggleFavoriteCourse(course.id);
                            }}
                            disabled={loadingFavorites[course.id]}
                            className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 ${
                              favoriteCourses.has(course.id)
                                ? 'text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={favoriteCourses.has(course.id) ? 'Remove from wishlist' : 'Add to wishlist'}>
                            {loadingFavorites[course.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Heart className={`w-4 h-4 transition-transform duration-200 ${favoriteCourses.has(course.id) ? 'fill-current scale-110' : ''}`} />
                            )}
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
                        {course.intake_season && (
                          <Badge variant="outline" className="text-xs bg-purple-50/50 border-purple-100/50 text-[#2C3539]">
                            <Calendar className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                            {course.intake_season}
                          </Badge>
                        )}
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
                        onClick={handleApply}>
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
      </div>
    </div>
    );
  };

  if (showQuiz) {
    return (
      <Quiz
        selectedCountries={selectedCountries}
        onCountrySelect={handleNavigationCountrySelect}
        onQuizComplete={handleQuizComplete}
        onNavigateToUniversities={handleNavigateToUniversities}
        showInline={true}
        onBackToUniversities={() => setShowQuiz(false)}
      />
    );
  }

  return (
    <div className="min-h-screen mt-20 bg-gray-50">
      <Navigation
        selectedCountries={selectedCountries}
        onCountrySelect={handleNavigationCountrySelect}
      />

      

      {/* Sticky Filter Section */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-8 py-3 xs:py-4 sm:py-6">
          <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-[#2C3539] truncate">
              {showResults ? "Your Recommendations" : "Browse Universities"}
            </h1>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-[#E08D3C] hover:bg-[#c77a32] text-white font-medium px-3 xs:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center text-sm xs:text-base flex-shrink-0">
              <Filter className="w-3 xs:w-4 h-3 xs:h-4 mr-1 xs:mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {showFilters ? (
                <ChevronUp className="w-3 xs:w-4 h-3 xs:h-4 ml-1" />
              ) : (
                <ChevronDown className="w-3 xs:w-4 h-3 xs:h-4 ml-1" />
              )}
            </Button>
          </div>

          {/* Filter Section */}
          <div
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block transition-all duration-300`}>
            {/* Primary Filters */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 xs:gap-3 lg:gap-4 mb-3 xs:mb-4 lg:mb-6">
              <div className="relative xs:col-span-2 sm:col-span-3 lg:col-span-2">
                <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 w-3 xs:w-4 h-3 xs:h-4 text-gray-400" />
                <Input
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setApiPage(1); // reset to page 1 on new search → ?search=Oxford&page=0
                  }}
                  className="pl-8 xs:pl-10 py-2 rounded-lg border-gray-300 focus:border-[#E08D3C] focus:ring-[#E08D3C] text-sm xs:text-base"
                />
              </div>

              {/* Country filter → sends ?country=GB or ?country=DE to backend */}
              <Select
                value={apiCountry}
                onValueChange={(v) => {
                  setApiCountry(v);
                  setApiPage(1);
                }}>
                <SelectTrigger className="rounded-lg border-gray-300 text-sm xs:text-base">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="rounded-lg border-gray-300 text-sm xs:text-base">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.filter(Boolean).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="rounded-lg border-gray-300 text-sm xs:text-base">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.filter(Boolean).map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-lg border-gray-300 text-sm xs:text-base">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectAreas.filter(Boolean).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secondary Filters Row: Dropdowns + Sort */}
            <div className="flex flex-wrap items-center gap-2 xs:gap-3 mb-3">
              <Select
                value={apiDegreeLevel}
                onValueChange={(v) => { setApiDegreeLevel(v); setApiPage(1); }}>
                <SelectTrigger className="w-40 rounded-lg border-gray-300 text-sm">
                  <SelectValue placeholder="Degree Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degree Levels</SelectItem>
                  <SelectItem value="BACHELORS">Bachelors</SelectItem>
                  <SelectItem value="MASTERS">Masters</SelectItem>
                  <SelectItem value="PHD">PhD</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-36 rounded-lg border-gray-300 text-sm">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.filter(Boolean).map((language) => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUniversityType} onValueChange={setSelectedUniversityType}>
                <SelectTrigger className="w-36 rounded-lg border-gray-300 text-sm">
                  <SelectValue placeholder="University Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {universityTypes.filter(Boolean).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-[#2C3539] shrink-0">Sort:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 rounded-lg border-gray-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.filter(o => o.value).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="number"
                placeholder="Min Students"
                value={apiTotalStudents}
                onChange={(e) => { setApiTotalStudents(e.target.value); setApiPage(1); }}
                className="w-32 rounded-lg border-gray-300 text-sm"
              />
            </div>

            {/* Tertiary Row: Facility Pills + Min Students + Clear Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {[
                { label: "Financial Aid", state: apiFinancialAid, set: setApiFinancialAid },
                { label: "Accommodation", state: apiAccommodation, set: setApiAccommodation },
                { label: "Career Services", state: apiCareerServices, set: setApiCareerServices },
                { label: "Health Services", state: apiHealthServices, set: setApiHealthServices },
              ].map((filter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const nextState = filter.state === "all" ? "yes" : filter.state === "yes" ? "no" : "all";
                    filter.set(nextState);
                    setApiPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filter.state === "yes"
                      ? "bg-[#E08D3C] text-white border-[#E08D3C]"
                      : filter.state === "no"
                      ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                      : "bg-white text-gray-600 border-gray-300 hover:border-[#E08D3C] hover:text-[#E08D3C]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Compact filter summary when collapsed on mobile */}
          {!showFilters && (
            <div className="lg:hidden flex items-center justify-between text-xs xs:text-sm text-gray-600 mt-2">
              <span>
                {loading
                  ? "Loading..."
                  : `${totalCount} universities found`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Universities Grid */}
      {/* Universities Grid */}
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-8 py-4 xs:py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#E08D3C]" />
            <span className="ml-2 text-gray-600">Loading universities...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-bold text-xl text-[#2C3539] mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={loadUniversities}
              className="bg-[#E08D3C] hover:bg-[#c77a32] text-white font-bold px-6 py-3 rounded-lg">
              Try Again
            </Button>
          </div>
        ) : filteredUniversities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 xs:gap-6 lg:gap-8">
              {filteredUniversities.map((university) => (
                <UniversityCard key={university.id} university={university} />
              ))}
            </div>

            {/* Server-side Pagination — mirrors Universities.tsx */}
            {totalCount > apiSize && (() => {
              const totalPages = Math.ceil(totalCount / apiSize);
              return (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setApiPage(p => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={apiPage === 1}
                    className="h-10 w-10 p-0 border-gray-300 text-[#2C3539] hover:border-[#E08D3C] hover:text-[#E08D3C] disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

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
                        <Button
                          key={page}
                          size="sm"
                          onClick={() => { setApiPage(page as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={apiPage === page
                            ? "bg-[#E08D3C] text-white hover:bg-[#c77a32] min-w-[36px]"
                            : "border border-gray-300 bg-white text-[#2C3539] hover:border-[#E08D3C] hover:text-[#E08D3C] min-w-[36px]"
                          }>
                          {page}
                        </Button>
                      )
                    )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setApiPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={apiPage === totalPages}
                    className="h-10 w-10 p-0 border-gray-300 text-[#2C3539] hover:border-[#E08D3C] hover:text-[#E08D3C] disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <span className="ml-2 text-sm text-gray-500">
                    Page {apiPage} of {totalPages} · {totalCount} universities
                  </span>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="text-center py-12 xs:py-16">
            <div className="text-4xl xs:text-5xl sm:text-6xl mb-3 xs:mb-4">
              🔍
            </div>
            <h3 className="font-bold text-xl xs:text-2xl text-[#2C3539] mb-2">
              No universities found
            </h3>
            <p className="text-gray-600 mb-6 xs:mb-8 text-base xs:text-lg leading-relaxed max-w-md mx-auto">
              Try adjusting your search criteria or filters to find more
              options.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 justify-center">
              <Button
                variant="outline"
                className="border-2 border-gray-300 hover:border-[#E08D3C] hover:text-[#E08D3C] font-medium px-4 xs:px-6 py-2.5 xs:py-3 rounded-lg text-sm xs:text-base"
                onClick={clearAllFilters}>
                Clear All Filters
              </Button>
              <Button
                className="bg-[#2C3539] hover:bg-[#1e2529] text-white font-bold px-4 xs:px-6 py-2.5 xs:py-3 rounded-lg text-sm xs:text-base transition-colors duration-200"
                onClick={() => setShowQuiz(true)}>
                Take Profile Quiz
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* University Course Modal */}
      {selectedUniversity && isModalOpen && (
        <div key={`modal-courses-${selectedUniversity.id}`}>
          <UniversityModal
            university={selectedUniversity}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUniversity(null);
            }}
            handleApply={handleApply}
          />
        </div>
      )}

      {/* University Details Modal */}
      <UniversityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUniversity(null);
        }}
        university={selectedUniversity}
        universityStats={{
          totalCourses: selectedUniversity?.courses?.length || selectedUniversity?.total_courses || 0,
          degreeTypes: selectedUniversity?.courses ? [...new Set(selectedUniversity.courses.map(c => c.degree_level || c.degree_type || "masters"))].filter(Boolean) : [],
          subjects: selectedUniversity?.courses ? [...new Set(selectedUniversity.courses.map(c => c.field_of_study || c.subject_area))].filter(Boolean) : []
        }}
        onViewCourses={() => {
          setIsDetailsModalOpen(false);
          setIsModalOpen(true);
        }}
      />

      {/* Authentication Modal */}
      <AuthPopup
  isOpen={showAuthPopup}
  onClose={() => setShowAuthPopup(false)}
  onAuthSuccess={(userData, token) => {
    handleAuthSuccess(userData, token);
    setShowAuthPopup(false);
  }}
/>

      <Footer />
    </div>
  );
};

export default UniversityQuiz;
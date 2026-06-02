import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  CurrencyPoundIcon,
  StarIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { universityAPI } from "../../services/universityService";
import { courseAPI } from "../../services/courseService";

const UniversityManagement = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);

  const [apiPage, setApiPage] = useState(0);
  const PAGE_SIZE = 20;
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    country: "",
    status: "",
    ranking: "",
    type: "",
    institutionType: "",
    tuition: "",
    scholarshipsAvailable: "",
  });
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    countries: {}
  });
  const [availableFilters, setAvailableFilters] = useState({
    countries: [],
    types: [],
    rankings: [],
    institutionTypes: [],
    tuitionRanges: [],
    scholarships: []
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadType, setUploadType] = useState("university");

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [universityCourses, setUniversityCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showAllCoursesModal, setShowAllCoursesModal] = useState(false);
  const [allCourses, setAllCourses] = useState([]);

  const [coursesOffset, setCoursesOffset] = useState(0);
  const [coursesTotalCount, setCoursesTotalCount] = useState(0);

  const fetchUniversities = async (pageOverride) => {
    try {
      setLoading(true);

      const page = pageOverride !== undefined ? pageOverride : apiPage;

      const params = {
        page,
        size: PAGE_SIZE,
      };

      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (filters.country && filters.country !== 'all') params.country = filters.country;
      if (filters.ranking && filters.ranking !== 'all') params.ranking = filters.ranking;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.institutionType && filters.institutionType !== 'all') {
        params.institutionType = filters.institutionType;
      }
      if (filters.tuition && filters.tuition !== 'all') params.tuition = filters.tuition;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.scholarshipsAvailable !== '' && filters.scholarshipsAvailable !== undefined) {
        params.scholarshipsAvailable = filters.scholarshipsAvailable;
      }
      const response = await universityAPI.getUniversities(params);
      let universitiesData = [];
      let total = 0;

      const raw = response;
      if (raw?.data?.totalCount !== undefined && Array.isArray(raw?.data?.data)) {
        universitiesData = raw.data.data;
        total = raw.data.totalCount;
      } else if (raw?.totalCount !== undefined && Array.isArray(raw?.data)) {
        universitiesData = raw.data;
        total = raw.totalCount;
      } else if (Array.isArray(raw?.data)) {
        universitiesData = raw.data;
        total = raw.total ?? raw.totalCount ?? universitiesData.length;
      } else if (Array.isArray(raw)) {
        universitiesData = raw;
        total = raw.length;
      }
      const transformedUniversities = universitiesData.map(uni => ({
        id: uni.id,
        name: uni.name || uni.short_name,
        country: uni.country,
        city: uni.city,
        location: uni.location_display || `${uni.city}, ${uni.country}`,
        status: uni.is_active ? 'active' : 'inactive',
        ranking: uni.world_ranking,
        nationalRanking: uni.national_ranking,
        establishedYear: uni.establishedYear,
        tuitionFee: uni.tuition_fee_international || 0,
        programs: uni.courses?.length || 0,
        totalStudents: uni.student_population || 0,
        commissionRate: uni.commissionRate || 0,
        logo: uni.logo || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRTA4RDNDIi8+Cjx0ZXh0IHg9IjI0IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VU5JPC90ZXh0Pgo8L3N2Zz4K`,
        description: uni.description,
        code: uni.code,
        website: uni.website,
        currency: uni.currency,
        type: uni.type,
        institutionType: uni.institutionType,
        rankingCategory: uni.ranking_category,
        tuitionCategory: uni.tuition_category,
        sizeCategory: uni.size_category,
        universityScore: uni.university_score,
        courses: uni.courses || [],
      }));

      setUniversities(transformedUniversities);
      setTotalCount(total);

      const activeCount = transformedUniversities.filter(u => u.status === 'active').length;
      const countryCounts = {};
      transformedUniversities.forEach(u => {
        countryCounts[u.country] = (countryCounts[u.country] || 0) + 1;
      });
      setStats({ total, active: activeCount, countries: countryCounts });

    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load universities';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const COUNTRY_NAMES = {
    GB: 'United Kingdom',
    UK: 'United Kingdom',
    DE: 'Germany',
    US: 'United States',
    AU: 'Australia',
    CA: 'Canada',
    NZ: 'New Zealand',
    IE: 'Ireland',
    NL: 'Netherlands',
    FR: 'France',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    CH: 'Switzerland',
    AT: 'Austria',
    IT: 'Italy',
    ES: 'Spain',
    IN: 'India',
    SG: 'Singapore',
    MY: 'Malaysia',
  };

  const getCountryLabel = (code, count) => {
    const name = COUNTRY_NAMES[code?.toUpperCase()] || code;
    return count !== undefined ? `${name} (${count})` : name;
  };

  const fetchFilters = async () => {
    try {
      const response = await universityAPI.getFilters();
      const filtersData = response?.data?.filters || [];
      let countries = filtersData
        .filter(f => f.filterParam === 'country')
        .map(f => ({ value: f.filterId, count: f.count }));

      const hasGB = countries.some(
        c => c.value?.toUpperCase() === 'GB' || c.value?.toUpperCase() === 'UK'
      );
      if (!hasGB) {
        countries = [{ value: 'GB', count: 0 }, ...countries];
      }

      const types = filtersData
        .filter(f => f.filterParam === 'type')
        .map(f => ({ value: f.filterId, count: f.count }));

      const rankings = filtersData
        .filter(f => f.filterParam === 'ranking')
        .map(f => ({ value: f.filterId, count: f.count }));

      const institutionTypes = filtersData
        .filter(f => f.filterParam === 'institutionType')
        .map(f => ({ value: f.filterId, count: f.count }));

      const tuitionRanges = filtersData
        .filter(f => f.filterParam === 'tuition')
        .map(f => ({ value: f.filterId, count: f.count }));

      const scholarships = filtersData
        .filter(f => f.filterParam === 'scholarshipsAvailable')
        .map(f => ({ value: f.filterId, count: f.count }));

      setAvailableFilters({
        countries,
        types,
        rankings,
        institutionTypes,
        tuitionRanges,
        scholarships
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    setApiPage(0);
    fetchUniversities(0);
    fetchFilters();
  }, [
    filters.search,
    filters.country,
    filters.status,
    filters.ranking,
    filters.type,
    filters.institutionType,
    filters.tuition,
    filters.scholarshipsAvailable,
  ]);

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    fetchUniversities(apiPage);
  }, [apiPage]);

  const searchTimerRef = React.useRef(null);
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 400);
  };

  const handleFilterChange = (key, value) => {
    let processedValue = value;
    if (key === 'scholarshipsAvailable' && value !== '') {
      processedValue = value === 'true';
    }
    setFilters(prev => ({ ...prev, [key]: processedValue }));
  };

  const handleCreateUniversity = () => {
    setSelectedUniversity(null);
    setModalMode("create");
    setShowUniversityModal(true);
  };

  const handleViewUniversity = async (universityId) => {
    try {
      setLoading(true);
      const response = await universityAPI.getUniversityById(universityId);

      const uni = response?.data;
      const transformedUniversity = {
        id: uni.id,
        name: uni.name || uni.shortName,
        country: uni.country,
        city: uni.city,
        location: uni.locationString || `${uni.city}, ${uni.country}`,
        status: uni.isActive || uni.active ? 'active' : 'inactive',
        ranking: uni.worldRanking,
        nationalRanking: uni.nationalRanking,
        establishedYear: uni.establishedYear,
        tuitionFee: uni.tuitionFee || 0,
        programs: uni.programs || 0,
        totalStudents: uni.totalStudents || uni.student_population || 0,
        commissionRate: uni.commissionRate || 0,
        description: uni.description,
        code: uni.code,
        website: uni.websiteUrl || uni.website,
        currency: uni.currency,
        type: uni.type,
        institutionType: uni.institutionType,
        rankingCategory: uni.ranking_category,
        tuitionCategory: uni.tuition_category,
        sizeCategory: uni.size_category,
        universityScore: uni.university_score,
        courses: uni.courses || universities.find(u => u.id === universityId)?.courses || []
      };

      setSelectedUniversity(transformedUniversity);
      setModalMode("view");
      setShowUniversityModal(true);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load university details';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUniversity = async (universityId) => {
    try {
      setLoading(true);
      const response = await universityAPI.getUniversityById(universityId);

      const uni = response?.data;
      const transformedUniversity = {
        id: uni.id,
        name: uni.name || uni.shortName,
        country: uni.country,
        city: uni.city,
        location: uni.locationString || `${uni.city}, ${uni.country}`,
        status: uni.isActive || uni.active ? 'active' : 'inactive',
        ranking: uni.worldRanking,
        establishedYear: uni.establishedYear,
        tuitionFee: uni.tuitionFee || 0,
        programs: uni.programs || 0,
        totalStudents: uni.totalStudents || 0,
        commissionRate: uni.commissionRate || 0,
        description: uni.description,
        code: uni.code,
        website: uni.websiteUrl,
        currency: uni.currency,
        type: uni.type,
        institutionType: uni.institutionType
      };

      setSelectedUniversity(transformedUniversity);
      setModalMode("edit");
      setShowUniversityModal(true);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load university details';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUniversity = async (universityId) => {
    if (window.confirm("Are you sure you want to deactivate this university?")) {
      try {
        setLoading(true);

        const response = await universityAPI.getUniversityById(universityId);
        const currentData = response?.data;

        const updateData = {
          name: currentData.name,
          city: currentData.city,
          active: false
        };
        await universityAPI.updateUniversity(universityId, updateData);

        showToast('success', 'University deactivated successfully');
        fetchUniversities();
      } catch (error) {
        const msg = error?.response?.data?.message || error?.message || 'Failed to deactivate university';
        showToast('error', msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveUniversity = async (universityData) => {
    try {
      setLoading(true);

      if (modalMode === "create") {
        const payload = {
          name: universityData.name,
          short_name: universityData.shortName || universityData.name,
          code: universityData.code,
          type: universityData.type || 'public',
          status: universityData.status || 'active',
          country: universityData.country,
          city: universityData.city,
          state: universityData.state || '',
          address: universityData.address || '',
          website: universityData.website || '',
          email: universityData.email || '',
          phone: universityData.phone || '',
          institution_type: universityData.institutionType || 'public',
          founded_year: Number(universityData.foundedYear) || null,
          student_population: Number(universityData.totalStudents) || 0,
          faculty_count: Number(universityData.facultyCount) || 0,
          world_ranking: Number(universityData.ranking) || null,
          national_ranking: Number(universityData.nationalRanking) || null,
          tuition_fee_international: Number(universityData.tuitionFee) || 0,
          currency: universityData.currency || 'GBP',
          application_fee: Number(universityData.applicationFee) || 0,
          min_ielts: Number(universityData.minIelts) || null,
          min_toefl: Number(universityData.minToefl) || null,
          scholarships_available: Boolean(universityData.scholarshipsAvailable),
          financial_aid_available: Boolean(universityData.financialAidAvailable),
          accommodation_available: Boolean(universityData.accommodationAvailable),
          international_office: Boolean(universityData.internationalOffice),
          career_services: Boolean(universityData.careerServices),
          library_services: Boolean(universityData.libraryServices),
          health_services: Boolean(universityData.healthServices),
          sports_facilities: Boolean(universityData.sportsFacilities),
          language_of_instruction: universityData.languageOfInstruction || 'English',
          description: universityData.description || '',
          programs_offered: universityData.programsOffered || [],
          facilities: universityData.facilities || [],
          client_id: 'uni360',
        };

        const response = await universityAPI.createUniversity(payload);
        showToast('success', `University "${response.data?.name}" created successfully!`);
        setShowUniversityModal(false);
        fetchUniversities();
        return;
      } else if (modalMode === "edit") {
        const apiData = {};

        if (universityData.name && universityData.name !== selectedUniversity.name) {
          apiData.name = String(universityData.name).trim();
        }

        if (universityData.location && universityData.location !== selectedUniversity.location) {
          apiData.locationString = String(universityData.location).trim();
        }

        if (universityData.ranking !== selectedUniversity.ranking && !isNaN(universityData.ranking)) {
          apiData.worldRanking = parseInt(universityData.ranking, 10);
        }

        if (universityData.tuitionFee !== selectedUniversity.tuitionFee && !isNaN(universityData.tuitionFee)) {
          apiData.tuitionFee = parseFloat(universityData.tuitionFee);
        }

        if (universityData.programs !== selectedUniversity.programs && !isNaN(universityData.programs)) {
          apiData.programs = parseInt(universityData.programs, 10);
        }

        if (universityData.totalStudents !== selectedUniversity.totalStudents && !isNaN(universityData.totalStudents)) {
          apiData.totalStudents = parseInt(universityData.totalStudents, 10);
        }

        if (universityData.commissionRate !== selectedUniversity.commissionRate && !isNaN(universityData.commissionRate)) {
          apiData.commissionRate = parseFloat(universityData.commissionRate);
        }

        if (universityData.description && universityData.description !== selectedUniversity.description) {
          apiData.description = String(universityData.description).trim();
        }

        if (universityData.website && universityData.website !== selectedUniversity.website) {
          apiData.websiteUrl = String(universityData.website).trim();
        }

        if (universityData.currency && universityData.currency !== selectedUniversity.currency) {
          apiData.currency = String(universityData.currency).trim();
        }

        if (universityData.type && universityData.type !== selectedUniversity.type) {
          apiData.type = String(universityData.type).trim();
        }

        if (universityData.institutionType && universityData.institutionType !== selectedUniversity.institutionType) {
          apiData.institutionType = String(universityData.institutionType).trim();
        }
        if (Object.keys(apiData).length === 0) {
          showToast('error', 'No changes detected');
          setShowUniversityModal(false);
          return;
        }

        const testPayload = { name: apiData.name || selectedUniversity.name };
        await universityAPI.updateUniversity(selectedUniversity.id, testPayload);
        showToast('success', 'University updated successfully');
      }

      setShowUniversityModal(false);
      fetchUniversities();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save university';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCourses = (university) => {
    const coursesData = university.courses || [];

    const transformedCourses = coursesData.map(course => ({
      id: course.id,
      name: course.name,
      universityName: university.name,
      universityCode: university.code,
      universityCountry: university.country,
      courseCode: course.course_code,
      degreeLevel: course.degree_level,
      degreeType: course.degree_type,
      fieldOfStudy: course.field_of_study,
      studyMode: course.study_mode,
      durationYears: course.duration_years,
      tuitionInternational: course.tuition_fee_international,
      currency: course.currency,
      scholarshipsAvailable: course.scholarships_available || false
    }));

    setUniversityCourses(transformedCourses);
    setShowCoursesModal(true);
  };

  const COURSES_LIMIT = 20;

  const handleViewAllCourses = async (offset = 0, search = '') => {
    try {
      setCoursesLoading(true);
      setShowAllCoursesModal(true);
      setCoursesOffset(offset);

      const response = await courseAPI.getCourses({ limit: COURSES_LIMIT, offset, search });
      const coursesData = response?.data?.data || response?.data || response?.content || response || [];
      const total = response?.totalCount ?? response?.total ?? response?.data?.totalCount ?? coursesData.length;

      setAllCourses(Array.isArray(coursesData) ? coursesData : []);
      setCoursesTotalCount(total);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load courses';
      showToast('error', msg);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setUploadFile(file);
    } else {
      showToast('error', 'Please select a CSV or Excel file');
      e.target.value = null;
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      showToast('error', 'Please select a file first');
      return;
    }

    try {
      setUploadLoading(true);

      if (uploadType === "university") {
        const response = await universityAPI.uploadUniversitiesCSV(uploadFile);
        showToast('success', `Successfully uploaded ${response.count || 'multiple'} universities`);
      } else {
        const response = await courseAPI.uploadCoursesExcel(uploadFile);
        showToast('success', `Successfully uploaded ${response.count || 'multiple'} courses`);
      }

      setShowUploadModal(false);
      setUploadFile(null);
      fetchUniversities();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to upload file';
      showToast('error', msg);
    } finally {
      setUploadLoading(false);
    }
  };


  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white text-sm font-medium transition-all
    ${toast.type === 'success' ? 'bg-primary' : 'bg-destructive'}`}>
            {toast.type === 'success'
              ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              : <XCircleIcon className="h-5 w-5 flex-shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white">✕</button>
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Partner Institute Management
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Manage university partnerships and course details
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setUploadType("university");
              setShowUploadModal(true);
            }}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-border rounded-md shadow-sm text-xs md:text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all w-fit">
            <ArrowUpTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Upload Universities
          </button>
          <button
            onClick={handleCreateUniversity}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent rounded-md shadow-md text-xs md:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all w-fit">
            <PlusIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Add a single University
          </button>
          <button
            onClick={() => {
              setUploadType("course");
              setShowUploadModal(true);
            }}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-border rounded-md shadow-sm text-xs md:text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all w-fit">
            <ArrowUpTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Upload Courses
          </button>
          <button
            onClick={() => handleViewAllCourses(0)}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-transparent rounded-md shadow-md text-xs md:text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all w-fit">
            <BookOpenIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            View All Courses
          </button>

          <button
            type="button"
            onClick={() => {
              const headers = ["name", "code", "country", "country_code", "city", "website_url", "institution_type", "languages_of_instruction", "description", "status", "verification_status", "is_featured", "scholarships_available", "is_active", "client_id", "created_by", "updated_by"];
              const example = ["Demo University", "DEMO", "Germany", "DE", "Berlin", "https://example.com", "PUBLIC", "English", "A sample university", "ACTIVE", "VERIFIED", "false", "false", "true", "uniflow", "admin", "admin"];
              const csv = [headers.join(","), example.join(",")].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "universities_template.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-primary/30 rounded-md shadow-sm text-xs md:text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-all w-fit">
            <ArrowDownTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Universities Template
          </button>

          <button
            type="button"
            onClick={() => {
              const headers = ["university_code", "name", "course_code", "official_name", "degree_level", "degree_type", "field_of_study", "study_mode", "duration_years", "languages_of_instruction", "english_proficiency", "german_proficiency", "description", "application_deadline", "intake_seasons", "tuition_international", "tuition_domestic", "currency", "is_online", "has_internship", "is_active", "status", "is_featured", "learning_outcomes", "partner_universities", "exchange_programs", "detail_url", "created_by", "updated_by"];
              const example = ["DEMO", "Demo Course", "1001", "Applied AI", "BACHELORS", "Bachelor of Science", "Computer Science", "FULL_TIME", "3.5", "English", "B2", "A2", "Course description", "15 April - 15 July", "Winter", "0", "0", "EUR", "false", "true", "true", "ACTIVE", "false", "Learning outcomes", "", "", "https://example.com", "admin", "admin"];
              const csv = [headers.join(","), example.join(",")].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "courses_template.csv"; a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-secondary-dark/40 rounded-md shadow-sm text-xs md:text-sm font-medium text-foreground bg-secondary/30 hover:bg-secondary/50 transition-all w-fit">
            <ArrowDownTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Courses Template
          </button>
        </div>
      </div>

      {/* Stats Cards - UNI360 styled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {[
          {
            title: "Total Universities",
            value: stats.total,
            icon: BuildingOffice2Icon,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            accent: "border-l-4 border-primary",
          },
          {
            title: "Active Partners",
            value: stats.active,
            icon: AcademicCapIcon,
            iconBg: "bg-primary-light/20",
            iconColor: "text-primary-dark",
            accent: "border-l-4 border-primary-light",
          },
          ...Object.entries(stats.countries).slice(0, 2).map(([country, count], idx) => ({
            title: `${COUNTRY_NAMES[country?.toUpperCase()] || country} Universities`,
            value: count,
            icon: GlobeAltIcon,
            iconBg: idx === 0 ? "bg-secondary/40" : "bg-secondary-light/60",
            iconColor: "text-foreground",
            accent: idx === 0 ? "border-l-4 border-secondary-dark" : "border-l-4 border-secondary",
          }))
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card overflow-hidden rounded-lg ${stat.accent} transition-all hover:-translate-y-1`}
            style={{ boxShadow: 'var(--uni-shadow-card)' }}>
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.iconBg} rounded-lg p-2`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-base sm:text-lg font-bold text-foreground">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 md:p-6 border border-border" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Search
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Search universities..."
                value={filters.search}
                onChange={handleSearch}
                className="block w-full text-xs sm:text-sm border-2 border-border rounded-md pl-8 sm:pl-10 py-2 bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all"
              />
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange("country", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All Countries</option>
              {availableFilters.countries.map(item => (
                <option key={item.value} value={item.value}>
                  {getCountryLabel(item.value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Ranking
            </label>
            <select
              value={filters.ranking}
              onChange={(e) => handleFilterChange("ranking", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All Rankings</option>
              {availableFilters.rankings.map(item => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All Types</option>
              {availableFilters.types.map(item => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Institution Type
            </label>
            <select
              value={filters.institutionType}
              onChange={(e) => handleFilterChange("institutionType", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All Institution Types</option>
              {availableFilters.institutionTypes.map(item => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Tuition
            </label>
            <select
              value={filters.tuition}
              onChange={(e) => handleFilterChange("tuition", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All Tuition Ranges</option>
              {availableFilters.tuitionRanges.map(item => (
                <option key={item.value} value={item.value}>
                  {item.value} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Scholarships
            </label>
            <select
              value={filters.scholarshipsAvailable}
              onChange={(e) => handleFilterChange("scholarshipsAvailable", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All</option>
              {availableFilters.scholarships.map(item => (
                <option key={item.value} value={String(item.value)}>
                  {item.value ? 'Available' : 'Not Available'} ({item.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-foreground">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-2 border-border rounded-md bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setApiPage(0);
                setFilters({
                  search: "",
                  country: "",
                  status: "",
                  ranking: "",
                  type: "",
                  institutionType: "",
                  tuition: "",
                  scholarshipsAvailable: "",
                });
              }}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-border rounded-md shadow-sm text-xs sm:text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring w-full sm:w-auto transition-all">
              <FunnelIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Universities Grid */}
      <div className="bg-card rounded-lg border border-border" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading universities...</p>
            </div>
          ) : universities.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOffice2Icon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No universities found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universities.map((university) => (
                <motion.div
                  key={university.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative overflow-hidden border-2 border-gray-200 shadow-md hover:border-[#E08D3C]/60 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] flex flex-col"
                  style={{ background: "linear-gradient(160deg, #ffffff 0%, #f0f7fd 50%, #fef6ee 100%)" }}>

                  {/* Hero Image with name overlay */}
                  <div className="relative h-36 overflow-hidden flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"
                      alt="University campus"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C3539] via-[#2C3539]/60 to-transparent" />

                    {/* Status badge top-left */}
                    <div className="absolute top-3 left-3 z-10">
                      {university.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/90 text-white text-[10px] font-semibold backdrop-blur-sm">
                          <CheckCircleIcon className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[10px] font-semibold backdrop-blur-sm">
                          <XCircleIcon className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Name & location overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <div className="flex items-end gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-white shadow-lg ring-2 ring-white/30 p-0.5 flex-shrink-0">
                          {university.logo ? (
                            <img src={university.logo} alt={university.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#E08D3C] to-[#c47a2e] rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-0.5">
                          <h3 className="font-bold text-sm text-white line-clamp-1 leading-tight drop-shadow-md">
                            {university.name}
                          </h3>
                          <p className="text-[11px] text-white/85 flex items-center gap-1 mt-0.5">
                            <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{university.location}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pt-4 pb-4 flex flex-col flex-1">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-xl px-3 py-2 border border-[#E08D3C]/10">
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-medium mb-0.5">Programs</div>
                        <div className="text-base font-bold text-[#2C3539]">{university.programs}</div>
                      </div>
                      <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-2 border border-[#C4DFF0]/40">
                        <div className="text-[9px] text-gray-600 uppercase tracking-wide font-medium mb-0.5">Students</div>
                        <div className="text-xs font-bold text-[#2C3539]">
                          {university.totalStudents >= 1000
                            ? `${(university.totalStudents / 1000).toFixed(1)}K`
                            : university.totalStudents}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-xl px-3 py-2 border border-[#E08D3C]/10">
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-medium mb-0.5">Tuition</div>
                        <div className="text-xs font-bold text-[#2C3539]">
                          {university.currency} {university.tuitionFee.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#C4DFF0]/30 to-[#C4DFF0]/50 rounded-xl px-3 py-2 border border-[#C4DFF0]/40">
                        <div className="text-[9px] text-gray-600 uppercase tracking-wide font-medium mb-0.5">Commission</div>
                        <div className="text-xs font-bold text-[#2C3539]">{university.commissionRate}%</div>
                      </div>
                    </div>

                    {/* Ranking */}
                    {university.ranking && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <StarIcon className="h-3.5 w-3.5 text-[#E08D3C]" />
                        <span className="text-xs font-semibold text-[#2C3539]">Rank #{university.ranking}</span>
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-3 border-t border-blue-100/50 mt-auto">
                      <button
                        onClick={() => handleViewUniversity(university.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#C4DFF0] to-[#a8d4ec] hover:from-[#E08D3C] hover:to-[#c77a32] text-[#2C3539] hover:text-white transition-all duration-300">
                        <EyeIcon className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditUniversity(university.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-[#2C3539] hover:bg-[#E08D3C] text-white transition-all duration-300">
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewCourses(university)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-[#2C3539] hover:bg-[#E08D3C] text-white transition-all duration-300">
                        <BookOpenIcon className="h-3.5 w-3.5" />
                        Courses
                      </button>
                      <button
                        onClick={() => handleDeleteUniversity(university.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-500 text-red-600 hover:text-white transition-all duration-300">
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card px-4 py-3 rounded-lg border border-border" style={{ boxShadow: 'var(--uni-shadow-card)' }}>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{apiPage + 1}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
            {' · '}
            <span className="font-semibold text-foreground">{totalCount}</span> total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setApiPage(0)}
              disabled={apiPage === 0 || loading}
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              «
            </button>
            <button
              onClick={() => setApiPage(p => Math.max(0, p - 1))}
              disabled={apiPage === 0 || loading}
              className="px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(i => Math.abs(i - apiPage) <= 2)
              .map(i => (
                <button
                  key={i}
                  onClick={() => setApiPage(i)}
                  disabled={loading}
                  className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors disabled:cursor-not-allowed ${i === apiPage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-foreground bg-card border-border hover:bg-muted'
                    }`}>
                  {i + 1}
                </button>
              ))}
            <button
              onClick={() => setApiPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={apiPage >= totalPages - 1 || loading}
              className="px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next ›
            </button>
            <button
              onClick={() => setApiPage(totalPages - 1)}
              disabled={apiPage >= totalPages - 1 || loading}
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              »
            </button>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowUploadModal(false)}></div>

            <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border">
              <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-lg leading-6 font-medium text-foreground">
                    Upload {uploadType === "university" ? "Universities" : "Courses"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a CSV or Excel file containing {uploadType} data to upload
                  </p>
                </div>

                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs font-semibold text-primary-dark mb-2">
                    Not sure about the format? Download a template first:
                  </p>
                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() => {
                        const headers = ["name", "code", "country", "country_code", "city", "website_url", "institution_type", "languages_of_instruction", "description", "status", "verification_status", "is_featured", "scholarships_available", "is_active", "client_id", "created_by", "updated_by"];
                        const example = ["Demo University", "DEMO", "Germany", "DE", "Berlin", "https://example.com", "PUBLIC", "English", "A sample university", "ACTIVE", "VERIFIED", "false", "false", "true", "uniflow", "admin", "admin"];
                        const csv = [headers.join(","), example.join(",")].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "universities_template.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Universities Template (.csv)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const headers = ["university_code", "name", "course_code", "official_name", "degree_level", "degree_type", "field_of_study", "study_mode", "duration_years", "languages_of_instruction", "english_proficiency", "german_proficiency", "description", "application_deadline", "intake_seasons", "tuition_international", "tuition_domestic", "currency", "is_online", "has_internship", "is_active", "status", "is_featured", "learning_outcomes", "partner_universities", "exchange_programs", "detail_url", "created_by", "updated_by"];
                        const example = ["DEMO", "Demo Course", "1001", "Applied AI", "BACHELORS", "Bachelor of Science", "Computer Science", "FULL_TIME", "3.5", "English", "B2", "A2", "Course description", "15 April - 15 July", "Winter", "0", "0", "EUR", "false", "true", "true", "ACTIVE", "false", "Learning outcomes", "", "", "https://example.com", "admin", "admin"];
                        const csv = [headers.join(","), example.join(",")].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "courses_template.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-md shadow-sm transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Courses Template (.csv)
                    </button>

                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                  />
                  {uploadFile && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Selected: <span className="text-foreground font-medium">{uploadFile.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!uploadFile || uploadLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-md px-4 py-2 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {uploadLoading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-card text-base font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* University Courses Modal */}
      {showCoursesModal && (
        <CoursesModal
          courses={universityCourses}
          loading={coursesLoading}
          onClose={() => setShowCoursesModal(false)}
          title="University Courses"
        />
      )}

      {/* All Courses Modal */}
      {showAllCoursesModal && (
        <CoursesModal
          courses={allCourses}
          loading={coursesLoading}
          onClose={() => setShowAllCoursesModal(false)}
          title="All Courses"
          offset={coursesOffset}
          limit={20}
          totalCount={coursesTotalCount}
          onPageChange={(newOffset) => handleViewAllCourses(newOffset)}
          onSearch={(searchTerm, newOffset) => handleViewAllCourses(newOffset, searchTerm)}
        />
      )}

      {/* University Modal */}
      {showUniversityModal && (
        <UniversityModal
          university={selectedUniversity}
          mode={modalMode}
          onClose={() => setShowUniversityModal(false)}
          onSave={handleSaveUniversity}
          availableFilters={availableFilters}
          onViewCourses={() => {
            setShowUniversityModal(false);
            handleViewCourses(selectedUniversity);
          }}
        />
      )}
    </div>
  );
};

// Courses Modal Component
const CoursesModal = ({ courses, loading, onClose, title, offset = 0, limit = 20, totalCount = 0, onPageChange, onSearch = null }) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < totalCount;
  const [searchInput, setSearchInput] = React.useState('');
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}></div>

        <div className="inline-block align-bottom bg-card rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full border border-border">
          <div className="bg-card px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-foreground">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Search Bar */}
            {onSearch && <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSearch(searchInput.trim(), 0);
                  }}
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-4 py-2 text-sm border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                />
              </div>
              <button
                onClick={() => onSearch(searchInput.trim(), 0)}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                Search
              </button>
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); onSearch('', 0); }}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  Clear
                </button>
              )}
            </div>}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No courses found</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
                {courses.map((course, index) => (
                  <div
                    key={course.id || `course-${index}`}
                    className="p-5 border border-gray-300 bg-gradient-to-br from-white via-white to-[#E08D3C]/5 rounded-xl transition-all duration-300 shadow-md hover:shadow-[0_8px_30px_-4px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/60 hover:-translate-y-1 group flex flex-col h-full">
                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-bold text-lg text-[#2C3539] line-clamp-2 flex-1 leading-tight group-hover:text-[#E08D3C] transition-colors">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shadow-sm ${
                              String(course.degreeLevel || course.degreeType || '').toLowerCase().includes("phd") || String(course.degreeLevel || course.degreeType || '').toLowerCase().includes("doctor")
                                ? "bg-purple-100/80 text-purple-800"
                                : String(course.degreeLevel || course.degreeType || '').toLowerCase().includes("master")
                                ? "bg-[#C4DFF0]/60 text-[#2C3539]"
                                : "bg-emerald-100/80 text-emerald-800"
                            }`}>
                            {(course.degreeLevel || course.degreeType || 'Degree').charAt(0).toUpperCase() + (course.degreeLevel || course.degreeType || 'degree').slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="inline-flex items-center text-xs bg-[#C4DFF0]/20 border border-[#C4DFF0]/40 text-[#2C3539] px-2 py-0.5 rounded-md font-medium">
                          <BookOpenIcon className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          {course.fieldOfStudy || 'General'}
                        </span>
                        <span className="inline-flex items-center text-xs bg-indigo-50/50 border border-indigo-100/50 text-[#2C3539] px-2 py-0.5 rounded-md font-medium">
                          <GlobeAltIcon className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          English
                        </span>
                        <span className="inline-flex items-center text-xs bg-emerald-50/50 border border-emerald-100/50 text-[#2C3539] px-2 py-0.5 rounded-md font-medium">
                          <AcademicCapIcon className="w-3 h-3 mr-1.5 text-[#E08D3C]" />
                          {course.studyMode || 'Full-time'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100/80">
                        <div className="bg-gradient-to-br from-[#E08D3C]/5 to-[#E08D3C]/10 rounded-lg p-2 border border-[#E08D3C]/10">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Tuition Fee</span>
                          <p className="font-bold text-[#2C3539] leading-tight">
                            {course.currency || 'USD'} {course.tuitionInternational?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Duration</span>
                          <p className="font-semibold text-[#2C3539] leading-tight">
                            {course.durationYears ? `${course.durationYears} years` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100/50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">University</span>
                          <p className="font-semibold text-[#2C3539] leading-tight truncate" title={course.universityName}>{course.universityName}</p>
                        </div>
                        <div className="bg-purple-50/50 rounded-lg p-2 border border-purple-100/50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium block mb-0.5">Scholarships</span>
                          <p className="font-semibold text-[#2C3539] leading-tight">{course.scholarshipsAvailable ? 'Available' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            {totalCount > limit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(offset - limit)}
                  disabled={!hasPrev || loading}
                  className="px-3 py-1 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                <span className="text-sm text-muted-foreground">
                  Page <span className="text-foreground font-medium">{currentPage}</span> of <span className="text-foreground font-medium">{totalPages}</span>
                  <span className="ml-2 text-muted-foreground">({totalCount} total)</span>
                </span>
                <button
                  onClick={() => onPageChange(offset + limit)}
                  disabled={!hasNext || loading}
                  className="px-3 py-1 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-card text-base font-medium text-foreground hover:bg-muted sm:text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// University Modal Component
const UniversityModal = ({ university, mode, onClose, onSave, availableFilters, onViewCourses }) => {
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    location: "",
    type: "",
    institutionType: "",
    tuitionFee: 0,
    commissionRate: 0,
    status: "active",
    ranking: 0,
    nationalRanking: 0,
    qsRanking: 0,
    student_population: 0,
    tuition_fee_international: 0,
    description: "",
    website: "",
    currency: "USD",
    scholarships_available: false,
    language_of_instruction: "English",
    programs_offered: [],
    facilities: [],
    shortName: university?.shortName || "",
    code: university?.code || "",
    state: university?.state || "",
    address: university?.address || "",
    email: university?.email || "",
    phone: university?.phone || "",
    foundedYear: university?.establishedYear || "",
    facultyCount: university?.facultyCount || "",
    applicationFee: university?.applicationFee || "",
    minIelts: university?.minIelts || "",
    minToefl: university?.minToefl || "",
    financialAidAvailable: university?.financialAidAvailable || false,
    accommodationAvailable: university?.accommodationAvailable || false,
    internationalOffice: university?.internationalOffice || false,
    careerServices: university?.careerServices || false,
    libraryServices: university?.libraryServices || false,
    healthServices: university?.healthServices || false,
    sportsFacilities: university?.sportsFacilities || false,
  });

  useEffect(() => {
    if (university) {
      setFormData({
        name: university.name || "",
        country: university.country || "",
        location: university.location || "",
        type: university.type || "",
        institutionType: university.institutionType || "",
        tuitionFee: university.tuitionFee || 0,
        commissionRate: university.commissionRate || 0,
        status: university.status || "active",
        ranking: university.ranking || 0,
        nationalRanking: university.nationalRanking || 0,
        qsRanking: university.qsRanking || 0,
        student_population: university.student_population || 0,
        tuition_fee_international: university.tuition_fee_international || 0,
        description: university.description || "",
        website: university.website || "",
        currency: university.currency || "",
        scholarshipsAvailable: university.scholarshipsAvailable || false,
      });
    }
  }, [university]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isReadOnly = mode === "view";

  if (mode === "view" && university) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        
        <div
          className="relative w-full max-w-3xl shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "#f4f7f9" }}
        >
          {/* Hero Image Section */}
          <div className="relative h-56 sm:h-64 flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80"
              alt="University campus"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b]/90 via-[#1e293b]/40 to-transparent" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Title and Location */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-md">
                {university.name}
              </h2>
              <div className="flex items-center gap-2 text-white/90">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-sm font-medium">
                  <MapPinIcon className="h-4 w-4 text-[#E08D3C]" />
                  <span>{university.location}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column */}
              <div className="space-y-4">
                {/* Courses and Levels Row */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                      <BookOpenIcon className="h-4 w-4 text-[#E08D3C]" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">Courses</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{university.programs || university.courses?.length || 3}</div>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">Levels</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-2">
                      {university.levels?.length ? `${university.levels.length} types` : "2 types"}
                    </div>
                  </div>
                </div>

                {/* About University Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpenIcon className="h-5 w-5 text-[#E08D3C]" />
                    <h3 className="font-semibold text-gray-900 text-sm">About University</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    {university.description || `Experience world-class education at ${university.name}, located in the beautiful city of ${university.city || university.location}.`}
                  </p>
                  {university.website && (
                    <a href={university.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      <GlobeAltIcon className="h-4 w-4" /> Visit Official Website
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Campus Facilities Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <StarIcon className="h-5 w-5 text-[#E08D3C]" />
                    <h3 className="font-semibold text-gray-900 text-sm">Campus Facilities</h3>
                  </div>
                  {university.facilities && university.facilities.length > 0 ? (
                    <ul className="text-sm text-gray-500 list-disc list-inside">
                      {university.facilities.map((fac, idx) => (
                        <li key={idx}>{fac}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No special facilities listed.</p>
                  )}
                </div>

                {/* Popular Subjects Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AcademicCapIcon className="h-5 w-5 text-[#E08D3C]" />
                    <h3 className="font-semibold text-gray-900 text-sm">Popular Subjects</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {university.popularSubjects && university.popularSubjects.length > 0 ? (
                      university.popularSubjects.map((subject, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-xs rounded-full font-medium">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-xs rounded-full font-medium">Betriebswirtschaftslehre</span>
                        <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-xs rounded-full font-medium">theoretische Chemie</span>
                        <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-xs rounded-full font-medium">Chemie</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-gray-100 mt-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onViewCourses) {
                  onViewCourses();
                } else {
                  onClose();
                }
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2C3539] hover:bg-[#1a2022] rounded-lg transition-colors shadow-sm"
            >
              View Courses
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-card rounded-2xl shadow-2xl flex flex-col border border-border" style={{ maxHeight: '95vh' }}>

        {/* Header - Sidebar (Gunmetal) themed */}
        <div className="flex-shrink-0 px-6 py-4 rounded-t-2xl bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sidebar-foreground/15 flex items-center justify-center">
                <BuildingOffice2Icon className="h-5 w-5 text-sidebar-foreground" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {mode === "create" ? "Add New University" : mode === "edit" ? "Edit University" : "University Details"}
                </h3>
                {university && <p className="text-xs text-sidebar-foreground/70 mt-0.5">{university.name}</p>}
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-lg bg-sidebar-foreground/10 hover:bg-sidebar-foreground/20 flex items-center justify-center transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Basic Information */}
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />Basic Information<span className="h-px flex-1 bg-primary/20" />
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">University Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isReadOnly} required
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all">
                    <option value="">Select Country</option>
                    {availableFilters?.countries?.map(c => <option key={c.value} value={c.value}>{c.value === 'GB' ? 'UK' : c.value}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all">
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Institution Type</label>
                  <select value={formData.institutionType} onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all">
                    <option value="">Select Type</option>
                    {availableFilters?.institutionTypes?.map(item => <option key={item.value} value={item.value}>{item.value}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Rankings */}
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />Rankings<span className="h-px flex-1 bg-primary/20" />
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">World Ranking</label>
                  <input type="number" value={formData.ranking} onChange={(e) => setFormData({ ...formData, ranking: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">National Ranking</label>
                  <input type="number" value={formData.nationalRanking} onChange={(e) => setFormData({ ...formData, nationalRanking: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">QS Ranking</label>
                  <input type="number" value={formData.qsRanking} onChange={(e) => setFormData({ ...formData, qsRanking: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
              </div>
            </div>

            {/* Financial & Academic */}
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />Financial & Academic<span className="h-px flex-1 bg-primary/20" />
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
                  <input type="text" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    disabled={isReadOnly} placeholder="EUR, GBP, USD"
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tuition Fee</label>
                  <input type="number" value={formData.tuitionFee} onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Commission Rate (%)</label>
                  <input type="number" value={formData.commissionRate} onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Scholarships</label>
                  <select value={formData.scholarshipsAvailable} onChange={(e) => setFormData({ ...formData, scholarshipsAvailable: e.target.value === 'true' })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all">
                    <option value="false">Not Available</option>
                    <option value="true">Available</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Student Population</label>
                  <input type="number" value={formData.student_population} onChange={(e) => setFormData({ ...formData, student_population: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tuition Fee (International)</label>
                  <input type="number" value={formData.tuition_fee_international} onChange={(e) => setFormData({ ...formData, tuition_fee_international: Number(e.target.value) })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Website</label>
                  <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground transition-all" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-primary/20" />Description<span className="h-px flex-1 bg-primary/20" />
              </p>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isReadOnly} rows={2} placeholder="Enter university description..."
                className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none disabled:text-muted-foreground resize-none transition-all" />
            </div>

            {/* Additional Details (create only) */}
            {mode === "create" && (
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-primary/20" />Additional Details<span className="h-px flex-1 bg-primary/20" />
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Short Name</label>
                    <input type="text" value={formData.shortName} onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">University Code *</label>
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. OXU"
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">State / Province</label>
                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Founded Year</label>
                    <input type="number" value={formData.foundedYear} onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Faculty Count</label>
                    <input type="number" value={formData.facultyCount} onChange={(e) => setFormData({ ...formData, facultyCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Application Fee</label>
                    <input type="number" value={formData.applicationFee} onChange={(e) => setFormData({ ...formData, applicationFee: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Min IELTS</label>
                    <input type="number" step="0.5" value={formData.minIelts} onChange={(e) => setFormData({ ...formData, minIelts: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Min TOEFL</label>
                    <input type="number" value={formData.minToefl} onChange={(e) => setFormData({ ...formData, minToefl: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
                    <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all">
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Language of Instruction</label>
                    <input type="text" value={formData.language_of_instruction} onChange={(e) => setFormData({ ...formData, language_of_instruction: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Programs Offered (comma-separated)</label>
                    <input type="text" value={formData.programs_offered?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, programs_offered: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Bachelor, Master, Doctorate"
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Facilities (comma-separated)</label>
                    <input type="text" value={formData.facilities?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, facilities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Bodleian Library, Oxford Museum, Sports Complex"
                      className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-muted/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:border-ring outline-none transition-all" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="mt-4 p-3 bg-muted/50 rounded-xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Facilities & Services</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      ['scholarships_available', 'Scholarships Available'],
                      ['financialAidAvailable', 'Financial Aid'],
                      ['accommodationAvailable', 'Accommodation'],
                      ['internationalOffice', 'Intl. Office'],
                      ['careerServices', 'Career Services'],
                      ['libraryServices', 'Library'],
                      ['healthServices', 'Health Services'],
                      ['sportsFacilities', 'Sports Facilities'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                        <input type="checkbox" checked={formData[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="rounded border-border text-primary focus:ring-ring" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-card rounded-b-2xl">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              {isReadOnly ? "Close" : "Cancel"}
            </button>
            {!isReadOnly && (
              <button type="submit"
                className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg shadow-md hover:bg-primary/90 hover:shadow-lg transition-all">
                {mode === "create" ? "Add University" : "Save Changes"}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
export default UniversityManagement;
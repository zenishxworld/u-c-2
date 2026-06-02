import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CountrySelect } from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import { Check, ArrowRight, ArrowLeft, AlertCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import "../datepicker-theme.css";
import { 
  validateStep,
  getStudentProfile,
  getProfileProgress,
  resetProfileBuilder,
  getProfileBuilderConfig
} from "@/services/studentProfile";
import { STATIC_PROFILE_CONFIG } from "@/config/profileBuilderConfig";

// STATIC_PROFILE_CONFIG is imported from @/config/profileBuilderConfig.ts
// To add/remove/rename steps or fields, edit that file.


export default function ProfileBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState({});
  const [config, setConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState({});
  const [backendErrors, setBackendErrors] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [showLastStepPopup, setShowLastStepPopup] = useState(false);
  const [showMidReview, setShowMidReview] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Close year/month dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all configuration and data
  useEffect(() => {
    if (!user) return;
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 1500; // Minimum 1.5 seconds to ensure APIs complete
    
    try {
      setIsLoadingData(true);
      console.log('[ProfileBuilder] Starting to load profile data...');
      
      // 1. Fetch config from API
      const configResponse = await getProfileBuilderConfig();
      console.log('[ProfileBuilder] Config API response:', configResponse);
      
      let profileConfig;
      if (configResponse?.data?.configData) {
        profileConfig = configResponse.data.configData;
      } else {
        console.warn('[ProfileBuilder] Failed to load config from API, falling back to static config');
        profileConfig = STATIC_PROFILE_CONFIG;
      }
      
      const configSteps = profileConfig.steps || [];
      setConfig(profileConfig);
      console.log('[ProfileBuilder] Active Config Steps:', configSteps.map(s => s.step_id));
      
      // 2. Get progress data - contains completed steps and current step
      const progressData = await getProfileProgress();
      console.log('[ProfileBuilder] Progress data received:', progressData);
      
      if (!progressData?.data) {
        console.error('[ProfileBuilder] No progress data received');
        throw new Error('No progress data received');
      }

      const progressInfo = progressData.data;
      const completedStepIds = progressInfo.completedSteps || [];
      const currentStepId = progressInfo.currentStep;
      const progressPercentage = progressInfo.percentage || 0;
      
      console.log('[ProfileBuilder] Progress info:', {
        completedSteps: completedStepIds,
        currentStep: currentStepId,
        percentage: progressPercentage
      });
      
      // 3. Map config steps to UI steps with completion status
      const mappedSteps = configSteps.map((step, index) => {
        const isCompleted = completedStepIds.includes(step.step_id);
        
        return {
          id: index + 1,
          stepId: step.step_id,
          title: step.title,
          order: step.order,
          completed: isCompleted,
          required: step.required,
          estimatedTime: step.estimated_time_minutes,
          description: step.description
        };
      });
      
      console.log('[ProfileBuilder] Mapped steps:', mappedSteps);
      setSteps(mappedSteps);
      
      // 4. Set completed steps based on progress API
      const completedStepNumbers = mappedSteps
        .filter(step => completedStepIds.includes(step.stepId))
        .map(step => step.id);
      
      console.log('[ProfileBuilder] Completed step numbers:', completedStepNumbers);
      setCompletedSteps(completedStepNumbers);
      
      // 5. Set progress and completion status
      setProgress(progressPercentage);
      const profileCompleted = progressPercentage >= 100;
      setIsProfileComplete(profileCompleted);
      
      console.log('[ProfileBuilder] Profile completion status:', {
        progress: progressPercentage,
        isComplete: profileCompleted
      });
      
      // 6. Determine current step index
      if (currentStepId === 'completed' || profileCompleted) {
        console.log('[ProfileBuilder] Profile completed, showing review');
        setCurrentStepIndex(mappedSteps.length);
      } else if (currentStepId) {
        const currentStep = mappedSteps.find(s => s.stepId === currentStepId);
        if (currentStep) {
          console.log('[ProfileBuilder] Setting current step index to:', currentStep.id - 1);
          setCurrentStepIndex(currentStep.id - 1);
        } else {
          // Fallback: find first incomplete step
          const firstIncomplete = mappedSteps.find(s => !completedStepIds.includes(s.stepId));
          if (firstIncomplete) {
            setCurrentStepIndex(firstIncomplete.id - 1);
          }
        }
      } else {
        // Find first incomplete step
        const firstIncomplete = mappedSteps.find(s => !completedStepIds.includes(s.stepId));
        if (firstIncomplete) {
          setCurrentStepIndex(firstIncomplete.id - 1);
        } else if (profileCompleted) {
          setCurrentStepIndex(mappedSteps.length);
        }
      }
      
      // 7. Load existing profile data
      console.log('[ProfileBuilder] Loading existing profile data...');
      const profileData = await getStudentProfile();
      console.log('[ProfileBuilder] Profile data received:', profileData);
      
      if (profileData?.data) {
        const existingData = profileData.data;
        const formattedData = {};
        
        // Format data by step - flatten all step data into single object
        Object.keys(existingData).forEach(stepKey => {
          console.log(`[ProfileBuilder] Processing step key: ${stepKey}`);
          const stepData = existingData[stepKey];
          if (typeof stepData === 'object' && stepData !== null) {
            Object.keys(stepData).forEach(fieldKey => {
              console.log(`[ProfileBuilder] Setting field ${fieldKey}:`, stepData[fieldKey]);
              formattedData[fieldKey] = stepData[fieldKey];
            });
          }
        });
        
        console.log('[ProfileBuilder] Formatted form data:', formattedData);
        // Pre-fill from auth user for fields not yet in backend profile
        const userPrefill = {
          firstName:  user?.firstName  || user?.name?.split(' ')[0] || '',
          lastName:   user?.lastName   || user?.name?.split(' ').slice(1).join(' ') || '',
          full_name:  user?.name       || user?.fullName || '',
          email:      user?.email      || '',
          phone:      user?.phone      || user?.phoneNumber || '',
        };

        // User prefill only fills gaps — backend data takes priority
        setFormData({
          ...userPrefill,
          consent_date: new Date().toISOString().split('T')[0],
          ...formattedData,
        });
      }
      
      console.log('[ProfileBuilder] Profile data loading complete');
      
    } catch (error) {
      console.error('[ProfileBuilder] Error loading profile data:', error);
    } finally {
      // Ensure minimum loading time before hiding loader
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      setTimeout(() => {
        setIsLoadingData(false);
      }, remainingTime);
    }
  };

  // Step navigation function - allows navigation to completed steps or review page
  const goToStep = (stepIndex) => {
    const targetStep = steps[stepIndex];
    
    // Allow navigation to review page if profile is complete
    if (stepIndex >= steps.length && isProfileComplete) {
      setCurrentStepIndex(steps.length);
      setBackendErrors({});
      return;
    }
    
    if (!targetStep) return;
    
    // Allow navigation if:
    // 1. Profile is complete (can edit any step) OR
    // 2. Target step is completed OR
    // 3. Target step is the current active step
    if (isProfileComplete || completedSteps.includes(targetStep.id) || stepIndex === currentStepIndex) {
      setCurrentStepIndex(stepIndex);
      setShowMidReview(false);
      setBackendErrors({});
    }
  };

  const validateCurrentStep = () => {
    // Frontend validation can be added here if needed
    return true;
  };

  const validateWithBackend = async () => {
    const currentStep = steps[currentStepIndex];
    
    if (!currentStep) return false;
    
    setIsValidating(true);
    setBackendErrors({});
    
    try {
      // Get fields for current step from config
      const stepConfig = config?.steps?.find(s => s.step_id === currentStep.stepId);
      const stepData = {};
      
      if (stepConfig?.fields) {
        stepConfig.fields.forEach(field => {
          const value = formData[field.name];
          if (value !== undefined && value !== null && value !== '') {
            // Ensure array-type fields always send arrays to backend
            if ((field.type === 'array' || field.type === 'multiselect') && !Array.isArray(value)) {
              // Convert string value to array (split by comma)
              if (typeof value === 'string') {
                const items = value.split(',').map(v => v.trim()).filter(v => v);
                stepData[field.name] = items;
              } else {
                stepData[field.name] = [];
              }
            } else {
              stepData[field.name] = value;
            }
          } else if (field.default_value !== undefined) {
            stepData[field.name] = field.default_value === 'auto_today'
              ? new Date().toISOString().split('T')[0]
              : field.default_value;
          } else if (field.type === 'boolean' || field.type === 'checkbox') {
            stepData[field.name] = false;
          } else if (field.type === 'multiselect' || field.type === 'array') {
            stepData[field.name] = [];
          } else if (field.type === 'object') {
            stepData[field.name] = null;
          } else {
            stepData[field.name] = "";
          }
        });
      }
      
      console.log('[ProfileBuilder] Validating step:', currentStep.stepId, 'with data:', stepData);
      
      const response = await validateStep(currentStep.stepId, stepData);
      const validationData = response.data || response;
      
      if (validationData.valid === false) {
        const errors = validationData.validationErrors || {};
        setBackendErrors(errors);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[ProfileBuilder] Validation error:', error);
      setBackendErrors({ general: 'Failed to validate. Please try again.' });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear errors
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    if (backendErrors[fieldName]) {
      setBackendErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setBackendErrors({});

    const backendValid = await validateWithBackend();
    if (!backendValid) {
      return;
    }

    // ── Snapshot BEFORE the progress refresh so nav logic below is not affected ──
    const wasAlreadyComplete = isProfileComplete;

    // Refresh progress to update completed-step badges and progress bar
    try {
      const progressData = await getProfileProgress();
      const progressInfo = progressData.data;
      const completedStepIds = progressInfo.completedSteps || [];
      const progressPercentage = progressInfo.percentage || 0;

      const completedStepNumbers = steps
        .filter(step => completedStepIds.includes(step.stepId))
        .map(step => step.id);

      setCompletedSteps(completedStepNumbers);
      setProgress(progressPercentage);

      // Only jump to final review if profile JUST became complete (first-time completion
      // happens via the popup, not here — but guard anyway for safety)
      if (progressPercentage >= 100 && !wasAlreadyComplete) {
        setIsProfileComplete(true);
        setCurrentStepIndex(steps.length);
        return;
      }
      if (progressPercentage >= 100) {
        setIsProfileComplete(true); // keep flag in sync, but DON'T redirect
      }
    } catch (error) {
      console.error('[ProfileBuilder] Error refreshing progress:', error);
    }

    // ── Navigate ──────────────────────────────────────────────────────────────
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (wasAlreadyComplete) {
      // Re-editing a fully-complete profile: step-by-step forward, no popups
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // Last step done → back to final review
        setCurrentStepIndex(steps.length);
      }
    } else if (currentStepIndex < steps.length - 2) {
      // Normal forward navigation (not near the end)
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (currentStepIndex === steps.length - 2) {
      // Just completed the 2nd-to-last step → show mid-flow progress review
      setShowMidReview(true);
      setCurrentStepIndex(currentStepIndex + 1); // highlight last step in stepper
    } else {
      // On the actual last step inline (shouldn't normally reach here since the
      // last step is submitted via the popup, but handle defensively)
      setShowMidReview(false);
      setCurrentStepIndex(steps.length);
    }
  };

  // Called when the user clicks Next on the second-to-last step to open last step popup
  const openLastStepPopup = () => {
    setShowLastStepPopup(true);
  };

  const closeLastStepPopup = () => {
    setShowLastStepPopup(false);
  };

  // Submit the last step from inside the popup
  const submitLastStepFromPopup = async () => {
    if (!validateCurrentStep()) return;
    setBackendErrors({});
    const backendValid = await validateWithBackend();
    if (!backendValid) return;

    try {
      const progressData = await getProfileProgress();
      const progressInfo = progressData.data;
      const completedStepIds = progressInfo.completedSteps || [];
      const progressPercentage = progressInfo.percentage || 0;
      const completedStepNumbers = steps
        .filter(step => completedStepIds.includes(step.stepId))
        .map(step => step.id);
      setCompletedSteps(completedStepNumbers);
      setProgress(progressPercentage);
      if (progressPercentage >= 100) {
        setIsProfileComplete(true);
      }
    } catch (error) {
      console.error('[ProfileBuilder] Error refreshing progress after popup submit:', error);
    }

    setShowLastStepPopup(false);
    setShowMidReview(false);
    setCurrentStepIndex(steps.length); // Show final review page
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (showMidReview) {
      setShowMidReview(false);
      setCurrentStepIndex(steps.length - 2); // go back to career goals
      setBackendErrors({});
      return;
    }
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setBackendErrors({});
    }
  };

  
  // ── Calendar months list ──────────────────────────────────────────────────
  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  // ── Year options for dropdown (1990–2026) ──────────────────────────────────
  const YEAR_OPTIONS: number[] = [];
  for (let y = 2026; y >= 1990; y--) YEAR_OPTIONS.push(y);

  // ── Custom header: styled select for month + custom year dropdown ──────────
  const customDatePickerHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: {
    date: Date;
    changeYear: (year: number) => void;
    changeMonth: (month: number) => void;
    decreaseMonth: () => void;
    increaseMonth: () => void;
    prevMonthButtonDisabled: boolean;
    nextMonthButtonDisabled: boolean;
  }) => (
    <div className="dp-custom-header">
      <button
        type="button"
        className="dp-nav-btn"
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
      >
        ‹
      </button>
      {/* Custom month dropdown */}
      <div className="dp-month-dropdown-wrapper" ref={monthDropdownRef}>
        <button
          type="button"
          className="dp-month-trigger"
          onClick={(e) => { e.stopPropagation(); setMonthDropdownOpen(prev => !prev); setYearDropdownOpen(false); }}
        >
          {MONTHS[date.getMonth()]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E08D3C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {monthDropdownOpen && (
          <div className="dp-month-dropdown-list">
            {MONTHS.map((m, idx) => (
              <div
                key={m}
                className={`dp-month-option ${idx === date.getMonth() ? 'dp-month-option--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); changeMonth(idx); setMonthDropdownOpen(false); }}
              >
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom year dropdown */}
      <div className="dp-year-dropdown-wrapper" ref={yearDropdownRef}>
        <button
          type="button"
          className="dp-year-trigger"
          onClick={(e) => { e.stopPropagation(); setYearDropdownOpen(prev => !prev); setMonthDropdownOpen(false); }}
        >
          {date.getFullYear()}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E08D3C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {yearDropdownOpen && (
          <div className="dp-year-dropdown-list">
            {YEAR_OPTIONS.map((y) => (
              <div
                key={y}
                className={`dp-year-option ${y === date.getFullYear() ? 'dp-year-option--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); changeYear(y); setYearDropdownOpen(false); }}
              >
                {y}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="dp-nav-btn"
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
      >
        ›
      </button>
    </div>
  );

  // ── Phone field helpers ────────────────────────────────────────────────────
  const isPhoneField = (fieldName: string) =>
    fieldName === 'phone' || fieldName === 'emergency_contact_phone';

  const handlePhoneChange = (fieldName: string, rawValue: string) => {
    // Always keep +91 prefix
    let working = rawValue;
    // If user somehow deleted the prefix, restore it
    if (!working.startsWith('+91')) {
      // Strip all non-digits, then re-add prefix
      const digits = working.replace(/\D/g, '');
      working = '+91' + digits;
    }
    // Get digits after +91
    const afterPrefix = working.slice(3).replace(/\D/g, '').slice(0, 10);
    handleInputChange(fieldName, '+91' + afterPrefix);
  };

  // Get display value for phone: always shows +91 followed by digits
  const getPhoneDisplayValue = (val: string) => {
    if (!val) return '+91';
    const str = String(val);
    if (str.startsWith('+91')) return str.slice(0, 13); // +91 + max 10 digits
    // fallback: prepend +91
    const digits = str.replace(/\D/g, '').slice(0, 10);
    return '+91' + digits;
  };

  // Get raw digit count (after +91) for validation display
  const getPhoneDigitCount = (val: string) => {
    if (!val) return 0;
    const str = String(val);
    const afterPrefix = str.startsWith('+91') ? str.slice(3) : str.replace(/\D/g, '');
    return afterPrefix.length;
  };

  // ── Date manual-typing helper (auto-insert /) ─────────────────────────────
  const handleDateManualType = (fieldName: string, rawValue: string) => {
    // Strip everything except digits
    const digits = rawValue.replace(/\D/g, '').slice(0, 8);

    // Build formatted string with auto-slashes: DD/MM/YYYY
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }

    // If all 8 digits are present, try to parse as a valid date
    if (digits.length === 8) {
      const day = parseInt(digits.slice(0, 2), 10);
      const month = parseInt(digits.slice(2, 4), 10);
      const year = parseInt(digits.slice(4, 8), 10);
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime()) && parsed.getDate() === day && parsed.getMonth() === month - 1) {
        const yyyy = year.toString();
        const mm = month.toString().padStart(2, '0');
        const dd = day.toString().padStart(2, '0');
        handleInputChange(fieldName, `${yyyy}-${mm}-${dd}`);
        return;
      }
    }

    // Store the partial formatted value
    handleInputChange(fieldName, formatted);
  };

  const renderField = (field) => {
  // Handle default values
  let defaultValue = "";
  if (field.default_value === 'auto_today') {
    defaultValue = new Date().toISOString().split('T')[0]; // e.g. "2026-05-12"
  } else if (field.default_value !== undefined && field.default_value !== null) {
    defaultValue = field.default_value;
  } else if (field.type === 'boolean' || field.type === 'checkbox') {
    defaultValue = false;
  } else if (field.type === 'multiselect' || field.type === 'array') {
    defaultValue = [];
  }
  
  const value = formData[field.name] !== undefined ? formData[field.name] : defaultValue;
    const hasError = errors[field.name] || backendErrors[field.name];
    const errorMessage = backendErrors[field.name] || errors[field.name];

    // Common input classes
    const inputClasses = `w-full px-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
      hasError ? "border-red-500" : "border-border"
    }`;

    switch (field.type) {
      case 'text':
      case 'number': {
        // ── Phone field: +91 prefix baked into input + 10-digit limit ──
        if (isPhoneField(field.name)) {
          const displayVal = getPhoneDisplayValue(value);
          const digitCount = getPhoneDigitCount(value);
          const isValid = digitCount === 10;
          return (
            <div key={field.name}>
              <label className="flex items-center gap-2 text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
                {field.label}
                <div className="relative group cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-[#E08D3C]/10 text-[#E08D3C] flex items-center justify-center text-[10px] font-bold border border-[#E08D3C]/30 hover:bg-[#E08D3C]/20 transition-colors">
                    i
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-white border border-gray-200 shadow-xl rounded-lg text-xs font-normal text-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none">
                    <div className="font-semibold text-gray-900 mb-1">Phone Number Format:</div>
                    <div className="space-y-1.5">
                      <p>Enter your 10-digit mobile number. The country code (+91) is added automatically.</p>
                      <p className="text-gray-500 italic">Example: +91 9876543210</p>
                    </div>
                    {/* Triangle pointer */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200 -z-10 mt-[1px]"></div>
                  </div>
                </div>
              </label>
              {field.help_text && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
              )}
              <input
                type="tel"
                inputMode="numeric"
                placeholder="+91"
                value={displayVal}
                onChange={(e) => handlePhoneChange(field.name, e.target.value)}
                maxLength={13}
                className={inputClasses}
                onKeyDown={(e) => {
                  // Prevent deleting the +91 prefix
                  const target = e.target as HTMLInputElement;
                  if ((e.key === 'Backspace' || e.key === 'Delete') && target.selectionStart !== null && target.selectionStart <= 3) {
                    e.preventDefault();
                  }
                }}
                onSelect={(e) => {
                  // Prevent cursor from going into the +91 prefix
                  const target = e.target as HTMLInputElement;
                  if (target.selectionStart !== null && target.selectionStart < 3) {
                    target.setSelectionRange(3, 3);
                  }
                }}
              />
              {digitCount > 0 && !isValid && (
                <p className="text-amber-600 text-xs mt-1">Phone number must be exactly 10 digits ({digitCount}/10)</p>
              )}
              {errorMessage && (
                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
              )}
            </div>
          );
        }

        // ── Default text/number field ──
        return (
          <div key={field.name}>
            <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
            )}
            {field.name === 'current_country' ? (
              <div className="w-full relative country-select-wrapper">
                <style>{`
                  .country-select-wrapper .stdropdown-container {
                    border: none !important;
                    background: transparent !important;
                    border-radius: 0 !important;
                  }
                  .country-select-wrapper .stdropdown-input {
                    padding: 0 !important;
                    border: none !important;
                    min-height: auto !important;
                  }
                  .country-select-wrapper .stdropdown-input input {
                    padding: 0 !important;
                    border: none !important;
                    background: transparent !important;
                    outline: none !important;
                    font-size: inherit !important;
                    color: inherit !important;
                  }
                  .country-select-wrapper .stdropdown-menu {
                    border-radius: 1rem !important;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                    border: 1px solid #e5e7eb !important;
                    background-color: #ffffff !important;
                    animation: slideDownSmooth 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                    transform-origin: top center !important;
                    overflow: auto !important;
                    z-index: 99 !important;
                    margin-top: 8px !important;
                  }
                  @keyframes slideDownSmooth {
                    0% { opacity: 0; transform: translateY(-10px) scaleY(0.95); }
                    100% { opacity: 1; transform: translateY(0) scaleY(1); }
                  }
                  .country-select-wrapper .stdropdown-item {
                    padding: 12px 16px !important;
                    font-size: 14px !important;
                    transition: all 0.2s ease !important;
                    border-bottom: 1px solid #f9fafb !important;
                  }
                  .country-select-wrapper .stdropdown-item:hover {
                    background-color: #fcf6f0 !important;
                    color: #E08D3C !important;
                    padding-left: 20px !important;
                  }
                  .country-select-wrapper .stdropdown-item.selected {
                    background-color: #fef1e5 !important;
                    color: #E08D3C !important;
                    font-weight: 600 !important;
                  }
                `}</style>
                <div className={inputClasses}>
                  <CountrySelect
                    onChange={(e) => {
                      if (e && e.name) {
                        handleInputChange(field.name, e.name);
                      }
                    }}
                    placeHolder={field.placeholder || "Select Country"}
                    defaultValue={value ? { name: value, id: 0 } : null}
                  />
                </div>
              </div>
            ) : field.name === 'email_password' ? (
              <div className="relative">
                <input
                  type={(formData['_showEmailPwd'] ? 'text' : 'text')}
                  placeholder={field.placeholder}
                  value={value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={inputClasses + ' pr-10 font-mono tracking-widest'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  style={formData['_showEmailPwd'] ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleInputChange('_showEmailPwd', !formData['_showEmailPwd'])}
                >
                  {formData['_showEmailPwd'] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            ) : (
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className={inputClasses}
                min={field.validation?.min}
                max={field.validation?.max}
                autoComplete="off"
              />
            )}
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        );
      }

      case 'date': {
        // Only parse as a date if the value is a proper ISO string (YYYY-MM-DD)
        const isISODate = value && /^\d{4}-\d{2}-\d{2}$/.test(String(value));
        const parsedDate = isISODate ? new Date(value) : null;
        const validParsedDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
        // Show DD/MM/YYYY when we have a valid ISO date, otherwise show the raw typed value
        const dateDisplayValue = validParsedDate
          ? `${String(validParsedDate.getDate()).padStart(2, '0')}/${String(validParsedDate.getMonth() + 1).padStart(2, '0')}/${validParsedDate.getFullYear()}`
          : (value || '');
        return (
          <div key={field.name}>
            <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
            )}
            {/* Manual typing input */}
            <div className="flex gap-2 items-center mb-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/YYYY"
                  value={dateDisplayValue}
                  onChange={(e) => handleDateManualType(field.name, e.target.value)}
                  maxLength={10}
                  className={inputClasses + " pr-10"}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#E08D3C]"
                  onClick={(e) => {
                    e.stopPropagation();
                    (window as any)[`dp_${field.name}`]?.setOpen(true);
                  }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
              </div>
            </div>
            {/* Hidden DatePicker for calendar popup */}
            <div className="relative w-full" style={{ height: 0, overflow: 'visible' }}>
              <DatePicker
                ref={(r) => { (window as any)[`dp_${field.name}`] = r; }}
                selected={validParsedDate}
                onChange={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear().toString();
                    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
                    const dd = date.getDate().toString().padStart(2, '0');
                    handleInputChange(field.name, `${yyyy}-${mm}-${dd}`);
                  } else {
                    handleInputChange(field.name, '');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                renderCustomHeader={customDatePickerHeader}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
                wrapperClassName="w-full"
                placeholderText="DD/MM/YYYY"
                popperPlacement="bottom-start"
                portalId="root-portal"
              />
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        );
      }

      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
            )}
            <Select 
              value={value || undefined} 
              onValueChange={(val) => handleInputChange(field.name, val)}
            >
              <SelectTrigger className={`${inputClasses} h-auto`}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl z-[100] max-h-64 border-[#e5e7eb]">
                {field.options?.map((option: string) => (
                  <SelectItem 
                    key={option} 
                    value={option}
                    className="cursor-pointer py-2.5 pl-8 pr-4 text-sm font-medium focus:bg-[#fcf6f0] focus:text-[#E08D3C] data-[state=checked]:bg-[#fef1e5] data-[state=checked]:text-[#E08D3C] transition-colors"
                  >
                    {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : (value ? value.split(',').map(v => v.trim()) : []);
        return (
          <div key={field.name}>
            <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-sm text-muted-foreground mb-2 sm:mb-3">{field.help_text}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {field.options?.map((option) => (
                <label 
                  key={option}
                  className="flex items-center space-x-2 p-2 sm:p-3 border border-border rounded-lg hover:bg-card-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...selectedValues, option]
                        : selectedValues.filter(v => v !== option);
                      handleInputChange(field.name, updated);
                    }}
                    className="rounded border-border focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-xs sm:text-sm capitalize line-clamp-1">
                    {option.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name}>
            <label className="flex items-center gap-2 text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
              {['academic_goals', 'career_goals', 'motivation'].includes(field.name) && (
                <div className="relative group cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-[#E08D3C]/10 text-[#E08D3C] flex items-center justify-center text-[10px] font-bold border border-[#E08D3C]/30 hover:bg-[#E08D3C]/20 transition-colors">
                    i
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 sm:w-72 p-3 bg-white border border-gray-200 shadow-xl rounded-lg text-xs font-normal text-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none">
                    <div className="font-semibold text-gray-900 mb-1">What to write here:</div>
                    {field.name === 'academic_goals' && (
                      <div className="space-y-1.5">
                        <p>Outline your academic objectives, the specific subjects or skills you want to master, and what you hope to achieve academically during your studies.</p>
                        <p className="text-gray-500 italic">Example: "I aim to deepen my knowledge in Artificial Intelligence, specifically focusing on neural networks, to build a strong foundation for advanced research."</p>
                      </div>
                    )}
                    {field.name === 'career_goals' && (
                      <div className="space-y-1.5">
                        <p>Describe your long-term career aspirations, the roles or industries you are targeting, and how this program will help you achieve them.</p>
                        <p className="text-gray-500 italic">Example: "My long-term goal is to work as a Data Scientist in the healthcare sector, developing predictive models to improve patient care."</p>
                      </div>
                    )}
                    {field.name === 'motivation' && (
                      <div className="space-y-1.5">
                        <p>Explain your personal drive for studying abroad, why you chose your target country/program, and how international exposure aligns with your goals.</p>
                        <p className="text-gray-500 italic">Example: "Studying in Germany appeals to me due to its strong emphasis on engineering excellence, offering the diverse international exposure necessary for a global career."</p>
                      </div>
                    )}
                    
                    {/* Triangle pointer */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200 -z-10 mt-[1px]"></div>
                  </div>
                </div>
              )}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
            )}
            <textarea
              rows={4}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={inputClasses}
              minLength={field.validation?.min_length}
              maxLength={field.validation?.max_length}
            />
            {field.validation?.max_length && (
              <p className="text-xs text-muted-foreground mt-1">
                {value.length}/{field.validation.max_length} characters
              </p>
            )}
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        );

      case 'boolean':
      case 'checkbox':
  // Special rich layout for the full_consent field
  if (field.name === 'full_consent') {
    const consentPoints = [
      "Terms & Conditions",
      "Privacy Policy",
      "Data processing and retention for application purposes under GDPR",
      "That all information provided is accurate and I consent to background verification if required",
      "Sharing my data with universities and partner institutions for application purposes",
    ];
    return (
      <div key={field.name} className={`p-4 sm:p-5 border-2 rounded-xl ${value === true || value === 'true' ? 'border-primary bg-primary/5' : hasError ? 'border-red-400 bg-red-50/40 dark:bg-red-900/10' : 'border-border bg-card'}`}>
        <label htmlFor={field.name} className="flex items-start gap-3 cursor-pointer mb-3">
          <input
            type="checkbox"
            id={field.name}
            checked={value === true || value === 'true'}
            onChange={(e) => handleInputChange(field.name, e.target.checked)}
            className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-border focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-[12px] sm:text-sm font-medium leading-relaxed">
            I agree to all of the following:
          </span>
        </label>
        <ol className="space-y-2 pl-7 mb-2">
          {consentPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] sm:text-sm text-muted-foreground">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-muted text-foreground text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
              <span>{point}</span>
            </li>
          ))}
        </ol>
        {field.help_text && (
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 pl-7">{field.help_text}</p>
        )}
        {errorMessage && (
          <p className="text-red-500 text-sm mt-2 pl-7">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Default boolean (e.g. marketing_consent)
 return (
    <div key={field.name} className={`p-4 sm:p-5 border-2 rounded-xl ${value === true || value === 'true' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <label htmlFor={field.name} className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          id={field.name}
          checked={value === true || value === 'true'}
          onChange={(e) => handleInputChange(field.name, e.target.checked)}
          className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-border focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex flex-col gap-1">
          <span className="text-[13px] sm:text-sm font-medium leading-snug">{field.label}</span>
          {field.help_text && (
            <span className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{field.help_text}</span>
          )}
        </div>
      </label>
      {errorMessage && (
        <p className="text-red-500 text-sm mt-2 pl-7">{errorMessage}</p>
      )}
    </div>
  );

      case 'file':
        return (
          <div key={field.name}>
            <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
            )}
            <input
              type="file"
              onChange={(e) => handleInputChange(field.name, e.target.files[0])}
              className={inputClasses}
              accept={field.metadata?.accepted_formats?.map(f => `.${f}`).join(',')}
              multiple={field.metadata?.multiple}
            />
            {field.metadata?.max_size_mb && (
              <p className="text-xs text-muted-foreground mt-1">
                Max size: {field.metadata.max_size_mb}MB
              </p>
            )}
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </div>
        );

      case 'object': {
        const objectValue = value && typeof value === 'object' ? value : null;
        const isEnabled = objectValue !== null;
        const subFields = field.fields || [];

        const handleToggle = (checked: boolean) => {
          if (checked) {
            const newValue: Record<string, any> = {};
            subFields.forEach((f: any) => {
              if (f.type === 'boolean') newValue[f.name] = false;
              else newValue[f.name] = '';
            });
            handleInputChange(field.name, newValue);
          } else {
            handleInputChange(field.name, null);
          }
        };

        const handleSubFieldChange = (subFieldName: string, val: any) => {
          handleInputChange(field.name, {
            ...(objectValue || {}),
            [subFieldName]: val
          });
        };

        return (
          <div key={field.name} className={`border border-border rounded-xl mb-4 overflow-hidden ${isEnabled ? 'bg-card/50 shadow-sm' : 'bg-card'}`}>
            <div 
              className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${isEnabled ? 'bg-primary/5 border-b border-border/50' : 'hover:bg-card-hover'}`}
              onClick={() => handleToggle(!isEnabled)}
            >
              <div className="relative flex items-center justify-center flex-shrink-0 group">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggle(e.target.checked);
                  }}
                  className="absolute opacity-0 w-full h-full cursor-pointer z-10 m-0"
                />
                <div
                  className={`w-5 h-5 sm:w-5 sm:h-5 flex items-center justify-center rounded-md transition-all duration-200 border-2 ${
                    isEnabled
                      ? "bg-[#E08D3C] border-[#E08D3C] shadow-[0_2px_8px_rgba(224,141,60,0.3)]"
                      : "bg-white border-gray-300 group-hover:border-[#E08D3C]"
                  }`}
                >
                  {isEnabled && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[13px] sm:text-sm text-foreground">{field.label}</span>
                {field.help_text && (
                  <span className="text-[11px] sm:text-xs text-muted-foreground">{field.help_text}</span>
                )}
              </div>
            </div>

            {isEnabled && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subFields.map((subField: any) => {
                    const subVal = objectValue?.[subField.name] ?? '';
                    const subError = backendErrors[`${field.name}.${subField.name}`] || errors[`${field.name}.${subField.name}`] || (backendErrors[field.name] && typeof backendErrors[field.name] === 'object' ? backendErrors[field.name][subField.name] : null);
                    const subInputClasses = `w-full px-4 py-2.5 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-[13px] sm:text-sm ${subError ? "border-red-500" : "border-border"}`;

                    return (
                      <div key={subField.name}>
                        <label className="block text-xs sm:text-[13px] font-medium mb-1.5 text-muted-foreground">
                          {subField.label}
                        </label>
                        {subField.type === 'date' ? (
                          <div className="relative w-full">
                            <DatePicker
                              ref={(r) => { (window as any)[`dp_${field.name}_${subField.name}`] = r; }}
                              selected={subVal ? (isNaN(new Date(subVal).getTime()) ? null : new Date(subVal)) : null}
                              onChange={(date) => handleSubFieldChange(subField.name, date ? date.toISOString().split('T')[0] : '')}
                              dateFormat="dd-MM-yyyy"
                              className={subInputClasses + " pr-10"}
                              wrapperClassName="w-full"
                              placeholderText="DD-MM-YYYY"
                              renderCustomHeader={customDatePickerHeader}
                              popperPlacement="bottom-start"
                              portalId="root-portal"
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#E08D3C]"
                              onClick={(e) => {
                                e.stopPropagation();
                                (window as any)[`dp_${field.name}_${subField.name}`]?.setOpen(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </span>
                          </div>
                        ) : subField.type === 'select' ? (
                          <Select 
                            value={subVal || undefined} 
                            onValueChange={(val) => handleSubFieldChange(subField.name, val)}
                          >
                            <SelectTrigger className={`${subInputClasses} h-auto`}>
                              <SelectValue placeholder={`Select ${subField.label}`} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl z-[100] max-h-64 border-[#e5e7eb]">
                              {subField.options?.map((opt: string) => (
                                <SelectItem 
                                  key={opt} 
                                  value={opt}
                                  className="cursor-pointer py-2.5 pl-8 pr-4 text-sm font-medium focus:bg-[#fcf6f0] focus:text-[#E08D3C] data-[state=checked]:bg-[#fef1e5] data-[state=checked]:text-[#E08D3C] transition-colors"
                                >
                                  {opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <input
                            type={subField.type || 'text'}
                            placeholder={subField.placeholder}
                            value={subVal}
                            onChange={(e) => handleSubFieldChange(subField.name, e.target.value)}
                            className={subInputClasses}
                          />
                        )}
                        {subError && <p className="text-red-500 text-xs mt-1">{subError}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'array': {
        const arrayValue = Array.isArray(value) ? value : [];
        const itemFields = field.metadata?.item_fields || [];
        const minItems = field.metadata?.min_items || 0;
        const addButtonLabel = field.metadata?.add_button_label || `Add ${field.label}`;

        // If no item_fields defined, render a simple comma-separated textarea
        // The value is stored as an array of strings
        if (itemFields.length === 0) {
          const displayText = Array.isArray(value) ? value.join(', ') : (value || '');
          return (
            <div key={field.name}>
              <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
                {field.label}
              </label>
              {field.help_text && (
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">{field.help_text}</p>
              )}
              <textarea
                rows={3}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} (comma-separated)...`}
                value={displayText}
                onChange={(e) => {
                  const text = e.target.value;
                  // Store as array of strings, split by comma
                  if (text.trim() === '') {
                    handleInputChange(field.name, []);
                  } else {
                    const items = text.split(',').map(v => v.trim()).filter(v => v);
                    handleInputChange(field.name, items);
                  }
                }}
                className={inputClasses}
              />
              
              {errorMessage && (
                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
              )}
            </div>
          );
        }

        const handleArrayItemChange = (itemIndex: number, subFieldName: string, newValue: any) => {
          const updated = [...arrayValue];
          updated[itemIndex] = {
            ...updated[itemIndex],
            [subFieldName]: newValue,
          };
          handleInputChange(field.name, updated);
        };

        const addArrayItem = () => {
          const newItem: Record<string, any> = {};
          itemFields.forEach((f: any) => {
            if (f.type === 'boolean') newItem[f.name] = false;
            else if (f.type === 'multiselect' || f.type === 'array') newItem[f.name] = [];
            else newItem[f.name] = '';
          });
          handleInputChange(field.name, [...arrayValue, newItem]);
        };

        const removeArrayItem = (itemIndex: number) => {
          const updated = arrayValue.filter((_: any, i: number) => i !== itemIndex);
          handleInputChange(field.name, updated);
        };

        // Auto-add first empty entry if array is empty and minItems > 0
        if (arrayValue.length === 0 && minItems > 0) {
          setTimeout(() => {
            const newItem: Record<string, any> = {};
            itemFields.forEach((f: any) => {
              if (f.type === 'boolean') newItem[f.name] = false;
              else if (f.type === 'multiselect' || f.type === 'array') newItem[f.name] = [];
              else newItem[f.name] = '';
            });
            handleInputChange(field.name, [newItem]);
          }, 0);
        }

        return (
          <div key={field.name}>
            <label className="block text-[13px] sm:text-sm font-medium mb-1.5 sm:mb-2">
              {field.label}
            </label>
            {field.help_text && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">{field.help_text}</p>
            )}

            {/* Render each array entry */}
            <div className="space-y-5">
              {arrayValue.map((item: any, itemIndex: number) => (
                <div
                  key={itemIndex}
                  className="relative p-3 sm:p-5 border border-border rounded-xl bg-card/50 shadow-sm"
                >
                  {/* Entry header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-border/50">
                    <span className="text-[13px] sm:text-sm font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs flex items-center justify-center font-bold">
                        {itemIndex + 1}
                      </span>
                      {field.label} #{itemIndex + 1}
                    </span>
                    {arrayValue.length > minItems && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem(itemIndex)}
                        className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  {/* Entry sub-fields in a responsive grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {itemFields.map((subField: any) => {
                      const subValue = item?.[subField.name] ?? '';
                      const subInputClasses =
                        'w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-[13px] sm:text-sm';

                      switch (subField.type) {
                        case 'text':
                        case 'number':
                          return (
                            <div key={subField.name}>
                              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                {subField.label}
                              </label>
                              <input
                                type={subField.type}
                                placeholder={subField.placeholder}
                                value={subValue}
                                onChange={(e) =>
                                  handleArrayItemChange(itemIndex, subField.name, e.target.value)
                                }
                                className={subInputClasses}
                                min={subField.validation?.min}
                                max={subField.validation?.max}
                              />
                            </div>
                          );

                        case 'select':
                          return (
                            <div key={subField.name}>
                              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                {subField.label}
                              </label>
                              <Select 
                                value={subValue || undefined} 
                                onValueChange={(val) => handleArrayItemChange(itemIndex, subField.name, val)}
                              >
                                <SelectTrigger className={`${subInputClasses} h-auto`}>
                                  <SelectValue placeholder={`Select ${subField.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl z-[100] max-h-64 border-[#e5e7eb]">
                                  {subField.options?.map((option: string) => (
                                    <SelectItem 
                                      key={option} 
                                      value={option}
                                      className="cursor-pointer py-2.5 pl-8 pr-4 text-sm font-medium focus:bg-[#fcf6f0] focus:text-[#E08D3C] data-[state=checked]:bg-[#fef1e5] data-[state=checked]:text-[#E08D3C] transition-colors"
                                    >
                                      {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );

                        case 'date':
                          return (
                            <div key={subField.name}>
                              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                {subField.label}
                              </label>
                              <div className="relative w-full">
  <DatePicker
    ref={(r) => { (window as any)[`dp_${field.name}_${itemIndex}_${subField.name}`] = r; }}
    selected={subValue ? (isNaN(new Date(subValue).getTime()) ? null : new Date(subValue)) : null}
    onChange={(date) => {
      if (date) {
        const yyyy = date.getFullYear().toString();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        handleArrayItemChange(itemIndex, subField.name, `${yyyy}-${mm}-${dd}`);
      } else {
        handleArrayItemChange(itemIndex, subField.name, '');
      }
    }}
    dateFormat="dd-MM-yyyy"
    renderCustomHeader={customDatePickerHeader}
    className={subInputClasses + " pr-10"}
    wrapperClassName="w-full"
    placeholderText="DD-MM-YYYY"
    popperPlacement="bottom-start"
    portalId="root-portal"
  />
  <span
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#E08D3C]"
    onClick={(e) => {
      e.stopPropagation();
      (window as any)[`dp_${field.name}_${itemIndex}_${subField.name}`]?.setOpen(true);
    }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  </span>
</div>
                            </div>
                          );

                        case 'textarea':
                          return (
                            <div key={subField.name} className="md:col-span-2">
                              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                {subField.label}
                              </label>
                              <textarea
                                rows={3}
                                placeholder={subField.placeholder}
                                value={subValue}
                                onChange={(e) =>
                                  handleArrayItemChange(itemIndex, subField.name, e.target.value)
                                }
                                className={subInputClasses}
                              />
                            </div>
                          );

                        case 'boolean':
                          return (
                            <div key={subField.name} className="flex items-center gap-2 py-2">
                              <input
                                type="checkbox"
                                id={`${field.name}_${itemIndex}_${subField.name}`}
                                checked={subValue === true || subValue === 'true'}
                                onChange={(e) =>
                                  handleArrayItemChange(itemIndex, subField.name, e.target.checked)
                                }
                                className="rounded border-border focus:ring-2 focus:ring-primary/20"
                              />
                              <label
                                htmlFor={`${field.name}_${itemIndex}_${subField.name}`}
                                className="text-xs font-medium cursor-pointer"
                              >
                                {subField.label}
                              </label>
                            </div>
                          );

                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add entry button */}
            <button
              type="button"
              onClick={addArrayItem}
              className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3.5 border-2 border-dashed border-border rounded-xl text-[13px] sm:text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <span className="text-base sm:text-lg leading-none">+</span>
              {addButtonLabel}
            </button>

            {errorMessage && (
              <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const renderValidationBanner = () => {
    if (Object.keys(backendErrors).length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-2">Validation Errors</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {Object.entries(backendErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const confirmResetProfile = async () => {
    setIsResetting(true);
    try {
      await resetProfileBuilder();
      // Reload the page to start over from basic_info
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset profile:", error);
      alert("Failed to reset profile. Please try again.");
    } finally {
      setIsResetting(false);
      setShowResetConfirmModal(false);
    }
  };

  // Review Page Component
  const renderReviewPage = () => {
    // Determine if this is the "mid-flow" review (after career goals, before last step)
    // or the "final" review (after profile is complete)
    const isFinalReview = isProfileComplete;

    return (
      <motion.div 
        className="space-y-6" 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isFinalReview ? 'bg-success/10' : 'bg-primary/10'}`}>
            {isFinalReview
              ? <Check className="h-10 w-10 text-success" />
              : <Eye className="h-10 w-10 text-primary" />
            }
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {isFinalReview ? 'Profile Complete!' : 'Review Your Progress'}
          </h2>
          <p className="text-muted-foreground">
            {isFinalReview
              ? 'Your profile is complete. You can click any card to edit that section.'
              : 'Looking good so far! Review your details below, then continue to the final step.'}
          </p>
        </div>

        {/* Review cards — one per step */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepConfig = config?.steps?.find(s => s.step_id === step.stepId);
            const isStepCompleted = completedSteps.includes(step.id);
            const isLastStepInList = index === steps.length - 1;

            // Collect filled fields only
            const filledFields = stepConfig?.fields?.filter(field => {
              const value = formData[field.name];
              return value !== undefined && value !== null && value !== '' &&
                !(Array.isArray(value) && value.length === 0);
            }) ?? [];
            const totalFields = stepConfig?.fields?.length ?? 0;
            
            return (
              <motion.div 
                key={step.id}
                className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                  isStepCompleted
                    ? 'border-primary/20 bg-card hover:border-primary/40 cursor-pointer'
                    : 'border-border bg-card/60 opacity-60'
                }`}
                onClick={() => isStepCompleted && goToStep(index)}
                whileHover={isStepCompleted ? { y: -2 } : {}}
              >
                {/* Card header */}
                <div className={`flex items-center justify-between px-5 py-4 ${isStepCompleted ? 'bg-primary/5' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      isStepCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isStepCompleted ? <Check className="h-4 w-4" /> : <span>{step.id}</span>}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isStepCompleted ? `${filledFields.length} of ${totalFields} fields filled` : 'Not completed yet'}
                      </p>
                    </div>
                  </div>
                  {isStepCompleted && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Eye className="h-3.5 w-3.5" />
                      Edit
                    </div>
                  )}
                </div>

                {/* Card data grid */}
                {isStepCompleted && stepConfig?.fields && (
                  <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {stepConfig.fields.map(field => {
                      const value = formData[field.name];
                      let displayValue = null;
                      if (value !== undefined && value !== null && value !== '' &&
                          !(Array.isArray(value) && value.length === 0)) {
                        if (Array.isArray(value)) {
                          if (value.length > 0 && typeof value[0] === 'object') {
                            // Object arrays (e.g., education_entries) — show count
                            displayValue = `${value.length} ${value.length === 1 ? 'entry' : 'entries'}`;
                          } else {
                            displayValue = value.map(v => String(v).replace(/_/g, ' ')).join(', ');
                          }
                        } else if (typeof value === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else {
                          displayValue = String(value).substring(0, 40) + (String(value).length > 40 ? '…' : '');
                        }
                      }
                      return (
                        <div key={field.name} className="flex flex-col">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                            {field.label || field.name.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-sm mt-0.5 break-words line-clamp-2 ${displayValue ? 'text-foreground font-medium' : 'text-muted-foreground italic'}`}>
                            {displayValue ?? 'Not provided'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-center sm:justify-end">
          <button
            onClick={() => setShowResetConfirmModal(true)}
            disabled={isResetting}
            className={`px-4 py-2 text-sm font-medium text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 ${
              isResetting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isResetting ? "Resetting..." : "Reset Profile Data"}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderStepContent = () => {
    if (isLoadingData) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      );
    }

    // Show review page when profile is complete AND when index is beyond steps
    if (isProfileComplete && currentStepIndex >= steps.length) {
      return renderReviewPage();
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No step configuration found.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Step index: {currentStepIndex}, Total steps: {steps.length}
          </p>
        </div>
      );
    }

    // Show mid-flow review after career goals step (before last step popup)
    if (showMidReview && !isProfileComplete) {
      return renderReviewPage();
    }

    // Last step — skip the teaser; the popup is opened directly from Next button

    return (
      <motion.div 
        className="space-y-6" 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        exit={{ opacity: 0, x: -20 }}
        key={currentStep.stepId}
      >
        
        <DynamicStepFields 
          stepId={currentStep.stepId}
          config={config}
          renderField={renderField}
        />
      </motion.div>
    );
  };

  

  // Show loading screen while fetching profile data
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-2xl font-semibold text-foreground">Loading Your Profile...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
  <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 sm:pb-6">
        <motion.div 
          className="text-center mb-6 sm:mb-12" 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">Complete Your Profile</h1>
          <p className="text-sm sm:text-xl text-muted-foreground px-4 sm:px-0">
            Let's get to know you better to provide personalized recommendations
          </p>
        </motion.div>

        <motion.div 
          className="mb-6 sm:mb-12"
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-end justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {isProfileComplete ? 'Review Your Profile' : showMidReview ? 'Review' : `Step ${Math.min(currentStepIndex + 1, steps.length)} of ${steps.length}`}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Provide your details to unlock personalized AI generation.</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-black text-[#E08D3C] leading-none">
                {progress}%
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-400 mt-1 uppercase tracking-wider">Completed</span>
            </div>
          </div>

          <div className="relative w-full h-1.5 sm:h-2 bg-gray-200/50 dark:bg-gray-800 rounded-full mb-8 sm:mb-10">
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full bg-[#E08D3C]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Glowing handle at the leading edge */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-[0_0_12px_rgba(224,141,60,0.9)] border-2 border-[#E08D3C]" />
            </motion.div>
          </div>

          {/* Step indicators — compact dot tracker, always fits one row */}
          <div className="flex items-center w-full">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStepIndex === index || (showMidReview && index === steps.length - 1);
              const isClickable = isProfileComplete || isCompleted || currentStepIndex === index;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="flex items-center" style={{ flex: isLast ? '0 0 auto' : '1', minWidth: 0 }}>
                  {/* Dot + label stacked */}
                  <div
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    onClick={() => isClickable && goToStep(index)}
                  >
                    <motion.div
                      className={`flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isCurrent
                          ? 'w-7 h-7 sm:w-9 sm:h-9 bg-foreground border-foreground text-background shadow-md'
                          : isCompleted
                          ? 'w-6 h-6 sm:w-7 sm:h-7 bg-card border-primary/50 text-primary'
                          : 'w-6 h-6 sm:w-7 sm:h-7 bg-card border-border text-muted-foreground'
                      }`}
                      whileHover={isClickable ? { scale: 1.1 } : {}}
                      whileTap={isClickable ? { scale: 0.95 } : {}}
                    >
                      {isCompleted && !isCurrent ? (
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <span className={`font-semibold leading-none ${isCurrent ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
                          {step.id}
                        </span>
                      )}
                    </motion.div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-medium leading-snug text-center w-10 sm:w-14 line-clamp-1 sm:line-clamp-2 ${
                        isCurrent ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'
                      }`}
                      title={step.title}
                    >
                      {step.title}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 mx-1.5 h-px bg-border relative overflow-hidden" style={{ marginBottom: '18px' }}>
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-primary/40"
                        initial={{ width: '0%' }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
  className="bg-white/70 backdrop-blur-sm border-2 border-gray-200/80 shadow-md hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)] hover:border-[#E08D3C]/50 transition-all duration-500 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8"
  style={{ background: "linear-gradient(160deg, #fdfbf7 0%, #ffffff 60%, #fdf8ed 100%)" }}
  initial={{ opacity: 0, y: 20 }} 
  animate={{ opacity: 1, y: 0 }} 
  transition={{ duration: 0.3, delay: 0.2 }}
>
  <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
    {isProfileComplete && currentStepIndex >= steps.length
      ? 'Profile Complete — Review'
      : showMidReview
      ? 'Review Your Progress'
      : (steps[currentStepIndex]?.title || 'Loading...')}
  </h2>
  
  {/* Career Goals specific info badge */}
  {steps[currentStepIndex]?.stepId === 'goals' && (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-1">Document-Ready Career Vision</h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Your response here will be carefully used in official documents including Statement of Purpose (SOP), Letter of Recommendation (LOR), and academic applications. Write thoughtfully and authentically.
          </p>
        </div>
      </div>
    </div>
  )}
  
  <AnimatePresence mode="wait">
    {renderStepContent()}
  </AnimatePresence>
</motion.div>

        <motion.div 
  className="flex justify-between items-center gap-2 sm:gap-3 pb-4"
  initial={{ opacity: 0, y: 20 }} 
  animate={{ opacity: 1, y: 0 }} 
  transition={{ duration: 0.3, delay: 0.3 }}
>
  <button
    onClick={prevStep}
    disabled={currentStepIndex === 0}
    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-180 text-sm sm:text-base ${
      currentStepIndex === 0
        ? "bg-muted text-muted-foreground cursor-not-allowed"
        : "bg-card border border-border hover:bg-card-hover hover-lift press-effect"
    }`}>
    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
    <span className="hidden sm:inline">Previous</span>
  </button>

  {/* Editable Information Note */}
  <div className="hidden sm:flex items-center justify-center text-center">
    <p className="text-xs text-muted-foreground whitespace-nowrap">
      <span className="font-medium">All information is editable. You can modify any field even after saving</span>
    </p>
  </div>

  <button
    onClick={
      isProfileComplete && currentStepIndex >= steps.length
        ? () => navigate("/universities")
        : showMidReview
        ? openLastStepPopup
        : nextStep
    }
    disabled={isSaving || isValidating}
    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-180 text-sm sm:text-base ${
      isSaving || isValidating
        ? "bg-muted text-muted-foreground cursor-not-allowed"
        : "bg-primary text-primary-foreground hover-lift press-effect"
    }`}>
    <span className="hidden sm:inline">
      {isSaving
        ? "Saving..."
        : isValidating
        ? "Validating..."
        : (isProfileComplete && currentStepIndex >= steps.length)
        ? "Go to Universities"
        : showMidReview
        ? "Complete Profile"
        : "Next"}
    </span>
    <span className="sm:hidden">
      {isSaving || isValidating ? "..." : showMidReview ? "Complete" : "Next"}
    </span>
    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
  </button>
</motion.div>
      </div>

      {/* ── Last Step Popup Modal — only triggered from mid-review, never when already complete ── */}
      <AnimatePresence>
        {showLastStepPopup && !isProfileComplete && steps.length > 0 && (() => {
          const lastStep = steps[steps.length - 1];
          return (
            <motion.div
              key="last-step-popup-overlay"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeLastStepPopup}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              {/* Modal Panel — wide, capped at 90vh, flex-col so header+footer stay fixed */}
              <motion.div
                className="relative z-10 w-full max-w-3xl mx-4 bg-white/95 backdrop-blur-md dark:bg-gray-900/95 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col"
                style={{ maxHeight: '90vh' }}
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 24 }}
                transition={{ duration: 0.28, type: 'spring', stiffness: 320, damping: 28 }}
              >
                {/* ── Sticky Header ── */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-border flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary text-sm">{steps.length}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight">{lastStep.title}</h2>
                      {lastStep.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{lastStep.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closeLastStepPopup}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0 ml-4"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto px-7 py-6">

                  {/* Render fields in a 2-column grid to halve vertical space */}
                  <DynamicStepFields
                    stepId={lastStep.stepId}
                    config={config}
                    renderField={renderField}
                    twoColumn
                  />
                </div>

                {/* ── Sticky Footer ── */}
                <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-border flex-shrink-0">
                  <button
                    onClick={closeLastStepPopup}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-card border border-border hover:bg-card-hover transition-all text-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={submitLastStepFromPopup}
                    disabled={isSaving || isValidating}
                    className={`flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                      isSaving || isValidating
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover-lift press-effect'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {isSaving ? 'Saving…' : isValidating ? 'Validating…' : 'Complete Profile'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Reset Profile Confirmation Modal ── */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <motion.div
            key="reset-confirm-popup"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isResetting && setShowResetConfirmModal(false)}
            />
            <motion.div
              className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md dark:bg-gray-900/95 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Reset Profile Data</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Are you sure you want to reset your profile data? This action cannot be undone and will delete all your entered information.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setShowResetConfirmModal(false)}
                    disabled={isResetting}
                    className="flex-1 py-2.5 rounded-xl font-medium border border-border hover:bg-muted transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResetProfile}
                    disabled={isResetting}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition-colors text-sm text-white ${
                      isResetting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isResetting ? 'Resetting...' : 'Yes, Reset Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StepFields — reads fields from the static config passed as prop.
// No API calls are made here. To change what fields appear, edit
// STATIC_PROFILE_CONFIG at the top of this file.
// ─────────────────────────────────────────────────────────────────────────────
function DynamicStepFields({ stepId, config, renderField, twoColumn = false }: any) {
  // Fields come directly from the static config — no async loading needed.
  const stepConfig = config?.steps?.find((s: any) => s.step_id === stepId);
  const fields: any[] = stepConfig?.fields || [];

  if (fields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No fields configured for this step.</p>
        <p className="text-xs text-muted-foreground mt-2">Step ID: {stepId}</p>
      </div>
    );
  }

  return (
    <div className={twoColumn ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4 sm:space-y-6"}>
      {fields.map((field: any, index: number) => (
        <div key={field.name || index}>{renderField(field)}</div>
      ))}
    </div>
  );
}
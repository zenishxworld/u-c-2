/**
 * Master Key-Value Mapping for all field labels across the application
 * 
 * Structure:
 * - Keys should match the exact field names coming from backend (snake_case)
 * - Values are the human-readable labels to display
 * 
 * Usage:
 * import { getFieldLabel } from '@/utils/fieldMappings';
 * const label = getFieldLabel('phone_number'); // Returns "Phone Number"
 */

// ==================== PROFILE BUILDER FIELD MAPPINGS ====================

export const PROFILE_BUILDER_FIELDS = {
  // Basic Information
  phone: "Phone Number",
  date_of_birth: "Date of Birth",
  nationality: "Nationality",
  current_location: "Current Location",
  gender: "Gender",
  passport_number: "Passport Number",
  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_phone: "Emergency Contact Phone",

  // Education Background
  education_level: "Current Education Level",
  field_of_study: "Field of Study",
  institution_name: "Institution Name",
  graduation_year: "Graduation Year",
  gpa: "GPA / Percentage",
  grading_system: "Grading System",
  academic_honors: "Academic Honors & Awards",

  // Test Scores
  test_type: "Test Type",
  overall_score: "Overall Score",
  listening_score: "Listening Score",
  reading_score: "Reading Score",
  writing_score: "Writing Score",
  speaking_score: "Speaking Score",
  test_date: "Test Date",
  additional_tests: "Additional Test Scores",

  // Study Preferences
  preferred_countries: "Preferred Countries",
  preferred_study_level: "Preferred Study Level",
  preferred_programs: "Preferred Programs/Fields",
  intake_year: "Intake Year",
  intake_semester: "Intake Semester",
  university_ranking_preference: "University Ranking Preference",
  accommodation_preference: "Accommodation Preference",

  // Work Experience
  has_work_experience: "Do you have work experience?",
  total_experience_years: "Total Years of Experience",
  work_experiences: "Work Experience Details",
  internships: "Internships",
  volunteer_work: "Volunteer Work",
  extracurricular_activities: "Extracurricular Activities",
  company_name: "Company Name",
  job_title: "Job Title",
  start_date: "Start Date",
  end_date: "End Date",
  is_current: "Currently Working Here",
  description: "Job Description",

  // Financial Information
  budget_range: "Annual Budget Range (USD)",
  budget_currency: "Budget Currency",
  funding_source: "Funding Source",
  scholarship_interest: "Interested in Scholarships?",
  loan_interest: "Interested in Education Loans?",
  financial_sponsor_name: "Financial Sponsor Name",
  financial_documents_available: "Do you have financial documents ready?",

  // Documents
  passport_copy: "Passport Copy",
  academic_transcripts: "Academic Transcripts",
  degree_certificates: "Degree Certificates",
  test_score_reports: "Test Score Reports",
  cv_resume: "CV/Resume",
  statement_of_purpose: "Statement of Purpose (SOP)",
  letters_of_recommendation: "Letters of Recommendation",
  financial_documents: "Financial Documents",
  additional_documents: "Additional Documents",

  // Career Goals
  academic_goals: "Academic Goals",
  career_goals: "Career Goals",
  why_study_abroad: "Why Study Abroad?",
  preferred_career_path: "Preferred Career Path",
  post_study_plans: "Post-Study Plans",
  areas_of_interest: "Professional Areas of Interest",

  // Compliance & Consent
  terms_accepted: "I accept the Terms and Conditions",
  privacy_policy_accepted: "I accept the Privacy Policy",
  gdpr_consent: "GDPR Data Processing Consent",
  data_retention_consent: "Data Retention Consent",
  marketing_consent: "Marketing Communications Consent (Optional)",
  third_party_sharing_consent: "Third-Party Sharing Consent",
  data_accuracy_declaration: "Data Accuracy Declaration",
  background_check_consent: "Background Check Consent (Optional)",
  signature: "Digital Signature",
  consent_date: "Consent Date",
};

// ==================== STEP TITLE MAPPINGS ====================

export const STEP_TITLES = {
  testing_basic_info: "Basic Information",
  education: "Education Background",
  test_scores: "Test Scores",
  preferences: "Study Preferences",
  experience: "Work Experience",
  financial: "Financial Information",
  documents: "Documents",
  goals: "Career Goals",
  testing_compliance: "Compliance & Consent",
};

// ==================== SELECT OPTIONS MAPPINGS ====================

export const SELECT_OPTIONS_LABELS = {
  // Gender
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer Not to Say",

  // Education Level
  high_school: "High School",
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: "PhD",
  diploma: "Diploma",
  certificate: "Certificate",

  // Grading System
  "4.0_scale": "4.0 Scale",
  "5.0_scale": "5.0 Scale",
  "10.0_scale": "10.0 Scale",
  percentage: "Percentage",

  // Countries
  germany: "Germany",
  canada: "Canada",
  usa: "USA",
  uk: "United Kingdom",
  australia: "Australia",
  netherlands: "Netherlands",
  france: "France",
  ireland: "Ireland",
  new_zealand: "New Zealand",
  switzerland: "Switzerland",

  // Semesters
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",

  // University Ranking
  top_50: "Top 50",
  top_100: "Top 100",
  top_200: "Top 200",
  no_preference: "No Preference",

  // Accommodation
  on_campus: "On Campus",
  off_campus: "Off Campus",
  homestay: "Homestay",

  // Budget Range
  under_20000: "Under $20,000",
  "20000_40000": "$20,000 - $40,000",
  "40000_60000": "$40,000 - $60,000",
  "60000_80000": "$60,000 - $80,000",
  "80000_100000": "$80,000 - $100,000",
  above_100000: "Above $100,000",

  // Funding Sources
  self_funded: "Self Funded",
  family_funded: "Family Funded",
  scholarship: "Scholarship",
  student_loan: "Student Loan",
  employer_sponsored: "Employer Sponsored",
  government_grant: "Government Grant",

  // Career Paths
  academia_research: "Academia & Research",
  corporate: "Corporate",
  entrepreneurship: "Entrepreneurship",
  government_public_sector: "Government/Public Sector",
  non_profit: "Non-Profit",
  freelance_consulting: "Freelance/Consulting",
  undecided: "Undecided",

  // Post-Study Plans
  return_home_country: "Return to Home Country",
  work_in_study_country: "Work in Study Country",
  further_studies: "Further Studies",
  explore_opportunities: "Explore Opportunities",

  other: "Other",
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Auto-format field name from snake_case to Title Case
 * Fallback function when mapping is not found
 * 
 * @param {string} fieldName - The field name in snake_case
 * @returns {string} - Formatted label
 */
export const autoFormatFieldName = (fieldName) => {
  if (!fieldName) return "";
  
  return fieldName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get field label with fallback to auto-formatting
 * 
 * @param {string} fieldName - The field name from backend
 * @param {string} category - Optional category (e.g., 'profile', 'application')
 * @returns {string} - Human-readable label
 */
export const getFieldLabel = (fieldName, category = 'profile') => {
  if (!fieldName) return "";

  // Check in profile builder fields
  if (PROFILE_BUILDER_FIELDS[fieldName]) {
    return PROFILE_BUILDER_FIELDS[fieldName];
  }

  // Fallback to auto-formatting
  return autoFormatFieldName(fieldName);
};

/**
 * Get step title with fallback
 * 
 * @param {string} stepId - The step ID from backend
 * @returns {string} - Human-readable step title
 */
export const getStepTitle = (stepId) => {
  if (!stepId) return "";
  
  return STEP_TITLES[stepId] || autoFormatFieldName(stepId);
};

/**
 * Get option label with fallback
 * 
 * @param {string} optionValue - The option value from backend
 * @returns {string} - Human-readable option label
 */
export const getOptionLabel = (optionValue) => {
  if (!optionValue) return "";
  
  return SELECT_OPTIONS_LABELS[optionValue] || autoFormatFieldName(optionValue);
};

/**
 * Get multiple field labels at once
 * Useful for batch processing
 * 
 * @param {string[]} fieldNames - Array of field names
 * @returns {Object} - Object with fieldName: label mappings
 */
export const getMultipleFieldLabels = (fieldNames) => {
  if (!Array.isArray(fieldNames)) return {};
  
  return fieldNames.reduce((acc, fieldName) => {
    acc[fieldName] = getFieldLabel(fieldName);
    return acc;
  }, {});
};

/**
 * Check if a field has a custom mapping
 * 
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if field has custom mapping
 */
export const hasCustomMapping = (fieldName) => {
  return Boolean(PROFILE_BUILDER_FIELDS[fieldName]);
};

// ==================== FUTURE EXTENSIBILITY ====================

/**
 * To add new field mappings for other features:
 * 
 * 1. Create a new mapping object (e.g., APPLICATION_FIELDS)
 * 2. Add it to the getFieldLabel function with category parameter
 * 3. Example:
 * 
 * export const APPLICATION_FIELDS = {
 *   application_status: "Application Status",
 *   submission_date: "Submission Date",
 *   // ... more fields
 * };
 * 
 * Then update getFieldLabel:
 * if (category === 'application' && APPLICATION_FIELDS[fieldName]) {
 *   return APPLICATION_FIELDS[fieldName];
 * }
 */

export default {
  PROFILE_BUILDER_FIELDS,
  STEP_TITLES,
  SELECT_OPTIONS_LABELS,
  getFieldLabel,
  getStepTitle,
  getOptionLabel,
  getMultipleFieldLabels,
  hasCustomMapping,
  autoFormatFieldName,
};
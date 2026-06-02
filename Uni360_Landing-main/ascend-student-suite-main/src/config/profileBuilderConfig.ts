// ─────────────────────────────────────────────────────────────────────────────
// STATIC PROFILE BUILDER CONFIG
// This is a 1-to-1 copy of the backend /api/v1/students/profile/builder/config
// response (as of UNI360 Profile Builder v1.4.0).
//
// WHY IT EXISTS: Fields and steps are intentionally hardcoded here so that a
// backend config change alone cannot alter the UI — a developer must also update
// this file. All API calls (validate, progress, profile data) still hit the
// backend using the exact step_id / field name values below.
//
// HOW TO UPDATE: Copy the new backend config JSON and update the relevant step
// object below. Do NOT rename step_id or field name values without coordinating
// with the backend team.
// ─────────────────────────────────────────────────────────────────────────────

export const STATIC_PROFILE_CONFIG = {
  steps: [
    // ── Step 1: Basic Information ─────────────────────────────────────────────
    {
      step_id: "basic_info",
      title: "Basic Information",
      order: 1,
      required: true,
      estimated_time_minutes: 10,
      description: "Provide your personal and contact details",
      fields: [
        { name: "full_name", type: "text", label: "Full Name", required: true, help_text: "Your full name", placeholder: "" },
        { name: "phone", type: "text", label: "Phone Number", prefix: "+91", required: true, help_text: "Enter your 10-digit mobile number", placeholder: "9999999999", validation: { pattern: "^[6-9]\\d{9}$", message: "Enter a valid 10-digit Indian mobile number" } },
        { name: "date_of_birth", type: "date", label: "Date of Birth", required: true, help_text: "Your date of birth for age verification", validation: { min_age: 16, max_age: 100, message: "You must be at least 16 years old" } },
        { name: "nationality", type: "text", label: "Nationality", required: true, help_text: "Your current nationality", placeholder: "e.g., American, Indian, Chinese" },
        { name: "current_city", type: "text", label: "Current City", required: false, help_text: "Your current city of residence", placeholder: "e.g., Mumbai" },
        { name: "current_country", type: "text", label: "Current Country", required: true, help_text: "Your current country of residence", placeholder: "e.g., India" },
        { name: "gender", type: "select", label: "Gender", options: ["male", "female", "other", "prefer_not_to_say"], required: false },
        { name: "passport_number", type: "text", label: "Passport Number", required: false, help_text: "Your valid passport number (if available)", placeholder: "A12345678" },
        { name: "email", type: "text", label: "Email", required: false, help_text: "Enter your email for admin", placeholder: "abc@gmail.com" },
        { name: "email_password", type: "text", label: "Email Password", required: false, help_text: "Your valid password for the email", placeholder: "ABC#123" },
        { name: "emergency_contact_name", type: "text", label: "Emergency Contact Name", required: false },
        { name: "emergency_contact_phone", type: "text", label: "Emergency Contact Phone", required: false, validation: { pattern: "^\\+?[1-9]\\d{1,14}$", message: "Invalid phone number format" } },
      ],
    },

    // ── Step 2: Education Background ──────────────────────────────────────────
    {
      step_id: "education",
      title: "Education Background",
      order: 2,
      required: true,
      estimated_time_minutes: 15,
      description: "Add your educational history. Click + to add each level (High School, Bachelor's, etc.)",
      fields: [
        {
          name: "education_entries",
          type: "array",
          label: "Education History",
          required: true,
          help_text: "Add each level of your education. Click the + button to add more.",
          metadata: {
            min_items: 1,
            add_button_label: "Add Education",
            item_fields: [
              { name: "education_level", type: "select", label: "Education Level", required: true, options: ["10th", "Diploma", "high_school", "bachelors", "masters", "phd", "other"], help_text: "e.g., 10th, Diploma, High School, Bachelor's, Master's, PhD" },
              { name: "field_of_study", type: "text", label: "Field of Study", required: true, help_text: "Your major or area of specialization", placeholder: "e.g., Computer Science, Business Administration" },
              { name: "institution_name", type: "text", label: "Institution/School Name", required: true, help_text: "Name of the institution", placeholder: "e.g., Delhi Public School, University of Toronto" },
              { name: "start_year", type: "number", label: "Start Year", required: true, placeholder: "2019", validation: { min: 2015, max: 2035, message: "Please enter a valid start year" } },
              { name: "end_year", type: "number", label: "End Year", required: true, help_text: "Year of graduation or expected graduation", placeholder: "2024", validation: { min: 2015, max: 2035, message: "Please enter a valid end year" } },
              { name: "gpa", type: "text", label: "GPA / Percentage", required: false, help_text: "Your cumulative GPA or percentage", placeholder: "e.g., 3.8 GPA or 85%" },
              { name: "academic_honors", type: "textarea", label: "Academic Honors & Awards", required: false, help_text: "Optional: Any notable academic recognitions", placeholder: "List any academic achievements, honors, or awards" },
            ],
          },
        },
      ],
    },

    // ── Step 3: Test Scores ───────────────────────────────────────────────────
    {
      step_id: "test_scores",
      title: "Test Scores",
      order: 3,
      required: false,
      estimated_time_minutes: 10,
      description: "Fill in the scores for the exams you have taken. Leave blank if not applicable.",
      fields: [
        {
          name: "ielts", type: "object", label: "IELTS", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Overall Band Score", required: false, help_text: "Score range: 0–9", placeholder: "e.g., 7.5" },
            { name: "listening", type: "text", label: "Listening", required: false, placeholder: "e.g., 8.0" },
            { name: "reading", type: "text", label: "Reading", required: false, placeholder: "e.g., 7.5" },
            { name: "writing", type: "text", label: "Writing", required: false, placeholder: "e.g., 7.0" },
            { name: "speaking", type: "text", label: "Speaking", required: false, placeholder: "e.g., 7.5" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "toefl", type: "object", label: "TOEFL", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Total Score", required: false, help_text: "Score range: 0–120", placeholder: "e.g., 105" },
            { name: "listening", type: "text", label: "Listening", required: false, placeholder: "e.g., 28" },
            { name: "reading", type: "text", label: "Reading", required: false, placeholder: "e.g., 29" },
            { name: "writing", type: "text", label: "Writing", required: false, placeholder: "e.g., 24" },
            { name: "speaking", type: "text", label: "Speaking", required: false, placeholder: "e.g., 24" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "gre", type: "object", label: "GRE", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Total Score", required: false, help_text: "Score range: 260–340", placeholder: "e.g., 325" },
            { name: "verbal", type: "text", label: "Verbal Reasoning", required: false, placeholder: "e.g., 160" },
            { name: "quantitative", type: "text", label: "Quantitative Reasoning", required: false, placeholder: "e.g., 165" },
            { name: "analytical_writing", type: "text", label: "Analytical Writing", required: false, placeholder: "e.g., 4.5" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "gmat", type: "object", label: "GMAT", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Total Score", required: false, help_text: "Score range: 205–805", placeholder: "e.g., 700" },
            { name: "verbal", type: "text", label: "Verbal Reasoning", required: false, placeholder: "e.g., 38" },
            { name: "quantitative", type: "text", label: "Quantitative Reasoning", required: false, placeholder: "e.g., 50" },
            { name: "analytical_writing", type: "text", label: "Analytical Writing Assessment", required: false, placeholder: "e.g., 5.0" },
            { name: "data_insights", type: "text", label: "Data Insights", required: false, placeholder: "e.g., 7" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "sat", type: "object", label: "SAT", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Total Score", required: false, help_text: "Score range: 400–1600", placeholder: "e.g., 1450" },
            { name: "math", type: "text", label: "Math", required: false, placeholder: "e.g., 750" },
            { name: "reading_writing", type: "text", label: "Evidence-Based Reading & Writing", required: false, placeholder: "e.g., 700" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "jee", type: "object", label: "JEE", required: false,
          fields: [
            { name: "level", type: "select", label: "JEE Level", options: ["JEE Main", "JEE Advanced"], required: false },
            { name: "overall_score", type: "text", label: "Score / Percentile", required: false, placeholder: "e.g., 250 or 98.5 percentile" },
            { name: "physics", type: "text", label: "Physics", required: false, placeholder: "e.g., 90" },
            { name: "chemistry", type: "text", label: "Chemistry", required: false, placeholder: "e.g., 85" },
            { name: "mathematics", type: "text", label: "Mathematics", required: false, placeholder: "e.g., 95" },
            { name: "air_rank", type: "text", label: "All India Rank (AIR)", required: false, placeholder: "e.g., 1500" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "neet", type: "object", label: "NEET", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Total Score", required: false, help_text: "Score range: 0–720", placeholder: "e.g., 650" },
            { name: "physics", type: "text", label: "Physics", required: false, placeholder: "e.g., 160" },
            { name: "chemistry", type: "text", label: "Chemistry", required: false, placeholder: "e.g., 150" },
            { name: "biology", type: "text", label: "Biology (Botany + Zoology)", required: false, placeholder: "e.g., 340" },
            { name: "percentile", type: "text", label: "Percentile", required: false, placeholder: "e.g., 99.2" },
            { name: "air_rank", type: "text", label: "All India Rank (AIR)", required: false, placeholder: "e.g., 5000" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "act", type: "object", label: "ACT", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Composite Score", required: false, help_text: "Score range: 1–36", placeholder: "e.g., 32" },
            { name: "english", type: "text", label: "English", required: false, placeholder: "e.g., 33" },
            { name: "mathematics", type: "text", label: "Mathematics", required: false, placeholder: "e.g., 30" },
            { name: "reading", type: "text", label: "Reading", required: false, placeholder: "e.g., 34" },
            { name: "science", type: "text", label: "Science", required: false, placeholder: "e.g., 31" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "duolingo", type: "object", label: "Duolingo English Test", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Overall Score", required: false, help_text: "Score range: 10–160", placeholder: "e.g., 120" },
            { name: "literacy", type: "text", label: "Literacy", required: false, placeholder: "e.g., 125" },
            { name: "comprehension", type: "text", label: "Comprehension", required: false, placeholder: "e.g., 115" },
            { name: "conversation", type: "text", label: "Conversation", required: false, placeholder: "e.g., 110" },
            { name: "production", type: "text", label: "Production", required: false, placeholder: "e.g., 120" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "pte", type: "object", label: "PTE Academic", required: false,
          fields: [
            { name: "overall_score", type: "text", label: "Overall Score", required: false, help_text: "Score range: 10–90", placeholder: "e.g., 75" },
            { name: "listening", type: "text", label: "Listening", required: false, placeholder: "e.g., 78" },
            { name: "reading", type: "text", label: "Reading", required: false, placeholder: "e.g., 74" },
            { name: "writing", type: "text", label: "Writing", required: false, placeholder: "e.g., 72" },
            { name: "speaking", type: "text", label: "Speaking", required: false, placeholder: "e.g., 76" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
        {
          name: "other", type: "object", label: "Other Exam", required: false,
          fields: [
            { name: "exam_name", type: "text", label: "Exam Name", required: false, placeholder: "e.g., Cambridge C1 Advanced, JLPT, HSK" },
            { name: "overall_score", type: "text", label: "Score / Result", required: false, placeholder: "e.g., C1, 85%, 300" },
            { name: "score_scale", type: "text", label: "Score Scale / Max Score", required: false, placeholder: "e.g., A1–C2, 0–100, 400" },
            { name: "test_date", type: "date", label: "Test Date", required: false },
          ],
        },
      ],
    },

    // ── Step 4: Study Preferences ─────────────────────────────────────────────
    {
      step_id: "preferences",
      title: "Study Preferences",
      order: 4,
      required: true,
      estimated_time_minutes: 10,
      description: "Tell us about your study abroad preferences and goals",
      fields: [
        { name: "degree_level", type: "select", label: "Target Degree Level", required: true, help_text: "The degree level you are applying for", options: ["Bachelors", "Masters", "PhD", "Diploma", "Certificate"] },
        { name: "preferred_programs", type: "multiselect", label: "Preferred Programs/Fields", required: true, help_text: "Select your preferred areas of study. If Other, specify below.", options: ["Computer Science", "Engineering", "Business Administration", "Data Science", "Medicine", "Law", "Arts & Humanities", "Social Sciences", "Natural Sciences", "Architecture", "Other"] },
        { name: "preferred_programs_other", type: "text", label: "Specify Other Program/Field", required: false, help_text: "Please specify your program or field of interest", placeholder: "e.g., Sports Management, Film Studies, Urban Planning" },
        { name: "intake_year", type: "select", label: "Intake Year", required: true, help_text: "Year you plan to start your studies (within the next 1-2 years)", options: ["2026", "2027"] },
        { name: "intake_semester", type: "multiselect", label: "Intake Semester", required: true, help_text: "Select one or more intake seasons you are targeting", options: ["Spring (Jan-Mar)", "Summer (Apr-Jun)", "Fall (Sep-Oct)", "Winter (Nov-Dec)"] },
        { name: "accommodation_preference", type: "select", label: "Accommodation Preference", required: false, options: ["on_campus", "off_campus", "homestay", "no_preference"] },
      ],
    },

    // ── Step 5: Work Experience ───────────────────────────────────────────────
    {
      step_id: "experience",
      title: "Work Experience",
      order: 5,
      required: false,
      estimated_time_minutes: 15,
      description: "Share your professional and work experience (if any) — this section is optional",
      fields: [
        { name: "has_work_experience", type: "boolean", label: "Do you have work experience?", required: true, default_value: false },
        { name: "total_experience_years", type: "number", label: "Total Years of Experience", required: false, validation: { min: 0, max: 50, message: "Please enter valid years of experience" } },
        {
          name: "work_experiences", type: "array", label: "Work Experience Details", required: false, help_text: "Add your work experiences (company, role, duration)",
          metadata: {
            item_fields: [
              { name: "company_name", type: "text", label: "Company Name", required: true },
              { name: "job_title", type: "text", label: "Job Title", required: true },
              { name: "start_date", type: "date", label: "Start Date", required: true },
              { name: "end_date", type: "date", label: "End Date", required: false },
              { name: "is_current", type: "boolean", label: "Currently Working Here", required: false },
              { name: "description", type: "textarea", label: "Job Description", required: false },
            ],
          },
        },
        { name: "experience_summary", type: "textarea", label: "Work/Research Experience Summary", required: false, help_text: "Brief summary of your work or research experience (used for document generation)", placeholder: "e.g., 2 years of experience as Software Developer at XYZ Company..." },
        { name: "skills", type: "textarea", label: "Technical/Professional Skills", required: false, help_text: "List your key technical and professional skills", placeholder: "e.g., Python, Java, Machine Learning, Data Analysis, Project Management..." },
        { name: "projects", type: "textarea", label: "Notable Projects", required: false, help_text: "Brief description of your notable academic or professional projects", placeholder: "e.g., Developed a machine learning model for sentiment analysis..." },
        { name: "internships", type: "array", label: "Internships", required: false, help_text: "Add any internship experiences" },
        { name: "volunteer_work", type: "textarea", label: "Volunteer Work", required: false, placeholder: "Describe any volunteer or community service experience" },
        { name: "extracurricular_activities", type: "textarea", label: "Extracurricular Activities", required: false, placeholder: "Clubs, sports, leadership roles, etc." },
      ],
    },

    // ── Step 6: Financial Information ─────────────────────────────────────────
    {
      step_id: "financial",
      title: "Financial Information",
      order: 6,
      required: true,
      estimated_time_minutes: 10,
      description: "Provide information about your financial capacity and funding sources (amounts in EUR €)",
      fields: [
        { name: "budget_range", type: "select", label: "Annual Budget Range (EUR €)", required: true, help_text: "Your estimated annual budget for tuition and living expenses in Euros", options: ["Under \u20ac10,000", "\u20ac10,000 \u2013 \u20ac20,000", "\u20ac20,000 \u2013 \u20ac40,000", "\u20ac40,000 \u2013 \u20ac60,000", "Above \u20ac60,000"] },
        { name: "funding_source", type: "multiselect", label: "Funding Source", required: false, help_text: "How will you fund your education? (select all that apply)", options: ["self_funded", "education_loan", "scholarship", "government_grant"] },
        { name: "sponsor_name", type: "text", label: "Financial Sponsor Name", required: false, help_text: "If applicable, who is sponsoring your education?", placeholder: "Name of person/organization sponsoring" },
      ],
    },

    // ── Step 7: Career Goals ──────────────────────────────────────────────────
    {
      step_id: "goals",
      title: "Career Goals",
      order: 7,
      required: false,
      estimated_time_minutes: 10,
      description: "Share your academic and career aspirations",
      fields: [
        { name: "academic_goals", type: "textarea", label: "Academic Goals", required: false, help_text: "Describe your academic objectives and what you want to learn", placeholder: "What do you hope to achieve academically?", validation: { min_length: 50, max_length: 1000, message: "Please provide at least 50 characters" } },
        { name: "career_goals", type: "textarea", label: "Career Goals", required: false, help_text: "Describe your career plans after completing your studies", placeholder: "What are your long-term career aspirations?", validation: { min_length: 50, max_length: 1000, message: "Please provide at least 50 characters" } },
        { name: "motivation", type: "textarea", label: "Motivation for Studying Abroad", required: true, help_text: "Explain your motivation for pursuing this program abroad", placeholder: "e.g., I am motivated to study abroad because...", validation: { min_length: 50, max_length: 1000, message: "Please provide at least 50 characters" } },
        { name: "preferred_career_path", type: "select", label: "Preferred Career Path", required: false, options: ["academia_research", "corporate", "entrepreneurship", "government_public_sector", "non_profit", "freelance_consulting", "undecided"] },
        { name: "post_study_plans", type: "select", label: "Post-Study Plans", required: false, help_text: "What do you plan to do after graduation?", options: ["return_home_country", "work_in_study_country", "further_studies", "explore_opportunities", "undecided"] },
      ],
    },

    // ── Step 8: Compliance & Consent ──────────────────────────────────────────
    {
      step_id: "testing_compliance",
      title: "Compliance & Consent",
      order: 8,
      required: true,
      estimated_time_minutes: 3,
      description: "Review and accept our terms, policies, and consent forms to submit your profile",
      fields: [
        {
          name: "full_consent",
          type: "boolean",
          label: "I agree to all of the following: (1) Terms & Conditions, (2) Privacy Policy, (3) Data processing and retention for application purposes under GDPR, (4) That all information provided is accurate and I consent to background verification if required, and (5) Sharing my data with universities and partner institutions for application purposes.",
          required: true,
          help_text: "You must tick this box to confirm your agreement with all the above before submitting.",
          default_value: false,
          validation: { must_be_true: true, message: "You must accept all terms and conditions to submit your profile." },
        },
        {
          name: "marketing_consent",
          type: "boolean",
          label: "Marketing Communications Consent (Optional) \u2014 Receive updates about programs, scholarships, and opportunities",
          required: false,
          help_text: "Tick this if you'd like to receive news and offers from UNI360. This is optional.",
          default_value: false,
        },
        { name: "signature", type: "text", label: "Digital Signature", required: true, help_text: "Type your full name to digitally sign this consent form", placeholder: "Type your full name as signature" },
        { name: "consent_date", type: "date", label: "Consent Date", required: true, help_text: "Auto-filled with today's date when you submit the form", default_value: "auto_today" },
      ],
    },
  ],
};

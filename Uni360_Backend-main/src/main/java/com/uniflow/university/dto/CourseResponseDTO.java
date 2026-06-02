package com.uniflow.university.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CourseResponseDTO - Data Transfer Object for Course API Responses
 *
 * <p>This DTO handles outgoing responses for course/program information associated with universities.
 * It provides comprehensive course details for frontend consumption and API integrations.
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseResponseDTO {

    // Primary Identifiers
    @JsonProperty("id")
    private UUID id;

    @JsonProperty("university_id")
    private UUID universityId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("official_name")
    private String officialName;

    @JsonProperty("short_name")
    private String shortName;

    @JsonProperty("course_code")
    private String courseCode;

    @JsonProperty("alternative_names")
    private List<String> alternativeNames;

    // Academic Classification
    @JsonProperty("degree_level")
    private String degreeLevel; // BACHELOR, MASTER, PHD, DIPLOMA, CERTIFICATE

    @JsonProperty("degree_type")
    private String degreeType; // BSc, MSc, MBA, PhD, etc.

    @JsonProperty("field_of_study")
    private String fieldOfStudy;

    @JsonProperty("subject_area")
    private String subjectArea;

    @JsonProperty("academic_department")
    private String academicDepartment;

    @JsonProperty("faculty")
    private String faculty;

    @JsonProperty("specialization")
    private String specialization;

    // Program Structure
    @JsonProperty("duration_years")
    private Integer durationYears;

    @JsonProperty("duration_months")
    private Integer durationMonths;

    @JsonProperty("credit_hours")
    private Integer creditHours;

    @JsonProperty("study_mode")
    private String studyMode; // FULL_TIME, PART_TIME, ONLINE, HYBRID

    @JsonProperty("delivery_method")
    private String deliveryMethod; // ON_CAMPUS, ONLINE, BLENDED

    @JsonProperty("language_of_instruction")
    private String languageOfInstruction;

    @JsonProperty("additional_languages")
    private List<String> additionalLanguages;

    // Admission Information
    @JsonProperty("admission_requirements")
    private Map<String, Object> admissionRequirements;

    @JsonProperty("prerequisites")
    private List<String> prerequisites;

    @JsonProperty("min_gpa")
    private BigDecimal minGpa;

    @JsonProperty("min_ielts")
    private BigDecimal minIelts;

    @JsonProperty("min_toefl")
    private Integer minToefl;

    @JsonProperty("min_gre")
    private Integer minGre;

    @JsonProperty("min_gmat")
    private Integer minGmat;

    @JsonProperty("required_documents")
    private List<String> requiredDocuments;

    @JsonProperty("application_deadlines")
    private Map<String, String> applicationDeadlines;

    // Financial Information
    @JsonProperty("tuition_fee_local")
    private BigDecimal tuitionFeeLocal;

    @JsonProperty("tuition_fee_international")
    private BigDecimal tuitionFeeInternational;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("application_fee")
    private BigDecimal applicationFee;

    @JsonProperty("additional_fees")
    private Map<String, BigDecimal> additionalFees;

    @JsonProperty("scholarships_available")
    private Boolean scholarshipsAvailable;

    @JsonProperty("scholarship_amount_range")
    private String scholarshipAmountRange;

    @JsonProperty("financial_aid_available")
    private Boolean financialAidAvailable;

    // Career Information
    @JsonProperty("career_prospects")
    private List<String> careerProspects;

    @JsonProperty("average_salary_range")
    private String averageSalaryRange;

    @JsonProperty("employment_rate")
    private BigDecimal employmentRate;

    @JsonProperty("top_recruiters")
    private List<String> topRecruiters;

    // Program Details
    @JsonProperty("curriculum_overview")
    private String curriculumOverview;

    @JsonProperty("key_subjects")
    private List<String> keySubjects;

    @JsonProperty("research_opportunities")
    private Boolean researchOpportunities;

    @JsonProperty("internship_opportunities")
    private Boolean internshipOpportunities;

    @JsonProperty("industry_partnerships")
    private List<String> industryPartnerships;

    @JsonProperty("accreditations")
    private List<String> accreditations;

    @JsonProperty("recognitions")
    private List<String> recognitions;

    // Intake Information
    @JsonProperty("intake_seasons")
    private List<String> intakeSeasons; // SPRING, FALL, SUMMER, WINTER

    @JsonProperty("next_intake_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextIntakeDate;

    @JsonProperty("application_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime applicationDeadline;

    // Status and Availability
    @JsonProperty("status")
    private String status; // ACTIVE, INACTIVE, SUSPENDED, DISCONTINUED

    @JsonProperty("is_popular")
    private Boolean isPopular;

    @JsonProperty("is_featured")
    private Boolean isFeatured;

    @JsonProperty("capacity")
    private Integer capacity;

    @JsonProperty("current_enrollments")
    private Integer currentEnrollments;

    // Additional Information
    @JsonProperty("description")
    private String description;

    @JsonProperty("learning_outcomes")
    private List<String> learningOutcomes;

    @JsonProperty("assessment_methods")
    private List<String> assessmentMethods;

    @JsonProperty("facilities")
    private List<String> facilities;

    @JsonProperty("additional_data")
    private Map<String, Object> additionalData;

    @JsonProperty("custom_fields")
    private Map<String, Object> customFields;

    // Timestamps
    @JsonProperty("created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    // Computed Properties
    @JsonProperty("is_affordable")
    public Boolean getIsAffordable() {
        if (tuitionFeeInternational == null) return null;
        return tuitionFeeInternational.compareTo(new BigDecimal("20000")) <= 0;
    }

    @JsonProperty("duration_display")
    public String getDurationDisplay() {
        if (durationYears != null && durationMonths != null) {
            return durationYears + " years, " + durationMonths + " months";
        } else if (durationYears != null) {
            return durationYears + " year" + (durationYears > 1 ? "s" : "");
        } else if (durationMonths != null) {
            return durationMonths + " month" + (durationMonths > 1 ? "s" : "");
        }
        return "Duration not specified";
    }

    @JsonProperty("tuition_display")
    public String getTuitionDisplay() {
        if (tuitionFeeInternational != null && currency != null) {
            return currency + " " + tuitionFeeInternational;
        } else if (tuitionFeeInternational != null) {
            return tuitionFeeInternational.toString();
        }
        return "Contact University";
    }

    @JsonProperty("application_difficulty")
    public String getApplicationDifficulty() {
        int difficultyScore = 0;

        if (
            minGpa != null && minGpa.compareTo(new BigDecimal("3.5")) > 0
        ) difficultyScore++;
        if (
            minIelts != null && minIelts.compareTo(new BigDecimal("7.0")) > 0
        ) difficultyScore++;
        if (minToefl != null && minToefl > 100) difficultyScore++;
        if (minGre != null && minGre > 320) difficultyScore++;
        if (minGmat != null && minGmat > 600) difficultyScore++;

        if (difficultyScore >= 4) return "Very High";
        if (difficultyScore >= 3) return "High";
        if (difficultyScore >= 2) return "Medium";
        if (difficultyScore >= 1) return "Low";
        return "Unknown";
    }

    @JsonProperty("next_deadline")
    public String getNextDeadline() {
        if (applicationDeadline != null) {
            return applicationDeadline.toLocalDate().toString();
        }
        return "Contact University";
    }
}

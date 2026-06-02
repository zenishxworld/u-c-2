package com.uniflow.student.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.uniflow.common.enums.EducationLevel;
import com.uniflow.common.enums.VerificationStatus;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * StudentProfile entity representing a student's complete profile information
 *
 * <p>This entity stores all student profile data in a flexible JSONB structure to support dynamic
 * profile builder functionality while maintaining essential metadata for querying and indexing.
 *
 * <p>Based on Django StudentProfile model from services/students/models.py
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("student_profiles")
public class StudentProfile {

    @Id
    private UUID id;

    /**
     * Reference to the user account (from Core Service) This links to the users table in the core
     * database
     */
    @Column("user_id")
    private Long userId;

    /**
     * Core profile data stored in JSONB - all dynamic fields go here This includes: basic_info,
     * education, preferences, compliance, etc.
     *
     * <p>Structure example: { "basic_info": { "phone": "+1-555-0123", "date_of_birth": "1995-05-15",
     * "nationality": "american", "current_location": "New York, USA" }, "education": {
     * "education_level": "masters", "field_of_study": "Computer Science", "institution_name":
     * "University of Toronto", "graduation_year": 2022, "gpa": 3.8 }, "test_scores": { "IELTS":
     * "7.5", "GRE": "325" }, "preferences": { "target_countries": ["germany", "canada"],
     * "preferred_programs": ["Computer Science"], "study_level": "masters", "intake_year": 2024,
     * "intake_semester": "fall" }, "financial": { "budget_min": 50000, "budget_max": 100000,
     * "budget_currency": "USD", "funding_source": "self" }, "compliance": { "gdpr_consent": true,
     * "marketing_consent": false, "terms_accepted": true, "privacy_policy_accepted": true,
     * "data_retention_consent": true } }
     */
    @Column("profile_data")
    private JsonNode profileData;

    /** Profile Builder Metadata */
    @Column("profile_status")
    @Builder.Default
    private VerificationStatus profileStatus = VerificationStatus.DRAFT;

    @Column("completion_percentage")
    @Builder.Default
    private Integer completionPercentage = 0;

    /**
     * List of completed profile builder step IDs Example: ["basic_info", "education", "preferences"]
     */
    @Column("profile_steps_completed")
    private JsonNode profileStepsCompleted;

    /** Current step in profile builder workflow */
    @Column("current_step")
    private String currentStep;

    /** File upload references (stored as URLs or file IDs) */
    @Column("cv_resume_url")
    private String cvResumeUrl;

    @Column("profile_photo_url")
    private String profilePhotoUrl;

    /** Academic document URLs - synced from Document API on upload */
    @Column("leaving_certificate_url")
    private String leavingCertificateUrl;

    @Column("twelfth_marksheet_url")
    private String twelfthMarksheetUrl;

    @Column("tenth_marksheet_url")
    private String tenthMarksheetUrl;

    /** Verification metadata */
    @Column("is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column("verified_at")
    private LocalDateTime verifiedAt;

    @Column("verified_by")
    private Long verifiedBy;

    /** Workflow and journey tracking */
    @Column("workflow_stage")
    private String workflowStage;

    @Column("journey_progress")
    private JsonNode journeyProgress;

    /** Profile scoring and matching */
    @Column("profile_score")
    private Double profileScore;

    @Column("matching_criteria")
    private JsonNode matchingCriteria;

    /** Timestamps */
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    /** Soft delete flag */
    @Column("deleted")
    @Builder.Default
    private Boolean deleted = false;

    // Convenience methods for accessing profile data

    /** Get phone number from profile data */
    public String getPhone() {
        if (profileData != null && profileData.has("basic_info")) {
            JsonNode basicInfo = profileData.get("basic_info");
            return basicInfo.has("phone")
                ? basicInfo.get("phone").asText()
                : null;
        }
        return null;
    }

    /** Get nationality from profile data */
    public String getNationality() {
        if (profileData != null && profileData.has("basic_info")) {
            JsonNode basicInfo = profileData.get("basic_info");
            return basicInfo.has("nationality")
                ? basicInfo.get("nationality").asText()
                : null;
        }
        return null;
    }

    /** Get current location from profile data */
    public String getCurrentLocation() {
        if (profileData != null && profileData.has("basic_info")) {
            JsonNode basicInfo = profileData.get("basic_info");
            return basicInfo.has("current_location")
                ? basicInfo.get("current_location").asText()
                : null;
        }
        return null;
    }

    /** Get education level from profile data */
    public EducationLevel getEducationLevel() {
        if (profileData != null && profileData.has("education")) {
            JsonNode education = profileData.get("education");
            if (education.has("education_level")) {
                String level = education.get("education_level").asText();
                try {
                    return EducationLevel.fromCode(level);
                } catch (IllegalArgumentException e) {
                    return null;
                }
            }
        }
        return null;
    }

    /** Get field of study from profile data */
    public String getFieldOfStudy() {
        if (profileData != null && profileData.has("education")) {
            JsonNode education = profileData.get("education");
            return education.has("field_of_study")
                ? education.get("field_of_study").asText()
                : null;
        }
        return null;
    }

    /** Get graduation year from profile data */
    public Integer getGraduationYear() {
        if (profileData != null && profileData.has("education")) {
            JsonNode education = profileData.get("education");
            return education.has("graduation_year")
                ? education.get("graduation_year").asInt()
                : null;
        }
        return null;
    }

    /** Get GPA from profile data */
    public Double getGpa() {
        if (profileData != null && profileData.has("education")) {
            JsonNode education = profileData.get("education");
            return education.has("gpa")
                ? education.get("gpa").asDouble()
                : null;
        }
        return null;
    }

    /** Get test scores from profile data */
    public JsonNode getTestScores() {
        if (profileData != null && profileData.has("test_scores")) {
            return profileData.get("test_scores");
        }
        return null;
    }

    /** Get target countries from profile data */
    public JsonNode getTargetCountries() {
        if (profileData != null && profileData.has("preferences")) {
            JsonNode preferences = profileData.get("preferences");
            return preferences.has("target_countries")
                ? preferences.get("target_countries")
                : null;
        }
        return null;
    }

    /** Get preferred programs from profile data */
    public JsonNode getPreferredPrograms() {
        if (profileData != null && profileData.has("preferences")) {
            JsonNode preferences = profileData.get("preferences");
            return preferences.has("preferred_programs")
                ? preferences.get("preferred_programs")
                : null;
        }
        return null;
    }

    /** Check if GDPR consent is given */
    public Boolean hasGdprConsent() {
        if (profileData != null && profileData.has("compliance")) {
            JsonNode compliance = profileData.get("compliance");
            return compliance.has("gdpr_consent")
                ? compliance.get("gdpr_consent").asBoolean()
                : false;
        }
        return false;
    }

    /** Check if terms are accepted */
    public Boolean hasAcceptedTerms() {
        if (profileData != null && profileData.has("compliance")) {
            JsonNode compliance = profileData.get("compliance");
            return compliance.has("terms_accepted")
                ? compliance.get("terms_accepted").asBoolean()
                : false;
        }
        return false;
    }

    /** Get budget range from profile data */
    public JsonNode getBudgetInfo() {
        if (profileData != null && profileData.has("financial")) {
            return profileData.get("financial");
        }
        return null;
    }

    /** Calculate completion percentage based on completed steps */
    public int calculateCompletionPercentage() {
        if (profileData == null) return 0;

        // Define step order for calculation
        List<String> stepOrder = Arrays.asList(
            "basic_info",
            "education",
            "test_scores",
            "preferences",
            "experience",
            "financial",
            "documents",
            "goals",
            "compliance"
        );

        int totalSteps = stepOrder.size();
        int completedSteps = 0;

        // Count completed steps based on data presence and basic validation
        for (String stepId : stepOrder) {
            if (profileData.has(stepId)) {
                JsonNode stepData = profileData.get(stepId);
                if (isStepDataComplete(stepId, stepData)) {
                    completedSteps++;
                }
            }
        }

        // Calculate percentage: completed/total * 100, rounded to nearest integer
        double percentage = ((double) completedSteps / totalSteps) * 100.0;
        return (int) Math.round(percentage);
    }

    /** Check if step data is complete enough to count as completed */
    private boolean isStepDataComplete(String stepId, JsonNode stepData) {
        if (stepData == null || !stepData.isObject()) return false;

        switch (stepId) {
            case "basic_info":
                return (
                    stepData.has("phone") &&
                    stepData.has("nationality") &&
                    stepData.has("current_location") &&
                    stepData.has("date_of_birth")
                );
            case "education":
                return (
                    stepData.has("education_level") &&
                    stepData.has("field_of_study") &&
                    stepData.has("institution_name") &&
                    stepData.has("graduation_year")
                );
            case "test_scores":
                return stepData.has("test_type") && stepData.has("total_score");
            case "preferences":
                return (
                    stepData.has("preferred_countries") &&
                    stepData.has("preferred_study_level")
                );
            case "experience":
                return true; // Optional step, any data counts
            case "financial":
                return (
                    stepData.has("budget_range") ||
                    stepData.has("funding_source")
                );
            case "documents":
                return true; // Optional step, any data counts
            case "goals":
                return (
                    stepData.has("career_goals") ||
                    stepData.has("academic_goals")
                );
            case "compliance":
                return (
                    stepData.has("terms_accepted") &&
                    stepData.get("terms_accepted").asBoolean()
                );
            default:
                return stepData.size() > 0; // Any data present counts as complete
        }
    }

    /** Check if profile is complete based on required fields */
    public boolean isProfileComplete() {
        return calculateCompletionPercentage() >= 80; // 80% completion threshold
    }

    /** Update profile status based on completion */
    public void updateProfileStatus() {
        int completion = calculateCompletionPercentage();
        this.completionPercentage = completion;

        if (completion == 0) {
            this.profileStatus = VerificationStatus.DRAFT;
        } else if (completion < 80) {
            this.profileStatus = VerificationStatus.INCOMPLETE;
        } else if (completion >= 80 && !isVerified) {
            this.profileStatus = VerificationStatus.COMPLETE;
        } else if (isVerified) {
            this.profileStatus = VerificationStatus.VERIFIED;
        }
    }
}

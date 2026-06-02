package com.uniflow.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ApplicationRequestDTO - Data Transfer Object for Application Creation and Updates
 *
 * <p>This DTO handles incoming requests for creating and updating university applications. It
 * includes validation rules and transformation logic for the application lifecycle.
 *
 * <p>Key Features: - Comprehensive validation for all required fields - Support for different
 * application types and workflows - Multi-client configuration support - Flexible custom fields and
 * preferences - Financial and payment information - Document and requirement tracking
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationRequestDTO {

  // Student and Basic Information
  @NotNull(message = "Student ID is required")
  @JsonProperty("student_id")
  private long studentId;

  // University and Course Selection
  @NotNull(message = "Target university ID is required")
  @JsonProperty("target_university_id")
  private UUID targetUniversityId;

  @NotNull(message = "Target course ID is required")
  @JsonProperty("target_course_id")
  private UUID targetCourseId;

  @NotBlank(message = "Target semester is required")
  @Pattern(regexp = "^(fall|spring|summer|winter)$", message = "Invalid semester")
  @JsonProperty("target_semester")
  private String targetSemester;

  @NotNull(message = "Target year is required")
  @Min(value = 2024, message = "Target year must be current year or later")
  @Max(value = 2030, message = "Target year cannot be more than 6 years in the future")
  @JsonProperty("target_year")
  private Integer targetYear;

  @JsonProperty("alternate_course_id")
  private UUID alternateCourseId;

  @JsonProperty("alternate_university_id")
  private UUID alternateUniversityId;

  // Application Classification
  @NotBlank(message = "Application type is required")
  @Pattern(
      regexp = "^(undergraduate|graduate|postgraduate|phd|mba|executive)$",
      message = "Invalid application type")
  @JsonProperty("application_type")
  private String applicationType;

  @Pattern(regexp = "^(bachelor|master|doctorate)$", message = "Invalid program level")
  @JsonProperty("program_level")
  private String programLevel;

  @Pattern(regexp = "^(full-time|part-time|online|hybrid)$", message = "Invalid study mode")
  @JsonProperty("study_mode")
  private String studyMode;

  @Pattern(regexp = "^(fall|spring|summer|winter)$", message = "Invalid intake season")
  @JsonProperty("intake_season")
  private String intakeSeason;

  // Priority and Classification
  @Pattern(regexp = "^(low|normal|high|urgent|critical)$", message = "Invalid priority")
  @JsonProperty("priority")
  private String priority;

  @JsonProperty("is_urgent")
  private Boolean isUrgent;

  @JsonProperty("is_expedited")
  private Boolean isExpedited;

  @JsonProperty("is_fast_tracked")
  private Boolean isFastTracked;

  // Deadlines and Important Dates
  @Future(message = "Deadline must be in the future")
  @JsonProperty("deadline")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime deadline;

  @Future(message = "University deadline must be in the future")
  @JsonProperty("university_deadline")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime universityDeadline;

  @Future(message = "Internal deadline must be in the future")
  @JsonProperty("internal_deadline")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime internalDeadline;

  @Future(message = "Enrollment deadline must be in the future")
  @JsonProperty("enrollment_deadline")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime enrollmentDeadline;

  @Future(message = "Visa deadline must be in the future")
  @JsonProperty("visa_deadline")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime visaDeadline;

  // Document Requirements
  @JsonProperty("documents_required")
  private Integer documentsRequired;

  @JsonProperty("academic_documents_verified")
  private Boolean academicDocumentsVerified;

  @JsonProperty("english_proficiency_verified")
  private Boolean englishProficiencyVerified;

  @JsonProperty("certificates_verified")
  private Boolean certificatesVerified;

  @JsonProperty("personal_documents_verified")
  private Boolean personalDocumentsVerified;

  // University Integration
  @Size(max = 100, message = "University reference number cannot exceed 100 characters")
  @JsonProperty("university_reference_number")
  private String universityReferenceNumber;

  @Size(max = 100, message = "University portal ID cannot exceed 100 characters")
  @JsonProperty("university_portal_id")
  private String universityPortalId;

  @Pattern(
      regexp = "^(submitted|under_review|accepted|rejected|waitlisted)$",
      message = "Invalid university status")
  @JsonProperty("university_status")
  private String universityStatus;

  @Size(max = 1000, message = "University notes cannot exceed 1000 characters")
  @JsonProperty("university_notes")
  private String universityNotes;

  // Financial Information
  @DecimalMin(value = "0.0", inclusive = false, message = "Application fee must be positive")
  @JsonProperty("application_fee_amount")
  private Double applicationFeeAmount;

  @Pattern(regexp = "^[A-Z]{3}$", message = "Invalid currency code")
  @JsonProperty("application_fee_currency")
  private String applicationFeeCurrency;

  @DecimalMin(value = "0.0", inclusive = false, message = "Service fee must be positive")
  @JsonProperty("service_fee_amount")
  private Double serviceFeeAmount;

  @Pattern(regexp = "^[A-Z]{3}$", message = "Invalid currency code")
  @JsonProperty("service_fee_currency")
  private String serviceFeeCurrency;

  @Pattern(
      regexp = "^(credit_card|debit_card|bank_transfer|paypal|stripe|razorpay|other)$",
      message = "Invalid payment method")
  @JsonProperty("payment_method")
  private String paymentMethod;

  @Size(max = 100, message = "Payment reference cannot exceed 100 characters")
  @JsonProperty("payment_reference")
  private String paymentReference;

  @JsonProperty("refund_requested")
  private Boolean refundRequested;

  @DecimalMin(value = "0.0", message = "Refund amount cannot be negative")
  @JsonProperty("refund_amount")
  private Double refundAmount;

  @Size(max = 500, message = "Refund reason cannot exceed 500 characters")
  @JsonProperty("refund_reason")
  private String refundReason;

  // Communication and Follow-up
  @Future(message = "Next followup date must be in the future")
  @JsonProperty("next_followup_date")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime nextFollowupDate;

  @Size(max = 500, message = "Followup reason cannot exceed 500 characters")
  @JsonProperty("followup_reason")
  private String followupReason;

  @Pattern(regexp = "^(email|phone|sms|meeting|video_call)$", message = "Invalid contact type")
  @JsonProperty("last_contact_type")
  private String lastContactType;

  @Size(max = 1000, message = "Contact notes cannot exceed 1000 characters")
  @JsonProperty("last_contact_notes")
  private String lastContactNotes;

  // Quality and Assessment
  @DecimalMin(value = "0.0", message = "Quality score cannot be negative")
  @DecimalMax(value = "100.0", message = "Quality score cannot exceed 100")
  @JsonProperty("quality_score")
  private Double qualityScore;

  @Min(value = 1, message = "Student satisfaction rating must be between 1 and 5")
  @Max(value = 5, message = "Student satisfaction rating must be between 1 and 5")
  @JsonProperty("student_satisfaction_rating")
  private Integer studentSatisfactionRating;

  @Pattern(
      regexp = "^(simple|medium|complex|very_complex)$",
      message = "Invalid processing complexity")
  @JsonProperty("processing_complexity")
  private String processingComplexity;

  @Pattern(regexp = "^(low|medium|high|critical)$", message = "Invalid risk level")
  @JsonProperty("risk_level")
  private String riskLevel;

  // Multi-client and Regional Settings
  @NotBlank(message = "Client ID is required")
  @Pattern(regexp = "^(uniflow|uni360)$", message = "Invalid client ID")
  @JsonProperty("client_id")
  private String clientId;

  @JsonProperty("tenant_id")
  private String tenantId;

  @Pattern(regexp = "^[A-Z]{2}$", message = "Invalid country code")
  @JsonProperty("country_code")
  private String countryCode;

  @Size(max = 50, message = "Territory cannot exceed 50 characters")
  @JsonProperty("territory")
  private String territory;

  @Size(max = 50, message = "Region cannot exceed 50 characters")
  @JsonProperty("region")
  private String region;

  @Pattern(regexp = "^(en|es|fr|de|zh|ja|ko|ar|hi|pt)$", message = "Invalid language preference")
  @JsonProperty("language_preference")
  private String languagePreference;

  @JsonProperty("timezone")
  private String timezone;

  // External Integration
  @Size(max = 100, message = "External reference ID cannot exceed 100 characters")
  @JsonProperty("external_reference_id")
  private String externalReferenceId;

  @Size(max = 50, message = "Source system cannot exceed 50 characters")
  @JsonProperty("source_system")
  private String sourceSystem;

  @Size(max = 100, message = "Migration ID cannot exceed 100 characters")
  @JsonProperty("migration_id")
  private String migrationId;

  // Flexible Data Fields
  @JsonProperty("application_data")
  private Map<String, Object> applicationData;

  @JsonProperty("custom_fields")
  private Map<String, Object> customFields;

  @JsonProperty("preferences")
  private Map<String, Object> preferences;

  @JsonProperty("requirements")
  private Map<String, Object> requirements;

  @JsonProperty("evaluation_criteria")
  private Map<String, Object> evaluationCriteria;

  // Administrative Fields
  @JsonProperty("assigned_admin_id")
  private UUID assignedAdminId;

  @JsonProperty("assigned_counselor_id")
  private UUID assignedCounselorId;

  @Size(max = 500, message = "Status reason cannot exceed 500 characters")
  @JsonProperty("status_reason")
  private String statusReason;

  @Size(max = 500, message = "Archive reason cannot exceed 500 characters")
  @JsonProperty("archive_reason")
  private String archiveReason;

  @Size(max = 500, message = "Lock reason cannot exceed 500 characters")
  @JsonProperty("lock_reason")
  private String lockReason;

  // Validation Methods

  /** Validates that at least one deadline is provided */
  public boolean hasValidDeadlines() {
    return (deadline != null || universityDeadline != null || internalDeadline != null);
  }

  /** Validates that financial information is consistent */
  public boolean hasValidFinancialInfo() {
    if (applicationFeeAmount != null && applicationFeeCurrency == null) {
      return false;
    }
    if (serviceFeeAmount != null && serviceFeeCurrency == null) {
      return false;
    }
    if (refundAmount != null && !Boolean.TRUE.equals(refundRequested)) {
      return false;
    }
    return true;
  }

  /** Validates that the application type matches the program level */
  public boolean hasValidProgramLevel() {
    if (programLevel == null) return true;

    return switch (applicationType) {
      case "undergraduate" -> "bachelor".equals(programLevel);
      case "graduate", "postgraduate", "mba" -> "master".equals(programLevel);
      case "phd" -> "doctorate".equals(programLevel);
      default -> true;
    };
  }

  /** Validates client-specific constraints */
  public boolean hasValidClientConstraints() {
    if ("uniflow".equals(clientId)) {
      return applicationType.matches("undergraduate|graduate|postgraduate|phd");
    } else if ("uni360".equals(clientId)) {
      return applicationType.matches("undergraduate|graduate|mba|executive");
    }
    return true;
  }

  /** Sets default values based on application type and client */
  public void setDefaults() {
    if (priority == null) {
      priority = "normal";
    }

    if (isUrgent == null) {
      isUrgent = false;
    }

    if (isExpedited == null) {
      isExpedited = false;
    }

    if (isFastTracked == null) {
      isFastTracked = false;
    }

    if (processingComplexity == null) {
      processingComplexity = "medium";
    }

    if (riskLevel == null) {
      riskLevel = "low";
    }

    if (languagePreference == null) {
      languagePreference = "en";
    }

    if (timezone == null) {
      timezone = "UTC";
    }

    // Set program level based on application type if not provided
    if (programLevel == null) {
      programLevel =
          switch (applicationType) {
            case "undergraduate" -> "bachelor";
            case "graduate", "postgraduate", "mba", "executive" -> "master";
            case "phd" -> "doctorate";
            default -> "bachelor";
          };
    }

    // Set intake season based on target semester if not provided
    if (intakeSeason == null) {
      intakeSeason = targetSemester;
    }

    // Set study mode default based on application type
    if (studyMode == null) {
      studyMode = "executive".equals(applicationType) ? "part-time" : "full-time";
    }
  }

  /** Validates all business rules */
  public boolean isValid() {
    return (hasValidDeadlines()
        && hasValidFinancialInfo()
        && hasValidProgramLevel()
        && hasValidClientConstraints());
  }
}

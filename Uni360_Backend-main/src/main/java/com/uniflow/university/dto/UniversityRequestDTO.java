package com.uniflow.university.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.r2dbc.postgresql.codec.Json;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UniversityRequestDTO - Data Transfer Object for University Creation and
 * Updates
 *
 * <p>
 * This DTO handles incoming requests for creating and updating university
 * information. It
 * includes comprehensive validation rules and supports multi-client
 * configurations.
 *
 * <p>
 * Key Features: - Complete university data management - Geographic and location
 * information -
 * Academic and ranking data - Financial and admission requirements -
 * Multi-client support (UniFLow,
 * UNI360) - Comprehensive validation
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversityRequestDTO {

    // Basic University Information
    @NotBlank(message = "University name is required")
    @Size(max = 255, message = "University name cannot exceed 255 characters")
    @JsonProperty("name")
    private String name;

    @Size(max = 100, message = "Short name cannot exceed 100 characters")
    @JsonProperty("short_name")
    private String shortName;

    @Size(max = 50, message = "Code cannot exceed 50 characters")
    @JsonProperty("code")
    private String code;

    @NotBlank(message = "University type is required")
    @Pattern(regexp = "^(public|private|semi_private)$", message = "Invalid university type")
    @JsonProperty("type")
    private String type;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(active|inactive|pending|suspended)$", message = "Invalid status")
    @JsonProperty("status")
    private String status;

    // Location Information
    @NotBlank(message = "Country is required")
    @Pattern(regexp = "^(GB|DE)$", message = "Only United Kingdom (GB) and Germany (DE) are supported")
    @JsonProperty("country")
    private String country;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    @JsonProperty("state")
    private String state;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    @JsonProperty("city")
    private String city;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    @JsonProperty("address")
    private String address;

    @Pattern(regexp = "^[0-9]{5,10}$", message = "Invalid postal code format")
    @JsonProperty("postal_code")
    private String postalCode;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    @JsonProperty("latitude")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    @JsonProperty("longitude")
    private BigDecimal longitude;

    @Size(max = 50, message = "Timezone cannot exceed 50 characters")
    @JsonProperty("timezone")
    private String timezone;

    // Contact Information
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email cannot exceed 255 characters")
    @JsonProperty("email")
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    @JsonProperty("phone")
    private String phone;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid fax number format")
    @JsonProperty("fax")
    private String fax;

    @Pattern(regexp = "^https?://.+", message = "Invalid website URL format")
    @Size(max = 500, message = "Website URL cannot exceed 500 characters")
    @JsonProperty("website")
    private String website;

    // Academic Information
    @Min(value = 1800, message = "Founded year must be after 1800")
    @Max(value = 2024, message = "Founded year cannot be in the future")
    @JsonProperty("founded_year")
    private Integer foundedYear;

    @Pattern(regexp = "^(public|private|religious|military|specialized|research|technical|applied_sciences|business|medical|arts)$", message = "Invalid institution type. Must be one of: public, private, religious, military, specialized, research, technical, applied_sciences, business, medical, arts")
    @JsonProperty("institution_type")
    private String institutionType;

    @Size(max = 50, message = "Academic calendar cannot exceed 50 characters")
    @JsonProperty("academic_calendar")
    private String academicCalendar;

    @Size(max = 100, message = "Language of instruction cannot exceed 100 characters")
    @JsonProperty("language_of_instruction")
    private String languageOfInstruction;

    @Min(value = 0, message = "Student population cannot be negative")
    @JsonProperty("student_population")
    private Integer studentPopulation;

    @Min(value = 0, message = "Faculty count cannot be negative")
    @JsonProperty("faculty_count")
    private Integer facultyCount;

    @Min(value = 0, message = "International students cannot be negative")
    @JsonProperty("international_students")
    private Integer internationalStudents;

    // Rankings and Recognition
    @Min(value = 1, message = "World ranking must be positive")
    @JsonProperty("world_ranking")
    private Integer worldRanking;

    @Min(value = 1, message = "National ranking must be positive")
    @JsonProperty("national_ranking")
    private Integer nationalRanking;

    @DecimalMin(value = "0.0", message = "QS ranking score cannot be negative")
    @DecimalMax(value = "100.0", message = "QS ranking score cannot exceed 100")
    @JsonProperty("qs_ranking_score")
    private BigDecimal qsRankingScore;

    @DecimalMin(value = "0.0", message = "Times ranking score cannot be negative")
    @DecimalMax(value = "100.0", message = "Times ranking score cannot exceed 100")
    @JsonProperty("times_ranking_score")
    private BigDecimal timesRankingScore;

    @JsonProperty("accreditations")
    private Json accreditations;

    // Financial Information
    @DecimalMin(value = "0.0", message = "Tuition fee cannot be negative")
    @JsonProperty("tuition_fee_local")
    private BigDecimal tuitionFeeLocal;

    @DecimalMin(value = "0.0", message = "Tuition fee cannot be negative")
    @JsonProperty("tuition_fee_international")
    private BigDecimal tuitionFeeInternational;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Invalid currency code")
    @JsonProperty("currency")
    private String currency;

    @DecimalMin(value = "0.0", message = "Application fee cannot be negative")
    @JsonProperty("application_fee")
    private BigDecimal applicationFee;

    @DecimalMin(value = "0.0", message = "Living cost cannot be negative")
    @JsonProperty("living_cost")
    private BigDecimal livingCost;

    @JsonProperty("scholarships_available")
    private Boolean scholarshipsAvailable;

    @JsonProperty("financial_aid_available")
    private Boolean financialAidAvailable;

    // Admission Requirements
    @DecimalMin(value = "0.0", message = "Minimum GPA cannot be negative")
    @DecimalMax(value = "6.0", message = "Minimum GPA cannot exceed 6.0 (supports international grading scales)")
    @JsonProperty("min_gpa")
    private BigDecimal minGpa;

    @Min(value = 0, message = "Minimum IELTS score cannot be negative")
    @Max(value = 9, message = "Minimum IELTS score cannot exceed 9")
    @JsonProperty("min_ielts")
    private BigDecimal minIelts;

    @Min(value = 0, message = "Minimum TOEFL score cannot be negative")
    @Max(value = 120, message = "Minimum TOEFL score cannot exceed 120")
    @JsonProperty("min_toefl")
    private Integer minToefl;

    @Min(value = 200, message = "Minimum GRE score must be at least 200")
    @Max(value = 340, message = "Minimum GRE score cannot exceed 340")
    @JsonProperty("min_gre")
    private Integer minGre;

    @Min(value = 200, message = "Minimum GMAT score must be at least 200")
    @Max(value = 800, message = "Minimum GMAT score cannot exceed 800")
    @JsonProperty("min_gmat")
    private Integer minGmat;

    @JsonProperty("application_deadlines")
    private Map<String, String> applicationDeadlines;

    @JsonProperty("required_documents")
    private List<String> requiredDocuments;

    // Programs and Facilities
    @JsonProperty("programs_offered")
    private List<String> programsOffered;

    @JsonProperty("popular_programs")
    private List<String> popularPrograms;

    @JsonProperty("research_areas")
    private List<String> researchAreas;

    @JsonProperty("facilities")
    private List<String> facilities;

    @JsonProperty("accommodation_available")
    private Boolean accommodationAvailable;

    @JsonProperty("campus_size")
    private String campusSize;

    // Support Services
    @JsonProperty("international_office")
    private Boolean internationalOffice;

    @JsonProperty("career_services")
    private Boolean careerServices;

    @JsonProperty("library_services")
    private Boolean libraryServices;

    @JsonProperty("health_services")
    private Boolean healthServices;

    @JsonProperty("sports_facilities")
    private Boolean sportsFacilities;

    // Multi-client Configuration
    @NotBlank(message = "Client ID is required")
    @Pattern(regexp = "^(uniflow|uni360)$", message = "Invalid client ID")
    @JsonProperty("client_id")
    private String clientId;

    @Size(max = 50, message = "Tenant ID cannot exceed 50 characters")
    @JsonProperty("tenant_id")
    private String tenantId;

    @Size(max = 50, message = "Region cannot exceed 50 characters")
    @JsonProperty("region")
    private String region;

    @Size(max = 50, message = "Territory cannot exceed 50 characters")
    @JsonProperty("territory")
    private String territory;

    // Additional Information
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @JsonProperty("description")
    private String description;

    @Size(max = 1000, message = "Admission process cannot exceed 1000 characters")
    @JsonProperty("admission_process")
    private String admissionProcess;

    @JsonProperty("tags")
    private List<String> tags;

    @JsonProperty("social_media")
    private Map<String, String> socialMedia;

    // Flexible Data Fields
    @JsonProperty("additional_data")
    private Map<String, Object> additionalData;

    @JsonProperty("custom_fields")
    private Map<String, Object> customFields;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    // Validation Methods

    /** Validates that contact information is provided */
    public boolean hasValidContactInfo() {
        return email != null || phone != null || website != null;
    }

    /** Validates that location coordinates are consistent */
    public boolean hasValidCoordinates() {
        return ((latitude == null && longitude == null) ||
                (latitude != null && longitude != null));
    }

    /** Validates that financial information is consistent */
    public boolean hasValidFinancialInfo() {
        if (tuitionFeeLocal != null || tuitionFeeInternational != null) {
            return currency != null;
        }
        return true;
    }

    /** Validates client-specific constraints */
    public boolean hasValidClientConstraints() {
        if ("uniflow".equals(clientId)) {
            // UniFLow specific validations
            return true;
        } else if ("uni360".equals(clientId)) {
            // UNI360 specific validations
            return true;
        }
        return true;
    }

    /** Sets default values based on client and region */
    public void setDefaults() {
        if (status == null) {
            status = "ACTIVE";
        }

        if (type == null) {
            type = "public";
        }

        if (institutionType == null) {
            institutionType = "public";
        }

        if (academicCalendar == null) {
            academicCalendar = "semester";
        }

        if (languageOfInstruction == null) {
            languageOfInstruction = "English";
        }

        if (timezone == null && country != null) {
            // Set default timezone based on country
            timezone = getDefaultTimezoneForCountry(country);
        }

        if (currency == null && country != null) {
            // Set default currency based on country
            currency = getDefaultCurrencyForCountry(country);
        }

        // Set boolean defaults
        if (scholarshipsAvailable == null) {
            scholarshipsAvailable = false;
        }
        if (financialAidAvailable == null) {
            financialAidAvailable = false;
        }
        if (accommodationAvailable == null) {
            accommodationAvailable = false;
        }
    }

    /** Validates all business rules */
    public boolean isValid() {
        return (hasValidContactInfo() &&
                hasValidCoordinates() &&
                hasValidFinancialInfo() &&
                hasValidClientConstraints());
    }

    // Helper methods for defaults
    private String getDefaultTimezoneForCountry(String countryCode) {
        return switch (countryCode.toUpperCase()) {
            case "US" -> "America/New_York";
            case "CA" -> "America/Toronto";
            case "GB" -> "Europe/London";
            case "AU" -> "Australia/Sydney";
            case "DE" -> "Europe/Berlin";
            case "FR" -> "Europe/Paris";
            case "JP" -> "Asia/Tokyo";
            case "CN" -> "Asia/Shanghai";
            case "IN" -> "Asia/Kolkata";
            case "SG" -> "Asia/Singapore";
            default -> "UTC";
        };
    }

    private String getDefaultCurrencyForCountry(String countryCode) {
        return switch (countryCode.toUpperCase()) {
            case "US" -> "USD";
            case "CA" -> "CAD";
            case "GB" -> "GBP";
            case "AU" -> "AUD";
            case "DE", "FR", "IT", "ES", "NL" -> "EUR";
            case "JP" -> "JPY";
            case "CN" -> "CNY";
            case "IN" -> "INR";
            case "SG" -> "SGD";
            default -> "USD";
        };
    }
}

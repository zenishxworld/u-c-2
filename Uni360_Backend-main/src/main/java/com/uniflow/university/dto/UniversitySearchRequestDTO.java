package com.uniflow.university.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UniversitySearchRequestDTO - Data Transfer Object for Advanced University Search
 *
 * <p>This DTO handles complex search requests for universities with multiple filter criteria,
 * sorting options, and pagination support. It provides comprehensive search capabilities for the
 * universities service.
 *
 * <p>Key Features: - Multiple filter criteria with validation - Geographic search with radius
 * support - Academic and ranking filters - Financial information filtering - Admission requirements
 * filtering - Multi-client and territory filtering - Sorting and pagination support - Full-text
 * search capabilities
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversitySearchRequestDTO {

    // Basic Search Criteria
    @JsonProperty("search_term")
    private String searchTerm;

    @JsonProperty("university_name")
    private String universityName;

    @JsonProperty("university_code")
    private String universityCode;

    // Status and Type Filters
    @JsonProperty("status")
    @Pattern(
        regexp = "^(active|inactive|pending|suspended)$",
        message = "Invalid status"
    )
    private String status;

    @JsonProperty("statuses")
    private List<String> statuses;

    @JsonProperty("type")
    @Pattern(
        regexp = "^(public|private|semi_private)$",
        message = "Invalid university type"
    )
    private String type;

    @JsonProperty("types")
    private List<String> types;

    @JsonProperty("institution_type")
    @Pattern(
        regexp = "^(public|private|religious|military|specialized)$",
        message = "Invalid institution type"
    )
    private String institutionType;

    @JsonProperty("institution_types")
    private List<String> institutionTypes;

    // Geographic Filters
    @JsonProperty("country")
    @Pattern(regexp = "^[A-Z]{2}$", message = "Invalid country code format")
    private String country;

    @JsonProperty("countries")
    private List<String> countries;

    @JsonProperty("state")
    private String state;

    @JsonProperty("states")
    private List<String> states;

    @JsonProperty("city")
    private String city;

    @JsonProperty("cities")
    private List<String> cities;

    @JsonProperty("region")
    private String region;

    @JsonProperty("regions")
    private List<String> regions;

    // Geographic Search (Radius-based)
    @JsonProperty("latitude")
    @DecimalMin(
        value = "-90.0",
        message = "Latitude must be between -90 and 90"
    )
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private BigDecimal latitude;

    @JsonProperty("longitude")
    @DecimalMin(
        value = "-180.0",
        message = "Longitude must be between -180 and 180"
    )
    @DecimalMax(
        value = "180.0",
        message = "Longitude must be between -180 and 180"
    )
    private BigDecimal longitude;

    @JsonProperty("radius_km")
    @Min(value = 1, message = "Radius must be at least 1 km")
    @Max(value = 20000, message = "Radius cannot exceed 20000 km")
    private Integer radiusKm;

    // Academic Information Filters
    @JsonProperty("founded_year_min")
    @Min(value = 1800, message = "Founded year must be after 1800")
    private Integer foundedYearMin;

    @JsonProperty("founded_year_max")
    @Max(value = 2024, message = "Founded year cannot be in the future")
    private Integer foundedYearMax;

    @JsonProperty("language_of_instruction")
    private String languageOfInstruction;

    @JsonProperty("languages_of_instruction")
    private List<String> languagesOfInstruction;

    @JsonProperty("academic_calendar")
    private String academicCalendar;

    @JsonProperty("academic_calendars")
    private List<String> academicCalendars;

    // Student Population Filters
    @JsonProperty("student_population_min")
    @Min(value = 0, message = "Student population minimum cannot be negative")
    private Integer studentPopulationMin;

    @JsonProperty("student_population_max")
    @Min(value = 0, message = "Student population maximum cannot be negative")
    private Integer studentPopulationMax;

    @JsonProperty("faculty_count_min")
    @Min(value = 0, message = "Faculty count minimum cannot be negative")
    private Integer facultyCountMin;

    @JsonProperty("faculty_count_max")
    @Min(value = 0, message = "Faculty count maximum cannot be negative")
    private Integer facultyCountMax;

    @JsonProperty("international_students_min")
    @Min(
        value = 0,
        message = "International students minimum cannot be negative"
    )
    private Integer internationalStudentsMin;

    @JsonProperty("international_students_max")
    @Min(
        value = 0,
        message = "International students maximum cannot be negative"
    )
    private Integer internationalStudentsMax;

    // Ranking Filters
    @JsonProperty("world_ranking_min")
    @Min(value = 1, message = "World ranking minimum must be positive")
    private Integer worldRankingMin;

    @JsonProperty("world_ranking_max")
    @Min(value = 1, message = "World ranking maximum must be positive")
    private Integer worldRankingMax;

    @JsonProperty("national_ranking_min")
    @Min(value = 1, message = "National ranking minimum must be positive")
    private Integer nationalRankingMin;

    @JsonProperty("national_ranking_max")
    @Min(value = 1, message = "National ranking maximum must be positive")
    private Integer nationalRankingMax;

    @JsonProperty("qs_ranking_score_min")
    @DecimalMin(
        value = "0.0",
        message = "QS ranking score minimum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "QS ranking score minimum cannot exceed 100"
    )
    private BigDecimal qsRankingScoreMin;

    @JsonProperty("qs_ranking_score_max")
    @DecimalMin(
        value = "0.0",
        message = "QS ranking score maximum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "QS ranking score maximum cannot exceed 100"
    )
    private BigDecimal qsRankingScoreMax;

    @JsonProperty("times_ranking_score_min")
    @DecimalMin(
        value = "0.0",
        message = "Times ranking score minimum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Times ranking score minimum cannot exceed 100"
    )
    private BigDecimal timesRankingScoreMin;

    @JsonProperty("times_ranking_score_max")
    @DecimalMin(
        value = "0.0",
        message = "Times ranking score maximum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Times ranking score maximum cannot exceed 100"
    )
    private BigDecimal timesRankingScoreMax;

    // Financial Filters
    @JsonProperty("tuition_fee_local_min")
    @DecimalMin(
        value = "0.0",
        message = "Tuition fee minimum cannot be negative"
    )
    private BigDecimal tuitionFeeLocalMin;

    @JsonProperty("tuition_fee_local_max")
    @DecimalMin(
        value = "0.0",
        message = "Tuition fee maximum cannot be negative"
    )
    private BigDecimal tuitionFeeLocalMax;

    @JsonProperty("tuition_fee_international_min")
    @DecimalMin(
        value = "0.0",
        message = "Tuition fee minimum cannot be negative"
    )
    private BigDecimal tuitionFeeInternationalMin;

    @JsonProperty("tuition_fee_international_max")
    @DecimalMin(
        value = "0.0",
        message = "Tuition fee maximum cannot be negative"
    )
    private BigDecimal tuitionFeeInternationalMax;

    @JsonProperty("currency")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Invalid currency code")
    private String currency;

    @JsonProperty("currencies")
    private List<String> currencies;

    @JsonProperty("application_fee_min")
    @DecimalMin(
        value = "0.0",
        message = "Application fee minimum cannot be negative"
    )
    private BigDecimal applicationFeeMin;

    @JsonProperty("application_fee_max")
    @DecimalMin(
        value = "0.0",
        message = "Application fee maximum cannot be negative"
    )
    private BigDecimal applicationFeeMax;

    @JsonProperty("living_cost_min")
    @DecimalMin(
        value = "0.0",
        message = "Living cost minimum cannot be negative"
    )
    private BigDecimal livingCostMin;

    @JsonProperty("living_cost_max")
    @DecimalMin(
        value = "0.0",
        message = "Living cost maximum cannot be negative"
    )
    private BigDecimal livingCostMax;

    @JsonProperty("scholarships_available")
    private Boolean scholarshipsAvailable;

    @JsonProperty("financial_aid_available")
    private Boolean financialAidAvailable;

    // Admission Requirements Filters
    @JsonProperty("min_gpa_max")
    @DecimalMin(value = "0.0", message = "Minimum GPA cannot be negative")
    @DecimalMax(
        value = "6.0",
        message = "Minimum GPA cannot exceed 6.0 (supports international grading scales)"
    )
    private BigDecimal minGpaMax;

    @JsonProperty("min_ielts_max")
    @Min(value = 0, message = "Minimum IELTS score cannot be negative")
    @Max(value = 9, message = "Minimum IELTS score cannot exceed 9")
    private BigDecimal minIeltsMax;

    @JsonProperty("min_toefl_max")
    @Min(value = 0, message = "Minimum TOEFL score cannot be negative")
    @Max(value = 120, message = "Minimum TOEFL score cannot exceed 120")
    private Integer minToeflMax;

    @JsonProperty("min_gre_max")
    @Min(value = 200, message = "Minimum GRE score must be at least 200")
    @Max(value = 340, message = "Minimum GRE score cannot exceed 340")
    private Integer minGreMax;

    @JsonProperty("min_gmat_max")
    @Min(value = 200, message = "Minimum GMAT score must be at least 200")
    @Max(value = 800, message = "Minimum GMAT score cannot exceed 800")
    private Integer minGmatMax;

    @JsonProperty("acceptance_rate_min")
    @DecimalMin(
        value = "0.0",
        message = "Acceptance rate minimum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Acceptance rate minimum cannot exceed 100"
    )
    private BigDecimal acceptanceRateMin;

    @JsonProperty("acceptance_rate_max")
    @DecimalMin(
        value = "0.0",
        message = "Acceptance rate maximum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Acceptance rate maximum cannot exceed 100"
    )
    private BigDecimal acceptanceRateMax;

    // Programs and Facilities Filters
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

    @JsonProperty("campus_sizes")
    private List<String> campusSizes;

    // Support Services Filters
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

    // Quality and Performance Filters
    @JsonProperty("employment_rate_min")
    @DecimalMin(
        value = "0.0",
        message = "Employment rate minimum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Employment rate minimum cannot exceed 100"
    )
    private BigDecimal employmentRateMin;

    @JsonProperty("graduation_rate_min")
    @DecimalMin(
        value = "0.0",
        message = "Graduation rate minimum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Graduation rate minimum cannot exceed 100"
    )
    private BigDecimal graduationRateMin;

    @JsonProperty("student_satisfaction_score_min")
    @DecimalMin(
        value = "0.0",
        message = "Student satisfaction score minimum cannot be negative"
    )
    @DecimalMax(
        value = "100.0",
        message = "Student satisfaction score minimum cannot exceed 100"
    )
    private BigDecimal studentSatisfactionScoreMin;

    // Accreditation and Recognition Filters
    @JsonProperty("accreditations")
    private List<String> accreditations;

    @JsonProperty("recognitions")
    private List<String> recognitions;

    @JsonProperty("has_accreditation")
    private Boolean hasAccreditation;

    // Multi-client and Regional Filters
    @JsonProperty("client_id")
    @Pattern(regexp = "^(uniflow|uni360)$", message = "Invalid client ID")
    private String clientId;

    @JsonProperty("client_ids")
    private List<String> clientIds;

    @JsonProperty("tenant_id")
    private String tenantId;

    @JsonProperty("territory")
    private String territory;

    @JsonProperty("territories")
    private List<String> territories;

    // Application and Partnership Filters
    @JsonProperty("partner_university")
    private Boolean partnerUniversity;

    @JsonProperty("direct_application")
    private Boolean directApplication;

    @JsonProperty("agent_application")
    private Boolean agentApplication;

    @JsonProperty("processing_time_days_max")
    @Min(value = 0, message = "Processing time maximum cannot be negative")
    private Integer processingTimeDaysMax;

    // Tags and Categories
    @JsonProperty("tags")
    private List<String> tags;

    @JsonProperty("categories")
    private List<String> categories;

    // Date Range Filters
    @JsonProperty("created_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdFrom;

    @JsonProperty("created_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTo;

    @JsonProperty("updated_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedFrom;

    @JsonProperty("updated_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedTo;

    // Sorting Options
    @JsonProperty("sort_by")
    @Pattern(
        regexp = "^(name|ranking|tuition|founded|popularity|rating|location|distance)$",
        message = "Invalid sort field"
    )
    private String sortBy;

    @JsonProperty("sort_direction")
    @Pattern(regexp = "^(asc|desc)$", message = "Invalid sort direction")
    private String sortDirection;

    @JsonProperty("secondary_sort_by")
    private String secondarySortBy;

    @JsonProperty("secondary_sort_direction")
    @Pattern(
        regexp = "^(asc|desc)$",
        message = "Invalid secondary sort direction"
    )
    private String secondarySortDirection;

    // Pagination
    @JsonProperty("page")
    @Min(value = 0, message = "Page number cannot be negative")
    private Integer page;

    @JsonProperty("size")
    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 1000, message = "Page size cannot exceed 1000")
    private Integer size;

    @JsonProperty("offset")
    @Min(value = 0, message = "Offset cannot be negative")
    private Integer offset;

    @JsonProperty("limit")
    @Min(value = 1, message = "Limit must be at least 1")
    @Max(value = 1000, message = "Limit cannot exceed 1000")
    private Integer limit;

    // Result Options
    @JsonProperty("include_inactive")
    private Boolean includeInactive;

    @JsonProperty("count_only")
    private Boolean countOnly;

    @JsonProperty("distinct_field")
    private String distinctField;

    // Aggregation Options
    @JsonProperty("group_by")
    private String groupBy;

    @JsonProperty("aggregate_function")
    @Pattern(
        regexp = "^(count|sum|avg|min|max)$",
        message = "Invalid aggregate function"
    )
    private String aggregateFunction;

    @JsonProperty("aggregate_field")
    private String aggregateField;

    // Custom Field Filters (JSONB)
    @JsonProperty("custom_field_filters")
    private Map<String, Object> customFieldFilters;

    @JsonProperty("additional_data_filters")
    private Map<String, Object> additionalDataFilters;

    @JsonProperty("metadata_filters")
    private Map<String, Object> metadataFilters;

    // Validation Methods

    /** Validates that range filters are logically correct */
    public boolean hasValidRanges() {
        // Student population range
        if (
            studentPopulationMin != null &&
            studentPopulationMax != null &&
            studentPopulationMin > studentPopulationMax
        ) {
            return false;
        }

        // Faculty count range
        if (
            facultyCountMin != null &&
            facultyCountMax != null &&
            facultyCountMin > facultyCountMax
        ) {
            return false;
        }

        // Founded year range
        if (
            foundedYearMin != null &&
            foundedYearMax != null &&
            foundedYearMin > foundedYearMax
        ) {
            return false;
        }

        // Ranking ranges
        if (
            worldRankingMin != null &&
            worldRankingMax != null &&
            worldRankingMin > worldRankingMax
        ) {
            return false;
        }

        // Financial ranges
        if (
            tuitionFeeLocalMin != null &&
            tuitionFeeLocalMax != null &&
            tuitionFeeLocalMin.compareTo(tuitionFeeLocalMax) > 0
        ) {
            return false;
        }

        if (
            tuitionFeeInternationalMin != null &&
            tuitionFeeInternationalMax != null &&
            tuitionFeeInternationalMin.compareTo(tuitionFeeInternationalMax) > 0
        ) {
            return false;
        }

        return true;
    }

    /** Validates that geographic search parameters are consistent */
    public boolean hasValidGeographicSearch() {
        if (radiusKm != null) {
            return latitude != null && longitude != null;
        }
        return true;
    }

    /** Validates pagination parameters */
    public boolean hasValidPagination() {
        if (page != null && size != null) {
            return page >= 0 && size > 0 && size <= 1000;
        }
        if (offset != null && limit != null) {
            return offset >= 0 && limit > 0 && limit <= 1000;
        }
        return true;
    }

    /** Sets default values for common parameters */
    public void setDefaults() {
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
        if (sortBy == null) {
            sortBy = "name";
        }
        if (sortDirection == null) {
            sortDirection = "asc";
        }
        if (includeInactive == null) {
            includeInactive = false;
        }
        if (countOnly == null) {
            countOnly = false;
        }
    }

    /** Checks if this is a simple search (only basic criteria) */
    public boolean isSimpleSearch() {
        return (
            searchTerm != null ||
            universityName != null ||
            (country != null && countries == null) ||
            (city != null && cities == null)
        );
    }

    /** Checks if this is a geographic search */
    public boolean isGeographicSearch() {
        return latitude != null && longitude != null && radiusKm != null;
    }

    /** Checks if any financial filters are specified */
    public boolean hasFinancialFilters() {
        return (
            tuitionFeeLocalMin != null ||
            tuitionFeeLocalMax != null ||
            tuitionFeeInternationalMin != null ||
            tuitionFeeInternationalMax != null ||
            applicationFeeMin != null ||
            applicationFeeMax != null ||
            livingCostMin != null ||
            livingCostMax != null ||
            scholarshipsAvailable != null ||
            financialAidAvailable != null
        );
    }

    /** Checks if any ranking filters are specified */
    public boolean hasRankingFilters() {
        return (
            worldRankingMin != null ||
            worldRankingMax != null ||
            nationalRankingMin != null ||
            nationalRankingMax != null ||
            qsRankingScoreMin != null ||
            qsRankingScoreMax != null ||
            timesRankingScoreMin != null ||
            timesRankingScoreMax != null
        );
    }

    /** Validates all business rules for the search request */
    public boolean isValid() {
        return (
            hasValidRanges() &&
            hasValidGeographicSearch() &&
            hasValidPagination()
        );
    }

    /** Gets the effective page size for the request */
    public int getEffectivePageSize() {
        if (size != null) {
            return Math.min(size, 1000);
        }
        if (limit != null) {
            return Math.min(limit, 1000);
        }
        return 20; // default
    }

    /** Gets the effective page number for the request */
    public int getEffectivePageNumber() {
        if (page != null) {
            return Math.max(page, 0);
        }
        if (offset != null && getEffectivePageSize() > 0) {
            return offset / getEffectivePageSize();
        }
        return 0; // default
    }

    /** Converts this search request to a summary string for logging */
    public String toSummaryString() {
        StringBuilder summary = new StringBuilder();

        if (searchTerm != null) {
            summary.append("term:").append(searchTerm).append(" ");
        }
        if (country != null) {
            summary.append("country:").append(country).append(" ");
        }
        if (city != null) {
            summary.append("city:").append(city).append(" ");
        }
        if (type != null) {
            summary.append("type:").append(type).append(" ");
        }
        if (isGeographicSearch()) {
            summary
                .append("geo:")
                .append(latitude)
                .append(",")
                .append(longitude)
                .append("(")
                .append(radiusKm)
                .append("km) ");
        }
        if (hasRankingFilters()) {
            summary.append("ranked ");
        }
        if (hasFinancialFilters()) {
            summary.append("financial ");
        }

        summary
            .append("page:")
            .append(getEffectivePageNumber())
            .append(" size:")
            .append(getEffectivePageSize())
            .append(" sort:")
            .append(sortBy != null ? sortBy : "name")
            .append(":")
            .append(sortDirection != null ? sortDirection : "asc");

        return summary.toString().trim();
    }
}

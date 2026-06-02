package com.uniflow.university.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.r2dbc.postgresql.codec.Json;
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
 * UniversityResponseDTO - Data Transfer Object for University API Responses
 *
 * <p>This DTO handles outgoing responses for university information. It provides a comprehensive
 * view of university data for frontend consumption and external API integrations.
 *
 * <p>Key Features: - Complete university information for display - Calculated fields and business
 * logic results - Multi-client support with client-specific data - Geographic information and
 * mapping data - Academic rankings and recognition - Financial information and costs - Admission
 * requirements and deadlines
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
public class UniversityResponseDTO {

    // Primary Identifiers
    @JsonProperty("id")
    private UUID id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("short_name")
    private String shortName;

    @JsonProperty("code")
    private String code;

    @JsonProperty("type")
    private String type;

    @JsonProperty("status")
    private String status;

    @JsonProperty("is_active")
    private Boolean isActive;

    // Location Information
    @JsonProperty("country")
    private String country;

    @JsonProperty("country_name")
    private String countryName;

    @JsonProperty("state")
    private String state;

    @JsonProperty("city")
    private String city;

    @JsonProperty("address")
    private String address;

    @JsonProperty("postal_code")
    private String postalCode;

    @JsonProperty("latitude")
    private BigDecimal latitude;

    @JsonProperty("longitude")
    private BigDecimal longitude;

    @JsonProperty("timezone")
    private String timezone;

    @JsonProperty("full_address")
    private String fullAddress;

    // Contact Information
    @JsonProperty("email")
    private String email;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("fax")
    private String fax;

    @JsonProperty("website")
    private String website;

    // Academic Information
    @JsonProperty("founded_year")
    private Integer foundedYear;

    @JsonProperty("institution_type")
    private String institutionType;

    @JsonProperty("academic_calendar")
    private String academicCalendar;

    @JsonProperty("language_of_instruction")
    private String languageOfInstruction;

    @JsonProperty("student_population")
    private Integer studentPopulation;

    @JsonProperty("faculty_count")
    private Integer facultyCount;

    @JsonProperty("international_students")
    private Integer internationalStudents;

    @JsonProperty("student_faculty_ratio")
    private BigDecimal studentFacultyRatio;

    @JsonProperty("international_student_percentage")
    private BigDecimal internationalStudentPercentage;

    // Rankings and Recognition
    @JsonProperty("world_ranking")
    private Integer worldRanking;

    @JsonProperty("national_ranking")
    private Integer nationalRanking;

    @JsonProperty("qs_ranking_score")
    private BigDecimal qsRankingScore;

    @JsonProperty("times_ranking_score")
    private BigDecimal timesRankingScore;

    @JsonProperty("ranking_trend")
    private String rankingTrend;

    @JsonProperty("accreditations")
    private Json accreditations;

    @JsonProperty("recognitions")
    private Json recognitions;

    // Financial Information
    @JsonProperty("tuition_fee_local")
    private BigDecimal tuitionFeeLocal;

    @JsonProperty("tuition_fee_international")
    private BigDecimal tuitionFeeInternational;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("application_fee")
    private BigDecimal applicationFee;

    @JsonProperty("living_cost")
    private BigDecimal livingCost;

    @JsonProperty("total_cost_estimate")
    private BigDecimal totalCostEstimate;

    @JsonProperty("scholarships_available")
    private Boolean scholarshipsAvailable;

    @JsonProperty("financial_aid_available")
    private Boolean financialAidAvailable;

    @JsonProperty("scholarship_amount_range")
    private String scholarshipAmountRange;

    // Admission Requirements
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

    @JsonProperty("application_deadlines")
    private Map<String, String> applicationDeadlines;

    @JsonProperty("required_documents")
    private Json requiredDocuments;

    @JsonProperty("admission_requirements")
    private Map<String, Object> admissionRequirements;

    @JsonProperty("acceptance_rate")
    private BigDecimal acceptanceRate;

    // Programs and Facilities
    @JsonProperty("programs_offered")
    private Json programsOffered;

    @JsonProperty("popular_programs")
    private Json popularPrograms;

    @JsonProperty("research_areas")
    private Json researchAreas;

    @JsonProperty("facilities")
    private Json facilities;

    @JsonProperty("accommodation_available")
    private Boolean accommodationAvailable;

    @JsonProperty("campus_size")
    private String campusSize;

    @JsonProperty("number_of_programs")
    private Integer numberOfPrograms;

    @JsonProperty("research_opportunities")
    private Boolean researchOpportunities;

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

    @JsonProperty("student_support_services")
    private Json studentSupportServices;

    // Statistics and Analytics
    @JsonProperty("employment_rate")
    private BigDecimal employmentRate;

    @JsonProperty("average_salary")
    private BigDecimal averageSalary;

    @JsonProperty("graduation_rate")
    private BigDecimal graduationRate;

    @JsonProperty("research_funding")
    private BigDecimal researchFunding;

    @JsonProperty("publication_count")
    private Integer publicationCount;

    @JsonProperty("student_satisfaction_score")
    private BigDecimal studentSatisfactionScore;

    // Multi-client Configuration
    @JsonProperty("client_id")
    private String clientId;

    @JsonProperty("tenant_id")
    private String tenantId;

    @JsonProperty("region")
    private String region;

    @JsonProperty("territory")
    private String territory;

    @JsonProperty("visibility_settings")
    private Map<String, Boolean> visibilitySettings;

    // Additional Information
    @JsonProperty("description")
    private String description;

    @JsonProperty("admission_process")
    private String admissionProcess;

    @JsonProperty("tags")
    private Json tags;

    @JsonProperty("social_media")
    private Map<String, String> socialMedia;

    @JsonProperty("virtual_tour_url")
    private String virtualTourUrl;

    @JsonProperty("brochure_url")
    private String brochureUrl;

    // Application and Partnership Info
    @JsonProperty("partner_university")
    private Boolean partnerUniversity;

    @JsonProperty("application_process_type")
    private String applicationProcessType;

    @JsonProperty("direct_application")
    private Boolean directApplication;

    @JsonProperty("agent_application")
    private Boolean agentApplication;

    @JsonProperty("processing_time_days")
    private Integer processingTimeDays;

    // Media and Images
    @JsonProperty("logo_url")
    private String logoUrl;

    @JsonProperty("banner_image_url")
    private String bannerImageUrl;

    @JsonProperty("gallery_images")
    private Json galleryImages;

    @JsonProperty("video_urls")
    private Json videoUrls;

    // Flexible Data Fields
    @JsonProperty("additional_data")
    private Map<String, Object> additionalData;

    @JsonProperty("custom_fields")
    private Map<String, Object> customFields;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    // Course Information
    @JsonProperty("courses")
    private List<CourseResponseDTO> courses;

    // Audit Trail
    @JsonProperty("created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonProperty("created_by")
    private String createdBy;

    @JsonProperty("updated_by")
    private String updatedBy;

    @JsonProperty("version")
    private Long version;

    // Calculated Helper Fields
    @JsonProperty("is_prestigious")
    private Boolean isPrestigious;

    @JsonProperty("is_affordable")
    private Boolean isAffordable;

    @JsonProperty("is_international_friendly")
    private Boolean isInternationalFriendly;

    @JsonProperty("application_difficulty")
    private String applicationDifficulty;

    @JsonProperty("overall_rating")
    private BigDecimal overallRating;

    // Display Helper Methods (for frontend convenience)

    /** Gets a color code for status display */
    @JsonProperty("status_color")
    public String getStatusColor() {
        return switch (status != null ? status : "unknown") {
            case "active" -> "#10B981"; // green
            case "inactive" -> "#6B7280"; // gray
            case "pending" -> "#F59E0B"; // amber
            case "suspended" -> "#EF4444"; // red
            default -> "#6B7280"; // gray
        };
    }

    /** Gets an icon for status display */
    @JsonProperty("status_icon")
    public String getStatusIcon() {
        return switch (status != null ? status : "unknown") {
            case "active" -> "check-circle";
            case "inactive" -> "minus-circle";
            case "pending" -> "clock";
            case "suspended" -> "x-circle";
            default -> "help-circle";
        };
    }

    /** Gets ranking category for display */
    @JsonProperty("ranking_category")
    public String getRankingCategory() {
        if (worldRanking == null) return "Unranked";
        if (worldRanking <= 50) return "Top 50";
        if (worldRanking <= 100) return "Top 100";
        if (worldRanking <= 200) return "Top 200";
        if (worldRanking <= 500) return "Top 500";
        return "Ranked";
    }

    /** Gets tuition category for display */
    @JsonProperty("tuition_category")
    public String getTuitionCategory() {
        if (tuitionFeeInternational == null) return "Not Available";

        BigDecimal fee = tuitionFeeInternational;
        if (fee.compareTo(BigDecimal.valueOf(10000)) <= 0) return "Low Cost";
        if (fee.compareTo(BigDecimal.valueOf(25000)) <= 0) return "Moderate";
        if (fee.compareTo(BigDecimal.valueOf(50000)) <= 0) return "High";
        return "Premium";
    }

    /** Gets admission difficulty level */
    @JsonProperty("admission_difficulty_level")
    public String getAdmissionDifficultyLevel() {
        if (acceptanceRate == null) return "Unknown";

        if (
            acceptanceRate.compareTo(BigDecimal.valueOf(80)) >= 0
        ) return "Easy";
        if (
            acceptanceRate.compareTo(BigDecimal.valueOf(50)) >= 0
        ) return "Moderate";
        if (
            acceptanceRate.compareTo(BigDecimal.valueOf(20)) >= 0
        ) return "Difficult";
        return "Very Difficult";
    }

    /** Gets size category based on student population */
    @JsonProperty("size_category")
    public String getSizeCategory() {
        if (studentPopulation == null) return "Unknown";

        if (studentPopulation < 2000) return "Small";
        if (studentPopulation < 10000) return "Medium";
        if (studentPopulation < 30000) return "Large";
        return "Very Large";
    }

    /** Gets location display string */
    @JsonProperty("location_display")
    public String getLocationDisplay() {
        StringBuilder location = new StringBuilder();
        if (city != null) location.append(city);
        if (state != null) {
            if (location.length() > 0) location.append(", ");
            location.append(state);
        }
        if (countryName != null) {
            if (location.length() > 0) location.append(", ");
            location.append(countryName);
        }
        return location.toString();
    }

    /** Gets formatted tuition range */
    @JsonProperty("tuition_range_display")
    public String getTuitionRangeDisplay() {
        if (tuitionFeeLocal == null && tuitionFeeInternational == null) {
            return "Not Available";
        }

        StringBuilder range = new StringBuilder();
        if (currency != null) range.append(currency).append(" ");

        if (tuitionFeeLocal != null && tuitionFeeInternational != null) {
            BigDecimal min = tuitionFeeLocal.min(tuitionFeeInternational);
            BigDecimal max = tuitionFeeLocal.max(tuitionFeeInternational);
            range.append(min.toString()).append(" - ").append(max.toString());
        } else if (tuitionFeeInternational != null) {
            range.append(tuitionFeeInternational.toString());
        } else if (tuitionFeeLocal != null) {
            range.append(tuitionFeeLocal.toString());
        }

        return range.toString();
    }

    /** Gets overall university score for ranking/sorting */
    @JsonProperty("university_score")
    public BigDecimal getUniversityScore() {
        BigDecimal score = BigDecimal.ZERO;
        int factors = 0;

        // World ranking (inverse score, lower rank = higher score)
        if (worldRanking != null && worldRanking > 0) {
            score = score.add(
                BigDecimal.valueOf(1000 - Math.min(worldRanking, 1000))
            );
            factors++;
        }

        // QS ranking score
        if (qsRankingScore != null) {
            score = score.add(qsRankingScore.multiply(BigDecimal.valueOf(10)));
            factors++;
        }

        // Times ranking score
        if (timesRankingScore != null) {
            score = score.add(
                timesRankingScore.multiply(BigDecimal.valueOf(10))
            );
            factors++;
        }

        // Student satisfaction
        if (studentSatisfactionScore != null) {
            score = score.add(
                studentSatisfactionScore.multiply(BigDecimal.valueOf(5))
            );
            factors++;
        }

        // Employment rate
        if (employmentRate != null) {
            score = score.add(employmentRate.multiply(BigDecimal.valueOf(2)));
            factors++;
        }

        if (factors == 0) return BigDecimal.ZERO;
        return score.divide(
            BigDecimal.valueOf(factors),
            2,
            BigDecimal.ROUND_HALF_UP
        );
    }

    /** Checks if university is recommended based on various factors */
    @JsonProperty("is_recommended")
    public Boolean getIsRecommended() {
        int positiveFactors = 0;
        int totalFactors = 0;

        // Check ranking
        if (worldRanking != null) {
            totalFactors++;
            if (worldRanking <= 500) positiveFactors++;
        }

        // Check accreditations
        if (accreditations != null) {
            totalFactors++;
            String jsonStr = accreditations.asString();
            if (
                jsonStr != null &&
                !jsonStr.equals("[]") &&
                !jsonStr.equals("null")
            ) {
                positiveFactors++;
            }
        }

        // Check support services
        totalFactors++;
        if (
            Boolean.TRUE.equals(internationalOffice) &&
            Boolean.TRUE.equals(careerServices)
        ) {
            positiveFactors++;
        }

        // Check scholarship availability
        if (scholarshipsAvailable != null) {
            totalFactors++;
            if (Boolean.TRUE.equals(scholarshipsAvailable)) positiveFactors++;
        }

        // Check acceptance rate (moderate acceptance rate is good)
        if (acceptanceRate != null) {
            totalFactors++;
            if (
                acceptanceRate.compareTo(BigDecimal.valueOf(20)) >= 0 &&
                acceptanceRate.compareTo(BigDecimal.valueOf(80)) <= 0
            ) {
                positiveFactors++;
            }
        }

        return (
            totalFactors > 0 && ((double) positiveFactors / totalFactors) >= 0.6
        );
    }

    /** Gets application timeline estimate */
    @JsonProperty("application_timeline")
    public String getApplicationTimeline() {
        if (processingTimeDays == null) return "Contact University";

        if (processingTimeDays <= 30) return "1 Month";
        if (processingTimeDays <= 60) return "2 Months";
        if (processingTimeDays <= 90) return "3 Months";
        return "3+ Months";
    }
}

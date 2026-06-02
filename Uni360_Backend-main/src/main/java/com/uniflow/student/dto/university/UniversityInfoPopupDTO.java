package com.uniflow.student.dto.university;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for university information popup/modal in student portal
 * Comprehensive university details for informed decision making
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UniversityInfoPopupDTO {

    private UUID id;
    private String name;
    private String code;
    private String officialName;

    // Location & Basic Info
    private String country;
    private String city;
    private String state;
    private String address;
    private String postalCode;
    private String timezone;

    // Visual assets
    private String logoUrl;
    private String bannerUrl;
    private List<String> campusImages;

    // University Profile
    private String establishedYear;
    private String universityType; // Public, Private, Religious, etc.
    private String motto;
    private String description;
    private List<String> keyStrengths;

    // Rankings & Recognition
    private Integer worldRanking;
    private Integer nationalRanking;
    private String rankingSource; // QS, Times, etc.
    private List<Map<String, Object>> allRankings; // Multiple ranking systems
    private List<String> accreditations;
    private List<String> memberships;

    // Academic Information
    private Integer totalStudents;
    private Integer internationalStudents;
    private Integer totalFaculty;
    private String studentFacultyRatio;
    private Integer totalCourses;
    private List<String> faculties; // Engineering, Business, etc.
    private List<String> researchAreas;

    // Financial Information
    private BigDecimal tuitionDomestic;
    private BigDecimal tuitionInternational;
    private String currency;
    private Map<String, BigDecimal> feeBreakdown; // Tuition, Housing, etc.
    private Boolean scholarshipsAvailable;
    private List<Map<String, Object>> scholarshipTypes;
    private BigDecimal livingCostEstimate;

    // Application Requirements
    private String applicationDeadline;
    private String earlyApplicationDeadline;
    private List<String> intakeSeasons;
    private Map<String, String> englishRequirements; // IELTS, TOEFL scores
    private List<String> requiredDocuments;
    private String applicationFee;
    private Integer processingTimeDays;

    // Campus & Facilities
    private String campusSize;
    private String campusType; // Urban, Suburban, Rural
    private List<String> facilities;
    private String accommodation; // On-campus, Off-campus, Both
    private Integer accommodationCapacity;
    private String transportation;

    // Student Life
    private Integer studentClubs;
    private List<String> sportsTeams;
    private String diversityIndex;
    private List<String> campusActivities;
    private String careerServicesRating;

    // Popular Courses Preview
    private List<StudentCourseDTO> popularCourses; // Top 5-10 courses
    private List<String> strongPrograms;

    // Contact & Links
    private String website;
    private String admissionsEmail;
    private String internationalOfficeEmail;
    private String phone;
    private Map<String, String> socialMedia;

    // Student Reviews & Stats
    private Double satisfactionRating; // 1-5 stars
    private Integer totalReviews;
    private Map<String, Double> ratingBreakdown; // Academic, Campus, etc.
    private String graduationRate;
    private String employmentRate;

    // Application Specific
    private Boolean hasApplied;
    private String applicationStatus;
    private Boolean isFavorite;
    private String matchScore;
    private List<String> matchReasons;

    // Quick Actions Data
    private Boolean canApplyNow;
    private String applicationUrl;
    private String virtualTourUrl;
    private String brochureUrl;

    // Additional Resources
    private List<Map<String, String>> relatedLinks;
    private List<String> videoTours;
    private String admissionsCounselor;
}

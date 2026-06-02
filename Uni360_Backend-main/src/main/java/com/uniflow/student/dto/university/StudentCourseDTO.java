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
 * DTO for displaying course information in student portal
 * Student-focused course details for decision making
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentCourseDTO {

    private UUID id;
    private UUID universityId;
    private String universityName;
    private String universityCode;
    private String universityCountry;

    // Course Basic Info
    private String name;
    private String officialName;
    private String courseCode;
    private String shortDescription;
    private String fullDescription;

    // Academic Details
    private String degreeLevel; // Bachelor, Master, PhD, Certificate
    private String degreeType; // BA, BSc, MA, MSc, etc.
    private String fieldOfStudy; // Computer Science, Business, etc.
    private String subjectArea; // Technology, Arts, Sciences
    private String studyMode; // Full-time, Part-time, Online, Hybrid
    private Double durationYears;
    private String durationDisplay; // "2 years", "18 months"
    private Integer totalCredits;

    // Financial Information
    private BigDecimal tuitionLocal;
    private BigDecimal tuitionInternational;
    private String currency;
    private String tuitionDisplay; // "$25,000 USD per year"
    private BigDecimal applicationFee;
    private Boolean scholarshipsAvailable;
    private List<String> scholarshipTypes;

    // Entry Requirements
    private String minimumGPA;
    private Map<String, String> englishRequirements; // IELTS, TOEFL
    private List<String> prerequisites;
    private List<String> requiredDocuments;
    private String workExperienceRequired;

    // Application Info
    private List<String> intakeSeasons; // Fall, Spring, Summer
    private String applicationDeadline;
    private String earlyApplicationDeadline;
    private Integer processingTimeDays;
    private Boolean isApplicationOpen;

    // Course Structure
    private Integer totalSubjects;
    private List<String> coreSubjects; // Top 5-8 core subjects
    private List<String> specializations;
    private String practicalComponent; // Internship, Project, Thesis
    private Boolean hasInternship;
    private Boolean hasThesis;

    // Career Prospects
    private List<String> careerOpportunities;
    private String averageSalary;
    private String employmentRate;
    private List<String> topEmployers;
    private String industryDemand; // High, Moderate, Growing

    // Course Features
    private Boolean isPopular;
    private Boolean isFeatured;
    private Boolean hasVirtualTour;
    private String deliveryMethod; // On-campus, Online, Blended
    private String classSize; // Small, Medium, Large
    private String facultyRatio;

    // Student Experience
    private Double rating; // 1-5 star rating
    private Integer totalReviews;
    private List<String> studentReviews; // Brief excerpts
    private String difficultyLevel; // Beginner, Intermediate, Advanced

    // Application Status
    private Boolean hasApplied;
    private String applicationStatus;
    private Boolean isFavorite;
    private String matchScore; // How well it matches student profile
    private List<String> matchReasons;

    // Quick Actions
    private Boolean canApplyNow;
    private String applicationUrl;
    private String courseUrl;
    private String brochureUrl;

    // Additional Info
    private String lastUpdated;
    private String courseRanking; // If subject-specific ranking available
    private List<String> industryConnections;
    private Boolean hasClinicalPlacement; // For medical/health courses
    private Boolean hasLabWork; // For science/engineering courses
}

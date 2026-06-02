package com.uniflow.university.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseExcelDto {

    // University reference (required for linking)
    @NotBlank(message = "University code is required")
    private String universityCode;

    // Basic required fields
    @NotBlank(message = "Course name is required")
    @Size(max = 500, message = "Course name must not exceed 500 characters")
    private String name;

    @Size(max = 50, message = "Course code must not exceed 50 characters")
    private String courseCode;

    // Course details
    private String officialName;

    @NotBlank(message = "Degree level is required")
    private String degreeLevel; // BACHELORS, MASTERS, DOCTORATE, DIPLOMA

    @NotBlank(message = "Degree type is required")
    private String degreeType; // Bachelor of Science, Master of Arts, etc.

    @NotBlank(message = "Field of study is required")
    private String fieldOfStudy; // Computer Science, Engineering, etc.

    private String subjectArea; // Engineering, Humanities, Sciences, etc.
    private String academicDepartment;

    // Duration and study mode
    @DecimalMin(value = "0.5", message = "Duration must be at least 0.5 years")
    @DecimalMax(value = "10.0", message = "Duration cannot exceed 10 years")
    private BigDecimal durationYears;

    private String studyMode; // FULL_TIME, PART_TIME, ONLINE, HYBRID

    // Financial information
    @DecimalMin(value = "0.0", message = "Tuition cannot be negative")
    private BigDecimal tuitionInternational;

    @DecimalMin(value = "0.0", message = "Tuition cannot be negative")
    private BigDecimal tuitionDomestic;

    private String currency;

    // Admission requirements
    @DecimalMin(value = "0.0", message = "Minimum GPA cannot be negative")
    @DecimalMax(
        value = "6.0",
        message = "Minimum GPA cannot exceed 6.0 (supports international grading scales)"
    )
    private BigDecimal minGpa;

    private Boolean bachelorRequired;
    private Boolean masterRequired;
    private Boolean bachelorPhilosophy;
    private Boolean bachelorEngineering;
    private Boolean abiturRequired;
    private Boolean thesisRequired;

    // Language requirements
    private String germanProficiency; // A1, A2, B1, B2, C1, C2
    private String englishProficiency; // A1, A2, B1, B2, C1, C2

    @Min(value = 0, message = "TOEFL score cannot be negative")
    @Max(value = 120, message = "TOEFL score cannot exceed 120")
    private Integer toeflMin;

    @DecimalMin(value = "0.0", message = "IELTS score cannot be negative")
    @DecimalMax(value = "9.0", message = "IELTS score cannot exceed 9.0")
    private BigDecimal ieltsMin;

    // Prerequisites
    private Boolean mathematicsPrerequisite;
    private Boolean physicsPrerequisite;
    private Boolean chemistryPrerequisite;
    private Boolean biologyPrerequisite;
    private Boolean greRecommended;
    private Boolean gmatRequired;

    // Additional requirements and information
    private String prerequisites; // Comma-separated list
    private String languagesOfInstruction; // Comma-separated
    private String specializations; // Comma-separated
    private String careerOutcomes; // Comma-separated

    // Application information
    private String applicationRequirements; // Comma-separated
    private String applicationDeadline;
    private String intakeSeasons; // Fall, Spring, Summer - comma-separated

    // Course structure
    private Integer totalCredits;
    private Integer coreCredits;
    private Integer electiveCredits;
    private Integer practicalCredits;

    // Additional metadata
    private String description;
    private String learningOutcomes;
    private String accreditation;
    private String ranking;

    // Status fields
    private Boolean isActive;
    private String status; // ACTIVE, INACTIVE, SUSPENDED
    private Boolean isFeatured;
    private Boolean isOnline;
    private Boolean hasInternship;
    private Boolean hasThesis;

    // Partnership and exchange information
    private String partnerUniversities; // Comma-separated
    private String exchangePrograms; // Comma-separated

    // Research and facilities
    private String researchAreas; // Comma-separated
    private String labFacilities; // Comma-separated

    // Audit fields
    private String createdBy;
    private String updatedBy;
}

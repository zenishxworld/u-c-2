package com.uniflow.university.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniversityExcelDto {

    // Basic required fields
    @NotBlank(message = "University name is required")
    @Size(max = 500, message = "University name must not exceed 500 characters")
    private String name;

    @NotBlank(message = "University code is required")
    @Size(max = 50, message = "University code must not exceed 50 characters")
    private String code;

    // Location information
    @NotBlank(message = "Country is required")
    private String country;

    @Pattern(regexp = "^(GB|DE)$", message = "Country code must be GB (United Kingdom) or DE (Germany)")
    private String countryCode;
    private String state;
    private String city;
    private String address;

    // Contact information
    private String websiteUrl;
    private String email;
    private String phone;
    private String admissionsEmail;
    private String admissionsPhone;

    // Institution details
    private String institutionType; // PUBLIC, PRIVATE
    private String type; // RESEARCH, TECHNICAL, LIBERAL_ARTS, etc.

    @Min(value = 1000, message = "Founding year must be after 1000")
    @Max(value = 2024, message = "Founding year cannot be in the future")
    private Integer foundingYear;

    // Student statistics
    @Min(value = 0, message = "Total students cannot be negative")
    private Integer totalStudents;

    @Min(value = 0, message = "Undergraduate students cannot be negative")
    private Integer undergraduateStudents;

    @Min(value = 0, message = "Graduate students cannot be negative")
    private Integer graduateStudents;

    @Min(value = 0, message = "Faculty count cannot be negative")
    private Integer facultyCount;

    // Rankings
    @Min(value = 1, message = "World ranking must be positive")
    private Integer worldRanking;

    @Min(value = 1, message = "National ranking must be positive")
    private Integer nationalRanking;

    @Min(value = 1, message = "QS ranking must be positive")
    private Integer qsRanking;

    // Financial information
    @DecimalMin(value = "0.0", message = "Tuition cannot be negative")
    private BigDecimal tuitionInternationalUndergraduate;

    @DecimalMin(value = "0.0", message = "Tuition cannot be negative")
    private BigDecimal tuitionInternationalGraduate;

    @DecimalMin(value = "0.0", message = "Application fee cannot be negative")
    private BigDecimal applicationFee;

    private String currency;

    // Admission information
    @DecimalMin(value = "0.0", message = "Acceptance rate cannot be negative")
    @DecimalMax(value = "1.0", message = "Acceptance rate cannot exceed 1.0")
    private BigDecimal acceptanceRate;

    private LocalDate applicationDeadlineFall;
    private LocalDate applicationDeadlineSpring;

    // English requirements
    @Min(value = 0, message = "TOEFL score cannot be negative")
    @Max(value = 120, message = "TOEFL score cannot exceed 120")
    private Integer toeflMin;

    @DecimalMin(value = "0.0", message = "IELTS score cannot be negative")
    @DecimalMax(value = "9.0", message = "IELTS score cannot exceed 9.0")
    private BigDecimal ieltsMin;

    @Min(value = 1, message = "TestDaF score must be between 1 and 5")
    @Max(value = 5, message = "TestDaF score must be between 1 and 5")
    private Integer testDaF;

    @Min(value = 1, message = "DSH score must be between 1 and 3")
    @Max(value = 3, message = "DSH score must be between 1 and 3")
    private Integer dsh;

    // Additional information (will be stored as arrays/lists in JSONB)
    private String affiliations; // Comma-separated
    private String languagesOfInstruction; // Comma-separated
    private String researchFacilities; // Comma-separated
    private String sportsFacilities; // Comma-separated
    private String studentServices; // Comma-separated
    private String schoolsColleges; // Comma-separated
    private String degreeLevels; // Comma-separated
    private String popularMajors; // Comma-separated

    // Status and metadata
    private String description;
    private String verificationStatus; // VERIFIED, PENDING, REJECTED
    private String status; // ACTIVE, INACTIVE
    private Boolean isFeatured;
    private Boolean scholarshipsAvailable;
    private Boolean isActive;
    private String clientId;

    // Audit fields
    private String createdBy;
    private String updatedBy;
}

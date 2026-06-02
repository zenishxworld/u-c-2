package com.uniflow.student.dto.university;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.uniflow.university.dto.CourseResponseDTO;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for displaying university cards in student portal
 * Simplified presentation focused on student decision-making
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentUniversityCardDTO {

    private UUID id;
    private String name;
    private String code;
    private String country;
    private String city;
    private String logoUrl;
    private String bannerUrl;

    // Key metrics for student decision making
    private Integer worldRanking;
    private String rankingDisplay; // e.g., "Top 100", "501-600", etc.
    private BigDecimal tuitionFrom;
    private BigDecimal tuitionTo;
    private String currency;
    private String tuitionDisplay; // e.g., "$25,000 - $45,000 USD"

    // Courses - nested array like main API
    private List<CourseResponseDTO> courses;

    // Quick facts
    private Integer totalCourses;
    private List<String> popularFields; // Top 3-5 field of study areas
    private Boolean scholarshipsAvailable;
    private String establishedYear;
    private String universityType;    // Ownership: public / private / semi_private
    private String institutionType;   // Academic category: research / applied_sciences / arts / medical / technical / business

    // Application info
    private String applicationDeadline;
    private String intakeSeasons; // Fall, Spring, Summer
    private String englishRequirement; // IELTS/TOEFL scores

    // Student experience
    private Integer internationalStudents;
    private String campusSize;
    private String accommodation; // Available, Not Available, Limited

    // Quick actions
    private Boolean isFavorite;
    private Boolean hasApplied;
    private String applicationStatus; // If student has applied

    // Computed fields for display
    private String distanceFromStudent; // If location preferences set
    private String matchScore; // Based on student profile (0-100%)
    private List<String> matchReasons; // Why this university matches

    // Contact info
    private String website;
    private String email;
    private String phone;

    // Additional display helpers
    private String shortDescription;
    private List<String> highlights; // 2-3 key selling points
    private String applicationComplexity; // Easy, Moderate, Complex
}

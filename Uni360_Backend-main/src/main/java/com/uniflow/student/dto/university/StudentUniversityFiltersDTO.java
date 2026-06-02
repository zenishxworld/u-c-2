package com.uniflow.student.dto.university;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO for university filtering options in student portal
 * Provides all available filter criteria for student university search
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentUniversityFiltersDTO {

    // Location Filters
    private List<String> countries;
    private Map<String, List<String>> citiesByCountry;
    private List<String> regions; // North America, Europe, Asia, etc.

    // Basic University Info
    private List<String> universityTypes; // Public, Private, Religious
    private List<String> campusTypes; // Urban, Suburban, Rural

    // Academic Filters
    private List<String> popularFields; // Engineering, Business, Medicine
    private List<String> degreeLevels; // Bachelor, Master, PhD
    private List<String> studyModes; // Full-time, Part-time, Online

    // Financial Filters
    private BigDecimal minTuition;
    private BigDecimal maxTuition;
    private List<String> currencies;
    private Boolean scholarshipsAvailable;

    // Ranking Filters
    private Integer minWorldRanking;
    private Integer maxWorldRanking;
    private List<String> rankingSources; // QS, Times, Shanghai

    // Size & Capacity
    private Integer minStudents;
    private Integer maxStudents;
    private Integer minInternationalStudents;
    private Integer maxInternationalStudents;

    // Application Filters
    private List<String> intakeSeasons;
    private List<String> applicationComplexity; // Easy, Moderate, Complex
    private Boolean acceptingApplications;

    // Requirements Filters
    private List<String> englishTestTypes; // IELTS, TOEFL, PTE
    private Double minIELTSScore;
    private Double maxIELTSScore;
    private Double minTOEFLScore;
    private Double maxTOEFLScore;
    private Double minGPA;
    private Double maxGPA;

    // Facilities & Services
    private List<String> accommodationTypes; // On-campus, Off-campus
    private List<String> facilities; // Library, Sports, Labs
    private Boolean careerServices;
    private Boolean internationalOffice;

    // Student Experience
    private Double minSatisfactionRating;
    private Double maxSatisfactionRating;
    private List<String> campusActivities;
    private Boolean diversityPrograms;

    // Special Features
    private Boolean virtualTourAvailable;
    private Boolean hasOnlinePrograms;
    private Boolean industryConnections;
    private Boolean researchOpportunities;

    // Applied Filters (current selection)
    private List<String> selectedCountries;
    private List<String> selectedCities;
    private List<String> selectedFields;
    private List<String> selectedDegreeLevels;
    private String selectedUniversityType;
    private String selectedCampusType;
    private BigDecimal selectedMinTuition;
    private BigDecimal selectedMaxTuition;
    private String selectedCurrency;
    private Integer selectedMinRanking;
    private Integer selectedMaxRanking;
    private Boolean selectedScholarshipsOnly;
    private String selectedIntakeSeason;
    private String selectedStudyMode;

    // Filter Statistics
    private Integer totalUniversities;
    private Integer filteredCount;
    private Map<String, Integer> filterCounts; // Count for each filter option

    // Quick Filter Presets
    private List<QuickFilterPreset> quickFilters;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickFilterPreset {
        private String name; // "Top Universities", "Affordable Options", etc.
        private String description;
        private Map<String, Object> filterValues;
        private Integer resultCount;
    }
}

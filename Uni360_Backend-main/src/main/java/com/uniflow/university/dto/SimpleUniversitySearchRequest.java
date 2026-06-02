package com.uniflow.university.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple University Search Request DTO
 *
 * Simplified DTO for university search API that matches common JSON request patterns.
 * This DTO focuses on the most commonly used search parameters and maps them to
 * the existing university filtering system.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimpleUniversitySearchRequest {

    // Basic search
    @JsonProperty("search")
    private String search;

    @JsonProperty("name")
    private String name;

    @JsonProperty("code")
    private String code;

    // Geographic filters
    @JsonProperty("country")
    private String country;

    @JsonProperty("city")
    private String city;

    @JsonProperty("state")
    private String state;

    @JsonProperty("region")
    private String region;

    // Type filters
    @JsonProperty("type")
    private String type;

    @JsonProperty("institutionType")
    private String institutionType;

    // Ranking filters (simplified names)
    @JsonProperty("minRanking")
    private Integer minRanking;

    @JsonProperty("maxRanking")
    private Integer maxRanking;

    @JsonProperty("worldRankingMin")
    private Integer worldRankingMin;

    @JsonProperty("worldRankingMax")
    private Integer worldRankingMax;

    // Financial filters (simplified names)
    @JsonProperty("minTuition")
    private Double minTuition;

    @JsonProperty("maxTuition")
    private Double maxTuition;

    @JsonProperty("currency")
    private String currency;

    // Boolean filters (simplified names)
    @JsonProperty("hasScholarships")
    private Boolean hasScholarships;

    @JsonProperty("scholarshipsAvailable")
    private Boolean scholarshipsAvailable;

    @JsonProperty("financialAidAvailable")
    private Boolean financialAidAvailable;

    // Academic filters
    @JsonProperty("languageOfInstruction")
    private String languageOfInstruction;

    @JsonProperty("foundedYearMin")
    private Integer foundedYearMin;

    @JsonProperty("foundedYearMax")
    private Integer foundedYearMax;

    // Pagination
    @JsonProperty("page")
    private Integer page;

    @JsonProperty("size")
    private Integer size;

    @JsonProperty("sortBy")
    private String sortBy;

    @JsonProperty("sortDirection")
    private String sortDirection;

    // ── Course-level filters ──────────────────────────────────────────────
    /** Search universities that offer a course matching this name (partial match) */
    @JsonProperty("course_search")
    private String courseSearch;

    /** Filter to universities that have courses at this degree level (e.g. BACHELORS, MASTERS) */
    @JsonProperty("degree_level")
    private String degreeLevel;

    /** Filter to universities offering courses with this study mode (e.g. FULL_TIME, PART_TIME) */
    @JsonProperty("study_mode")
    private String studyMode;

    /** Minimum course tuition fee (EUR / course currency) */
    @JsonProperty("course_tuition_min")
    private Double courseTuitionMin;

    /** Maximum course tuition fee (EUR / course currency) */
    @JsonProperty("course_tuition_max")
    private Double courseTuitionMax;

    /** Filter by exact course duration in years (e.g. 1, 2, 3) */
    @JsonProperty("course_duration")
    private Integer courseDuration;

    /**
     * Convert this search request to query parameters map for existing filtering system
     */
    public java.util.Map<String, String> toQueryParams() {
        java.util.Map<String, String> params = new java.util.HashMap<>();

        // Basic search
        if (search != null) params.put("search", search);
        if (name != null) params.put("name", name);
        if (code != null) params.put("code", code);

        // Geographic
        if (country != null) params.put("country", country);
        if (city != null) params.put("city", city);
        if (state != null) params.put("state", state);
        if (region != null) params.put("region", region);

        // Type
        if (type != null) params.put("type", type);
        if (institutionType != null) params.put("institution_type", institutionType);

        // Ranking - handle both simplified and full names
        if (minRanking != null) params.put("world_ranking_min", minRanking.toString());
        if (maxRanking != null) params.put("world_ranking_max", maxRanking.toString());
        if (worldRankingMin != null) params.put("world_ranking_min", worldRankingMin.toString());
        if (worldRankingMax != null) params.put("world_ranking_max", worldRankingMax.toString());

        // Financial
        if (minTuition != null) params.put("tuition_min", minTuition.toString());
        if (maxTuition != null) params.put("tuition_max", maxTuition.toString());
        if (currency != null) params.put("currency", currency);

        // Boolean filters - handle both hasScholarships and scholarshipsAvailable
        if (hasScholarships != null) params.put("scholarships_available", hasScholarships.toString());
        if (scholarshipsAvailable != null) params.put("scholarships_available", scholarshipsAvailable.toString());
        if (financialAidAvailable != null) params.put("financial_aid_available", financialAidAvailable.toString());

        // Academic
        if (languageOfInstruction != null) params.put("language_of_instruction", languageOfInstruction);
        if (foundedYearMin != null) params.put("founded_year_min", foundedYearMin.toString());
        if (foundedYearMax != null) params.put("founded_year_max", foundedYearMax.toString());

        // Course-level filters
        if (courseSearch != null) params.put("course_search", courseSearch);
        if (degreeLevel != null) params.put("degree_level", degreeLevel);
        if (studyMode != null) params.put("study_mode", studyMode);
        if (courseTuitionMin != null) params.put("course_tuition_min", courseTuitionMin.toString());
        if (courseTuitionMax != null) params.put("course_tuition_max", courseTuitionMax.toString());
        if (courseDuration != null) params.put("course_duration", courseDuration.toString());

        // Pagination
        if (page != null) params.put("page", page.toString());
        if (size != null) params.put("size", size.toString());
        if (sortBy != null) params.put("sort_by", sortBy);
        if (sortDirection != null) params.put("sort_direction", sortDirection);

        return params;
    }

    /**
     * Check if this is an empty search request
     */
    public boolean isEmpty() {
        return search == null && name == null && code == null &&
               country == null && city == null && state == null &&
               type == null && institutionType == null &&
               minRanking == null && maxRanking == null &&
               worldRankingMin == null && worldRankingMax == null &&
               minTuition == null && maxTuition == null &&
               hasScholarships == null && scholarshipsAvailable == null &&
               financialAidAvailable == null && languageOfInstruction == null &&
               foundedYearMin == null && foundedYearMax == null;
    }
}

package com.uniflow.university.repository;

/**
 * University SQL Queries with dynamic parameter binding
 *
 * This class contains all SQL queries for university search and filtering operations
 * using parameter placeholders (:paramName) for reactive SQL binding.
 *
 * Updated to use JSONB data column instead of direct columns since the universities
 * table stores most data in the 'data' JSONB column.
 */
public class UniversityQueries {

    /**
     * Find universities with dynamic filtering and pagination
     */
    public static final String FIND_UNIVERSITIES_WITH_FILTERS = """
        SELECT u.* FROM universities u
        WHERE u.is_active = true
        AND (:statusWildcard = TRUE OR (u.data->>'status') = :status)
        AND (:activeFilter = FALSE OR (u.data->>'status') IS NULL OR (u.data->>'status') = 'ACTIVE')
        AND (:typeWildcard = TRUE OR (u.data->>'type') = :type)
        AND (:institutionTypeWildcard = TRUE OR (u.data->>'institution_type') = :institutionType)
        AND (:countryWildcard = TRUE OR LOWER(u.data->>'country_code') = LOWER(:country) OR LOWER(u.data->>'country') = LOWER(:country))
        AND (:stateWildcard = TRUE OR LOWER(u.data->>'state') = LOWER(:state))
        AND (:cityWildcard = TRUE OR LOWER(u.data->>'city') = LOWER(:city))
        AND (:regionWildcard = TRUE OR LOWER(u.data->>'region') = LOWER(:region))
        AND (:searchTermWildcard = TRUE OR (
            LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'short_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'description') LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        ))
        AND (:nameWildcard = TRUE OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%')))
        AND (:codeWildcard = TRUE OR LOWER(u.code) = LOWER(:code))
        AND (:worldRankingWildcard = TRUE OR (
            (:worldRankingMin IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) >= :worldRankingMin) AND
            (:worldRankingMax IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) <= :worldRankingMax)
        ))
        AND (:nationalRankingWildcard = TRUE OR (
            (:nationalRankingMin IS NULL OR CAST(u.data->>'national_ranking' AS INTEGER) >= :nationalRankingMin) AND
            (:nationalRankingMax IS NULL OR CAST(u.data->>'national_ranking' AS INTEGER) <= :nationalRankingMax)
        ))
        AND (:qsRankingWildcard = TRUE OR (
            (:qsRankingMin IS NULL OR CAST(u.data->>'qs_ranking' AS INTEGER) >= :qsRankingMin) AND
            (:qsRankingMax IS NULL OR CAST(u.data->>'qs_ranking' AS INTEGER) <= :qsRankingMax)
        ))
        AND (:tuitionWildcard = TRUE OR (
            (:tuitionMin IS NULL OR CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) >= :tuitionMin) AND
            (:tuitionMax IS NULL OR CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= :tuitionMax)
        ))
        AND (:currencyWildcard = TRUE OR LOWER(u.data->>'currency') = LOWER(:currency))
        AND (:scholarshipsFilter = FALSE OR CAST(u.data->>'scholarships_available' AS BOOLEAN) = TRUE)
        AND (:financialAidFilter = FALSE OR CAST(u.data->>'financial_aid_percentage' AS DECIMAL) > 0)
        AND (:foundedYearWildcard = TRUE OR (
            (:foundedYearMin IS NULL OR CAST(u.data->>'founding_year' AS INTEGER) >= :foundedYearMin) AND
            (:foundedYearMax IS NULL OR CAST(u.data->>'founding_year' AS INTEGER) <= :foundedYearMax)
        ))
        AND (:languageWildcard = TRUE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(u.data->'languages_of_instruction') AS lang
            WHERE LOWER(lang) LIKE LOWER(CONCAT('%', :languageOfInstruction, '%'))
        ))
        AND (:studentPopulationWildcard = TRUE OR (
            (:studentPopulationMin IS NULL OR CAST(u.data->>'total_students' AS INTEGER) >= :studentPopulationMin) AND
            (:studentPopulationMax IS NULL OR CAST(u.data->>'total_students' AS INTEGER) <= :studentPopulationMax)
        ))
        AND (:clientIdWildcard = TRUE OR (u.data->>'client_id') = :clientId)
        AND (:courseSearchWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND LOWER(c.name) LIKE LOWER(CONCAT('%', :courseSearch, '%'))
        ))
        AND (:degreeLevelWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND LOWER(c.data->>'degree_level') = LOWER(:degreeLevel)
        ))
        AND (:studyModeWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND LOWER(c.data->>'study_mode') = LOWER(:studyMode)
        ))
        AND (:courseTuitionWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND (:courseTuitionMin IS NULL OR CAST(c.data->>'tuition_fee_international' AS DECIMAL) >= :courseTuitionMin)
            AND (:courseTuitionMax IS NULL OR CAST(c.data->>'tuition_fee_international' AS DECIMAL) <= :courseTuitionMax)
        ))
        AND (:courseDurationWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND CAST(c.data->>'duration_years' AS INTEGER) = :courseDuration
        ))
        ORDER BY %s %s
        LIMIT :size OFFSET :offset
        """;

    /**
     * Count universities with dynamic filtering
     */
    public static final String COUNT_UNIVERSITIES_WITH_FILTERS = """
        SELECT COUNT(*) FROM universities u
        WHERE u.is_active = true
        AND (:statusWildcard = TRUE OR (u.data->>'status') = :status)
        AND (:activeFilter = FALSE OR (u.data->>'status') IS NULL OR (u.data->>'status') = 'ACTIVE')
        AND (:typeWildcard = TRUE OR (u.data->>'type') = :type)
        AND (:institutionTypeWildcard = TRUE OR (u.data->>'institution_type') = :institutionType)
        AND (:countryWildcard = TRUE OR LOWER(u.data->>'country_code') = LOWER(:country) OR LOWER(u.data->>'country') = LOWER(:country))
        AND (:stateWildcard = TRUE OR LOWER(u.data->>'state') = LOWER(:state))
        AND (:cityWildcard = TRUE OR LOWER(u.data->>'city') = LOWER(:city))
        AND (:regionWildcard = TRUE OR LOWER(u.data->>'region') = LOWER(:region))
        AND (:searchTermWildcard = TRUE OR (
            LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'short_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'description') LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        ))
        AND (:nameWildcard = TRUE OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%')))
        AND (:codeWildcard = TRUE OR LOWER(u.code) = LOWER(:code))
        AND (:worldRankingWildcard = TRUE OR (
            (:worldRankingMin IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) >= :worldRankingMin) AND
            (:worldRankingMax IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) <= :worldRankingMax)
        ))
        AND (:nationalRankingWildcard = TRUE OR (
            (:nationalRankingMin IS NULL OR CAST(u.data->>'national_ranking' AS INTEGER) >= :nationalRankingMin) AND
            (:nationalRankingMax IS NULL OR CAST(u.data->>'national_ranking' AS INTEGER) <= :nationalRankingMax)
        ))
        AND (:qsRankingWildcard = TRUE OR (
            (:qsRankingMin IS NULL OR CAST(u.data->>'qs_ranking' AS INTEGER) >= :qsRankingMin) AND
            (:qsRankingMax IS NULL OR CAST(u.data->>'qs_ranking' AS INTEGER) <= :qsRankingMax)
        ))
        AND (:tuitionWildcard = TRUE OR (
            (:tuitionMin IS NULL OR CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) >= :tuitionMin) AND
            (:tuitionMax IS NULL OR CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= :tuitionMax)
        ))
        AND (:currencyWildcard = TRUE OR LOWER(u.data->>'currency') = LOWER(:currency))
        AND (:scholarshipsFilter = FALSE OR CAST(u.data->>'scholarships_available' AS BOOLEAN) = TRUE)
        AND (:financialAidFilter = FALSE OR CAST(u.data->>'financial_aid_percentage' AS DECIMAL) > 0)
        AND (:foundedYearWildcard = TRUE OR (
            (:foundedYearMin IS NULL OR CAST(u.data->>'founding_year' AS INTEGER) >= :foundedYearMin) AND
            (:foundedYearMax IS NULL OR CAST(u.data->>'founding_year' AS INTEGER) <= :foundedYearMax)
        ))
        AND (:languageWildcard = TRUE OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(u.data->'languages_of_instruction') AS lang
            WHERE LOWER(lang) LIKE LOWER(CONCAT('%', :languageOfInstruction, '%'))
        ))
        AND (:studentPopulationWildcard = TRUE OR (
            (:studentPopulationMin IS NULL OR CAST(u.data->>'total_students' AS INTEGER) >= :studentPopulationMin) AND
            (:studentPopulationMax IS NULL OR CAST(u.data->>'total_students' AS INTEGER) <= :studentPopulationMax)
        ))
        AND (:clientIdWildcard = TRUE OR (u.data->>'client_id') = :clientId)
        AND (:courseSearchWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND LOWER(c.name) LIKE LOWER(CONCAT('%', :courseSearch, '%'))
        ))
        AND (:degreeLevelWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND LOWER(c.data->>'degree_level') = LOWER(:degreeLevel)
        ))
        AND (:studyModeWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND LOWER(c.data->>'study_mode') = LOWER(:studyMode)
        ))
        AND (:courseTuitionWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND (:courseTuitionMin IS NULL OR CAST(c.data->>'tuition_fee_international' AS DECIMAL) >= :courseTuitionMin)
            AND (:courseTuitionMax IS NULL OR CAST(c.data->>'tuition_fee_international' AS DECIMAL) <= :courseTuitionMax)
        ))
        AND (:courseDurationWildcard = TRUE OR EXISTS (
            SELECT 1 FROM courses c WHERE c.university_id = u.id
            AND CAST(c.data->>'duration_years' AS INTEGER) = :courseDuration
        ))
        """;

    /**
     * Search universities by multiple criteria with text search
     */
    public static final String SEARCH_UNIVERSITIES_BY_CRITERIA = """
        SELECT u.* FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND (:searchTerm IS NULL OR :searchTerm = '' OR (
            LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'short_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'description') LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'city') LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(u.data->>'country') LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        ))
        AND (:countries IS NULL OR (u.data->>'country') = ANY(:countries))
        AND (:cities IS NULL OR (u.data->>'city') = ANY(:cities))
        AND (:types IS NULL OR (u.data->>'type') = ANY(:types))
        AND (:institutionTypes IS NULL OR (u.data->>'institution_type') = ANY(:institutionTypes))
        AND (:minRanking IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) >= :minRanking)
        AND (:maxRanking IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) <= :maxRanking)
        AND (:minTuition IS NULL OR CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) >= :minTuition)
        AND (:maxTuition IS NULL OR CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= :maxTuition)
        AND (:hasScholarships = FALSE OR CAST(u.data->>'scholarships_available' AS BOOLEAN) = TRUE)
        ORDER BY
            CASE WHEN :sortBy = 'name' THEN u.name END %s,
            CASE WHEN :sortBy = 'ranking' THEN CAST(u.data->>'world_ranking' AS INTEGER) END %s,
            CASE WHEN :sortBy = 'tuition' THEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) END %s,
            CASE WHEN :sortBy = 'founded_year' THEN CAST(u.data->>'founding_year' AS INTEGER) END %s,
            u.name ASC
        LIMIT :size OFFSET :offset
        """;

    /**
     * Get university statistics by country
     */
    public static final String GET_UNIVERSITY_STATISTICS_BY_COUNTRY = """
        SELECT
            u.data->>'country' as country,
            COUNT(*) as total_universities,
            AVG(CAST(u.data->>'world_ranking' AS INTEGER)) as avg_ranking,
            AVG(CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)) as avg_tuition,
            COUNT(CASE WHEN CAST(u.data->>'scholarships_available' AS BOOLEAN) = TRUE THEN 1 END) as scholarships_count,
            MIN(CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)) as min_tuition,
            MAX(CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)) as max_tuition
        FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND (:country IS NULL OR (u.data->>'country') = :country)
        GROUP BY u.data->>'country'
        ORDER BY total_universities DESC
        """;

    /**
     * Get universities near a location (geographic search)
     */
    public static final String FIND_UNIVERSITIES_NEAR_LOCATION = """
        SELECT u.*,
               (6371 * acos(cos(radians(:latitude)) * cos(radians(CAST(u.data->>'latitude' AS DECIMAL))) *
                           cos(radians(CAST(u.data->>'longitude' AS DECIMAL)) - radians(:longitude)) +
                           sin(radians(:latitude)) * sin(radians(CAST(u.data->>'latitude' AS DECIMAL))))) AS distance_km
        FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND u.data->>'latitude' IS NOT NULL
        AND u.data->>'longitude' IS NOT NULL
        HAVING distance_km <= :radiusKm
        ORDER BY distance_km ASC
        LIMIT :size OFFSET :offset
        """;

    /**
     * Get top ranked universities with optional filtering
     */
    public static final String FIND_TOP_RANKED_UNIVERSITIES = """
        SELECT u.* FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND u.data->>'world_ranking' IS NOT NULL
        AND (:country IS NULL OR (u.data->>'country') = :country)
        AND (:type IS NULL OR (u.data->>'type') = :type)
        AND (:maxRanking IS NULL OR CAST(u.data->>'world_ranking' AS INTEGER) <= :maxRanking)
        ORDER BY CAST(u.data->>'world_ranking' AS INTEGER) ASC
        LIMIT :limit
        """;

    /**
     * Find universities by budget range
     */
    public static final String FIND_UNIVERSITIES_BY_BUDGET = """
        SELECT u.* FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND u.data->>'tuition_international_undergraduate' IS NOT NULL
        AND CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) >= :minBudget
        AND CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= :maxBudget
        AND (:currency IS NULL OR (u.data->>'currency') = :currency)
        ORDER BY CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) ASC, CAST(u.data->>'world_ranking' AS INTEGER) ASC
        LIMIT :size OFFSET :offset
        """;

    /**
     * Dashboard overview query
     */
    public static final String GET_DASHBOARD_OVERVIEW = """
        SELECT
            COUNT(*) as total_universities,
            COUNT(CASE WHEN (u.data->>'status') = 'ACTIVE' THEN 1 END) as active_universities,
            COUNT(CASE WHEN CAST(u.data->>'scholarships_available' AS BOOLEAN) = TRUE THEN 1 END) as universities_with_scholarships,
            COUNT(DISTINCT u.data->>'country') as countries_covered,
            AVG(CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)) as avg_international_tuition,
            MIN(CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)) as min_tuition,
            MAX(CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)) as max_tuition,
            COUNT(CASE WHEN u.data->>'world_ranking' IS NOT NULL THEN 1 END) as ranked_universities
        FROM universities u
        WHERE u.is_active = true
        AND (:clientIdWildcard IS NULL OR (u.data->>'client_id') = :clientId)
        """;

    /**
     * Get university counts grouped by specific field
     */
    public static final String FIND_UNIVERSITY_COUNTS_BY_FIELD = """
        SELECT '%s' as filterParam, u.data->>'%s' as filterId, COUNT(*) as count
        FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        GROUP BY u.data->>'%s'
        ORDER BY count DESC
        """;

    /**
     * Get university counts for boolean fields (scholarships, financial aid, etc.)
     */
    public static final String FIND_UNIVERSITY_COUNTS_BOOLEAN = """
        SELECT '%s' as filterParam, CAST(u.data->>'%s' AS BOOLEAN) as filterId, COUNT(*) as count
        FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND u.data->>'%s' IS NOT NULL
        GROUP BY CAST(u.data->>'%s' AS BOOLEAN)
        ORDER BY count DESC
        """;

    /**
     * Get university counts for ranking ranges
     */
    public static final String FIND_UNIVERSITY_COUNTS_RANKING_RANGES = """
        SELECT
            'ranking' as filterParam,
            CASE
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 50 THEN 'Top 50'
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 100 THEN 'Top 100'
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 200 THEN 'Top 200'
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 500 THEN 'Top 500'
                ELSE '500+'
            END as filterId,
            COUNT(*) as count
        FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND u.data->>'world_ranking' IS NOT NULL
        GROUP BY
            CASE
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 50 THEN 'Top 50'
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 100 THEN 'Top 100'
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 200 THEN 'Top 200'
                WHEN CAST(u.data->>'world_ranking' AS INTEGER) <= 500 THEN 'Top 500'
                ELSE '500+'
            END
        ORDER BY count DESC
        """;

    /**
     * Get university counts for tuition fee ranges
     */
    public static final String FIND_UNIVERSITY_COUNTS_TUITION_RANGES = """
        SELECT
            'tuition' as filterParam,
            CASE
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) = 0 THEN 'Free'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 5000 THEN 'Under $5,000'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 15000 THEN '$5,000 - $15,000'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 30000 THEN '$15,000 - $30,000'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 50000 THEN '$30,000 - $50,000'
                ELSE 'Above $50,000'
            END as filterId,
            COUNT(*) as count
        FROM universities u
        WHERE u.is_active = true
        AND (u.data->>'status') = 'ACTIVE'
        AND u.data->>'tuition_international_undergraduate' IS NOT NULL
        GROUP BY
            CASE
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) = 0 THEN 'Free'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 5000 THEN 'Under $5,000'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 15000 THEN '$5,000 - $15,000'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 30000 THEN '$15,000 - $30,000'
                WHEN CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL) <= 50000 THEN '$30,000 - $50,000'
                ELSE 'Above $50,000'
            END
        ORDER BY count DESC
        """;
}

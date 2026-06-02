package com.uniflow.university.repository;

import com.uniflow.university.entity.University;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Simplified University Repository - Works with basic fields and JSONB data
 */
public interface UniversityRepository
    extends R2dbcRepository<University, UUID> {
    // Basic queries using direct columns
    Mono<University> findByCode(String code);

    Flux<University> findByIsActive(Boolean isActive);

    Flux<University> findByNameContainingIgnoreCaseAndIsActive(
        String name,
        Boolean isActive
    );

    Flux<University> findByCodeAndIsActive(String code, Boolean isActive);

    // JSONB-based queries for complex filtering
    @Query(
        "SELECT * FROM universities WHERE is_active = :isActive " +
            "AND (LOWER(data->>'country') = LOWER(:country) OR :country IS NULL)"
    )
    Flux<University> findByCountryAndIsActive(
        @Param("country") String country,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM universities WHERE is_active = :isActive " +
            "AND (LOWER(data->>'city') = LOWER(:city) OR :city IS NULL)"
    )
    Flux<University> findByCityAndIsActive(
        @Param("city") String city,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM universities WHERE is_active = :isActive " +
            "AND (data->>'type' = :type OR :type IS NULL)"
    )
    Flux<University> findByTypeAndIsActive(
        @Param("type") String type,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM universities WHERE is_active = :isActive " +
            "AND (data->>'institution_type' = :institutionType OR :institutionType IS NULL)"
    )
    Flux<University> findByInstitutionTypeAndIsActive(
        @Param("institutionType") String institutionType,
        @Param("isActive") Boolean isActive
    );

    // Ranking-based queries
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND ((data->>'world_ranking')::integer BETWEEN :minRank AND :maxRank)"
    )
    Flux<University> findByWorldRankingRange(
        @Param("minRank") Integer minRank,
        @Param("maxRank") Integer maxRank
    );

    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND ((data->>'qs_ranking')::integer <= :maxRank)"
    )
    Flux<University> findTopRankedByQS(@Param("maxRank") Integer maxRank);

    // Student population queries
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND ((data->>'total_students')::integer BETWEEN :minStudents AND :maxStudents)"
    )
    Flux<University> findByStudentPopulationRange(
        @Param("minStudents") Integer minStudents,
        @Param("maxStudents") Integer maxStudents
    );

    // Search queries
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND (LOWER(name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'official_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'short_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'country') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'city') LIKE LOWER(CONCAT('%', :searchTerm, '%')))"
    )
    Flux<University> searchUniversities(@Param("searchTerm") String searchTerm);

    // Location-specific queries
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND LOWER(data->>'country') = LOWER(:country) " +
            "AND LOWER(data->>'city') = LOWER(:city)"
    )
    Flux<University> findByCountryAndCity(
        @Param("country") String country,
        @Param("city") String city
    );

    // Count queries
    @Query(
        "SELECT COUNT(*) FROM universities WHERE is_active = true " +
            "AND (LOWER(data->>'country') = LOWER(:country) OR :country IS NULL)"
    )
    Mono<Long> countByCountry(@Param("country") String country);

    @Query(
        "SELECT COUNT(*) FROM universities WHERE is_active = true " +
            "AND (data->>'type' = :type OR :type IS NULL)"
    )
    Mono<Long> countByType(@Param("type") String type);

    // Featured universities
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND (data->>'is_featured')::boolean = true " +
            "ORDER BY name ASC " +
            "LIMIT :limit"
    )
    Flux<University> findFeaturedUniversities(@Param("limit") Integer limit);

    // Top universities by ranking
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND (data->>'world_ranking')::integer IS NOT NULL " +
            "ORDER BY (data->>'world_ranking')::integer ASC " +
            "LIMIT :limit"
    )
    Flux<University> findTopWorldRankedUniversities(
        @Param("limit") Integer limit
    );

    // Complex filtering query
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND (:country IS NULL OR LOWER(data->>'country') = LOWER(:country)) " +
            "AND (:city IS NULL OR LOWER(data->>'city') = LOWER(:city)) " +
            "AND (:type IS NULL OR data->>'type' = :type) " +
            "AND (:institutionType IS NULL OR data->>'institution_type' = :institutionType) " +
            "AND (:minRanking IS NULL OR (data->>'world_ranking')::integer >= :minRanking) " +
            "AND (:maxRanking IS NULL OR (data->>'world_ranking')::integer <= :maxRanking) " +
            "AND (:minStudents IS NULL OR (data->>'total_students')::integer >= :minStudents) " +
            "AND (:maxStudents IS NULL OR (data->>'total_students')::integer <= :maxStudents) " +
            "ORDER BY name ASC " +
            "LIMIT :limit OFFSET :offset"
    )
    Flux<University> findWithCriteria(
        @Param("country") String country,
        @Param("city") String city,
        @Param("type") String type,
        @Param("institutionType") String institutionType,
        @Param("minRanking") Integer minRanking,
        @Param("maxRanking") Integer maxRanking,
        @Param("minStudents") Integer minStudents,
        @Param("maxStudents") Integer maxStudents,
        @Param("limit") Integer limit,
        @Param("offset") Integer offset
    );

    // Universities with courses
    @Query(
        "SELECT DISTINCT u.* FROM universities u " +
            "JOIN courses c ON u.id = c.university_id " +
            "WHERE u.is_active = true AND c.is_active = true " +
            "ORDER BY u.name ASC"
    )
    Flux<University> findUniversitiesWithActiveCourses();

    // Check if code exists (check ALL universities, not just active ones, to prevent duplicates)
    @Query("SELECT COUNT(*) FROM universities WHERE code = :code")
    Mono<Long> countByCode(@Param("code") String code);

    // Universities by multiple countries
    @Query(
        "SELECT * FROM universities WHERE is_active = true " +
            "AND LOWER(data->>'country') = ANY(:countries) " +
            "ORDER BY name ASC"
    )
    Flux<University> findByCountriesIn(@Param("countries") String[] countries);

    // Paginated results
    @Query(
        "SELECT * FROM universities WHERE is_active = :isActive " +
            "ORDER BY name ASC " +
            "LIMIT :limit OFFSET :offset"
    )
    Flux<University> findAllPageable(
        @Param("isActive") Boolean isActive,
        @Param("limit") Integer limit,
        @Param("offset") Integer offset
    );

    @Query("SELECT COUNT(*) FROM universities WHERE is_active = :isActive")
    Mono<Long> countByIsActive(@Param("isActive") Boolean isActive);

    // Private university check by ID (case-insensitive)
    @Query("SELECT COUNT(*) FROM universities WHERE id = :id AND LOWER(data->>'institution_type') = 'private'")
    Mono<Long> countPrivateById(@Param("id") UUID id);
}

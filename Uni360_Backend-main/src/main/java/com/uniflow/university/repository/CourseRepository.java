package com.uniflow.university.repository;

import com.uniflow.university.entity.Course;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Simplified Course Repository - Works with basic fields and JSONB data
 */
public interface CourseRepository extends R2dbcRepository<Course, UUID> {
    // Basic queries using direct columns
    Flux<Course> findByIsActive(Boolean isActive);

    Flux<Course> findByUniversityIdAndIsActive(
        UUID universityId,
        Boolean isActive
    );

    Flux<Course> findByNameContainingIgnoreCaseAndIsActive(
        String name,
        Boolean isActive
    );

    Flux<Course> findByCourseCodeAndIsActive(
        String courseCode,
        Boolean isActive
    );

    Flux<Course> findByCourseCodeContainingIgnoreCaseAndIsActive(
        String courseCode,
        Boolean isActive
    );

    // JSONB-based queries for complex filtering
    @Query(
        "SELECT * FROM courses WHERE is_active = :isActive " +
            "AND (data->>'degree_level' = :degreeLevel OR :degreeLevel IS NULL)"
    )
    Flux<Course> findByDegreeLevelAndIsActive(
        @Param("degreeLevel") String degreeLevel,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM courses WHERE is_active = :isActive " +
            "AND (LOWER(data->>'field_of_study') = LOWER(:fieldOfStudy) OR :fieldOfStudy IS NULL)"
    )
    Flux<Course> findByFieldOfStudyAndIsActive(
        @Param("fieldOfStudy") String fieldOfStudy,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM courses WHERE is_active = :isActive " +
            "AND (LOWER(data->>'subject_area') = LOWER(:subjectArea) OR :subjectArea IS NULL)"
    )
    Flux<Course> findBySubjectAreaAndIsActive(
        @Param("subjectArea") String subjectArea,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM courses WHERE is_active = :isActive " +
            "AND (data->>'degree_type' = :degreeType OR :degreeType IS NULL)"
    )
    Flux<Course> findByDegreeTypeAndIsActive(
        @Param("degreeType") String degreeType,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "SELECT * FROM courses WHERE is_active = :isActive " +
            "AND (data->>'study_mode' = :studyMode OR :studyMode IS NULL)"
    )
    Flux<Course> findByStudyModeAndIsActive(
        @Param("studyMode") String studyMode,
        @Param("isActive") Boolean isActive
    );

    // Advanced JSONB queries
    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND ((data->>'tuition_international')::numeric BETWEEN :minTuition AND :maxTuition)"
    )
    Flux<Course> findByTuitionRange(
        @Param("minTuition") Double minTuition,
        @Param("maxTuition") Double maxTuition
    );

    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND ((data->>'duration_years')::numeric BETWEEN :minDuration AND :maxDuration)"
    )
    Flux<Course> findByDurationRange(
        @Param("minDuration") Double minDuration,
        @Param("maxDuration") Double maxDuration
    );

    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND (data->>'scholarships_available')::boolean = true"
    )
    Flux<Course> findWithScholarships();

    // Search queries
    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND (LOWER(name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(course_code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'official_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'field_of_study') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'subject_area') LIKE LOWER(CONCAT('%', :searchTerm, '%')))"
    )
    Flux<Course> searchCourses(@Param("searchTerm") String searchTerm);

    @Query(
        "SELECT COUNT(*) FROM courses WHERE is_active = true " +
            "AND (LOWER(name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(course_code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'official_name') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'field_of_study') LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(data->>'subject_area') LIKE LOWER(CONCAT('%', :searchTerm, '%')))"
    )
    Mono<Long> countSearchCourses(@Param("searchTerm") String searchTerm);

    // University-specific queries
    @Query(
        "SELECT c.* FROM courses c " +
            "JOIN universities u ON c.university_id = u.id " +
            "WHERE c.is_active = true AND u.is_active = true " +
            "AND u.id = :universityId " +
            "ORDER BY c.name"
    )
    Flux<Course> findActiveByUniversityId(
        @Param("universityId") UUID universityId
    );

    @Query(
        "SELECT c.* FROM courses c " +
            "JOIN universities u ON c.university_id = u.id " +
            "WHERE c.is_active = true AND u.is_active = true " +
            "AND LOWER(u.name) LIKE LOWER(CONCAT('%', :universityName, '%'))"
    )
    Flux<Course> findByUniversityName(
        @Param("universityName") String universityName
    );

    // Count queries
    @Query(
        "SELECT COUNT(*) FROM courses WHERE is_active = true " +
            "AND university_id = :universityId"
    )
    Mono<Long> countByUniversityId(@Param("universityId") UUID universityId);

    @Query(
        "SELECT COUNT(*) FROM courses WHERE is_active = true " +
            "AND (data->>'degree_level' = :degreeLevel OR :degreeLevel IS NULL)"
    )
    Mono<Long> countByDegreeLevel(@Param("degreeLevel") String degreeLevel);

    @Query(
        "SELECT COUNT(*) FROM courses WHERE is_active = true " +
            "AND (LOWER(data->>'field_of_study') = LOWER(:fieldOfStudy) OR :fieldOfStudy IS NULL)"
    )
    Mono<Long> countByFieldOfStudy(@Param("fieldOfStudy") String fieldOfStudy);

    // Complex filtering query
    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND (:universityId IS NULL OR university_id = :universityId) " +
            "AND (:degreeLevel IS NULL OR data->>'degree_level' = :degreeLevel) " +
            "AND (:fieldOfStudy IS NULL OR LOWER(data->>'field_of_study') = LOWER(:fieldOfStudy)) " +
            "AND (:subjectArea IS NULL OR LOWER(data->>'subject_area') = LOWER(:subjectArea)) " +
            "AND (:studyMode IS NULL OR data->>'study_mode' = :studyMode) " +
            "AND (:minTuition IS NULL OR (data->>'tuition_international')::numeric >= :minTuition) " +
            "AND (:maxTuition IS NULL OR (data->>'tuition_international')::numeric <= :maxTuition) " +
            "AND (:minDuration IS NULL OR (data->>'duration_years')::numeric >= :minDuration) " +
            "AND (:maxDuration IS NULL OR (data->>'duration_years')::numeric <= :maxDuration) " +
            "ORDER BY name ASC " +
            "LIMIT :limit OFFSET :offset"
    )
    Flux<Course> findWithCriteria(
        @Param("universityId") UUID universityId,
        @Param("degreeLevel") String degreeLevel,
        @Param("fieldOfStudy") String fieldOfStudy,
        @Param("subjectArea") String subjectArea,
        @Param("studyMode") String studyMode,
        @Param("minTuition") Double minTuition,
        @Param("maxTuition") Double maxTuition,
        @Param("minDuration") Double minDuration,
        @Param("maxDuration") Double maxDuration,
        @Param("limit") Integer limit,
        @Param("offset") Integer offset
    );

    @Query(
        "SELECT COUNT(*) FROM courses WHERE is_active = true " +
            "AND (:universityId IS NULL OR university_id = :universityId) " +
            "AND (:degreeLevel IS NULL OR data->>'degree_level' = :degreeLevel) " +
            "AND (:fieldOfStudy IS NULL OR LOWER(data->>'field_of_study') = LOWER(:fieldOfStudy)) " +
            "AND (:subjectArea IS NULL OR LOWER(data->>'subject_area') = LOWER(:subjectArea)) " +
            "AND (:studyMode IS NULL OR data->>'study_mode' = :studyMode) " +
            "AND (:minTuition IS NULL OR (data->>'tuition_international')::numeric >= :minTuition) " +
            "AND (:maxTuition IS NULL OR (data->>'tuition_international')::numeric <= :maxTuition) " +
            "AND (:minDuration IS NULL OR (data->>'duration_years')::numeric >= :minDuration) " +
            "AND (:maxDuration IS NULL OR (data->>'duration_years')::numeric <= :maxDuration) "
    )
    Mono<Long> countWithCriteria(
        @Param("universityId") UUID universityId,
        @Param("degreeLevel") String degreeLevel,
        @Param("fieldOfStudy") String fieldOfStudy,
        @Param("subjectArea") String subjectArea,
        @Param("studyMode") String studyMode,
        @Param("minTuition") Double minTuition,
        @Param("maxTuition") Double maxTuition,
        @Param("minDuration") Double minDuration,
        @Param("maxDuration") Double maxDuration
    );

    // Popular courses by university
    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND university_id = :universityId " +
            "AND (data->>'is_featured')::boolean = true " +
            "ORDER BY name ASC " +
            "LIMIT :limit"
    )
    Flux<Course> findPopularByUniversityId(
        @Param("universityId") UUID universityId,
        @Param("limit") Integer limit
    );

    // Affordable courses
    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND ((data->>'tuition_international')::numeric IS NULL " +
            "OR (data->>'tuition_international')::numeric <= :maxTuition) " +
            "ORDER BY (data->>'tuition_international')::numeric ASC NULLS FIRST " +
            "LIMIT :limit"
    )
    Flux<Course> findAffordableCourses(
        @Param("maxTuition") Double maxTuition,
        @Param("limit") Integer limit
    );

    // Check if course code exists for university
    @Query(
        "SELECT COUNT(*) FROM courses WHERE course_code = :courseCode " +
            "AND university_id = :universityId AND is_active = true"
    )
    Mono<Long> countByCourseCodeAndUniversityId(
        @Param("courseCode") String courseCode,
        @Param("universityId") UUID universityId
    );

    // Find courses by multiple degree levels
    @Query(
        "SELECT * FROM courses WHERE is_active = true " +
            "AND data->>'degree_level' = ANY(:degreeLevels) " +
            "ORDER BY name ASC"
    )
    Flux<Course> findByDegreeLevelsIn(
        @Param("degreeLevels") String[] degreeLevels
    );
}

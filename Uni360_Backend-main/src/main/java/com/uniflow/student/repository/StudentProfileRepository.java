package com.uniflow.student.repository;

import com.uniflow.common.enums.VerificationStatus;
import com.uniflow.student.entity.StudentProfile;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository interface for StudentProfile entity Provides reactive database operations for student
 * profiles
 */
@Repository
public interface StudentProfileRepository
    extends R2dbcRepository<StudentProfile, UUID> {
    /** Find student profile by user ID */
    Mono<StudentProfile> findByUserId(Long userId);

    /** Find student profile by user ID and not deleted */
    @Query(
        "SELECT * FROM student_profiles WHERE user_id = :userId AND deleted = false"
    )
    Mono<StudentProfile> findActiveByUserId(@Param("userId") Long userId);

    /** Find all profiles by verification status */
    Flux<StudentProfile> findByProfileStatusAndDeletedFalse(
        VerificationStatus profileStatus
    );

    /** Find profiles by completion percentage range */
    @Query(
        "SELECT * FROM student_profiles WHERE completion_percentage BETWEEN :min AND :max AND deleted = false"
    )
    Flux<StudentProfile> findByCompletionPercentageBetween(
        @Param("min") Integer min,
        @Param("max") Integer max
    );

    /** Find profiles that need verification (complete but not verified) */
    @Query(
        "SELECT * FROM student_profiles WHERE profile_status = 'COMPLETE' AND is_verified = false AND deleted = false"
    )
    Flux<StudentProfile> findProfilesNeedingVerification();

    /** Find profiles by workflow stage */
    @Query(
        "SELECT * FROM student_profiles WHERE workflow_stage = :workflowStage AND deleted = false"
    )
    Flux<StudentProfile> findByWorkflowStage(
        @Param("workflowStage") String workflowStage
    );

    /** Find profiles by current step */
    @Query(
        "SELECT * FROM student_profiles WHERE current_step = :currentStep AND deleted = false"
    )
    Flux<StudentProfile> findByCurrentStep(
        @Param("currentStep") String currentStep
    );

    /** Count profiles by status */
    @Query(
        "SELECT COUNT(*) FROM student_profiles WHERE profile_status = :profileStatus AND deleted = false"
    )
    Mono<Long> countByProfileStatus(
        @Param("profileStatus") String profileStatus
    );

    /** Find incomplete profiles (less than 80% completion) */
    @Query(
        "SELECT * FROM student_profiles WHERE completion_percentage < 80 AND deleted = false ORDER BY updated_at DESC"
    )
    Flux<StudentProfile> findIncompleteProfiles();

    /** Find recently updated profiles */
    @Query(
        "SELECT * FROM student_profiles WHERE updated_at >= :since AND deleted = false ORDER BY updated_at DESC"
    )
    Flux<StudentProfile> findRecentlyUpdated(
        @Param("since") LocalDateTime since
    );

    /** Find verified profiles */
    @Query(
        "SELECT * FROM student_profiles WHERE is_verified = true AND deleted = false"
    )
    Flux<StudentProfile> findVerifiedProfiles();

    /** Find profiles by nationality (JSON query) */
    @Query(
        "SELECT * FROM student_profiles WHERE profile_data->'basic_info'->>'nationality' = :nationality AND deleted = false"
    )
    Flux<StudentProfile> findByNationality(
        @Param("nationality") String nationality
    );

    /** Find profiles by education level (JSON query) */
    @Query(
        "SELECT * FROM student_profiles WHERE profile_data->'education'->>'education_level' = :educationLevel AND deleted = false"
    )
    Flux<StudentProfile> findByEducationLevel(
        @Param("educationLevel") String educationLevel
    );

    /** Find profiles by target countries (JSON array query) */
    @Query(
        "SELECT * FROM student_profiles WHERE profile_data->'preferences'->'target_countries' ? :country AND deleted = false"
    )
    Flux<StudentProfile> findByTargetCountry(@Param("country") String country);

    /** Search profiles by field of study (case-insensitive) */
    @Query(
        "SELECT * FROM student_profiles WHERE LOWER(profile_data->'education'->>'field_of_study') LIKE LOWER(CONCAT('%', :fieldOfStudy, '%')) AND deleted = false"
    )
    Flux<StudentProfile> searchByFieldOfStudy(
        @Param("fieldOfStudy") String fieldOfStudy
    );

    /** Find profiles with test scores */
    @Query(
        "SELECT * FROM student_profiles WHERE profile_data->'test_scores' IS NOT NULL AND jsonb_typeof(profile_data->'test_scores') = 'object' AND deleted = false"
    )
    Flux<StudentProfile> findProfilesWithTestScores();

    /** Find profiles by GPA range (JSON query) */
    @Query(
        "SELECT * FROM student_profiles WHERE (profile_data->'education'->>'gpa')::numeric BETWEEN :minGpa AND :maxGpa AND deleted = false"
    )
    Flux<StudentProfile> findByGpaRange(
        @Param("minGpa") Double minGpa,
        @Param("maxGpa") Double maxGpa
    );

    /** Find profiles with GDPR consent */
    @Query(
        "SELECT * FROM student_profiles WHERE profile_data->'compliance'->>'gdpr_consent' = 'true' AND deleted = false"
    )
    Flux<StudentProfile> findWithGdprConsent();

    /** Count total active profiles */
    @Query("SELECT COUNT(*) FROM student_profiles WHERE deleted = false")
    Mono<Long> countActiveProfiles();

    /** Get completion statistics */
    @Query(
        "SELECT AVG(completion_percentage) FROM student_profiles WHERE deleted = false"
    )
    Mono<Double> getAverageCompletionPercentage();

    /** Update profile completion percentage */
    @Query(
        "UPDATE student_profiles SET completion_percentage = :percentage, updated_at = NOW() WHERE id = :id"
    )
    Mono<Integer> updateCompletionPercentage(
        @Param("id") UUID id,
        @Param("percentage") Integer percentage
    );

    /** Update profile status */
    @Query(
        "UPDATE student_profiles SET profile_status = :status, updated_at = NOW() WHERE id = :id"
    )
    Mono<Integer> updateProfileStatus(
        @Param("id") UUID id,
        @Param("status") String status
    );

    /** Update current step */
    @Query(
        "UPDATE student_profiles SET current_step = :currentStep, updated_at = NOW() WHERE id = :id"
    )
    Mono<Integer> updateCurrentStep(
        @Param("id") UUID id,
        @Param("currentStep") String currentStep
    );

    /** Mark profile as verified */
    @Query(
        "UPDATE student_profiles SET is_verified = true, verified_at = NOW(), verified_by = :verifiedBy, profile_status = 'VERIFIED', updated_at = NOW() WHERE id = :id"
    )
    Mono<Integer> markAsVerified(
        @Param("id") UUID id,
        @Param("verifiedBy") UUID verifiedBy
    );

    /** Soft delete profile */
    @Query(
        "UPDATE student_profiles SET deleted = true, updated_at = NOW() WHERE id = :id"
    )
    Mono<Integer> softDelete(@Param("id") UUID id);

    /** Find profiles for data export (with user info) */
    @Query(
        """
        SELECT sp.*, u.username, u.email, u.first_name, u.last_name
        FROM student_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.deleted = false
        ORDER BY sp.created_at DESC
        """
    )
    Flux<StudentProfile> findAllWithUserInfo();

    /** Search profiles by multiple criteria */
    @Query(
        """
        SELECT * FROM student_profiles
        WHERE deleted = false
        AND (:profileStatus IS NULL OR profile_status = :profileStatus)
        AND (:minCompletion IS NULL OR completion_percentage >= :minCompletion)
        AND (:maxCompletion IS NULL OR completion_percentage <= :maxCompletion)
        AND (:workflowStage IS NULL OR workflow_stage = :workflowStage)
        AND (:nationality IS NULL OR profile_data->'basic_info'->>'nationality' = :nationality)
        ORDER BY updated_at DESC
        """
    )
    Flux<StudentProfile> searchProfiles(
        @Param("profileStatus") String profileStatus,
        @Param("minCompletion") Integer minCompletion,
        @Param("maxCompletion") Integer maxCompletion,
        @Param("workflowStage") String workflowStage,
        @Param("nationality") String nationality
    );

    /** Find student profile by application ID (via applications table join) */
    @Query(
        """
        SELECT sp.* FROM student_profiles sp
        JOIN applications a ON sp.user_id = a.student_id
        WHERE a.id = CAST(:applicationId AS UUID) AND sp.deleted = false
        """
    )
    Mono<StudentProfile> findByApplicationId(
        @Param("applicationId") String applicationId
    );

    /** Find profiles that haven't been updated recently (for follow-up) */
    @Query(
        "SELECT * FROM student_profiles WHERE updated_at < :before AND completion_percentage < 100 AND deleted = false ORDER BY updated_at ASC"
    )
    Flux<StudentProfile> findStaleProfiles(
        @Param("before") LocalDateTime before
    );

    /** Get profile analytics data */
    @Query(
        """
        SELECT
            profile_status,
            COUNT(*) as count,
            AVG(completion_percentage) as avg_completion
        FROM student_profiles
        WHERE deleted = false
        GROUP BY profile_status
        """
    )
    Flux<Object[]> getProfileAnalytics();
}

package com.uniflow.admin.repository;

import com.uniflow.admin.entity.AdminProfile;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * AdminProfileRepository - Enhanced reactive repository for AdminProfile entity
 *
 * <p>Provides comprehensive database access methods for admin profile management with optimized
 * queries for filtering, searching, workload management, enhanced permission system, and analytics.
 *
 * <p>Enhanced Features:
 * - Granular permission system queries
 * - Advanced workload and capacity management
 * - Country-specific specialization filtering
 * - Performance metrics and quality scoring
 * - Audit trail support
 * - Multi-tenant support
 */
@Repository
public interface AdminProfileRepository
    extends R2dbcRepository<AdminProfile, UUID> {
    // Basic Lookups
    Mono<AdminProfile> findByUserId(String userId);

    Mono<AdminProfile> findByUserIdAndClientId(String userId, String clientId);

    Mono<AdminProfile> findByUsernameAndClientId(
        String username,
        String clientId
    );

    Mono<AdminProfile> findByEmployeeIdAndClientId(
        String employeeId,
        String clientId
    );

    Mono<AdminProfile> findByEmailAndClientId(String email, String clientId);

    // Role-based Queries
    Flux<AdminProfile> findByRoleAndClientId(String role, String clientId);

    Flux<AdminProfile> findBySpecializationAndClientId(
        String specialization,
        String clientId
    );

    Flux<AdminProfile> findByRoleAndSpecializationAndClientId(
        String role,
        String specialization,
        String clientId
    );

    Flux<AdminProfile> findByDepartmentAndClientId(
        String department,
        String clientId
    );

    // Status and Availability
    Flux<AdminProfile> findByIsActiveAndClientId(
        Boolean isActive,
        String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE is_active = true AND current_workload < max_daily_capacity AND client_id = :clientId"
    )
    Flux<AdminProfile> findAvailableAdmins(@Param("clientId") String clientId);

    @Query(
        "SELECT * FROM admin_profile WHERE is_active = true AND current_workload < max_daily_capacity AND specialization = :specialization AND client_id = :clientId"
    )
    Flux<AdminProfile> findAvailableAdminsBySpecialization(
        @Param("specialization") String specialization,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE is_active = true AND current_workload >= max_daily_capacity AND client_id = :clientId"
    )
    Flux<AdminProfile> findOverloadedAdmins(@Param("clientId") String clientId);

    @Query(
        "SELECT * FROM admin_profile WHERE is_active = true AND (current_workload::float / max_daily_capacity::float) > :threshold AND client_id = :clientId"
    )
    Flux<AdminProfile> findAdminsOverUtilizationThreshold(
        @Param("threshold") Double threshold,
        @Param("clientId") String clientId
    );

    // Workload Management
    Flux<AdminProfile> findByCurrentWorkloadLessThanAndClientId(
        Integer workloadThreshold,
        String clientId
    );

    Flux<AdminProfile> findByCurrentWorkloadGreaterThanAndClientId(
        Integer workloadThreshold,
        String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE client_id = :clientId ORDER BY current_workload ASC LIMIT :limit"
    )
    Flux<AdminProfile> findAdminsWithLowestWorkload(
        @Param("limit") Integer limit,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE is_active = true AND current_workload < max_daily_capacity AND specialization IN (:specializations) AND client_id = :clientId ORDER BY current_workload ASC"
    )
    Flux<AdminProfile> findBestAvailableAdminsForSpecializations(
        @Param("specializations") java.util.List<String> specializations,
        @Param("clientId") String clientId
    );

    // Enhanced Permissions and Capabilities
    Flux<AdminProfile> findByCanVerifyDocumentsAndClientId(
        Boolean canVerifyDocuments,
        String clientId
    );

    Flux<AdminProfile> findByCanApproveApplicationsAndClientId(
        Boolean canApproveApplications,
        String clientId
    );

    Flux<AdminProfile> findByCanProcessPaymentsAndClientId(
        Boolean canProcessPayments,
        String clientId
    );

    Flux<AdminProfile> findByCanManageUsersAndClientId(
        Boolean canManageUsers,
        String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE can_verify_documents = true AND can_approve_applications = true AND is_active = true AND client_id = :clientId"
    )
    Flux<AdminProfile> findSeniorAdmins(@Param("clientId") String clientId);

    // New Permission System Queries
    @Query(
        "SELECT * FROM admin_profile WHERE permissions LIKE CONCAT('%', :permissionKey, '%') AND client_id = :clientId"
    )
    Flux<AdminProfile> findByPermission(
        @Param("permissionKey") String permissionKey,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE permissions LIKE CONCAT('%', :permissionKey, '%') AND is_active = true AND client_id = :clientId"
    )
    Flux<AdminProfile> findActiveByPermission(
        @Param("permissionKey") String permissionKey,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE specialization_countries LIKE CONCAT('%', :countryCode, '%') AND client_id = :clientId"
    )
    Flux<AdminProfile> findByCountrySpecialization(
        @Param("countryCode") String countryCode,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE specialization_countries LIKE CONCAT('%', :countryCode, '%') AND is_active = true"
    )
    Flux<AdminProfile> findActiveAdminsWithCountrySpecialization(
        @Param("countryCode") String countryCode
    );

    @Query(
        "SELECT * FROM admin_profile WHERE language_proficiencies LIKE CONCAT('%', :languageCode, '%') AND client_id = :clientId"
    )
    Flux<AdminProfile> findByLanguageProficiency(
        @Param("languageCode") String languageCode,
        @Param("clientId") String clientId
    );

    // Performance Metrics
    @Query(
        "SELECT * FROM admin_profile WHERE quality_score >= :minScore AND client_id = :clientId ORDER BY quality_score DESC"
    )
    Flux<AdminProfile> findAdminsByQualityScore(
        @Param("minScore") Double minScore,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE total_applications_processed >= :minProcessed AND client_id = :clientId ORDER BY total_applications_processed DESC"
    )
    Flux<AdminProfile> findTopPerformingAdmins(
        @Param("minProcessed") Integer minProcessed,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE average_processing_time <= :maxTime AND average_processing_time > 0 AND client_id = :clientId ORDER BY average_processing_time ASC"
    )
    Flux<AdminProfile> findFastestAdmins(
        @Param("maxTime") Double maxTime,
        @Param("clientId") String clientId
    );

    // Activity Tracking
    Flux<AdminProfile> findByLastActivityAfterAndClientId(
        LocalDateTime lastActivity,
        String clientId
    );

    Flux<AdminProfile> findByLastLoginAfterAndClientId(
        LocalDateTime lastLogin,
        String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE last_activity < :cutoffTime AND is_active = true AND client_id = :clientId"
    )
    Flux<AdminProfile> findInactiveAdmins(
        @Param("cutoffTime") LocalDateTime cutoffTime,
        @Param("clientId") String clientId
    );

    // Search and Filtering
    @Query(
        "SELECT * FROM admin_profile WHERE " +
            "(LOWER(first_name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(last_name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(employee_id) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND client_id = :clientId"
    )
    Flux<AdminProfile> searchAdmins(
        @Param("query") String query,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT * FROM admin_profile WHERE " +
            "(:role IS NULL OR role = :role) AND " +
            "(:specialization IS NULL OR specialization = :specialization) AND " +
            "(:department IS NULL OR department = :department) AND " +
            "(:isActive IS NULL OR is_active = :isActive) AND " +
            "client_id = :clientId " +
            "ORDER BY created_at DESC"
    )
    Flux<AdminProfile> findAdminsWithFilters(
        @Param("role") String role,
        @Param("specialization") String specialization,
        @Param("department") String department,
        @Param("isActive") Boolean isActive,
        @Param("clientId") String clientId
    );

    // Statistics and Analytics
    @Query("SELECT COUNT(*) FROM admin_profile WHERE client_id = :clientId")
    Mono<Long> countByClientId(@Param("clientId") String clientId);

    @Query(
        "SELECT COUNT(*) FROM admin_profile WHERE is_active = true AND client_id = :clientId"
    )
    Mono<Long> countActiveAdmins(@Param("clientId") String clientId);

    @Query(
        "SELECT COUNT(*) FROM admin_profile WHERE is_active = true AND current_workload < max_daily_capacity AND client_id = :clientId"
    )
    Mono<Long> countAvailableAdmins(@Param("clientId") String clientId);

    @Query(
        "SELECT COUNT(*) FROM admin_profile WHERE is_active = true AND current_workload >= max_daily_capacity AND client_id = :clientId"
    )
    Mono<Long> countOverloadedAdmins(@Param("clientId") String clientId);

    @Query(
        "SELECT COUNT(*) FROM admin_profile WHERE role = :role AND client_id = :clientId"
    )
    Mono<Long> countByRoleAndClientId(
        @Param("role") String role,
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT COUNT(*) FROM admin_profile WHERE specialization = :specialization AND client_id = :clientId"
    )
    Mono<Long> countBySpecializationAndClientId(
        @Param("specialization") String specialization,
        @Param("clientId") String clientId
    );

    // Aggregation Queries
    @Query(
        "SELECT AVG(quality_score) FROM admin_profile WHERE is_active = true AND client_id = :clientId"
    )
    Mono<Double> getAverageQualityScore(@Param("clientId") String clientId);

    @Query(
        "SELECT AVG(average_processing_time) FROM admin_profile WHERE is_active = true AND average_processing_time > 0 AND client_id = :clientId"
    )
    Mono<Double> getAverageProcessingTime(@Param("clientId") String clientId);

    @Query(
        "SELECT AVG(current_workload::float / max_daily_capacity::float * 100) FROM admin_profile WHERE is_active = true AND client_id = :clientId"
    )
    Mono<Double> getAverageUtilizationPercentage(
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT SUM(current_workload) FROM admin_profile WHERE is_active = true AND client_id = :clientId"
    )
    Mono<Long> getTotalCurrentWorkload(@Param("clientId") String clientId);

    @Query(
        "SELECT SUM(total_applications_processed) FROM admin_profile WHERE client_id = :clientId"
    )
    Mono<Long> getTotalApplicationsProcessed(
        @Param("clientId") String clientId
    );

    // Distribution Queries
    @Query(
        "SELECT role, COUNT(*) as count FROM admin_profile WHERE is_active = true AND client_id = :clientId GROUP BY role"
    )
    Flux<Object[]> getRoleDistribution(@Param("clientId") String clientId);

    @Query(
        "SELECT specialization, COUNT(*) as count FROM admin_profile WHERE is_active = true AND client_id = :clientId GROUP BY specialization"
    )
    Flux<Object[]> getSpecializationDistribution(
        @Param("clientId") String clientId
    );

    @Query(
        "SELECT department, COUNT(*) as count FROM admin_profile WHERE is_active = true AND department IS NOT NULL AND client_id = :clientId GROUP BY department"
    )
    Flux<Object[]> getDepartmentDistribution(
        @Param("clientId") String clientId
    );

    // Update Operations
    @Query(
        "UPDATE admin_profile SET current_workload = current_workload + :increment, last_activity_at = :lastActivity WHERE id = :id"
    )
    Mono<Integer> updateWorkload(
        @Param("id") UUID id,
        @Param("increment") Integer increment,
        @Param("lastActivity") LocalDateTime lastActivity
    );

    @Query("UPDATE admin_profile SET last_login = :lastLogin WHERE id = :id")
    Mono<Integer> updateLastLogin(
        @Param("id") UUID id,
        @Param("lastLogin") LocalDateTime lastLogin
    );

    @Query(
        "UPDATE admin_profile SET last_activity_at = :lastActivity WHERE id = :id"
    )
    Mono<Integer> updateLastActivity(
        @Param("id") UUID id,
        @Param("lastActivity") LocalDateTime lastActivity
    );

    @Query(
        "UPDATE admin_profile SET quality_score = :qualityScore, average_processing_time_hours = :avgTime WHERE id = :id"
    )
    Mono<Integer> updatePerformanceMetrics(
        @Param("id") UUID id,
        @Param("qualityScore") Double qualityScore,
        @Param("avgTime") Double avgTime
    );

    @Query("UPDATE admin_profile SET is_active = :isActive WHERE id = :id")
    Mono<Integer> updateActiveStatus(
        @Param("id") UUID id,
        @Param("isActive") Boolean isActive
    );

    // Enhanced Permission Update Operations
    @Query(
        "UPDATE admin_profile SET permissions = :permissions, permission_last_updated = :lastUpdated, permission_last_updated_by = :updatedBy WHERE id = :id"
    )
    Mono<Integer> updatePermissions(
        @Param("id") UUID id,
        @Param("permissions") String permissions,
        @Param("lastUpdated") LocalDateTime lastUpdated,
        @Param("updatedBy") String updatedBy
    );

    @Query(
        "UPDATE admin_profile SET specialization_countries = :countries WHERE id = :id"
    )
    Mono<Integer> updateSpecializationCountries(
        @Param("id") UUID id,
        @Param("countries") String countries
    );

    @Query(
        "UPDATE admin_profile SET language_proficiencies = :languages WHERE id = :id"
    )
    Mono<Integer> updateLanguageProficiencies(
        @Param("id") UUID id,
        @Param("languages") String languages
    );

    // Bulk Operations
    @Query(
        "UPDATE admin_profile SET current_workload = GREATEST(current_workload + :increment, 0) WHERE id IN (:ids)"
    )
    Mono<Integer> bulkUpdateWorkload(
        @Param("ids") java.util.List<UUID> ids,
        @Param("increment") Integer increment
    );

    @Query(
        "UPDATE admin_profile SET current_workload = 0 WHERE client_id = :clientId"
    )
    Mono<Integer> resetAllWorkloads(@Param("clientId") String clientId);

    // Workflow-specific methods
    @Query(
        "SELECT COUNT(*) FROM admin_profile WHERE specialization_countries LIKE CONCAT('%', :countryCode, '%') AND specialization LIKE CONCAT('%', :degreeLevel, '%') AND is_active = true"
    )
    Mono<Long> countByCountryAndDegreeLevel(
        @Param("countryCode") String countryCode,
        @Param("degreeLevel") String degreeLevel
    );

    @Query(
        "SELECT * FROM admin_profile WHERE specialization_countries LIKE CONCAT('%', :countryCode, '%') AND specialization LIKE CONCAT('%', :degreeLevel, '%') AND is_active = true"
    )
    Flux<AdminProfile> findByCountryAndDegreeLevel(
        @Param("countryCode") String countryCode,
        @Param("degreeLevel") String degreeLevel
    );
}

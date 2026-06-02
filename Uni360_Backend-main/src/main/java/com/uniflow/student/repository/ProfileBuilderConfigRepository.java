package com.uniflow.student.repository;

import com.uniflow.student.entity.ProfileBuilderConfig;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for ProfileBuilderConfig entity
 *
 * <p>Provides reactive CRUD operations for profile builder configurations
 * with support for client-specific, active, and default configuration queries.
 */
@Repository
public interface ProfileBuilderConfigRepository
    extends R2dbcRepository<ProfileBuilderConfig, Long> {

    /**
     * Find active configuration for a specific client
     *
     * @param clientId The client identifier
     * @return Mono of ProfileBuilderConfig if found
     */
    @Query(
        "SELECT * FROM profile_builder_configs " +
        "WHERE client_id = :clientId " +
        "AND is_active = true " +
        "AND deleted = false " +
        "ORDER BY created_at DESC " +
        "LIMIT 1"
    )
    Mono<ProfileBuilderConfig> findActiveByClientId(@Param("clientId") String clientId);

    /**
     * Find default configuration for a specific client
     *
     * @param clientId The client identifier
     * @return Mono of ProfileBuilderConfig if found
     */
    @Query(
        "SELECT * FROM profile_builder_configs " +
        "WHERE client_id = :clientId " +
        "AND is_default = true " +
        "AND is_active = true " +
        "AND deleted = false " +
        "LIMIT 1"
    )
    Mono<ProfileBuilderConfig> findDefaultByClientId(@Param("clientId") String clientId);

    /**
     * Find all configurations for a specific client (including inactive)
     *
     * @param clientId The client identifier
     * @return Flux of ProfileBuilderConfig
     */
    @Query(
        "SELECT * FROM profile_builder_configs " +
        "WHERE client_id = :clientId " +
        "AND deleted = false " +
        "ORDER BY is_active DESC, created_at DESC"
    )
    Flux<ProfileBuilderConfig> findAllByClientId(@Param("clientId") String clientId);

    /**
     * Find configuration by client ID and version
     *
     * @param clientId The client identifier
     * @param version The configuration version
     * @return Mono of ProfileBuilderConfig if found
     */
    @Query(
        "SELECT * FROM profile_builder_configs " +
        "WHERE client_id = :clientId " +
        "AND version = :version " +
        "AND deleted = false"
    )
    Mono<ProfileBuilderConfig> findByClientIdAndVersion(
        @Param("clientId") String clientId,
        @Param("version") String version
    );

    /**
     * Check if a configuration exists by client ID and version
     *
     * @param clientId The client identifier
     * @param version The configuration version
     * @return Mono of Boolean indicating existence
     */
    @Query(
        "SELECT EXISTS(" +
        "SELECT 1 FROM profile_builder_configs " +
        "WHERE client_id = :clientId " +
        "AND version = :version " +
        "AND deleted = false" +
        ")"
    )
    Mono<Boolean> existsByClientIdAndVersion(
        @Param("clientId") String clientId,
        @Param("version") String version
    );

    /**
     * Deactivate all configurations for a client (used before activating a new one)
     *
     * @param clientId The client identifier
     * @return Mono of Integer indicating number of rows updated
     */
    @Query(
        "UPDATE profile_builder_configs " +
        "SET is_active = false, updated_at = CURRENT_TIMESTAMP " +
        "WHERE client_id = :clientId " +
        "AND is_active = true " +
        "AND deleted = false"
    )
    Mono<Integer> deactivateAllByClientId(@Param("clientId") String clientId);

    /**
     * Remove default flag from all configurations for a client
     *
     * @param clientId The client identifier
     * @return Mono of Integer indicating number of rows updated
     */
    @Query(
        "UPDATE profile_builder_configs " +
        "SET is_default = false, updated_at = CURRENT_TIMESTAMP " +
        "WHERE client_id = :clientId " +
        "AND is_default = true " +
        "AND deleted = false"
    )
    Mono<Integer> removeDefaultFlagByClientId(@Param("clientId") String clientId);

    /**
     * Count active configurations for a client
     *
     * @param clientId The client identifier
     * @return Mono of Long indicating count
     */
    @Query(
        "SELECT COUNT(*) FROM profile_builder_configs " +
        "WHERE client_id = :clientId " +
        "AND is_active = true " +
        "AND deleted = false"
    )
    Mono<Long> countActiveByClientId(@Param("clientId") String clientId);

    /**
     * Find all active configurations (across all clients)
     *
     * @return Flux of ProfileBuilderConfig
     */
    @Query(
        "SELECT * FROM profile_builder_configs " +
        "WHERE is_active = true " +
        "AND deleted = false " +
        "ORDER BY client_id, created_at DESC"
    )
    Flux<ProfileBuilderConfig> findAllActive();

    /**
     * Soft delete configuration by ID
     *
     * @param id The configuration ID
     * @return Mono of Integer indicating number of rows updated
     */
    @Query(
        "UPDATE profile_builder_configs " +
        "SET deleted = true, is_active = false, updated_at = CURRENT_TIMESTAMP " +
        "WHERE id = :id"
    )
    Mono<Integer> softDeleteById(@Param("id") Long id);
}

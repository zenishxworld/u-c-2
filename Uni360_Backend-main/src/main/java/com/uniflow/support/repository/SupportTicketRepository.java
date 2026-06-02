package com.uniflow.support.repository;

import com.uniflow.support.entity.SupportTicket;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository interface for SupportTicket entity operations.
 * Provides reactive database access with custom queries for ticket management.
 */
@Repository
public interface SupportTicketRepository
    extends R2dbcRepository<SupportTicket, UUID> {
    /**
     * Find all tickets assigned to a specific admin
     */
    @Query(
        "SELECT * FROM support_tickets WHERE assigned_admin_id = :adminId ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByAssignedAdminIdOrderByCreatedAtDesc(
        @Param("adminId") Long adminId
    );

    /**
     * Find all tickets for a specific student
     */
    @Query(
        "SELECT * FROM support_tickets WHERE student_id = :studentId ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByStudentIdOrderByCreatedAtDesc(
        @Param("studentId") Long studentId
    );

    /**
     * Find tickets by status
     */
    @Query(
        "SELECT * FROM support_tickets WHERE status = :status ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByStatusOrderByCreatedAtDesc(
        @Param("status") String status
    );

    /**
     * Find tickets by priority
     */
    @Query(
        "SELECT * FROM support_tickets WHERE priority = :priority ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByPriorityOrderByCreatedAtDesc(
        @Param("priority") String priority
    );

    /**
     * Find escalated tickets
     */
    @Query(
        "SELECT * FROM support_tickets WHERE escalated = true ORDER BY escalated_at DESC"
    )
    Flux<SupportTicket> findEscalatedTicketsOrderByEscalatedAtDesc();

    /**
     * Find tickets escalated to a specific admin
     */
    @Query(
        "SELECT * FROM support_tickets WHERE escalated_to = :adminId ORDER BY escalated_at DESC"
    )
    Flux<SupportTicket> findByEscalatedToOrderByEscalatedAtDesc(
        @Param("adminId") Long adminId
    );

    /**
     * Find unassigned tickets (open tickets without assigned admin)
     */
    @Query(
        "SELECT * FROM support_tickets WHERE assigned_admin_id IS NULL AND status = 'OPEN' ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findUnassignedTicketsOrderByCreatedAtDesc();

    /**
     * Find tickets by type
     */
    @Query(
        "SELECT * FROM support_tickets WHERE ticket_type = :ticketType ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByTicketTypeOrderByCreatedAtDesc(
        @Param("ticketType") String ticketType
    );

    /**
     * Find tickets for a specific application
     */
    @Query(
        "SELECT * FROM support_tickets WHERE application_id = :applicationId ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByApplicationIdOrderByCreatedAtDesc(
        @Param("applicationId") UUID applicationId
    );

    /**
     * Find tickets created within date range
     */
    @Query(
        "SELECT * FROM support_tickets WHERE created_at BETWEEN :startDate AND :endDate ORDER BY created_at DESC"
    )
    Flux<SupportTicket> findByCreatedAtBetweenOrderByCreatedAtDesc(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Count tickets by status
     */
    @Query("SELECT COUNT(*) FROM support_tickets WHERE status = :status")
    Mono<Long> countByStatus(@Param("status") String status);

    /**
     * Count tickets by priority
     */
    @Query("SELECT COUNT(*) FROM support_tickets WHERE priority = :priority")
    Mono<Long> countByPriority(@Param("priority") String priority);

    /**
     * Count tickets assigned to admin
     */
    @Query(
        "SELECT COUNT(*) FROM support_tickets WHERE assigned_admin_id = :adminId"
    )
    Mono<Long> countByAssignedAdminId(@Param("adminId") Long adminId);

    /**
     * Count escalated tickets
     */
    @Query("SELECT COUNT(*) FROM support_tickets WHERE escalated = true")
    Mono<Long> countEscalatedTickets();

    /**
     * Count tickets for student
     */
    @Query("SELECT COUNT(*) FROM support_tickets WHERE student_id = :studentId")
    Mono<Long> countByStudentId(@Param("studentId") Long studentId);

    /**
     * Find ticket by ticket number
     */
    @Query("SELECT * FROM support_tickets WHERE ticket_number = :ticketNumber")
    Mono<SupportTicket> findByTicketNumber(
        @Param("ticketNumber") String ticketNumber
    );

    /**
     * Check if ticket number exists
     */
    @Query(
        "SELECT COUNT(*) > 0 FROM support_tickets WHERE ticket_number = :ticketNumber"
    )
    Mono<Boolean> existsByTicketNumber(
        @Param("ticketNumber") String ticketNumber
    );

    /**
     * Find tickets with complex filter conditions (for admin dashboard)
     */
    @Query(
        """
            SELECT * FROM support_tickets
            WHERE (:adminId IS NULL OR assigned_admin_id = :adminId)
            AND (:status IS NULL OR status = :status)
            AND (:priority IS NULL OR priority = :priority)
            AND (:ticketType IS NULL OR ticket_type = :ticketType)
            AND (:escalated IS NULL OR escalated = :escalated)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """
    )
    Flux<SupportTicket> findTicketsWithFilters(
        @Param("adminId") Long adminId,
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("ticketType") String ticketType,
        @Param("escalated") Boolean escalated,
        @Param("limit") Long limit,
        @Param("offset") Long offset
    );

    /**
     * Count tickets with complex filter conditions
     */
    @Query(
        """
            SELECT COUNT(*) FROM support_tickets
            WHERE (:adminId IS NULL OR assigned_admin_id = :adminId)
            AND (:status IS NULL OR status = :status)
            AND (:priority IS NULL OR priority = :priority)
            AND (:ticketType IS NULL OR ticket_type = :ticketType)
            AND (:escalated IS NULL OR escalated = :escalated)
        """
    )
    Mono<Long> countTicketsWithFilters(
        @Param("adminId") Long adminId,
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("ticketType") String ticketType,
        @Param("escalated") Boolean escalated
    );

    /**
     * Find recent tickets for dashboard
     */
    @Query(
        "SELECT * FROM support_tickets WHERE created_at >= :since ORDER BY created_at DESC LIMIT :limit"
    )
    Flux<SupportTicket> findRecentTickets(
        @Param("since") LocalDateTime since,
        @Param("limit") Long limit
    );

    /**
     * Update ticket status
     */
    @Query(
        "UPDATE support_tickets SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
    )
    Mono<Integer> updateTicketStatus(
        @Param("id") UUID id,
        @Param("status") String status
    );

    /**
     * Assign ticket to admin
     */
    @Query(
        """
            UPDATE support_tickets
            SET assigned_admin_id = :adminId, status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """
    )
    Mono<Integer> assignTicketToAdmin(
        @Param("id") UUID id,
        @Param("adminId") Long adminId
    );

    /**
     * Escalate ticket
     */
    @Query(
        """
            UPDATE support_tickets
            SET escalated = true, escalated_to = :escalatedTo, escalated_at = CURRENT_TIMESTAMP,
                priority = 'HIGH', updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """
    )
    Mono<Integer> escalateTicket(
        @Param("id") UUID id,
        @Param("escalatedTo") Long escalatedTo
    );

    /**
     * Resolve ticket
     */
    @Query(
        """
            UPDATE support_tickets
            SET status = 'RESOLVED', resolved_by = :resolvedBy, resolved_at = CURRENT_TIMESTAMP,
                resolution = :resolution, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """
    )
    Mono<Integer> resolveTicket(
        @Param("id") UUID id,
        @Param("resolvedBy") Long resolvedBy,
        @Param("resolution") String resolution
    );
    /**
     * Find tickets scoped to an admin:
     * - Tickets directly assigned to this admin, OR
     * - Tickets from students who have at least one application assigned to this admin
     * If no admin has been assigned to a ticket's student yet, it shows to all.
     */
    @Query(
        """
            SELECT DISTINCT st.* FROM support_tickets st
            WHERE (
                st.assigned_admin_id = :adminId
                OR st.student_id IN (
                    SELECT DISTINCT a.student_id
                    FROM applications a
                    WHERE a.assigned_admin_id = :adminId
                      AND a.is_active = true
                )
                OR (
                    st.assigned_admin_id IS NULL
                    AND st.student_id NOT IN (
                        SELECT DISTINCT a.student_id
                        FROM applications a
                        WHERE a.assigned_admin_id IS NOT NULL
                          AND a.is_active = true
                    )
                )
            )
            AND (:status IS NULL OR st.status = :status)
            AND (:priority IS NULL OR st.priority = :priority)
            AND (:ticketType IS NULL OR st.ticket_type = :ticketType)
            AND (:escalated IS NULL OR st.escalated = :escalated)
            ORDER BY st.created_at DESC
            LIMIT :limit OFFSET :offset
        """
    )
    Flux<SupportTicket> findTicketsByAdminScope(
        @Param("adminId") Long adminId,
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("ticketType") String ticketType,
        @Param("escalated") Boolean escalated,
        @Param("limit") Long limit,
        @Param("offset") Long offset
    );

    /**
     * Count tickets scoped to an admin (mirrors findTicketsByAdminScope)
     */
    @Query(
        """
            SELECT COUNT(DISTINCT st.id) FROM support_tickets st
            WHERE (
                st.assigned_admin_id = :adminId
                OR st.student_id IN (
                    SELECT DISTINCT a.student_id
                    FROM applications a
                    WHERE a.assigned_admin_id = :adminId
                      AND a.is_active = true
                )
                OR (
                    st.assigned_admin_id IS NULL
                    AND st.student_id NOT IN (
                        SELECT DISTINCT a.student_id
                        FROM applications a
                        WHERE a.assigned_admin_id IS NOT NULL
                          AND a.is_active = true
                    )
                )
            )
            AND (:status IS NULL OR st.status = :status)
            AND (:priority IS NULL OR st.priority = :priority)
            AND (:ticketType IS NULL OR st.ticket_type = :ticketType)
            AND (:escalated IS NULL OR st.escalated = :escalated)
        """
    )
    Mono<Long> countTicketsByAdminScope(
        @Param("adminId") Long adminId,
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("ticketType") String ticketType,
        @Param("escalated") Boolean escalated
    );
}

package com.uniflow.support.repository;

import com.uniflow.support.entity.TicketMessage;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository interface for TicketMessage entity operations.
 * Provides reactive database access for ticket communication management.
 */
@Repository
public interface TicketMessageRepository
    extends R2dbcRepository<TicketMessage, UUID> {
    /**
     * Find all messages for a specific ticket ordered by creation time
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE ticket_id = :ticketId ORDER BY created_at ASC"
    )
    Flux<TicketMessage> findByTicketIdOrderByCreatedAtAsc(
        @Param("ticketId") UUID ticketId
    );

    /**
     * Find messages by sender
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE sender_id = :senderId AND sender_type = :senderType ORDER BY created_at DESC"
    )
    Flux<TicketMessage> findBySenderIdAndSenderTypeOrderByCreatedAtDesc(
        @Param("senderId") Long senderId,
        @Param("senderType") String senderType
    );

    /**
     * Find messages for a ticket by sender type
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE ticket_id = :ticketId AND sender_type = :senderType ORDER BY created_at ASC"
    )
    Flux<TicketMessage> findByTicketIdAndSenderTypeOrderByCreatedAtAsc(
        @Param("ticketId") UUID ticketId,
        @Param("senderType") String senderType
    );

    /**
     * Find messages with attachments
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 ORDER BY created_at DESC"
    )
    Flux<TicketMessage> findMessagesWithAttachmentsOrderByCreatedAtDesc();

    /**
     * Find recent messages for a ticket
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE ticket_id = :ticketId AND created_at >= :since ORDER BY created_at DESC LIMIT :limit"
    )
    Flux<TicketMessage> findRecentMessagesByTicketId(
        @Param("ticketId") UUID ticketId,
        @Param("since") LocalDateTime since,
        @Param("limit") Long limit
    );

    /**
     * Count messages for a ticket
     */
    @Query("SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = :ticketId")
    Mono<Long> countByTicketId(@Param("ticketId") UUID ticketId);

    /**
     * Count messages by sender
     */
    @Query(
        "SELECT COUNT(*) FROM ticket_messages WHERE sender_id = :senderId AND sender_type = :senderType"
    )
    Mono<Long> countBySenderIdAndSenderType(
        @Param("senderId") Long senderId,
        @Param("senderType") String senderType
    );

    /**
     * Count messages with attachments for a ticket
     */
    @Query(
        "SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = :ticketId AND attachments IS NOT NULL AND jsonb_array_length(attachments) > 0"
    )
    Mono<Long> countMessagesWithAttachmentsByTicketId(
        @Param("ticketId") UUID ticketId
    );

    /**
     * Find latest message for a ticket
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE ticket_id = :ticketId ORDER BY created_at DESC LIMIT 1"
    )
    Mono<TicketMessage> findLatestMessageByTicketId(
        @Param("ticketId") UUID ticketId
    );

    /**
     * Find messages created within date range
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE created_at BETWEEN :startDate AND :endDate ORDER BY created_at DESC"
    )
    Flux<TicketMessage> findByCreatedAtBetweenOrderByCreatedAtDesc(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find messages for multiple tickets
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE ticket_id = ANY(:ticketIds) ORDER BY ticket_id, created_at ASC"
    )
    Flux<TicketMessage> findByTicketIdInOrderByTicketIdAndCreatedAtAsc(
        @Param("ticketIds") UUID[] ticketIds
    );

    /**
     * Delete all messages for a ticket (for ticket cleanup)
     */
    @Query("DELETE FROM ticket_messages WHERE ticket_id = :ticketId")
    Mono<Integer> deleteByTicketId(@Param("ticketId") UUID ticketId);

    /**
     * Find all admin messages for analytics
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE sender_type = 'ADMIN' ORDER BY created_at DESC"
    )
    Flux<TicketMessage> findAllAdminMessagesOrderByCreatedAtDesc();

    /**
     * Find all student messages for analytics
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE sender_type = 'STUDENT' ORDER BY created_at DESC"
    )
    Flux<TicketMessage> findAllStudentMessagesOrderByCreatedAtDesc();

    /**
     * Count total messages in system
     */
    @Query("SELECT COUNT(*) FROM ticket_messages")
    Mono<Long> countAllMessages();

    /**
     * Find messages for ticket with pagination
     */
    @Query(
        "SELECT * FROM ticket_messages WHERE ticket_id = :ticketId ORDER BY created_at ASC LIMIT :limit OFFSET :offset"
    )
    Flux<TicketMessage> findByTicketIdWithPagination(
        @Param("ticketId") UUID ticketId,
        @Param("limit") Long limit,
        @Param("offset") Long offset
    );
}

package com.uniflow.support.handler;

import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.support.dto.SupportTicketRequest;
import com.uniflow.support.dto.SupportTicketResponse;
import com.uniflow.support.dto.TicketMessageRequest;
import com.uniflow.support.dto.TicketStatusUpdateRequest;
import com.uniflow.support.entity.TicketMessage;
import com.uniflow.support.service.SupportTicketService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * SupportTicketHandler - Functional Request Handler for Support Ticket Management
 *
 * <p>This handler implements support ticket management endpoints for admin users,
 * providing reactive endpoints for ticket creation, management, status updates,
 * and communication functionality with JWT-based authentication and authorization.
 *
 * <p>Key Features:
 * - Support ticket creation and management
 * - Ticket status updates and escalation
 * - Ticket messaging and communication
 * - JWT-based user authentication and authorization
 * - Admin-level ticket access control
 * - Standardized ApiResponse wrapper
 * - Comprehensive error handling
 * - Integration with notification system
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SupportTicketHandler {

    private final SupportTicketService supportTicketService;
    private final JwtUtils jwtUtils;

    /**
     * Create a new support ticket
     * POST /admin/support/tickets
     */
    public Mono<ServerResponse> createSupportTicket(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto ->
                request
                    .bodyToMono(SupportTicketRequest.class)
                    .flatMap(ticketRequest ->
                        supportTicketService.createSupportTicket(
                            ticketRequest,
                            userDto.getId()
                        )
                    )
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                ApiResponse.success(
                                    response,
                                    "Support ticket created successfully"
                                )
                            )
                    )
            )
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error creating support ticket", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to create support ticket")
                    );
            });
    }

    /**
     * Get support tickets for admin with filtering and pagination
     * GET /admin/support/tickets
     */
    public Mono<ServerResponse> getAdminTickets(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto -> {
                // Extract query parameters
                String status = request.queryParam("status").orElse(null);
                String priority = request.queryParam("priority").orElse(null);
                String ticketType = request
                    .queryParam("ticketType")
                    .orElse(null);
                Boolean escalated = request
                    .queryParam("escalated")
                    .map(Boolean::parseBoolean)
                    .orElse(null);

                Long limit = request
                    .queryParam("limit")
                    .map(Long::parseLong)
                    .orElse(20L);
                Long offset = request
                    .queryParam("offset")
                    .map(Long::parseLong)
                    .orElse(0L);

                // Always scope tickets to the calling admin — never return all tickets globally
                Long adminId = userDto.getId();

                return supportTicketService
                    .getAdminTickets(
                        adminId,
                        status,
                        priority,
                        ticketType,
                        escalated,
                        limit,
                        offset
                    )
                    .collectList()
                    .zipWith(
                        supportTicketService.getAdminTicketCount(
                            adminId,
                            status,
                            priority,
                            ticketType,
                            escalated
                        )
                    )
                    .flatMap(tuple -> {
                        var tickets = tuple.getT1();
                        var totalCount = tuple.getT2();

                        var response = new TicketListResponse(
                            tickets,
                            totalCount,
                            limit,
                            offset
                        );

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                ApiResponse.success(
                                    response,
                                    "Tickets retrieved successfully"
                                )
                            );
                    });
            })
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error retrieving admin tickets", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to retrieve tickets"));
            });
    }

    /**
     * Get specific ticket by ID
     * GET /admin/support/tickets/{ticketId}
     */
    public Mono<ServerResponse> getTicketById(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto -> {
                try {
                    UUID ticketId = UUID.fromString(
                        request.pathVariable("ticketId")
                    );

                    return supportTicketService
                        .getTicketById(ticketId, userDto.getId())
                        .flatMap(response ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        response,
                                        "Tickets retrieved successfully"
                                    )
                                )
                        );
                } catch (IllegalArgumentException ex) {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid ticket ID format")
                        );
                }
            })
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error retrieving ticket", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to retrieve ticket"));
            });
    }

    /**
     * Update ticket status
     * PUT /admin/support/tickets/{ticketId}/status
     */
    public Mono<ServerResponse> updateTicketStatus(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto -> {
                try {
                    UUID ticketId = UUID.fromString(
                        request.pathVariable("ticketId")
                    );

                    return request
                        .bodyToMono(TicketStatusUpdateRequest.class)
                        .doOnNext(updateRequest ->
                            updateRequest.setTicketId(ticketId)
                        )
                        .flatMap(updateRequest ->
                            supportTicketService.updateTicketStatus(
                                updateRequest,
                                userDto.getId()
                            )
                        )
                        .flatMap(response ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        response,
                                        "Ticket status updated successfully"
                                    )
                                )
                        );
                } catch (IllegalArgumentException ex) {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid ticket ID format")
                        );
                }
            })
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error updating ticket status", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to update ticket status")
                    );
            });
    }

    /**
     * Add message to ticket
     * POST /admin/support/tickets/{ticketId}/messages
     */
    public Mono<ServerResponse> addTicketMessage(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto -> {
                try {
                    UUID ticketId = UUID.fromString(
                        request.pathVariable("ticketId")
                    );

                    return request
                        .bodyToMono(TicketMessageRequest.class)
                        .doOnNext(messageRequest -> {
                            messageRequest.setTicketId(ticketId);
                            messageRequest.setSenderId(userDto.getId());
                            messageRequest.setSenderType("ADMIN");
                        })
                        .flatMap(messageRequest ->
                            supportTicketService.addTicketMessage(
                                messageRequest,
                                userDto.getId()
                            )
                        )
                        .flatMap(response ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        response,
                                        "Message added successfully"
                                    )
                                )
                        );
                } catch (IllegalArgumentException ex) {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid ticket ID format")
                        );
                }
            })
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error adding ticket message", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to add message"));
            });
    }

    /**
     * Escalate ticket to higher authority
     * POST /admin/support/tickets/{ticketId}/escalate
     */
    public Mono<ServerResponse> escalateTicket(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto -> {
                try {
                    UUID ticketId = UUID.fromString(
                        request.pathVariable("ticketId")
                    );

                    return request
                        .bodyToMono(EscalationRequest.class)
                        .flatMap(escalationRequest ->
                            supportTicketService.escalateTicket(
                                ticketId,
                                escalationRequest.getEscalatedTo(),
                                userDto.getId()
                            )
                        )
                        .flatMap(response ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        response,
                                        "Ticket escalated successfully"
                                    )
                                )
                        );
                } catch (IllegalArgumentException ex) {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid ticket ID format")
                        );
                }
            })
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error escalating ticket", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to escalate ticket"));
            });
    }

    /**
     * Get ticket messages
     * GET /admin/support/tickets/{ticketId}/messages
     */
    public Mono<ServerResponse> getTicketMessages(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto -> {
                try {
                    UUID ticketId = UUID.fromString(
                        request.pathVariable("ticketId")
                    );

                    Long limit = request
                        .queryParam("limit")
                        .map(Long::parseLong)
                        .orElse(50L);
                    Long offset = request
                        .queryParam("offset")
                        .map(Long::parseLong)
                        .orElse(0L);

                    // First verify the admin has access to this ticket
                    return supportTicketService
                        .getTicketById(ticketId, userDto.getId())
                        .flatMap(ticket ->
                            supportTicketService
                                .getTicketMessages(ticketId, limit, offset)
                                .collectList()
                                .flatMap(messages ->
                                    ServerResponse.ok()
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .bodyValue(
                                            ApiResponse.success(
                                                messages,
                                                "Messages retrieved successfully"
                                            )
                                        )
                                )
                        );
                } catch (IllegalArgumentException ex) {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid ticket ID format")
                        );
                }
            })
            .onErrorResume(IllegalArgumentException.class, ex ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Invalid request: " + ex.getMessage())
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error retrieving ticket messages", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to retrieve messages")
                    );
            });
    }

    /**
     * Get ticket statistics for admin dashboard
     * GET /admin/support/statistics
     */
    public Mono<ServerResponse> getTicketStatistics(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto ->
                supportTicketService
                    .getTicketStatistics(userDto.getId())
                    .flatMap(statistics ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                ApiResponse.success(
                                    statistics,
                                    "Statistics retrieved successfully"
                                )
                            )
                    )
            )
            .onErrorResume(Exception.class, ex -> {
                log.error("Error retrieving ticket statistics", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to retrieve statistics")
                    );
            });
    }

    // Helper DTOs for responses
    public static class TicketListResponse {

        private final java.util.List<SupportTicketResponse> tickets;
        private final Long totalCount;
        private final Long limit;
        private final Long offset;

        public TicketListResponse(
            java.util.List<SupportTicketResponse> tickets,
            Long totalCount,
            Long limit,
            Long offset
        ) {
            this.tickets = tickets;
            this.totalCount = totalCount;
            this.limit = limit;
            this.offset = offset;
        }

        public java.util.List<SupportTicketResponse> getTickets() {
            return tickets;
        }

        public Long getTotalCount() {
            return totalCount;
        }

        public Long getLimit() {
            return limit;
        }

        public Long getOffset() {
            return offset;
        }

        public Boolean hasMore() {
            return (offset + limit) < totalCount;
        }
    }

    public static class EscalationRequest {

        private Long escalatedTo;
        private String reason;

        public EscalationRequest() {}

        public Long getEscalatedTo() {
            return escalatedTo;
        }

        public void setEscalatedTo(Long escalatedTo) {
            this.escalatedTo = escalatedTo;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}

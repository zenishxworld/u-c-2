package com.uniflow.support.handler;

import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.support.dto.SupportTicketRequest;
import com.uniflow.support.dto.SupportTicketResponse;
import com.uniflow.support.dto.TicketMessageRequest;
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
 * StudentSupportTicketHandler - Functional Request Handler for Student Support Tickets
 *
 * <p>This handler implements support ticket endpoints for students,
 * providing reactive endpoints for ticket creation, viewing, and communication
 * functionality with JWT-based authentication and authorization.
 *
 * <p>Key Features:
 * - Student ticket creation and viewing
 * - Student ticket communication (replies)
 * - JWT-based user authentication and authorization
 * - Student-level ticket access control
 * - Standardized ApiResponse wrapper
 * - Comprehensive error handling
 * - Integration with existing SupportTicketService
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StudentSupportTicketHandler {

    private final SupportTicketService supportTicketService;
    private final JwtUtils jwtUtils;

    /**
     * Create a new support ticket for student
     * POST /student/support/tickets
     */
    public Mono<ServerResponse> createSupportTicket(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto ->
                request
                    .bodyToMono(SupportTicketRequest.class)
                    .doOnNext(ticketRequest -> {
                        // Ensure student can only create tickets for themselves
                        ticketRequest.setStudentId(userDto.getId());
                    })
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
                log.error("Error creating support ticket for student", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to create support ticket")
                    );
            });
    }

    /**
     * Get student's own support tickets
     * GET /student/support/tickets
     */
    public Mono<ServerResponse> getStudentTickets(ServerRequest request) {
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

                Long limit = request
                    .queryParam("limit")
                    .map(Long::parseLong)
                    .orElse(20L);
                Long offset = request
                    .queryParam("offset")
                    .map(Long::parseLong)
                    .orElse(0L);

                // Student can only see tickets where they are the student
                // We'll filter by studentId in the service
                return supportTicketService
                    .getStudentTickets(
                        userDto.getId(),
                        status,
                        priority,
                        ticketType,
                        limit,
                        offset
                    )
                    .collectList()
                    .zipWith(
                        supportTicketService.getStudentTicketCount(
                            userDto.getId(),
                            status,
                            priority,
                            ticketType
                        )
                    )
                    .flatMap(tuple -> {
                        var tickets = tuple.getT1();
                        var totalCount = tuple.getT2();

                        var response = new StudentTicketListResponse(
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
                log.error("Error retrieving student tickets", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to retrieve tickets"));
            });
    }

    /**
     * Get specific ticket by ID (student can only access their own tickets)
     * GET /student/support/tickets/{ticketId}
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
                        .flatMap(response -> {
                            // Additional check to ensure student can only see their own tickets
                            if (!response.getStudentId().equals(userDto.getId())) {
                                return ServerResponse.status(HttpStatus.FORBIDDEN)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.error("Access denied: You can only view your own tickets")
                                    );
                            }

                            return ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        response,
                                        "Ticket retrieved successfully"
                                    )
                                );
                        });
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
                log.error("Error retrieving student ticket", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to retrieve ticket")
                    );
            });
    }

    /**
     * Add message to ticket (student can only reply to their own tickets)
     * POST /student/support/tickets/{ticketId}/messages
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

                    // First verify the ticket belongs to the student
                    return supportTicketService
                        .getTicketById(ticketId, userDto.getId())
                        .flatMap(ticket -> {
                            if (!ticket.getStudentId().equals(userDto.getId())) {
                                return ServerResponse.status(HttpStatus.FORBIDDEN)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.error("Access denied: You can only message your own tickets")
                                    );
                            }

                            return request
                                .bodyToMono(TicketMessageRequest.class)
                                .doOnNext(messageRequest -> {
                                    messageRequest.setTicketId(ticketId);
                                    messageRequest.setSenderId(userDto.getId());
                                    messageRequest.setSenderType("STUDENT");
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
                        });
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
                log.error("Error adding message to student ticket", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to add message")
                    );
            });
    }

    /**
     * Get ticket messages (student can only view messages from their own tickets)
     * GET /student/support/tickets/{ticketId}/messages
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

                    // First verify the ticket belongs to the student
                    return supportTicketService
                        .getTicketById(ticketId, userDto.getId())
                        .flatMap(ticket -> {
                            if (!ticket.getStudentId().equals(userDto.getId())) {
                                return ServerResponse.status(HttpStatus.FORBIDDEN)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.error("Access denied: You can only view messages from your own tickets")
                                    );
                            }

                            return supportTicketService
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
                                );
                        });
                } catch (IllegalArgumentException ex) {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid ticket ID format")
                        );
                }
            })
            .onErrorResume(Exception.class, ex -> {
                log.error("Error retrieving student ticket messages", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to retrieve messages")
                    );
            });
    }

    /**
     * Get student's ticket statistics for dashboard
     * GET /student/support/statistics
     */
    public Mono<ServerResponse> getStudentTicketStatistics(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(userDto ->
                supportTicketService
                    .getStudentTicketStatistics(userDto.getId())
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
                log.error("Error retrieving student ticket statistics", ex);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to retrieve statistics")
                    );
            });
    }

    // Helper DTO for student ticket list response
    public static class StudentTicketListResponse {

        private final java.util.List<SupportTicketResponse> tickets;
        private final Long totalCount;
        private final Long limit;
        private final Long offset;

        public StudentTicketListResponse(
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
}

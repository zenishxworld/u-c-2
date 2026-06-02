package com.uniflow.notification.handler;

import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.auth.service.JwtService;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.notification.dto.BroadcastRequest;
import com.uniflow.notification.dto.NotificationRequest;
import com.uniflow.notification.dto.StudentsListResponseDTO;
import com.uniflow.notification.exception.ForbiddenException;
import com.uniflow.notification.exception.UnauthorizedException;
import com.uniflow.notification.model.NotificationType;
import com.uniflow.notification.service.NotificationService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Enhanced NotificationHandler with functional composition patterns.
 * Handles all notification-related HTTP requests with reactive patterns and security.
 */
@Component
public class NotificationHandler {

    private final NotificationService notificationService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    public NotificationHandler(
        NotificationService notificationService,
        JwtService jwtService,
        UserRepository userRepository,
        ApplicationRepository applicationRepository
    ) {
        this.notificationService = notificationService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    /**
     * Send notification to a single recipient
     * POST /api/v1/notifications/send
     */
    public Mono<ServerResponse> sendNotification(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(senderId ->
                request
                    .bodyToMono(NotificationRequest.class)
                    .flatMap(notificationRequest -> {
                        if (notificationRequest.requiresAdminAccess()) {
                            return validateAdminAccess(request).then(
                                notificationService.sendNotification(
                                    notificationRequest,
                                    senderId
                                )
                            );
                        }
                        return notificationService.sendNotification(
                            notificationRequest,
                            senderId
                        );
                    })
            )
            .flatMap(notification ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            notification,
                            "Notification sent successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                System.err.println(
                    "Error in sendNotification: " + error.getMessage()
                );
                error.printStackTrace();
                return handleError(error);
            });
    }

    /**
     * Send broadcast notification to multiple recipients
     * POST /api/v1/notifications/broadcast
     */
    public Mono<ServerResponse> sendBroadcast(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(senderId ->
                validateAdminAccess(request)
                    .then(request.bodyToMono(BroadcastRequest.class))
                    .flatMap(broadcastRequest ->
                        notificationService
                            .sendBroadcast(broadcastRequest, senderId)
                            .collectList()
                    )
            )
            .flatMap(notifications ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            notifications,
                            "Broadcast notifications sent successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                System.err.println(
                    "Error in sendBroadcast: " + error.getMessage()
                );
                error.printStackTrace();
                return handleError(error);
            });
    }

    /**
     * Get user notifications with pagination
     * GET /api/v1/notifications?page=0&size=20
     */
    public Mono<ServerResponse> getUserNotifications(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(userId -> {
                PageRequest pageRequest = extractPageable(request);
                return notificationService
                    .getUserNotifications(
                        userId,
                        pageRequest.getPageNumber(),
                        pageRequest.getPageSize()
                    )
                    .collectList();
            })
            .flatMap(notifications -> {
                Map<String, Object> response = Map.of(
                    "notifications",
                    notifications,
                    "count",
                    notifications.size(),
                    "timestamp",
                    LocalDateTime.now()
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Notifications retrieved successfully"
                        )
                    );
            })
            .onErrorResume(error -> {
                System.err.println(
                    "Error in getUserNotifications: " + error.getMessage()
                );
                error.printStackTrace();
                return handleError(error);
            });
    }

    /**
     * Get sent notifications for an admin with pagination
     * GET /api/v1/notifications/sent?page=0&size=20
     */
    public Mono<ServerResponse> getSentNotifications(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(userId -> validateAdminAccess(request).thenReturn(userId))
            .flatMap(adminId -> {
                PageRequest pageRequest = extractPageable(request);
                return notificationService
                    .getSentNotifications(
                        adminId,
                        pageRequest.getPageNumber(),
                        pageRequest.getPageSize()
                    )
                    .collectList();
            })
            .flatMap(notifications -> {
                Map<String, Object> response = Map.of(
                    "notifications",
                    notifications,
                    "count",
                    notifications.size(),
                    "timestamp",
                    LocalDateTime.now()
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Sent notifications retrieved successfully"
                        )
                    );
            })
            .onErrorResume(error -> {
                System.err.println(
                    "Error in getSentNotifications: " + error.getMessage()
                );
                error.printStackTrace();
                return handleError(error);
            });
    }

    /**
     * Get specific notification by ID
     * GET /api/v1/notifications/{id}
     */
    public Mono<ServerResponse> getNotification(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(userId -> {
                String notificationId = request.pathVariable("id");
                return notificationService.getNotification(
                    UUID.fromString(notificationId),
                    userId
                );
            })
            .flatMap(notification ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            notification,
                            "Notification retrieved successfully"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Mark notification as read
     * PUT /api/v1/notifications/{id}/read
     */
    public Mono<ServerResponse> markAsRead(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(userId -> {
                String notificationId = request.pathVariable("id");
                return notificationService.markAsRead(
                    UUID.fromString(notificationId),
                    userId
                );
            })
            .flatMap(notification ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            notification,
                            "Notification marked as read"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Get unread notification count
     * GET /api/v1/notifications/unread/count
     */
    public Mono<ServerResponse> getUnreadCount(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(notificationService::getUnreadCount)
            .flatMap(count -> {
                Map<String, Object> response = Map.of(
                    "unreadCount",
                    count,
                    "timestamp",
                    LocalDateTime.now()
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Unread count retrieved successfully"
                        )
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * Get students for notification dropdown (Admin only) — scoped to admin's assigned students.
     * GET /api/v1/notifications/students/dropdown
     */
    public Mono<ServerResponse> getStudentsForDropdown(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .flatMap(adminId ->
                validateAdminAccess(request)
                    .then(
                        applicationRepository
                            .findDistinctStudentIdsByAssignedAdminId(adminId)
                            .flatMap(studentId -> userRepository.findById(studentId))
                            .filter(user -> "STUDENT".equals(user.getUserType()))
                            .map(user ->
                                StudentsListResponseDTO.StudentSummaryDTO.builder()
                                    .id(user.getId())
                                    .name(
                                        (user.getFirstName() != null ? user.getFirstName() : "") +
                                            " " +
                                            (user.getLastName() != null ? user.getLastName() : "")
                                    )
                                    .email(user.getEmail() != null ? user.getEmail() : "")
                                    .userType(user.getUserType())
                                    .status(user.getStatus())
                                    .build()
                            )
                            .collectList()
                    )
            )
            .flatMap(students -> {
                StudentsListResponseDTO response =
                    StudentsListResponseDTO.builder()
                        .students(students)
                        .summary(
                            StudentsListResponseDTO.FilterSummaryDTO.builder()
                                .totalStudents(students.size())
                                .activeStudents(
                                    (int) students.stream()
                                        .filter(s -> "ACTIVE".equals(s.getStatus()))
                                        .count()
                                )
                                .pendingVerificationStudents(
                                    (int) students.stream()
                                        .filter(s -> "PENDING_VERIFICATION".equals(s.getStatus()))
                                        .count()
                                )
                                .filtered(false)
                                .build()
                        )
                        .timestamp(LocalDateTime.now())
                        .build();

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Students retrieved successfully"
                        )
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * Get students for notification with search and pagination (Admin only) — scoped to admin's assigned students.
     * GET /api/v1/notifications/students?search=john&page=0&size=10
     */
    public Mono<ServerResponse> getStudentsForNotification(ServerRequest request) {
        int page = request.queryParam("page").map(Integer::parseInt).orElse(0);
        int size = request.queryParam("size").map(Integer::parseInt).orElse(10);
        String search = request.queryParam("search").orElse("");

        return extractUserIdFromJWT(request)
            .flatMap(adminId ->
                validateAdminAccess(request)
                    .then(
                        applicationRepository
                            .findDistinctStudentIdsByAssignedAdminId(adminId)
                            .flatMap(studentId -> userRepository.findById(studentId))
                            .filter(user -> "STUDENT".equals(user.getUserType()))
                            .filter(user -> {
                                if (search.isEmpty()) return true;
                                String searchLower = search.toLowerCase();
                                String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") +
                                    " " + (user.getLastName() != null ? user.getLastName() : "")).toLowerCase();
                                String email = user.getEmail() != null ? user.getEmail().toLowerCase() : "";
                                return fullName.contains(searchLower) || email.contains(searchLower);
                            })
                            .collectList()
                            .map(allStudents -> {
                                int totalStudents = allStudents.size();
                                int startIndex = page * size;
                                int endIndex = Math.min(startIndex + size, totalStudents);

                                List<StudentsListResponseDTO.StudentSummaryDTO> paginatedStudents = allStudents
                                    .subList(Math.min(startIndex, totalStudents), endIndex)
                                    .stream()
                                    .map(user ->
                                        StudentsListResponseDTO.StudentSummaryDTO.builder()
                                            .id(user.getId())
                                            .name(
                                                (user.getFirstName() != null ? user.getFirstName() : "") +
                                                    " " + (user.getLastName() != null ? user.getLastName() : "")
                                            )
                                            .email(user.getEmail() != null ? user.getEmail() : "")
                                            .userType(user.getUserType())
                                            .status(user.getStatus())
                                            .build()
                                    )
                                    .toList();

                                return StudentsListResponseDTO.builder()
                                    .students(paginatedStudents)
                                    .pagination(
                                        StudentsListResponseDTO.PaginationDTO.builder()
                                            .page(page)
                                            .size(size)
                                            .total((long) totalStudents)
                                            .totalPages((totalStudents + size - 1) / size)
                                            .hasNext(endIndex < totalStudents)
                                            .hasPrevious(page > 0)
                                            .currentPageItems(paginatedStudents.size())
                                            .build()
                                    )
                                    .summary(
                                        StudentsListResponseDTO.FilterSummaryDTO.builder()
                                            .totalStudents(totalStudents)
                                            .activeStudents(
                                                (int) allStudents.stream()
                                                    .filter(s -> "ACTIVE".equals(s.getStatus()))
                                                    .count()
                                            )
                                            .pendingVerificationStudents(
                                                (int) allStudents.stream()
                                                    .filter(s -> "PENDING_VERIFICATION".equals(s.getStatus()))
                                                    .count()
                                            )
                                            .searchTerm(search.isEmpty() ? null : search)
                                            .filtered(!search.isEmpty())
                                            .build()
                                    )
                                    .timestamp(LocalDateTime.now())
                                    .build();
                            })
                    )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Students retrieved successfully"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Health check endpoint for notification system debugging
     * GET /api/v1/notifications/health
     */
    public Mono<ServerResponse> healthCheck(ServerRequest request) {
        return extractUserIdFromJWT(request)
            .map(userId -> {
                Map<String, Object> health = Map.of(
                    "status",
                    "UP",
                    "service",
                    "notification-system",
                    "userId",
                    userId,
                    "timestamp",
                    java.time.LocalDateTime.now().toString(),
                    "endpoints",
                    Map.of(
                        "send",
                        "/api/v1/notifications/send",
                        "broadcast",
                        "/api/v1/notifications/broadcast",
                        "getUserNotifications",
                        "/api/v1/notifications",
                        "getUnreadCount",
                        "/api/v1/notifications/unread/count",
                        "studentsDropdown",
                        "/api/v1/notifications/students/dropdown",
                        "studentsSearch",
                        "/api/v1/notifications/students"
                    )
                );
                return health;
            })
            .flatMap(health ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            health,
                            "Notification system is healthy"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    // Private helper methods

    private Mono<Long> extractUserIdFromJWT(ServerRequest request) {
        return extractTokenFromRequest(request)
            .flatMap(jwtService::getUserIdFromToken)
            .switchIfEmpty(
                Mono.error(
                    new UnauthorizedException("Invalid or missing JWT token")
                )
            );
    }

    private Mono<Long> extractSenderFromJWT(ServerRequest request) {
        return extractUserIdFromJWT(request);
    }

    private Mono<Void> validateAdminAccess(ServerRequest request) {
        return extractTokenFromRequest(request).flatMap(token ->
            jwtService
                .validateToken(token)
                .map(claims -> claims.get("userType", String.class))
                .filter("ADMIN"::equals)
                .switchIfEmpty(
                    Mono.error(new ForbiddenException("Admin access required"))
                )
                .then()
        );
    }

    private Mono<String> extractTokenFromRequest(ServerRequest request) {
        String authHeader = request.headers().firstHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return Mono.just(authHeader.substring(7));
        }
        return Mono.error(
            new UnauthorizedException("Missing or invalid Authorization header")
        );
    }

    private PageRequest extractPageable(ServerRequest request) {
        int page = request.queryParam("page").map(Integer::parseInt).orElse(0);
        int size = request.queryParam("size").map(Integer::parseInt).orElse(20);
        return PageRequest.of(page, size);
    }

    private Mono<ServerResponse> handleError(Throwable throwable) {
        System.err.println(
            "HandleError called with: " +
                throwable.getClass().getSimpleName() +
                " - " +
                throwable.getMessage()
        );
        throwable.printStackTrace();

        if (throwable instanceof UnauthorizedException) {
            return ServerResponse.status(401)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Unauthorized: " + throwable.getMessage())
                );
        } else if (throwable instanceof ForbiddenException) {
            return ServerResponse.status(403)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Forbidden: " + throwable.getMessage())
                );
        } else if (throwable instanceof IllegalArgumentException) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Bad Request: " + throwable.getMessage())
                );
        } else {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Server Error: " + throwable.getMessage())
                );
        }
    }
}

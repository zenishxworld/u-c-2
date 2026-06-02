package com.uniflow.support.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.admin.repository.AdminProfileRepository;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.notification.dto.NotificationRequest;
import com.uniflow.notification.model.ContentType;
import com.uniflow.notification.model.NotificationType;
import com.uniflow.notification.service.NotificationService;
import com.uniflow.student.repository.StudentProfileRepository;
import com.uniflow.support.dto.SupportTicketRequest;
import com.uniflow.support.dto.SupportTicketResponse;
import com.uniflow.support.dto.TicketMessageRequest;
import com.uniflow.support.dto.TicketStatusUpdateRequest;
import com.uniflow.support.entity.SupportTicket;
import com.uniflow.support.entity.TicketMessage;
import com.uniflow.support.repository.SupportTicketRepository;
import com.uniflow.support.repository.TicketMessageRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for managing support tickets with reactive programming patterns.
 * Integrates with existing notification and user management systems.
 */
@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final TicketMessageRepository ticketMessageRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final AdminProfileRepository adminProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public SupportTicketService(
        SupportTicketRepository supportTicketRepository,
        TicketMessageRepository ticketMessageRepository,
        UserRepository userRepository,
        ApplicationRepository applicationRepository,
        AdminProfileRepository adminProfileRepository,
        StudentProfileRepository studentProfileRepository,
        NotificationService notificationService,
        ObjectMapper objectMapper
    ) {
        this.supportTicketRepository = supportTicketRepository;
        this.ticketMessageRepository = ticketMessageRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.adminProfileRepository = adminProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    /**
     * Create a new support ticket
     */
    public Mono<SupportTicketResponse> createSupportTicket(
        SupportTicketRequest request,
        Long createdByUserId
    ) {
        return validateTicketRequest(request)
            .then(generateUniqueTicketNumber())
            .flatMap(ticketNumber -> {
                SupportTicket ticket = request.toEntity(ticketNumber);
                return supportTicketRepository.save(ticket);
            })
            .flatMap(this::enrichTicketResponse)
            .flatMap(response -> {
                // Send notification to assigned admin if ticket is pre-assigned
                if (response.getAssignedAdminId() != null) {
                    return sendTicketAssignmentNotification(response).then(
                        Mono.just(response)
                    );
                }
                return sendTicketCreationNotification(response).then(
                    Mono.just(response)
                );
            });
    }

    /**
     * Get tickets for admin with filtering and pagination
     * Scoped: admin sees tickets directly assigned to them OR from students assigned to them.
     * Unassigned students' tickets are visible to all admins.
     */
    public Flux<SupportTicketResponse> getAdminTickets(
        Long adminId,
        String status,
        String priority,
        String ticketType,
        Boolean escalated,
        Long limit,
        Long offset
    ) {
        return supportTicketRepository
            .findTicketsByAdminScope(
                adminId,
                status,
                priority,
                ticketType,
                escalated,
                limit,
                offset
            )
            .flatMap(this::enrichTicketResponse);
    }

    /**
     * Get ticket count for admin with filters (scoped)
     */
    public Mono<Long> getAdminTicketCount(
        Long adminId,
        String status,
        String priority,
        String ticketType,
        Boolean escalated
    ) {
        return supportTicketRepository.countTicketsByAdminScope(
            adminId,
            status,
            priority,
            ticketType,
            escalated
        );
    }

    /**
     * Get specific ticket by ID with enriched data
     */
    public Mono<SupportTicketResponse> getTicketById(
        UUID ticketId,
        Long requestingUserId
    ) {
        return supportTicketRepository
            .findById(ticketId)
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("Ticket not found"))
            )
            .flatMap(ticket ->
                validateTicketAccess(ticket, requestingUserId).then(
                    enrichTicketResponse(ticket)
                )
            );
    }

    /**
     * Update ticket status
     */
    public Mono<SupportTicketResponse> updateTicketStatus(
        TicketStatusUpdateRequest request,
        Long updatedByUserId
    ) {
        return validateStatusUpdateRequest(request)
            .then(supportTicketRepository.findById(request.getTicketId()))
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("Ticket not found"))
            )
            .flatMap(ticket ->
                validateStatusTransition(ticket, request).then(
                    updateTicketWithNewStatus(ticket, request, updatedByUserId)
                )
            )
            .flatMap(supportTicketRepository::save)
            .flatMap(this::enrichTicketResponse)
            .flatMap(response ->
                sendStatusUpdateNotification(response, updatedByUserId).then(
                    Mono.just(response)
                )
            );
    }

    /**
     * Add message to ticket
     */
    public Mono<TicketMessage> addTicketMessage(
        TicketMessageRequest request,
        Long senderUserId
    ) {
        return validateMessageRequest(request)
            .then(supportTicketRepository.findById(request.getTicketId()))
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("Ticket not found"))
            )
            .flatMap(ticket ->
                validateMessageAccess(
                    ticket,
                    senderUserId,
                    request.getSenderType()
                ).then(createTicketMessage(request))
            )
            .flatMap(ticketMessageRepository::save)
            .flatMap(message ->
                sendMessageNotification(message).then(Mono.just(message))
            );
    }

    /**
     * Escalate ticket to higher authority
     */
    public Mono<SupportTicketResponse> escalateTicket(
        UUID ticketId,
        Long escalatedTo,
        Long escalatedBy
    ) {
        return supportTicketRepository
            .findById(ticketId)
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("Ticket not found"))
            )
            .filter(SupportTicket::canBeEscalated)
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException("Ticket cannot be escalated")
                )
            )
            .flatMap(ticket ->
                validateEscalationTarget(escalatedTo).then(
                    Mono.just(ticket.escalateToAdmin(escalatedTo))
                )
            )
            .flatMap(supportTicketRepository::save)
            .flatMap(this::enrichTicketResponse)
            .flatMap(response ->
                sendEscalationNotification(response, escalatedBy).then(
                    Mono.just(response)
                )
            );
    }

    /**
     * Get ticket messages with pagination
     */
    public Flux<TicketMessage> getTicketMessages(
        UUID ticketId,
        Long limit,
        Long offset
    ) {
        return ticketMessageRepository.findByTicketIdWithPagination(
            ticketId,
            limit,
            offset
        );
    }

    /**
     * Get ticket statistics for admin dashboard
     */
    public Mono<TicketStatistics> getTicketStatistics(Long adminId) {
        return Mono.zip(
            supportTicketRepository.countByAssignedAdminId(adminId),
            supportTicketRepository.countByStatus("OPEN"),
            supportTicketRepository.countByStatus("IN_PROGRESS"),
            supportTicketRepository.countByPriority("HIGH"),
            supportTicketRepository.countEscalatedTickets()
        ).map(tuple ->
            new TicketStatistics(
                tuple.getT1(), // assigned
                tuple.getT2(), // open
                tuple.getT3(), // in progress
                tuple.getT4(), // high priority
                tuple.getT5() // escalated
            )
        );
    }

    /**
     * Get tickets for student with filtering and pagination
     */
    public Flux<SupportTicketResponse> getStudentTickets(
        Long studentId,
        String status,
        String priority,
        String ticketType,
        Long limit,
        Long offset
    ) {
        return supportTicketRepository
            .findTicketsWithFilters(
                null, // no admin filter for student view
                status,
                priority,
                ticketType,
                null, // no escalation filter for student view
                limit,
                offset
            )
            .filter(ticket -> ticket.getStudentId().equals(studentId))
            .flatMap(this::enrichTicketResponse);
    }

    /**
     * Get ticket count for student with filters
     */
    public Mono<Long> getStudentTicketCount(
        Long studentId,
        String status,
        String priority,
        String ticketType
    ) {
        return supportTicketRepository
            .countTicketsWithFilters(
                null, // no admin filter for student view
                status,
                priority,
                ticketType,
                null // no escalation filter for student view
            )
            .flatMap(totalCount ->
                // Since we can't filter by studentId in the count query,
                // we need to count manually by getting the actual tickets
                supportTicketRepository
                    .findTicketsWithFilters(
                        null,
                        status,
                        priority,
                        ticketType,
                        null,
                        Long.MAX_VALUE, // get all to count
                        0L
                    )
                    .filter(ticket -> ticket.getStudentId().equals(studentId))
                    .count()
            );
    }

    /**
     * Get ticket statistics for student dashboard
     */
    public Mono<StudentTicketStatistics> getStudentTicketStatistics(
        Long studentId
    ) {
        return Mono.zip(
            supportTicketRepository.countByStudentId(studentId),
            supportTicketRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .filter(ticket -> "OPEN".equals(ticket.getStatus().name()))
                .count(),
            supportTicketRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .filter(ticket ->
                    "IN_PROGRESS".equals(ticket.getStatus().name())
                )
                .count(),
            supportTicketRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .filter(ticket -> "RESOLVED".equals(ticket.getStatus().name()))
                .count(),
            supportTicketRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .filter(ticket -> "CLOSED".equals(ticket.getStatus().name()))
                .count()
        ).map(tuple ->
            new StudentTicketStatistics(
                tuple.getT1(), // total tickets
                tuple.getT2(), // open
                tuple.getT3(), // in progress
                tuple.getT4(), // resolved
                tuple.getT5() // closed
            )
        );
    }

    // Private helper methods

    private Mono<Void> validateTicketRequest(SupportTicketRequest request) {
        if (!request.isValidRequest()) {
            return Mono.error(
                new IllegalArgumentException("Invalid ticket request")
            );
        }
        return userRepository
            .existsById(request.getStudentId())
            .filter(exists -> exists)
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("Student not found"))
            )
            .then();
    }

    private Mono<String> generateUniqueTicketNumber() {
        String prefix = "TKT";
        String timestamp = LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("yyyyMMdd")
        );
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        String ticketNumber = prefix + "-" + timestamp + "-" + randomSuffix;

        return supportTicketRepository
            .existsByTicketNumber(ticketNumber)
            .flatMap(exists ->
                exists ? generateUniqueTicketNumber() : Mono.just(ticketNumber)
            );
    }

    private Mono<SupportTicketResponse> enrichTicketResponse(
        SupportTicket ticket
    ) {
        SupportTicketResponse.SupportTicketResponseBuilder builder =
            SupportTicketResponse.SupportTicketResponseBuilder.from(ticket);

        return Mono.zip(
            getStudentName(ticket.getStudentId()),
            getAdminName(ticket.getAssignedAdminId()),
            getAdminName(ticket.getEscalatedTo()),
            getAdminName(ticket.getResolvedBy()),
            ticketMessageRepository.countByTicketId(ticket.getId())
        ).map(tuple ->
            builder
                .withStudentName(tuple.getT1())
                .withAssignedAdminName(tuple.getT2())
                .withEscalatedToName(tuple.getT3())
                .withResolvedByName(tuple.getT4())
                .withMessageCount(tuple.getT5())
                .build()
        );
    }

    private Mono<String> getStudentName(Long studentId) {
        if (studentId == null) return Mono.just("");
        return studentProfileRepository
            .findByUserId(studentId)
            .map(profile -> {
                // Extract name from profile data JsonNode
                if (
                    profile.getProfileData() != null &&
                    profile.getProfileData().has("basic_info")
                ) {
                    var basicInfo = profile.getProfileData().get("basic_info");
                    String firstName = basicInfo.has("first_name")
                        ? basicInfo.get("first_name").asText()
                        : "";
                    String lastName = basicInfo.has("last_name")
                        ? basicInfo.get("last_name").asText()
                        : "";
                    return (firstName + " " + lastName).trim();
                }
                return "";
            })
            .switchIfEmpty(
                userRepository
                    .findById(studentId)
                    .map(user ->
                        user.getFirstName() != null &&
                            user.getLastName() != null
                            ? user.getFirstName() + " " + user.getLastName()
                            : user.getEmail()
                    )
                    .defaultIfEmpty("Unknown Student")
            );
    }

    private Mono<String> getAdminName(Long adminId) {
        if (adminId == null) return Mono.just("");
        return adminProfileRepository
            .findByUserId(adminId.toString())
            .map(
                profile -> profile.getFirstName() + " " + profile.getLastName()
            )
            .switchIfEmpty(
                userRepository
                    .findById(adminId)
                    .map(user ->
                        user.getFirstName() != null &&
                            user.getLastName() != null
                            ? user.getFirstName() + " " + user.getLastName()
                            : user.getEmail()
                    )
                    .defaultIfEmpty("Unknown Admin")
            );
    }

    private Mono<Void> validateTicketAccess(SupportTicket ticket, Long userId) {
        return userRepository
            .findById(userId)
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("User not found"))
            )
            .flatMap(user -> {
                boolean hasAccess =
                    ticket.belongsToStudent(userId) ||
                    ticket.isAssignedToAdmin(userId) ||
                    "ADMIN".equals(user.getUserType()) ||
                    "SUPER_ADMIN".equals(user.getUserType());

                if (!hasAccess) {
                    return Mono.error(
                        new IllegalArgumentException("Access denied")
                    );
                }
                return Mono.empty();
            });
    }

    private Mono<Void> validateStatusUpdateRequest(
        TicketStatusUpdateRequest request
    ) {
        if (!request.isValidRequest()) {
            return Mono.error(
                new IllegalArgumentException("Invalid status update request")
            );
        }
        if (
            request.requiresResolution() &&
            (request.getResolution() == null ||
                request.getResolution().trim().isEmpty())
        ) {
            return Mono.error(
                new IllegalArgumentException(
                    "Resolution is required for this status"
                )
            );
        }
        return Mono.empty();
    }

    private Mono<Void> validateStatusTransition(
        SupportTicket ticket,
        TicketStatusUpdateRequest request
    ) {
        if (!request.isValidTransition(ticket.getStatus())) {
            return Mono.error(
                new IllegalArgumentException(
                    "Invalid status transition from " +
                        ticket.getStatus() +
                        " to " +
                        request.getStatus()
                )
            );
        }
        return Mono.empty();
    }

    private Mono<SupportTicket> updateTicketWithNewStatus(
        SupportTicket ticket,
        TicketStatusUpdateRequest request,
        Long updatedBy
    ) {
        SupportTicket.TicketStatus newStatus = request.getTicketStatus();

        switch (newStatus) {
            case RESOLVED:
                return Mono.just(
                    ticket.resolve(updatedBy, request.getResolution())
                );
            case CLOSED:
                return Mono.just(ticket.close());
            case IN_PROGRESS:
                if (request.getAssignedAdminId() != null) {
                    return Mono.just(
                        ticket.assignToAdmin(request.getAssignedAdminId())
                    );
                }
                ticket.setStatus(newStatus);
                return Mono.just(ticket);
            default:
                ticket.setStatus(newStatus);
                return Mono.just(ticket);
        }
    }

    private Mono<Void> validateMessageRequest(TicketMessageRequest request) {
        if (!request.isValidRequest()) {
            return Mono.error(
                new IllegalArgumentException("Invalid message request")
            );
        }
        return Mono.empty();
    }

    private Mono<Void> validateMessageAccess(
        SupportTicket ticket,
        Long senderUserId,
        String senderType
    ) {
        if ("STUDENT".equalsIgnoreCase(senderType)) {
            return ticket.belongsToStudent(senderUserId)
                ? Mono.empty()
                : Mono.error(
                    new IllegalArgumentException(
                        "Student can only message their own tickets"
                    )
                );
        }

        if ("ADMIN".equalsIgnoreCase(senderType)) {
            return userRepository
                .findById(senderUserId)
                .filter(
                    user ->
                        "ADMIN".equals(user.getUserType()) ||
                        "SUPER_ADMIN".equals(user.getUserType())
                )
                .switchIfEmpty(
                    Mono.error(
                        new IllegalArgumentException(
                            "Only admins can send admin messages"
                        )
                    )
                )
                .then();
        }

        return Mono.error(new IllegalArgumentException("Invalid sender type"));
    }

    private Mono<TicketMessage> createTicketMessage(
        TicketMessageRequest request
    ) {
        return Mono.just(request.toEntity());
    }

    private Mono<Void> validateEscalationTarget(Long escalatedTo) {
        return userRepository
            .findById(escalatedTo)
            .filter(
                user ->
                    "ADMIN".equals(user.getUserType()) ||
                    "SUPER_ADMIN".equals(user.getUserType())
            )
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Escalation target must be an admin"
                    )
                )
            )
            .then();
    }

    // Notification methods using existing NotificationService

    private Mono<Void> sendTicketCreationNotification(
        SupportTicketResponse ticket
    ) {
        NotificationRequest notificationRequest = new NotificationRequest();
        notificationRequest.setRecipientId(ticket.getStudentId());
        notificationRequest.setType(NotificationType.GENERAL_INFO);
        notificationRequest.setContentType(ContentType.PLAIN);
        notificationRequest.setTitle("Support Ticket Created");
        notificationRequest.setMessage(
            "Your support ticket #" +
                ticket.getTicketNumber() +
                " has been created successfully."
        );
        notificationRequest.setActionUrl(
            "/student/support/tickets/" + ticket.getId()
        );

        return notificationService
            .sendNotification(notificationRequest, null)
            .then();
    }

    private Mono<Void> sendTicketAssignmentNotification(
        SupportTicketResponse ticket
    ) {
        if (ticket.getAssignedAdminId() == null) return Mono.empty();

        NotificationRequest notificationRequest = new NotificationRequest();
        notificationRequest.setRecipientId(ticket.getAssignedAdminId());
        notificationRequest.setType(NotificationType.WORKFLOW_UPDATE);
        notificationRequest.setContentType(ContentType.PLAIN);
        notificationRequest.setTitle("New Support Ticket Assigned");
        notificationRequest.setMessage(
            "Support ticket #" +
                ticket.getTicketNumber() +
                " has been assigned to you."
        );
        notificationRequest.setActionUrl(
            "/admin/support/tickets/" + ticket.getId()
        );

        return notificationService
            .sendNotification(notificationRequest, null)
            .then();
    }

    private Mono<Void> sendStatusUpdateNotification(
        SupportTicketResponse ticket,
        Long updatedBy
    ) {
        NotificationRequest notificationRequest = new NotificationRequest();
        notificationRequest.setRecipientId(ticket.getStudentId());
        notificationRequest.setType(NotificationType.WORKFLOW_UPDATE);
        notificationRequest.setContentType(ContentType.PLAIN);
        notificationRequest.setTitle("Support Ticket Updated");
        notificationRequest.setMessage(
            "Your support ticket #" +
                ticket.getTicketNumber() +
                " status has been updated to " +
                ticket.getStatus()
        );
        notificationRequest.setActionUrl(
            "/student/support/tickets/" + ticket.getId()
        );

        return notificationService
            .sendNotification(notificationRequest, updatedBy)
            .then();
    }

    private Mono<Void> sendMessageNotification(TicketMessage message) {
        return supportTicketRepository
            .findById(message.getTicketId())
            .flatMap(ticket -> {
                Long recipientId = message.getSenderType() ==
                    TicketMessage.SenderType.STUDENT
                    ? ticket.getAssignedAdminId()
                    : ticket.getStudentId();

                if (recipientId == null) return Mono.empty();

                NotificationRequest notificationRequest =
                    new NotificationRequest();
                notificationRequest.setRecipientId(recipientId);
                notificationRequest.setType(NotificationType.GENERAL_INFO);
                notificationRequest.setContentType(ContentType.PLAIN);
                notificationRequest.setTitle("New Support Message");
                notificationRequest.setMessage(
                    "New message on support ticket #" + ticket.getTicketNumber()
                );
                notificationRequest.setActionUrl(
                    "/support/tickets/" + ticket.getId()
                );

                return notificationService
                    .sendNotification(
                        notificationRequest,
                        message.getSenderId()
                    )
                    .then();
            });
    }

    private Mono<Void> sendEscalationNotification(
        SupportTicketResponse ticket,
        Long escalatedBy
    ) {
        NotificationRequest notificationRequest = new NotificationRequest();
        notificationRequest.setRecipientId(ticket.getEscalatedTo());
        notificationRequest.setType(NotificationType.SYSTEM_ALERT);
        notificationRequest.setContentType(ContentType.PLAIN);
        notificationRequest.setTitle("Support Ticket Escalated");
        notificationRequest.setMessage(
            "Support ticket #" +
                ticket.getTicketNumber() +
                " has been escalated to you."
        );
        notificationRequest.setActionUrl(
            "/admin/support/tickets/" + ticket.getId()
        );

        return notificationService
            .sendNotification(notificationRequest, escalatedBy)
            .then();
    }

    // Statistics DTO
    public static class TicketStatistics {

        private final Long assignedToMe;
        private final Long openTickets;
        private final Long inProgressTickets;
        private final Long highPriorityTickets;
        private final Long escalatedTickets;

        public TicketStatistics(
            Long assignedToMe,
            Long openTickets,
            Long inProgressTickets,
            Long highPriorityTickets,
            Long escalatedTickets
        ) {
            this.assignedToMe = assignedToMe;
            this.openTickets = openTickets;
            this.inProgressTickets = inProgressTickets;
            this.highPriorityTickets = highPriorityTickets;
            this.escalatedTickets = escalatedTickets;
        }

        public Long getAssignedToMe() {
            return assignedToMe;
        }

        public Long getOpenTickets() {
            return openTickets;
        }

        public Long getInProgressTickets() {
            return inProgressTickets;
        }

        public Long getHighPriorityTickets() {
            return highPriorityTickets;
        }

        public Long getEscalatedTickets() {
            return escalatedTickets;
        }
    }

    // Student Statistics DTO
    public static class StudentTicketStatistics {

        private final Long totalTickets;
        private final Long openTickets;
        private final Long inProgressTickets;
        private final Long resolvedTickets;
        private final Long closedTickets;

        public StudentTicketStatistics(
            Long totalTickets,
            Long openTickets,
            Long inProgressTickets,
            Long resolvedTickets,
            Long closedTickets
        ) {
            this.totalTickets = totalTickets;
            this.openTickets = openTickets;
            this.inProgressTickets = inProgressTickets;
            this.resolvedTickets = resolvedTickets;
            this.closedTickets = closedTickets;
        }

        public Long getTotalTickets() {
            return totalTickets;
        }

        public Long getOpenTickets() {
            return openTickets;
        }

        public Long getInProgressTickets() {
            return inProgressTickets;
        }

        public Long getResolvedTickets() {
            return resolvedTickets;
        }

        public Long getClosedTickets() {
            return closedTickets;
        }
    }
}

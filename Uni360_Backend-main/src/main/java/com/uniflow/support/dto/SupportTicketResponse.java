package com.uniflow.support.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uniflow.support.entity.SupportTicket;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for support ticket responses.
 * Contains all ticket information for API responses.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SupportTicketResponse {

    private UUID id;
    private String ticketNumber;
    private Long studentId;
    private String studentName;
    private UUID applicationId;
    private Long assignedAdminId;
    private String assignedAdminName;
    private String ticketType;
    private String priority;
    private String status;
    private String subject;
    private String description;
    private String resolution;
    private Boolean escalated;
    private Long escalatedTo;
    private String escalatedToName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime escalatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime resolvedAt;

    private Long resolvedBy;
    private String resolvedByName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    private Long messageCount;
    private Boolean hasUnreadMessages;

    // Default constructor
    public SupportTicketResponse() {}

    // Constructor from entity
    public SupportTicketResponse(SupportTicket ticket) {
        this.id = ticket.getId();
        this.ticketNumber = ticket.getTicketNumber();
        this.studentId = ticket.getStudentId();
        this.applicationId = ticket.getApplicationId();
        this.assignedAdminId = ticket.getAssignedAdminId();
        this.ticketType = ticket.getTicketType();
        this.priority = ticket.getPriority() != null ? ticket.getPriority().name() : null;
        this.status = ticket.getStatus() != null ? ticket.getStatus().name() : null;
        this.subject = ticket.getSubject();
        this.description = ticket.getDescription();
        this.resolution = ticket.getResolution();
        this.escalated = ticket.getEscalated();
        this.escalatedTo = ticket.getEscalatedTo();
        this.escalatedAt = ticket.getEscalatedAt();
        this.resolvedAt = ticket.getResolvedAt();
        this.resolvedBy = ticket.getResolvedBy();
        this.createdAt = ticket.getCreatedAt();
        this.updatedAt = ticket.getUpdatedAt();
        this.messageCount = 0L;
        this.hasUnreadMessages = false;
    }

    // Static factory method
    public static SupportTicketResponse from(SupportTicket ticket) {
        return new SupportTicketResponse(ticket);
    }

    // Builder pattern for enhanced construction
    public static class SupportTicketResponseBuilder {
        private final SupportTicketResponse response;

        public SupportTicketResponseBuilder(SupportTicket ticket) {
            this.response = new SupportTicketResponse(ticket);
        }

        public static SupportTicketResponseBuilder from(SupportTicket ticket) {
            return new SupportTicketResponseBuilder(ticket);
        }

        public SupportTicketResponseBuilder withStudentName(String studentName) {
            this.response.studentName = studentName;
            return this;
        }

        public SupportTicketResponseBuilder withAssignedAdminName(String adminName) {
            this.response.assignedAdminName = adminName;
            return this;
        }

        public SupportTicketResponseBuilder withEscalatedToName(String escalatedToName) {
            this.response.escalatedToName = escalatedToName;
            return this;
        }

        public SupportTicketResponseBuilder withResolvedByName(String resolvedByName) {
            this.response.resolvedByName = resolvedByName;
            return this;
        }

        public SupportTicketResponseBuilder withMessageCount(Long messageCount) {
            this.response.messageCount = messageCount;
            return this;
        }

        public SupportTicketResponseBuilder withUnreadMessages(Boolean hasUnreadMessages) {
            this.response.hasUnreadMessages = hasUnreadMessages;
            return this;
        }

        public SupportTicketResponse build() {
            return this.response;
        }
    }

    // Business logic methods
    public boolean isOpen() {
        return "OPEN".equals(this.status);
    }

    public boolean isResolved() {
        return "RESOLVED".equals(this.status) || "CLOSED".equals(this.status);
    }

    public boolean isHighPriority() {
        return "HIGH".equals(this.priority) || "URGENT".equals(this.priority);
    }

    public boolean isAssigned() {
        return this.assignedAdminId != null;
    }

    public boolean isEscalated() {
        return Boolean.TRUE.equals(this.escalated);
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public Long getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(Long assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    public String getAssignedAdminName() {
        return assignedAdminName;
    }

    public void setAssignedAdminName(String assignedAdminName) {
        this.assignedAdminName = assignedAdminName;
    }

    public String getTicketType() {
        return ticketType;
    }

    public void setTicketType(String ticketType) {
        this.ticketType = ticketType;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public Boolean getEscalated() {
        return escalated;
    }

    public void setEscalated(Boolean escalated) {
        this.escalated = escalated;
    }

    public Long getEscalatedTo() {
        return escalatedTo;
    }

    public void setEscalatedTo(Long escalatedTo) {
        this.escalatedTo = escalatedTo;
    }

    public String getEscalatedToName() {
        return escalatedToName;
    }

    public void setEscalatedToName(String escalatedToName) {
        this.escalatedToName = escalatedToName;
    }

    public LocalDateTime getEscalatedAt() {
        return escalatedAt;
    }

    public void setEscalatedAt(LocalDateTime escalatedAt) {
        this.escalatedAt = escalatedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Long getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(Long resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public String getResolvedByName() {
        return resolvedByName;
    }

    public void setResolvedByName(String resolvedByName) {
        this.resolvedByName = resolvedByName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(Long messageCount) {
        this.messageCount = messageCount;
    }

    public Boolean getHasUnreadMessages() {
        return hasUnreadMessages;
    }

    public void setHasUnreadMessages(Boolean hasUnreadMessages) {
        this.hasUnreadMessages = hasUnreadMessages;
    }

    @Override
    public String toString() {
        return "SupportTicketResponse{" +
                "id=" + id +
                ", ticketNumber='" + ticketNumber + '\'' +
                ", studentId=" + studentId +
                ", status='" + status + '\'' +
                ", priority='" + priority + '\'' +
                ", subject='" + subject + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

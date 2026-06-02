package com.uniflow.support.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uniflow.support.entity.SupportTicket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for creating support tickets.
 * Contains validation constraints and conversion methods.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SupportTicketRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    private UUID applicationId;

    @NotBlank(message = "Ticket type is required")
    @Size(max = 50, message = "Ticket type must not exceed 50 characters")
    private String ticketType;

    private String priority = "MEDIUM";

    @NotBlank(message = "Subject is required")
    @Size(max = 255, message = "Subject must not exceed 255 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;

    private Long assignedAdminId;

    // Default constructor
    public SupportTicketRequest() {}

    // Constructor with required fields
    public SupportTicketRequest(
        Long studentId,
        String ticketType,
        String subject,
        String description
    ) {
        this.studentId = studentId;
        this.ticketType = ticketType;
        this.subject = subject;
        this.description = description;
    }

    // Validation methods
    public boolean isValidRequest() {
        return (
            studentId != null &&
            ticketType != null &&
            !ticketType.trim().isEmpty() &&
            subject != null &&
            !subject.trim().isEmpty() &&
            description != null &&
            !description.trim().isEmpty()
        );
    }

    // Conversion to entity
    public SupportTicket toEntity(String ticketNumber) {
        SupportTicket.SupportTicketBuilder builder =
            SupportTicket.SupportTicketBuilder.forStudent(this.studentId)
                .withTicketNumber(ticketNumber)
                .withType(this.ticketType)
                .withSubject(this.subject)
                .withDescription(this.description);

        if (this.applicationId != null) {
            builder.withApplication(this.applicationId);
        }

        if (this.priority != null) {
            try {
                builder.withPriority(
                    SupportTicket.TicketPriority.valueOf(
                        this.priority.toUpperCase()
                    )
                );
            } catch (IllegalArgumentException e) {
                builder.withPriority(SupportTicket.TicketPriority.MEDIUM);
            }
        }

        if (this.assignedAdminId != null) {
            builder.assignedTo(this.assignedAdminId);
        }

        return builder.build();
    }

    // Getters and Setters
    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
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

    public Long getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(Long assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    @Override
    public String toString() {
        return (
            "SupportTicketRequest{" +
            "studentId=" +
            studentId +
            ", applicationId=" +
            applicationId +
            ", ticketType='" +
            ticketType +
            '\'' +
            ", priority='" +
            priority +
            '\'' +
            ", subject='" +
            subject +
            '\'' +
            ", assignedAdminId=" +
            assignedAdminId +
            '}'
        );
    }
}

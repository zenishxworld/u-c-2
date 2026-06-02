package com.uniflow.support.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.uniflow.support.entity.SupportTicket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for updating support ticket status.
 * Contains validation constraints and business logic for status transitions.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TicketStatusUpdateRequest {

    @NotNull(message = "Ticket ID is required")
    private UUID ticketId;

    @NotBlank(message = "Status is required")
    private String status;

    @NotNull(message = "Updated by admin ID is required")
    private Long updatedBy;

    private Long assignedAdminId;

    @Size(max = 2000, message = "Resolution must not exceed 2000 characters")
    private String resolution;

    private String reason;

    private Long escalatedTo;

    // Default constructor
    public TicketStatusUpdateRequest() {}

    // Constructor with required fields
    public TicketStatusUpdateRequest(
        UUID ticketId,
        String status,
        Long updatedBy
    ) {
        this.ticketId = ticketId;
        this.status = status;
        this.updatedBy = updatedBy;
    }

    // Validation methods
    public boolean isValidRequest() {
        return (
            ticketId != null &&
            status != null &&
            !status.trim().isEmpty() &&
            updatedBy != null &&
            isValidStatus()
        );
    }

    public boolean isValidStatus() {
        try {
            SupportTicket.TicketStatus.valueOf(status.toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isResolutionRequired() {
        return (
            "RESOLVED".equalsIgnoreCase(status) ||
            "CLOSED".equalsIgnoreCase(status)
        );
    }

    public boolean isEscalationRequest() {
        return escalatedTo != null;
    }

    public boolean isAssignmentUpdate() {
        return assignedAdminId != null;
    }

    // Business logic methods
    public SupportTicket.TicketStatus getTicketStatus() {
        try {
            return SupportTicket.TicketStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid ticket status: " + status
            );
        }
    }

    public boolean requiresResolution() {
        SupportTicket.TicketStatus ticketStatus = getTicketStatus();
        return (
            ticketStatus == SupportTicket.TicketStatus.RESOLVED ||
            ticketStatus == SupportTicket.TicketStatus.CLOSED
        );
    }

    public boolean isValidTransition(SupportTicket.TicketStatus currentStatus) {
        SupportTicket.TicketStatus newStatus = getTicketStatus();

        // Define valid status transitions
        switch (currentStatus) {
            case OPEN:
                return (
                    newStatus == SupportTicket.TicketStatus.IN_PROGRESS ||
                    newStatus == SupportTicket.TicketStatus.CLOSED ||
                    newStatus == SupportTicket.TicketStatus.RESOLVED
                );
            case IN_PROGRESS:
                return (
                    newStatus == SupportTicket.TicketStatus.RESOLVED ||
                    newStatus == SupportTicket.TicketStatus.CLOSED ||
                    newStatus == SupportTicket.TicketStatus.PENDING_STUDENT ||
                    newStatus == SupportTicket.TicketStatus.OPEN
                );
            case PENDING_STUDENT:
                return (
                    newStatus == SupportTicket.TicketStatus.IN_PROGRESS ||
                    newStatus == SupportTicket.TicketStatus.CLOSED
                );
            case RESOLVED:
                return (
                    newStatus == SupportTicket.TicketStatus.CLOSED ||
                    newStatus == SupportTicket.TicketStatus.IN_PROGRESS
                ); // Reopen
            case CLOSED:
                return newStatus == SupportTicket.TicketStatus.IN_PROGRESS; // Reopen
            default:
                return false;
        }
    }

    // Getters and Setters
    public UUID getTicketId() {
        return ticketId;
    }

    public void setTicketId(UUID ticketId) {
        this.ticketId = ticketId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Long getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(Long assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Long getEscalatedTo() {
        return escalatedTo;
    }

    public void setEscalatedTo(Long escalatedTo) {
        this.escalatedTo = escalatedTo;
    }

    @Override
    public String toString() {
        return (
            "TicketStatusUpdateRequest{" +
            "ticketId=" +
            ticketId +
            ", status='" +
            status +
            '\'' +
            ", updatedBy=" +
            updatedBy +
            ", assignedAdminId=" +
            assignedAdminId +
            ", escalatedTo=" +
            escalatedTo +
            '}'
        );
    }
}

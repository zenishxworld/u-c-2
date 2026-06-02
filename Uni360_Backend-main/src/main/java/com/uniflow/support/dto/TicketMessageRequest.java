package com.uniflow.support.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.uniflow.support.entity.TicketMessage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for creating ticket messages.
 * Contains validation constraints and conversion methods.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TicketMessageRequest {

    @NotNull(message = "Ticket ID is required")
    private UUID ticketId;

    @NotNull(message = "Sender ID is required")
    private Long senderId;

    @NotBlank(message = "Sender type is required")
    private String senderType;

    @NotBlank(message = "Message is required")
    @Size(max = 5000, message = "Message must not exceed 5000 characters")
    private String message;

    private JsonNode attachments;

    // Default constructor
    public TicketMessageRequest() {}

    // Constructor with required fields
    public TicketMessageRequest(
        UUID ticketId,
        Long senderId,
        String senderType,
        String message
    ) {
        this.ticketId = ticketId;
        this.senderId = senderId;
        this.senderType = senderType;
        this.message = message;
    }

    // Validation methods
    public boolean isValidRequest() {
        return (
            ticketId != null &&
            senderId != null &&
            senderType != null &&
            !senderType.trim().isEmpty() &&
            message != null &&
            !message.trim().isEmpty() &&
            isValidSenderType()
        );
    }

    public boolean isValidSenderType() {
        return (
            "STUDENT".equalsIgnoreCase(senderType) ||
            "ADMIN".equalsIgnoreCase(senderType)
        );
    }

    // Conversion to entity
    public TicketMessage toEntity() {
        TicketMessage.SenderType type;
        try {
            type = TicketMessage.SenderType.valueOf(
                this.senderType.toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid sender type: " + this.senderType
            );
        }

        TicketMessage.TicketMessageBuilder builder =
            TicketMessage.TicketMessageBuilder.forTicket(this.ticketId)
                .fromSender(this.senderId, type)
                .withMessage(this.message);

        if (this.attachments != null) {
            builder.withAttachments(this.attachments);
        }

        return builder.build();
    }

    // Getters and Setters
    public UUID getTicketId() {
        return ticketId;
    }

    public void setTicketId(UUID ticketId) {
        this.ticketId = ticketId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderType() {
        return senderType;
    }

    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public JsonNode getAttachments() {
        return attachments;
    }

    public void setAttachments(JsonNode attachments) {
        this.attachments = attachments;
    }

    @Override
    public String toString() {
        return (
            "TicketMessageRequest{" +
            "ticketId=" +
            ticketId +
            ", senderId=" +
            senderId +
            ", senderType='" +
            senderType +
            '\'' +
            ", message='" +
            message +
            '\'' +
            '}'
        );
    }
}

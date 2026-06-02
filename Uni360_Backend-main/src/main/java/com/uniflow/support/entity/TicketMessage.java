package com.uniflow.support.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.function.Predicate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Ticket Message entity for support ticket communication.
 * Handles bidirectional communication between students and admins.
 */
@Table("ticket_messages")
public class TicketMessage {

    @Id
    private UUID id;

    @Column("ticket_id")
    private UUID ticketId;

    @Column("sender_id")
    private Long senderId;

    @Column("sender_type")
    private SenderType senderType;

    @Column("message")
    private String message;

    @Column("attachments")
    private JsonNode attachments;

    @Column("created_at")
    private LocalDateTime createdAt;

    // Functional predicates for business logic
    @JsonIgnore
    public static final Predicate<TicketMessage> IS_FROM_STUDENT = message ->
        message != null && message.getSenderType() == SenderType.STUDENT;

    @JsonIgnore
    public static final Predicate<TicketMessage> IS_FROM_ADMIN = message ->
        message != null && message.getSenderType() == SenderType.ADMIN;

    @JsonIgnore
    public static final Predicate<TicketMessage> HAS_ATTACHMENTS = message ->
        message != null && message.getAttachments() != null &&
        message.getAttachments().size() > 0;

    // Default constructor
    public TicketMessage() {
        this.createdAt = LocalDateTime.now();
    }

    // Domain validation
    public boolean belongsToTicket(UUID ticketId) {
        return ticketId != null && ticketId.equals(this.ticketId);
    }

    public boolean isSentBy(Long senderId, SenderType senderType) {
        return senderId != null && senderType != null &&
               senderId.equals(this.senderId) && senderType == this.senderType;
    }

    // Builder pattern for fluent construction
    public static class TicketMessageBuilder {

        private final TicketMessage message = new TicketMessage();

        public static TicketMessageBuilder forTicket(UUID ticketId) {
            TicketMessageBuilder builder = new TicketMessageBuilder();
            builder.message.ticketId = ticketId;
            return builder;
        }

        public TicketMessageBuilder fromSender(Long senderId, SenderType senderType) {
            this.message.senderId = senderId;
            this.message.senderType = senderType;
            return this;
        }

        public TicketMessageBuilder withMessage(String messageText) {
            this.message.message = messageText;
            return this;
        }

        public TicketMessageBuilder withAttachments(JsonNode attachments) {
            this.message.attachments = attachments;
            return this;
        }

        public TicketMessage build() {
            return this.message;
        }
    }

    // Enum for sender types
    public enum SenderType {
        STUDENT, ADMIN
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public SenderType getSenderType() {
        return senderType;
    }

    public void setSenderType(SenderType senderType) {
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "TicketMessage{" +
                "id=" + id +
                ", ticketId=" + ticketId +
                ", senderId=" + senderId +
                ", senderType=" + senderType +
                ", message='" + message + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

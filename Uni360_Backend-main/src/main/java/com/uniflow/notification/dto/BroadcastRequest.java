package com.uniflow.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.uniflow.notification.model.ContentType;
import com.uniflow.notification.model.NotificationType;
import java.util.List;
import java.util.function.Predicate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for broadcasting notifications to multiple users.
 * Supports admin-only broadcast functionality with functional validation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BroadcastRequest {

    private List<Long> recipientIds;
    private NotificationType type;
    private String title;
    private String message;

    @Builder.Default
    private ContentType contentType = ContentType.PLAIN;

    private String actionUrl;
    private JsonNode metadata;

    // Functional validation predicates
    public static final Predicate<BroadcastRequest> IS_VALID = request ->
        request != null &&
        request.getTitle() != null &&
        !request.getTitle().trim().isEmpty() &&
        request.getMessage() != null &&
        !request.getMessage().trim().isEmpty() &&
        request.getType() != null &&
        request.getRecipientIds() != null &&
        !request.getRecipientIds().isEmpty();

    public static final Predicate<BroadcastRequest> REQUIRES_ADMIN = request ->
        request != null &&
        NotificationType.requiresAdminAccess(request.getType());

    public boolean isValidRequest() {
        return IS_VALID.test(this);
    }

    public boolean requiresAdminAccess() {
        return REQUIRES_ADMIN.test(this);
    }

    public int getRecipientCount() {
        return recipientIds != null ? recipientIds.size() : 0;
    }
}

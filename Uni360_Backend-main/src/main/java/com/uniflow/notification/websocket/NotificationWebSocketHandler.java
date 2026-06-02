package com.uniflow.notification.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.auth.service.JwtService;
import com.uniflow.notification.model.Notification;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Enhanced WebSocket handler for real-time notification delivery.
 * Manages user sessions with JWT authentication and provides real-time messaging.
 */
@Slf4j
@Component
public class NotificationWebSocketHandler implements WebSocketHandler {

    private final Map<Long, WebSocketSession> userSessions =
        new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final JwtService jwtService;

    public NotificationWebSocketHandler(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        return extractUserIdFromSession(session)
            .flatMap(userId -> {
                userSessions.put(userId, session);
                log.info("User {} connected to WebSocket notifications", userId);

                return session
                    .send(
                        session
                            .receive()
                            .map(msg -> {
                                // Echo received messages for testing
                                return session.textMessage(
                                    "{\"type\":\"echo\",\"message\":\"" +
                                        msg.getPayloadAsText() +
                                        "\"}"
                                );
                            })
                    )
                    .doFinally(signalType -> {
                        userSessions.remove(userId);
                        log.info("User {} disconnected from WebSocket notifications", userId);
                    });
            })
            .onErrorResume(error -> {
                log.error("WebSocket authentication failed: {}", error.getMessage());
                return session.close();
            });
    }

    /**
     * Send notification to a specific user via WebSocket
     */
    public Mono<Void> sendNotificationToUser(
        Long userId,
        Notification notification
    ) {
        WebSocketSession session = userSessions.get(userId);
        if (session == null || !session.isOpen()) {
            return Mono.empty(); // User not connected
        }

        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "notification");
            message.put("id", notification.getId().toString());
            message.put("title", notification.getTitle());
            message.put("message", notification.getMessage());
            message.put("notificationType", notification.getType().name());
            message.put("contentType", notification.getContentType().name());
            message.put("actionUrl", notification.getActionUrl());
            message.put("createdAt", notification.getCreatedAt().toString());
            message.put("metadata", notification.getMetadata());

            String json = objectMapper.writeValueAsString(message);
            return session.send(Mono.just(session.textMessage(json)));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification: {}", e.getMessage());
            return Mono.empty();
        }
    }

    /**
     * Broadcast message to all connected users
     */
    public Mono<Void> broadcastToAll(String message) {
        return Mono.fromRunnable(() -> {
            userSessions
                .values()
                .forEach(session -> {
                    if (session.isOpen()) {
                        session
                            .send(Mono.just(session.textMessage(message)))
                            .subscribe();
                    }
                });
        });
    }

    /**
     * Get count of connected users
     */
    public int getConnectedUserCount() {
        return userSessions.size();
    }

    /**
     * Check if a user is connected
     */
    public boolean isUserConnected(Long userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }

    private Mono<Long> extractUserIdFromSession(WebSocketSession session) {
        URI uri = session.getHandshakeInfo().getUri();
        String query = uri.getQuery();

        if (query == null) {
            return Mono.error(
                new IllegalArgumentException("Missing token parameter")
            );
        }

        return extractTokenFromQuery(query).flatMap(token -> {
            return jwtService
                .validateToken(token)
                .flatMap(claims -> jwtService.getUserIdFromToken(token))
                .onErrorMap(e ->
                    new IllegalArgumentException(
                        "Token validation failed: " + e.getMessage()
                    )
                );
        });
    }

    private Mono<String> extractTokenFromQuery(String query) {
        String[] params = query.split("&");
        for (String param : params) {
            String[] keyValue = param.split("=");
            if (keyValue.length == 2 && "token".equals(keyValue[0])) {
                return Mono.just(keyValue[1]);
            }
        }
        return Mono.error(
            new IllegalArgumentException("Token parameter not found")
        );
    }
}

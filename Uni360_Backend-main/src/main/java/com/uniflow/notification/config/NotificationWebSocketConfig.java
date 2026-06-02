package com.uniflow.notification.config;

import com.uniflow.notification.websocket.NotificationWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;
import lombok.extern.slf4j.Slf4j;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * Reactive WebSocket configuration for real-time notification delivery.
 * Supports configurable endpoints and CORS settings.
 */
@Slf4j
@Configuration
public class NotificationWebSocketConfig {

    private final NotificationWebSocketHandler webSocketHandler;

    @Value("${uniflow.notifications.websocket.path:/ws/notifications}")
    private String websocketPath;

    @Value("${uniflow.notifications.websocket.allowed-origins:*}")
    private String allowedOrigins;

    public NotificationWebSocketConfig(NotificationWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Bean
    public HandlerMapping webSocketHandlerMapping() {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put(websocketPath, webSocketHandler);

        SimpleUrlHandlerMapping handlerMapping = new SimpleUrlHandlerMapping();
        handlerMapping.setUrlMap(map);
        handlerMapping.setOrder(-1); // Before annotated controllers
        return handlerMapping;
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }

    @PostConstruct
    public void validateConfiguration() {
        if (websocketPath == null || websocketPath.trim().isEmpty()) {
            throw new IllegalStateException("WebSocket path cannot be null or empty");
        }
        log.info("WebSocket notifications configured at: {}", websocketPath);
        log.info("Allowed origins: {}", allowedOrigins);
    }
}

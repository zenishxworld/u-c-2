package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AIHealthStatus {

    @JsonProperty("status")
    private String status;

    @JsonProperty("service")
    @Builder.Default
    private String service = "ai-n8n-integration";

    @JsonProperty("n8n")
    private N8nHealth n8n;

    @JsonProperty("timestamp")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class N8nHealth {

        @JsonProperty("status")
        private String status;

        @JsonProperty("url")
        private String url;

        @JsonProperty("responseTimeMs")
        private Long responseTimeMs;

        @JsonProperty("error")
        private String error;
    }

    public static AIHealthStatus up(String n8nUrl, long responseTimeMs) {
        return AIHealthStatus.builder()
                .status("UP")
                .n8n(N8nHealth.builder()
                        .status("UP")
                        .url(n8nUrl)
                        .responseTimeMs(responseTimeMs)
                        .build())
                .build();
    }

    public static AIHealthStatus down(String n8nUrl, String error) {
        return AIHealthStatus.builder()
                .status("DOWN")
                .n8n(N8nHealth.builder()
                        .status("DOWN")
                        .url(n8nUrl)
                        .error(error)
                        .build())
                .build();
    }
}

package com.uniflow.ai.config;

import java.time.Duration;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "uniflow.ai.n8n")
public class N8nProperties {

    private String baseUrl = "http://localhost:5678";
    private String sopEndpoint = "/webhook/sop-generator";
    private String lorEndpoint = "/webhook/lor-generator";
    private String coverLetterEndpoint = "/webhook/coverletter";
    private Duration timeout = Duration.ofSeconds(120);

    /**
     * Secret key for n8n webhook authentication.
     * This is sent as X-Webhook-Secret header to all webhook calls.
     */
    private String webhookSecret = "uniflow-n8n-secret-2025";

    /**
     * Public/external n8n webhook URL (for callbacks or external triggers).
     * Maps from N8N_WEBHOOK_URL env var.
     */
    private String webhookUrl;
}

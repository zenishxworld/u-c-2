package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from n8n SOP webhook.
 * n8n may return either:
 *   - Structured: {"success": true, "generatedSop": "...", "model": "...", "timestamp": "..."}
 *   - Raw AI output: {"output": "..."}
 * Both are handled via @JsonAlias and @JsonIgnoreProperties.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SopResponse {

    private boolean success;

    @JsonAlias({"output", "generated_sop", "sop"})
    private String generatedSop;

    private String model;
    private String timestamp;
}

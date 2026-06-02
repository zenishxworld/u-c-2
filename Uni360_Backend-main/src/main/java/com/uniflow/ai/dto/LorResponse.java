package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from n8n LOR webhook.
 * n8n may return either:
 *   - Structured: {"success": true, "generatedLor": "...", "model": "...", "timestamp": "..."}
 *   - Raw AI output: {"output": "..."}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LorResponse {

    private boolean success;

    @JsonAlias({"output", "generated_lor", "lor"})
    private String generatedLor;

    private String model;
    private String timestamp;
}

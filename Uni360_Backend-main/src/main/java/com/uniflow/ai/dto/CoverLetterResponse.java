package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from n8n Cover Letter webhook.
 * n8n may return either:
 *   - Structured: {"success": true, "generatedCoverLetter": "...", "model": "...", "timestamp": "..."}
 *   - Raw AI output: {"output": "..."}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoverLetterResponse {

    private boolean success;

    @JsonAlias({"output", "generated_cover_letter", "coverLetter", "cover_letter"})
    private String generatedCoverLetter;

    private String model;
    private String timestamp;
}

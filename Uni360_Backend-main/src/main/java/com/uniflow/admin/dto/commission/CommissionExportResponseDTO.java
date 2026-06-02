package com.uniflow.admin.dto.commission;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * CommissionExportResponseDTO - Commission Export Response DTO for Admin Portal
 *
 * <p>This DTO provides response information for commission export operations,
 * including download URLs, job tracking, and export metadata.
 *
 * <p>Used by endpoints:
 * - GET /api/v1/admin/commissions/export
 * - Commission report generation and download
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionExportResponseDTO {

    @JsonProperty("downloadUrl")
    private String downloadUrl;

    @JsonProperty("fileName")
    private String fileName;

    @JsonProperty("fileSize")
    private Long fileSize;

    @JsonProperty("exportFormat")
    private String exportFormat; // CSV, EXCEL, PDF

    @JsonProperty("jobId")
    private String jobId;

    @JsonProperty("status")
    private String status; // PROCESSING, COMPLETED, FAILED

    @JsonProperty("recordCount")
    private Long recordCount;

    @JsonProperty("exportedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime exportedAt;

    @JsonProperty("expiresAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime expiresAt;

    @JsonProperty("exportedBy")
    private String exportedBy;

    @JsonProperty("filters")
    private String filters; // JSON string of applied filters

    @JsonProperty("message")
    private String message;

    @JsonProperty("estimatedCompletionTime")
    private Integer estimatedCompletionTime; // seconds

    @JsonProperty("progress")
    private Integer progress; // percentage 0-100
}

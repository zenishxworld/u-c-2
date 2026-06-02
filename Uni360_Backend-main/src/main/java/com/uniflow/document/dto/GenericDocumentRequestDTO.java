package com.uniflow.document.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GenericDocumentRequestDTO - Request DTOs for Generic Document Operations
 *
 * <p>This DTO handles incoming requests for universal document upload operations.
 * It supports all user types (students, admins, etc.) with JWT-based authentication.
 *
 * <p>Key Features:
 * - Universal upload request handling
 * - Upload purpose categorization
 * - File metadata capture
 * - Validation rules for document uploads
 * - Multi-user type support
 *
 * @author UniFLow Development Team
 */
public class GenericDocumentRequestDTO {

    /**
     * DTO for generic document upload request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Request to upload a document (any user type)")
    public static class UploadDocumentRequest {

        @Schema(
            description = "Purpose of the document upload",
            example = "APPLICATION",
            allowableValues = {"APPLICATION", "PROFILE", "GENERAL", "RECEIPT", "VERIFICATION"}
        )
        @JsonProperty("upload_purpose")
        private String uploadPurpose;

        @Schema(
            description = "Optional description of the document",
            example = "Passport copy for university application"
        )
        @Size(max = 500, message = "Description cannot exceed 500 characters")
        private String description;
    }

    /**
     * DTO for document search request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Request to search user's documents")
    public static class SearchDocumentsRequest {

        @Schema(
            description = "File type to filter by",
            example = "PDF"
        )
        @JsonProperty("file_type")
        private String fileType;

        @Schema(
            description = "Upload purpose to filter by",
            example = "APPLICATION"
        )
        @JsonProperty("upload_purpose")
        private String uploadPurpose;

        @Schema(
            description = "Search term for filename or description",
            example = "passport"
        )
        @JsonProperty("search_term")
        private String searchTerm;

        @Schema(
            description = "Page number (0-based)",
            example = "0"
        )
        private Integer page;

        @Schema(
            description = "Page size",
            example = "20"
        )
        private Integer size;
    }

    /**
     * DTO for updating document description
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Request to update document description")
    public static class UpdateDescriptionRequest {

        @NotBlank(message = "Description is required")
        @Size(max = 500, message = "Description cannot exceed 500 characters")
        @Schema(
            description = "New description for the document",
            example = "Updated passport copy with clear photo"
        )
        private String description;
    }
}

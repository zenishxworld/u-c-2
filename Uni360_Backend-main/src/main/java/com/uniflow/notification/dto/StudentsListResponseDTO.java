package com.uniflow.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for students list API used in notification system.
 * Follows the same pattern as other API responses in the UniFLow platform.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentsListResponseDTO {

    private List<StudentSummaryDTO> students;
    private PaginationDTO pagination;
    private FilterSummaryDTO summary;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Individual student summary for dropdown/selection
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StudentSummaryDTO {
        private Long id;
        private String name;
        private String email;
        private String userType;
        private String status;
        private String profileStatus;
        private Integer profileCompletion;
    }

    /**
     * Pagination information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationDTO {
        private Integer page;
        private Integer size;
        private Long total;
        private Integer totalPages;
        private Boolean hasNext;
        private Boolean hasPrevious;
        private Integer currentPageItems;
    }

    /**
     * Summary statistics for the filtered results
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterSummaryDTO {
        private Integer totalStudents;
        private Integer activeStudents;
        private Integer pendingVerificationStudents;
        private String searchTerm;
        private Boolean filtered;
    }
}

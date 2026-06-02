package com.uniflow.workflow.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple response DTO for my tasks endpoint
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyTasksResponseDTO {

    private List<TaskDTO> tasks;
    private PaginationDTO pagination;
    private TaskSummaryDTO summary;
    private LocalDateTime timestamp;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaginationDTO {

        private int page;
        private int size;
        private int total;
        private int totalPages;
        private boolean hasNext;
        private boolean hasPrevious;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSummaryDTO {

        private int myTasks;
        private int created;
        private int claimed;
        private int completed;
    }
}

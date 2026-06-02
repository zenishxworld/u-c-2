package com.uniflow.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskClaimRequestDTO for admin task claiming operations
 *
 * <p>This DTO represents the request payload when an admin claims a task.
 * It includes the claim reason and any additional context.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskClaimRequestDTO {

    @NotBlank(message = "Task ID is required")
    private String taskId;

    @NotBlank(message = "Admin ID is required")
    private String adminId;

    @Size(max = 500, message = "Claim reason cannot exceed 500 characters")
    private String claimReason;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;

    private Boolean expediteProcessing;

    private Integer estimatedCompletionHours;

    @Builder.Default
    private Boolean notifyStudent = false;

    @Builder.Default
    private Boolean prioritizeTask = false;
}

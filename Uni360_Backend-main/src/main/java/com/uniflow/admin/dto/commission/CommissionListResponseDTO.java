package com.uniflow.admin.dto.commission;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CommissionListResponseDTO - Commission Listing Response DTO for Admin Portal
 *
 * <p>This DTO provides paginated commission listings with detailed information about each commission,
 * including application details, university information, and payment status.
 *
 * <p>Used by endpoints:
 * - GET /api/v1/admin/commissions
 * - Commission management listing page
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionListResponseDTO {

    @JsonProperty("commissions")
    private List<CommissionDetailDTO> commissions;

    @JsonProperty("totalElements")
    private Long totalElements;

    @JsonProperty("totalPages")
    private Integer totalPages;

    @JsonProperty("currentPage")
    private Integer currentPage;

    @JsonProperty("pageSize")
    private Integer pageSize;

    @JsonProperty("hasNext")
    private Boolean hasNext;

    @JsonProperty("hasPrevious")
    private Boolean hasPrevious;

    @JsonProperty("totalAmount")
    private BigDecimal totalAmount;

    @JsonProperty("currency")
    private String currency;

    /**
     * Individual commission detail
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommissionDetailDTO {

        @JsonProperty("applicationId")
        private UUID applicationId;

        @JsonProperty("applicationReference")
        private String applicationReference;

        @JsonProperty("studentId")
        private Long studentId;

        @JsonProperty("studentName")
        private String studentName;

        @JsonProperty("studentEmail")
        private String studentEmail;

        @JsonProperty("universityId")
        private UUID universityId;

        @JsonProperty("universityName")
        private String universityName;

        @JsonProperty("universityCountry")
        private String universityCountry;

        @JsonProperty("courseId")
        private UUID courseId;

        @JsonProperty("courseName")
        private String courseName;

        @JsonProperty("programLevel")
        private String programLevel;

        @JsonProperty("commissionAmount")
        private BigDecimal commissionAmount;

        @JsonProperty("commissionRate")
        private BigDecimal commissionRate;

        @JsonProperty("applicationFee")
        private BigDecimal applicationFee;

        @JsonProperty("serviceFee")
        private BigDecimal serviceFee;

        @JsonProperty("currency")
        private String currency;

        @JsonProperty("commissionStatus")
        private String commissionStatus; // PENDING, APPROVED, PAID, OVERDUE

        @JsonProperty("paymentStatus")
        private String paymentStatus; // PENDING, COMPLETED, FAILED, REFUNDED

        @JsonProperty("assignedAdminId")
        private Long assignedAdminId;

        @JsonProperty("assignedAdminName")
        private String assignedAdminName;

        @JsonProperty("applicationStatus")
        private String applicationStatus;

        @JsonProperty("workflowStage")
        private String workflowStage;

        @JsonProperty("submittedAt")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime submittedAt;

        @JsonProperty("approvedAt")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime approvedAt;

        @JsonProperty("paidAt")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime paidAt;

        @JsonProperty("dueDate")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime dueDate;

        @JsonProperty("isOverdue")
        private Boolean isOverdue;

        @JsonProperty("daysSinceSubmission")
        private Long daysSinceSubmission;

        @JsonProperty("notes")
        private String notes;

        @JsonProperty("territory")
        private String territory;

        @JsonProperty("region")
        private String region;

        @JsonProperty("intakeTerm")
        private String intakeTerm;

        @JsonProperty("intakeYear")
        private String intakeYear;

        @JsonProperty("priority")
        private String priority;
    }
}

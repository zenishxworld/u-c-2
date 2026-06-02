package com.uniflow.commission.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionDetailDTO {
    // Application info
    private UUID applicationId;
    private String applicationStatus;
    private LocalDateTime completedAt;

    // Student info
    private Long studentId;
    private String studentName;
    private String studentEmail;

    // Assigned Admin info
    private Long assignedAdminId;
    private String assignedAdminName;

    // University info
    private UUID universityId;
    private String universityName;

    // Commission calculation
    private BigDecimal paymentAmount;       // Actual payment made
    private BigDecimal commissionRate;      // Rate % stored for university
    private BigDecimal commissionAmount;    // = tuitionFee * commissionRate / 100
    private String currency;

    // University type — only "private" universities attract commission
    private String universityType;          // "private" or "public"
    private BigDecimal tuitionFee;          // course.tuition_international used as base
    private String intakeSeasons;           // e.g. "Fall" or "Fall, Spring"
    private Boolean commissionApplicable;   // false for public universities
    private String nonApplicableReason;     // populated when commissionApplicable=false
}

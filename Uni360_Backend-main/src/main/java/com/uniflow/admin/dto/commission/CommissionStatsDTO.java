package com.uniflow.admin.dto.commission;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * CommissionStatsDTO - Commission Statistics Response DTO for Admin Portal
 *
 * <p>This DTO provides comprehensive commission statistics and analytics for admin users,
 * including total earnings, payment status, period-wise breakdown, and top performing agents.
 *
 * <p>Used by endpoints:
 * - GET /api/v1/admin/commissions/stats
 * - Admin dashboard commission overview
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionStatsDTO {

    @JsonProperty("totalCommissions")
    private BigDecimal totalCommissions;

    @JsonProperty("paidCommissions")
    private BigDecimal paidCommissions;

    @JsonProperty("pendingCommissions")
    private BigDecimal pendingCommissions;

    @JsonProperty("overdueCommissions")
    private BigDecimal overdueCommissions;

    @JsonProperty("thisMonthCommissions")
    private BigDecimal thisMonthCommissions;

    @JsonProperty("lastMonthCommissions")
    private BigDecimal lastMonthCommissions;

    @JsonProperty("totalApplications")
    private Long totalApplications;

    @JsonProperty("commissionsThisYear")
    private BigDecimal commissionsThisYear;

    @JsonProperty("averageCommissionRate")
    private BigDecimal averageCommissionRate;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("fromDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fromDate;

    @JsonProperty("toDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate toDate;

    @JsonProperty("byPeriod")
    private List<PeriodCommissionDTO> byPeriod;

    @JsonProperty("topAgents")
    private List<AgentCommissionDTO> topAgents;

    @JsonProperty("topUniversities")
    private List<UniversityCommissionSummaryDTO> topUniversities;

    /**
     * Period-wise commission breakdown
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PeriodCommissionDTO {
        @JsonProperty("period")
        private String period; // Format: "2024-01" or "2024-Q1"

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("applicationCount")
        private Long applicationCount;

        @JsonProperty("periodType")
        private String periodType; // MONTHLY, QUARTERLY, YEARLY
    }

    /**
     * Agent performance summary
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AgentCommissionDTO {
        @JsonProperty("adminId")
        private String adminId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("email")
        private String email;

        @JsonProperty("totalCommission")
        private BigDecimal totalCommission;

        @JsonProperty("applicationCount")
        private Long applicationCount;

        @JsonProperty("averageCommissionPerApp")
        private BigDecimal averageCommissionPerApp;

        @JsonProperty("rank")
        private Integer rank;
    }

    /**
     * University commission summary
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UniversityCommissionSummaryDTO {
        @JsonProperty("universityId")
        private String universityId;

        @JsonProperty("universityName")
        private String universityName;

        @JsonProperty("country")
        private String country;

        @JsonProperty("totalCommission")
        private BigDecimal totalCommission;

        @JsonProperty("applicationCount")
        private Long applicationCount;

        @JsonProperty("commissionRate")
        private BigDecimal commissionRate;

        @JsonProperty("averageCommissionPerApp")
        private BigDecimal averageCommissionPerApp;
    }
}

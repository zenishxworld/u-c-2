package com.uniflow.commission.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionStatsDTO {
    private BigDecimal totalCommissionEarned;
    private int totalCompletedApplications;
    private int totalUniversitiesWithRates;
    private Map<String, BigDecimal> commissionByUniversity;  // universityName -> amount
    private List<CommissionDetailDTO> recentCommissions;
}

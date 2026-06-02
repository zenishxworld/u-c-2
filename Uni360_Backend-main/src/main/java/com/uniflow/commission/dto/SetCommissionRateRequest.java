package com.uniflow.commission.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetCommissionRateRequest {
    private UUID universityId;
    private BigDecimal commissionRate;   // e.g. 12.50 for 12.50%
    private String description;
}

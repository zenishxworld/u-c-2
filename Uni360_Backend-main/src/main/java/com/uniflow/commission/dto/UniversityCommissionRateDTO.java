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
public class UniversityCommissionRateDTO {
    private UUID universityId;
    private String universityName;
    private String universityCode;
    private BigDecimal commissionRate;
    private String description;
    private Boolean isActive;
}

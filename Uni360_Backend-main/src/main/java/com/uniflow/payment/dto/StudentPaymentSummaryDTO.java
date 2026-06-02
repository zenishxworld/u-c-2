package com.uniflow.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentPaymentSummaryDTO {

    @JsonProperty("student_id")
    private Long studentId;

    @JsonProperty("student_name")
    private String studentName;

    @JsonProperty("student_email")
    private String studentEmail;

    @JsonProperty("total_payments_count")
    private Integer totalPaymentsCount;

    @JsonProperty("payments")
    private List<PaymentResponseDTO> payments;
}

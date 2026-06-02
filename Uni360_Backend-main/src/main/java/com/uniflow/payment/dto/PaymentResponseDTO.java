package com.uniflow.payment.dto;

import com.uniflow.auth.entity.User;
import com.uniflow.payment.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for returning payment details to Admins.
 * Includes both the payment entity data and basic student info if available.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
    private UUID id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private BigDecimal amount;
    private String currency;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String status;
    private String paymentPurpose;
    private String referenceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static PaymentResponseDTO fromEntity(Payment payment, User student) {
        PaymentResponseDTOBuilder builder = PaymentResponseDTO.builder()
            .id(payment.getId())
            .studentId(payment.getStudentId())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .razorpayOrderId(payment.getRazorpayOrderId())
            .razorpayPaymentId(payment.getRazorpayPaymentId())
            .status(payment.getStatus())
            .paymentPurpose(payment.getPaymentPurpose())
            .referenceId(payment.getReferenceId())
            .createdAt(payment.getCreatedAt())
            .updatedAt(payment.getUpdatedAt());
            
        if (student != null) {
            builder.studentName(student.getFullName())
                   .studentEmail(student.getEmail());
        }
        
        return builder.build();
    }
}

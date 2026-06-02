package com.uniflow.payment.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("payments")
public class Payment implements Persistable<UUID> {

    @Id
    @Column("id")
    private UUID id;

    @Column("student_id")
    private Long studentId;

    @Column("amount")
    private BigDecimal amount;

    @Column("currency")
    @Builder.Default
    private String currency = "INR";

    @Column("razorpay_order_id")
    private String razorpayOrderId;

    @Column("razorpay_payment_id")
    private String razorpayPaymentId;

    @Column("status")
    @Builder.Default
    private String status = "PENDING"; // PENDING, COMPLETED, FAILED

    @Column("payment_purpose")
    private String paymentPurpose; // e.g. APPLICATION_FEE, ONE_ON_ONE_CALL_FEE, APPOINTMENT_FEE, AI_TOOLS, LANGUAGE_COURSE_FEE, CHANCENKARTE_FEE, UNIVERSITY_PAYMENT, CONSULTANCY_FEES, OTHER

    @Column("reference_id")
    private String referenceId; // Optional: application UUID, appointment UUID, etc.

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return this.isNew || id == null;
    }
}

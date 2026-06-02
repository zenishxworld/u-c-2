package com.uniflow.payment.repository;

import com.uniflow.payment.entity.Payment;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PaymentRepository extends ReactiveCrudRepository<Payment, UUID> {

    Mono<Payment> findByRazorpayOrderId(String razorpayOrderId);

    // Student: all their payments, newest first
    Flux<Payment> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    // Student: filtered by payment type
    Flux<Payment> findByStudentIdAndPaymentPurposeOrderByCreatedAtDesc(Long studentId, String paymentPurpose);

    // SuperAdmin: all payments
    Flux<Payment> findAllByOrderByCreatedAtDesc();

    // SuperAdmin: filter by purpose
    Flux<Payment> findAllByPaymentPurposeOrderByCreatedAtDesc(String paymentPurpose);

    // SuperAdmin: filter by status
    Flux<Payment> findAllByStatusOrderByCreatedAtDesc(String status);

    // SuperAdmin: filter by purpose + status
    Flux<Payment> findAllByPaymentPurposeAndStatusOrderByCreatedAtDesc(String paymentPurpose, String status);

    // Admin: payments for students assigned to this admin (all)
    @Query(
        "SELECT p.* FROM payments p " +
        "WHERE p.student_id IN (" +
        "    SELECT a.student_id FROM applications a " +
        "    WHERE a.assigned_admin_id = :adminId " +
        "    AND a.is_active = true" +
        ") ORDER BY p.created_at DESC"
    )
    Flux<Payment> findPaymentsForAdmin(@Param("adminId") Long adminId);

    // Admin: payments for assigned students with optional filters
    @Query(
        "SELECT p.* FROM payments p " +
        "WHERE p.student_id IN (" +
        "    SELECT a.student_id FROM applications a " +
        "    WHERE a.assigned_admin_id = :adminId AND a.is_active = true" +
        ") AND (:paymentPurpose IS NULL OR p.payment_purpose = :paymentPurpose)" +
        " AND (:status IS NULL OR p.status = :status)" +
        " AND (:studentId IS NULL OR p.student_id = :studentId)" +
        " ORDER BY p.created_at DESC"
    )
    Flux<Payment> findPaymentsForAdminFiltered(
        @Param("adminId") Long adminId,
        @Param("paymentPurpose") String paymentPurpose,
        @Param("status") String status,
        @Param("studentId") Long studentId
    );
}

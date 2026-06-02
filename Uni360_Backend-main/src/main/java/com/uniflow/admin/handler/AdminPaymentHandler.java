package com.uniflow.admin.handler;

import com.uniflow.auth.repository.UserRepository;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.payment.dto.PaymentResponseDTO;
import com.uniflow.payment.service.PaymentService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Handler for Admin and SuperAdmin payment viewing.
 *
 * Admin:      GET /api/v1/admin/payments?payment_type=&status=&student_id=
 * SuperAdmin: GET /api/v1/superadmin/dashboard/payments?payment_type=&status=
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminPaymentHandler {

    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    /**
     * Admin view: Returns payments for students assigned to the logged-in admin.
     * Supports optional query filters:
     *   ?payment_type=APPLICATION_FEE  (filter by type)
     *   ?status=COMPLETED              (filter by status)
     *   ?student_id=123                (filter by specific student)
     */
    public Mono<ServerResponse> getPaymentsForAdmin(ServerRequest request) {
        String paymentType = request.queryParam("payment_type").orElse(null);
        String status      = request.queryParam("status").orElse(null);
        Long   studentId   = request.queryParam("student_id").map(Long::parseLong).orElse(null);

        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.info("Admin {} fetching payments — type={}, status={}, studentId={}",
                    adminId, paymentType, status, studentId);
                return paymentService.getPaymentsForAdmin(adminId, paymentType, status, studentId)
                    .flatMap(payment ->
                        userRepository.findById(payment.getStudentId())
                            .map(user -> PaymentResponseDTO.fromEntity(payment, user))
                            .defaultIfEmpty(PaymentResponseDTO.fromEntity(payment, null))
                    )
                    .collectList();
            })
            .flatMap(payments -> {
                java.util.List<com.uniflow.payment.dto.StudentPaymentSummaryDTO> grouped = groupPaymentsByStudent(payments);
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(
                        Map.of(
                            "student_payments", grouped, 
                            "total_students", grouped.size(),
                            "total_payments", payments.size()
                        ),
                        "Admin payments fetched successfully"
                    ));
            })
            .onErrorResume(e -> {
                log.error("Error fetching admin payments", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to fetch payments: " + e.getMessage()));
            });
    }

    /**
     * SuperAdmin view: Returns ALL payments across the system.
     * Supports optional query filters:
     *   ?payment_type=SOP_FEE   (filter by type)
     *   ?status=COMPLETED       (filter by status)
     */
    public Mono<ServerResponse> getAllPaymentsForSuperAdmin(ServerRequest request) {
        String paymentType = request.queryParam("payment_type").orElse(null);
        String status      = request.queryParam("status").orElse(null);

        log.info("SuperAdmin fetching all payments — type={}, status={}", paymentType, status);

        return paymentService.getAllPayments(paymentType, status)
            .flatMap(payment ->
                userRepository.findById(payment.getStudentId())
                    .map(user -> PaymentResponseDTO.fromEntity(payment, user))
                    .defaultIfEmpty(PaymentResponseDTO.fromEntity(payment, null))
            )
            .collectList()
            .flatMap(payments -> {
                // Build summary breakdown by payment type
                Map<String, Long> breakdown = new java.util.HashMap<>();
                payments.forEach(p -> breakdown.merge(
                    p.getPaymentPurpose() != null ? p.getPaymentPurpose() : "UNKNOWN", 1L, Long::sum));

                long totalCompleted = payments.stream()
                    .filter(p -> "COMPLETED".equals(p.getStatus())).count();

                java.util.List<com.uniflow.payment.dto.StudentPaymentSummaryDTO> grouped = groupPaymentsByStudent(payments);

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(
                        Map.of(
                            "student_payments", grouped,
                            "total_students",  grouped.size(),
                            "total_payments",  payments.size(),
                            "total_completed", totalCompleted,
                            "total_pending",   payments.size() - totalCompleted,
                            "breakdown_by_type", breakdown
                        ),
                        "All payments fetched successfully"
                    ));
            })
            .onErrorResume(e -> {
                log.error("Error fetching all payments", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to fetch payments: " + e.getMessage()));
            });
    }

    private java.util.List<com.uniflow.payment.dto.StudentPaymentSummaryDTO> groupPaymentsByStudent(java.util.List<PaymentResponseDTO> payments) {
        java.util.Map<Long, com.uniflow.payment.dto.StudentPaymentSummaryDTO> map = new java.util.LinkedHashMap<>();
        for (PaymentResponseDTO p : payments) {
            Long studentId = p.getStudentId();
            if (studentId == null) continue; // safety
            map.putIfAbsent(studentId, com.uniflow.payment.dto.StudentPaymentSummaryDTO.builder()
                .studentId(studentId)
                .studentName(p.getStudentName())
                .studentEmail(p.getStudentEmail())
                .totalPaymentsCount(0)
                .payments(new java.util.ArrayList<>())
                .build());
            
            com.uniflow.payment.dto.StudentPaymentSummaryDTO summary = map.get(studentId);
            summary.getPayments().add(p);
            summary.setTotalPaymentsCount(summary.getPayments().size());
        }
        return new java.util.ArrayList<>(map.values());
    }
}

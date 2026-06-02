package com.uniflow.payment.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.payment.dto.CreateOrderRequest;
import com.uniflow.payment.dto.CreateOrderResponse;
import com.uniflow.payment.dto.VerifyPaymentRequest;
import com.uniflow.payment.service.PaymentService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * PaymentHandler – functional WebFlux handler for Razorpay payment endpoints.
 *
 * Routes under /api/v1/payment:
 *   POST /create-order  – Creates a Razorpay order (payment_type required)
 *   POST /verify        – Verifies a completed payment
 *   GET  /history       – Student: view own payment history (filterable by ?type=)
 *   GET  /types         – Returns all valid payment_type values
 *   GET  /health        – Health check
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentHandler {

    private final PaymentService paymentService;
    private final JwtUtils jwtUtils;

    // -----------------------------------------------------------------------
    // POST /api/v1/payment/create-order
    // -----------------------------------------------------------------------

    public Mono<ServerResponse> createOrder(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .switchIfEmpty(Mono.error(new RuntimeException("Unauthorized: missing or invalid token")))
            .flatMap(studentId ->
                request.bodyToMono(CreateOrderRequest.class)
                    .doOnNext(req -> log.info("Create order request from student {}: amount={} paise, type={}",
                        studentId, req.getAmount(), req.getPaymentType()))
                    .flatMap(orderRequest -> paymentService.createOrder(studentId, orderRequest))
            )
            .flatMap(orderResponse ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(orderResponse, "Order created successfully")))
            .onErrorResume(error -> {
                log.error("Create order error: {}", error.getMessage(), error);
                HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
                if (error.getMessage() != null && error.getMessage().contains("Unauthorized")) {
                    status = HttpStatus.UNAUTHORIZED;
                } else if (error instanceof IllegalArgumentException) {
                    status = HttpStatus.BAD_REQUEST;
                }
                return ServerResponse.status(status)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to create payment order: " + error.getMessage()));
            });
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/payment/verify
    // -----------------------------------------------------------------------

    public Mono<ServerResponse> verifyPayment(ServerRequest request) {
        return request
            .bodyToMono(VerifyPaymentRequest.class)
            .doOnNext(req -> log.info("Verify payment request: orderId={}, paymentId={}",
                req.getRazorpayOrderId(), req.getRazorpayPaymentId()))
            .flatMap(paymentService::verifyPayment)
            .flatMap(valid -> {
                if (valid) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(
                            Map.of("verified", true),
                            "Payment verified successfully"));
                } else {
                    return ServerResponse.status(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Payment verification failed: invalid signature"));
                }
            })
            .onErrorResume(error -> {
                log.error("Verify payment error: {}", error.getMessage(), error);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Payment verification error: " + error.getMessage()));
            });
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/payment/history?type=APPLICATION_FEE
    // -----------------------------------------------------------------------

    /**
     * Returns the logged-in student's payment history.
     * Optional query param: ?type=APPLICATION_FEE (filter by payment type)
     */
    public Mono<ServerResponse> getPaymentHistory(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .switchIfEmpty(Mono.error(new RuntimeException("Unauthorized: missing or invalid token")))
            .flatMapMany(studentId -> {
                String typeFilter = request.queryParam("type").orElse(null);
                log.info("Payment history request: studentId={}, typeFilter={}", studentId, typeFilter);
                return paymentService.getPaymentHistory(studentId, typeFilter);
            })
            .collectList()
            .flatMap(payments ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(
                        Map.of(
                            "payments", payments,
                            "total", payments.size()
                        ),
                        "Payment history retrieved successfully"
                    ))
            )
            .onErrorResume(error -> {
                log.error("Payment history error: {}", error.getMessage(), error);
                HttpStatus status = error.getMessage() != null && error.getMessage().contains("Unauthorized")
                    ? HttpStatus.UNAUTHORIZED : HttpStatus.INTERNAL_SERVER_ERROR;
                return ServerResponse.status(status)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to retrieve payment history: " + error.getMessage()));
            });
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/payment/types
    // -----------------------------------------------------------------------

    /** Returns all valid payment_type values */
    public Mono<ServerResponse> getPaymentTypes(ServerRequest request) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(ApiResponse.success(
                Map.of("payment_types", paymentService.getValidPaymentTypes()),
                "Valid payment types retrieved"
            ));
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/payment/health
    // -----------------------------------------------------------------------

    public Mono<ServerResponse> healthCheck(ServerRequest request) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(ApiResponse.success("OK", "Payment service is healthy"));
    }
}

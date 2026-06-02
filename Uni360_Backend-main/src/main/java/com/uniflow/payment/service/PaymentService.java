package com.uniflow.payment.service;
import com.uniflow.payment.config.RazorpayProperties;
import com.uniflow.payment.dto.CreateOrderRequest;
import com.uniflow.payment.dto.CreateOrderResponse;
import com.uniflow.payment.dto.VerifyPaymentRequest;
import com.uniflow.payment.entity.Payment;
import com.uniflow.payment.repository.PaymentRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service layer for Razorpay payment operations.
 *
 * <p>payment_type is required. Valid values:
 *   APPLICATION_FEE | ONE_ON_ONE_CALL_FEE | APPOINTMENT_FEE | AI_TOOLS |
 *   LANGUAGE_COURSE_FEE | CHANCENKARTE_FEE | UNIVERSITY_PAYMENT | CONSULTANCY_FEES | OTHER
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";
    private static final String HMAC_SHA256 = "HmacSHA256";

    /** All valid payment types */
    private static final Set<String> VALID_PAYMENT_TYPES = Set.of(
        "APPLICATION_FEE",
        "ONE_ON_ONE_CALL_FEE",
        "APPOINTMENT_FEE",
        "AI_TOOLS",
        "LANGUAGE_COURSE_FEE",
        "CHANCENKARTE_FEE",
        "UNIVERSITY_PAYMENT",
        "CONSULTANCY_FEES",
        "OTHER"
    );

    private final RazorpayProperties razorpayProperties;
    private final PaymentRepository paymentRepository;

    // -----------------------------------------------------------------------
    // Create Order
    // -----------------------------------------------------------------------

    /**
     * Creates a Razorpay order.
     * payment_type in the request is required and validated.
     */
    public Mono<CreateOrderResponse> createOrder(Long studentId, CreateOrderRequest request) {
        // Validate payment_type
        String paymentType = request.getPaymentType();
        if (paymentType == null || paymentType.isBlank()) {
            return Mono.error(new IllegalArgumentException(
                "payment_type is required. Valid values: " + VALID_PAYMENT_TYPES
            ));
        }
        String normalizedType = paymentType.trim().toUpperCase();
        if (!VALID_PAYMENT_TYPES.contains(normalizedType)) {
            return Mono.error(new IllegalArgumentException(
                "Invalid payment_type '" + paymentType + "'. Valid values: " + VALID_PAYMENT_TYPES
            ));
        }

        long amount     = (request.getAmount()   != null) ? request.getAmount()   : razorpayProperties.getDefaultAmount();
        String currency = (request.getCurrency() != null) ? request.getCurrency() : razorpayProperties.getDefaultCurrency();
        String receipt  = (request.getReceipt()  != null) ? request.getReceipt()
                          : "rcpt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        Map<String, Object> body = new HashMap<>();
        body.put("amount",   amount);
        body.put("currency", currency);
        body.put("receipt",  receipt);
        
        // Merge frontend notes with our strict internal tracking notes
        Map<String, String> mergedNotes = new HashMap<>();
        if (request.getNotes() != null) {
            mergedNotes.putAll(request.getNotes());
        }
        mergedNotes.put("payment_type", normalizedType);
        if (request.getReferenceId() != null && !request.getReferenceId().isBlank()) {
            mergedNotes.put("reference_id", request.getReferenceId());
        }
        body.put("notes", mergedNotes);

        log.info("Creating Razorpay order: amount={} paise, currency={}, type={}, referenceId={}",
            amount, currency, normalizedType, request.getReferenceId());

        final String finalReceipt   = receipt;
        final long   finalAmount    = amount;
        final String finalCurrency  = currency;
        final String finalType      = normalizedType;
        final String finalRefId     = request.getReferenceId();

        return buildWebClient()
            .post()
            .uri("/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(Map.class)
            .flatMap(response -> {
                String orderId = (String) response.get("id");
                log.info("Razorpay order created: orderId={}, type={}", orderId, finalType);

                Payment payment = Payment.builder()
                    .studentId(studentId)
                    .amount(BigDecimal.valueOf(finalAmount).divide(BigDecimal.valueOf(100)))
                    .currency(finalCurrency)
                    .razorpayOrderId(orderId)
                    .status("PENDING")
                    .paymentPurpose(finalType)
                    .referenceId(finalRefId)
                    .build();

                return paymentRepository.save(payment)
                    .map(saved -> CreateOrderResponse.builder()
                        .orderId(orderId)
                        .keyId(razorpayProperties.getKeyId())
                        .amount(finalAmount)
                        .currency(finalCurrency)
                        .receipt(finalReceipt)
                        .build());
            })
            .doOnError(error -> log.error("Error creating Razorpay order: {}", error.getMessage()));
    }

    // -----------------------------------------------------------------------
    // Verify Payment
    // -----------------------------------------------------------------------

    public Mono<Boolean> verifyPayment(VerifyPaymentRequest request) {
        return Mono.fromCallable(() -> {
            String data     = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String computed = hmacSha256(data, razorpayProperties.getKeySecret());
            return computed.equals(request.getRazorpaySignature());
        })
        .flatMap(valid -> {
            if (valid) {
                log.info("Payment verified: paymentId={}, orderId={}",
                    request.getRazorpayPaymentId(), request.getRazorpayOrderId());
                return paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .flatMap(payment -> {
                        payment.setStatus("COMPLETED");
                        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
                        payment.setNew(false);
                        return paymentRepository.save(payment);
                    })
                    .thenReturn(true);
            } else {
                log.warn("Payment verification FAILED: paymentId={}, orderId={}",
                    request.getRazorpayPaymentId(), request.getRazorpayOrderId());
                return paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .flatMap(payment -> {
                        payment.setStatus("FAILED");
                        payment.setNew(false);
                        return paymentRepository.save(payment);
                    })
                    .thenReturn(false);
            }
        });
    }

    // -----------------------------------------------------------------------
    // Student Payment History
    // -----------------------------------------------------------------------

    /**
     * Returns a student's payment history, optionally filtered by type.
     * @param studentId  the logged-in student
     * @param typeFilter optional — e.g. "APPLICATION_FEE"
     */
    public Flux<Payment> getPaymentHistory(Long studentId, String typeFilter) {
        if (typeFilter != null && !typeFilter.isBlank()) {
            return paymentRepository.findByStudentIdAndPaymentPurposeOrderByCreatedAtDesc(
                studentId, typeFilter.trim().toUpperCase());
        }
        return paymentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    // -----------------------------------------------------------------------
    // Admin Payment List (filtered)
    // -----------------------------------------------------------------------

    public Flux<Payment> getPaymentsForAdmin(Long adminId, String typeFilter, String status, Long studentId) {
        return paymentRepository.findPaymentsForAdminFiltered(adminId, typeFilter, status, studentId);
    }

    // -----------------------------------------------------------------------
    // SuperAdmin Payment List (filtered)
    // -----------------------------------------------------------------------

    public Flux<Payment> getAllPayments(String typeFilter, String status) {
        if (typeFilter != null && !typeFilter.isBlank() && status != null && !status.isBlank()) {
            return paymentRepository.findAllByPaymentPurposeAndStatusOrderByCreatedAtDesc(
                typeFilter.trim().toUpperCase(), status.trim().toUpperCase());
        } else if (typeFilter != null && !typeFilter.isBlank()) {
            return paymentRepository.findAllByPaymentPurposeOrderByCreatedAtDesc(typeFilter.trim().toUpperCase());
        } else if (status != null && !status.isBlank()) {
            return paymentRepository.findAllByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        }
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    /** Returns all valid payment types */
    public List<String> getValidPaymentTypes() {
        return List.copyOf(VALID_PAYMENT_TYPES);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private WebClient buildWebClient() {
        String credentials = razorpayProperties.getKeyId() + ":" + razorpayProperties.getKeySecret();
        String encoded = java.util.Base64.getEncoder()
            .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        return WebClient.builder()
            .baseUrl(RAZORPAY_BASE_URL)
            .defaultHeader("Authorization", "Basic " + encoded)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : raw) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA256", e);
        }
    }
}

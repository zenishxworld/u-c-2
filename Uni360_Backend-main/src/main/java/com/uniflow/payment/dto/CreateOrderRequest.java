package com.uniflow.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a Razorpay order.
 *
 * payment_type is REQUIRED — must be one of:
 *   APPLICATION_FEE, ONE_ON_ONE_CALL_FEE, APPOINTMENT_FEE, AI_TOOLS,
 *   LANGUAGE_COURSE_FEE, CHANCENKARTE_FEE, UNIVERSITY_PAYMENT, CONSULTANCY_FEES, OTHER
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    /** Amount in smallest currency unit (paise for INR). E.g. 50000 = ₹500 */
    @JsonProperty("amount")
    private Long amount;

    /** Currency code, defaults to INR */
    @JsonProperty("currency")
    @Builder.Default
    private String currency = "INR";

    /** Optional receipt identifier */
    @JsonProperty("receipt")
    private String receipt;

    /**
     * REQUIRED — what this payment is for.
     * Allowed: APPLICATION_FEE | ONE_ON_ONE_CALL_FEE | APPOINTMENT_FEE | AI_TOOLS
     *        | LANGUAGE_COURSE_FEE | CHANCENKARTE_FEE | UNIVERSITY_PAYMENT | CONSULTANCY_FEES | OTHER
     */
    @NotBlank(message = "payment_type is required")
    @JsonProperty("payment_type")
    private String paymentType;

    /**
     * Optional — UUID of the related entity (application, appointment, etc.)
     * Stored as-is, no FK validation.
     */
    @JsonProperty("reference_id")
    private String referenceId;

    /** Legacy notes map — kept for backward compat but no longer used for purpose */
    @JsonProperty("notes")
    private java.util.Map<String, String> notes;
}


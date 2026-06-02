package com.uniflow.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned to the frontend after creating a Razorpay order.
 * Contains all fields needed to open the Razorpay checkout widget.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderResponse {

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("keyId")
    private String keyId;

    @JsonProperty("amount")
    private Long amount;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("receipt")
    private String receipt;
}

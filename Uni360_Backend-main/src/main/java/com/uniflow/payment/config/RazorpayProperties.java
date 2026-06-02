package com.uniflow.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Razorpay integration.
 * Bound from the 'razorpay' prefix in application.yml / environment variables.
 */
@Data
@Component
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayProperties {

    /** Razorpay Key ID (public) */
    private String keyId;

    /** Razorpay Key Secret (private – used for HMAC signature verification) */
    private String keySecret;

    /** Default payment amount in paise (100 paise = ₹1). 100 = ₹1 */
    private Long defaultAmount = 100L;

    /** Default currency */
    private String defaultCurrency = "INR";
}

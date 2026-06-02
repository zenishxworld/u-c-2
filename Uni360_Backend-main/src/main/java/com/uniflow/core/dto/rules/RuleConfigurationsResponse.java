package com.uniflow.core.dto.rules;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RuleConfigurationsResponse {

  private String clientId;
  private String version;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private GlobalSettings globalSettings;
  private ValidationSettings validationSettings;
  private ThresholdSettings thresholds;
  private FeatureToggles featureToggles;
  private List<ClientSpecificRule> clientRules;
  private Map<String, Object> customProperties;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class GlobalSettings {
    private Integer defaultTimeoutSeconds;
    private Integer maxRetryAttempts;
    private Boolean enableParallelExecution;
    private String defaultErrorHandling;
    private String logLevel;
    private Boolean enableMetrics;
    private Boolean enableAuditTrail;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ValidationSettings {
    private Boolean strictValidation;
    private Boolean allowPartialFailures;
    private Integer maxValidationErrors;
    private Boolean enableWarnings;
    private String validationMode;
    private List<String> requiredFields;
    private List<String> optionalFields;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ThresholdSettings {
    private Integer responseTimeWarningMs;
    private Integer responseTimeCriticalMs;
    private Integer memoryUsageWarningPercent;
    private Integer memoryUsageCriticalPercent;
    private Integer cpuUsageWarningPercent;
    private Integer cpuUsageCriticalPercent;
    private Integer errorRateThresholdPercent;
    private Integer concurrentRequestsLimit;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class FeatureToggles {
    private Boolean enableAdvancedValidation;
    private Boolean enableAiAnalysis;
    private Boolean enableFraudDetection;
    private Boolean enableRealTimeProcessing;
    private Boolean enableCaching;
    private Boolean enableCompression;
    private Boolean enableEncryption;
    private Boolean enableNotifications;
    private Map<String, Boolean> experimentalFeatures;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ClientSpecificRule {
    private String ruleName;
    private String ruleType;
    private Boolean enabled;
    private String condition;
    private String action;
    private Integer priority;
    private Map<String, Object> parameters;
    private String description;
  }
}

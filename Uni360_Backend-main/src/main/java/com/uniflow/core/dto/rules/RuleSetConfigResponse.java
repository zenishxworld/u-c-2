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
public class RuleSetConfigResponse {

  private String ruleSetName;
  private String clientId;
  private Boolean enabled;
  private String description;
  private String version;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private ExecutionSettings executionSettings;
  private List<RuleConfig> rules;
  private Map<String, Object> metadata;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ExecutionSettings {
    private Boolean parallelExecution;
    private Integer timeoutSeconds;
    private Integer retryAttempts;
    private Boolean stopOnError;
    private String priority;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class RuleConfig {
    private String name;
    private String className;
    private Boolean enabled;
    private Boolean critical;
    private Integer priority;
    private String description;
    private Map<String, Object> config;
    private List<String> dependencies;
  }
}

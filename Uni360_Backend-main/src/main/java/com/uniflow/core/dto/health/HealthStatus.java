package com.uniflow.core.dto.health;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealthStatus {

  private String status;
  private String service;
  private String version;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private String error;
  private ComponentHealth database;
  private ComponentHealth cache;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ComponentHealth {
    private String status;
    private String type;
    private String component;
    private Long pingTimeMs;
    private String error;

    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
  }
}

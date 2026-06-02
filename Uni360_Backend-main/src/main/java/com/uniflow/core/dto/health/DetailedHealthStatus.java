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
public class DetailedHealthStatus {

  private String status;
  private String service;
  private String version;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private ComponentHealthDetails components;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ComponentHealthDetails {
    private DatabaseComponent database;
    private CacheComponent cache;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class DatabaseComponent {
    private String status;
    private String type;
    private Long responseTimeMs;
    private String error;

    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class CacheComponent {
    private String status;
    private String type;
    private Long pingTimeMs;
    private String error;

    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
  }
}

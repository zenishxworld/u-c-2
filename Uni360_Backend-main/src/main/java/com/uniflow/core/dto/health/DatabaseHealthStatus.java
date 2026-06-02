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
public class DatabaseHealthStatus {

  private String status;
  private String component;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private String error;
  private Long responseTimeMs;
  private String version;
  private Integer connectionCount;
  private Boolean readOnly;
}

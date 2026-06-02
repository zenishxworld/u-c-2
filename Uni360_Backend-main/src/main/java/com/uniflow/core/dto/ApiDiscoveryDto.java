package com.uniflow.core.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** API Discovery DTO for listing all available APIs in the system */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiDiscoveryDto {

  private String serviceName;
  private String version;
  private LocalDateTime timestamp;
  private List<ServiceEndpoint> services;
  private ApiStats stats;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ServiceEndpoint {
    private String name;
    private String description;
    private String basePath;
    private List<ApiEndpoint> endpoints;
    private int totalEndpoints;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ApiEndpoint {
    private String method;
    private String path;
    private String description;
    private String operationId;
    private List<String> tags;
    private RequestExample requestExample;
    private ResponseExample responseExample;
    private List<Parameter> parameters;
    private boolean requiresAuth;
    private List<String> roles;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Parameter {
    private String name;
    private String type;
    private String location; // path, query, header, body
    private boolean required;
    private String description;
    private Object defaultValue;
    private Object example;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class RequestExample {
    private String contentType;
    private Object body;
    private Map<String, String> headers;
    private Map<String, String> queryParams;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ResponseExample {
    private int statusCode;
    private String contentType;
    private Object body;
    private Map<String, String> headers;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ApiStats {
    private int totalServices;
    private int totalEndpoints;
    private int authRequiredEndpoints;
    private int publicEndpoints;
    private Map<String, Integer> endpointsByService;
    private Map<String, Integer> endpointsByMethod;
  }
}

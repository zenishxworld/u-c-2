package com.uniflow.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Standardized API response wrapper for all UniFLow services */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

  private boolean success;
  private String message;
  private T data;
  private ErrorDetails error;
  private Map<String, Object> metadata;

  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  private String requestId;
  private String version;

  public ApiResponse(boolean success, String message, T data) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = LocalDateTime.now();
  }

  // Builder pattern method for compatibility with existing code
  public ApiResponse<T> toBuilder() {
    ApiResponse<T> copy = new ApiResponse<T>();
    copy.success = this.success;
    copy.message = this.message;
    copy.data = this.data;
    copy.error = this.error;
    copy.metadata = this.metadata;
    copy.timestamp = this.timestamp;
    copy.requestId = this.requestId;
    copy.version = this.version;
    return copy;
  }

  // Static factory methods
  public static <T> ApiResponse<T> success(T data) {
    return new ApiResponse<>(true, "Request completed successfully", data);
  }

  public static <T> ApiResponse<T> success(T data, String message) {
    return new ApiResponse<>(true, message, data);
  }

  public static <T> ApiResponse<T> success(String message) {
    return new ApiResponse<>(true, message, null);
  }

  public static <T> ApiResponse<T> error(String message) {
    return new ApiResponse<>(false, message, null);
  }

  public static <T> ApiResponse<T> error(String message, ErrorDetails errorDetails) {
    ApiResponse<T> response = new ApiResponse<>(false, message, null);
    response.error = errorDetails;
    return response;
  }

  public static <T> ApiResponse<T> error(
      String message, String errorCode, Map<String, Object> details) {
    ErrorDetails errorDetails = new ErrorDetails(errorCode, null, details);

    ApiResponse<T> response = new ApiResponse<>(false, message, null);
    response.error = errorDetails;
    return response;
  }

  // Builder-style method for data
  public ApiResponse<T> data(T data) {
    this.data = data;
    return this;
  }

  /** Nested class for error details */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ErrorDetails {

    private String code;
    private Integer status;
    private Map<String, Object> details;
    private Map<String, String> fieldErrors;
    private String stackTrace;

    public ErrorDetails(String code, Integer status, Map<String, Object> details) {
      this.code = code;
      this.status = status;
      this.details = details;
    }
  }
}

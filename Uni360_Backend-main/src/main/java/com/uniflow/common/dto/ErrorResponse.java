package com.uniflow.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
  private boolean success;
  private String message;
  private String status;
  private String errorCode;
  private Object details;

  public static ErrorResponse create(String message) {
    return ErrorResponse.builder().success(false).message(message).status("ERROR").build();
  }

  public static ErrorResponse create(String message, String errorCode) {
    return ErrorResponse.builder()
        .success(false)
        .message(message)
        .status("ERROR")
        .errorCode(errorCode)
        .build();
  }

  public static ErrorResponse create(String message, String errorCode, Object details) {
    return ErrorResponse.builder()
        .success(false)
        .message(message)
        .status("ERROR")
        .errorCode(errorCode)
        .details(details)
        .build();
  }

  public static ErrorResponse tokenRequired() {
    return ErrorResponse.builder()
        .success(false)
        .message("Verification token is required")
        .status("VALIDATION_ERROR")
        .errorCode("TOKEN_REQUIRED")
        .build();
  }

  public static ErrorResponse tokenExpired() {
    return ErrorResponse.builder()
        .success(false)
        .message("Verification token has expired. Please request a new verification email.")
        .status("TOKEN_EXPIRED")
        .errorCode("TOKEN_EXPIRED")
        .build();
  }

  public static ErrorResponse tokenAlreadyUsed() {
    return ErrorResponse.builder()
        .success(false)
        .message("This verification link has already been used.")
        .status("TOKEN_USED")
        .errorCode("TOKEN_ALREADY_USED")
        .build();
  }

  public static ErrorResponse rateLimited() {
    return ErrorResponse.builder()
        .success(false)
        .message("Too many verification attempts. Please try again later.")
        .status("RATE_LIMITED")
        .errorCode("RATE_LIMITED")
        .build();
  }

  public static ErrorResponse tokenInvalid() {
    return ErrorResponse.builder()
        .success(false)
        .message("Invalid verification token.")
        .status("TOKEN_INVALID")
        .errorCode("TOKEN_INVALID")
        .build();
  }

  public static ErrorResponse userNotFound() {
    return ErrorResponse.builder()
        .success(false)
        .message("User not found.")
        .status("USER_NOT_FOUND")
        .errorCode("USER_NOT_FOUND")
        .build();
  }
}

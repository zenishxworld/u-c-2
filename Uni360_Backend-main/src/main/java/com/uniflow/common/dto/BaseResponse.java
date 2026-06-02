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
public class BaseResponse {
  private boolean success;
  private String message;
  private String status;
  private String errorCode;
  private Object data;
  private Object error;

  // Success response methods
  public static BaseResponse success(String message) {
    return BaseResponse.builder().success(true).message(message).status("SUCCESS").build();
  }

  public static BaseResponse success(String message, Object data) {
    return BaseResponse.builder()
        .success(true)
        .message(message)
        .status("SUCCESS")
        .data(data)
        .build();
  }

  // Error response methods
  public static BaseResponse error(String message) {
    return BaseResponse.builder().success(false).message(message).status("ERROR").build();
  }

  public static BaseResponse error(String message, String errorCode) {
    return BaseResponse.builder()
        .success(false)
        .message(message)
        .status("ERROR")
        .errorCode(errorCode)
        .build();
  }

  public static BaseResponse error(String message, String errorCode, Object error) {
    return BaseResponse.builder()
        .success(false)
        .message(message)
        .status("ERROR")
        .errorCode(errorCode)
        .error(error)
        .build();
  }

  // Email verification specific responses
  public static BaseResponse emailVerified() {
    return BaseResponse.builder()
        .success(true)
        .message("Email verified successfully! Your account is now active and you can log in.")
        .status("EMAIL_VERIFIED")
        .build();
  }

  public static BaseResponse emailAlreadyVerified() {
    return BaseResponse.builder()
        .success(true)
        .message("Email address is already verified and account is active")
        .status("ALREADY_VERIFIED")
        .build();
  }

  public static BaseResponse tokenRequired() {
    return BaseResponse.builder()
        .success(false)
        .message("Verification token is required")
        .status("VALIDATION_ERROR")
        .errorCode("TOKEN_REQUIRED")
        .build();
  }

  public static BaseResponse tokenExpired() {
    return BaseResponse.builder()
        .success(false)
        .message("Verification token has expired. Please request a new verification email.")
        .status("TOKEN_EXPIRED")
        .errorCode("TOKEN_EXPIRED")
        .build();
  }

  public static BaseResponse tokenAlreadyUsed() {
    return BaseResponse.builder()
        .success(false)
        .message("This verification link has already been used.")
        .status("TOKEN_USED")
        .errorCode("TOKEN_ALREADY_USED")
        .build();
  }

  public static BaseResponse rateLimited() {
    return BaseResponse.builder()
        .success(false)
        .message("Too many verification attempts. Please try again later.")
        .status("RATE_LIMITED")
        .errorCode("RATE_LIMITED")
        .build();
  }

  public static BaseResponse tokenInvalid() {
    return BaseResponse.builder()
        .success(false)
        .message("Invalid verification token.")
        .status("TOKEN_INVALID")
        .errorCode("TOKEN_INVALID")
        .build();
  }

  public static BaseResponse userNotFound() {
    return BaseResponse.builder()
        .success(false)
        .message("User not found.")
        .status("USER_NOT_FOUND")
        .errorCode("USER_NOT_FOUND")
        .build();
  }

  public static BaseResponse verificationFailed(String errorMessage) {
    return BaseResponse.builder()
        .success(false)
        .message("Email verification failed: " + errorMessage)
        .status("VERIFICATION_FAILED")
        .errorCode("VERIFICATION_FAILED")
        .build();
  }
}

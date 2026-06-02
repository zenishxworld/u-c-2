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
public class SuccessResponse {
  private boolean success;
  private String message;
  private String status;
  private Object data;

  public static SuccessResponse create(String message) {
    return SuccessResponse.builder().success(true).message(message).status("SUCCESS").build();
  }

  public static SuccessResponse create(String message, Object data) {
    return SuccessResponse.builder()
        .success(true)
        .message(message)
        .status("SUCCESS")
        .data(data)
        .build();
  }

  public static SuccessResponse emailVerified() {
    return SuccessResponse.builder()
        .success(true)
        .message("Email verified successfully! Your account is now active and you can log in.")
        .status("EMAIL_VERIFIED")
        .build();
  }

  public static SuccessResponse emailAlreadyVerified() {
    return SuccessResponse.builder()
        .success(true)
        .message("Email address is already verified and account is active")
        .status("ALREADY_VERIFIED")
        .build();
  }
}

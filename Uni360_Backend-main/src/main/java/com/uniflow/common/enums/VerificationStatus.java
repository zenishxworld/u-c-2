package com.uniflow.common.enums;

import lombok.Getter;

/** Verification status enumeration for profiles and applications */
@Getter
public enum VerificationStatus {
  DRAFT("draft", "Draft"),
  INCOMPLETE("incomplete", "Incomplete"),
  COMPLETE("complete", "Complete"),
  VERIFIED("verified", "Verified"),
  PENDING("pending", "Pending Verification");

  private final String code;
  private final String displayName;

  VerificationStatus(String code, String displayName) {
    this.code = code;
    this.displayName = displayName;
  }

  public String getCode() {
    return code;
  }

  public String getDisplayName() {
    return displayName;
  }

  /** Get enum by code value */
  public static VerificationStatus fromCode(String code) {
    for (VerificationStatus status : values()) {
      if (status.getCode().equals(code)) {
        return status;
      }
    }
    throw new IllegalArgumentException("Unknown verification status code: " + code);
  }
}

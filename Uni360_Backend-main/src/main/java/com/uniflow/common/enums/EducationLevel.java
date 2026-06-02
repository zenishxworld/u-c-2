package com.uniflow.common.enums;

import lombok.Getter;

/** Education level enumeration for student profiles */
@Getter
public enum EducationLevel {
  HIGH_SCHOOL("high_school", "High School"),
  BACHELORS("bachelors", "Bachelor's Degree"),
  MASTERS("masters", "Master's Degree"),
  PHD("phd", "PhD");

  private final String code;
  private final String displayName;

  EducationLevel(String code, String displayName) {
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
  public static EducationLevel fromCode(String code) {
    for (EducationLevel level : values()) {
      if (level.getCode().equals(code)) {
        return level;
      }
    }
    throw new IllegalArgumentException("Unknown education level code: " + code);
  }
}

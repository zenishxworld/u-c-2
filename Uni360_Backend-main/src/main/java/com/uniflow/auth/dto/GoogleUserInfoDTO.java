package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.function.Predicate;

/**
 * Google User Info DTO with functional validation
 * Represents user information from Google's userinfo endpoint
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleUserInfoDTO {

    @JsonProperty("id")
    private String id;

    @JsonProperty("email")
    private String email;

    @JsonProperty("verified_email")
    private Boolean emailVerified;

    @JsonProperty("name")
    private String name;

    @JsonProperty("given_name")
    private String givenName;

    @JsonProperty("family_name")
    private String familyName;

    @JsonProperty("picture")
    private String picture;

    @JsonProperty("locale")
    private String locale;

    // Functional validation predicate
    public static final Predicate<GoogleUserInfoDTO> IS_COMPLETE = user ->
            user != null &&
            user.getId() != null && !user.getId().isEmpty() &&
            user.getEmail() != null && !user.getEmail().isEmpty() &&
            user.getName() != null && !user.getName().isEmpty();

    public String getFirstName() {
        return givenName != null ? givenName : "";
    }

    public String getLastName() {
        return familyName != null ? familyName : "";
    }

    public String getAvatarUrl() {
        return picture != null ? picture : "";
    }

    public boolean isValid() {
        return IS_COMPLETE.test(this);
    }

    public String generateUsername() {
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf("@")).toLowerCase();
        }
        return "user_" + System.currentTimeMillis();
    }
}

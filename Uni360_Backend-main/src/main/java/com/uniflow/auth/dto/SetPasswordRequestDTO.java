package com.uniflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SetPasswordRequestDTO - Request payload for setting or changing a password.
 *
 * <p>Used by Google OAuth students who want to add password-based login to their account.
 * Also used by HYBRID users who want to change their existing password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetPasswordRequestDTO {

    /**
     * Required only when the user already has a password (HYBRID provider).
     * Google-only users do NOT need to provide this.
     */
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    public boolean isPasswordMatching() {
        return newPassword != null && newPassword.equals(confirmPassword);
    }

    /**
     * Validates password complexity:
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one digit
     * - At least one special character
     */
    public boolean isPasswordStrong() {
        if (newPassword == null) return false;
        return newPassword.matches(
            "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,128}$"
        );
    }
}

package com.uniflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned after a successful set-password operation.
 *
 * <p>The plaintext password is echoed back once so the user can confirm/note it.
 * It is NEVER stored in plaintext — only the bcrypt hash is persisted in the DB.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetPasswordResponseDTO {

    private String message;

    private String email;

    /**
     * The plaintext password the user just set — returned once for reference.
     * After this response, it cannot be retrieved again (only the hash is stored).
     */
    private String password;

    private String authProvider; // "HYBRID" after first setup, "LOCAL" for local users

    private boolean firstTimeSetup; // true if this was a Google user setting their first password
}

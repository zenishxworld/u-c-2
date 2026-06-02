package com.uniflow.auth.service;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * EmailService — sends transactional emails using JavaMailSender over SMTP.
 *
 * <p>JavaMailSender is blocking, so all calls are wrapped with
 * {@code Schedulers.boundedElastic()} to stay non-blocking inside WebFlux.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.superadmin.email:admin@uni360degree.com}")
    private String superAdminEmail;

    private static final DateTimeFormatter DISPLAY_FORMAT =
        DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // =========================================================
    // PASSWORD RESET EMAIL
    // =========================================================

    /**
     * Sends a password reset email containing the reset link.
     * Returns Mono<Void> so it can be chained in reactive pipelines.
     */
    public Mono<Void> sendPasswordResetEmail(
        String toEmail,
        String firstName,
        String resetLink,
        String resetToken,
        LocalDateTime expiresAt
    ) {
        return Mono.fromRunnable(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject("Reset Your Uni360 Password");
                helper.setText(buildPasswordResetHtml(firstName, resetLink, expiresAt), true);

                mailSender.send(message);
                log.info("✅ Password reset email sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("❌ Failed to send password reset email to: {} — {}", toEmail, e.getMessage(), e);
                throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
            }
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    // =========================================================
    // PASSWORD CHANGED NOTIFICATION EMAIL
    // =========================================================

    /**
     * Sends a security notification email after a password is changed.
     */
    public Mono<Void> sendPasswordChangedEmail(
        String toEmail,
        String firstName
    ) {
        return Mono.fromRunnable(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject("Your Uni360 Password Was Changed");
                helper.setText(buildPasswordChangedHtml(firstName), true);

                mailSender.send(message);
                log.info("✅ Password changed notification sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("❌ Failed to send password changed email to: {} — {}", toEmail, e.getMessage(), e);
            }
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    // =========================================================
    // FIRST PASSWORD SET NOTIFICATION EMAIL (Google → HYBRID)
    // =========================================================

    /**
     * Sent to a Google OAuth user when they set a password for the first time.
     */
    public Mono<Void> sendFirstPasswordSetEmail(
        String toEmail,
        String firstName
    ) {
        return Mono.fromRunnable(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject("Password Added to Your Uni360 Account");
                helper.setText(buildFirstPasswordSetHtml(firstName), true);

                mailSender.send(message);
                log.info("✅ First-password-set notification sent to: {}", toEmail);
            } catch (Exception e) {
                log.error("❌ Failed to send first-password-set email to: {} — {}", toEmail, e.getMessage(), e);
            }
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    // =========================================================
    // HTML TEMPLATES
    // =========================================================

    private String buildPasswordResetHtml(
        String firstName,
        String resetLink,
        LocalDateTime expiresAt
    ) {
        String expiry = expiresAt != null ? expiresAt.format(DISPLAY_FORMAT) + " UTC" : "30 minutes";
        String name = firstName != null ? firstName : "Student";

        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
              .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px;
                           box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
              .header { background: linear-gradient(135deg, #1a73e8, #0d47a1); padding: 36px 40px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
              .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
              .body { padding: 36px 40px; }
              .body p { color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
              .btn-wrap { text-align: center; margin: 28px 0; }
              .btn { display: inline-block; background: #1a73e8; color: #ffffff !important;
                     text-decoration: none; padding: 14px 36px; border-radius: 8px;
                     font-size: 15px; font-weight: 600; }
              .expiry { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px;
                        border-radius: 4px; font-size: 13px; color: #856404; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px 40px; text-align: center;
                        font-size: 12px; color: #888; }
            </style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Reset Your Password</h1>
                  <p>Uni360 — University Application Platform</p>
                </div>
                <div class="body">
                  <p>Hi <strong>%s</strong>,</p>
                  <p>We received a request to reset your Uni360 account password. Click the button below to reset it:</p>
                  <div class="btn-wrap">
                    <a href="%s" class="btn">Reset My Password</a>
                  </div>
                  <div class="expiry">
                    ⚠️ This link expires at <strong>%s</strong>. If you did not request this, you can safely ignore this email.
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break:break-all;font-size:13px;color:#1a73e8;">%s</p>
                </div>
                <div class="footer">
                  © 2025 Uni360. If you didn't request a password reset, no action is needed.
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, resetLink, expiry, resetLink);
    }

    private String buildPasswordChangedHtml(String firstName) {
        String name = firstName != null ? firstName : "Student";
        String time = LocalDateTime.now().format(DISPLAY_FORMAT) + " UTC";

        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
              .container { max-width: 560px; margin: 40px auto; background: #fff;
                           border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
              .header { background: linear-gradient(135deg, #2e7d32, #1b5e20); padding: 36px 40px; text-align: center; }
              .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 600; }
              .body { padding: 36px 40px; }
              .body p { color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
              .alert { background: #fce4ec; border-left: 4px solid #e91e63; padding: 12px 16px;
                       border-radius: 4px; font-size: 13px; color: #880e4f; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; font-size: 12px; color: #888; }
            </style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Password Changed</h1>
                </div>
                <div class="body">
                  <p>Hi <strong>%s</strong>,</p>
                  <p>Your Uni360 account password was changed successfully at <strong>%s</strong>.</p>
                  <div class="alert">
                    🔒 If you did <strong>not</strong> make this change, please contact support immediately or reset your password.
                  </div>
                </div>
                <div class="footer">© 2025 Uni360</div>
              </div>
            </body>
            </html>
            """.formatted(name, time);
    }

    private String buildFirstPasswordSetHtml(String firstName) {
        String name = firstName != null ? firstName : "Student";

        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
              .container { max-width: 560px; margin: 40px auto; background: #fff;
                           border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
              .header { background: linear-gradient(135deg, #6a1b9a, #4a148c); padding: 36px 40px; text-align: center; }
              .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 600; }
              .body { padding: 36px 40px; }
              .body p { color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
              .info { background: #e8f5e9; border-left: 4px solid #43a047; padding: 12px 16px;
                      border-radius: 4px; font-size: 13px; color: #1b5e20; margin: 20px 0; }
              .footer { background: #f8f9fa; padding: 20px 40px; text-align: center; font-size: 12px; color: #888; }
            </style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔑 Password Added to Your Account</h1>
                </div>
                <div class="body">
                  <p>Hi <strong>%s</strong>,</p>
                  <p>A password has been added to your Uni360 account. You can now log in using either:</p>
                  <div class="info">
                    ✅ <strong>Google Sign-In</strong> — still works as before<br>
                    ✅ <strong>Email + Password</strong> — now available
                  </div>
                  <p>If you did not make this change, please contact support immediately.</p>
                </div>
                <div class="footer">© 2025 Uni360</div>
              </div>
            </body>
            </html>
            """.formatted(name);
    }
}

package com.uniflow.contact.service;

import com.uniflow.contact.dto.ContactRequest;
import com.uniflow.contact.dto.ContactResponse;
import com.uniflow.contact.entity.ContactSubmission;
import com.uniflow.contact.repository.ContactRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;
    private final JavaMailSender mailSender;

    @Value("${app.superadmin.email}")
    private String superadminEmail;

    public Mono<ContactResponse> submitContact(ContactRequest request) {
        ContactSubmission submission = ContactSubmission.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .country(request.getCountry())
                .subject(request.getSubject())
                .message(request.getMessage())
                .status("NEW")
                .createdAt(LocalDateTime.now())
                .build();

        return contactRepository.save(submission)
                .doOnSuccess(saved -> sendEmailNotification(saved))
                .map(saved -> ContactResponse.builder()
                        .submissionId(saved.getId())
                        .message("Thank you for contacting us! We will get back to you soon.")
                        .submittedAt(saved.getCreatedAt())
                        .build());
    }

    public Mono<java.util.List<ContactSubmission>> getAllContacts() {
        return contactRepository.findAllByOrderByCreatedAtDesc().collectList();
    }

    private void sendEmailNotification(ContactSubmission submission) {
        Mono.fromRunnable(() -> {
            try {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setTo(superadminEmail);
                mail.setSubject("New Contact Form Submission: " + submission.getSubject());
                mail.setText(buildEmailBody(submission));
                mailSender.send(mail);
                log.info("Contact form email sent to superadmin for submission id={}", submission.getId());
            } catch (Exception e) {
                log.error("Failed to send contact form email notification: {}", e.getMessage(), e);
            }
        })
        .subscribeOn(Schedulers.boundedElastic())
        .subscribe();
    }

    private String buildEmailBody(ContactSubmission s) {
        return String.format("""
                New contact form submission received on UniFlow platform.
                
                ─────────────────────────────
                Name    : %s %s
                Email   : %s
                Phone   : %s
                Country : %s
                Subject : %s
                ─────────────────────────────
                Message :
                %s
                ─────────────────────────────
                Submitted at: %s
                """,
                s.getFirstName(), s.getLastName(),
                s.getEmail(),
                s.getPhone() != null ? s.getPhone() : "N/A",
                s.getCountry() != null ? s.getCountry() : "N/A",
                s.getSubject(),
                s.getMessage(),
                s.getCreatedAt()
        );
    }
}

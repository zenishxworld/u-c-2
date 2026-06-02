package com.uniflow.contact.handler;

import com.uniflow.common.dto.ApiResponse;
import com.uniflow.contact.dto.ContactRequest;
import com.uniflow.contact.service.ContactService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * ContactHandler - Public endpoint for contact form submissions.
 *
 * <p>No authentication required for POST. GET is SuperAdmin only.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContactHandler {

    private final ContactService contactService;

    /**
     * Submit contact form.
     * POST /api/v1/public/contact
     */
    public Mono<ServerResponse> submitContact(ServerRequest request) {
        return request.bodyToMono(ContactRequest.class)
                .flatMap(contactService::submitContact)
                .flatMap(response -> ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(response, "Contact form submitted successfully")))
                .onErrorResume(IllegalArgumentException.class, ex ->
                        ServerResponse.badRequest()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(ApiResponse.error("Invalid request: " + ex.getMessage())))
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error processing contact form submission", ex);
                    return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(ApiResponse.error("Failed to submit contact form. Please try again."));
                });
    }

    /**
     * Get all contact submissions (SuperAdmin only).
     * GET /api/v1/superadmin/contacts
     */
    public Mono<ServerResponse> getContacts(ServerRequest request) {
        return contactService.getAllContacts()
                .flatMap(contacts -> ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(contacts, "Contact submissions retrieved")))
                .onErrorResume(Exception.class, ex -> {
                    log.error("Error fetching contact submissions", ex);
                    return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(ApiResponse.error("Failed to fetch contact submissions."));
                });
    }
}

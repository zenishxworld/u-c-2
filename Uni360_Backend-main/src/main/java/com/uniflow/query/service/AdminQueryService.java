package com.uniflow.query.service;

import com.uniflow.query.entity.AdminQuery;
import com.uniflow.query.repository.AdminQueryRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.List;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * AdminQueryService - Handles admin-to-superadmin query workflow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminQueryService {

    private final AdminQueryRepository adminQueryRepository;
    private final ObjectMapper objectMapper;

    /** Admin: submit a new query to super-admin. */
    public Mono<AdminQuery> submitQuery(Long adminId, String subject, String message) {
        log.info("Admin {} submitting query: {}", adminId, subject);
        AdminQuery query = AdminQuery.builder()
            .adminId(adminId)
            .subject(subject)
            .message(message)
            .status("OPEN")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        return adminQueryRepository.save(query);
    }

    /** Admin: get their own submitted queries. */
    public Flux<AdminQuery> getAdminQueries(Long adminId) {
        return adminQueryRepository.findByAdminIdOrderByCreatedAtDesc(adminId)
            .map(this::populateReplies);
    }

    /** SuperAdmin: get all queries. */
    public Flux<AdminQuery> getAllQueries() {
        return adminQueryRepository.findAllByOrderByCreatedAtDesc()
            .map(this::populateReplies);
    }

    /** SuperAdmin: reply to a query. */
    public Mono<AdminQuery> replyToQuery(UUID queryId, String replyMessage, Long superAdminId) {
        log.info("SuperAdmin {} replying to query: {}", superAdminId, queryId);
        return adminQueryRepository.findById(queryId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException(
                "Query not found: " + queryId)))
            .flatMap(query -> {
                populateReplies(query);
                List<AdminQuery.QueryReply> replies = query.getReplies();
                if (replies == null) {
                    replies = new java.util.ArrayList<>();
                } else {
                    replies = new java.util.ArrayList<>(replies);
                }

                LocalDateTime now = LocalDateTime.now();
                replies.add(AdminQuery.QueryReply.builder()
                    .message(replyMessage)
                    .repliedBy(superAdminId)
                    .repliedAt(now)
                    .build());

                try {
                    query.setReply(objectMapper.writeValueAsString(replies));
                } catch (Exception e) {
                    log.error("Failed to serialize replies", e);
                    query.setReply(replyMessage); // fallback
                }

                query.setRepliedBy(superAdminId);
                query.setRepliedAt(now);
                query.setStatus("REPLIED");
                query.setUpdatedAt(now);
                
                final List<AdminQuery.QueryReply> finalReplies = replies;
                return adminQueryRepository.save(query).map(saved -> {
                    saved.setReplies(finalReplies);
                    return saved;
                });
            });
    }

    /** SuperAdmin: close a query. */
    public Mono<AdminQuery> closeQuery(UUID queryId, Long superAdminId) {
        return adminQueryRepository.findById(queryId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException(
                "Query not found: " + queryId)))
            .flatMap(query -> {
                query.setStatus("CLOSED");
                query.setUpdatedAt(LocalDateTime.now());
                return adminQueryRepository.save(query).map(this::populateReplies);
            });
    }

    private AdminQuery populateReplies(AdminQuery query) {
        if (query.getReply() != null && !query.getReply().trim().isEmpty()) {
            String raw = query.getReply().trim();
            if (raw.startsWith("[")) {
                try {
                    List<AdminQuery.QueryReply> replies = objectMapper.readValue(raw, new TypeReference<List<AdminQuery.QueryReply>>() {});
                    query.setReplies(replies);
                } catch (Exception e) {
                    log.warn("Failed to parse replies JSON for query {}", query.getId(), e);
                    query.setReplies(java.util.List.of(AdminQuery.QueryReply.builder()
                        .message(raw)
                        .repliedBy(query.getRepliedBy())
                        .repliedAt(query.getRepliedAt())
                        .build()));
                }
            } else {
                query.setReplies(java.util.List.of(AdminQuery.QueryReply.builder()
                    .message(raw)
                    .repliedBy(query.getRepliedBy())
                    .repliedAt(query.getRepliedAt())
                    .build()));
            }
        } else {
            query.setReplies(new java.util.ArrayList<>());
        }
        return query;
    }
}

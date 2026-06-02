package com.uniflow.meeting.repository;

import com.uniflow.meeting.entity.MeetingUrl;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface MeetingUrlRepository extends ReactiveCrudRepository<MeetingUrl, UUID> {

    Mono<MeetingUrl> findBySectionAndIsActiveTrue(String section);

    Flux<MeetingUrl> findAllByOrderByCreatedAtDesc();

    Flux<MeetingUrl> findByCreatedByAdminOrderByCreatedAtDesc(Long adminId);

    @Query("UPDATE meeting_urls SET is_active = false WHERE section = :section AND is_active = true")
    Mono<Integer> deactivateAllBySection(String section);
}

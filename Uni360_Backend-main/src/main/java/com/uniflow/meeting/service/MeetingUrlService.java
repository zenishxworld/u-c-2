package com.uniflow.meeting.service;

import com.uniflow.meeting.entity.MeetingUrl;
import com.uniflow.meeting.repository.MeetingUrlRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * MeetingUrlService - manages Google Meet URLs per section (VISA / FINANCE).
 * Upsert: adding a new URL for a section deactivates the previous active one.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingUrlService {

    private final MeetingUrlRepository meetingUrlRepository;

    /** Admin: add or replace the active URL for a section. */
    public Mono<MeetingUrl> addOrUpdateUrl(
        String section,
        String url,
        String label,
        Long adminId
    ) {
        String sectionUpper = section.toUpperCase();
        log.info("Admin {} setting meeting URL for section: {}", adminId, sectionUpper);

        return meetingUrlRepository
            .deactivateAllBySection(sectionUpper)
            .then(Mono.defer(() -> {
                MeetingUrl newUrl = MeetingUrl.builder()
                    .section(sectionUpper)
                    .url(url)
                    .label(label)
                    .isActive(true)
                    .createdByAdmin(adminId)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
                return meetingUrlRepository.save(newUrl);
            }));
    }

    /** Student/Admin: get active URL for a section. */
    public Mono<MeetingUrl> getActiveUrl(String section) {
        return meetingUrlRepository.findBySectionAndIsActiveTrue(section.toUpperCase());
    }

    /** Admin: list all URLs across all sections. */
    public Flux<MeetingUrl> getAllUrls() {
        return meetingUrlRepository.findAllByOrderByCreatedAtDesc();
    }

    /** Admin: list URLs created by the current admin. */
    public Flux<MeetingUrl> getUrlsByAdmin(Long adminId) {
        return meetingUrlRepository.findByCreatedByAdminOrderByCreatedAtDesc(adminId);
    }
}

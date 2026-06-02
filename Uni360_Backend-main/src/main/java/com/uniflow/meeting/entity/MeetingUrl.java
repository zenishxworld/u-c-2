package com.uniflow.meeting.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * MeetingUrl entity - admin-managed Google Meet URLs per section.
 *
 * Section values: VISA | FINANCE
 * Only one active URL per section at any time.
 * Adding a new URL for a section deactivates any previous one.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("meeting_urls")
public class MeetingUrl {

    @Id
    @Column("id")
    private UUID id;

    /** Section this URL belongs to. Values: VISA, FINANCE */
    @Column("section")
    private String section;

    /** The actual Google Meet (or any) URL */
    @Column("url")
    private String url;

    /** Optional human-readable label */
    @Column("label")
    private String label;

    /** Only one URL per section should be active */
    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    /** Admin who added this URL */
    @Column("created_by_admin")
    private Long createdByAdmin;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}

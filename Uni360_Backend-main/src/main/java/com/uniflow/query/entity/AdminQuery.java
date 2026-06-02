package com.uniflow.query.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import java.util.List;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * AdminQuery entity - admin sends queries to super-admin, who can reply.
 *
 * Status values: OPEN | REPLIED | CLOSED
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("admin_queries")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminQuery {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QueryReply {
        private String message;
        private Long repliedBy;
        private LocalDateTime repliedAt;
    }

    @Id
    @Column("id")
    private UUID id;

    /** Admin who submitted the query */
    @Column("admin_id")
    private Long adminId;

    @Column("subject")
    private String subject;

    @Column("message")
    private String message;

    /** Super-admin reply text */
    @Column("reply")
    private String reply;

    /** Super-admin who replied */
    @Column("replied_by")
    private Long repliedBy;

    @Column("replied_at")
    private LocalDateTime repliedAt;

    /** Status: OPEN | REPLIED | CLOSED */
    @Column("status")
    @Builder.Default
    private String status = "OPEN";

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Transient
    private List<QueryReply> replies;
}

package com.uniflow.quiz.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("quiz_sessions")
public class QuizSession {

    @Id
    private UUID id;

    @Column("student_id")
    private Long studentId;

    @Column("score")
    private Integer score;

    /** Stored as raw JSON string, e.g. the matched university IDs array. */
    @Column("matched_universities")
    private String matchedUniversities;

    @Column("created_at")
    private LocalDateTime createdAt;
}

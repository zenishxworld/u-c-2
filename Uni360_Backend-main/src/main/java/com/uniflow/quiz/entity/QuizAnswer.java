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
@Table("quiz_answers")
public class QuizAnswer {

    @Id
    private UUID id;

    @Column("session_id")
    private UUID sessionId;

    @Column("question_id")
    private String questionId;

    @Column("answer")
    private String answer;

    @Column("created_at")
    private LocalDateTime createdAt;
}

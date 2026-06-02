package com.uniflow.student.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * CourseFavorite entity representing the course_favorites table
 * Tracks which courses students have marked as favorites
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("course_favorites")
public class CourseFavorite {

    @Id
    @Column("id")
    private UUID id;

    @Column("student_id")
    private Long studentId;

    @Column("course_id")
    private UUID courseId;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}

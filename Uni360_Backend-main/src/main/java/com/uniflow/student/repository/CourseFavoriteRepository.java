package com.uniflow.student.repository;

import com.uniflow.student.entity.CourseFavorite;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for CourseFavorite entity using standard R2DBC methods
 */
public interface CourseFavoriteRepository extends R2dbcRepository<CourseFavorite, UUID> {

    // Check if a course is favorited by a student
    Mono<Boolean> existsByStudentIdAndCourseIdAndIsActive(
        Long studentId,
        UUID courseId,
        Boolean isActive
    );

    // Find all favorite courses for a student
    Flux<CourseFavorite> findByStudentIdAndIsActive(
        Long studentId,
        Boolean isActive
    );

    // Find specific favorite record
    Mono<CourseFavorite> findByStudentIdAndCourseIdAndIsActive(
        Long studentId,
        UUID courseId,
        Boolean isActive
    );

    // Get all course IDs favorited by a student
    Flux<UUID> findCourseIdByStudentIdAndIsActive(
        Long studentId,
        Boolean isActive
    );
}

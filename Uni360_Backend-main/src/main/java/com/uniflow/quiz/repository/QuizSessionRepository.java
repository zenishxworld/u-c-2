package com.uniflow.quiz.repository;

import com.uniflow.quiz.entity.QuizSession;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface QuizSessionRepository extends ReactiveCrudRepository<QuizSession, UUID> {

    Flux<QuizSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}

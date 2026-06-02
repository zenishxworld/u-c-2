package com.uniflow.query.repository;

import com.uniflow.query.entity.AdminQuery;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface AdminQueryRepository extends ReactiveCrudRepository<AdminQuery, UUID> {

    Flux<AdminQuery> findByAdminIdOrderByCreatedAtDesc(Long adminId);

    Flux<AdminQuery> findAllByOrderByCreatedAtDesc();

    Flux<AdminQuery> findByStatus(String status);
}

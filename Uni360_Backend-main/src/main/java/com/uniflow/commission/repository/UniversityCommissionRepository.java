package com.uniflow.commission.repository;

import com.uniflow.commission.entity.UniversityCommission;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UniversityCommissionRepository
    extends ReactiveCrudRepository<UniversityCommission, UUID> {

    Mono<UniversityCommission> findByUniversityId(UUID universityId);
}

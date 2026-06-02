package com.uniflow.visa.repository;

import com.uniflow.visa.entity.VisaTracker;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface VisaTrackerRepository extends ReactiveCrudRepository<VisaTracker, UUID> {

    Flux<VisaTracker> findByStudentId(Long studentId);

    Mono<VisaTracker> findByStudentIdAndCountry(Long studentId, String country);
}

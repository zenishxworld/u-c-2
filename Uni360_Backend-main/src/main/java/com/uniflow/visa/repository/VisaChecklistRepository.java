package com.uniflow.visa.repository;

import com.uniflow.visa.entity.VisaChecklist;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface VisaChecklistRepository extends ReactiveCrudRepository<VisaChecklist, UUID> {

    Mono<VisaChecklist> findByCountry(String country);
}

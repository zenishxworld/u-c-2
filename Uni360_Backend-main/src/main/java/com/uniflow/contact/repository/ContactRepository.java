package com.uniflow.contact.repository;

import com.uniflow.contact.entity.ContactSubmission;
import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ContactRepository extends ReactiveCrudRepository<ContactSubmission, UUID> {

    Flux<ContactSubmission> findAllByOrderByCreatedAtDesc();
}

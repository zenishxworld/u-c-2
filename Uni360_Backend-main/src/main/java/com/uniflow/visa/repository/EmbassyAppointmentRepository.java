package com.uniflow.visa.repository;

import com.uniflow.visa.entity.EmbassyAppointment;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface EmbassyAppointmentRepository extends ReactiveCrudRepository<EmbassyAppointment, UUID> {

    Flux<EmbassyAppointment> findByStudentId(Long studentId);

    Flux<EmbassyAppointment> findByStatus(String status);

    Flux<EmbassyAppointment> findByStudentIdAndCountry(Long studentId, String country);

    @Query("SELECT * FROM embassy_appointments ORDER BY appointment_date ASC, appointment_time ASC")
    Flux<EmbassyAppointment> findAllOrderByAppointmentDateAsc();

    @Query("SELECT * FROM embassy_appointments WHERE status = :status ORDER BY appointment_date ASC")
    Flux<EmbassyAppointment> findByStatusOrderByDate(String status);

    @Query("SELECT * FROM embassy_appointments WHERE created_by_admin = :adminId ORDER BY appointment_date ASC, appointment_time ASC")
    Flux<EmbassyAppointment> findByCreatedByAdminOrderByAppointmentDateAsc(Long adminId);

    @Query("SELECT * FROM embassy_appointments WHERE created_by_admin = :adminId AND status = :status ORDER BY appointment_date ASC")
    Flux<EmbassyAppointment> findByCreatedByAdminAndStatusOrderByDate(Long adminId, String status);
}

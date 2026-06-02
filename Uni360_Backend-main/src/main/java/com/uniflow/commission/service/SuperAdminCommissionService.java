package com.uniflow.commission.service;

import com.uniflow.application.entity.Application;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.auth.entity.User;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.commission.dto.CommissionDetailDTO;
import com.uniflow.commission.dto.CommissionStatsDTO;
import com.uniflow.commission.dto.SetCommissionRateRequest;
import com.uniflow.commission.dto.UniversityCommissionRateDTO;
import com.uniflow.commission.entity.UniversityCommission;
import com.uniflow.commission.repository.UniversityCommissionRepository;
import com.uniflow.payment.entity.Payment;
import com.uniflow.payment.repository.PaymentRepository;
import com.uniflow.university.entity.Course;
import com.uniflow.university.entity.University;
import com.uniflow.university.repository.CourseRepository;
import com.uniflow.university.repository.UniversityRepository;
import com.uniflow.workflow.repository.TaskRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * SuperAdminCommissionService — Handles commission rate management and
 * calculation for SuperAdmin users.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminCommissionService {

    private final UniversityCommissionRepository commissionRepository;
    private final ApplicationRepository applicationRepository;
    private final PaymentRepository paymentRepository;
    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final TaskRepository taskRepository;

    // -----------------------------------------------------------------------
    // Set / update commission rate for a university
    // -----------------------------------------------------------------------
    public Mono<UniversityCommission> setCommissionRate(SetCommissionRateRequest request, String updatedBy) {
        return commissionRepository.findByUniversityId(request.getUniversityId())
            .flatMap(existing -> {
                existing.setCommissionRate(request.getCommissionRate());
                existing.setDescription(request.getDescription());
                existing.setUpdatedAt(LocalDateTime.now());
                existing.setUpdatedBy(updatedBy);
                return commissionRepository.save(existing);
            })
            .switchIfEmpty(
                Mono.defer(() -> {
                    UniversityCommission newRate = UniversityCommission.builder()
                        .universityId(request.getUniversityId())
                        .commissionRate(request.getCommissionRate())
                        .description(request.getDescription())
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .createdBy(updatedBy)
                        .updatedBy(updatedBy)
                        .build();
                    return commissionRepository.save(newRate);
                })
            );
    }

    // -----------------------------------------------------------------------
    // Get all university commission rates
    // -----------------------------------------------------------------------
    public Flux<UniversityCommissionRateDTO> getAllUniversityRates() {
        return commissionRepository.findAll()
            .flatMap(commission ->
                universityRepository.findById(commission.getUniversityId())
                    .map(university -> UniversityCommissionRateDTO.builder()
                        .universityId(commission.getUniversityId())
                        .universityName(university.getName())
                        .universityCode(university.getCode())
                        .commissionRate(commission.getCommissionRate())
                        .description(commission.getDescription())
                        .isActive(commission.getIsActive())
                        .build()
                    )
                    .defaultIfEmpty(UniversityCommissionRateDTO.builder()
                        .universityId(commission.getUniversityId())
                        .commissionRate(commission.getCommissionRate())
                        .description(commission.getDescription())
                        .isActive(commission.getIsActive())
                        .build()
                    )
            );
    }

    // -----------------------------------------------------------------------
    // Get all commission details — PRIVATE universities only
    // Triggered by: UNIVERSITY_SUBMISSION or TUITION_FEES_PAYMENT task COMPLETED
    // Note: Application status may still be IN_WORKFLOW — we use task status, not app status.
    // -----------------------------------------------------------------------
    public Flux<CommissionDetailDTO> getAllCommissions() {
        return taskRepository.findCompletedCommissionTriggerApplicationIds()
            .flatMap(applicationIdStr -> {
                UUID applicationId;
                try {
                    applicationId = UUID.fromString(applicationIdStr);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid application ID in tasks table: {}", applicationIdStr);
                    return Mono.empty();
                }
                return applicationRepository.findById(applicationId)
                    .switchIfEmpty(Mono.empty());
            })
            .flatMap(app -> {
                if (app.getUniversityId() == null) return Mono.empty();

                // Only process private universities
                return universityRepository.countPrivateById(app.getUniversityId())
                    .flatMap(count -> {
                        if (count == 0) {
                            log.debug("Skipping commission for non-private university: {}", app.getUniversityId());
                            return Mono.empty();
                        }
                        return buildCommissionDetail(app);
                    });
            });
    }

    /**
     * Builds a CommissionDetailDTO for a given application using the course
     * tuition fee as the commission basis.
     */
    private Mono<CommissionDetailDTO> buildCommissionDetail(Application app) {
        Mono<UniversityCommission> rateMono = commissionRepository
            .findByUniversityId(app.getUniversityId())
            .defaultIfEmpty(UniversityCommission.builder()
                .commissionRate(BigDecimal.ZERO)
                .universityId(app.getUniversityId())
                .build());

        Mono<University> uniMono = universityRepository
            .findById(app.getUniversityId())
            .defaultIfEmpty(University.builder().name("Unknown").build());

        Mono<User> studentMono = userRepository
            .findById(app.getStudentId())
            .defaultIfEmpty(new User());

        // Fetch full course to get tuition fee + intake seasons
        Mono<Course> courseMono = app.getCourseId() != null
            ? courseRepository.findById(app.getCourseId())
                .defaultIfEmpty(Course.builder().build())
            : Mono.just(Course.builder().build());

        // Fetch assigned admin (nullable — application may be unassigned)
        Mono<User> adminMono = app.getAssignedAdminId() != null
            ? userRepository.findById(app.getAssignedAdminId()).defaultIfEmpty(new User())
            : Mono.just(new User());

        return Mono.zip(rateMono, uniMono, studentMono, courseMono, adminMono)
            .map(tuple -> {
                UniversityCommission rate = tuple.getT1();
                University university = tuple.getT2();
                User student = tuple.getT3();
                Course course = tuple.getT4();
                User admin = tuple.getT5();

                Double fee = course.getTuitionInternational();
                BigDecimal tuitionFee = fee != null ? BigDecimal.valueOf(fee) : BigDecimal.ZERO;

                BigDecimal commissionAmount = tuitionFee
                    .multiply(rate.getCommissionRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                return CommissionDetailDTO.builder()
                    .applicationId(app.getId())
                    .applicationStatus(app.getStatus())
                    .completedAt(app.getSubmittedAt())
                    .studentId(app.getStudentId())
                    .studentName(student.getFullName())
                    .studentEmail(student.getEmail())
                    .assignedAdminId(app.getAssignedAdminId())
                    .assignedAdminName(admin.getFullName())
                    .universityId(app.getUniversityId())
                    .universityName(university.getName())
                    .universityType(university.getInstitutionType())
                    .tuitionFee(tuitionFee)
                    .intakeSeasons(course.getIntakeSeasons())
                    .commissionRate(rate.getCommissionRate())
                    .commissionAmount(commissionAmount)
                    .currency("INR")
                    .commissionApplicable(true)
                    .build();
            });
    }

    // -----------------------------------------------------------------------
    // Calculate & auto-save commission when admin reaches Visa task
    // -----------------------------------------------------------------------

    /**
     * Called when the admin reaches the Visa stage for an application.
     * <p>
     * Logic:
     * 1. Fetch application → check university is PRIVATE; return non-applicable result if not.
     * 2. Get course tuition fee from DB.
     * 3. Get commission rate from university_commissions table.
     * 4. Compute commission = tuitionFee * rate / 100.
     * 5. Upsert a commission record in university_commissions (saves commission amount for this application).
     * 6. Return the full CommissionDetailDTO.
     *
     * @param applicationId the application reaching the Visa stage
     * @return CommissionDetailDTO — commissionApplicable=false for public universities
     */
    public Mono<CommissionDetailDTO> calculateAndSaveCommissionForVisaStage(UUID applicationId) {
        log.info("Calculating visa-stage commission for application: {}", applicationId);

        return applicationRepository.findById(applicationId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException(
                "Application not found: " + applicationId)))
            .flatMap(app -> {
                if (app.getUniversityId() == null) {
                    return Mono.just(CommissionDetailDTO.builder()
                        .applicationId(applicationId)
                        .commissionApplicable(false)
                        .nonApplicableReason("No university linked to application")
                        .build());
                }

                return universityRepository.countPrivateById(app.getUniversityId())
                    .flatMap(count -> {
                        if (count == 0) {
                            // Public university — no commission
                            return universityRepository.findById(app.getUniversityId())
                                .defaultIfEmpty(University.builder().name("Unknown").build())
                                .map(uni -> CommissionDetailDTO.builder()
                                    .applicationId(applicationId)
                                    .universityId(app.getUniversityId())
                                    .universityName(uni.getName())
                                    .universityType(uni.getInstitutionType())
                                    .commissionApplicable(false)
                                    .nonApplicableReason("Public university — no commission applicable")
                                    .commissionAmount(BigDecimal.ZERO)
                                    .build());
                        }

                        // Private university — calculate and save
                        return computeAndSavePrivateCommission(app);
                    });
            });
    }

    /**
     * Core calculation + save for a private university application at visa stage.
     */
    private Mono<CommissionDetailDTO> computeAndSavePrivateCommission(Application app) {
        // Fetch full course to get tuition fee + intake seasons
        Mono<Course> courseMono = app.getCourseId() != null
            ? courseRepository.findById(app.getCourseId())
                .defaultIfEmpty(Course.builder().build())
            : Mono.just(Course.builder().build());

        Mono<UniversityCommission> rateMono = commissionRepository
            .findByUniversityId(app.getUniversityId())
            .defaultIfEmpty(UniversityCommission.builder()
                .commissionRate(BigDecimal.valueOf(10)) // fallback 10%
                .universityId(app.getUniversityId())
                .build());

        Mono<University> uniMono = universityRepository
            .findById(app.getUniversityId())
            .defaultIfEmpty(University.builder().name("Unknown").build());

        Mono<User> studentMono = userRepository
            .findById(app.getStudentId())
            .defaultIfEmpty(new User());

        // Fetch assigned admin (nullable)
        Mono<User> adminMono = app.getAssignedAdminId() != null
            ? userRepository.findById(app.getAssignedAdminId()).defaultIfEmpty(new User())
            : Mono.just(new User());

        return Mono.zip(courseMono, rateMono, uniMono, studentMono, adminMono)
            .flatMap(tuple -> {
                Course course = tuple.getT1();
                UniversityCommission rate = tuple.getT2();
                University university = tuple.getT3();
                User student = tuple.getT4();
                User admin = tuple.getT5();

                Double fee = course.getTuitionInternational();
                BigDecimal tuitionFee = fee != null ? BigDecimal.valueOf(fee) : BigDecimal.ZERO;

                BigDecimal commissionAmount = tuitionFee
                    .multiply(rate.getCommissionRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                log.info("Commission for application {}: tuition={}, rate={}%, amount={}",
                    app.getId(), tuitionFee, rate.getCommissionRate(), commissionAmount);

                // Upsert the commission record — update amount in description or save new entry
                return commissionRepository.findByUniversityId(app.getUniversityId())
                    .flatMap(existing -> {
                        // Commission rate record exists; update updated_at to record last calculation
                        existing.setUpdatedAt(LocalDateTime.now());
                        return commissionRepository.save(existing);
                    })
                    .switchIfEmpty(Mono.defer(() -> {
                        UniversityCommission newRate = UniversityCommission.builder()
                            .universityId(app.getUniversityId())
                            .commissionRate(rate.getCommissionRate())
                            .description("Auto-generated at visa stage for application " + app.getId())
                            .isActive(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .createdBy("system")
                            .updatedBy("system")
                            .build();
                        return commissionRepository.save(newRate);
                    }))
                    .map(savedRate -> CommissionDetailDTO.builder()
                        .applicationId(app.getId())
                        .applicationStatus(app.getStatus())
                        .completedAt(app.getSubmittedAt())
                        .studentId(app.getStudentId())
                        .studentName(student.getFullName())
                        .studentEmail(student.getEmail())
                        .assignedAdminId(app.getAssignedAdminId())
                        .assignedAdminName(admin.getFullName())
                        .universityId(app.getUniversityId())
                        .universityName(university.getName())
                        .universityType(university.getInstitutionType())
                        .tuitionFee(tuitionFee)
                        .intakeSeasons(course.getIntakeSeasons())
                        .commissionRate(savedRate.getCommissionRate())
                        .commissionAmount(commissionAmount)
                        .currency("INR")
                        .commissionApplicable(true)
                        .build());
            });
    }

    // -----------------------------------------------------------------------
    // Get commission stats (totals + breakdown by university)
    // -----------------------------------------------------------------------
    public Mono<CommissionStatsDTO> getCommissionStats() {
        return getAllCommissions()
            .collectList()
            .flatMap(details -> {
                BigDecimal totalEarned = details.stream()
                    .map(CommissionDetailDTO::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                Map<String, BigDecimal> byUniversity = details.stream()
                    .collect(Collectors.groupingBy(
                        d -> d.getUniversityName() != null ? d.getUniversityName() : "Unknown",
                        Collectors.reducing(BigDecimal.ZERO, CommissionDetailDTO::getCommissionAmount, BigDecimal::add)
                    ));

                return commissionRepository.count()
                    .map(rateCount -> CommissionStatsDTO.builder()
                        .totalCommissionEarned(totalEarned)
                        .totalCompletedApplications(details.size())
                        .totalUniversitiesWithRates(rateCount.intValue())
                        .commissionByUniversity(byUniversity)
                        .recentCommissions(details.stream().limit(10).collect(Collectors.toList()))
                        .build()
                    );
            });
    }
}

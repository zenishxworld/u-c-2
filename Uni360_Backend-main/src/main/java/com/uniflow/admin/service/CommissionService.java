package com.uniflow.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.admin.dto.commission.CommissionExportResponseDTO;
import com.uniflow.admin.dto.commission.CommissionListResponseDTO;
import com.uniflow.admin.dto.commission.CommissionStatsDTO;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.university.repository.UniversityRepository;
import io.r2dbc.postgresql.codec.Json;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * CommissionService - Business Logic for Admin Commission Management
 *
 * <p>This service handles commission-related operations for admin users, including
 * statistics calculation, commission listing, and export functionality. It integrates
 * with existing university and application data to provide comprehensive commission analytics.
 *
 * <p>Key Features:
 * - Commission statistics and analytics
 * - Paginated commission listings with filters
 * - Commission data export functionality
 * - Integration with existing university and application entities
 * - User context-aware data access
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionService {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final ApplicationRepository applicationRepository;
    private final UniversityRepository universityRepository;

    /**
     * Get commission statistics for admin dashboard
     */
    public Mono<CommissionStatsDTO> getCommissionStats(
        UserJwtDto user,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        log.info(
            "Getting commission stats for user: {} from {} to {}",
            user.getUsername(),
            fromDate,
            toDate
        );

        // Set default date range if not provided
        LocalDate effectiveFromDate = fromDate != null
            ? fromDate
            : LocalDate.now().withDayOfYear(1);
        LocalDate effectiveToDate = toDate != null ? toDate : LocalDate.now();

        return calculateCommissionStats(
            user,
            effectiveFromDate,
            effectiveToDate
        );
    }

    /**
     * Get paginated commission list with filtering
     */
    public Mono<CommissionListResponseDTO> getCommissionList(
        UserJwtDto user,
        int page,
        int size,
        String sortBy,
        String sortDirection,
        String status,
        String universityId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        log.info(
            "Getting commission list for user: {} - page: {}, size: {}",
            user.getUsername(),
            page,
            size
        );

        Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(
                "DESC".equalsIgnoreCase(sortDirection)
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC,
                sortBy != null ? sortBy : "submittedAt"
            )
        );

        return buildCommissionList(
            user,
            pageable,
            status,
            universityId,
            fromDate,
            toDate
        );
    }

    /**
     * Export commission data
     */
    public Mono<CommissionExportResponseDTO> exportCommissions(
        UserJwtDto user,
        String format,
        String status,
        String universityId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        log.info(
            "Exporting commissions for user: {} in format: {}",
            user.getUsername(),
            format
        );

        return generateCommissionExport(
            user,
            format,
            status,
            universityId,
            fromDate,
            toDate
        );
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    private Mono<CommissionStatsDTO> calculateCommissionStats(
        UserJwtDto user,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        return applicationRepository
            .findAll()
            .filter(app -> app.getIsActive() != null && app.getIsActive())
            .filter(app ->
                isWithinDateRange(app.getSubmittedAt(), fromDate, toDate)
            )
            .filter(app -> hasUserAccess(app, user))
            .collectList()
            .flatMap(applications -> {
                return universityRepository
                    .findAll()
                    .collectList()
                    .map(universities -> {
                        // Calculate stats from applications with commission data
                        BigDecimal totalCommissions = BigDecimal.ZERO;
                        BigDecimal paidCommissions = BigDecimal.ZERO;
                        BigDecimal pendingCommissions = BigDecimal.ZERO;
                        BigDecimal thisMonthCommissions = BigDecimal.ZERO;
                        BigDecimal lastMonthCommissions = BigDecimal.ZERO;

                        LocalDate thisMonth = LocalDate.now().withDayOfMonth(1);
                        LocalDate lastMonth = thisMonth.minusMonths(1);

                        for (var app : applications) {
                            BigDecimal commissionAmount =
                                extractCommissionAmount(app.getData());
                            if (
                                commissionAmount != null &&
                                commissionAmount.compareTo(BigDecimal.ZERO) > 0
                            ) {
                                totalCommissions = totalCommissions.add(
                                    commissionAmount
                                );

                                // Check payment status
                                String paymentStatus = extractPaymentStatus(
                                    app.getData()
                                );
                                if (
                                    "PAID".equals(paymentStatus) ||
                                    "COMPLETED".equals(paymentStatus)
                                ) {
                                    paidCommissions = paidCommissions.add(
                                        commissionAmount
                                    );
                                } else {
                                    pendingCommissions = pendingCommissions.add(
                                        commissionAmount
                                    );
                                }

                                // Monthly breakdown
                                if (app.getSubmittedAt() != null) {
                                    LocalDate submissionDate = app
                                        .getSubmittedAt()
                                        .toLocalDate();
                                    if (!submissionDate.isBefore(thisMonth)) {
                                        thisMonthCommissions =
                                            thisMonthCommissions.add(
                                                commissionAmount
                                            );
                                    } else if (
                                        !submissionDate.isBefore(lastMonth) &&
                                        submissionDate.isBefore(thisMonth)
                                    ) {
                                        lastMonthCommissions =
                                            lastMonthCommissions.add(
                                                commissionAmount
                                            );
                                    }
                                }
                            }
                        }

                        return CommissionStatsDTO.builder()
                            .totalCommissions(totalCommissions)
                            .paidCommissions(paidCommissions)
                            .pendingCommissions(pendingCommissions)
                            .overdueCommissions(BigDecimal.ZERO) // TODO: Implement overdue calculation
                            .thisMonthCommissions(thisMonthCommissions)
                            .lastMonthCommissions(lastMonthCommissions)
                            .totalApplications((long) applications.size())
                            .commissionsThisYear(totalCommissions) // Simplified for now
                            .averageCommissionRate(
                                calculateAverageCommissionRate(applications)
                            )
                            .currency("INR")
                            .fromDate(fromDate)
                            .toDate(toDate)
                            .byPeriod(
                                generatePeriodBreakdown(
                                    applications,
                                    fromDate,
                                    toDate
                                )
                            )
                            .topAgents(generateTopAgents(applications))
                            .topUniversities(
                                generateTopUniversities(
                                    applications,
                                    universities
                                )
                            )
                            .build();
                    });
            });
    }

    private Mono<CommissionListResponseDTO> buildCommissionList(
        UserJwtDto user,
        Pageable pageable,
        String status,
        String universityId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        return applicationRepository
            .findAll()
            .filter(app -> app.getIsActive() != null && app.getIsActive())
            .filter(app -> hasUserAccess(app, user))
            .filter(app ->
                matchesFilters(app, status, universityId, fromDate, toDate)
            )
            .sort((a1, a2) -> {
                // Simple sorting by submission date for now
                if (
                    a1.getSubmittedAt() == null && a2.getSubmittedAt() == null
                ) return 0;
                if (a1.getSubmittedAt() == null) return 1;
                if (a2.getSubmittedAt() == null) return -1;
                return a2.getSubmittedAt().compareTo(a1.getSubmittedAt());
            })
            .collectList()
            .flatMap(allApplications -> {
                long totalElements = allApplications.size();
                int totalPages = (int) Math.ceil(
                    (double) totalElements / pageable.getPageSize()
                );
                int start = (int) pageable.getOffset();
                int end = Math.min(
                    start + pageable.getPageSize(),
                    allApplications.size()
                );

                List<
                    CommissionListResponseDTO.CommissionDetailDTO
                > pageApplications = allApplications
                    .subList(start, end)
                    .stream()
                    .map(this::convertToCommissionDetail)
                    .toList();

                BigDecimal totalAmount = pageApplications
                    .stream()
                    .map(
                        CommissionListResponseDTO
                            .CommissionDetailDTO::getCommissionAmount
                    )
                    .filter(amount -> amount != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                return Mono.just(
                    CommissionListResponseDTO.builder()
                        .commissions(pageApplications)
                        .totalElements(totalElements)
                        .totalPages(totalPages)
                        .currentPage(pageable.getPageNumber())
                        .pageSize(pageable.getPageSize())
                        .hasNext(pageable.getPageNumber() < totalPages - 1)
                        .hasPrevious(pageable.getPageNumber() > 0)
                        .totalAmount(totalAmount)
                        .currency("INR")
                        .build()
                );
            });
    }

    private Mono<CommissionExportResponseDTO> generateCommissionExport(
        UserJwtDto user,
        String format,
        String status,
        String universityId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        // For now, return a mock response indicating export is ready
        // In a real implementation, this would trigger an async export job
        String fileName = String.format(
            "commission-report-%s.%s",
            LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
            format.toLowerCase()
        );

        return Mono.just(
            CommissionExportResponseDTO.builder()
                .downloadUrl(
                    "https://s3.amazonaws.com/uniflow-exports/" + fileName
                )
                .fileName(fileName)
                .fileSize(1024L * 50) // Mock 50KB file
                .exportFormat(format.toUpperCase())
                .jobId(UUID.randomUUID().toString())
                .status("COMPLETED")
                .recordCount(100L) // Mock record count
                .exportedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .exportedBy(user.getUsername())
                .filters(
                    buildFiltersString(status, universityId, fromDate, toDate)
                )
                .message("Export completed successfully")
                .estimatedCompletionTime(0)
                .progress(100)
                .build()
        );
    }

    // Helper methods for data extraction and processing

    private boolean isWithinDateRange(
        LocalDateTime dateTime,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        if (dateTime == null) return false;
        LocalDate date = dateTime.toLocalDate();
        return !date.isBefore(fromDate) && !date.isAfter(toDate);
    }

    private boolean hasUserAccess(
        com.uniflow.application.entity.Application app,
        UserJwtDto user
    ) {
        // Students see only their applications
        if ("STUDENT".equals(user.getUserType())) {
            return (
                app.getStudentId() != null &&
                app.getStudentId().equals(user.getId())
            );
        }

        // Admins see applications assigned to them
        if ("ADMIN".equals(user.getUserType())) {
            return (
                app.getAssignedAdminId() != null &&
                app.getAssignedAdminId().equals(user.getId())
            );
        }

        // Super admins see all
        return "SUPER_ADMIN".equals(user.getUserType());
    }

    private boolean matchesFilters(
        com.uniflow.application.entity.Application app,
        String status,
        String universityId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        if (status != null && !status.equals(app.getStatus())) {
            return false;
        }

        if (
            universityId != null &&
            !universityId.equals(app.getUniversityId().toString())
        ) {
            return false;
        }

        if (fromDate != null || toDate != null) {
            return isWithinDateRange(
                app.getSubmittedAt(),
                fromDate != null ? fromDate : LocalDate.MIN,
                toDate != null ? toDate : LocalDate.MAX
            );
        }

        return true;
    }

    private BigDecimal extractCommissionAmount(Json data) {
        try {
            if (data == null || data.asString() == null) return BigDecimal.ZERO;
            JsonNode jsonNode = objectMapper.readTree(data.asString());
            JsonNode commissionNode = jsonNode.get("commission_amount");
            return commissionNode != null && !commissionNode.isNull()
                ? new BigDecimal(commissionNode.asText())
                : BigDecimal.ZERO;
        } catch (Exception e) {
            log.warn(
                "Error extracting commission amount from application data",
                e
            );
            return BigDecimal.ZERO;
        }
    }

    private String extractPaymentStatus(Json data) {
        try {
            if (data == null || data.asString() == null) return "PENDING";
            JsonNode jsonNode = objectMapper.readTree(data.asString());
            JsonNode statusNode = jsonNode.get("payment_status");
            return statusNode != null && !statusNode.isNull()
                ? statusNode.asText()
                : "PENDING";
        } catch (Exception e) {
            log.warn(
                "Error extracting payment status from application data",
                e
            );
            return "PENDING";
        }
    }

    private BigDecimal calculateAverageCommissionRate(
        List<com.uniflow.application.entity.Application> applications
    ) {
        BigDecimal totalRate = BigDecimal.ZERO;
        int count = 0;

        for (var app : applications) {
            BigDecimal rate = extractCommissionRate(app.getData());
            if (rate != null && rate.compareTo(BigDecimal.ZERO) > 0) {
                totalRate = totalRate.add(rate);
                count++;
            }
        }

        return count > 0
            ? totalRate.divide(
                BigDecimal.valueOf(count),
                2,
                RoundingMode.HALF_UP
            )
            : BigDecimal.ZERO;
    }

    private BigDecimal extractCommissionRate(Json data) {
        try {
            if (data == null || data.asString() == null) return BigDecimal.ZERO;
            JsonNode jsonNode = objectMapper.readTree(data.asString());
            JsonNode rateNode = jsonNode.get("commission_rate");
            return rateNode != null && !rateNode.isNull()
                ? new BigDecimal(rateNode.asText())
                : BigDecimal.valueOf(10.0); // Default 10% commission rate
        } catch (Exception e) {
            log.warn(
                "Error extracting commission rate from application data",
                e
            );
            return BigDecimal.valueOf(10.0);
        }
    }

    private List<
        CommissionStatsDTO.PeriodCommissionDTO
    > generatePeriodBreakdown(
        List<com.uniflow.application.entity.Application> applications,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        // Simplified monthly breakdown for now
        List<CommissionStatsDTO.PeriodCommissionDTO> periods =
            new ArrayList<>();
        LocalDate current = fromDate.withDayOfMonth(1);

        while (!current.isAfter(toDate)) {
            String periodStr = current.format(
                DateTimeFormatter.ofPattern("yyyy-MM")
            );
            LocalDate nextMonth = current.plusMonths(1);

            final LocalDate currentPeriod = current;
            final LocalDate nextPeriod = nextMonth;

            BigDecimal periodAmount = applications
                .stream()
                .filter(app -> app.getSubmittedAt() != null)
                .filter(app -> {
                    LocalDate appDate = app.getSubmittedAt().toLocalDate();
                    return (
                        !appDate.isBefore(currentPeriod) &&
                        appDate.isBefore(nextPeriod)
                    );
                })
                .map(app -> extractCommissionAmount(app.getData()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            long appCount = applications
                .stream()
                .filter(app -> app.getSubmittedAt() != null)
                .filter(app -> {
                    LocalDate appDate = app.getSubmittedAt().toLocalDate();
                    return (
                        !appDate.isBefore(currentPeriod) &&
                        appDate.isBefore(nextPeriod)
                    );
                })
                .count();

            periods.add(
                CommissionStatsDTO.PeriodCommissionDTO.builder()
                    .period(periodStr)
                    .amount(periodAmount)
                    .applicationCount(appCount)
                    .periodType("MONTHLY")
                    .build()
            );

            current = nextMonth;
        }

        return periods;
    }

    private List<CommissionStatsDTO.AgentCommissionDTO> generateTopAgents(
        List<com.uniflow.application.entity.Application> applications
    ) {
        // Simplified implementation - group by assigned admin ID
        return applications
            .stream()
            .filter(app -> app.getAssignedAdminId() != null)
            .collect(
                java.util.stream.Collectors.groupingBy(
                    app -> app.getAssignedAdminId(),
                    java.util.stream.Collectors.toList()
                )
            )
            .entrySet()
            .stream()
            .map(entry -> {
                Long adminId = entry.getKey();
                List<com.uniflow.application.entity.Application> adminApps =
                    entry.getValue();

                BigDecimal totalCommission = adminApps
                    .stream()
                    .map(app -> extractCommissionAmount(app.getData()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                return CommissionStatsDTO.AgentCommissionDTO.builder()
                    .adminId(adminId.toString())
                    .name("Admin " + adminId) // TODO: Get actual admin name
                    .email("admin" + adminId + "@uniflow.com") // TODO: Get actual email
                    .totalCommission(totalCommission)
                    .applicationCount((long) adminApps.size())
                    .averageCommissionPerApp(
                        adminApps.size() > 0
                            ? totalCommission.divide(
                                BigDecimal.valueOf(adminApps.size()),
                                2,
                                RoundingMode.HALF_UP
                            )
                            : BigDecimal.ZERO
                    )
                    .rank(1) // TODO: Calculate actual rank
                    .build();
            })
            .sorted((a, b) ->
                b.getTotalCommission().compareTo(a.getTotalCommission())
            )
            .limit(10)
            .toList();
    }

    private List<
        CommissionStatsDTO.UniversityCommissionSummaryDTO
    > generateTopUniversities(
        List<com.uniflow.application.entity.Application> applications,
        List<com.uniflow.university.entity.University> universities
    ) {
        return applications
            .stream()
            .filter(app -> app.getUniversityId() != null)
            .collect(
                java.util.stream.Collectors.groupingBy(
                    app -> app.getUniversityId(),
                    java.util.stream.Collectors.toList()
                )
            )
            .entrySet()
            .stream()
            .map(entry -> {
                UUID universityId = entry.getKey();
                List<com.uniflow.application.entity.Application> uniApps =
                    entry.getValue();

                com.uniflow.university.entity.University university =
                    universities
                        .stream()
                        .filter(u -> u.getId().equals(universityId))
                        .findFirst()
                        .orElse(null);

                BigDecimal totalCommission = uniApps
                    .stream()
                    .map(app -> extractCommissionAmount(app.getData()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                return CommissionStatsDTO.UniversityCommissionSummaryDTO.builder()
                    .universityId(universityId.toString())
                    .universityName(
                        university != null
                            ? university.getName()
                            : "Unknown University"
                    )
                    .country(
                        university != null ? university.getCountry() : "Unknown"
                    )
                    .totalCommission(totalCommission)
                    .applicationCount((long) uniApps.size())
                    .commissionRate(BigDecimal.valueOf(5.0)) // Default rate
                    .averageCommissionPerApp(
                        uniApps.size() > 0
                            ? totalCommission.divide(
                                BigDecimal.valueOf(uniApps.size()),
                                2,
                                RoundingMode.HALF_UP
                            )
                            : BigDecimal.ZERO
                    )
                    .build();
            })
            .sorted((a, b) ->
                b.getTotalCommission().compareTo(a.getTotalCommission())
            )
            .limit(10)
            .toList();
    }

    private CommissionListResponseDTO.CommissionDetailDTO convertToCommissionDetail(
        com.uniflow.application.entity.Application app
    ) {
        BigDecimal commissionAmount = extractCommissionAmount(app.getData());
        BigDecimal commissionRate = extractCommissionRate(app.getData());
        String paymentStatus = extractPaymentStatus(app.getData());

        return CommissionListResponseDTO.CommissionDetailDTO.builder()
            .applicationId(app.getId())
            .applicationReference(app.getReferenceNumber())
            .studentId(app.getStudentId())
            .studentName(null) // Will be populated from user service
            .studentEmail(null) // Will be populated from user service
            .universityId(app.getUniversityId())
            .universityName(null) // Will be populated from university service
            .universityCountry(null) // Will be populated from university service
            .courseId(app.getCourseId())
            .courseName(null) // Will be populated from course service
            .programLevel(app.getProgramLevel())
            .commissionAmount(commissionAmount)
            .commissionRate(commissionRate)
            .applicationFee(
                app.getApplicationFeeAmount() != null
                    ? app.getApplicationFeeAmount()
                    : BigDecimal.ZERO
            )
            .serviceFee(
                app.getServiceFeeAmount() != null
                    ? BigDecimal.valueOf(app.getServiceFeeAmount())
                    : BigDecimal.ZERO
            )
            .currency(
                app.getApplicationFeeCurrency() != null
                    ? app.getApplicationFeeCurrency()
                    : "INR"
            )
            .commissionStatus(
                "COMPLETED".equals(app.getStatus()) ? "APPROVED" : "PENDING"
            )
            .paymentStatus(paymentStatus)
            .assignedAdminId(app.getAssignedAdminId())
            .assignedAdminName(
                app.getAssignedAdminId() != null
                    ? "Admin " + app.getAssignedAdminId()
                    : null
            )
            .applicationStatus(app.getStatus())
            .workflowStage(app.getWorkflowStage())
            .submittedAt(app.getSubmittedAt())
            .approvedAt(null) // TODO: Extract from data
            .paidAt(null) // TODO: Extract from data
            .dueDate(app.getDeadline())
            .isOverdue(
                app.getDeadline() != null &&
                    app.getDeadline().isBefore(LocalDateTime.now())
            )
            .daysSinceSubmission(
                app.getSubmittedAt() != null
                    ? java.time.Duration.between(
                        app.getSubmittedAt(),
                        LocalDateTime.now()
                    ).toDays()
                    : 0L
            )
            .notes(null) // TODO: Extract from data
            .territory(app.getTerritory())
            .region(app.getRegion())
            .intakeTerm(app.getIntakeTerm())
            .intakeYear(
                app.getTargetYear() != null
                    ? app.getTargetYear().toString()
                    : null
            )
            .priority(app.getPriority())
            .build();
    }

    private String buildFiltersString(
        String status,
        String universityId,
        LocalDate fromDate,
        LocalDate toDate
    ) {
        StringBuilder filters = new StringBuilder("{");

        if (status != null) {
            filters.append("\"status\":\"").append(status).append("\",");
        }
        if (universityId != null) {
            filters
                .append("\"universityId\":\"")
                .append(universityId)
                .append("\",");
        }
        if (fromDate != null) {
            filters.append("\"fromDate\":\"").append(fromDate).append("\",");
        }
        if (toDate != null) {
            filters.append("\"toDate\":\"").append(toDate).append("\",");
        }

        if (filters.length() > 1) {
            filters.setLength(filters.length() - 1); // Remove trailing comma
        }
        filters.append("}");

        return filters.toString();
    }
}

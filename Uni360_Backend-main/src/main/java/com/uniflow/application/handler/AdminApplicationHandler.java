package com.uniflow.application.handler;

import com.uniflow.application.dto.AdminApplicationDTO;
import com.uniflow.application.repository.query.ApplicationQueries;
import com.uniflow.auth.util.CommonHelperUtils;
import com.uniflow.common.dto.ApiResponse;
import io.r2dbc.spi.Row;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminApplicationHandler {

    private final R2dbcEntityTemplate r2dbcTemplate;
    private final CommonHelperUtils commonHelperUtils;


    // ─────────────────────────────────────────────────────────────────────────
    // Endpoint
    // ─────────────────────────────────────────────────────────────────────────

    public Mono<ServerResponse> getAdminApplications(ServerRequest request) {
        return commonHelperUtils.getUserIdFromServerRequest(request)
            .flatMap(userId -> {
                String  status        = request.queryParam("status").orElse(null);
                String  workflowStage = request.queryParam("workflowStage").orElse(null);
                String  countryCode   = request.queryParam("countryCode").orElse(null);
                String  degreeLevel   = request.queryParam("degreeLevel").orElse(null);
                Long    adminId       = userId;   // always scoped to the calling admin
                Boolean isUrgent      = request.queryParam("isUrgent")
                    .map(Boolean::parseBoolean).orElse(null);
                String sortBy = request.queryParam("sortBy").orElse("submittedAt");
                int page      = request.queryParam("page").map(Integer::parseInt).orElse(0);
                int size      = request.queryParam("size").map(Integer::parseInt).orElse(10);

                log.info("Admin {} fetching applications - page={}", userId, page);

                // Run all 3 DB queries in parallel
                Mono<java.util.List<AdminApplicationDTO>> appsMono =
                    fetchApplications(status, workflowStage, countryCode, degreeLevel,
                        adminId, isUrgent, sortBy, page, size);

                Mono<Long> countMono =
                    countApplications(status, workflowStage, countryCode, degreeLevel,
                        adminId, isUrgent);

                Mono<Map<String, Object>> stageMono =
                    fetchStageSummary(status, workflowStage, countryCode, degreeLevel,
                        adminId, isUrgent);

                return Mono.zip(appsMono, countMono, stageMono)
                    .map(t -> buildResponse(t.getT1(), page, size, t.getT2(), t.getT3()));
            })
            .flatMap(response -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.success(response)))
            .onErrorResume(error -> {
                log.error("Error fetching admin applications", error);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error(
                        "Failed to fetch applications: " + error.getMessage()));
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DB helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Mono<java.util.List<AdminApplicationDTO>> fetchApplications(
        String status, String workflowStage, String countryCode, String degreeLevel,
        Long adminId, Boolean isUrgent, String sortBy, int page, int size) {

        return r2dbcTemplate.getDatabaseClient()
            .sql(ApplicationQueries.FIND_ADMIN_APPLICATIONS)
            .bind("status",                status        != null ? status        : "")
            .bind("statusWildcard",        status        == null)
            .bind("workflowStage",         workflowStage != null ? workflowStage : "")
            .bind("workflowStageWildcard", workflowStage == null)
            .bind("countryCode",           countryCode   != null ? countryCode   : "")
            .bind("countryCodeWildcard",   countryCode   == null)
            .bind("degreeLevel",           degreeLevel   != null ? degreeLevel   : "")
            .bind("degreeLevelWildcard",   degreeLevel   == null)
            .bind("assignedAdminId",       adminId)
            .bind("isUrgent",              isUrgent != null ? isUrgent : false)
            .bind("isUrgentWildcard",      isUrgent == null)
            .bind("sortBy",                sortBy)
            .bind("size",                  size)
            .bind("offset",                page * size)
            .map(this::mapRowToDTO)
            .all()
            .collectList();
    }

    private Mono<Long> countApplications(String status, String workflowStage, String countryCode,
                                         String degreeLevel, Long adminId, Boolean isUrgent) {
        return r2dbcTemplate.getDatabaseClient()
            .sql(ApplicationQueries.COUNT_ADMIN_APPLICATIONS)
            .bind("status",                status        != null ? status        : "")
            .bind("statusWildcard",        status        == null)
            .bind("workflowStage",         workflowStage != null ? workflowStage : "")
            .bind("workflowStageWildcard", workflowStage == null)
            .bind("countryCode",           countryCode   != null ? countryCode   : "")
            .bind("countryCodeWildcard",   countryCode   == null)
            .bind("degreeLevel",           degreeLevel   != null ? degreeLevel   : "")
            .bind("degreeLevelWildcard",   degreeLevel   == null)
            .bind("assignedAdminId",       adminId)
            .bind("isUrgent",              isUrgent != null ? isUrgent : false)
            .bind("isUrgentWildcard",      isUrgent == null)
            .map(row -> row.get(0, Long.class))
            .first()
            .defaultIfEmpty(0L);
    }

    /**
     * Runs a single-row query that returns 3 bucketed counts.
     * Result: { total, claimPending, underReview, completed }
     */
    private Mono<Map<String, Object>> fetchStageSummary(String status, String workflowStage,
        String countryCode, String degreeLevel, Long adminId, Boolean isUrgent) {

        return r2dbcTemplate.getDatabaseClient()
            .sql(ApplicationQueries.STAGE_SUMMARY_ADMIN_APPLICATIONS)
            .bind("status",                status        != null ? status        : "")
            .bind("statusWildcard",        status        == null)
            .bind("workflowStage",         workflowStage != null ? workflowStage : "")
            .bind("workflowStageWildcard", workflowStage == null)
            .bind("countryCode",           countryCode   != null ? countryCode   : "")
            .bind("countryCodeWildcard",   countryCode   == null)
            .bind("degreeLevel",           degreeLevel   != null ? degreeLevel   : "")
            .bind("degreeLevelWildcard",   degreeLevel   == null)
            .bind("assignedAdminId",       adminId)
            .bind("isUrgent",              isUrgent != null ? isUrgent : false)
            .bind("isUrgentWildcard",      isUrgent == null)
            .map((row, meta) -> {
                long claimPending = toLong(row.get("claim_pending", Long.class));
                long underReview  = toLong(row.get("under_review",  Long.class));
                long completed    = toLong(row.get("completed",     Long.class));

                Map<String, Object> summary = new LinkedHashMap<>();
                summary.put("total",        claimPending + underReview + completed);
                summary.put("claimPending", claimPending);
                summary.put("underReview",  underReview);
                summary.put("completed",    completed);
                return summary;
            })
            .first()
            .defaultIfEmpty(Map.of("total", 0L, "claimPending", 0L,
                                   "underReview", 0L, "completed", 0L));
    }

    private static long toLong(Long value) {
        return value != null ? value : 0L;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Row mapper
    // ─────────────────────────────────────────────────────────────────────────

    private AdminApplicationDTO mapRowToDTO(Row row, io.r2dbc.spi.RowMetadata metadata) {
        String intakeTerm = row.get("intake", String.class);

        return AdminApplicationDTO.builder()
            .id(row.get("id", String.class))
            .referenceNumber(row.get("reference_number", String.class))
            .status(row.get("status", String.class))
            .workflowStage(row.get("workflow_stage", String.class))
            .priority(row.get("priority", String.class))
            .universityName(row.get("university_name", String.class))
            .programName(row.get("program_name", String.class))
            .countryCode(row.get("country_code", String.class))
            .degreeLevel(row.get("degree_level", String.class))
            .intakeTerm(intakeTerm != null ? intakeTerm + "_2026" : "WINTER_2026")
            .submittedAt(row.get("submitted_at", LocalDateTime.class))
            .isUrgent(row.get("is_urgent", Boolean.class))
            .completionPercentage(row.get("completion_percentage", Integer.class))
            .student(AdminApplicationDTO.StudentInfo.builder()
                .id(row.get("student_id", Long.class))
                .name(row.get("student_name", String.class))
                .email(row.get("student_email", String.class))
                .build())
            .assignedAdmin(AdminApplicationDTO.AssignedAdminInfo.builder()
                .id(row.get("assigned_admin_id", Long.class))
                .name(row.get("admin_name", String.class))
                .email(row.get("admin_email", String.class))
                .build())
            .workflowProgress(AdminApplicationDTO.WorkflowProgressInfo.builder()
                .currentStage(row.get("workflow_stage", String.class))
                .estimatedCompletion(row.get("deadline", LocalDateTime.class))
                .pendingTasks(java.util.Optional.ofNullable(
                    row.get("pending_task_count",   Long.class)).orElse(0L).intValue())
                .completedTasks(java.util.Optional.ofNullable(
                    row.get("completed_task_count", Long.class)).orElse(0L).intValue())
                .totalTasks(java.util.Optional.ofNullable(
                    row.get("total_task_count",     Long.class)).orElse(0L).intValue())
                .requiresAdminAction(java.util.Optional.ofNullable(
                    row.get("pending_task_count",   Long.class)).orElse(0L) > 0)
                .build())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response builder
    // ─────────────────────────────────────────────────────────────────────────

    private Map<String, Object> buildResponse(java.util.List<AdminApplicationDTO> applications,
                                              int page, int size, long total,
                                              Map<String, Object> stageSummary) {
        Map<String, Object> response = new LinkedHashMap<>();

        // Pagination
        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page",        page);
        pagination.put("size",        size);
        pagination.put("total",       total);
        pagination.put("totalPages",  (int) Math.ceil((double) total / size));
        pagination.put("hasNext",     (long)(page + 1) * size < total);
        pagination.put("hasPrevious", page > 0);
        response.put("pagination", pagination);

        // Stage breakdown
        response.put("stageSummary", stageSummary);

        // Application list
        response.put("applications", applications);

        return response;
    }
}

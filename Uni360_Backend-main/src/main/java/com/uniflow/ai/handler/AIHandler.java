package com.uniflow.ai.handler;

import com.uniflow.ai.config.N8nProperties;
import com.uniflow.ai.dto.*;
import com.uniflow.ai.exception.AIServiceException;
import com.uniflow.ai.service.N8nService;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class AIHandler {

    private static final Duration HEALTH_TIMEOUT = Duration.ofSeconds(5);

    private final N8nService n8nService;
    private final JwtUtils jwtUtils;
    private final N8nProperties n8nProperties;
    private final WebClient healthClient;

    public AIHandler(
        N8nService n8nService,
        JwtUtils jwtUtils,
        N8nProperties n8nProperties
    ) {
        this.n8nService = n8nService;
        this.jwtUtils = jwtUtils;
        this.n8nProperties = n8nProperties;
        this.healthClient = WebClient.builder()
            .baseUrl(n8nProperties.getBaseUrl())
            .build();
    }

    /**
     * Generate SOP using student's profile data from database.
     * Optional request body can supply overrides for fields not in profile.
     * POST /api/v1/ai/sop/generate
     *
     * Body (all optional):
     * {
     *   "university": "Technical University of Munich",
     *   "program": "MSc Computer Science",
     *   "additional_requirements": "...",
     *   "tone": "PROFESSIONAL",
     *   "word_limit": 500
     * }
     */
    public Mono<ServerResponse> generateSop(ServerRequest request) {
        log.info("🔍 POST /api/v1/ai/sop/generate");

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.info("🔍 Generating SOP for userId: {}", userId)
            )
            .flatMap(userId ->
                readOptionalBody(request).flatMap(overrides ->
                    n8nService.generateSopFromProfile(userId, overrides)
                )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "SOP generated successfully"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Generate LOR using student's profile data from database.
     * Optional request body can supply overrides.
     * POST /api/v1/ai/lor/generate
     *
     * Body (all optional, senior_name recommended):
     * {
     *   "senior_name": "Prof. Dr. Mueller",
     *   "university_name": "Technical University of Munich",
     *   "additional_requirements": "...",
     *   "tone": "PROFESSIONAL",
     *   "word_limit": 500
     * }
     */
    public Mono<ServerResponse> generateLor(ServerRequest request) {
        log.info("🔍 POST /api/v1/ai/lor/generate");

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.info("🔍 Generating LOR for userId: {}", userId)
            )
            .flatMap(userId ->
                readOptionalBody(request).flatMap(overrides -> {
                    // senior_name can also come from query param for backwards compat
                    String seniorName = request
                        .queryParam("seniorName")
                        .orElse(
                            (String) overrides.getOrDefault("senior_name", null)
                        );
                    if (seniorName != null) {
                        overrides.put("senior_name", seniorName);
                    }
                    return n8nService.generateLorFromProfile(userId, overrides);
                })
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "LOR generated successfully"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Generate Cover Letter using student's profile data from database.
     * Optional request body supplies fields not stored in profile.
     * POST /api/v1/ai/cover-letter/generate
     *
     * Body (supply fields not in student profile):
     * {
     *   "university_name": "Technical University of Munich",
     *   "university_location": "Munich, Germany",
     *   "course_name": "MSc Computer Science",
     *   "course_duration": "2 years",
     *   "course_start_date": "01/10/2025",
     *   "tuition_fees": "1500",
     *   "blocked_account_bank": "Expatrio",
     *   "blocked_account_balance": "11208 EUR",
     *   "additional_requirements": "...",
     *   "tone": "PROFESSIONAL",
     *   "word_limit": 500
     * }
     */
    public Mono<ServerResponse> generateCoverLetter(ServerRequest request) {
        log.info("🔍 POST /api/v1/ai/cover-letter/generate");

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.info("🔍 Generating Cover Letter for userId: {}", userId)
            )
            .flatMap(userId ->
                readOptionalBody(request).flatMap(overrides ->
                    n8nService.generateCoverLetterFromProfile(userId, overrides)
                )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Cover letter generated successfully"
                        )
                    )
            )
            .onErrorResume(this::handleError);
    }

    /**
     * AI Health Check - Public endpoint
     * GET /api/v1/ai/health
     * Pings n8n /healthz to verify actual connectivity
     */
    public Mono<ServerResponse> healthCheck(ServerRequest request) {
        log.info("🔍 GET /api/v1/ai/health");

        long start = System.currentTimeMillis();
        String n8nUrl = n8nProperties.getBaseUrl();

        return healthClient
            .get()
            .uri("/healthz")
            .retrieve()
            .bodyToMono(String.class)
            .timeout(HEALTH_TIMEOUT)
            .flatMap(n8nResponse -> {
                long elapsed = System.currentTimeMillis() - start;
                log.info("✅ n8n health OK ({}ms)", elapsed);

                AIHealthStatus status = AIHealthStatus.up(n8nUrl, elapsed);
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(status, "AI service is healthy")
                    );
            })
            .onErrorResume(error -> {
                log.warn("❌ n8n health check failed: {}", error.getMessage());

                AIHealthStatus status = AIHealthStatus.down(
                    n8nUrl,
                    error.getMessage()
                );
                return ServerResponse.status(503)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "[N8N_DOWN] n8n is not reachable at " + n8nUrl
                        )
                    );
            });
    }

    /**
     * Read the request body as a generic Map for override fields.
     * Returns an empty map if body is absent or not parseable (non-fatal).
     */
    @SuppressWarnings("unchecked")
    private Mono<Map<String, Object>> readOptionalBody(ServerRequest request) {
        return request
            .bodyToMono(Map.class)
            .map(body -> (Map<String, Object>) body)
            .defaultIfEmpty(new HashMap<>())
            .onErrorReturn(new HashMap<>());
    }

    /**
     * Extract user ID from JWT token in request
     */
    private Mono<Long> extractUserIdFromRequest(ServerRequest request) {
        return jwtUtils
            .getUserIdFromServerRequest(request)
            .onErrorMap(error -> {
                log.error(
                    "❌ Failed to extract user ID from JWT: {}",
                    error.getMessage()
                );
                return new SecurityException(
                    "Authentication required: Invalid or missing JWT token"
                );
            });
    }

    /**
     * Centralized error handler for AI endpoints
     */
    private Mono<ServerResponse> handleError(Throwable error) {
        log.error("❌ AI Handler error: {}", error.getMessage());

        if (error instanceof AIServiceException aiError) {
            return ServerResponse.status(503)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "[" +
                            aiError.getErrorCode() +
                            "] " +
                            aiError.getMessage()
                    )
                );
        }

        if (error instanceof SecurityException) {
            return ServerResponse.status(401)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "Authentication required: " + error.getMessage()
                    )
                );
        }

        if (error instanceof IllegalArgumentException) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Invalid request: " + error.getMessage())
                );
        }

        return ServerResponse.status(500)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                ApiResponse.error("AI service error: " + error.getMessage())
            );
    }

    // ─── Admin direct-generation handlers (no profile lookup) ────────────────

    /**
     * Admin SOP generation — admin supplies the full SopRequest JSON manually.
     * POST /api/v1/admin/ai/sop/generate
     *
     * Full body required:
     * {
     *   "fullName": "Rahul Sharma",
     *   "nationality": "Indian",
     *   "homeCountry": "India",
     *   "intendedCountry": "Germany",
     *   "university": "Technical University of Munich",
     *   "degreeLevel": "Master's",
     *   "program": "MSc Computer Science",
     *   "fieldOfStudy": "Computer Science",
     *   "institutionName": "Mumbai University",
     *   "graduationYear": "2023",
     *   "motivation": "Passionate about AI and ML research",
     *   "experienceType": "Internship",
     *   "workExperience": "6 months at Infosys as software intern",
     *   "areasOfInterest": "Machine Learning, Data Engineering",
     *   "whyProgram": "TUM offers cutting-edge AI research",
     *   "whyUniversity": "World-class faculty and industry connections",
     *   "shortTermGoal": "Work as ML engineer in Europe",
     *   "longTermGoal": "Start an AI startup in India",
     *   "returnReason": "Contribute to India's tech growth",
     *   "keyStrengths": "Python, Java, problem solving, teamwork"
     * }
     */
    public Mono<ServerResponse> adminGenerateSop(ServerRequest request) {
        log.info("🔍 POST /api/v1/admin/ai/sop/generate (admin direct)");
        return request.bodyToMono(SopRequest.class)
            .flatMap(sopRequest -> {
                log.info("🚀 [ADMIN-SOP] Direct generation for student: {}", sopRequest.getFullName());
                return n8nService.generateSopDirect(sopRequest);
            })
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(response, "SOP generated successfully"))
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Admin LOR generation — admin supplies the full LorRequest JSON manually.
     * POST /api/v1/admin/ai/lor/generate
     *
     * Full body required (keys must match @JsonProperty names exactly):
     * {
     *   "Name of the senior writing LOR": "Prof. Dr. Hans Müller",
     *   "Student Name": "Rahul Sharma",
     *   "University Name": "Technical University of Munich",
     *   "Location": "Munich, Germany",
     *   "Field": "Computer Science",
     *   "Best at (Skills)": "Python, Machine Learning, Data Structures",
     *   "Projects (Optional)": "AI-based traffic prediction system"
     * }
     */
    public Mono<ServerResponse> adminGenerateLor(ServerRequest request) {
        log.info("🔍 POST /api/v1/admin/ai/lor/generate (admin direct)");
        return request.bodyToMono(LorRequest.class)
            .flatMap(lorRequest -> {
                log.info("🚀 [ADMIN-LOR] Direct generation — senior: {}, student: {}",
                    lorRequest.getSeniorName(), lorRequest.getStudentName());
                return n8nService.generateLorDirect(lorRequest);
            })
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(response, "LOR generated successfully"))
            )
            .onErrorResume(this::handleError);
    }

    /**
     * Admin Cover Letter generation — admin supplies the full CoverLetterRequest JSON manually.
     * POST /api/v1/admin/ai/cover-letter/generate
     *
     * Full body required (keys must match @JsonProperty names exactly):
     * {
     *   "Student Name": "Rahul Sharma",
     *   "Passport Number": "A1234567",
     *   "Course Name": "MSc Computer Science",
     *   "University Name": "Technical University of Munich",
     *   "University Location": "Munich, Germany",
     *   "Course Duration": "2 years",
     *   "Course Start Date": "01/10/2025",
     *   "Tuition Fees": "1500 EUR/semester",
     *   "Blocked Account Bank Name": "Expatrio",
     *   "Blocked Account Balance": "11208 EUR",
     *   "Sponsor Name": "Self-sponsored",
     *   "SSC School Name": "Delhi Public School",
     *   "SSC Passing Month and Year": "June 2017",
     *   "SSC Marks or Percentage": "92%",
     *   "HSC School Name": "Kendriya Vidyalaya",
     *   "HSC Passing Month and Year": "May 2019",
     *   "HSC Marks or Percentage": "88%",
     *   "Bachelors University Name": "Mumbai University",
     *   "Bachelors Course Name": "B.Tech Computer Engineering",
     *   "Bachelors Course Percentage or CGPA": "8.4 CGPA"
     * }
     */
    public Mono<ServerResponse> adminGenerateCoverLetter(ServerRequest request) {
        log.info("🔍 POST /api/v1/admin/ai/cover-letter/generate (admin direct)");
        return request.bodyToMono(CoverLetterRequest.class)
            .flatMap(clRequest -> {
                log.info("🚀 [ADMIN-COVER-LETTER] Direct generation — student: {}, university: {}",
                    clRequest.getStudentName(), clRequest.getUniversityName());
                return n8nService.generateCoverLetterDirect(clRequest);
            })
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(response, "Cover letter generated successfully"))
            )
            .onErrorResume(this::handleError);
    }
}

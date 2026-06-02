package com.uniflow.university.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.university.dto.SimpleUniversitySearchRequest;
import com.uniflow.university.dto.UniversityCountDTO;
import com.uniflow.university.dto.UniversityListResponse;
import com.uniflow.university.dto.UniversityRequestDTO;
import com.uniflow.university.dto.UniversityResponseDTO;
import com.uniflow.university.dto.UniversitySearchRequestDTO;
import com.uniflow.university.repository.UniversityCriteriaRepository;
import com.uniflow.university.repository.UniversityQueries;
import com.uniflow.university.service.UniversityService;
import com.uniflow.university.util.UniversityQueryUtils;
import java.math.BigDecimal;
import java.net.URI;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * UniversityRequestHandler - Functional Request Handler for University Operations
 *
 * <p>This handler provides functional routing endpoints for university management following the
 * OLD_JAVA RouterConfig pattern. All requests and responses use proper DTOs with comprehensive
 * validation and error handling.
 *
 * <p>Key Features: - Functional routing pattern (no @RestController) - Type-safe DTO-based
 * request/response handling - Comprehensive error handling and validation - Consistent API response
 * format - Advanced search capabilities - Geographic and ranking-based queries - Multi-client
 * support
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UniversityHandler {

    private final UniversityService universityService;
    private final UniversityQueryUtils queryUtils;
    private final UniversityCriteriaRepository criteriaRepository;
    private final JwtUtils jwtUtils;

    // ========================================
    // CORE CRUD OPERATIONS
    // ========================================

    /** Create new university POST /api/v1/universities */
    public Mono<ServerResponse> createUniversity(ServerRequest request) {
        return request
            .bodyToMono(UniversityRequestDTO.class)
            .doOnNext(requestDTO ->
                log.info("Creating new university: {}", requestDTO.getName())
            )
            .onErrorResume(throwable -> {
                log.error(
                    "Failed to parse request body for university creation",
                    throwable
                );
                return Mono.error(
                    new IllegalArgumentException(
                        "Invalid request body format: " + throwable.getMessage()
                    )
                );
            })
            .flatMap(requestDTO -> {
                // Validate required fields for creation
                String validationError = validateCreateRequest(requestDTO);
                if (validationError != null) {
                    return Mono.error(
                        new IllegalArgumentException(validationError)
                    );
                }

                return universityService.createUniversity(requestDTO);
            })
            .flatMap(university ->
                ServerResponse.status(201)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            university,
                            "University created successfully"
                        )
                    )
            )
            .onErrorResume(this::handleCreateError);
    }

    /** Get all universities with advanced filtering GET /api/v1/universities */
    public Mono<ServerResponse> getUniversities(ServerRequest request) {
        log.debug(
            "Fetching universities with query parameters: {}",
            request.queryParams()
        );

        // Get universities and count in parallel using criteria repository
        return Mono.zip(
            criteriaRepository
                .findUniversitiesWithFilters(request)
                .collectList(),
            criteriaRepository.getTotalUniversityCount(request)
        )
            .flatMap(tuple -> {
                var universities = tuple.getT1();
                var totalCount = tuple.getT2();

                // Extract pagination info from request
                Integer page = request
                    .queryParam("page")
                    .map(Integer::parseInt)
                    .orElse(0);
                Integer size = request
                    .queryParam("size")
                    .map(Integer::parseInt)
                    .orElse(20);

                // Create response using UniversityListResponse
                UniversityListResponse response = new UniversityListResponse(
                    totalCount,
                    universities,
                    page,
                    size,
                    universities.size() == size
                );

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(response));
            })
            .onErrorResume(this::handleError);
    }

    /** Get university by ID GET /api/v1/universities/{id} */
    public Mono<ServerResponse> getUniversityById(ServerRequest request) {
        String universityId = request.pathVariable("id");

        try {
            UUID id = UUID.fromString(universityId);
            log.debug("Fetching university by ID: {}", id);

            return universityService
                .getUniversityById(id)
                .flatMap(university ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(university))
                )
                .onErrorResume(this::handleError);
        } catch (IllegalArgumentException e) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid university ID format"));
        }
    }

    /** Get university by code GET /api/v1/universities/code/{code} */
    public Mono<ServerResponse> getUniversityByCode(ServerRequest request) {
        String code = request.pathVariable("code");
        log.debug("Fetching university by code: {}", code);

        return universityService
            .getUniversityByCode(code)
            .flatMap(university ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(university))
            )
            .onErrorResume(this::handleError);
    }

    /** Update university PUT /api/v1/universities/{id} */
    public Mono<ServerResponse> updateUniversity(ServerRequest request) {
        String universityId = request.pathVariable("id");

        try {
            UUID id = UUID.fromString(universityId);

            return request
                .bodyToMono(UniversityRequestDTO.class)
                .doOnNext(requestDTO ->
                    log.info(
                        "Updating university: {} with data: {}",
                        id,
                        requestDTO.getName()
                    )
                )
                .onErrorResume(throwable -> {
                    log.error(
                        "Failed to parse request body for university update",
                        throwable
                    );
                    return Mono.error(
                        new IllegalArgumentException(
                            "Invalid request body format: " +
                                throwable.getMessage()
                        )
                    );
                })
                .flatMap(requestDTO -> {
                    // Validate required fields
                    String validationError = validateUpdateRequest(requestDTO);
                    if (validationError != null) {
                        return Mono.error(
                            new IllegalArgumentException(validationError)
                        );
                    }

                    return universityService.updateUniversity(id, requestDTO);
                })
                .flatMap(university ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.success(
                                university,
                                "University updated successfully"
                            )
                        )
                )
                .onErrorResume(throwable -> handleUpdateError(throwable, id));
        } catch (IllegalArgumentException e) {
            log.error("Invalid university ID format: {}", universityId, e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createValidationErrorResponse(
                        "INVALID_ID",
                        "Invalid university ID format",
                        Map.of(
                            "provided_id",
                            universityId,
                            "expected_format",
                            "UUID"
                        )
                    )
                );
        }
    }

    /** Delete university (soft delete) DELETE /api/v1/universities/{id} - Super Admin only */
    public Mono<ServerResponse> deleteUniversity(ServerRequest request) {
        String universityId = request.pathVariable("id");

        try {
            UUID id = UUID.fromString(universityId);
            String reason = request
                .queryParam("reason")
                .orElse("University deactivated");

            return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(user -> {
                    log.info(
                        "Extracted user from JWT: ID={}, Username={}, UserType={}, isSuperAdmin={}",
                        user.getId(),
                        user.getUsername(),
                        user.getUserType(),
                        user.isSuperAdmin()
                    );

                    // Validate user ID is not null
                    if (user.getId() == null) {
                        log.error(
                            "User ID is null from JWT token for user: {}",
                            user.getUsername()
                        );
                        ApiResponse<String> errorResponse = ApiResponse.error(
                            "Invalid user context - user ID is missing"
                        );
                        return ServerResponse.status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                        )
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(errorResponse);
                    }

                    // Only super admins can delete universities
                    if (!user.isSuperAdmin()) {
                        log.warn(
                            "User {} attempted to delete university without super admin privileges",
                            user.getUsername()
                        );
                        ApiResponse<String> errorResponse = ApiResponse.error(
                            "Only Super Administrators are authorized to delete universities"
                        );
                        return ServerResponse.status(HttpStatus.FORBIDDEN)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(errorResponse);
                    }

                    log.info(
                        "Super Admin {} deactivating university: {} (reason: {})",
                        user.getUsername(),
                        id,
                        reason
                    );

                    return universityService
                        .deleteUniversity(id)
                        .then(
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        "University deactivated successfully by " +
                                            user.getUsername()
                                    )
                                )
                        );
                })
                .onErrorResume(this::handleError);
        } catch (IllegalArgumentException e) {
            log.error("Invalid university ID format: {}", universityId, e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid university ID format"));
        }
    }

    // ========================================
    // SEARCH AND QUERY OPERATIONS
    // ========================================

    /** Advanced search universities POST /api/v1/universities/search */
    public Mono<ServerResponse> searchUniversities(ServerRequest request) {
        return request
            .bodyToMono(SimpleUniversitySearchRequest.class)
            .flatMap(searchRequest -> {
                log.debug(
                    "Searching universities with JSON body: {}",
                    searchRequest
                );

                // Use existing main endpoint logic but with body params
                return queryUtils
                    .extractUniversityParameters(request)
                    .map(params -> {
                        // Override query parameters with JSON body values
                        if (searchRequest.getSearch() != null) {
                            params.put("searchTerm", searchRequest.getSearch());
                            params.put("searchTermWildcard", false);
                        }
                        if (searchRequest.getName() != null) {
                            params.put("name", searchRequest.getName());
                            params.put("nameWildcard", false);
                        }
                        if (searchRequest.getCode() != null) {
                            params.put("code", searchRequest.getCode());
                            params.put("codeWildcard", false);
                        }
                        if (searchRequest.getCountry() != null) {
                            params.put("country", searchRequest.getCountry());
                            params.put("countryWildcard", false);
                        }
                        if (searchRequest.getCity() != null) {
                            params.put("city", searchRequest.getCity());
                            params.put("cityWildcard", false);
                        }
                        if (searchRequest.getState() != null) {
                            params.put("state", searchRequest.getState());
                            params.put("stateWildcard", false);
                        }
                        if (searchRequest.getType() != null) {
                            params.put("type", searchRequest.getType());
                            params.put("typeWildcard", false);
                        }
                        if (searchRequest.getInstitutionType() != null) {
                            params.put(
                                "institutionType",
                                searchRequest.getInstitutionType()
                            );
                            params.put("institutionTypeWildcard", false);
                        }
                        if (searchRequest.getCurrency() != null) {
                            params.put("currency", searchRequest.getCurrency());
                            params.put("currencyWildcard", false);
                        }
                        if (searchRequest.getLanguageOfInstruction() != null) {
                            params.put(
                                "languageOfInstruction",
                                searchRequest.getLanguageOfInstruction()
                            );
                            params.put("languageWildcard", false);
                        }

                        // Handle ranking params (support both minRanking and worldRankingMin)
                        if (searchRequest.getMinRanking() != null) {
                            params.put(
                                "worldRankingMin",
                                searchRequest.getMinRanking()
                            );
                            params.put("worldRankingWildcard", false);
                        }
                        if (searchRequest.getMaxRanking() != null) {
                            params.put(
                                "worldRankingMax",
                                searchRequest.getMaxRanking()
                            );
                            params.put("worldRankingWildcard", false);
                        }
                        if (searchRequest.getWorldRankingMin() != null) {
                            params.put(
                                "worldRankingMin",
                                searchRequest.getWorldRankingMin()
                            );
                            params.put("worldRankingWildcard", false);
                        }
                        if (searchRequest.getWorldRankingMax() != null) {
                            params.put(
                                "worldRankingMax",
                                searchRequest.getWorldRankingMax()
                            );
                            params.put("worldRankingWildcard", false);
                        }

                        // Handle tuition params
                        if (searchRequest.getMinTuition() != null) {
                            params.put(
                                "tuitionMin",
                                new BigDecimal(
                                    searchRequest.getMinTuition().toString()
                                )
                            );
                            params.put("tuitionWildcard", false);
                        }
                        if (searchRequest.getMaxTuition() != null) {
                            params.put(
                                "tuitionMax",
                                new BigDecimal(
                                    searchRequest.getMaxTuition().toString()
                                )
                            );
                            params.put("tuitionWildcard", false);
                        }

                        // Handle boolean params (support both hasScholarships and scholarshipsAvailable)
                        if (
                            searchRequest.getHasScholarships() != null
                        ) params.put(
                            "scholarshipsFilter",
                            searchRequest.getHasScholarships()
                        );
                        if (
                            searchRequest.getScholarshipsAvailable() != null
                        ) params.put(
                            "scholarshipsFilter",
                            searchRequest.getScholarshipsAvailable()
                        );
                        if (
                            searchRequest.getFinancialAidAvailable() != null
                        ) params.put(
                            "financialAidFilter",
                            searchRequest.getFinancialAidAvailable()
                        );

                        // Handle year params
                        if (
                            searchRequest.getFoundedYearMin() != null
                        ) params.put(
                            "foundedYearMin",
                            searchRequest.getFoundedYearMin()
                        );
                        if (
                            searchRequest.getFoundedYearMax() != null
                        ) params.put(
                            "foundedYearMax",
                            searchRequest.getFoundedYearMax()
                        );

                        // Handle course-level filters
                        if (searchRequest.getCourseSearch() != null) {
                            params.put("courseSearch", searchRequest.getCourseSearch());
                            params.put("courseSearchWildcard", false);
                        }
                        if (searchRequest.getDegreeLevel() != null) {
                            params.put("degreeLevel", searchRequest.getDegreeLevel());
                            params.put("degreeLevelWildcard", false);
                        }
                        if (searchRequest.getStudyMode() != null) {
                            params.put("studyMode", searchRequest.getStudyMode());
                            params.put("studyModeWildcard", false);
                        }
                        if (searchRequest.getCourseTuitionMin() != null) {
                            params.put("courseTuitionMin", new BigDecimal(searchRequest.getCourseTuitionMin().toString()));
                            params.put("courseTuitionWildcard", false);
                        }
                        if (searchRequest.getCourseTuitionMax() != null) {
                            params.put("courseTuitionMax", new BigDecimal(searchRequest.getCourseTuitionMax().toString()));
                            params.put("courseTuitionWildcard", false);
                        }
                        if (searchRequest.getCourseDuration() != null) {
                            params.put("courseDuration", searchRequest.getCourseDuration());
                            params.put("courseDurationWildcard", false);
                        }

                        // Handle pagination from body or defaults
                        if (searchRequest.getPage() != null) params.put(
                            "page",
                            searchRequest.getPage()
                        );
                        if (searchRequest.getSize() != null) params.put(
                            "size",
                            searchRequest.getSize()
                        );
                        if (searchRequest.getSortBy() != null) params.put(
                            "sortBy",
                            searchRequest.getSortBy()
                        );
                        if (
                            searchRequest.getSortDirection() != null
                        ) params.put(
                            "sortDirection",
                            searchRequest.getSortDirection()
                        );

                        return params;
                    })
                    .flatMap(parameters -> {
                        String sqlQuery = queryUtils.getFormattedQuery(
                            UniversityQueries.FIND_UNIVERSITIES_WITH_FILTERS,
                            parameters
                        );

                        return Mono.zip(
                            queryUtils
                                .executeQueryWithBindings(sqlQuery, parameters)
                                .all()
                                .flatMap(row ->
                                    universityService.mapRowToUniversityResponse(
                                        row
                                    )
                                )
                                .collectList(),
                            queryUtils
                                .executeQueryWithBindings(
                                    UniversityQueries.COUNT_UNIVERSITIES_WITH_FILTERS,
                                    parameters
                                )
                                .one()
                                .map(result -> (Long) result.get("count"))
                        );
                    });
            })
            .flatMap(tuple -> {
                var universities = tuple.getT1();
                var totalCount = tuple.getT2();

                Integer page = request
                    .queryParam("page")
                    .map(Integer::parseInt)
                    .orElse(0);
                Integer size = request
                    .queryParam("size")
                    .map(Integer::parseInt)
                    .orElse(20);

                UniversityListResponse response = new UniversityListResponse(
                    totalCount,
                    universities,
                    page,
                    size,
                    universities.size() >= size
                );

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(response));
            })
            .onErrorResume(this::handleError);
    }

    /** Get university filter counts GET /api/v1/universities/filters */
    public Mono<ServerResponse> getUniversityFilters(ServerRequest request) {
        String filterBy = request
            .queryParam("filterBy")
            .orElse(
                "country,type,institutionType,scholarshipsAvailable,ranking,tuition"
            );

        List<String> filterList = Arrays.asList(filterBy.split(","));
        // Map API field names to database field names
        filterList.replaceAll(s ->
            switch (s) {
                case "institutionType" -> "institution_type";
                case "scholarshipsAvailable" -> "scholarships_available";
                case "financialAidAvailable" -> "financial_aid_available";
                case "accommodationAvailable" -> "accommodation_available";
                case "internationalOffice" -> "international_office";
                case "careerServices" -> "career_services";
                case "libraryServices" -> "library_services";
                case "healthServices" -> "health_services";
                case "sportsFacilities" -> "sports_facilities";
                case "isFeatured" -> "is_featured";
                case "verificationStatus" -> "verification_status";
                case "worldRanking" -> "world_ranking";
                case "nationalRanking" -> "national_ranking";
                case "qsRanking" -> "qs_ranking";
                case "totalStudents" -> "total_students";
                default -> s;
            }
        );

        log.debug("Getting university filters for: {}", filterList);

        return criteriaRepository
            .findUniversityCounts(request, filterList)
            .collectList()
            .flatMap(countList -> {
                Map<String, Object> response = Map.of(
                    "filters",
                    countList,
                    "count",
                    countList.size()
                );

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(response));
            })
            .onErrorResume(this::handleError);
    }

    /** Get dashboard statistics GET /api/v1/universities/dashboard */
    public Mono<ServerResponse> getDashboardOverview(ServerRequest request) {
        log.debug("Getting university dashboard overview");

        return criteriaRepository
            .getDashboardStats(request)
            .flatMap(stats ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(stats))
            )
            .onErrorResume(this::handleError);
    }

    /** Get university statistics by country GET /api/v1/universities/statistics/country */
    public Mono<ServerResponse> getUniversityStatisticsByCountry(
        ServerRequest request
    ) {
        log.debug("Getting university statistics by country");

        return criteriaRepository
            .getUniversityStatisticsByCountry(request)
            .collectList()
            .flatMap(stats ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(stats))
            )
            .onErrorResume(this::handleError);
    }

    /** Text search universities GET /api/v1/universities/search/text */
    public Mono<ServerResponse> searchUniversitiesByText(
        ServerRequest request
    ) {
        String searchTerm = request.queryParam("q").orElse("");

        if (searchTerm.trim().isEmpty()) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "Search term is required. Use 'q' parameter."
                    )
                );
        }

        log.debug("Text searching universities with term: {}", searchTerm);

        return universityService
            .searchUniversitiesByText(searchTerm)
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    /** Get universities by country GET /api/v1/universities/country/{country} */
    public Mono<ServerResponse> getUniversitiesByCountry(
        ServerRequest request
    ) {
        String country = request.pathVariable("country").toUpperCase();
        log.debug("Fetching universities for country: {}", country);

        return universityService
            .getUniversitiesByCountry(country)
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    /** Get universities by city GET /api/v1/universities/city/{city} */
    public Mono<ServerResponse> getUniversitiesByCity(ServerRequest request) {
        String city = request.pathVariable("city");
        String country = request.queryParam("country").orElse("").toUpperCase();

        if (country.isEmpty()) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Country parameter is required"));
        }

        log.debug(
            "Fetching universities for city: {}, country: {}",
            city,
            country
        );

        return universityService
            .getUniversitiesByCity(city, country)
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    // ========================================
    // SPECIALIZED QUERY OPERATIONS
    // ========================================

    /** Get universities by ranking range GET /api/v1/universities/ranking */
    public Mono<ServerResponse> getUniversitiesByRanking(
        ServerRequest request
    ) {
        try {
            Integer minRank = request
                .queryParam("min")
                .map(Integer::parseInt)
                .orElse(1);
            Integer maxRank = request
                .queryParam("max")
                .map(Integer::parseInt)
                .orElse(500);

            log.debug(
                "Fetching universities with ranking {}-{}",
                minRank,
                maxRank
            );

            return universityService
                .getUniversitiesByRanking(minRank, maxRank)
                .collectList()
                .flatMap(universities ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(universities))
                )
                .onErrorResume(this::handleError);
        } catch (NumberFormatException e) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid ranking parameters"));
        }
    }

    /** Get universities by budget range GET /api/v1/universities/budget */
    public Mono<ServerResponse> getUniversitiesByBudget(ServerRequest request) {
        try {
            BigDecimal minTuition = request
                .queryParam("min")
                .map(BigDecimal::new)
                .orElse(BigDecimal.ZERO);
            BigDecimal maxTuition = request
                .queryParam("max")
                .map(BigDecimal::new)
                .orElse(BigDecimal.valueOf(100000));
            String currency = request.queryParam("currency").orElse("USD");

            log.debug(
                "Fetching universities with tuition {}-{} {}",
                minTuition,
                maxTuition,
                currency
            );

            return universityService
                .getUniversitiesByBudget(minTuition, maxTuition, currency)
                .collectList()
                .flatMap(universities ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(universities))
                )
                .onErrorResume(this::handleError);
        } catch (NumberFormatException e) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid budget parameters"));
        }
    }

    /** Get universities near location (geographic search) GET /api/v1/universities/near */
    public Mono<ServerResponse> getUniversitiesNearLocation(
        ServerRequest request
    ) {
        try {
            BigDecimal latitude = request
                .queryParam("latitude")
                .map(BigDecimal::new)
                .orElse(null);
            BigDecimal longitude = request
                .queryParam("longitude")
                .map(BigDecimal::new)
                .orElse(null);
            Integer radiusKm = request
                .queryParam("radius")
                .map(Integer::parseInt)
                .orElse(50);

            if (latitude == null || longitude == null) {
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Latitude and longitude parameters are required"
                        )
                    );
            }

            log.debug(
                "Fetching universities near {},{} within {} km",
                latitude,
                longitude,
                radiusKm
            );

            return universityService
                .getUniversitiesNearLocation(latitude, longitude, radiusKm)
                .collectList()
                .flatMap(universities ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(universities))
                )
                .onErrorResume(this::handleError);
        } catch (NumberFormatException e) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid location parameters"));
        }
    }

    /** Get top ranked universities GET /api/v1/universities/top */
    public Mono<ServerResponse> getTopRankedUniversities(
        ServerRequest request
    ) {
        Integer limit = request
            .queryParam("limit")
            .map(Integer::parseInt)
            .orElse(10);

        log.debug("Fetching top {} universities", limit);

        return universityService
            .getTopRankedUniversities(limit)
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    /** Get universities with scholarships GET /api/v1/universities/scholarships */
    public Mono<ServerResponse> getUniversitiesWithScholarships(
        ServerRequest request
    ) {
        log.debug("Fetching universities with scholarships");

        return universityService
            .getUniversitiesWithScholarships()
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    // ========================================
    // ANALYTICS AND STATISTICS
    // ========================================

    // ========================================
    // MULTI-CLIENT OPERATIONS
    // ========================================

    /** Get universities by client GET /api/v1/universities/client/{clientId} */
    public Mono<ServerResponse> getUniversitiesByClient(ServerRequest request) {
        String clientId = request.pathVariable("clientId");

        if (!clientId.matches("^(uniflow|uni360)$")) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "Invalid client ID. Must be 'uniflow' or 'uni360'"
                    )
                );
        }

        log.debug("Fetching universities for client: {}", clientId);

        return universityService
            .getUniversitiesByClient(clientId)
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    /** Get universities by territory GET /api/v1/universities/territory/{territory} */
    public Mono<ServerResponse> getUniversitiesByTerritory(
        ServerRequest request
    ) {
        String territory = request.pathVariable("territory");
        log.debug("Fetching universities for territory: {}", territory);

        return universityService
            .getUniversitiesByTerritory(territory)
            .collectList()
            .flatMap(universities ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(universities))
            )
            .onErrorResume(this::handleError);
    }

    // ========================================
    // ERROR HANDLING
    // ========================================

    /** Generic error handler for consistent error responses */
    private Mono<ServerResponse> handleError(Throwable throwable) {
        log.error("Request processing error", throwable);

        String errorMessage = throwable.getMessage() != null
            ? throwable.getMessage()
            : "Unknown error occurred";

        if (
            errorMessage.contains("not found") ||
            (throwable instanceof RuntimeException &&
                errorMessage.contains("University not found"))
        ) {
            return ServerResponse.status(404)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createNotFoundErrorResponse(
                        "UNIVERSITY_NOT_FOUND",
                        errorMessage
                    )
                );
        } else if (
            errorMessage.contains("Invalid") ||
            errorMessage.contains("validation") ||
            throwable instanceof IllegalArgumentException
        ) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createValidationErrorResponse(
                        "VALIDATION_ERROR",
                        errorMessage,
                        Map.of()
                    )
                );
        } else if (throwable instanceof DuplicateKeyException) {
            return ServerResponse.status(409)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createConflictErrorResponse(
                        "DUPLICATE_ENTRY",
                        "University with this code already exists"
                    )
                );
        } else if (throwable instanceof DataAccessException) {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createInternalErrorResponse(
                        "DATABASE_ERROR",
                        "Database operation failed: " + errorMessage
                    )
                );
        } else {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createInternalErrorResponse(
                        "INTERNAL_ERROR",
                        "Internal server error: " + errorMessage
                    )
                );
        }
    }

    /** Specialized error handler for update operations */
    private Mono<ServerResponse> handleUpdateError(
        Throwable throwable,
        UUID universityId
    ) {
        log.error(
            "University update error for ID: {}",
            universityId,
            throwable
        );

        String errorMessage = throwable.getMessage() != null
            ? throwable.getMessage()
            : "Update operation failed";

        if (
            errorMessage.contains("not found") ||
            (throwable instanceof RuntimeException &&
                errorMessage.contains("University not found"))
        ) {
            return ServerResponse.status(404)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createNotFoundErrorResponse(
                        "UNIVERSITY_NOT_FOUND",
                        "University with ID " + universityId + " not found",
                        Map.of("university_id", universityId.toString())
                    )
                );
        } else if (
            errorMessage.contains("Invalid") ||
            errorMessage.contains("validation") ||
            throwable instanceof IllegalArgumentException
        ) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createValidationErrorResponse(
                        "UPDATE_VALIDATION_ERROR",
                        "Validation failed during university update: " +
                            errorMessage,
                        Map.of("university_id", universityId.toString())
                    )
                );
        } else if (throwable instanceof DuplicateKeyException) {
            return ServerResponse.status(409)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createConflictErrorResponse(
                        "DUPLICATE_UNIVERSITY_CODE",
                        "Another university with this code already exists",
                        Map.of("university_id", universityId.toString())
                    )
                );
        } else if (throwable instanceof DataAccessException) {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createInternalErrorResponse(
                        "UPDATE_DATABASE_ERROR",
                        "Database error during university update: " +
                            errorMessage,
                        Map.of("university_id", universityId.toString())
                    )
                );
        } else {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createInternalErrorResponse(
                        "UPDATE_INTERNAL_ERROR",
                        "Unexpected error during university update: " +
                            errorMessage,
                        Map.of("university_id", universityId.toString())
                    )
                );
        }
    }

    /** Specialized error handler for create operations */
    private Mono<ServerResponse> handleCreateError(Throwable throwable) {
        log.error("University creation error", throwable);

        String errorMessage = throwable.getMessage() != null
            ? throwable.getMessage()
            : "Creation operation failed";

        if (
            errorMessage.contains("Invalid") ||
            errorMessage.contains("validation") ||
            throwable instanceof IllegalArgumentException
        ) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createValidationErrorResponse(
                        "CREATE_VALIDATION_ERROR",
                        "Validation failed during university creation: " +
                            errorMessage,
                        Map.of()
                    )
                );
        } else if (throwable instanceof DuplicateKeyException) {
            return ServerResponse.status(409)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createConflictErrorResponse(
                        "DUPLICATE_UNIVERSITY_CODE",
                        "University with this code already exists"
                    )
                );
        } else if (throwable instanceof DataAccessException) {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createInternalErrorResponse(
                        "CREATE_DATABASE_ERROR",
                        "Database error during university creation: " +
                            errorMessage
                    )
                );
        } else {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    createInternalErrorResponse(
                        "CREATE_INTERNAL_ERROR",
                        "Unexpected error during university creation: " +
                            errorMessage
                    )
                );
        }
    }

    /** Validate create request */
    private String validateCreateRequest(UniversityRequestDTO requestDTO) {
        if (requestDTO == null) {
            return "Request body is required for university creation";
        }

        // Required fields for creation
        if (
            requestDTO.getName() == null ||
            requestDTO.getName().trim().isEmpty()
        ) {
            return "University name is required";
        }

        if (
            requestDTO.getCode() == null ||
            requestDTO.getCode().trim().isEmpty()
        ) {
            return "University code is required";
        }

        if (
            requestDTO.getCountry() == null ||
            requestDTO.getCountry().trim().isEmpty()
        ) {
            return "Country is required";
        }

        // Validate name length
        if (requestDTO.getName().length() > 255) {
            return "University name cannot exceed 255 characters";
        }

        // Validate code format (alphanumeric, underscores, hyphens)
        if (!requestDTO.getCode().matches("^[A-Za-z0-9_-]+$")) {
            return "University code can only contain letters, numbers, underscores, and hyphens";
        }

        // Validate email format if provided
        if (
            requestDTO.getEmail() != null &&
            !requestDTO.getEmail().trim().isEmpty() &&
            !requestDTO.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")
        ) {
            return "Invalid email format: " + requestDTO.getEmail();
        }

        // Validate URL format if provided
        if (
            requestDTO.getWebsite() != null &&
            !requestDTO.getWebsite().trim().isEmpty() &&
            !requestDTO.getWebsite().matches("^https?://.*")
        ) {
            return "Website URL must start with http:// or https://";
        }

        // Validate numeric fields
        if (
            requestDTO.getFoundedYear() != null &&
            (requestDTO.getFoundedYear() < 800 ||
                requestDTO.getFoundedYear() > 2025)
        ) {
            return "Founded year must be between 800 and 2025";
        }

        return null; // No validation errors
    }

    /** Validate update request */
    private String validateUpdateRequest(UniversityRequestDTO requestDTO) {
        if (requestDTO == null) {
            return "Request body is required for university update";
        }

        // At least one field should be provided for update
        if (
            requestDTO.getName() == null &&
            requestDTO.getShortName() == null &&
            requestDTO.getCode() == null &&
            requestDTO.getEmail() == null &&
            requestDTO.getPhone() == null &&
            requestDTO.getWebsite() == null
        ) {
            return "At least one field must be provided for update";
        }

        // Validate email format if provided
        if (
            requestDTO.getEmail() != null &&
            !requestDTO.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")
        ) {
            return "Invalid email format: " + requestDTO.getEmail();
        }

        // Validate URL format if provided
        if (
            requestDTO.getWebsite() != null &&
            !requestDTO.getWebsite().matches("^https?://.*")
        ) {
            return "Website URL must start with http:// or https://";
        }

        return null; // No validation errors
    }

    /** Create validation error response */
    private ApiResponse<Void> createValidationErrorResponse(
        String errorCode,
        String message,
        Map<String, Object> details
    ) {
        ApiResponse.ErrorDetails errorDetails = new ApiResponse.ErrorDetails();
        errorDetails.setCode(errorCode);
        errorDetails.setStatus(400);
        errorDetails.setDetails(details);

        return ApiResponse.<Void>builder()
            .success(false)
            .message(message)
            .error(errorDetails)
            .build();
    }

    /** Create not found error response */
    private ApiResponse<Void> createNotFoundErrorResponse(
        String errorCode,
        String message
    ) {
        return createNotFoundErrorResponse(errorCode, message, Map.of());
    }

    private ApiResponse<Void> createNotFoundErrorResponse(
        String errorCode,
        String message,
        Map<String, Object> details
    ) {
        ApiResponse.ErrorDetails errorDetails = new ApiResponse.ErrorDetails();
        errorDetails.setCode(errorCode);
        errorDetails.setStatus(404);
        errorDetails.setDetails(details);

        return ApiResponse.<Void>builder()
            .success(false)
            .message(message)
            .error(errorDetails)
            .build();
    }

    /** Create conflict error response */
    private ApiResponse<Void> createConflictErrorResponse(
        String errorCode,
        String message
    ) {
        return createConflictErrorResponse(errorCode, message, Map.of());
    }

    private ApiResponse<Void> createConflictErrorResponse(
        String errorCode,
        String message,
        Map<String, Object> details
    ) {
        ApiResponse.ErrorDetails errorDetails = new ApiResponse.ErrorDetails();
        errorDetails.setCode(errorCode);
        errorDetails.setStatus(409);
        errorDetails.setDetails(details);

        return ApiResponse.<Void>builder()
            .success(false)
            .message(message)
            .error(errorDetails)
            .build();
    }

    /** Create internal server error response */
    private ApiResponse<Void> createInternalErrorResponse(
        String errorCode,
        String message
    ) {
        return createInternalErrorResponse(errorCode, message, Map.of());
    }

    private ApiResponse<Void> createInternalErrorResponse(
        String errorCode,
        String message,
        Map<String, Object> details
    ) {
        ApiResponse.ErrorDetails errorDetails = new ApiResponse.ErrorDetails();
        errorDetails.setCode(errorCode);
        errorDetails.setStatus(500);
        errorDetails.setDetails(details);

        return ApiResponse.<Void>builder()
            .success(false)
            .message(message)
            .error(errorDetails)
            .build();
    }
}

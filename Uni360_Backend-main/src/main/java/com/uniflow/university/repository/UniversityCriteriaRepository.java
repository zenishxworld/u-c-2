package com.uniflow.university.repository;

import com.uniflow.university.dto.UniversityCountDTO;
import com.uniflow.university.dto.UniversityResponseDTO;
import com.uniflow.university.entity.University;
import com.uniflow.university.service.UniversityService;
import com.uniflow.university.util.UniversityQueryUtils;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.r2dbc.core.FetchSpec;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class UniversityCriteriaRepository {

    @Autowired
    private UniversityQueryUtils queryUtils;

    @Autowired
    private DatabaseClient databaseClient;

    @Autowired
    private UniversityService universityService;

    /**
     * Find universities with dynamic filtering based on request parameters
     */
    public Flux<UniversityResponseDTO> findUniversitiesWithFilters(
        ServerRequest request
    ) {
        log.info("Finding universities with filters from request");

        return queryUtils
            .extractUniversityParameters(request)
            .flatMapMany(parameters -> {
                log.debug(
                    "Executing university search with parameters: {}",
                    queryUtils.prettyPrintJson(parameters)
                );

                String sqlQuery = queryUtils.getFormattedQuery(
                    UniversityQueries.FIND_UNIVERSITIES_WITH_FILTERS,
                    parameters
                );

                return queryUtils
                    .executeQueryWithBindings(sqlQuery, parameters)
                    .all()
                    .flatMap(row ->
                        universityService.mapRowToUniversityResponse(row)
                    )
                    .doOnComplete(() ->
                        log.debug("Completed university search")
                    );
            });
    }

    /**
     * Get total count of universities matching the filters
     */
    public Mono<Long> getTotalUniversityCount(ServerRequest request) {
        log.info("Getting total university count with filters");

        return queryUtils
            .extractUniversityParameters(request)
            .flatMap(parameters ->
                queryUtils
                    .executeQueryWithBindings(
                        UniversityQueries.COUNT_UNIVERSITIES_WITH_FILTERS,
                        parameters
                    )
                    .one()
                    .map(result -> (Long) result.get("count"))
                    .doOnSuccess(count ->
                        log.debug(
                            "Found {} universities matching filters",
                            count
                        )
                    )
            );
    }

    /**
     * Get university counts grouped by various filter parameters
     */
    public Flux<UniversityCountDTO> findUniversityCounts(
        ServerRequest request,
        List<String> groupByParams
    ) {
        log.info("=== STARTING FILTERS COUNT QUERY ===");
        log.info("Group by parameters: {}", groupByParams);

        return queryUtils
            .extractUniversityParameters(request)
            .flatMapMany(parameters -> {
                log.info("Extracted parameters for filters: {}", parameters);

                return Flux.fromIterable(groupByParams)
                    .flatMap(groupBy -> {
                        log.info("Processing groupBy field: {}", groupBy);
                        String sqlQuery = buildCountQueryByField(groupBy);
                        parameters.put("groupBy", groupBy);

                        log.info("SQL Query for [{}]: {}", groupBy, sqlQuery);

                        return queryUtils
                            .executeQueryWithBindings(sqlQuery, parameters)
                            .all()
                            .doOnNext(row -> {
                                log.info(
                                    "Raw row result for [{}]: {}",
                                    groupBy,
                                    row
                                );
                            })
                            .filter(row -> {
                                // Filter out null values
                                if (row.get("filterId") instanceof Boolean) {
                                    boolean result = (Boolean) row.get(
                                        "filterId"
                                    );
                                    log.info(
                                        "Boolean filterId [{}] = {}",
                                        groupBy,
                                        result
                                    );
                                    return result;
                                }
                                boolean hasFilterId =
                                    row.get("filterId") != null;
                                log.info(
                                    "FilterId null check [{}]: {}",
                                    groupBy,
                                    hasFilterId
                                );
                                return hasFilterId;
                            })
                            .map(row -> {
                                UniversityCountDTO countDTO =
                                    new UniversityCountDTO();
                                String filterParam = (String) row.get(
                                    "filterParam"
                                );

                                // Map database field names to API field names
                                String mappedFilterParam = mapFilterParamName(
                                    filterParam
                                );
                                countDTO.setFilterParam(mappedFilterParam);
                                countDTO.setFilterId(row.get("filterId"));
                                countDTO.setCount((Long) row.get("count"));

                                log.info(
                                    "Created CountDTO for [{}]: param={}, id={}, count={}",
                                    groupBy,
                                    mappedFilterParam,
                                    row.get("filterId"),
                                    row.get("count")
                                );
                                return countDTO;
                            })
                            .filter(countDTO -> {
                                boolean hasCount = countDTO.getCount() > 0;
                                log.info(
                                    "Count filter [{}]: count={}, passed={}",
                                    groupBy,
                                    countDTO.getCount(),
                                    hasCount
                                );
                                return hasCount;
                            })
                            .filter(countDTO -> {
                                boolean hasFilterId =
                                    countDTO.getFilterId() != null;
                                log.info(
                                    "FilterId filter [{}]: filterId={}, passed={}",
                                    groupBy,
                                    countDTO.getFilterId(),
                                    hasFilterId
                                );
                                return hasFilterId;
                            });
                    })
                    .doOnComplete(() ->
                        log.info("=== COMPLETED FILTERS COUNT QUERY ===")
                    );
            });
    }

    /**
     * Build appropriate count query based on the field type
     */
    private String buildCountQueryByField(String groupBy) {
        return switch (groupBy) {
            case
                "country",
                "city",
                "state",
                "region",
                "type",
                "institution_type",
                "currency" -> String.format(
                UniversityQueries.FIND_UNIVERSITY_COUNTS_BY_FIELD,
                groupBy,
                groupBy,
                groupBy
            );
            case
                "scholarships_available",
                "financial_aid_available",
                "accommodation_available",
                "international_office",
                "career_services",
                "library_services",
                "health_services",
                "sports_facilities" -> String.format(
                UniversityQueries.FIND_UNIVERSITY_COUNTS_BOOLEAN,
                groupBy,
                groupBy,
                groupBy,
                groupBy
            );
            case "ranking" -> UniversityQueries.FIND_UNIVERSITY_COUNTS_RANKING_RANGES;
            case "tuition" -> UniversityQueries.FIND_UNIVERSITY_COUNTS_TUITION_RANGES;
            default -> String.format(
                UniversityQueries.FIND_UNIVERSITY_COUNTS_BY_FIELD,
                groupBy,
                groupBy,
                groupBy
            );
        };
    }

    /**
     * Map database field names to API-friendly parameter names
     */
    private String mapFilterParamName(String dbFieldName) {
        return switch (dbFieldName) {
            case "institution_type" -> "institutionType";
            case "scholarships_available" -> "scholarshipsAvailable";
            case "financial_aid_available" -> "financialAidAvailable";
            case "accommodation_available" -> "accommodationAvailable";
            case "international_office" -> "internationalOffice";
            case "career_services" -> "careerServices";
            case "library_services" -> "libraryServices";
            case "health_services" -> "healthServices";
            case "sports_facilities" -> "sportsFacilities";
            default -> dbFieldName;
        };
    }

    /**
     * Get university statistics for dashboard
     */
    public Mono<Map<String, Object>> getDashboardStats(ServerRequest request) {
        return queryUtils
            .extractUniversityParameters(request)
            .flatMap(parameters ->
                queryUtils
                    .executeQueryWithBindings(
                        UniversityQueries.GET_DASHBOARD_OVERVIEW,
                        parameters
                    )
                    .one()
                    .map(result ->
                        Map.<String, Object>of(
                            "totalUniversities",
                            result.get("total_universities"),
                            "activeUniversities",
                            result.get("active_universities"),
                            "universitiesWithScholarships",
                            result.get("universities_with_scholarships"),
                            "countriesCovered",
                            result.get("countries_covered"),
                            "avgInternationalTuition",
                            result.get("avg_international_tuition"),
                            "minTuition",
                            result.get("min_tuition"),
                            "maxTuition",
                            result.get("max_tuition"),
                            "rankedUniversities",
                            result.get("ranked_universities")
                        )
                    )
            );
    }

    /**
     * Get country-wise university statistics
     */
    public Flux<Map<String, Object>> getUniversityStatisticsByCountry(
        ServerRequest request
    ) {
        return queryUtils
            .extractUniversityParameters(request)
            .flatMapMany(parameters ->
                queryUtils
                    .executeQueryWithBindings(
                        UniversityQueries.GET_UNIVERSITY_STATISTICS_BY_COUNTRY,
                        parameters
                    )
                    .all()
                    .map(result ->
                        Map.<String, Object>of(
                            "country",
                            result.get("country"),
                            "totalUniversities",
                            result.get("total_universities"),
                            "avgRanking",
                            result.get("avg_ranking"),
                            "avgTuition",
                            result.get("avg_tuition"),
                            "scholarshipsCount",
                            result.get("scholarships_count"),
                            "minTuition",
                            result.get("min_tuition"),
                            "maxTuition",
                            result.get("max_tuition")
                        )
                    )
            );
    }

    /**
     * Find universities near a specific location
     */
    public Flux<UniversityResponseDTO> findUniversitiesNearLocation(
        Double latitude,
        Double longitude,
        Double radiusKm,
        Integer size,
        Integer offset
    ) {
        Map<String, Object> parameters = Map.of(
            "latitude",
            latitude,
            "longitude",
            longitude,
            "radiusKm",
            radiusKm,
            "size",
            size != null ? size : 20,
            "offset",
            offset != null ? offset : 0
        );

        return queryUtils
            .executeQueryWithBindings(
                UniversityQueries.FIND_UNIVERSITIES_NEAR_LOCATION,
                parameters
            )
            .all()
            .flatMap(row -> universityService.mapRowToUniversityResponse(row));
    }

    /**
     * Find top ranked universities
     */
    public Flux<UniversityResponseDTO> findTopRankedUniversities(
        String country,
        String type,
        Integer maxRanking,
        Integer limit
    ) {
        Map<String, Object> parameters = Map.of(
            "country",
            country,
            "type",
            type,
            "maxRanking",
            maxRanking,
            "limit",
            limit != null ? limit : 50
        );

        return queryUtils
            .executeQueryWithBindings(
                UniversityQueries.FIND_TOP_RANKED_UNIVERSITIES,
                parameters
            )
            .all()
            .flatMap(row -> universityService.mapRowToUniversityResponse(row));
    }

    /**
     * Find universities by budget range
     */
    public Flux<UniversityResponseDTO> findUniversitiesByBudget(
        Double minBudget,
        Double maxBudget,
        String currency,
        Integer size,
        Integer offset
    ) {
        Map<String, Object> parameters = Map.of(
            "minBudget",
            minBudget,
            "maxBudget",
            maxBudget,
            "currency",
            currency,
            "size",
            size != null ? size : 20,
            "offset",
            offset != null ? offset : 0
        );

        return queryUtils
            .executeQueryWithBindings(
                UniversityQueries.FIND_UNIVERSITIES_BY_BUDGET,
                parameters
            )
            .all()
            .flatMap(row -> universityService.mapRowToUniversityResponse(row));
    }
}

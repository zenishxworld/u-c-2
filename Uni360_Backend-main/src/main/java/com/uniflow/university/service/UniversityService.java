package com.uniflow.university.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.university.dto.CourseResponseDTO;
import com.uniflow.university.dto.UniversityRequestDTO;
import com.uniflow.university.dto.UniversityResponseDTO;
import com.uniflow.university.entity.Course;
import com.uniflow.university.entity.University;
import com.uniflow.university.repository.CourseRepository;
import com.uniflow.university.repository.UniversityRepository;
import io.r2dbc.postgresql.codec.Json;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class UniversityService {

    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;

    public Mono<University> findById(UUID id) {
        return universityRepository.findById(id);
    }

    public Mono<University> findByCode(String code) {
        return universityRepository.findByCode(code);
    }

    public Flux<University> findAll() {
        return universityRepository.findByIsActive(true);
    }

    public Mono<Long> count() {
        return universityRepository.countByIsActive(true);
    }

    public Flux<University> searchByName(String name) {
        return universityRepository.findByNameContainingIgnoreCaseAndIsActive(
            name,
            true
        );
    }

    public Flux<University> findByCountry(String country) {
        return universityRepository.findByCountryAndIsActive(country, true);
    }

    public Flux<University> searchUniversities(String searchTerm) {
        return universityRepository.searchUniversities(searchTerm);
    }

    public Mono<University> createUniversity(UniversityRequestDTO requestDTO) {
        University university = University.builder()
            .name(requestDTO.getName())
            .code(requestDTO.getCode())
            .isActive(true)
            .data(convertToJson(requestDTO))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .createdBy("system")
            .updatedBy("system")
            .build();

        return universityRepository.save(university);
    }

    public Mono<University> updateUniversity(
        UUID id,
        UniversityRequestDTO requestDTO
    ) {
        return universityRepository
            .findById(id)
            .flatMap(existingUniversity -> {
                existingUniversity.setName(requestDTO.getName());
                existingUniversity.setCode(requestDTO.getCode());
                existingUniversity.setData(convertToJson(requestDTO));
                existingUniversity.setUpdatedAt(LocalDateTime.now());
                existingUniversity.setUpdatedBy("system");
                return universityRepository.save(existingUniversity);
            });
    }

    private Json convertToJson(UniversityRequestDTO requestDTO) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonString = mapper.writeValueAsString(requestDTO);
            return Json.of(jsonString);
        } catch (Exception e) {
            log.error("Error converting DTO to JSON", e);
            return Json.of("{}");
        }
    }

    // Stub methods for compatibility
    public Mono<Object> getUniversityById(UUID id) {
        return findById(id).cast(Object.class);
    }

    public Mono<Object> getUniversityByCode(String code) {
        return findByCode(code).cast(Object.class);
    }

    public Mono<Void> deleteUniversity(UUID id) {
        return universityRepository
            .findById(id)
            .flatMap(university -> {
                return universityRepository.delete(university);
            })
            .then();
    }

    public Flux<Object> getUniversitiesByCountry(String country) {
        return findByCountry(country).cast(Object.class);
    }

    public Flux<Object> getUniversitiesByCity(String city, String country) {
        if (country != null && !country.isEmpty()) {
            return universityRepository
                .findByCountryAndCity(country, city)
                .cast(Object.class);
        }
        return universityRepository
            .findByCityAndIsActive(city, true)
            .cast(Object.class);
    }

    public Flux<Object> getUniversitiesByRanking(
        Integer minRank,
        Integer maxRank
    ) {
        return findAll().cast(Object.class);
    }

    public Flux<Object> getUniversitiesByBudget(
        BigDecimal minTuition,
        BigDecimal maxTuition,
        String currency
    ) {
        return findAll().cast(Object.class);
    }

    public Flux<Object> getUniversitiesNearLocation(
        BigDecimal latitude,
        BigDecimal longitude,
        Integer radiusKm
    ) {
        return findAll().cast(Object.class);
    }

    public Flux<Object> getTopRankedUniversities(int limit) {
        return universityRepository
            .findTopWorldRankedUniversities(limit)
            .cast(Object.class);
    }

    public Flux<Object> getUniversitiesWithScholarships() {
        return findAll().cast(Object.class);
    }

    public Mono<Object[]> getDashboardOverview() {
        return count().map(total -> new Object[] { total, 0L, 0.0, 0L });
    }

    public Flux<Object[]> getUniversityStatisticsByCountry() {
        return Flux.empty();
    }

    public Flux<Object> searchUniversitiesByText(String searchText) {
        return searchUniversities(searchText).cast(Object.class);
    }

    public Flux<Object> getUniversitiesByClient(String clientId) {
        return findAll().cast(Object.class);
    }

    public Flux<Object> getUniversitiesByTerritory(String territory) {
        return findByCountry(territory).cast(Object.class);
    }

    public Mono<UniversityResponseDTO> mapRowToUniversityResponse(
        java.util.Map<String, Object> row
    ) {
        try {
            UniversityResponseDTO.UniversityResponseDTOBuilder builder =
                UniversityResponseDTO.builder();

            // Basic fields
            if (row.get("id") != null) {
                builder.id(UUID.fromString(row.get("id").toString()));
            }
            if (row.get("name") != null) {
                builder.name(row.get("name").toString());
            }
            if (row.get("code") != null) {
                builder.code(row.get("code").toString());
            }
            if (row.get("is_active") != null) {
                builder.isActive((Boolean) row.get("is_active"));
            }

            // Parse JSONB data for additional fields
            if (row.get("data") != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    Object dataObj = row.get("data");

                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> data;

                    // R2DBC returns io.r2dbc.postgresql.codec.Json which wraps ByteBuf
                    if (dataObj instanceof io.netty.buffer.ByteBuf) {
                        io.netty.buffer.ByteBuf buf =
                            (io.netty.buffer.ByteBuf) dataObj;
                        byte[] bytes = new byte[buf.readableBytes()];
                        buf.getBytes(buf.readerIndex(), bytes);
                        String jsonData = new String(
                            bytes,
                            java.nio.charset.StandardCharsets.UTF_8
                        );
                        data = mapper.readValue(jsonData, java.util.Map.class);
                    } else if (dataObj instanceof java.util.Map) {
                        // Already a Map
                        data = (java.util.Map<String, Object>) dataObj;
                    } else {
                        // Try to extract from wrapper object via asString() method
                        try {
                            java.lang.reflect.Method asStringMethod = dataObj
                                .getClass()
                                .getMethod("asString");
                            String jsonData = (String) asStringMethod.invoke(
                                dataObj
                            );
                            data = mapper.readValue(
                                jsonData,
                                java.util.Map.class
                            );
                        } catch (Exception e) {
                            log.error(
                                "Unknown data type: {}, attempting toString",
                                dataObj.getClass().getName()
                            );
                            String jsonData = dataObj.toString();
                            // Remove "JsonByteArrayInput{" prefix and "}" suffix if present
                            if (
                                jsonData.startsWith("JsonByteArrayInput{") &&
                                jsonData.endsWith("}")
                            ) {
                                jsonData = jsonData.substring(
                                    19,
                                    jsonData.length() - 1
                                );
                            }
                            data = mapper.readValue(
                                jsonData,
                                java.util.Map.class
                            );
                        }
                    }

                    if (data.get("short_name") != null) {
                        builder.shortName(data.get("short_name").toString());
                    }
                    if (data.get("country") != null) {
                        builder.country(data.get("country").toString());
                    }
                    if (data.get("city") != null) {
                        builder.city(data.get("city").toString());
                    }
                    if (data.get("website_url") != null) {
                        builder.website(data.get("website_url").toString());
                    }
                    if (data.get("world_ranking") != null) {
                        builder.worldRanking(
                            ((Number) data.get("world_ranking")).intValue()
                        );
                    }
                    if (data.get("national_ranking") != null) {
                        builder.nationalRanking(
                            ((Number) data.get("national_ranking")).intValue()
                        );
                    }
                    if (data.get("total_students") != null) {
                        builder.studentPopulation(
                            ((Number) data.get("total_students")).intValue()
                        );
                    }
                    if (
                        data.get("tuition_international_undergraduate") != null
                    ) {
                        builder.tuitionFeeInternational(
                            new BigDecimal(
                                data
                                    .get("tuition_international_undergraduate")
                                    .toString()
                            )
                        );
                    }
                    if (data.get("currency") != null) {
                        builder.currency(data.get("currency").toString());
                    }
                    // 'type' = public / private / semi_private  (ownership)
                    if (data.get("type") != null) {
                        builder.type(data.get("type").toString());
                    }
                    // 'institution_type' = research / applied_sciences / arts / medical / technical / business
                    if (data.get("institution_type") != null) {
                        builder.institutionType(data.get("institution_type").toString());
                    }
                } catch (Exception e) {
                    log.error("Error parsing JSONB data for university row", e);
                }
            }

            // Fetch and include courses for this university
            UUID universityId = builder.build().getId();
            if (universityId != null) {
                return courseRepository
                    .findActiveByUniversityId(universityId)
                    .map(this::mapCourseToResponseDTO)
                    .collectList()
                    .map(courses -> {
                        builder.courses(courses);
                        return builder.build();
                    });
            }

            return Mono.just(builder.build());
        } catch (Exception e) {
            log.error("Error mapping row to UniversityResponseDTO", e);
            return Mono.just(UniversityResponseDTO.builder().build());
        }
    }

    /**
     * Maps Course entity to CourseResponseDTO
     */
    private CourseResponseDTO mapCourseToResponseDTO(Course course) {
        CourseResponseDTO.CourseResponseDTOBuilder builder =
            CourseResponseDTO.builder();

        // Basic fields
        if (course.getId() != null) {
            builder.id(course.getId());
        }
        if (course.getUniversityId() != null) {
            builder.universityId(course.getUniversityId());
        }
        if (course.getName() != null) {
            builder.name(course.getName());
        }
        if (course.getCourseCode() != null) {
            builder.courseCode(course.getCourseCode());
        }

        // Parse JSONB data for additional course fields
        if (course.getData() != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                String jsonData = course.getData().asString();
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> data = mapper.readValue(
                    jsonData,
                    java.util.Map.class
                );

                if (data.get("official_name") != null) {
                    builder.officialName(data.get("official_name").toString());
                }
                if (data.get("degree_level") != null) {
                    builder.degreeLevel(data.get("degree_level").toString());
                }
                if (data.get("field_of_study") != null) {
                    builder.fieldOfStudy(data.get("field_of_study").toString());
                }
                if (data.get("duration_years") != null) {
                    builder.durationYears(
                        ((Number) data.get("duration_years")).intValue()
                    );
                }
                if (data.get("tuition_international") != null) {
                    builder.tuitionFeeInternational(
                        new BigDecimal(
                            data.get("tuition_international").toString()
                        )
                    );
                }
                if (data.get("currency") != null) {
                    builder.currency(data.get("currency").toString());
                }
                if (data.get("study_mode") != null) {
                    builder.studyMode(data.get("study_mode").toString());
                }
                if (data.get("degree_type") != null) {
                    builder.degreeType(data.get("degree_type").toString());
                }
            } catch (Exception e) {
                log.error("Error parsing JSONB data for course", e);
            }
        }

        return builder.build();
    }

    // ========================================
    // COMMISSION MANAGEMENT METHODS (AD-01)
    // ========================================

    /**
     * Get commission data for a specific university
     */
    public Mono<BigDecimal> getUniversityCommissionRate(UUID universityId) {
        log.debug("Getting commission rate for university: {}", universityId);

        return universityRepository
            .findById(universityId)
            .map(university ->
                extractCommissionRateFromData(university.getData())
            )
            .defaultIfEmpty(BigDecimal.valueOf(10.0)); // Default 10% commission rate
    }

    /**
     * Update commission rate for a university
     */
    public Mono<University> updateUniversityCommission(
        UUID universityId,
        BigDecimal commissionRate,
        String updatedBy
    ) {
        log.info(
            "Updating commission rate for university: {} to {}",
            universityId,
            commissionRate
        );

        return universityRepository
            .findById(universityId)
            .flatMap(university -> {
                Json updatedData = addCommissionToUniversityData(
                    university.getData(),
                    commissionRate
                );
                university.setData(updatedData);
                university.setUpdatedAt(LocalDateTime.now());
                university.setUpdatedBy(updatedBy);
                return universityRepository.save(university);
            });
    }

    /**
     * Get all universities with their commission rates for admin
     */
    public Flux<Object> getUniversitiesWithCommissions() {
        log.debug("Getting all universities with commission data");

        return universityRepository
            .findByIsActive(true)
            .map(university -> {
                BigDecimal commissionRate = extractCommissionRateFromData(
                    university.getData()
                );
                return java.util.Map.of(
                    "id",
                    university.getId(),
                    "name",
                    university.getName(),
                    "country",
                    university.getCountry() != null
                        ? university.getCountry()
                        : "Unknown",
                    "commissionRate",
                    commissionRate,
                    "isActive",
                    university.getIsActive()
                );
            });
    }

    // ========================================
    // PRIVATE HELPER METHODS FOR COMMISSION
    // ========================================

    public BigDecimal extractCommissionRateFromData(Json data) {
        if (data == null || data.asString() == null) {
            return BigDecimal.valueOf(10.0); // Default 10%
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(data.asString());
            var commissionNode = jsonNode.get("commission_rate");

            if (commissionNode != null && !commissionNode.isNull()) {
                return new BigDecimal(commissionNode.asText());
            }
        } catch (Exception e) {
            log.warn(
                "Error extracting commission rate from university data",
                e
            );
        }

        return BigDecimal.valueOf(10.0); // Default 10%
    }

    private Json addCommissionToUniversityData(
        Json existingData,
        BigDecimal commissionRate
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(
                existingData != null ? existingData.asString() : "{}"
            );
            var objectNode =
                (com.fasterxml.jackson.databind.node.ObjectNode) jsonNode;

            objectNode.put("commission_rate", commissionRate.toString());
            objectNode.put(
                "commission_updated_at",
                LocalDateTime.now().toString()
            );

            return Json.of(mapper.writeValueAsString(objectNode));
        } catch (Exception e) {
            log.error("Error adding commission data to university", e);
            return existingData != null ? existingData : Json.of("{}");
        }
    }
}

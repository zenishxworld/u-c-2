package com.uniflow.university.handler;

import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.university.dto.CourseResponseDTO;
import com.uniflow.university.entity.Course;
import com.uniflow.university.entity.University;
import com.uniflow.university.repository.CourseRepository;
import com.uniflow.university.service.UniversityService;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * CourseHandler - Functional Request Handler for Course Service
 *
 * <p>This handler provides global course endpoints accessible to both students and admins.
 * It implements functional routing pattern for Spring WebFlux with JWT-based authentication.
 *
 * <p>Key Features:
 * - Global course access for authenticated users (students and admins)
 * - Reactive programming with Mono/Flux
 * - JWT-based user context validation
 * - Standardized ApiResponse wrapper
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CourseHandler {

    private final CourseRepository courseRepository;
    private final UniversityService universityService;
    private final JwtUtils jwtUtils;

    /**
     * Get course by ID
     * GET /api/v1/courses/{id}
     * Accessible to both students and admins
     */
    public Mono<ServerResponse> getCourseById(ServerRequest request) {
        String courseId = request.pathVariable("id");
        log.info("Fetching course by ID: {}", courseId);

        return jwtUtils
            .getUserFromServerRequest(request)
            .flatMap(user -> {
                log.debug(
                    "User {} ({}) requesting course: {}",
                    user.getUsername(),
                    user.getUserType(),
                    courseId
                );

                return Mono.fromCallable(() ->
                    UUID.fromString(courseId)
                ).flatMap(uuid ->
                    courseRepository
                        .findById(uuid)
                        .flatMap(course ->
                            universityService
                                .findById(course.getUniversityId())
                                .map(university ->
                                    convertToCourseResponseDTO(
                                        course,
                                        university
                                    )
                                )
                                .switchIfEmpty(
                                    Mono.just(
                                        convertToCourseResponseDTO(course, null)
                                    )
                                )
                        )
                );
            })
            .flatMap(courseDTO -> {
                log.debug("Found course: {}", courseDTO.getName());
                ApiResponse<CourseResponseDTO> apiResponse =
                    ApiResponse.success(
                        courseDTO,
                        "Course retrieved successfully"
                    );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(apiResponse);
            })
            .switchIfEmpty(
                ServerResponse.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Course not found"))
            )
            .onErrorResume(IllegalArgumentException.class, e -> {
                log.error("Invalid UUID format: {}", courseId);
                ApiResponse<CourseResponseDTO> errorResponse =
                    ApiResponse.error("Invalid course ID format");
                return ServerResponse.status(400)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            })
            .onErrorResume(Exception.class, e -> {
                log.error("Error fetching course: {}", courseId, e);
                ApiResponse<CourseResponseDTO> errorResponse =
                    ApiResponse.error(
                        "Failed to retrieve course: " + e.getMessage()
                    );
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * Convert Course entity to CourseResponseDTO
     */
    private CourseResponseDTO convertToCourseResponseDTO(
        Course course,
        University university
    ) {
        Map<String, Object> courseData = extractCourseData(course);

        CourseResponseDTO.CourseResponseDTOBuilder builder =
            CourseResponseDTO.builder()
                .id(course.getId())
                .universityId(course.getUniversityId())
                .name(course.getName())
                .courseCode(course.getCourseCode());

        // Extract course details from JSONB data
        builder
            .description(getStringValue(courseData, "description"))
            .degreeLevel(getStringValue(courseData, "degree_level"))
            .degreeType(getStringValue(courseData, "degree_type"))
            .fieldOfStudy(getStringValue(courseData, "field_of_study"))
            .subjectArea(getStringValue(courseData, "subject_area"))
            .studyMode(getStringValue(courseData, "study_mode"))
            .durationYears(getIntegerValue(courseData, "duration_years"))
            .durationMonths(getIntegerValue(courseData, "duration_months"))
            .tuitionFeeLocal(getBigDecimalValue(courseData, "tuition_local"))
            .tuitionFeeInternational(
                getBigDecimalValue(courseData, "tuition_international")
            )
            .currency(getStringValue(courseData, "currency"))
            .applicationFee(getBigDecimalValue(courseData, "application_fee"))
            .minGpa(getBigDecimalValue(courseData, "min_gpa"))
            .minIelts(getBigDecimalValue(courseData, "min_ielts"))
            .minToefl(getIntegerValue(courseData, "min_toefl"))
            .languageOfInstruction(getStringValue(courseData, "language"))
            .isPopular(getBooleanValue(courseData, "is_popular"))
            .isFeatured(getBooleanValue(courseData, "is_featured"))
            .status(
                getBooleanValue(courseData, "is_active") ? "ACTIVE" : "INACTIVE"
            );

        return builder.build();
    }

    /**
     * Extract course data from JSONB column
     */
    private Map<String, Object> extractCourseData(Course course) {
        try {
            if (course.getData() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.readValue(course.getData().asString(), Map.class);
            }
        } catch (Exception e) {
            log.warn(
                "Failed to parse course data JSON for course {}: {}",
                course.getId(),
                e.getMessage()
            );
        }
        return Map.of();
    }

    /**
     * Extract university data from JSONB column
     */
    private Map<String, Object> extractUniversityData(University university) {
        try {
            if (university.getData() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
                return mapper.readValue(
                    university.getData().asString(),
                    Map.class
                );
            }
        } catch (Exception e) {
            log.warn(
                "Failed to parse university data JSON for university {}: {}",
                university.getId(),
                e.getMessage()
            );
        }
        return Map.of();
    }

    /**
     * Helper methods for safe data extraction
     */
    private String getStringValue(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value != null ? value.toString() : null;
    }

    private Integer getIntegerValue(Map<String, Object> data, String key) {
        try {
            Object value = data.get(key);
            if (value instanceof Number) {
                return ((Number) value).intValue();
            } else if (value instanceof String) {
                return Integer.parseInt((String) value);
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse integer value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return null;
    }

    private java.math.BigDecimal getBigDecimalValue(
        Map<String, Object> data,
        String key
    ) {
        try {
            Object value = data.get(key);
            if (value instanceof Number) {
                return java.math.BigDecimal.valueOf(
                    ((Number) value).doubleValue()
                );
            } else if (value instanceof String) {
                return new java.math.BigDecimal((String) value);
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse BigDecimal value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return null;
    }

    private Boolean getBooleanValue(Map<String, Object> data, String key) {
//        Object value = data.get(key);
//        if (value instanceof Boolean) {
//            return (Boolean) value;
//        } else if (value instanceof String) {
//            return Boolean.parseBoolean((String) value);
//        }
//        return null;
        return true;
    }
}

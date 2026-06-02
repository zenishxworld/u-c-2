package com.uniflow.university.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.university.dto.CourseExcelDto;
import com.uniflow.university.dto.ExcelUploadResultDto;
import com.uniflow.university.dto.UniversityExcelDto;
import com.uniflow.university.entity.Course;
import com.uniflow.university.entity.University;
import com.uniflow.university.repository.CourseRepository;
import com.uniflow.university.repository.UniversityRepository;
import io.r2dbc.postgresql.codec.Json;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelUploadService {

    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    public Mono<ExcelUploadResultDto<University>> saveUniversitiesFromExcel(
        List<UniversityExcelDto> universityDtos
    ) {
        ExcelUploadResultDto<University> result = ExcelUploadResultDto.<
                University
            >builder().build();

        return Flux.fromIterable(universityDtos)
            .flatMap(dto -> convertAndSaveUniversity(dto, result))
            .collectList()
            .map(universities -> {
                log.info(
                    "Successfully saved {} universities from Excel upload. Skipped: {}",
                    result.getCreatedCount(),
                    result.getSkippedCount()
                );
                return result;
            })
            .doOnError(error ->
                log.error("Error saving universities from Excel upload", error)
            );
    }

    public Mono<ExcelUploadResultDto<Course>> saveCoursesFromExcel(
        List<CourseExcelDto> courseDtos
    ) {
        ExcelUploadResultDto<Course> result = ExcelUploadResultDto.<
                Course
            >builder().build();

        return Flux.fromIterable(courseDtos)
            .flatMap(dto -> convertAndSaveCourse(dto, result))
            .collectList()
            .map(courses -> {
                log.info(
                    "Successfully saved {} courses from Excel upload. Skipped: {}",
                    result.getCreatedCount(),
                    result.getSkippedCount()
                );
                return result;
            })
            .doOnError(error ->
                log.error("Error saving courses from Excel upload", error)
            );
    }

    private Mono<University> convertAndSaveUniversity(
        UniversityExcelDto dto,
        ExcelUploadResultDto<University> result
    ) {
        // Validate mandatory fields
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            log.error(
                "University code is mandatory. Skipping record: {}",
                dto.getName()
            );
            result.addSkipped(
                dto.getName() != null ? dto.getName() : "Unknown",
                "VALIDATION_ERROR",
                "University code is mandatory and cannot be empty. Please provide a valid code for the university."
            );
            return Mono.empty();
        }

        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            log.error(
                "University name is mandatory. Skipping record with code: {}",
                dto.getCode()
            );
            result.addSkipped(
                dto.getCode(),
                "VALIDATION_ERROR",
                "University name is mandatory and cannot be empty."
            );
            return Mono.empty();
        }

        return checkUniversityCodeExists(dto.getCode())
            .flatMap(exists -> {
                if (exists) {
                    log.warn(
                        "University with code {} already exists, skipping",
                        dto.getCode()
                    );
                    result.addSkipped(
                        dto.getCode(),
                        "DUPLICATE",
                        String.format(
                            "University with code '%s' already exists in the database. Cannot upload duplicate records. " +
                                "Current name in file: '%s'. If you want to update this university, please use the update API instead.",
                            dto.getCode(),
                            dto.getName()
                        )
                    );
                    return Mono.empty();
                }

                try {
                    University university = convertDtoToUniversityEntity(dto);
                    return universityRepository
                        .save(university)
                        .doOnSuccess(saved -> {
                            result.addCreated(saved);
                            log.info(
                                "Created university: {} ({})",
                                saved.getName(),
                                saved.getCode()
                            );
                        });
                } catch (Exception e) {
                    log.error(
                        "Error converting university DTO to entity: {}",
                        e.getMessage()
                    );
                    result.addSkipped(
                        dto.getCode(),
                        "CONVERSION_ERROR",
                        "Failed to convert university data: " + e.getMessage()
                    );
                    return Mono.empty();
                }
            })
            .onErrorResume(error -> {
                log.error(
                    "Error processing university {}: {}",
                    dto.getCode(),
                    error.getMessage()
                );
                result.addSkipped(
                    dto.getCode(),
                    "PROCESSING_ERROR",
                    error.getMessage()
                );
                return Mono.empty();
            });
    }

    private Mono<Course> convertAndSaveCourse(
        CourseExcelDto dto,
        ExcelUploadResultDto<Course> result
    ) {
        return universityRepository
            .findByCode(dto.getUniversityCode())
            .switchIfEmpty(
                Mono.defer(() -> {
                    result.addSkipped(
                        dto.getCourseCode() != null
                            ? dto.getCourseCode()
                            : dto.getName(),
                        "UNIVERSITY_NOT_FOUND",
                        String.format(
                            "University with code '%s' not found for course '%s'",
                            dto.getUniversityCode(),
                            dto.getName()
                        )
                    );
                    return Mono.empty();
                })
            )
            .flatMap(university -> {
                return checkCourseCodeExists(
                    dto.getCourseCode(),
                    university.getId()
                ).flatMap(exists -> {
                    if (exists) {
                        log.warn(
                            "Course with code {} already exists for university {}, skipping",
                            dto.getCourseCode(),
                            dto.getUniversityCode()
                        );
                        result.addSkipped(
                            dto.getCourseCode(),
                            "DUPLICATE",
                            String.format(
                                "Course with code '%s' already exists for university '%s'. Cannot upload duplicate courses. " +
                                    "Current name in file: '%s'. If you want to update this course, please use the update API instead.",
                                dto.getCourseCode(),
                                dto.getUniversityCode(),
                                dto.getName()
                            )
                        );
                        return Mono.empty();
                    }

                    try {
                        Course course = convertDtoToCourseEntity(
                            dto,
                            university.getId()
                        );
                        return courseRepository
                            .save(course)
                            .doOnSuccess(saved -> {
                                result.addCreated(saved);
                                log.info(
                                    "Created course: {} ({}) for university {}",
                                    saved.getName(),
                                    saved.getCourseCode(),
                                    dto.getUniversityCode()
                                );
                            });
                    } catch (Exception e) {
                        log.error(
                            "Error converting course DTO to entity: {}",
                            e.getMessage()
                        );
                        result.addSkipped(
                            dto.getCourseCode(),
                            "CONVERSION_ERROR",
                            "Failed to convert course data: " + e.getMessage()
                        );
                        return Mono.empty();
                    }
                });
            })
            .onErrorResume(error -> {
                log.error(
                    "Error processing course {}: {}",
                    dto.getCourseCode(),
                    error.getMessage()
                );
                result.addSkipped(
                    dto.getCourseCode(),
                    "PROCESSING_ERROR",
                    error.getMessage()
                );
                return Mono.empty();
            });
    }

    private University convertDtoToUniversityEntity(UniversityExcelDto dto)
        throws Exception {
        // Build the JSONB data object
        Map<String, Object> dataMap = new HashMap<>();

        // Basic information
        putIfNotNull(dataMap, "official_name", dto.getName());
        putIfNotNull(dataMap, "short_name", dto.getName());
        putIfNotNull(dataMap, "country", dto.getCountry());
        putIfNotNull(dataMap, "country_code", dto.getCountryCode());
        putIfNotNull(dataMap, "state", dto.getState());
        putIfNotNull(dataMap, "city", dto.getCity());
        putIfNotNull(dataMap, "address", dto.getAddress());

        // Contact information
        putIfNotNull(dataMap, "website_url", dto.getWebsiteUrl());
        putIfNotNull(dataMap, "email", dto.getEmail());
        putIfNotNull(dataMap, "phone", dto.getPhone());
        putIfNotNull(dataMap, "admissions_email", dto.getAdmissionsEmail());
        putIfNotNull(dataMap, "admissions_phone", dto.getAdmissionsPhone());

        // Institution details
        putIfNotNull(dataMap, "institution_type", dto.getInstitutionType());
        putIfNotNull(dataMap, "type", dto.getType());
        putIfNotNull(dataMap, "founding_year", dto.getFoundingYear());

        // Statistics
        putIfNotNull(dataMap, "total_students", dto.getTotalStudents());
        putIfNotNull(
            dataMap,
            "undergraduate_students",
            dto.getUndergraduateStudents()
        );
        putIfNotNull(dataMap, "graduate_students", dto.getGraduateStudents());
        putIfNotNull(dataMap, "faculty_count", dto.getFacultyCount());

        // Rankings
        putIfNotNull(dataMap, "world_ranking", dto.getWorldRanking());
        putIfNotNull(dataMap, "national_ranking", dto.getNationalRanking());
        putIfNotNull(dataMap, "qs_ranking", dto.getQsRanking());

        // Financial information
        putIfNotNull(
            dataMap,
            "tuition_international_undergraduate",
            dto.getTuitionInternationalUndergraduate()
        );
        putIfNotNull(
            dataMap,
            "tuition_international_graduate",
            dto.getTuitionInternationalGraduate()
        );
        putIfNotNull(dataMap, "application_fee", dto.getApplicationFee());
        putIfNotNull(dataMap, "currency", dto.getCurrency());
        putIfNotNull(dataMap, "acceptance_rate", dto.getAcceptanceRate());

        // Dates
        putIfNotNull(
            dataMap,
            "application_deadline_fall",
            dto.getApplicationDeadlineFall()
        );
        putIfNotNull(
            dataMap,
            "application_deadline_spring",
            dto.getApplicationDeadlineSpring()
        );

        // English requirements
        if (
            dto.getToeflMin() != null ||
            dto.getIeltsMin() != null ||
            dto.getTestDaF() != null ||
            dto.getDsh() != null
        ) {
            Map<String, Object> englishReqs = new HashMap<>();
            putIfNotNull(englishReqs, "TOEFL_min", dto.getToeflMin());
            putIfNotNull(englishReqs, "IELTS_min", dto.getIeltsMin());
            putIfNotNull(englishReqs, "TestDaF", dto.getTestDaF());
            putIfNotNull(englishReqs, "DSH", dto.getDsh());
            dataMap.put("english_requirements", englishReqs);
        }

        // Arrays from comma-separated strings
        putArrayIfNotNull(dataMap, "affiliations", dto.getAffiliations());
        putArrayIfNotNull(
            dataMap,
            "languages_of_instruction",
            dto.getLanguagesOfInstruction()
        );
        putArrayIfNotNull(
            dataMap,
            "research_facilities",
            dto.getResearchFacilities()
        );
        putArrayIfNotNull(
            dataMap,
            "sports_facilities",
            dto.getSportsFacilities()
        );
        putArrayIfNotNull(
            dataMap,
            "student_services",
            dto.getStudentServices()
        );
        putArrayIfNotNull(
            dataMap,
            "schools_colleges",
            dto.getSchoolsColleges()
        );
        putArrayIfNotNull(dataMap, "degree_levels", dto.getDegreeLevels());
        putArrayIfNotNull(dataMap, "popular_majors", dto.getPopularMajors());

        // Status and metadata
        putIfNotNull(dataMap, "description", dto.getDescription());
        putIfNotNull(
            dataMap,
            "verification_status",
            dto.getVerificationStatus() != null
                ? dto.getVerificationStatus()
                : "PENDING"
        );
        putIfNotNull(
            dataMap,
            "status",
            dto.getStatus() != null ? dto.getStatus() : "ACTIVE"
        );
        putIfNotNull(
            dataMap,
            "is_featured",
            dto.getIsFeatured() != null ? dto.getIsFeatured() : false
        );
        putIfNotNull(
            dataMap,
            "scholarships_available",
            dto.getScholarshipsAvailable()
        );
        putIfNotNull(
            dataMap,
            "client_id",
            dto.getClientId() != null ? dto.getClientId() : "excel_upload"
        );

        // Convert to JSON
        String jsonData = objectMapper.writeValueAsString(dataMap);
        Json jsonbData = Json.of(jsonData);

        LocalDateTime now = LocalDateTime.now();

        return University.builder()
            .name(dto.getName())
            .code(dto.getCode())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .data(jsonbData)
            .createdAt(now)
            .updatedAt(now)
            .createdBy(
                dto.getCreatedBy() != null ? dto.getCreatedBy() : "excel_upload"
            )
            .updatedBy(
                dto.getUpdatedBy() != null ? dto.getUpdatedBy() : "excel_upload"
            )
            .build();
    }

    private Course convertDtoToCourseEntity(
        CourseExcelDto dto,
        UUID universityId
    ) throws Exception {
        // Build the JSONB data object
        Map<String, Object> dataMap = new HashMap<>();

        // Basic course information
        putIfNotNull(dataMap, "official_name", dto.getOfficialName());
        putIfNotNull(dataMap, "degree_level", dto.getDegreeLevel());
        putIfNotNull(dataMap, "degree_type", dto.getDegreeType());
        putIfNotNull(dataMap, "field_of_study", dto.getFieldOfStudy());
        putIfNotNull(dataMap, "subject_area", dto.getSubjectArea());
        putIfNotNull(
            dataMap,
            "academic_department",
            dto.getAcademicDepartment()
        );

        // Duration and study mode
        putIfNotNull(dataMap, "duration_years", dto.getDurationYears());
        putIfNotNull(dataMap, "study_mode", dto.getStudyMode());

        // Financial information
        putIfNotNull(
            dataMap,
            "tuition_international",
            dto.getTuitionInternational()
        );
        putIfNotNull(dataMap, "tuition_domestic", dto.getTuitionDomestic());
        putIfNotNull(dataMap, "currency", dto.getCurrency());

        // Admission requirements
        Map<String, Object> admissionReqs = new HashMap<>();
        putIfNotNull(admissionReqs, "min_gpa", dto.getMinGpa());
        putIfNotNull(
            admissionReqs,
            "bachelor_required",
            dto.getBachelorRequired()
        );
        putIfNotNull(admissionReqs, "master_required", dto.getMasterRequired());
        putIfNotNull(
            admissionReqs,
            "bachelor_philosophy",
            dto.getBachelorPhilosophy()
        );
        putIfNotNull(
            admissionReqs,
            "bachelor_engineering",
            dto.getBachelorEngineering()
        );
        putIfNotNull(admissionReqs, "abitur_required", dto.getAbiturRequired());
        putIfNotNull(admissionReqs, "thesis_required", dto.getThesisRequired());
        putIfNotNull(
            admissionReqs,
            "german_proficiency",
            dto.getGermanProficiency()
        );
        putIfNotNull(
            admissionReqs,
            "english_proficiency",
            dto.getEnglishProficiency()
        );
        putIfNotNull(admissionReqs, "toefl_min", dto.getToeflMin());
        putIfNotNull(admissionReqs, "ielts_min", dto.getIeltsMin());
        putIfNotNull(
            admissionReqs,
            "mathematics_prerequisite",
            dto.getMathematicsPrerequisite()
        );
        putIfNotNull(
            admissionReqs,
            "physics_prerequisite",
            dto.getPhysicsPrerequisite()
        );
        putIfNotNull(
            admissionReqs,
            "chemistry_prerequisite",
            dto.getChemistryPrerequisite()
        );
        putIfNotNull(
            admissionReqs,
            "biology_prerequisite",
            dto.getBiologyPrerequisite()
        );
        putIfNotNull(admissionReqs, "gre_recommended", dto.getGreRecommended());
        putIfNotNull(admissionReqs, "gmat_required", dto.getGmatRequired());

        if (!admissionReqs.isEmpty()) {
            dataMap.put("admission_requirements", admissionReqs);
        }

        // Arrays from comma-separated strings
        putArrayIfNotNull(dataMap, "prerequisites", dto.getPrerequisites());
        putArrayIfNotNull(
            dataMap,
            "languages_of_instruction",
            dto.getLanguagesOfInstruction()
        );
        putArrayIfNotNull(dataMap, "specializations", dto.getSpecializations());
        putArrayIfNotNull(dataMap, "career_outcomes", dto.getCareerOutcomes());
        putArrayIfNotNull(
            dataMap,
            "application_requirements",
            dto.getApplicationRequirements()
        );
        putArrayIfNotNull(dataMap, "intake_seasons", dto.getIntakeSeasons());
        putArrayIfNotNull(
            dataMap,
            "partner_universities",
            dto.getPartnerUniversities()
        );
        putArrayIfNotNull(
            dataMap,
            "exchange_programs",
            dto.getExchangePrograms()
        );
        putArrayIfNotNull(dataMap, "research_areas", dto.getResearchAreas());
        putArrayIfNotNull(dataMap, "lab_facilities", dto.getLabFacilities());

        // Application information
        putIfNotNull(
            dataMap,
            "application_deadline",
            dto.getApplicationDeadline()
        );

        // Course structure
        putIfNotNull(dataMap, "total_credits", dto.getTotalCredits());
        putIfNotNull(dataMap, "core_credits", dto.getCoreCredits());
        putIfNotNull(dataMap, "elective_credits", dto.getElectiveCredits());
        putIfNotNull(dataMap, "practical_credits", dto.getPracticalCredits());

        // Additional metadata
        putIfNotNull(dataMap, "description", dto.getDescription());
        putIfNotNull(dataMap, "learning_outcomes", dto.getLearningOutcomes());
        putIfNotNull(dataMap, "accreditation", dto.getAccreditation());
        putIfNotNull(dataMap, "ranking", dto.getRanking());

        // Status fields
        putIfNotNull(
            dataMap,
            "status",
            dto.getStatus() != null ? dto.getStatus() : "ACTIVE"
        );
        putIfNotNull(
            dataMap,
            "is_featured",
            dto.getIsFeatured() != null ? dto.getIsFeatured() : false
        );
        putIfNotNull(
            dataMap,
            "is_online",
            dto.getIsOnline() != null ? dto.getIsOnline() : false
        );
        putIfNotNull(
            dataMap,
            "has_internship",
            dto.getHasInternship() != null ? dto.getHasInternship() : false
        );
        putIfNotNull(
            dataMap,
            "has_thesis",
            dto.getHasThesis() != null ? dto.getHasThesis() : false
        );

        // Convert to JSON
        String jsonData = objectMapper.writeValueAsString(dataMap);
        Json jsonbData = Json.of(jsonData);

        LocalDateTime now = LocalDateTime.now();

        return Course.builder()
            .universityId(universityId)
            .name(dto.getName())
            .courseCode(dto.getCourseCode())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .data(jsonbData)
            .createdAt(now)
            .updatedAt(now)
            .createdBy(
                dto.getCreatedBy() != null ? dto.getCreatedBy() : "excel_upload"
            )
            .updatedBy(
                dto.getUpdatedBy() != null ? dto.getUpdatedBy() : "excel_upload"
            )
            .build();
    }

    private Mono<Boolean> checkUniversityCodeExists(String code) {
        if (code == null || code.trim().isEmpty()) {
            return Mono.just(false);
        }
        return universityRepository.countByCode(code).map(count -> count > 0);
    }

    private Mono<Boolean> checkCourseCodeExists(
        String courseCode,
        UUID universityId
    ) {
        if (courseCode == null || courseCode.trim().isEmpty()) {
            return Mono.just(false);
        }
        return courseRepository
            .countByCourseCodeAndUniversityId(courseCode, universityId)
            .map(count -> count > 0);
    }

    private void putIfNotNull(
        Map<String, Object> map,
        String key,
        Object value
    ) {
        if (value != null) {
            map.put(key, value);
        }
    }

    private void putArrayIfNotNull(
        Map<String, Object> map,
        String key,
        String commaSeparatedValue
    ) {
        if (
            commaSeparatedValue != null && !commaSeparatedValue.trim().isEmpty()
        ) {
            List<String> list = Arrays.stream(commaSeparatedValue.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
            if (!list.isEmpty()) {
                map.put(key, list);
            }
        }
    }
}

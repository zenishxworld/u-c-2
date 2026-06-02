package com.uniflow.university.controller;

import com.uniflow.university.dto.CourseUploadResponseDto;
import com.uniflow.university.dto.ExcelUploadResultDto;
import com.uniflow.university.dto.UniversityUploadResponseDto;
import com.uniflow.university.entity.Course;
import com.uniflow.university.entity.University;
import com.uniflow.university.service.ExcelProcessingService;
import com.uniflow.university.service.ExcelUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.ByteArrayInputStream;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/university/excel")
@RequiredArgsConstructor
@Slf4j
@Tag(
    name = "Excel Upload",
    description = "Excel file upload APIs for universities and courses"
)
public class ExcelUploadController {

    private final ExcelProcessingService excelProcessingService;
    private final ExcelUploadService excelUploadService;

    @PostMapping(
        value = "/universities/upload",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(
        summary = "Upload universities from Excel or CSV file",
        description = "Upload an Excel (.xlsx, .xls) or CSV file containing university data. The file should have columns like: name, code, country, city, website_url, institution_type, founding_year, total_students, etc."
    )
    @ApiResponses(
        value = {
            @ApiResponse(
                responseCode = "200",
                description = "Universities uploaded successfully"
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Invalid file format or validation errors"
            ),
            @ApiResponse(
                responseCode = "500",
                description = "Internal server error"
            ),
        }
    )
    public Mono<ResponseEntity<UniversityUploadResponseDto>> uploadUniversities(
        @Parameter(
            description = "Excel or CSV file containing university data",
            required = true
        ) @RequestPart("file") Mono<FilePart> filePartMono
    ) {
        return filePartMono
            .flatMap(filePart -> {
                log.info(
                    "Received Excel file for universities upload: {}",
                    filePart.filename()
                );

                if (!isExcelFile(filePart.filename())) {
                    return Mono.just(
                        ResponseEntity.badRequest().body(
                            UniversityUploadResponseDto.builder()
                                .success(false)
                                .message(
                                    "Invalid file format. Please upload an Excel or CSV file (.xlsx, .xls, or .csv)"
                                )
                                .totalProcessed(0)
                                .createdCount(0)
                                .skippedCount(0)
                                .build()
                        )
                    );
                }

                return filePart
                    .content()
                    .collectList()
                    .map(this::convertToByteArrayInputStream)
                    .flatMap(excelProcessingService::processUniversitiesExcel)
                    .doOnSuccess(dtos ->
                        log.info(
                            "Processed {} universities from Excel",
                            dtos.size()
                        )
                    )
                    .flatMap(excelUploadService::saveUniversitiesFromExcel)
                    .map(this::mapToUniversityUploadResponse)
                    .map(ResponseEntity::ok);
            })
            .onErrorResume(ex -> {
                log.error("Error uploading universities from Excel", ex);
                return Mono.just(
                    ResponseEntity.status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                    ).body(
                        UniversityUploadResponseDto.builder()
                            .success(false)
                            .message(
                                "Error processing file: " + ex.getMessage()
                            )
                            .totalProcessed(0)
                            .createdCount(0)
                            .skippedCount(0)
                            .build()
                    )
                );
            });
    }

    @PostMapping(
        value = "/courses/upload",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(
        summary = "Upload courses from Excel or CSV file",
        description = "Upload an Excel (.xlsx, .xls) or CSV file containing course data. The file should have columns like: university_code, name, course_code, degree_level, duration_years, etc."
    )
    @ApiResponses(
        value = {
            @ApiResponse(
                responseCode = "200",
                description = "Courses uploaded successfully"
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Invalid file format or validation errors"
            ),
            @ApiResponse(
                responseCode = "500",
                description = "Internal server error"
            ),
        }
    )
    public Mono<ResponseEntity<CourseUploadResponseDto>> uploadCourses(
        @Parameter(
            description = "Excel or CSV file containing course data",
            required = true
        ) @RequestPart("file") Mono<FilePart> filePartMono
    ) {
        return filePartMono
            .flatMap(filePart -> {
                log.info(
                    "Received Excel file for courses upload: {}",
                    filePart.filename()
                );

                if (!isExcelFile(filePart.filename())) {
                    return Mono.just(
                        ResponseEntity.badRequest().body(
                            CourseUploadResponseDto.builder()
                                .success(false)
                                .message(
                                    "Invalid file format. Please upload an Excel or CSV file (.xlsx, .xls, or .csv)"
                                )
                                .totalProcessed(0)
                                .createdCount(0)
                                .skippedCount(0)
                                .build()
                        )
                    );
                }

                return filePart
                    .content()
                    .collectList()
                    .map(this::convertToByteArrayInputStream)
                    .flatMap(excelProcessingService::processCoursesExcel)
                    .doOnSuccess(dtos ->
                        log.info("Processed {} courses from Excel", dtos.size())
                    )
                    .flatMap(excelUploadService::saveCoursesFromExcel)
                    .map(this::mapToCourseUploadResponse)
                    .map(ResponseEntity::ok);
            })
            .onErrorResume(ex -> {
                log.error("Error uploading courses from Excel", ex);
                return Mono.just(
                    ResponseEntity.status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                    ).body(
                        CourseUploadResponseDto.builder()
                            .success(false)
                            .message(
                                "Error processing file: " + ex.getMessage()
                            )
                            .totalProcessed(0)
                            .createdCount(0)
                            .skippedCount(0)
                            .build()
                    )
                );
            });
    }

    @GetMapping("/universities/template")
    @Operation(
        summary = "Download universities template",
        description = "Download a sample Excel template for uploading universities"
    )
    public Mono<ResponseEntity<String>> getUniversitiesTemplate() {
        String template = """
            name,code,country,country_code,state,city,address,website_url,email,phone,admissions_email,admissions_phone,institution_type,type,founding_year,total_students,undergraduate_students,graduate_students,faculty_count,world_ranking,national_ranking,qs_ranking,tuition_international_undergraduate,tuition_international_graduate,application_fee,currency,acceptance_rate,application_deadline_fall,application_deadline_spring,toefl_min,ielts_min,testdaf,dsh,affiliations,languages_of_instruction,research_facilities,sports_facilities,student_services,schools_colleges,degree_levels,popular_majors,description,verification_status,status,is_featured,scholarships_available,is_active,client_id,created_by,updated_by
            Example University,EXU,United States,US,California,San Francisco,"123 Main St, San Francisco, CA 94102",https://www.example.edu,info@example.edu,+1-415-555-0100,admissions@example.edu,+1-415-555-0101,PUBLIC,RESEARCH,1950,25000,18000,7000,1500,100,10,95,45000.00,50000.00,100.00,USD,0.15,2024-12-01,2025-05-01,90,6.5,4,2,"Association Example, Research Alliance","English, Spanish","Research Lab, Innovation Center","Sports Complex, Swimming Pool","Career Services, Health Center","School of Engineering, School of Business","Bachelor, Master, Doctorate","Computer Science, Business, Engineering",Leading research university with focus on innovation,VERIFIED,ACTIVE,true,true,true,example_client,system,system
            """;

        return Mono.just(
            ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(
                    "Content-Disposition",
                    "attachment; filename=universities_template.csv"
                )
                .body(template)
        );
    }

    @GetMapping("/courses/template")
    @Operation(
        summary = "Download courses template",
        description = "Download a sample Excel template for uploading courses"
    )
    public Mono<ResponseEntity<String>> getCoursesTemplate() {
        String template = """
            university_code,name,course_code,official_name,degree_level,degree_type,field_of_study,subject_area,academic_department,duration_years,study_mode,tuition_international,tuition_domestic,currency,min_gpa,bachelor_required,master_required,bachelor_philosophy,bachelor_engineering,abitur_required,thesis_required,german_proficiency,english_proficiency,toefl_min,ielts_min,mathematics_prerequisite,physics_prerequisite,chemistry_prerequisite,biology_prerequisite,gre_recommended,gmat_required,prerequisites,languages_of_instruction,specializations,career_outcomes,application_requirements,application_deadline,intake_seasons,total_credits,core_credits,elective_credits,practical_credits,description,learning_outcomes,accreditation,ranking,is_active,status,is_featured,is_online,has_internship,has_thesis,partner_universities,exchange_programs,research_areas,lab_facilities,created_by,updated_by
            EXU,Master of Science in Computer Science,MSc-CS,Master of Science in Computer Science,MASTERS,Master of Science,Computer Science,Engineering,Department of Computer Science,2.0,FULL_TIME,50000.00,35000.00,USD,3.0,true,false,false,false,false,true,,C1,90,6.5,true,false,false,false,true,false,"Bachelor's degree in Computer Science or related field","English","Artificial Intelligence, Data Science, Cybersecurity","Software Engineer, Data Scientist, AI Researcher","CV, Transcripts, Letters of Recommendation, Statement of Purpose",2024-12-01,"Fall, Spring",60,40,15,5,Advanced computer science program with focus on AI and data science,Advanced programming skills; Problem-solving; Research methodology,ABET,Top 50,true,ACTIVE,true,false,true,true,"MIT, Stanford","Erasmus, Exchange Program","Machine Learning, Computer Vision, Natural Language Processing","AI Lab, Computer Science Lab",system,system
            """;

        return Mono.just(
            ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(
                    "Content-Disposition",
                    "attachment; filename=courses_template.csv"
                )
                .body(template)
        );
    }

    private boolean isExcelFile(String filename) {
        if (filename == null) {
            return false;
        }
        String lowerCaseFilename = filename.toLowerCase();
        return (
            lowerCaseFilename.endsWith(".xlsx") ||
            lowerCaseFilename.endsWith(".xls") ||
            lowerCaseFilename.endsWith(".csv")
        );
    }

    private ByteArrayInputStream convertToByteArrayInputStream(
        java.util.List<DataBuffer> dataBuffers
    ) {
        int totalLength = dataBuffers
            .stream()
            .mapToInt(DataBuffer::readableByteCount)
            .sum();

        byte[] bytes = new byte[totalLength];
        int currentIndex = 0;

        for (DataBuffer dataBuffer : dataBuffers) {
            int length = dataBuffer.readableByteCount();
            dataBuffer.read(bytes, currentIndex, length);
            currentIndex += length;
            DataBufferUtils.release(dataBuffer);
        }

        return new ByteArrayInputStream(bytes);
    }

    private UniversityUploadResponseDto mapToUniversityUploadResponse(
        ExcelUploadResultDto<University> result
    ) {
        return UniversityUploadResponseDto.builder()
            .success(result.getSuccess())
            .message(result.getMessage())
            .totalProcessed(result.getTotalProcessed())
            .createdCount(result.getCreatedCount())
            .skippedCount(result.getSkippedCount())
            .created(
                result
                    .getCreated()
                    .stream()
                    .map(this::mapToUniversityInfo)
                    .collect(Collectors.toList())
            )
            .skipped(
                result
                    .getSkipped()
                    .stream()
                    .map(this::mapToSkippedRecordInfo)
                    .collect(Collectors.toList())
            )
            .build();
    }

    private CourseUploadResponseDto mapToCourseUploadResponse(
        ExcelUploadResultDto<Course> result
    ) {
        return CourseUploadResponseDto.builder()
            .success(result.getSuccess())
            .message(result.getMessage())
            .totalProcessed(result.getTotalProcessed())
            .createdCount(result.getCreatedCount())
            .skippedCount(result.getSkippedCount())
            .created(
                result
                    .getCreated()
                    .stream()
                    .map(this::mapToCourseInfo)
                    .collect(Collectors.toList())
            )
            .skipped(
                result
                    .getSkipped()
                    .stream()
                    .map(this::mapToCourseSkippedRecordInfo)
                    .collect(Collectors.toList())
            )
            .build();
    }

    private UniversityUploadResponseDto.UniversityInfo mapToUniversityInfo(
        University university
    ) {
        String country = extractFromJsonData(university, "country");
        String city = extractFromJsonData(university, "city");

        return UniversityUploadResponseDto.UniversityInfo.builder()
            .id(university.getId())
            .name(university.getName())
            .code(university.getCode())
            .country(country)
            .city(city)
            .isActive(university.getIsActive())
            .build();
    }

    private CourseUploadResponseDto.CourseInfo mapToCourseInfo(Course course) {
        String degreeLevel = extractFromJsonData(course, "degree_level");
        String degreeType = extractFromJsonData(course, "degree_type");

        return CourseUploadResponseDto.CourseInfo.builder()
            .id(course.getId())
            .name(course.getName())
            .courseCode(course.getCourseCode())
            .universityCode(null) // Could be enhanced to fetch university code
            .degreeLevel(degreeLevel)
            .degreeType(degreeType)
            .isActive(course.getIsActive())
            .build();
    }

    private UniversityUploadResponseDto.SkippedRecordInfo mapToSkippedRecordInfo(
        ExcelUploadResultDto.SkippedRecord skipped
    ) {
        return UniversityUploadResponseDto.SkippedRecordInfo.builder()
            .identifier(skipped.getIdentifier())
            .reason(skipped.getReason())
            .details(skipped.getDetails())
            .build();
    }

    private CourseUploadResponseDto.SkippedRecordInfo mapToCourseSkippedRecordInfo(
        ExcelUploadResultDto.SkippedRecord skipped
    ) {
        return CourseUploadResponseDto.SkippedRecordInfo.builder()
            .identifier(skipped.getIdentifier())
            .reason(skipped.getReason())
            .details(skipped.getDetails())
            .build();
    }

    private String extractFromJsonData(Object entity, String key) {
        try {
            if (entity instanceof University) {
                University university = (University) entity;
                if (university.getData() != null) {
                    String jsonString = university.getData().asString();
                    return extractJsonValue(jsonString, key);
                }
            } else if (entity instanceof Course) {
                Course course = (Course) entity;
                if (course.getData() != null) {
                    String jsonString = course.getData().asString();
                    return extractJsonValue(jsonString, key);
                }
            }
        } catch (Exception e) {
            log.debug("Could not extract {} from JSON data", key);
        }
        return null;
    }

    private String extractJsonValue(String jsonString, String key) {
        try {
            int keyIndex = jsonString.indexOf("\"" + key + "\"");
            if (keyIndex == -1) return null;

            int colonIndex = jsonString.indexOf(":", keyIndex);
            if (colonIndex == -1) return null;

            int valueStart = jsonString.indexOf("\"", colonIndex);
            if (valueStart == -1) return null;

            int valueEnd = jsonString.indexOf("\"", valueStart + 1);
            if (valueEnd == -1) return null;

            return jsonString.substring(valueStart + 1, valueEnd);
        } catch (Exception e) {
            return null;
        }
    }
}

package com.uniflow.university.service;

import com.uniflow.university.dto.CourseExcelDto;
import com.uniflow.university.dto.UniversityExcelDto;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class ExcelProcessingService {

    private final Validator validator;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Allowed countries for restriction
    private static final Set<String> ALLOWED_COUNTRY_NAMES = Set.of(
            "GERMANY",
            "DEUTSCHLAND",
            "UNITED KINGDOM",
            "UK",
            "GREAT BRITAIN",
            "ENGLAND",
            "SCOTLAND",
            "WALES",
            "DE",
            "GB");

    public ExcelProcessingService(Validator validator) {
        this.validator = validator;
    }

    public Mono<List<UniversityExcelDto>> processUniversitiesExcel(
            InputStream inputStream) {
        return Mono.fromCallable(() -> {
            List<UniversityExcelDto> universities = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            // Reset inputStream to detect file type
            if (!inputStream.markSupported()) {
                throw new IllegalArgumentException(
                        "InputStream must support mark/reset");
            }

            inputStream.mark(8);
            byte[] header = new byte[8];
            inputStream.read(header);
            inputStream.reset();

            boolean isCsv = !isExcelFile(header);

            if (isCsv) {
                return processUniversitiesCsv(inputStream);
            }

            try (Workbook workbook = createWorkbook(inputStream, header)) {
                Sheet sheet = workbook.getSheetAt(0);

                // Get header row
                Row headerRow = sheet.getRow(0);
                if (headerRow == null) {
                    throw new IllegalArgumentException(
                            "Excel file must have a header row");
                }

                Map<String, Integer> columnMap = createColumnMap(headerRow);
                validateUniversityColumns(columnMap);

                // Process data rows
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null || isEmptyRow(row)) {
                        continue;
                    }

                    try {
                        UniversityExcelDto university = parseUniversityRow(
                                row,
                                columnMap);

                        // Validate the DTO
                        Set<ConstraintViolation<UniversityExcelDto>> violations = validator.validate(university);
                        if (!violations.isEmpty()) {
                            String violationMessages = violations
                                    .stream()
                                    .map(ConstraintViolation::getMessage)
                                    .collect(Collectors.joining(", "));
                            errors.add(
                                    "Row " + (i + 1) + ": " + violationMessages);
                        } else {
                            universities.add(university);
                        }
                    } catch (Exception e) {
                        errors.add("Row " + (i + 1) + ": " + e.getMessage());
                        log.error(
                                "Error processing university row {}: {}",
                                i + 1,
                                e.getMessage());
                    }
                }

                if (!errors.isEmpty()) {
                    throw new IllegalArgumentException(
                            "Validation errors found:\n" + String.join("\n", errors));
                }

                log.info(
                        "Successfully processed {} universities from Excel",
                        universities.size());
                return universities;
            } catch (Exception e) {
                log.error("Error processing universities Excel file", e);
                throw new RuntimeException(
                        "Failed to process Excel file: " + e.getMessage(),
                        e);
            }
        });
    }

    public Mono<List<CourseExcelDto>> processCoursesExcel(
            InputStream inputStream) {
        return Mono.fromCallable(() -> {
            List<CourseExcelDto> courses = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            // Reset inputStream to detect file type
            if (!inputStream.markSupported()) {
                throw new IllegalArgumentException(
                        "InputStream must support mark/reset");
            }

            inputStream.mark(8);
            byte[] header = new byte[8];
            inputStream.read(header);
            inputStream.reset();

            boolean isCsv = !isExcelFile(header);

            if (isCsv) {
                return processCoursesCsv(inputStream);
            }

            try (Workbook workbook = createWorkbook(inputStream, header)) {
                Sheet sheet = workbook.getSheetAt(0);

                // Get header row
                Row headerRow = sheet.getRow(0);
                if (headerRow == null) {
                    throw new IllegalArgumentException(
                            "Excel file must have a header row");
                }

                Map<String, Integer> columnMap = createColumnMap(headerRow);
                validateCourseColumns(columnMap);

                // Process data rows
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null || isEmptyRow(row)) {
                        continue;
                    }

                    try {
                        CourseExcelDto course = parseCourseRow(row, columnMap);

                        // Validate the DTO
                        Set<ConstraintViolation<CourseExcelDto>> violations = validator.validate(course);
                        if (!violations.isEmpty()) {
                            String violationMessages = violations
                                    .stream()
                                    .map(ConstraintViolation::getMessage)
                                    .collect(Collectors.joining(", "));
                            errors.add(
                                    "Row " + (i + 1) + ": " + violationMessages);
                        } else {
                            courses.add(course);
                        }
                    } catch (Exception e) {
                        errors.add("Row " + (i + 1) + ": " + e.getMessage());
                        log.error(
                                "Error processing course row {}: {}",
                                i + 1,
                                e.getMessage());
                    }
                }

                if (!errors.isEmpty()) {
                    throw new IllegalArgumentException(
                            "Validation errors found:\n" + String.join("\n", errors));
                }

                log.info(
                        "Successfully processed {} courses from Excel",
                        courses.size());
                return courses;
            } catch (Exception e) {
                log.error("Error processing courses Excel file", e);
                throw new RuntimeException(
                        "Failed to process Excel file: " + e.getMessage(),
                        e);
            }
        });
    }

    private Map<String, Integer> createColumnMap(Row headerRow) {
        Map<String, Integer> columnMap = new HashMap<>();
        for (Cell cell : headerRow) {
            if (cell.getCellType() == CellType.STRING) {
                String columnName = cell
                        .getStringCellValue()
                        .trim()
                        .toLowerCase();
                columnMap.put(columnName, cell.getColumnIndex());
            }
        }
        return columnMap;
    }

    private void validateUniversityColumns(Map<String, Integer> columnMap) {
        List<String> requiredColumns = Arrays.asList("name", "country");
        List<String> missingColumns = requiredColumns
                .stream()
                .filter(col -> !columnMap.containsKey(col))
                .collect(Collectors.toList());

        if (!missingColumns.isEmpty()) {
            throw new IllegalArgumentException(
                    "Missing required columns: " + String.join(", ", missingColumns));
        }
    }

    private void validateCourseColumns(Map<String, Integer> columnMap) {
        List<String> requiredColumns = Arrays.asList(
                "university_code",
                "name",
                "degree_level",
                "degree_type",
                "field_of_study");
        List<String> missingColumns = requiredColumns
                .stream()
                .filter(col -> !columnMap.containsKey(col))
                .collect(Collectors.toList());

        if (!missingColumns.isEmpty()) {
            throw new IllegalArgumentException(
                    "Missing required columns: " + String.join(", ", missingColumns));
        }
    }

    private UniversityExcelDto parseUniversityRow(
            Row row,
            Map<String, Integer> columnMap) {
        UniversityExcelDto.UniversityExcelDtoBuilder builder = UniversityExcelDto.builder();

        // Required fields
        String name = getStringValue(row, columnMap, "name");
        String country = getStringValue(row, columnMap, "country");

        validateCountry(country);

        builder.name(name);
        builder.country(country);

        // Optional basic fields
        builder.code(getStringValue(row, columnMap, "code"));
        builder.countryCode(getStringValue(row, columnMap, "country_code"));
        builder.state(getStringValue(row, columnMap, "state"));
        builder.city(getStringValue(row, columnMap, "city"));
        builder.address(getStringValue(row, columnMap, "address"));

        // Contact information
        builder.websiteUrl(getStringValue(row, columnMap, "website_url"));
        builder.email(getStringValue(row, columnMap, "email"));
        builder.phone(getStringValue(row, columnMap, "phone"));
        builder.admissionsEmail(
                getStringValue(row, columnMap, "admissions_email"));
        builder.admissionsPhone(
                getStringValue(row, columnMap, "admissions_phone"));

        // Institution details
        builder.institutionType(
                getStringValue(row, columnMap, "institution_type"));
        builder.type(getStringValue(row, columnMap, "type"));
        builder.foundingYear(getIntegerValue(row, columnMap, "founding_year"));

        // Statistics
        builder.totalStudents(
                getIntegerValue(row, columnMap, "total_students"));
        builder.undergraduateStudents(
                getIntegerValue(row, columnMap, "undergraduate_students"));
        builder.graduateStudents(
                getIntegerValue(row, columnMap, "graduate_students"));
        builder.facultyCount(getIntegerValue(row, columnMap, "faculty_count"));

        // Rankings
        builder.worldRanking(getIntegerValue(row, columnMap, "world_ranking"));
        builder.nationalRanking(
                getIntegerValue(row, columnMap, "national_ranking"));
        builder.qsRanking(getIntegerValue(row, columnMap, "qs_ranking"));

        // Financial
        builder.tuitionInternationalUndergraduate(
                getBigDecimalValue(
                        row,
                        columnMap,
                        "tuition_international_undergraduate"));
        builder.tuitionInternationalGraduate(
                getBigDecimalValue(row, columnMap, "tuition_international_graduate"));
        builder.applicationFee(
                getBigDecimalValue(row, columnMap, "application_fee"));
        builder.currency(getStringValue(row, columnMap, "currency"));
        builder.acceptanceRate(
                getBigDecimalValue(row, columnMap, "acceptance_rate"));

        // Dates
        builder.applicationDeadlineFall(
                getDateValue(row, columnMap, "application_deadline_fall"));
        builder.applicationDeadlineSpring(
                getDateValue(row, columnMap, "application_deadline_spring"));

        // English requirements
        builder.toeflMin(getIntegerValue(row, columnMap, "toefl_min"));
        // Skip ielts_min, testdaf, dsh to avoid parsing issues
        // builder.ieltsMin(getBigDecimalValue(row, columnMap, "ielts_min"));
        // builder.testDaF(getIntegerValue(row, columnMap, "testdaf"));
        // builder.dsh(getIntegerValue(row, columnMap, "dsh"));

        // Lists (comma-separated)
        builder.affiliations(getStringValue(row, columnMap, "affiliations"));
        builder.languagesOfInstruction(
                getStringValue(row, columnMap, "languages_of_instruction"));
        builder.researchFacilities(
                getStringValue(row, columnMap, "research_facilities"));
        builder.sportsFacilities(
                getStringValue(row, columnMap, "sports_facilities"));
        builder.studentServices(
                getStringValue(row, columnMap, "student_services"));
        builder.schoolsColleges(
                getStringValue(row, columnMap, "schools_colleges"));
        builder.degreeLevels(getStringValue(row, columnMap, "degree_levels"));
        builder.popularMajors(getStringValue(row, columnMap, "popular_majors"));

        // Status and metadata
        builder.description(getStringValue(row, columnMap, "description"));
        builder.verificationStatus(
                getStringValue(row, columnMap, "verification_status"));
        builder.status(getStringValue(row, columnMap, "status"));
        builder.isFeatured(getBooleanValue(row, columnMap, "is_featured"));
        builder.scholarshipsAvailable(
                getBooleanValue(row, columnMap, "scholarships_available"));
        builder.isActive(getBooleanValue(row, columnMap, "is_active", true)); // Default to true
        builder.clientId(getStringValue(row, columnMap, "client_id"));

        // Audit
        builder.createdBy(
                getStringValue(row, columnMap, "created_by", "excel_upload"));
        builder.updatedBy(
                getStringValue(row, columnMap, "updated_by", "excel_upload"));

        return builder.build();
    }

    private CourseExcelDto parseCourseRow(
            Row row,
            Map<String, Integer> columnMap) {
        CourseExcelDto.CourseExcelDtoBuilder builder = CourseExcelDto.builder();

        // Required fields
        builder.universityCode(
                getStringValue(row, columnMap, "university_code"));
        builder.name(getStringValue(row, columnMap, "name"));
        builder.degreeLevel(getStringValue(row, columnMap, "degree_level"));
        builder.degreeType(getStringValue(row, columnMap, "degree_type"));
        builder.fieldOfStudy(getStringValue(row, columnMap, "field_of_study"));

        // Optional fields
        builder.courseCode(getStringValue(row, columnMap, "course_code"));
        builder.officialName(getStringValue(row, columnMap, "official_name"));
        builder.subjectArea(getStringValue(row, columnMap, "subject_area"));
        builder.academicDepartment(
                getStringValue(row, columnMap, "academic_department"));

        // Duration and mode
        builder.durationYears(
                getBigDecimalValue(row, columnMap, "duration_years"));
        builder.studyMode(getStringValue(row, columnMap, "study_mode"));

        // Financial
        builder.tuitionInternational(
                getBigDecimalValue(row, columnMap, "tuition_international"));
        builder.tuitionDomestic(
                getBigDecimalValue(row, columnMap, "tuition_domestic"));
        builder.currency(getStringValue(row, columnMap, "currency"));

        // Admission requirements
        builder.minGpa(getBigDecimalValue(row, columnMap, "min_gpa"));
        builder.bachelorRequired(
                getBooleanValue(row, columnMap, "bachelor_required"));
        builder.masterRequired(
                getBooleanValue(row, columnMap, "master_required"));
        builder.bachelorPhilosophy(
                getBooleanValue(row, columnMap, "bachelor_philosophy"));
        builder.bachelorEngineering(
                getBooleanValue(row, columnMap, "bachelor_engineering"));
        builder.abiturRequired(
                getBooleanValue(row, columnMap, "abitur_required"));
        builder.thesisRequired(
                getBooleanValue(row, columnMap, "thesis_required"));

        // Language requirements
        builder.germanProficiency(
                getStringValue(row, columnMap, "german_proficiency"));
        builder.englishProficiency(
                getStringValue(row, columnMap, "english_proficiency"));
        builder.toeflMin(getIntegerValue(row, columnMap, "toefl_min"));
        builder.ieltsMin(getBigDecimalValue(row, columnMap, "ielts_min"));

        // Prerequisites
        builder.mathematicsPrerequisite(
                getBooleanValue(row, columnMap, "mathematics_prerequisite"));
        builder.physicsPrerequisite(
                getBooleanValue(row, columnMap, "physics_prerequisite"));
        builder.chemistryPrerequisite(
                getBooleanValue(row, columnMap, "chemistry_prerequisite"));
        builder.biologyPrerequisite(
                getBooleanValue(row, columnMap, "biology_prerequisite"));
        builder.greRecommended(
                getBooleanValue(row, columnMap, "gre_recommended"));
        builder.gmatRequired(getBooleanValue(row, columnMap, "gmat_required"));

        // Lists and additional info
        builder.prerequisites(getStringValue(row, columnMap, "prerequisites"));
        builder.languagesOfInstruction(
                getStringValue(row, columnMap, "languages_of_instruction"));
        builder.specializations(
                getStringValue(row, columnMap, "specializations"));
        builder.careerOutcomes(
                getStringValue(row, columnMap, "career_outcomes"));
        builder.applicationRequirements(
                getStringValue(row, columnMap, "application_requirements"));
        builder.applicationDeadline(
                getStringValue(row, columnMap, "application_deadline"));
        builder.intakeSeasons(getStringValue(row, columnMap, "intake_seasons"));

        // Course structure
        builder.totalCredits(getIntegerValue(row, columnMap, "total_credits"));
        builder.coreCredits(getIntegerValue(row, columnMap, "core_credits"));
        builder.electiveCredits(
                getIntegerValue(row, columnMap, "elective_credits"));
        builder.practicalCredits(
                getIntegerValue(row, columnMap, "practical_credits"));

        // Metadata
        builder.description(getStringValue(row, columnMap, "description"));
        builder.learningOutcomes(
                getStringValue(row, columnMap, "learning_outcomes"));
        builder.accreditation(getStringValue(row, columnMap, "accreditation"));
        builder.ranking(getStringValue(row, columnMap, "ranking"));

        // Status
        builder.isActive(getBooleanValue(row, columnMap, "is_active", true));
        builder.status(getStringValue(row, columnMap, "status"));
        builder.isFeatured(getBooleanValue(row, columnMap, "is_featured"));
        builder.isOnline(getBooleanValue(row, columnMap, "is_online"));
        builder.hasInternship(
                getBooleanValue(row, columnMap, "has_internship"));
        builder.hasThesis(getBooleanValue(row, columnMap, "has_thesis"));

        // Partnership
        builder.partnerUniversities(
                getStringValue(row, columnMap, "partner_universities"));
        builder.exchangePrograms(
                getStringValue(row, columnMap, "exchange_programs"));

        // Research
        builder.researchAreas(getStringValue(row, columnMap, "research_areas"));
        builder.labFacilities(getStringValue(row, columnMap, "lab_facilities"));

        // Audit
        builder.createdBy(
                getStringValue(row, columnMap, "created_by", "excel_upload"));
        builder.updatedBy(
                getStringValue(row, columnMap, "updated_by", "excel_upload"));

        return builder.build();
    }

    // Helper methods for value extraction
    private String getStringValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName) {
        return getStringValue(row, columnMap, columnName, null);
    }

    private String getStringValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName,
            String defaultValue) {
        Integer columnIndex = columnMap.get(columnName);
        if (columnIndex == null) {
            return defaultValue;
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return defaultValue;
        }

        switch (cell.getCellType()) {
            case STRING:
                String value = cell.getStringCellValue().trim();
                return value.isEmpty() ? defaultValue : value;
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return defaultValue;
        }
    }

    private Integer getIntegerValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName) {
        Integer columnIndex = columnMap.get(columnName);
        if (columnIndex == null) {
            return null;
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case NUMERIC:
                return (int) cell.getNumericCellValue();
            case STRING:
                String stringValue = cell.getStringCellValue().trim();
                if (stringValue.isEmpty()) {
                    return null;
                }
                try {
                    return Integer.parseInt(stringValue);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException(
                            "Invalid integer value: " + stringValue);
                }
            default:
                return null;
        }
    }

    private BigDecimal getBigDecimalValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName) {
        Integer columnIndex = columnMap.get(columnName);
        if (columnIndex == null) {
            return null;
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case NUMERIC:
                return BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING:
                String stringValue = cell.getStringCellValue().trim();
                if (stringValue.isEmpty()) {
                    return null;
                }
                try {
                    return new BigDecimal(stringValue);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException(
                            "Invalid decimal value: " + stringValue);
                }
            default:
                return null;
        }
    }

    private Boolean getBooleanValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName) {
        return getBooleanValue(row, columnMap, columnName, null);
    }

    private Boolean getBooleanValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName,
            Boolean defaultValue) {
        Integer columnIndex = columnMap.get(columnName);
        if (columnIndex == null) {
            return defaultValue;
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return defaultValue;
        }

        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String stringValue = cell
                        .getStringCellValue()
                        .trim()
                        .toLowerCase();
                if (stringValue.isEmpty()) {
                    return defaultValue;
                }
                return ("true".equals(stringValue) ||
                        "yes".equals(stringValue) ||
                        "1".equals(stringValue));
            case NUMERIC:
                return cell.getNumericCellValue() != 0;
            default:
                return defaultValue;
        }
    }

    private LocalDate getDateValue(
            Row row,
            Map<String, Integer> columnMap,
            String columnName) {
        Integer columnIndex = columnMap.get(columnName);
        if (columnIndex == null) {
            return null;
        }

        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toLocalDate();
                } else {
                    throw new IllegalArgumentException("Invalid date format");
                }
            case STRING:
                String stringValue = cell.getStringCellValue().trim();
                if (stringValue.isEmpty()) {
                    return null;
                }
                try {
                    return LocalDate.parse(stringValue, DATE_FORMATTER);
                } catch (DateTimeParseException e) {
                    throw new IllegalArgumentException(
                            "Invalid date format. Expected: yyyy-MM-dd, got: " +
                                    stringValue);
                }
            default:
                return null;
        }
    }

    private boolean isEmptyRow(Row row) {
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                switch (cell.getCellType()) {
                    case STRING:
                        if (!cell.getStringCellValue().trim().isEmpty()) {
                            return false;
                        }
                        break;
                    case NUMERIC:
                    case BOOLEAN:
                        return false;
                    default:
                        break;
                }
            }
        }
        return true;
    }

    private boolean isExcelFile(byte[] header) {
        // Check for Excel file signatures
        if (header.length >= 8) {
            // XLSX signature (ZIP file starting with PK)
            if (header[0] == 0x50 && header[1] == 0x4B) {
                return true;
            }
            // XLS signature
            if (header[0] == (byte) 0xD0 &&
                    header[1] == (byte) 0xCF &&
                    header[2] == 0x11 &&
                    header[3] == (byte) 0xE0) {
                return true;
            }
        }
        return false;
    }

    private Workbook createWorkbook(InputStream inputStream, byte[] header)
            throws Exception {
        if (header[0] == 0x50 && header[1] == 0x4B) {
            // XLSX file
            return new XSSFWorkbook(inputStream);
        } else {
            // XLS file
            return new HSSFWorkbook(inputStream);
        }
    }

    private List<UniversityExcelDto> processUniversitiesCsv(
            InputStream inputStream) throws Exception {
        List<UniversityExcelDto> universities = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(inputStream))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IllegalArgumentException(
                        "CSV file must have a header row");
            }

            String[] headers = headerLine.split(",");
            Map<String, Integer> columnMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                columnMap.put(headers[i].trim().toLowerCase(), i);
            }

            validateUniversityColumns(columnMap);

            String line;
            int rowNumber = 2; // Starting from row 2 (after header)
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    String[] values = parseCsvLine(line);
                    UniversityExcelDto university = parseUniversityCsvRow(
                            values,
                            columnMap);

                    // Validate the DTO
                    Set<ConstraintViolation<UniversityExcelDto>> violations = validator.validate(university);
                    if (!violations.isEmpty()) {
                        String violationMessages = violations
                                .stream()
                                .map(ConstraintViolation::getMessage)
                                .collect(Collectors.joining(", "));
                        errors.add(
                                "Row " + rowNumber + ": " + violationMessages);
                    } else {
                        universities.add(university);
                    }
                } catch (Exception e) {
                    errors.add("Row " + rowNumber + ": " + e.getMessage());
                    log.error(
                            "Error processing university row {}: {}",
                            rowNumber,
                            e.getMessage());
                }
                rowNumber++;
            }

            if (!errors.isEmpty()) {
                throw new IllegalArgumentException(
                        "Validation errors found:\n" + String.join("\n", errors));
            }

            log.info(
                    "Successfully processed {} universities from CSV",
                    universities.size());
            return universities;
        }
    }

    private List<CourseExcelDto> processCoursesCsv(InputStream inputStream)
            throws Exception {
        List<CourseExcelDto> courses = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(inputStream))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new IllegalArgumentException(
                        "CSV file must have a header row");
            }

            String[] headers = headerLine.split(",");
            Map<String, Integer> columnMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                columnMap.put(headers[i].trim().toLowerCase(), i);
            }

            validateCourseColumns(columnMap);

            String line;
            int rowNumber = 2; // Starting from row 2 (after header)
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    String[] values = parseCsvLine(line);
                    CourseExcelDto course = parseCourseCsvRow(
                            values,
                            columnMap);

                    // Validate the DTO
                    Set<ConstraintViolation<CourseExcelDto>> violations = validator.validate(course);
                    if (!violations.isEmpty()) {
                        String violationMessages = violations
                                .stream()
                                .map(ConstraintViolation::getMessage)
                                .collect(Collectors.joining(", "));
                        errors.add(
                                "Row " + rowNumber + ": " + violationMessages);
                    } else {
                        courses.add(course);
                    }
                } catch (Exception e) {
                    errors.add("Row " + rowNumber + ": " + e.getMessage());
                    log.error(
                            "Error processing course row {}: {}",
                            rowNumber,
                            e.getMessage());
                }
                rowNumber++;
            }

            if (!errors.isEmpty()) {
                throw new IllegalArgumentException(
                        "Validation errors found:\n" + String.join("\n", errors));
            }

            log.info(
                    "Successfully processed {} courses from CSV",
                    courses.size());
            return courses;
        }
    }

    private String[] parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentValue = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(currentValue.toString().trim());
                currentValue = new StringBuilder();
            } else {
                currentValue.append(c);
            }
        }

        values.add(currentValue.toString().trim());
        return values.toArray(new String[0]);
    }

    private UniversityExcelDto parseUniversityCsvRow(
            String[] values,
            Map<String, Integer> columnMap) {
        UniversityExcelDto.UniversityExcelDtoBuilder builder = UniversityExcelDto.builder();

        // Required fields
        String name = getCsvValue(values, columnMap, "name");
        String country = getCsvValue(values, columnMap, "country");

        validateCountry(country);

        builder.name(name);
        builder.country(country);

        // Optional basic fields
        builder.code(getCsvValue(values, columnMap, "code"));
        builder.countryCode(getCsvValue(values, columnMap, "country_code"));
        builder.state(getCsvValue(values, columnMap, "state"));
        builder.city(getCsvValue(values, columnMap, "city"));
        builder.address(getCsvValue(values, columnMap, "address"));

        // Contact information
        builder.websiteUrl(getCsvValue(values, columnMap, "website_url"));
        builder.email(getCsvValue(values, columnMap, "email"));
        builder.phone(getCsvValue(values, columnMap, "phone"));
        builder.admissionsEmail(
                getCsvValue(values, columnMap, "admissions_email"));
        builder.admissionsPhone(
                getCsvValue(values, columnMap, "admissions_phone"));

        // Institution details
        builder.institutionType(
                getCsvValue(values, columnMap, "institution_type"));
        builder.type(getCsvValue(values, columnMap, "type"));
        builder.foundingYear(
                getCsvIntegerValue(values, columnMap, "founding_year"));

        // Statistics
        builder.totalStudents(
                getCsvIntegerValue(values, columnMap, "total_students"));
        builder.undergraduateStudents(
                getCsvIntegerValue(values, columnMap, "undergraduate_students"));
        builder.graduateStudents(
                getCsvIntegerValue(values, columnMap, "graduate_students"));
        builder.facultyCount(
                getCsvIntegerValue(values, columnMap, "faculty_count"));

        // Rankings
        builder.worldRanking(
                getCsvIntegerValue(values, columnMap, "world_ranking"));
        builder.nationalRanking(
                getCsvIntegerValue(values, columnMap, "national_ranking"));
        builder.qsRanking(getCsvIntegerValue(values, columnMap, "qs_ranking"));

        // Financial
        builder.tuitionInternationalUndergraduate(
                getCsvBigDecimalValue(
                        values,
                        columnMap,
                        "tuition_international_undergraduate"));
        builder.tuitionInternationalGraduate(
                getCsvBigDecimalValue(
                        values,
                        columnMap,
                        "tuition_international_graduate"));
        builder.applicationFee(
                getCsvBigDecimalValue(values, columnMap, "application_fee"));
        builder.currency(getCsvValue(values, columnMap, "currency"));
        builder.acceptanceRate(
                getCsvBigDecimalValue(values, columnMap, "acceptance_rate"));

        // Dates
        builder.applicationDeadlineFall(
                getCsvDateValue(values, columnMap, "application_deadline_fall"));
        builder.applicationDeadlineSpring(
                getCsvDateValue(values, columnMap, "application_deadline_spring"));

        // English requirements
        builder.toeflMin(getCsvIntegerValue(values, columnMap, "toefl_min"));
        // Skip ielts_min, testdaf, dsh to avoid parsing issues
        // builder.ieltsMin(getCsvBigDecimalValue(values, columnMap, "ielts_min"));
        // builder.testDaF(getCsvIntegerValue(values, columnMap, "testdaf"));
        // builder.dsh(getCsvIntegerValue(values, columnMap, "dsh"));

        // Lists (comma-separated)
        builder.affiliations(getCsvValue(values, columnMap, "affiliations"));
        builder.languagesOfInstruction(
                getCsvValue(values, columnMap, "languages_of_instruction"));
        builder.researchFacilities(
                getCsvValue(values, columnMap, "research_facilities"));
        builder.sportsFacilities(
                getCsvValue(values, columnMap, "sports_facilities"));
        builder.studentServices(
                getCsvValue(values, columnMap, "student_services"));
        builder.schoolsColleges(
                getCsvValue(values, columnMap, "schools_colleges"));
        builder.degreeLevels(getCsvValue(values, columnMap, "degree_levels"));
        builder.popularMajors(getCsvValue(values, columnMap, "popular_majors"));

        // Status and metadata
        builder.description(getCsvValue(values, columnMap, "description"));
        builder.verificationStatus(
                getCsvValue(values, columnMap, "verification_status"));
        builder.status(getCsvValue(values, columnMap, "status"));
        builder.isFeatured(
                getCsvBooleanValue(values, columnMap, "is_featured"));
        builder.scholarshipsAvailable(
                getCsvBooleanValue(values, columnMap, "scholarships_available"));
        builder.isActive(
                getCsvBooleanValue(values, columnMap, "is_active", true));
        builder.clientId(getCsvValue(values, columnMap, "client_id"));

        // Audit
        builder.createdBy(
                getCsvValue(values, columnMap, "created_by", "excel_upload"));
        builder.updatedBy(
                getCsvValue(values, columnMap, "updated_by", "excel_upload"));

        return builder.build();
    }

    private CourseExcelDto parseCourseCsvRow(
            String[] values,
            Map<String, Integer> columnMap) {
        CourseExcelDto.CourseExcelDtoBuilder builder = CourseExcelDto.builder();

        // Required fields
        builder.universityCode(
                getCsvValue(values, columnMap, "university_code"));
        builder.name(getCsvValue(values, columnMap, "name"));
        builder.degreeLevel(getCsvValue(values, columnMap, "degree_level"));
        builder.degreeType(getCsvValue(values, columnMap, "degree_type"));
        builder.fieldOfStudy(getCsvValue(values, columnMap, "field_of_study"));

        // Optional fields
        builder.courseCode(getCsvValue(values, columnMap, "course_code"));
        builder.officialName(getCsvValue(values, columnMap, "official_name"));
        builder.subjectArea(getCsvValue(values, columnMap, "subject_area"));
        builder.academicDepartment(
                getCsvValue(values, columnMap, "academic_department"));

        // Duration and mode
        builder.durationYears(
                getCsvBigDecimalValue(values, columnMap, "duration_years"));
        builder.studyMode(getCsvValue(values, columnMap, "study_mode"));

        // Financial
        builder.tuitionInternational(
                getCsvBigDecimalValue(values, columnMap, "tuition_international"));
        builder.tuitionDomestic(
                getCsvBigDecimalValue(values, columnMap, "tuition_domestic"));
        builder.currency(getCsvValue(values, columnMap, "currency"));

        // Admission requirements
        builder.minGpa(getCsvBigDecimalValue(values, columnMap, "min_gpa"));
        builder.bachelorRequired(
                getCsvBooleanValue(values, columnMap, "bachelor_required"));
        builder.masterRequired(
                getCsvBooleanValue(values, columnMap, "master_required"));
        builder.bachelorPhilosophy(
                getCsvBooleanValue(values, columnMap, "bachelor_philosophy"));
        builder.bachelorEngineering(
                getCsvBooleanValue(values, columnMap, "bachelor_engineering"));
        builder.abiturRequired(
                getCsvBooleanValue(values, columnMap, "abitur_required"));
        builder.thesisRequired(
                getCsvBooleanValue(values, columnMap, "thesis_required"));

        // Language requirements
        builder.germanProficiency(
                getCsvValue(values, columnMap, "german_proficiency"));
        builder.englishProficiency(
                getCsvValue(values, columnMap, "english_proficiency"));
        builder.toeflMin(getCsvIntegerValue(values, columnMap, "toefl_min"));
        builder.ieltsMin(getCsvBigDecimalValue(values, columnMap, "ielts_min"));

        // Prerequisites
        builder.mathematicsPrerequisite(
                getCsvBooleanValue(values, columnMap, "mathematics_prerequisite"));
        builder.physicsPrerequisite(
                getCsvBooleanValue(values, columnMap, "physics_prerequisite"));
        builder.chemistryPrerequisite(
                getCsvBooleanValue(values, columnMap, "chemistry_prerequisite"));
        builder.biologyPrerequisite(
                getCsvBooleanValue(values, columnMap, "biology_prerequisite"));
        builder.greRecommended(
                getCsvBooleanValue(values, columnMap, "gre_recommended"));
        builder.gmatRequired(
                getCsvBooleanValue(values, columnMap, "gmat_required"));

        // Lists and additional info
        builder.prerequisites(getCsvValue(values, columnMap, "prerequisites"));
        builder.languagesOfInstruction(
                getCsvValue(values, columnMap, "languages_of_instruction"));
        builder.specializations(
                getCsvValue(values, columnMap, "specializations"));
        builder.careerOutcomes(
                getCsvValue(values, columnMap, "career_outcomes"));
        builder.applicationRequirements(
                getCsvValue(values, columnMap, "application_requirements"));
        builder.applicationDeadline(
                getCsvValue(values, columnMap, "application_deadline"));
        builder.intakeSeasons(getCsvValue(values, columnMap, "intake_seasons"));

        // Course structure
        builder.totalCredits(
                getCsvIntegerValue(values, columnMap, "total_credits"));
        builder.coreCredits(
                getCsvIntegerValue(values, columnMap, "core_credits"));
        builder.electiveCredits(
                getCsvIntegerValue(values, columnMap, "elective_credits"));
        builder.practicalCredits(
                getCsvIntegerValue(values, columnMap, "practical_credits"));

        // Metadata
        builder.description(getCsvValue(values, columnMap, "description"));
        builder.learningOutcomes(
                getCsvValue(values, columnMap, "learning_outcomes"));
        builder.accreditation(getCsvValue(values, columnMap, "accreditation"));
        builder.ranking(getCsvValue(values, columnMap, "ranking"));

        // Status
        builder.isActive(
                getCsvBooleanValue(values, columnMap, "is_active", true));
        builder.status(getCsvValue(values, columnMap, "status"));
        builder.isFeatured(
                getCsvBooleanValue(values, columnMap, "is_featured"));
        builder.isOnline(getCsvBooleanValue(values, columnMap, "is_online"));
        builder.hasInternship(
                getCsvBooleanValue(values, columnMap, "has_internship"));
        builder.hasThesis(getCsvBooleanValue(values, columnMap, "has_thesis"));

        // Partnership
        builder.partnerUniversities(
                getCsvValue(values, columnMap, "partner_universities"));
        builder.exchangePrograms(
                getCsvValue(values, columnMap, "exchange_programs"));

        // Research
        builder.researchAreas(getCsvValue(values, columnMap, "research_areas"));
        builder.labFacilities(getCsvValue(values, columnMap, "lab_facilities"));

        // Audit
        builder.createdBy(
                getCsvValue(values, columnMap, "created_by", "excel_upload"));
        builder.updatedBy(
                getCsvValue(values, columnMap, "updated_by", "excel_upload"));

        return builder.build();
    }

    private String getCsvValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName) {
        return getCsvValue(values, columnMap, columnName, null);
    }

    private String getCsvValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName,
            String defaultValue) {
        Integer columnIndex = columnMap.get(columnName);
        if (columnIndex == null || columnIndex >= values.length) {
            return defaultValue;
        }

        String value = values[columnIndex].trim();
        if (value.isEmpty() || "null".equalsIgnoreCase(value)) {
            return defaultValue;
        }

        // Remove surrounding quotes if present
        if (value.startsWith("\"") && value.endsWith("\"")) {
            value = value.substring(1, value.length() - 1);
        }

        return value;
    }

    private Integer getCsvIntegerValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName) {
        String value = getCsvValue(values, columnMap, columnName);
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "Invalid integer value: " + value);
        }
    }

    private BigDecimal getCsvBigDecimalValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName) {
        String value = getCsvValue(values, columnMap, columnName);
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "Invalid decimal value: " + value);
        }
    }

    private Boolean getCsvBooleanValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName) {
        return getCsvBooleanValue(values, columnMap, columnName, null);
    }

    private Boolean getCsvBooleanValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName,
            Boolean defaultValue) {
        String value = getCsvValue(values, columnMap, columnName);
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }

        String lowercaseValue = value.trim().toLowerCase();
        return ("true".equals(lowercaseValue) ||
                "yes".equals(lowercaseValue) ||
                "1".equals(lowercaseValue));
    }

    private LocalDate getCsvDateValue(
            String[] values,
            Map<String, Integer> columnMap,
            String columnName) {
        String value = getCsvValue(values, columnMap, columnName);
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim(), DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Invalid date format. Expected: yyyy-MM-dd, got: " + value);
        }
    }

    private void validateCountry(String country) {
        if (country == null || country.trim().isEmpty()) {
            return; // Bean validation will catch missing country
        }
        String normalizedCountry = country.trim().toUpperCase();
        if (!ALLOWED_COUNTRY_NAMES.contains(normalizedCountry)) {
            throw new IllegalArgumentException(
                    "Country '" +
                            country +
                            "' is not allowed. Only United Kingdom and Germany are supported.");
        }
    }
}

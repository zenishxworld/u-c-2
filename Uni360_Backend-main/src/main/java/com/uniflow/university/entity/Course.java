package com.uniflow.university.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.r2dbc.postgresql.codec.Json;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Table("courses")
public class Course {

    @Id
    private UUID id;

    @Column("university_id")
    private UUID universityId;

    @NotBlank(message = "Course name is required")
    @Column("name")
    private String name;

    @Column("course_code")
    private String courseCode;

    @Column("is_active")
    private Boolean isActive = true;

    @Column("data")
    private Json data;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Column("created_by")
    private String createdBy;

    @Column("updated_by")
    private String updatedBy;

    // Helper methods to extract commonly used fields from JSONB data
    public String getOfficialName() {
        return extractStringFromData("official_name");
    }

    public String getDegreeLevel() {
        return extractStringFromData("degree_level");
    }

    public String getDegreeType() {
        return extractStringFromData("degree_type");
    }

    public String getFieldOfStudy() {
        return extractStringFromData("field_of_study");
    }

    public String getSubjectArea() {
        return extractStringFromData("subject_area");
    }

    public String getAcademicDepartment() {
        return extractStringFromData("academic_department");
    }

    public Double getDurationYears() {
        return extractDoubleFromData("duration_years");
    }

    public String getStudyMode() {
        return extractStringFromData("study_mode");
    }

    public String getCurrency() {
        return extractStringFromData("currency");
    }

    public Double getTuitionInternational() {
        return extractDoubleFromData("tuition_international");
    }

    public String getIntakeSeasons() {
        return extractStringFromData("intake_seasons");
    }

    public String getDescription() {
        return extractStringFromData("description");
    }

    public String getVerificationStatus() {
        return extractStringFromData("verification_status");
    }

    // Helper method to extract string values from JSONB data
    private String extractStringFromData(String key) {
        if (data == null || data.asString() == null) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            JsonNode jsonNode = mapper.readTree(data.asString());
            JsonNode valueNode = jsonNode.get(key);
            return valueNode != null && !valueNode.isNull()
                ? valueNode.asText()
                : null;
        } catch (Exception e) {
            return null;
        }
    }

    // Helper method to extract double values from JSONB data
    private Double extractDoubleFromData(String key) {
        if (data == null || data.asString() == null) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            JsonNode jsonNode = mapper.readTree(data.asString());
            JsonNode valueNode = jsonNode.get(key);
            return valueNode != null && !valueNode.isNull()
                ? valueNode.asDouble()
                : null;
        } catch (Exception e) {
            return null;
        }
    }

    // Helper method to extract boolean values from JSONB data
    private Boolean extractBooleanFromData(String key) {
        if (data == null || data.asString() == null) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            JsonNode jsonNode = mapper.readTree(data.asString());
            JsonNode valueNode = jsonNode.get(key);
            return valueNode != null && !valueNode.isNull()
                ? valueNode.asBoolean()
                : null;
        } catch (Exception e) {
            return null;
        }
    }

    // Utility methods for business logic
    public boolean isActive() {
        return isActive != null && isActive;
    }

    public String getFullProgramName() {
        String officialName = getOfficialName();
        return officialName != null ? officialName : name;
    }

    public boolean isGraduateLevel() {
        String degreeLevel = getDegreeLevel();
        return (
            degreeLevel != null &&
            (degreeLevel.equalsIgnoreCase("MASTERS") ||
                degreeLevel.equalsIgnoreCase("DOCTORATE") ||
                degreeLevel.equalsIgnoreCase("PHD"))
        );
    }

    public boolean isUndergraduateLevel() {
        String degreeLevel = getDegreeLevel();
        return degreeLevel != null && degreeLevel.equalsIgnoreCase("BACHELORS");
    }
}

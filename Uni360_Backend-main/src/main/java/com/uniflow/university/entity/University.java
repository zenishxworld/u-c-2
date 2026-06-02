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
@Table("universities")
public class University {

    @Id
    private UUID id;

    @NotBlank(message = "University name is required")
    @Column("name")
    private String name;

    @NotBlank(message = "University code is required")
    @Column("code")
    private String code;

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

    public String getShortName() {
        return extractStringFromData("short_name");
    }

    public String getCountry() {
        return extractStringFromData("country");
    }

    public String getCountryCode() {
        return extractStringFromData("country_code");
    }

    public String getCity() {
        return extractStringFromData("city");
    }

    public String getWebsiteUrl() {
        return extractStringFromData("website_url");
    }

    public String getDescription() {
        return extractStringFromData("description");
    }

    public String getStatus() {
        return extractStringFromData("status");
    }

    public String getVerificationStatus() {
        return extractStringFromData("verification_status");
    }

    public Integer getWorldRanking() {
        return extractIntegerFromData("world_ranking");
    }

    public Integer getNationalRanking() {
        return extractIntegerFromData("national_ranking");
    }

    public Integer getQsRanking() {
        return extractIntegerFromData("qs_ranking");
    }

    public Integer getTotalStudents() {
        return extractIntegerFromData("total_students");
    }

    public String getCurrency() {
        return extractStringFromData("currency");
    }

    public Boolean getScholarshipsAvailable() {
        return extractBooleanFromData("scholarships_available");
    }

    public Boolean getIsFeatured() {
        return extractBooleanFromData("is_featured");
    }

    public String getInstitutionType() {
        return extractStringFromData("institution_type");
    }

    public String getType() {
        return extractStringFromData("type");
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

    // Helper method to extract integer values from JSONB data
    private Integer extractIntegerFromData(String key) {
        if (data == null || data.asString() == null) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            JsonNode jsonNode = mapper.readTree(data.asString());
            JsonNode valueNode = jsonNode.get(key);
            return valueNode != null && !valueNode.isNull()
                ? valueNode.asInt()
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
    public boolean isPrivateUniversity() {
        String type = getInstitutionType();
        return "private".equalsIgnoreCase(type);
    }

    public boolean isHighlyRanked() {
        Integer worldRanking = getWorldRanking();
        return worldRanking != null && worldRanking <= 100;
    }

    public boolean isActive() {
        return isActive != null && isActive;
    }

    public String getLocationString() {
        String city = getCity();
        String country = getCountry();
        if (city != null && country != null) {
            return city + ", " + country;
        } else if (country != null) {
            return country;
        } else if (city != null) {
            return city;
        }
        return "Location not specified";
    }
}

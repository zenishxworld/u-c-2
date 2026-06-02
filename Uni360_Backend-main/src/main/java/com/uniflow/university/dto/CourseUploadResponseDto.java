package com.uniflow.university.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseUploadResponseDto {

    private Boolean success;
    private String message;
    private Integer totalProcessed;
    private Integer createdCount;
    private Integer skippedCount;
    private List<CourseInfo> created;
    private List<SkippedRecordInfo> skipped;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseInfo {
        private UUID id;
        private String name;
        private String courseCode;
        private String universityCode;
        private String degreeLevel;
        private String degreeType;
        private Boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkippedRecordInfo {
        private String identifier;
        private String reason;
        private String details;
    }
}

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
public class UniversityUploadResponseDto {

    private Boolean success;
    private String message;
    private Integer totalProcessed;
    private Integer createdCount;
    private Integer skippedCount;
    private List<UniversityInfo> created;
    private List<SkippedRecordInfo> skipped;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UniversityInfo {
        private UUID id;
        private String name;
        private String code;
        private String country;
        private String city;
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

package com.uniflow.university.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelUploadResultDto<T> {

    @Builder.Default
    private List<T> created = new ArrayList<>();

    @Builder.Default
    private List<SkippedRecord> skipped = new ArrayList<>();

    private Integer totalProcessed;
    private Integer createdCount;
    private Integer skippedCount;
    private Boolean success;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkippedRecord {
        private String identifier;
        private String reason;
        private String details;
    }

    public void addCreated(T item) {
        if (created == null) {
            created = new ArrayList<>();
        }
        created.add(item);
    }

    public void addSkipped(String identifier, String reason, String details) {
        if (skipped == null) {
            skipped = new ArrayList<>();
        }
        skipped.add(SkippedRecord.builder()
            .identifier(identifier)
            .reason(reason)
            .details(details)
            .build());
    }

    public void addSkipped(String identifier, String reason) {
        addSkipped(identifier, reason, null);
    }

    public int getCreatedCount() {
        return created != null ? created.size() : 0;
    }

    public int getSkippedCount() {
        return skipped != null ? skipped.size() : 0;
    }

    public int getTotalProcessed() {
        return getCreatedCount() + getSkippedCount();
    }

    public String getMessage() {
        if (message != null) {
            return message;
        }

        if (getCreatedCount() == 0 && getSkippedCount() > 0) {
            return String.format("No new records created. All %d records were skipped (already exist).",
                getSkippedCount());
        } else if (getCreatedCount() > 0 && getSkippedCount() == 0) {
            return String.format("Successfully created %d records.", getCreatedCount());
        } else if (getCreatedCount() > 0 && getSkippedCount() > 0) {
            return String.format("Created %d records. Skipped %d existing records.",
                getCreatedCount(), getSkippedCount());
        } else {
            return "No records processed.";
        }
    }

    public Boolean getSuccess() {
        return success != null ? success : (getCreatedCount() > 0 || getSkippedCount() > 0);
    }
}

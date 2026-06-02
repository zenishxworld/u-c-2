package com.uniflow.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AvailablePermissionsDTO - Data Transfer Object for available permissions metadata
 *
 * <p>This DTO provides comprehensive information about all available permissions
 * in the system, including categories, risk levels, and dependency rules.
 *
 * <p>Features:
 * - Complete permission catalog with metadata
 * - Permission categories and risk levels
 * - Dependency rules and requirements
 * - UI-friendly structure for permission management interfaces
 * - Support for permission hierarchies and grouping
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AvailablePermissionsDTO {

    private List<PermissionInfo> permissions;
    private List<String> categories;
    private List<String> riskLevels;
    private Map<String, List<String>> dependencyRules;
    private Map<String, String> categoryDescriptions;
    private Map<String, Integer> riskLevelWeights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionInfo {
        private String key;
        private String displayName;
        private String description;
        private String category;
        private String riskLevel;
        private List<String> requiredPermissions;
        private List<String> conflicts;
        private Boolean deprecated;
        private String replacedBy;
    }
}

package com.uniflow.ai.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.function.Predicate;
import lombok.Builder;
import lombok.Data;
import reactor.core.publisher.Mono;

/**
 * AIRequestValidation - Reactive validation for AI generation requests
 * Validates that required profile data exists before sending to n8n
 */
public class AIRequestValidation {

    @Data
    @Builder
    public static class ValidationResult {
        private boolean valid;
        private String operationType;
        private List<String> missingFields;
        private List<String> emptyFields;
        private String message;

        public static ValidationResult success(String operationType) {
            return ValidationResult.builder()
                .valid(true)
                .operationType(operationType)
                .missingFields(List.of())
                .emptyFields(List.of())
                .message("Validation passed")
                .build();
        }

        public static ValidationResult failure(
            String operationType,
            List<String> missingFields,
            List<String> emptyFields
        ) {
            List<String> issues = new ArrayList<>();
            if (!missingFields.isEmpty()) {
                issues.add("Missing fields: " + String.join(", ", missingFields));
            }
            if (!emptyFields.isEmpty()) {
                issues.add("Empty fields: " + String.join(", ", emptyFields));
            }
            return ValidationResult.builder()
                .valid(false)
                .operationType(operationType)
                .missingFields(missingFields)
                .emptyFields(emptyFields)
                .message("Validation failed. " + String.join(". ", issues))
                .build();
        }
    }

    @Data
    @Builder
    public static class FieldRule {
        private String fieldName;
        private String displayName;
        private boolean required;
        private Predicate<String> validator;

        public static FieldRule required(String fieldName, String displayName) {
            return FieldRule.builder()
                .fieldName(fieldName)
                .displayName(displayName)
                .required(true)
                .validator(value -> value != null && !value.isBlank())
                .build();
        }

        public static FieldRule optional(String fieldName, String displayName) {
            return FieldRule.builder()
                .fieldName(fieldName)
                .displayName(displayName)
                .required(false)
                .validator(value -> true)
                .build();
        }

        public static FieldRule requiredWithMinLength(String fieldName, String displayName, int minLength) {
            return FieldRule.builder()
                .fieldName(fieldName)
                .displayName(displayName)
                .required(true)
                .validator(value -> value != null && value.length() >= minLength)
                .build();
        }
    }

    public static List<FieldRule> getSopValidationRules() {
        return List.of(
            FieldRule.required("fullName", "Full Name"),
            FieldRule.required("gender", "Gender"),
            FieldRule.required("nationality", "Nationality"),
            FieldRule.required("homeCountry", "Home Country"),
            FieldRule.required("currentStatus", "Current Status"),
            FieldRule.required("intendedCountry", "Intended Country"),
            FieldRule.required("university", "Target University"),
            FieldRule.required("degreeLevel", "Degree Level"),
            FieldRule.required("program", "Program"),
            FieldRule.required("fieldOfStudy", "Field of Study"),
            FieldRule.required("institutionName", "Institution Name"),
            FieldRule.required("graduationYear", "Graduation Year"),
            FieldRule.required("cgpaOrPercentage", "CGPA or Percentage"),
            FieldRule.requiredWithMinLength("motivation", "Motivation", 20),
            FieldRule.required("experienceDetails", "Experience Details"),
            FieldRule.required("majorProjects", "Major Projects"),
            FieldRule.required("keyStrengths", "Key Strengths"),
            FieldRule.required("whyProgram", "Why Program"),
            FieldRule.required("whyUniversity", "Why University"),
            FieldRule.required("shortTermGoal", "Short Term Goal"),
            FieldRule.required("longTermGoal", "Long Term Goal"),
            FieldRule.required("returnReason", "Return Reason")
        );
    }

    // LOR validation rules
    public static List<FieldRule> getLorValidationRules() {
        return List.of(
            FieldRule.required("seniorName", "Senior/Recommender Name"),
            FieldRule.required("studentName", "Student Name"),
            FieldRule.required("gender", "Gender"),
            FieldRule.required("universityName", "University Name"),
            FieldRule.required("field", "Field of Study"),
            FieldRule.required("recommenderDesignation", "Recommender Designation"),
            FieldRule.required("relationshipType", "Relationship Type"),
            FieldRule.required("relationshipDuration", "Relationship Duration"),
            FieldRule.requiredWithMinLength("skills", "Skills", 10),
            FieldRule.required("projects", "Projects"),
            FieldRule.required("recommendationLevel", "Recommendation Level")
        );
    }

    // Cover Letter validation rules
    public static List<FieldRule> getCoverLetterValidationRules() {
        return List.of(
            FieldRule.required("studentName", "Student Name"),
            FieldRule.required("gender", "Gender"),
            FieldRule.required("passportNumber", "Passport Number"),
            FieldRule.required("nationality", "Nationality"),
            FieldRule.required("targetCountry", "Target Country"),
            FieldRule.required("courseName", "Course Name"),
            FieldRule.required("universityName", "University Name"),
            FieldRule.required("universityLocation", "University Location"),
            FieldRule.required("courseDuration", "Course Duration"),
            FieldRule.required("courseStartDate", "Course Start Date"),
            FieldRule.required("tuitionFees", "Tuition Fees"),
            FieldRule.required("blockedAccountBank", "Blocked Account Bank"),
            FieldRule.required("blockedAccountBalance", "Blocked Account Balance"),
            FieldRule.required("sponsorName", "Sponsor Name"),
            FieldRule.required("sscSchool", "SSC School Name"),
            FieldRule.required("sscYear", "SSC Passing Month and Year"),
            FieldRule.required("sscMarks", "SSC Marks or Percentage"),
            FieldRule.required("hscInstitution", "HSC School Name"),
            FieldRule.required("hscYear", "HSC Passing Month and Year"),
            FieldRule.required("hscMarks", "HSC Marks or Percentage"),
            FieldRule.required("bachelorsUniversity", "Bachelors University Name"),
            FieldRule.required("bachelorsCourse", "Bachelors Course Name"),
            FieldRule.required("bachelorsCgpa", "Bachelors Course Percentage or CGPA")
        );
    }

    // Reactive validator for SOP
    public static Mono<ValidationResult> validateSopRequest(SopRequest request) {
        return Mono.fromCallable(() -> {
            List<String> missingFields = new ArrayList<>();
            List<String> emptyFields = new ArrayList<>();

            for (FieldRule rule : getSopValidationRules()) {
                String value = getFieldValue(request, rule.getFieldName());
                if (rule.isRequired()) {
                    if (value == null) {
                        missingFields.add(rule.getDisplayName());
                    } else if (!rule.getValidator().test(value)) {
                        emptyFields.add(rule.getDisplayName());
                    }
                }
            }

            if (missingFields.isEmpty() && emptyFields.isEmpty()) {
                return ValidationResult.success("SOP");
            }
            return ValidationResult.failure("SOP", missingFields, emptyFields);
        });
    }

    // Reactive validator for LOR
    public static Mono<ValidationResult> validateLorRequest(LorRequest request) {
        return Mono.fromCallable(() -> {
            List<String> missingFields = new ArrayList<>();
            List<String> emptyFields = new ArrayList<>();

            for (FieldRule rule : getLorValidationRules()) {
                String value = getFieldValue(request, rule.getFieldName());
                if (rule.isRequired()) {
                    if (value == null) {
                        missingFields.add(rule.getDisplayName());
                    } else if (!rule.getValidator().test(value)) {
                        emptyFields.add(rule.getDisplayName());
                    }
                }
            }

            if (missingFields.isEmpty() && emptyFields.isEmpty()) {
                return ValidationResult.success("LOR");
            }
            return ValidationResult.failure("LOR", missingFields, emptyFields);
        });
    }

    // Reactive validator for Cover Letter
    public static Mono<ValidationResult> validateCoverLetterRequest(CoverLetterRequest request) {
        return Mono.fromCallable(() -> {
            List<String> missingFields = new ArrayList<>();
            List<String> emptyFields = new ArrayList<>();

            for (FieldRule rule : getCoverLetterValidationRules()) {
                String value = getFieldValue(request, rule.getFieldName());
                if (rule.isRequired()) {
                    if (value == null) {
                        missingFields.add(rule.getDisplayName());
                    } else if (!rule.getValidator().test(value)) {
                        emptyFields.add(rule.getDisplayName());
                    }
                }
            }

            if (missingFields.isEmpty() && emptyFields.isEmpty()) {
                return ValidationResult.success("COVER-LETTER");
            }
            return ValidationResult.failure("COVER-LETTER", missingFields, emptyFields);
        });
    }

    // Helper to get field value using reflection
    private static String getFieldValue(Object obj, String fieldName) {
        try {
            var field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            Object value = field.get(obj);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}

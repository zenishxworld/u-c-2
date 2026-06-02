package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload sent to the n8n SOP webhook.
 * Field names match what the n8n "collect data" Code node reads from $json:
 *   i.fullName, i.nationality, i.homeCountry, i.intendedCountry,
 *   i.university, i.degreeLevel, i.program, i.fieldOfStudy,
 *   i.institutionName, i.graduationYear,
 *   i.motivation, i.experienceType, i.workExperience,
 *   i.areasOfInterest, i.whyProgram, i.whyUniversity,
 *   i.shortTermGoal, i.longTermGoal, i.returnReason, i.keyStrengths
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SopRequest {

    // Identity
    private String fullName;
    private String nationality;
    private String homeCountry;
    private String intendedCountry;   // target university country
    private String gender;

    @JsonProperty("current_status")
    private String currentStatus;

    // Target education
    private String university;        // target university name
    private String degreeLevel;       // Master's, PhD, etc.
    private String program;           // e.g. "MSc Computer Science"
    private String fieldOfStudy;

    // Past education
    private String institutionName;   // where previous degree was completed
    private String graduationYear;

    @JsonProperty("cgpa_or_percentage")
    private String cgpaOrPercentage;

    // Motivation & experience
    private String motivation;
    private String experienceType;    // internship / work / project
    private String workExperience;    // summary of experience (legacy/compatibility)

    @JsonProperty("experience_details")
    private String experienceDetails;

    @JsonProperty("major_projects")
    private String majorProjects;

    // Fit
    private String areasOfInterest;
    private String whyProgram;
    private String whyUniversity;
    private String keyStrengths;

    // Future
    private String shortTermGoal;
    private String longTermGoal;
    private String returnReason;      // intent to return to home country

    // Important Optional Fields
    @JsonProperty("internship_details")
    private String internshipDetails;

    @JsonProperty("certifications")
    private String certifications;

    @JsonProperty("why_country")
    private String whyCountry;

    @JsonProperty("challenges_overcome")
    private String challengesOvercome;

    @JsonProperty("ielts_score")
    private String ieltsScore;

    @JsonProperty("german_language_level")
    private String germanLanguageLevel;

    // AI Controls
    @JsonProperty("tone")
    @Builder.Default
    private String tone = "PROFESSIONAL";

    @JsonProperty("word_limit")
    @Builder.Default
    private Integer wordLimit = 800;

    @JsonProperty("additional_requirements")
    @Builder.Default
    private String additionalRequirements = "";
}

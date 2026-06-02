package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload sent to the n8n LOR webhook.
 * Field names match exactly what the n8n LOR AI Agent prompt expects.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LorRequest {

    @JsonProperty("Name of the senior writing LOR")
    private String seniorName;

    @JsonProperty("Student Name")
    private String studentName;

    @JsonProperty("Gender")
    private String gender;

    @JsonProperty("University Name")
    private String universityName;

    @JsonProperty("Location")
    private String location;

    @JsonProperty("Field")
    private String field;

    @JsonProperty("Recommender Designation")
    private String recommenderDesignation;

    @JsonProperty("Relationship Type")
    private String relationshipType;

    @JsonProperty("Relationship Duration")
    private String relationshipDuration;

    @JsonProperty("Best at (Skills)")
    private String skills;

    @JsonProperty("Projects (Optional)")
    private String projects;

    @JsonProperty("Recommendation Level")
    private String recommendationLevel;

    // Optional Fields
    @JsonProperty("Analytical Skills")
    private String analyticalSkills;

    @JsonProperty("Leadership Skills")
    private String leadershipSkills;

    @JsonProperty("Teamwork")
    private String teamwork;

    @JsonProperty("Research Ability")
    private String researchAbility;

    @JsonProperty("Class Rank")
    private String classRank;

    // AI Controls
    @JsonProperty("tone")
    @Builder.Default
    private String tone = "PROFESSIONAL";

    @JsonProperty("word_limit")
    @Builder.Default
    private Integer wordLimit = 400;

    @JsonProperty("additional_requirements")
    @Builder.Default
    private String additionalRequirements = "";
}

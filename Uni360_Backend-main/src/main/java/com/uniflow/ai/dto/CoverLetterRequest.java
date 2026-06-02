package com.uniflow.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload sent to the n8n Cover Letter webhook at /webhook/coverletter.
 * Field names match EXACTLY what the n8n Cover Letter RAG AI Agent prompt reads:
 *   $json["Student Name"], $json["Passport Number"], $json["Course Name"], etc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoverLetterRequest {

    @JsonProperty("Student Name")
    private String studentName;

    @JsonProperty("Gender")
    private String gender;

    @JsonProperty("Passport Number")
    private String passportNumber;

    @JsonProperty("Nationality")
    private String nationality;

    @JsonProperty("Target Country")
    private String targetCountry;

    @JsonProperty("Course Name")
    private String courseName;

    @JsonProperty("University Name")
    private String universityName;

    @JsonProperty("University Location")
    private String universityLocation;

    @JsonProperty("Course Duration")
    private String courseDuration;

    @JsonProperty("Course Start Date")
    private String courseStartDate;

    @JsonProperty("Tuition Fees")
    private String tuitionFees;

    @JsonProperty("Blocked Account Bank Name")
    private String blockedAccountBank;

    @JsonProperty("Blocked Account Balance")
    private String blockedAccountBalance;

    @JsonProperty("Sponsor Name")
    private String sponsorName;

    // --- Education ---

    @JsonProperty("SSC School Name")
    private String sscSchool;

    @JsonProperty("SSC Passing Month and Year")
    private String sscYear;

    @JsonProperty("SSC Marks or Percentage")
    private String sscMarks;

    @JsonProperty("HSC School Name")
    private String hscInstitution;

    @JsonProperty("HSC Passing Month and Year")
    private String hscYear;

    @JsonProperty("HSC Marks or Percentage")
    private String hscMarks;

    @JsonProperty("Bachelors University Name")
    private String bachelorsUniversity;

    @JsonProperty("Bachelors Course Name")
    private String bachelorsCourse;

    @JsonProperty("Bachelors Course Percentage or CGPA")
    private String bachelorsCgpa;

    // Optional Fields
    @JsonProperty("Visa Type")
    private String visaType;

    @JsonProperty("Source of Funds")
    private String sourceOfFunds;

    @JsonProperty("Accommodation Details")
    private String accommodationDetails;

    @JsonProperty("Gap Reason")
    private String gapReason;

    @JsonProperty("Current Company")
    private String currentCompany;

    @JsonProperty("Future Return Plan")
    private String futureReturnPlan;

    // AI Controls
    @JsonProperty("tone")
    @Builder.Default
    private String tone = "PROFESSIONAL";

    @JsonProperty("word_limit")
    @Builder.Default
    private Integer wordLimit = 600;

    @JsonProperty("additional_requirements")
    @Builder.Default
    private String additionalRequirements = "";
}

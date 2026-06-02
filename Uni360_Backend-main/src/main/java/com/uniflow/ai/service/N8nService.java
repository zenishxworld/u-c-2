package com.uniflow.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.ai.config.N8nProperties;
import com.uniflow.ai.dto.*;
import com.uniflow.ai.dto.AIRequestValidation.ValidationResult;
import com.uniflow.ai.exception.AIServiceException;
import com.uniflow.student.service.ProfileBuilderService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class N8nService {

    private final WebClient webClient;
    private final N8nProperties n8nProperties;
    private final ProfileBuilderService profileBuilderService;
    private final ObjectMapper objectMapper;

    public N8nService(
        N8nProperties n8nProperties,
        ProfileBuilderService profileBuilderService,
        ObjectMapper objectMapper
    ) {
        this.n8nProperties = n8nProperties;
        this.profileBuilderService = profileBuilderService;
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(n8nProperties.getBaseUrl())
            .build();
        log.info("═══════════════════════════════════════════════════════════");
        log.info("✅ N8nService initialized");
        log.info("   📍 Base URL: {}", n8nProperties.getBaseUrl());
        log.info("   📍 SOP Endpoint: {}", n8nProperties.getSopEndpoint());
        log.info("   📍 LOR Endpoint: {}", n8nProperties.getLorEndpoint());
        log.info(
            "   📍 Cover Letter Endpoint: {}",
            n8nProperties.getCoverLetterEndpoint()
        );
        log.info("   ⏱️  Timeout: {}s", n8nProperties.getTimeout().toSeconds());
        log.info(
            "   🔐 Webhook Auth: {}",
            n8nProperties.getWebhookSecret() != null ? "Configured" : "NOT SET"
        );
        log.info("═══════════════════════════════════════════════════════════");
    }

    /**
     * Generate SOP — merges profile data with optional frontend overrides.
     * Overrides map keys: university, program, degree_level, motivation,
     *   experience_summary, career_goals, additional_requirements, tone, word_limit
     */
    public Mono<SopResponse> generateSopFromProfile(
        Long userId,
        Map<String, Object> overrides
    ) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("🚀 [SOP] Starting generation for userId: {}", userId);
        log.info("   └─ Overrides provided: {}", overrides.keySet());
        log.info("───────────────────────────────────────────────────────────");

        return profileBuilderService
            .getProfileSummary(userId)
            .doOnNext(profileSummary -> {
                log.info("📋 [SOP] Step 1: Profile data retrieved");
                log.info("   ├─ Success: {}", profileSummary.isSuccess());
                if (profileSummary.getProfileData() != null) {
                    log.info(
                        "   ├─ Profile fields: {}",
                        profileSummary.getProfileData().keySet()
                    );
                }
            })
            .flatMap(profileSummary -> {
                if (!profileSummary.isSuccess()) {
                    log.error("❌ [SOP] Profile not found for userId: {}", userId);
                    return Mono.error(
                        new AIServiceException(
                            "Failed to load student profile",
                            "PROFILE_NOT_FOUND"
                        )
                    );
                }
                SopRequest request = buildSopRequestFromProfile(
                    profileSummary.getProfileData(),
                    overrides
                );
                log.info("📝 [SOP] Step 2: Request built for n8n");
                log.info("   ├─ Student: {}", request.getFullName());
                log.info("   ├─ University: {}", request.getUniversity());
                log.info("   ├─ Program: {}", request.getProgram());
                log.info("   ├─ Degree: {}", request.getDegreeLevel());
                log.info("   └─ Goals: {}", truncate(request.getShortTermGoal(), 50));

                return AIRequestValidation.validateSopRequest(request).flatMap(
                    validation -> {
                        if (!validation.isValid()) {
                            log.error("❌ [SOP] Validation failed!");
                            log.error("   ├─ Missing: {}", validation.getMissingFields());
                            log.error("   └─ Empty: {}", validation.getEmptyFields());
                            return Mono.error(
                                new AIServiceException(
                                    validation.getMessage(),
                                    "VALIDATION_FAILED"
                                )
                            );
                        }
                        log.info("✅ [SOP] Step 2b: Validation passed");
                        return callN8nWebhook(
                            n8nProperties.getSopEndpoint(),
                            request,
                            SopResponse.class,
                            "SOP"
                        );
                    }
                );
            });
    }

    /**
     * Generate LOR — merges profile data with optional frontend overrides.
     * Overrides map keys: senior_name, university_name, field,
     *   additional_requirements, tone, word_limit
     */
    public Mono<LorResponse> generateLorFromProfile(
        Long userId,
        Map<String, Object> overrides
    ) {
        String seniorName = overrides.getOrDefault("senior_name", "").toString();
        log.info("═══════════════════════════════════════════════════════════");
        log.info("🚀 [LOR] Starting generation for userId: {}", userId);
        log.info("   └─ Senior Name: {}", seniorName);
        log.info("───────────────────────────────────────────────────────────");

        return profileBuilderService
            .getProfileSummary(userId)
            .doOnNext(profileSummary -> {
                log.info("📋 [LOR] Step 1: Profile data retrieved");
                log.info("   └─ Success: {}", profileSummary.isSuccess());
            })
            .flatMap(profileSummary -> {
                if (!profileSummary.isSuccess()) {
                    log.error("❌ [LOR] Profile not found for userId: {}", userId);
                    return Mono.error(
                        new AIServiceException(
                            "Failed to load student profile",
                            "PROFILE_NOT_FOUND"
                        )
                    );
                }
                LorRequest request = buildLorRequestFromProfile(
                    profileSummary.getProfileData(),
                    overrides
                );
                log.info("📝 [LOR] Step 2: Request built for n8n");
                log.info("   ├─ Senior: {}", request.getSeniorName());
                log.info("   ├─ Student: {}", request.getStudentName());
                log.info("   ├─ University: {}", request.getUniversityName());
                log.info("   ├─ Field: {}", request.getField());
                log.info("   └─ Skills: {}", truncate(request.getSkills(), 50));

                return AIRequestValidation.validateLorRequest(request).flatMap(
                    validation -> {
                        if (!validation.isValid()) {
                            log.error("❌ [LOR] Validation failed!");
                            log.error("   ├─ Missing: {}", validation.getMissingFields());
                            log.error("   └─ Empty: {}", validation.getEmptyFields());
                            return Mono.error(
                                new AIServiceException(
                                    validation.getMessage(),
                                    "VALIDATION_FAILED"
                                )
                            );
                        }
                        log.info("✅ [LOR] Step 2b: Validation passed");
                        return callN8nWebhook(
                            n8nProperties.getLorEndpoint(),
                            request,
                            LorResponse.class,
                            "LOR"
                        );
                    }
                );
            });
    }

    /**
     * Generate Cover Letter — merges profile data with optional frontend overrides.
     * Overrides map keys: university_name, university_location, course_name,
     *   course_duration, course_start_date, tuition_fees,
     *   blocked_account_bank, blocked_account_balance, sponsor_name,
     *   additional_requirements, tone, word_limit
     */
    public Mono<CoverLetterResponse> generateCoverLetterFromProfile(
        Long userId,
        Map<String, Object> overrides
    ) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("🚀 [COVER-LETTER] Starting generation for userId: {}", userId);
        log.info("   └─ Overrides provided: {}", overrides.keySet());
        log.info("───────────────────────────────────────────────────────────");

        return profileBuilderService
            .getProfileSummary(userId)
            .doOnNext(profileSummary -> {
                log.info("📋 [COVER-LETTER] Step 1: Profile data retrieved");
                log.info("   └─ Success: {}", profileSummary.isSuccess());
            })
            .flatMap(profileSummary -> {
                if (!profileSummary.isSuccess()) {
                    log.error(
                        "❌ [COVER-LETTER] Profile not found for userId: {}",
                        userId
                    );
                    return Mono.error(
                        new AIServiceException(
                            "Failed to load student profile",
                            "PROFILE_NOT_FOUND"
                        )
                    );
                }
                CoverLetterRequest request = buildCoverLetterRequestFromProfile(
                    profileSummary.getProfileData(),
                    overrides
                );
                log.info("📝 [COVER-LETTER] Step 2: Request built for n8n");
                log.info("   ├─ Student: {}", request.getStudentName());
                log.info("   ├─ Passport: {}", request.getPassportNumber());
                log.info("   ├─ University: {}", request.getUniversityName());
                log.info("   ├─ Course: {}", request.getCourseName());
                log.info(
                    "   ├─ Blocked Account: {} - {}",
                    request.getBlockedAccountBank(),
                    request.getBlockedAccountBalance()
                );
                log.info("   └─ Sponsor: {}", request.getSponsorName());

                return AIRequestValidation.validateCoverLetterRequest(
                    request
                ).flatMap(validation -> {
                    if (!validation.isValid()) {
                        log.error("❌ [COVER-LETTER] Validation failed!");
                        log.error("   ├─ Missing: {}", validation.getMissingFields());
                        log.error("   └─ Empty: {}", validation.getEmptyFields());
                        return Mono.error(
                            new AIServiceException(
                                validation.getMessage(),
                                "VALIDATION_FAILED"
                            )
                        );
                    }
                    log.info("✅ [COVER-LETTER] Step 2b: Validation passed");
                    return callN8nWebhook(
                        n8nProperties.getCoverLetterEndpoint(),
                        request,
                        CoverLetterResponse.class,
                        "COVER-LETTER"
                    );
                });
            });
    }

    // ─── Admin direct-send methods (no profile lookup) ───────────────────────

    /**
     * Admin SOP generation — request body is sent directly to n8n as-is.
     * Admin fills in all SopRequest fields manually.
     */
    public Mono<SopResponse> generateSopDirect(SopRequest request) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("🚀 [ADMIN-SOP] Starting direct generation");
        log.info("   └─ Student: {}", request.getFullName());
        log.info("   ├─ University: {}", request.getUniversity());
        log.info("   └─ Program: {}", request.getProgram());
        return callN8nWebhook(
            n8nProperties.getSopEndpoint(),
            request,
            SopResponse.class,
            "ADMIN-SOP"
        );
    }

    /**
     * Admin LOR generation — request body is sent directly to n8n as-is.
     * Admin fills in all LorRequest fields manually.
     */
    public Mono<LorResponse> generateLorDirect(LorRequest request) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("🚀 [ADMIN-LOR] Starting direct generation");
        log.info("   ├─ Senior: {}", request.getSeniorName());
        log.info("   └─ Student: {}", request.getStudentName());
        return callN8nWebhook(
            n8nProperties.getLorEndpoint(),
            request,
            LorResponse.class,
            "ADMIN-LOR"
        );
    }

    /**
     * Admin Cover Letter generation — request body is sent directly to n8n as-is.
     * Admin fills in all CoverLetterRequest fields manually.
     */
    public Mono<CoverLetterResponse> generateCoverLetterDirect(CoverLetterRequest request) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info("🚀 [ADMIN-COVER-LETTER] Starting direct generation");
        log.info("   ├─ Student: {}", request.getStudentName());
        log.info("   └─ University: {}", request.getUniversityName());
        return callN8nWebhook(
            n8nProperties.getCoverLetterEndpoint(),
            request,
            CoverLetterResponse.class,
            "ADMIN-COVER-LETTER"
        );
    }

    private <T, R> Mono<R> callN8nWebhook(
        String endpoint,
        T request,
        Class<R> responseType,
        String operationName
    ) {
        String fullUrl = n8nProperties.getBaseUrl() + endpoint;
        log.info("📤 [{}] Step 3: Calling n8n webhook", operationName);
        log.info("   ├─ URL: {}", fullUrl);
        log.info("   ├─ Method: POST");
        log.info("   └─ Timeout: {}s", n8nProperties.getTimeout().toSeconds());

        // Log request body
        try {
            String requestJson = objectMapper.writeValueAsString(request);
            log.info("📤 [{}] Request payload:", operationName);
            log.info("   └─ {}", truncate(requestJson, 200));
        } catch (JsonProcessingException e) {
            log.warn("   └─ Could not serialize request for logging");
        }

        long startTime = System.currentTimeMillis();

        return webClient
            .post()
            .uri(endpoint)
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-Webhook-Secret", n8nProperties.getWebhookSecret())
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(n8nProperties.getTimeout())
            .doOnNext(rawResponse -> {
                long duration = System.currentTimeMillis() - startTime;
                log.info(
                    "📥 [{}] Step 4: n8n response received",
                    operationName
                );
                log.info("   ├─ Duration: {}ms", duration);
                log.info(
                    "   ├─ Response size: {} bytes",
                    rawResponse != null ? rawResponse.length() : 0
                );
                log.info("   └─ Preview: {}", truncate(rawResponse, 150));
            })
            .flatMap(rawResponse -> {
                if (rawResponse == null || rawResponse.isBlank()) {
                    log.error(
                        "❌ [{}] Empty response from n8n!",
                        operationName
                    );
                    log.error(
                        "   └─ Check n8n workflow execution logs at: http://localhost:5678"
                    );
                    return Mono.error(
                        new AIServiceException(
                            "n8n returned empty response for " + operationName,
                            "N8N_EMPTY_RESPONSE"
                        )
                    );
                }
                try {
                    // n8n sometimes returns a JSON array - unwrap the first element
                    String toParse = rawResponse.trim();
                    if (toParse.startsWith("[")) {
                        log.info(
                            "📋 [{}] Response is an array - unwrapping first element",
                            operationName
                        );
                        com.fasterxml.jackson.databind.JsonNode arr =
                            objectMapper.readTree(toParse);
                        if (arr.isArray() && arr.size() > 0) {
                            toParse = objectMapper.writeValueAsString(arr.get(0));
                        } else {
                            throw new Exception(
                                "n8n returned an empty array response"
                            );
                        }
                    }
                    R response = objectMapper.readValue(toParse, responseType);
                    // Post-process: strip control markers and ensure success=true when text is present
                    postProcessResponse(response, operationName);
                    log.info(
                        "✅ [{}] Step 5: Response parsed successfully",
                        operationName
                    );
                    logResponseDetails(operationName, response);
                    log.info(
                        "═══════════════════════════════════════════════════════════"
                    );
                    return Mono.just(response);
                } catch (Exception e) {
                    log.error(
                        "❌ [{}] Failed to parse response: {}",
                        operationName,
                        e.getMessage()
                    );
                    log.error("   └─ Raw response: {}", rawResponse);
                    return Mono.error(
                        new AIServiceException(
                            "Failed to parse n8n response: " + e.getMessage(),
                            "N8N_PARSE_ERROR"
                        )
                    );
                }
            })
            .doOnError(error -> {
                long duration = System.currentTimeMillis() - startTime;
                log.error(
                    "❌ [{}] Generation failed after {}ms",
                    operationName,
                    duration
                );
                log.error("   └─ Error: {}", error.getMessage());
                log.error(
                    "═══════════════════════════════════════════════════════════"
                );
            })
            .onErrorMap(this::mapError);
    }

    private void logResponseDetails(String operationName, Object response) {
        if (response instanceof SopResponse sop) {
            log.info("   ├─ Success: {}", sop.isSuccess());
            log.info("   ├─ Model: {}", sop.getModel());
            log.info(
                "   └─ Generated text length: {} chars",
                sop.getGeneratedSop() != null
                    ? sop.getGeneratedSop().length()
                    : 0
            );
        } else if (response instanceof LorResponse lor) {
            log.info("   ├─ Success: {}", lor.isSuccess());
            log.info("   ├─ Model: {}", lor.getModel());
            log.info(
                "   └─ Generated text length: {} chars",
                lor.getGeneratedLor() != null
                    ? lor.getGeneratedLor().length()
                    : 0
            );
        } else if (response instanceof CoverLetterResponse cl) {
            log.info("   ├─ Success: {}", cl.isSuccess());
            log.info("   ├─ Model: {}", cl.getModel());
            log.info(
                "   └─ Generated text length: {} chars",
                cl.getGeneratedCoverLetter() != null
                    ? cl.getGeneratedCoverLetter().length()
                    : 0
            );
        }
    }

    /**
     * Post-processes every response to:
     * 1. Strip the <<<FINAL_OUTPUT>>> control marker that Claude sometimes leaks.
     * 2. Auto-set success = true whenever a non-blank generated text is present
     *    (n8n raw AI responses never send a "success" field, so it defaults false).
     */
    private void postProcessResponse(Object response, String operationName) {
        if (response instanceof SopResponse sop) {
            String text = stripControlMarkers(sop.getGeneratedSop());
            sop.setGeneratedSop(text);
            if (text != null && !text.isBlank()) {
                sop.setSuccess(true);
                log.info("   ✅ [{}] Auto-set success=true (SOP text present)", operationName);
            }
        } else if (response instanceof LorResponse lor) {
            String text = stripControlMarkers(lor.getGeneratedLor());
            lor.setGeneratedLor(text);
            if (text != null && !text.isBlank()) {
                lor.setSuccess(true);
                log.info("   ✅ [{}] Auto-set success=true (LOR text present)", operationName);
            }
        } else if (response instanceof CoverLetterResponse cl) {
            String text = stripControlMarkers(cl.getGeneratedCoverLetter());
            cl.setGeneratedCoverLetter(text);
            if (text != null && !text.isBlank()) {
                cl.setSuccess(true);
                log.info("   ✅ [{}] Auto-set success=true (Cover Letter text present)", operationName);
            }
        }
    }

    /**
     * Removes the <<<FINAL_OUTPUT>>> control marker that was intended as an
     * internal prompt instruction but sometimes leaks into Claude's output.
     * Also trims anything before the marker if present.
     */
    private String stripControlMarkers(String text) {
        if (text == null) return null;
        final String MARKER = "<<<FINAL_OUTPUT>>>";
        int markerIdx = text.indexOf(MARKER);
        if (markerIdx >= 0) {
            // Take everything after the marker
            text = text.substring(markerIdx + MARKER.length()).trim();
            log.info("   🔧 Stripped <<<FINAL_OUTPUT>>> control marker from response");
        }
        return text.trim();
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "null";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    // ─── Build methods: profile data + overrides merged ─────────────────────

    /**
     * Builds SOP request with field names matching the n8n "collect data" Code node.
     */
    private SopRequest buildSopRequestFromProfile(
        Map<String, Object> profileData,
        Map<String, Object> overrides
    ) {
        Map<String, String> edu = extractEducationEntries(profileData);

        String fullName    = resolveField(overrides, "full_name",
            getProfileString(profileData, "basic_info.full_name", null));
        String nationality = resolveField(overrides, "nationality",
            getProfileString(profileData, "basic_info.nationality", null));
        String homeCountry = resolveField(overrides, "home_country",
            getProfileString(profileData, "basic_info.country_of_origin",
                getProfileString(profileData, "basic_info.current_country", null)));
        String degreeLevel = resolveField(overrides, "degree_level",
            getProfileString(profileData, "preferences.degree_level", null));
        String program = resolveField(overrides, "program",
            getFirstPreferredProgram(profileData));
        String university = resolveField(overrides, "university", null);
        String fieldOfStudy = resolveField(overrides, "field_of_study", program);
        String motivation  = resolveField(overrides, "motivation",
            getProfileString(profileData, "goals.motivation", null));
        String workExp     = resolveField(overrides, "work_experience",
            getProfileString(profileData, "experience.experience_summary", null));
        String shortGoal   = resolveField(overrides, "short_term_goal",
            getProfileString(profileData, "goals.career_goals", null));
        String longGoal    = resolveField(overrides, "long_term_goal",
            getProfileString(profileData, "goals.long_term_goals", shortGoal));
        String strengths   = resolveField(overrides, "key_strengths",
            getProfileString(profileData, "experience.skills", null));
        String whyProgram  = resolveField(overrides, "why_program", motivation);
        String whyUni      = resolveField(overrides, "why_university",
            getProfileString(profileData, "goals.why_university",
                getProfileString(profileData, "goals.motivation",
                    getProfileString(profileData, "goals.career_goals", null))));
        String returnReason = resolveField(overrides, "return_reason",
            getProfileString(profileData, "goals.return_plan", shortGoal));
        String instName    = resolveField(overrides, "institution_name",
            edu.getOrDefault("bachelors_university", null));
        String gradYear    = resolveField(overrides, "graduation_year",
            edu.getOrDefault("bachelors_year", null));

        // New fields extraction
        String gender = resolveField(overrides, "gender",
            getProfileString(profileData, "basic_info.gender", null));
        
        String currentStatus = resolveField(overrides, "current_status",
            getProfileString(profileData, "basic_info.current_status",
                "true".equals(getProfileString(profileData, "experience.has_work_experience", null)) ? "Working Professional" : "Student"));
        
        String cgpaOrPercentage = resolveField(overrides, "cgpa_or_percentage",
            edu.getOrDefault("bachelors_cgpa", null));
        
        String experienceDetails = resolveField(overrides, "experience_details",
            getProfileString(profileData, "experience.experience_summary", null));
        
        String majorProjects = resolveField(overrides, "major_projects",
            getProfileString(profileData, "experience.projects", null));
        
        String internshipDetails = resolveField(overrides, "internship_details",
            getProfileString(profileData, "experience.internships", null));
        
        String certifications = resolveField(overrides, "certifications",
            getProfileString(profileData, "experience.certifications", null));
        
        String whyCountry = resolveField(overrides, "why_country",
            getProfileString(profileData, "goals.why_study_abroad", null));
        
        String challengesOvercome = resolveField(overrides, "challenges_overcome",
            getProfileString(profileData, "goals.challenges_overcome", null));
        
        String ieltsScore = resolveField(overrides, "ielts_score",
            getProfileString(profileData, "test_scores.ielts.overall_score", 
                "IELTS".equalsIgnoreCase(getProfileString(profileData, "test_scores.test_type", null)) ? 
                getProfileString(profileData, "test_scores.overall_score", null) : null));
        
        String germanLanguageLevel = resolveField(overrides, "german_language_level",
            getProfileString(profileData, "testing_compliance.german_language_level", null));

        String tone = resolveField(overrides, "tone", "PROFESSIONAL");
        Integer wordLimit = 800;
        if (overrides != null && overrides.get("word_limit") != null) {
            try {
                wordLimit = Integer.parseInt(overrides.get("word_limit").toString());
            } catch (Exception ignored) {}
        }
        String addReqs = resolveField(overrides, "additional_requirements", "");

        return SopRequest.builder()
            .fullName(fullName)
            .nationality(nationality)
            .homeCountry(homeCountry)
            .intendedCountry(resolveField(overrides, "intended_country", homeCountry))
            .gender(gender)
            .currentStatus(currentStatus)
            .university(university)
            .degreeLevel(degreeLevel)
            .program(program)
            .fieldOfStudy(fieldOfStudy)
            .institutionName(instName)
            .graduationYear(gradYear)
            .cgpaOrPercentage(cgpaOrPercentage)
            .motivation(motivation)
            .experienceType(resolveField(overrides, "experience_type", "Project/Internship"))
            .workExperience(workExp)
            .experienceDetails(experienceDetails)
            .majorProjects(majorProjects)
            .areasOfInterest(resolveField(overrides, "areas_of_interest", fieldOfStudy))
            .whyProgram(whyProgram)
            .whyUniversity(whyUni)
            .shortTermGoal(shortGoal)
            .longTermGoal(longGoal)
            .returnReason(returnReason)
            .keyStrengths(strengths)
            .internshipDetails(internshipDetails)
            .certifications(certifications)
            .whyCountry(whyCountry)
            .challengesOvercome(challengesOvercome)
            .ieltsScore(ieltsScore)
            .germanLanguageLevel(germanLanguageLevel)
            .tone(tone)
            .wordLimit(wordLimit)
            .additionalRequirements(addReqs)
            .build();
    }

    /**
     * Builds LOR request by reading from existing profile steps.
     * Overrides: senior_name, university_name, field
     */
    private LorRequest buildLorRequestFromProfile(
        Map<String, Object> profileData,
        Map<String, Object> overrides
    ) {
        String city = getProfileString(profileData, "basic_info.current_city", "");
        String country = getProfileString(profileData, "basic_info.current_country", "");
        String location = (!city.isBlank() || !country.isBlank())
            ? (city + ", " + country).replaceAll("^, |, $", "").strip()
            : "";

        String gender = resolveField(overrides, "gender",
            getProfileString(profileData, "basic_info.gender", null));
        
        String recommenderDesignation = resolveField(overrides, "recommender_designation",
            getProfileString(profileData, "automation_service.recommender_designation", null));
        
        String relationshipType = resolveField(overrides, "relationship_type",
            getProfileString(profileData, "automation_service.relationship_type", null));
        
        String relationshipDuration = resolveField(overrides, "relationship_duration",
            getProfileString(profileData, "automation_service.relationship_duration", null));
        
        String recommendationLevel = resolveField(overrides, "recommendation_level",
            getProfileString(profileData, "automation_service.recommendation_level", "highly recommend"));
        
        String analyticalSkills = resolveField(overrides, "analytical_skills",
            getProfileString(profileData, "automation_service.analytical_skills", null));
        
        String leadershipSkills = resolveField(overrides, "leadership_skills",
            getProfileString(profileData, "automation_service.leadership_skills", null));
        
        String teamwork = resolveField(overrides, "teamwork",
            getProfileString(profileData, "automation_service.teamwork", null));
        
        String researchAbility = resolveField(overrides, "research_ability",
            getProfileString(profileData, "automation_service.research_ability", null));
        
        String classRank = resolveField(overrides, "class_rank",
            getProfileString(profileData, "automation_service.class_rank", null));

        String tone = resolveField(overrides, "tone", "PROFESSIONAL");
        Integer wordLimit = 400;
        if (overrides != null && overrides.get("word_limit") != null) {
            try {
                wordLimit = Integer.parseInt(overrides.get("word_limit").toString());
            } catch (Exception ignored) {}
        }
        String addReqs = resolveField(overrides, "additional_requirements", "");

        return LorRequest.builder()
            .seniorName(
                resolveField(overrides, "senior_name", null)
            )
            .studentName(
                resolveField(
                    overrides, "student_name",
                    getProfileString(profileData, "basic_info.full_name", null)
                )
            )
            .gender(gender)
            .universityName(
                resolveField(
                    overrides, "university_name",
                    getProfileString(profileData, "automation_service.target_university", null)
                )
            )
            .location(
                resolveField(overrides, "location", location)
            )
            .field(
                resolveField(
                    overrides, "field",
                    getProfileString(profileData, "automation_service.target_program",
                        getFirstPreferredProgram(profileData))
                )
            )
            .recommenderDesignation(recommenderDesignation)
            .relationshipType(relationshipType)
            .relationshipDuration(relationshipDuration)
            .skills(
                resolveField(
                    overrides, "skills",
                    getProfileString(profileData, "experience.skills",
                        getProfileString(profileData, "automation_service.skills", null))
                )
            )
            .projects(
                resolveField(
                    overrides, "projects",
                    getProfileString(profileData, "experience.projects",
                        getProfileString(profileData, "automation_service.projects", null))
                )
            )
            .recommendationLevel(recommendationLevel)
            .analyticalSkills(analyticalSkills)
            .leadershipSkills(leadershipSkills)
            .teamwork(teamwork)
            .researchAbility(researchAbility)
            .classRank(classRank)
            .tone(tone)
            .wordLimit(wordLimit)
            .additionalRequirements(addReqs)
            .build();
    }

    /**
     * Builds Cover Letter request.
     * Profile auto-fills: student_name, passport_number, sponsor_name,
     *   + SSC/HSC/Bachelors extracted from education_entries array.
     * Frontend must supply via overrides:
     *   university_name, university_location, course_name, course_duration,
     *   course_start_date, tuition_fees, blocked_account_bank, blocked_account_balance
     */
    private CoverLetterRequest buildCoverLetterRequestFromProfile(
        Map<String, Object> profileData,
        Map<String, Object> overrides
    ) {
        // Parse education_entries array for SSC / HSC / Bachelors
        Map<String, String> edu = extractEducationEntries(profileData);

        String gender = resolveField(overrides, "gender",
            getProfileString(profileData, "basic_info.gender", null));
        
        String nationality = resolveField(overrides, "nationality",
            getProfileString(profileData, "basic_info.nationality", null));
        
        // v1.4.1 removed preferred_countries; try automation_service first, then study_preferences,
        // then default to "Germany" since this system issues National Visa for Study (Germany).
        String targetCountry = resolveField(overrides, "target_country",
            getProfileString(profileData, "automation_service.target_country",
                getProfileString(profileData, "preferences.target_country",
                    getProfileString(profileData, "study_preferences.target_country", "Germany"))));
        
        String visaType = resolveField(overrides, "visa_type",
            getProfileString(profileData, "automation_service.visa_type", "National Visa for Study (Germany)"));
        
        String sourceOfFunds = resolveField(overrides, "source_of_funds",
            getProfileString(profileData, "financial.funding_source", null));
        
        String accommodationDetails = resolveField(overrides, "accommodation_details",
            getProfileString(profileData, "preferences.accommodation_preference", null));
        
        String gapReason = resolveField(overrides, "gap_reason",
            getProfileString(profileData, "automation_service.gap_reason", null));
        
        String currentCompany = resolveField(overrides, "current_company",
            getProfileString(profileData, "automation_service.current_company", null));
        
        String futureReturnPlan = resolveField(overrides, "future_return_plan",
            getProfileString(profileData, "goals.post_study_plans", null));

        String tone = resolveField(overrides, "tone", "PROFESSIONAL");
        Integer wordLimit = 600;
        if (overrides != null && overrides.get("word_limit") != null) {
            try {
                wordLimit = Integer.parseInt(overrides.get("word_limit").toString());
            } catch (Exception ignored) {}
        }
        String addReqs = resolveField(overrides, "additional_requirements", "");

        return CoverLetterRequest.builder()
            .studentName(
                resolveField(
                    overrides, "student_name",
                    getProfileString(profileData, "basic_info.full_name", null)
                )
            )
            .gender(gender)
            .passportNumber(
                resolveField(
                    overrides, "passport_number",
                    getProfileString(profileData, "basic_info.passport_number", null)
                )
            )
            .nationality(nationality)
            .targetCountry(targetCountry)
            // --- University / course: MUST come from overrides ---
            .universityName(
                resolveField(
                    overrides, "university_name",
                    getProfileString(profileData, "automation_service.target_university", null)
                )
            )
            .universityLocation(
                resolveField(
                    overrides, "university_location",
                    getProfileString(profileData, "automation_service.university_location", null)
                )
            )
            .courseName(
                resolveField(
                    overrides, "course_name",
                    getProfileString(profileData, "automation_service.target_program", null)
                )
            )
            .courseDuration(
                resolveField(
                    overrides, "course_duration",
                    getProfileString(profileData, "automation_service.course_duration", null)
                )
            )
            .courseStartDate(
                resolveField(
                    overrides, "course_start_date",
                    getProfileString(profileData, "automation_service.course_start_date", null)
                )
            )
            .tuitionFees(
                resolveField(
                    overrides, "tuition_fees",
                    getProfileString(profileData, "automation_service.tuition_fees", null)
                )
            )
            // --- Blocked account: MUST come from overrides ---
            .blockedAccountBank(
                resolveField(
                    overrides, "blocked_account_bank",
                    getProfileString(profileData, "automation_service.blocked_account_bank", null)
                )
            )
            .blockedAccountBalance(
                resolveField(
                    overrides, "blocked_account_balance",
                    getProfileString(profileData, "automation_service.blocked_account_balance", null)
                )
            )
            .sponsorName(
                resolveField(
                    overrides, "sponsor_name",
                    getProfileString(profileData, "financial.sponsor_name",
                        getProfileString(profileData, "automation_service.sponsor_name", null))
                )
            )
            // --- Education: parsed from education_entries array ---
            .sscSchool(resolveField(overrides, "ssc_school",
                edu.getOrDefault("ssc_school", null)))
            .sscYear(resolveField(overrides, "ssc_year",
                edu.getOrDefault("ssc_year", null)))
            .sscMarks(resolveField(overrides, "ssc_marks",
                edu.getOrDefault("ssc_marks", null)))
            .hscInstitution(resolveField(overrides, "hsc_institution",
                edu.getOrDefault("hsc_institution", null)))
            .hscYear(resolveField(overrides, "hsc_year",
                edu.getOrDefault("hsc_year", null)))
            .hscMarks(resolveField(overrides, "hsc_marks",
                edu.getOrDefault("hsc_marks", null)))
            .bachelorsUniversity(resolveField(overrides, "bachelors_university",
                edu.getOrDefault("bachelors_university", null)))
            .bachelorsCourse(resolveField(overrides, "bachelors_course",
                edu.getOrDefault("bachelors_course", null)))
            .bachelorsCgpa(resolveField(overrides, "bachelors_cgpa",
                edu.getOrDefault("bachelors_cgpa", null)))
            .visaType(visaType)
            .sourceOfFunds(sourceOfFunds)
            .accommodationDetails(accommodationDetails)
            .gapReason(gapReason)
            .currentCompany(currentCompany)
            .futureReturnPlan(futureReturnPlan)
            .tone(tone)
            .wordLimit(wordLimit)
            .additionalRequirements(addReqs)
            .build();
    }

    // ─── Helper: resolve field (override wins, then profileValue) ────────────

    /** Returns overrideMap[key] if present & non-blank, else profileValue. */
    private String resolveField(
        Map<String, Object> overrides,
        String key,
        String profileValue
    ) {
        if (overrides != null) {
            Object v = overrides.get(key);
            if (v != null && !v.toString().isBlank()) {
                return v.toString().strip();
            }
        }
        return (profileValue != null && !profileValue.isBlank()) ? profileValue : null;
    }

    /**
     * Parses education_entries (array stored under education.education_entries)
     * and extracts SSC, HSC, and Bachelors fields into a flat map.
     * Education level detection:
     *   SSC  → education_level in ["SSC", "high_school"]
     *   HSC  → education_level in ["HSC"]
     *   Bachelors → education_level in ["bachelors"]
     */
    @SuppressWarnings("unchecked")
    private Map<String, String> extractEducationEntries(
        Map<String, Object> profileData
    ) {
        Map<String, String> result = new HashMap<>();
        try {
            Object eduStep = profileData.get("education");
            if (!(eduStep instanceof Map)) return result;
            Object entriesObj = ((Map<String, Object>) eduStep).get("education_entries");
            if (!(entriesObj instanceof List)) return result;

            List<Map<String, Object>> entries = (List<Map<String, Object>>) entriesObj;
            for (Map<String, Object> entry : entries) {
                String level = getString(entry, "education_level", "").toLowerCase();
                String institution = getString(entry, "institution_name", "");
                String gpa = getString(entry, "gpa", "");
                // v1.4.1 profile builder stores the year as "end_year"; fall back to legacy "graduation_year"
                String year = entry.get("end_year") != null
                    ? entry.get("end_year").toString()
                    : (entry.get("graduation_year") != null
                        ? entry.get("graduation_year").toString()
                        : "");
                String field = getString(entry, "field_of_study", "");

                if (level.equals("ssc") || level.equals("10th") || level.equals("10th grade") || level.equals("10th standard")) {
                    result.put("ssc_school", institution);
                    result.put("ssc_year", year);
                    result.put("ssc_marks", gpa);
                } else if (level.equals("hsc") || level.equals("high_school") || level.equals("high school") || level.equals("diploma")) {
                    result.put("hsc_institution", institution);
                    result.put("hsc_year", year);
                    result.put("hsc_marks", gpa);
                } else if (level.equals("bachelors")) {
                    result.put("bachelors_university", institution);
                    result.put("bachelors_course", field);
                    result.put("bachelors_cgpa", gpa);
                    result.put("bachelors_year", year); // needed for SOP graduationYear field
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Could not parse education_entries: {}", e.getMessage());
        }
        return result;
    }

    /**
     * Legacy helper kept for callers that still use the old signature.
     * Returns an empty map since we no longer need it for non-cover-letter flows.
     */
    private Map<String, String> extractEducationData(
        Map<String, Object> profileData
    ) {
        return extractEducationEntries(profileData);
    }

    /** Gets first entry from preferred_programs list (for SOP/LOR program field). */
    @SuppressWarnings("unchecked")
    private String getFirstPreferredProgram(Map<String, Object> profileData) {
        try {
            Object prefsStep = profileData.get("preferences");
            if (!(prefsStep instanceof Map)) return null;
            Object programs = ((Map<String, Object>) prefsStep).get("preferred_programs");
            if (programs instanceof List) {
                List<?> list = (List<?>) programs;
                if (!list.isEmpty()) return list.get(0).toString();
            }
        } catch (Exception ignored) {}
        return null;
    }

    /** Null-safe string getter from a generic map. */
    private String getString(Map<String, Object> map, String key, String def) {
        Object v = map.get(key);
        return (v != null) ? v.toString() : def;
    }

    @SuppressWarnings("unchecked")
    private String getProfileString(
        Map<String, Object> data,
        String path,
        String defaultValue
    ) {
        if (data == null) return defaultValue;
        String[] parts = path.split("\\.");
        Object current = data;
        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(part);
                if (current == null) return defaultValue;
            } else {
                return defaultValue;
            }
        }
        return current != null ? current.toString() : defaultValue;
    }

    private Throwable mapError(Throwable error) {
        if (error instanceof AIServiceException) return error;
        if (error instanceof WebClientResponseException wcre) {
            return new AIServiceException(
                "n8n error: " +
                    wcre.getStatusCode() +
                    " - " +
                    wcre.getResponseBodyAsString(),
                "N8N_HTTP_ERROR",
                error
            );
        }
        if (error instanceof java.util.concurrent.TimeoutException) {
            return new AIServiceException(
                "n8n timeout after " +
                    n8nProperties.getTimeout().toSeconds() +
                    "s",
                "N8N_TIMEOUT",
                error
            );
        }
        return new AIServiceException(
            "n8n unavailable: " + error.getMessage(),
            "N8N_UNAVAILABLE",
            error
        );
    }
}

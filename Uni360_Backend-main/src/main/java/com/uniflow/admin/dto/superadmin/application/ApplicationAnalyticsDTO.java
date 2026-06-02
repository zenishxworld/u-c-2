package com.uniflow.admin.dto.superadmin.application;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ApplicationAnalyticsDTO - Comprehensive application analytics and insights for Super Master Admin
 *
 * <p>This DTO provides detailed analytics about application processing, performance metrics,
 * bottleneck analysis, and workflow optimization insights for data-driven decision making.
 *
 * <p>Features:
 * - Application processing performance analytics
 * - Workflow bottleneck identification and analysis
 * - Admin performance and workload distribution
 * - University partnership performance metrics
 * - Processing time trend analysis
 * - Success rate and conversion analytics
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/applications/analytics
 * - GET /api/v1/superadmin/dashboard/applications/insights
 * - Super Master Admin application analytics dashboard
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApplicationAnalyticsDTO {

    // ===============================
    // APPLICATION PERFORMANCE ANALYTICS
    // ===============================

    @JsonProperty("performanceMetrics")
    private PerformanceMetrics performanceMetrics;

    @JsonProperty("workflowAnalytics")
    private WorkflowAnalytics workflowAnalytics;

    @JsonProperty("bottleneckAnalysis")
    private BottleneckAnalysis bottleneckAnalysis;

    @JsonProperty("adminPerformance")
    private AdminPerformance adminPerformance;

    @JsonProperty("universityAnalytics")
    private UniversityAnalytics universityAnalytics;

    @JsonProperty("processingTrends")
    private ProcessingTrends processingTrends;

    // Metadata
    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("analysisDate")
    private String analysisDate;

    @JsonProperty("reportingPeriod")
    private String reportingPeriod;

    @JsonProperty("dataQuality")
    private String dataQuality; // EXCELLENT, GOOD, FAIR, POOR

    // ===============================
    // PERFORMANCE METRICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerformanceMetrics {

        @JsonProperty("totalApplicationsProcessed")
        private Long totalApplicationsProcessed;

        @JsonProperty("averageProcessingTimeHours")
        private BigDecimal averageProcessingTimeHours;

        @JsonProperty("medianProcessingTimeHours")
        private BigDecimal medianProcessingTimeHours;

        @JsonProperty("fastestProcessingTimeHours")
        private BigDecimal fastestProcessingTimeHours;

        @JsonProperty("slowestProcessingTimeHours")
        private BigDecimal slowestProcessingTimeHours;

        @JsonProperty("overallSuccessRate")
        private BigDecimal overallSuccessRate; // percentage

        @JsonProperty("completionRate")
        private BigDecimal completionRate; // percentage

        @JsonProperty("rejectionRate")
        private BigDecimal rejectionRate; // percentage

        @JsonProperty("withdrawalRate")
        private BigDecimal withdrawalRate; // percentage

        @JsonProperty("applicationThroughput")
        private BigDecimal applicationThroughput; // applications per day

        @JsonProperty("peakProcessingHours")
        private Map<String, Long> peakProcessingHours;

        @JsonProperty("slaCompliance")
        private BigDecimal slaCompliance; // percentage

        @JsonProperty("qualityScore")
        private BigDecimal qualityScore; // 0-100

        @JsonProperty("performanceTrend")
        private List<TrendDataPoint> performanceTrend;
    }

    // ===============================
    // WORKFLOW ANALYTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkflowAnalytics {

        @JsonProperty("stageMetrics")
        private Map<String, StageMetrics> stageMetrics;

        @JsonProperty("stageTransitionTimes")
        private Map<String, BigDecimal> stageTransitionTimes;

        @JsonProperty("dropoffRates")
        private Map<String, BigDecimal> dropoffRates;

        @JsonProperty("automationEfficiency")
        private BigDecimal automationEfficiency; // percentage

        @JsonProperty("manualInterventionRate")
        private BigDecimal manualInterventionRate; // percentage

        @JsonProperty("workflowOptimizationScore")
        private BigDecimal workflowOptimizationScore; // 0-100

        @JsonProperty("parallelProcessingUtilization")
        private BigDecimal parallelProcessingUtilization; // percentage

        @JsonProperty("workflowComplexityIndex")
        private BigDecimal workflowComplexityIndex; // 0-10

        @JsonProperty("errorRecoveryTime")
        private BigDecimal errorRecoveryTime; // hours

        @JsonProperty("workflowStabilityScore")
        private BigDecimal workflowStabilityScore; // 0-100
    }

    // ===============================
    // BOTTLENECK ANALYSIS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BottleneckAnalysis {

        @JsonProperty("identifiedBottlenecks")
        private List<BottleneckInfo> identifiedBottlenecks;

        @JsonProperty("criticalPathAnalysis")
        private CriticalPathAnalysis criticalPathAnalysis;

        @JsonProperty("resourceConstraints")
        private List<ResourceConstraint> resourceConstraints;

        @JsonProperty("capacityUtilization")
        private Map<String, BigDecimal> capacityUtilization;

        @JsonProperty("queueAnalysis")
        private QueueAnalysis queueAnalysis;

        @JsonProperty("recommendedOptimizations")
        private List<OptimizationRecommendation> recommendedOptimizations;

        @JsonProperty("impactAssessment")
        private ImpactAssessment impactAssessment;
    }

    // ===============================
    // ADMIN PERFORMANCE
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdminPerformance {

        @JsonProperty("adminMetrics")
        private Map<String, AdminMetrics> adminMetrics;

        @JsonProperty("workloadDistribution")
        private Map<String, Long> workloadDistribution;

        @JsonProperty("averageResponseTime")
        private BigDecimal averageResponseTime; // hours

        @JsonProperty("adminEfficiencyScores")
        private Map<String, BigDecimal> adminEfficiencyScores;

        @JsonProperty("specialistPerformance")
        private Map<String, SpecialistMetrics> specialistPerformance;

        @JsonProperty("teamProductivity")
        private TeamProductivity teamProductivity;

        @JsonProperty("trainingNeeds")
        private List<TrainingNeed> trainingNeeds;

        @JsonProperty("performanceComparison")
        private List<AdminComparison> performanceComparison;
    }

    // ===============================
    // UNIVERSITY ANALYTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UniversityAnalytics {

        @JsonProperty("universityPerformance")
        private Map<String, UniversityMetrics> universityPerformance;

        @JsonProperty("applicationVolumeTrends")
        private Map<String, List<TrendDataPoint>> applicationVolumeTrends;

        @JsonProperty("acceptanceRates")
        private Map<String, BigDecimal> acceptanceRates;

        @JsonProperty("processingTimeByUniversity")
        private Map<String, BigDecimal> processingTimeByUniversity;

        @JsonProperty("documentRequirementCompliance")
        private Map<String, BigDecimal> documentRequirementCompliance;

        @JsonProperty("partnershipEffectiveness")
        private Map<String, PartnershipMetrics> partnershipEffectiveness;

        @JsonProperty("marketShareAnalysis")
        private MarketShareAnalysis marketShareAnalysis;

        @JsonProperty("competitiveInsights")
        private List<CompetitiveInsight> competitiveInsights;
    }

    // ===============================
    // PROCESSING TRENDS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProcessingTrends {

        @JsonProperty("volumeTrends")
        private List<TrendDataPoint> volumeTrends;

        @JsonProperty("timeTrends")
        private List<TrendDataPoint> timeTrends;

        @JsonProperty("successRateTrends")
        private List<TrendDataPoint> successRateTrends;

        @JsonProperty("seasonalPatterns")
        private List<SeasonalPattern> seasonalPatterns;

        @JsonProperty("forecastedMetrics")
        private ForecastedMetrics forecastedMetrics;

        @JsonProperty("anomalyDetection")
        private List<AnomalyDetection> anomalyDetection;

        @JsonProperty("correlationAnalysis")
        private CorrelationAnalysis correlationAnalysis;
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StageMetrics {

        @JsonProperty("averageTimeHours")
        private BigDecimal averageTimeHours;

        @JsonProperty("throughput")
        private BigDecimal throughput; // applications per day

        @JsonProperty("successRate")
        private BigDecimal successRate;

        @JsonProperty("errorRate")
        private BigDecimal errorRate;

        @JsonProperty("capacity")
        private Long capacity;

        @JsonProperty("utilization")
        private BigDecimal utilization;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BottleneckInfo {

        @JsonProperty("location")
        private String location;

        @JsonProperty("severity")
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("impactLevel")
        private String impactLevel; // MINIMAL, MODERATE, SIGNIFICANT, SEVERE

        @JsonProperty("affectedApplications")
        private Long affectedApplications;

        @JsonProperty("delayContribution")
        private BigDecimal delayContribution; // percentage

        @JsonProperty("description")
        private String description;

        @JsonProperty("rootCause")
        private String rootCause;

        @JsonProperty("recommendedSolution")
        private String recommendedSolution;

        @JsonProperty("estimatedResolutionTime")
        private String estimatedResolutionTime;

        @JsonProperty("priority")
        private Integer priority; // 1-10
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdminMetrics {

        @JsonProperty("applicationsHandled")
        private Long applicationsHandled;

        @JsonProperty("averageProcessingTime")
        private BigDecimal averageProcessingTime;

        @JsonProperty("successRate")
        private BigDecimal successRate;

        @JsonProperty("workloadUtilization")
        private BigDecimal workloadUtilization;

        @JsonProperty("responseTime")
        private BigDecimal responseTime;

        @JsonProperty("qualityScore")
        private BigDecimal qualityScore;

        @JsonProperty("specializations")
        private List<String> specializations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrendDataPoint {

        @JsonProperty("date")
        private String date;

        @JsonProperty("value")
        private BigDecimal value;

        @JsonProperty("label")
        private String label;

        @JsonProperty("changeFromPrevious")
        private BigDecimal changeFromPrevious;

        @JsonProperty("percentageChange")
        private BigDecimal percentageChange;

        @JsonProperty("movingAverage")
        private BigDecimal movingAverage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CriticalPathAnalysis {

        @JsonProperty("longestPath")
        private List<String> longestPath;

        @JsonProperty("criticalStages")
        private List<String> criticalStages;

        @JsonProperty("totalCriticalTime")
        private BigDecimal totalCriticalTime;

        @JsonProperty("optimizationPotential")
        private BigDecimal optimizationPotential;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResourceConstraint {

        @JsonProperty("resource")
        private String resource;

        @JsonProperty("constraintType")
        private String constraintType; // CAPACITY, SKILL, TIME, SYSTEM

        @JsonProperty("severity")
        private String severity;

        @JsonProperty("impact")
        private String impact;

        @JsonProperty("recommendation")
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QueueAnalysis {

        @JsonProperty("averageQueueLength")
        private BigDecimal averageQueueLength;

        @JsonProperty("maxQueueLength")
        private Long maxQueueLength;

        @JsonProperty("queueWaitTime")
        private BigDecimal queueWaitTime;

        @JsonProperty("queueThroughput")
        private BigDecimal queueThroughput;

        @JsonProperty("queueEfficiency")
        private BigDecimal queueEfficiency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OptimizationRecommendation {

        @JsonProperty("area")
        private String area;

        @JsonProperty("recommendation")
        private String recommendation;

        @JsonProperty("impact")
        private String impact; // HIGH, MEDIUM, LOW

        @JsonProperty("effort")
        private String effort; // HIGH, MEDIUM, LOW

        @JsonProperty("priority")
        private Integer priority;

        @JsonProperty("estimatedImprovement")
        private BigDecimal estimatedImprovement;

        @JsonProperty("implementationTime")
        private String implementationTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ImpactAssessment {

        @JsonProperty("businessImpact")
        private String businessImpact;

        @JsonProperty("customerImpact")
        private String customerImpact;

        @JsonProperty("operationalImpact")
        private String operationalImpact;

        @JsonProperty("financialImpact")
        private BigDecimal financialImpact;

        @JsonProperty("riskLevel")
        private String riskLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SpecialistMetrics {

        @JsonProperty("specialization")
        private String specialization;

        @JsonProperty("expertiseLevel")
        private String expertiseLevel;

        @JsonProperty("caseVolume")
        private Long caseVolume;

        @JsonProperty("successRate")
        private BigDecimal successRate;

        @JsonProperty("averageHandlingTime")
        private BigDecimal averageHandlingTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TeamProductivity {

        @JsonProperty("overallProductivity")
        private BigDecimal overallProductivity;

        @JsonProperty("collaborationScore")
        private BigDecimal collaborationScore;

        @JsonProperty("knowledgeSharing")
        private BigDecimal knowledgeSharing;

        @JsonProperty("crossTrainingLevel")
        private BigDecimal crossTrainingLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrainingNeed {

        @JsonProperty("area")
        private String area;

        @JsonProperty("priority")
        private String priority;

        @JsonProperty("affectedAdmins")
        private List<String> affectedAdmins;

        @JsonProperty("skillGap")
        private String skillGap;

        @JsonProperty("recommendedTraining")
        private String recommendedTraining;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdminComparison {

        @JsonProperty("adminId")
        private String adminId;

        @JsonProperty("adminName")
        private String adminName;

        @JsonProperty("rank")
        private Integer rank;

        @JsonProperty("score")
        private BigDecimal score;

        @JsonProperty("strengths")
        private List<String> strengths;

        @JsonProperty("improvementAreas")
        private List<String> improvementAreas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UniversityMetrics {

        @JsonProperty("applicationVolume")
        private Long applicationVolume;

        @JsonProperty("acceptanceRate")
        private BigDecimal acceptanceRate;

        @JsonProperty("averageProcessingTime")
        private BigDecimal averageProcessingTime;

        @JsonProperty("documentCompliance")
        private BigDecimal documentCompliance;

        @JsonProperty("studentSatisfaction")
        private BigDecimal studentSatisfaction;

        @JsonProperty("partnershipRating")
        private BigDecimal partnershipRating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PartnershipMetrics {

        @JsonProperty("collaborationScore")
        private BigDecimal collaborationScore;

        @JsonProperty("communicationEfficiency")
        private BigDecimal communicationEfficiency;

        @JsonProperty("responseTime")
        private BigDecimal responseTime;

        @JsonProperty("issueResolutionTime")
        private BigDecimal issueResolutionTime;

        @JsonProperty("mutualSatisfaction")
        private BigDecimal mutualSatisfaction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MarketShareAnalysis {

        @JsonProperty("currentMarketShare")
        private BigDecimal currentMarketShare;

        @JsonProperty("marketGrowthRate")
        private BigDecimal marketGrowthRate;

        @JsonProperty("competitivePosition")
        private String competitivePosition;

        @JsonProperty("marketOpportunities")
        private List<String> marketOpportunities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CompetitiveInsight {

        @JsonProperty("competitor")
        private String competitor;

        @JsonProperty("strengthsVsUs")
        private List<String> strengthsVsUs;

        @JsonProperty("weaknessesVsUs")
        private List<String> weaknessesVsUs;

        @JsonProperty("marketPosition")
        private String marketPosition;

        @JsonProperty("recommendedStrategy")
        private String recommendedStrategy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SeasonalPattern {

        @JsonProperty("period")
        private String period;

        @JsonProperty("pattern")
        private String pattern;

        @JsonProperty("magnitude")
        private BigDecimal magnitude;

        @JsonProperty("reliability")
        private BigDecimal reliability;

        @JsonProperty("impact")
        private String impact;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ForecastedMetrics {

        @JsonProperty("nextMonthVolume")
        private Long nextMonthVolume;

        @JsonProperty("nextQuarterVolume")
        private Long nextQuarterVolume;

        @JsonProperty("predictedBottlenecks")
        private List<String> predictedBottlenecks;

        @JsonProperty("resourceRequirements")
        private Map<String, Long> resourceRequirements;

        @JsonProperty("confidence")
        private BigDecimal confidence;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AnomalyDetection {

        @JsonProperty("type")
        private String type;

        @JsonProperty("detectedAt")
        private LocalDateTime detectedAt;

        @JsonProperty("severity")
        private String severity;

        @JsonProperty("description")
        private String description;

        @JsonProperty("impact")
        private String impact;

        @JsonProperty("recommendation")
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CorrelationAnalysis {

        @JsonProperty("strongCorrelations")
        private Map<String, BigDecimal> strongCorrelations;

        @JsonProperty("leadingIndicators")
        private List<String> leadingIndicators;

        @JsonProperty("laggingIndicators")
        private List<String> laggingIndicators;

        @JsonProperty("causalRelationships")
        private Map<String, String> causalRelationships;
    }
}

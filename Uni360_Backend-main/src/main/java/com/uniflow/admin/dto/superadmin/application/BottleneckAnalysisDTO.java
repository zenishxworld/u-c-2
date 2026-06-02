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

/**
 * BottleneckAnalysisDTO - Comprehensive workflow bottleneck analysis for Super Master Admin
 *
 * <p>This DTO provides detailed analysis of workflow bottlenecks, processing delays,
 * and system performance issues to help identify and resolve application processing
 * inefficiencies in the education consultation workflow.
 *
 * <p>Features:
 * - Real-time bottleneck identification and monitoring
 * - Workflow stage performance analysis
 * - Resource utilization and capacity analysis
 * - Processing time variance detection
 * - Predictive bottleneck modeling
 * - Optimization recommendation engine
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/applications/bottlenecks
 * - GET /api/v1/superadmin/dashboard/applications/workflow-analysis
 * - Super Master Admin workflow optimization dashboard
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
public class BottleneckAnalysisDTO {

    // ===============================
    // BOTTLENECK IDENTIFICATION
    // ===============================

    @JsonProperty("identifiedBottlenecks")
    private List<BottleneckDetails> identifiedBottlenecks;

    @JsonProperty("workflowStageAnalysis")
    private Map<String, StageAnalysis> workflowStageAnalysis;

    @JsonProperty("systemwideMetrics")
    private SystemwideMetrics systemwideMetrics;

    @JsonProperty("predictiveAnalysis")
    private PredictiveAnalysis predictiveAnalysis;

    @JsonProperty("optimizationRecommendations")
    private List<OptimizationRecommendation> optimizationRecommendations;

    // Metadata
    @JsonProperty("analysisTimestamp")
    private LocalDateTime analysisTimestamp;

    @JsonProperty("analysisType")
    private String analysisType; // REAL_TIME, HISTORICAL, PREDICTIVE

    @JsonProperty("confidenceLevel")
    private BigDecimal confidenceLevel; // 0-100

    @JsonProperty("dataCompleteness")
    private BigDecimal dataCompleteness; // 0-100

    // ===============================
    // BOTTLENECK DETAILS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BottleneckDetails {

        @JsonProperty("bottleneckId")
        private String bottleneckId;

        @JsonProperty("location")
        private String location; // WORKFLOW_STAGE, ADMIN_QUEUE, SYSTEM_PROCESS

        @JsonProperty("stageOrProcess")
        private String stageOrProcess;

        @JsonProperty("severity")
        private String severity; // CRITICAL, HIGH, MEDIUM, LOW

        @JsonProperty("impact")
        private BottleneckImpact impact;

        @JsonProperty("rootCause")
        private RootCauseAnalysis rootCause;

        @JsonProperty("affectedApplications")
        private Long affectedApplications;

        @JsonProperty("averageDelayHours")
        private BigDecimal averageDelayHours;

        @JsonProperty("maxDelayHours")
        private BigDecimal maxDelayHours;

        @JsonProperty("processingBacklog")
        private Long processingBacklog;

        @JsonProperty("throughputReduction")
        private BigDecimal throughputReduction; // percentage

        @JsonProperty("firstDetected")
        private LocalDateTime firstDetected;

        @JsonProperty("lastObserved")
        private LocalDateTime lastObserved;

        @JsonProperty("frequency")
        private String frequency; // PERSISTENT, RECURRING, INTERMITTENT, ONE_TIME

        @JsonProperty("trend")
        private String trend; // WORSENING, STABLE, IMPROVING

        @JsonProperty("resolutionPriority")
        private Integer resolutionPriority; // 1-10

        @JsonProperty("estimatedResolutionTime")
        private String estimatedResolutionTime;

        @JsonProperty("resourceRequirements")
        private List<String> resourceRequirements;

        @JsonProperty("workArounds")
        private List<String> workArounds;
    }

    // ===============================
    // STAGE ANALYSIS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StageAnalysis {

        @JsonProperty("stageName")
        private String stageName;

        @JsonProperty("stageType")
        private String stageType; // AUTOMATED, MANUAL, HYBRID

        @JsonProperty("currentLoad")
        private Long currentLoad;

        @JsonProperty("maxCapacity")
        private Long maxCapacity;

        @JsonProperty("utilizationRate")
        private BigDecimal utilizationRate; // 0-100

        @JsonProperty("averageProcessingTime")
        private BigDecimal averageProcessingTime; // hours

        @JsonProperty("standardDeviation")
        private BigDecimal standardDeviation;

        @JsonProperty("processingVariance")
        private BigDecimal processingVariance;

        @JsonProperty("queueLength")
        private Long queueLength;

        @JsonProperty("waitTimeInQueue")
        private BigDecimal waitTimeInQueue; // hours

        @JsonProperty("throughputRate")
        private BigDecimal throughputRate; // applications per hour

        @JsonProperty("errorRate")
        private BigDecimal errorRate; // percentage

        @JsonProperty("retryRate")
        private BigDecimal retryRate; // percentage

        @JsonProperty("successRate")
        private BigDecimal successRate; // percentage

        @JsonProperty("resourceUtilization")
        private Map<String, BigDecimal> resourceUtilization;

        @JsonProperty("performanceIndicators")
        private StagePerformanceIndicators performanceIndicators;

        @JsonProperty("bottleneckRisk")
        private String bottleneckRisk; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("improvementPotential")
        private BigDecimal improvementPotential; // percentage

        @JsonProperty("recommendedActions")
        private List<String> recommendedActions;
    }

    // ===============================
    // SYSTEMWIDE METRICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SystemwideMetrics {

        @JsonProperty("overallEfficiency")
        private BigDecimal overallEfficiency; // 0-100

        @JsonProperty("systemThroughput")
        private BigDecimal systemThroughput; // applications per day

        @JsonProperty("averageEndToEndTime")
        private BigDecimal averageEndToEndTime; // hours

        @JsonProperty("bottleneckFrequency")
        private BigDecimal bottleneckFrequency; // per week

        @JsonProperty("systemStability")
        private BigDecimal systemStability; // 0-100

        @JsonProperty("capacityUtilization")
        private BigDecimal capacityUtilization; // 0-100

        @JsonProperty("workloadDistribution")
        private Map<String, BigDecimal> workloadDistribution;

        @JsonProperty("processVariability")
        private BigDecimal processVariability;

        @JsonProperty("automationLevel")
        private BigDecimal automationLevel; // percentage

        @JsonProperty("manualInterventionRate")
        private BigDecimal manualInterventionRate; // percentage

        @JsonProperty("systemHealthScore")
        private BigDecimal systemHealthScore; // 0-100

        @JsonProperty("performanceTrend")
        private String performanceTrend; // IMPROVING, STABLE, DECLINING

        @JsonProperty("criticalMetrics")
        private List<CriticalMetric> criticalMetrics;
    }

    // ===============================
    // PREDICTIVE ANALYSIS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PredictiveAnalysis {

        @JsonProperty("futureBottlenecks")
        private List<PredictedBottleneck> futureBottlenecks;

        @JsonProperty("capacityForecasting")
        private CapacityForecasting capacityForecasting;

        @JsonProperty("workloadProjection")
        private WorkloadProjection workloadProjection;

        @JsonProperty("riskAssessment")
        private RiskAssessment riskAssessment;

        @JsonProperty("scenarioAnalysis")
        private List<ScenarioAnalysis> scenarioAnalysis;

        @JsonProperty("modelAccuracy")
        private BigDecimal modelAccuracy; // 0-100

        @JsonProperty("predictionHorizon")
        private String predictionHorizon; // 1_WEEK, 1_MONTH, 3_MONTHS

        @JsonProperty("keyAssumptions")
        private List<String> keyAssumptions;

        @JsonProperty("uncertaintyFactors")
        private List<String> uncertaintyFactors;
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BottleneckImpact {

        @JsonProperty("businessImpact")
        private String businessImpact; // MINIMAL, MODERATE, SIGNIFICANT, SEVERE

        @JsonProperty("customerImpact")
        private String customerImpact; // MINIMAL, MODERATE, SIGNIFICANT, SEVERE

        @JsonProperty("operationalImpact")
        private String operationalImpact; // MINIMAL, MODERATE, SIGNIFICANT, SEVERE

        @JsonProperty("financialImpact")
        private BigDecimal financialImpact; // estimated cost

        @JsonProperty("reputationImpact")
        private String reputationImpact; // MINIMAL, MODERATE, SIGNIFICANT, SEVERE

        @JsonProperty("slaViolations")
        private Long slaViolations;

        @JsonProperty("customerComplaints")
        private Long customerComplaints;

        @JsonProperty("delayedApplications")
        private Long delayedApplications;

        @JsonProperty("lostOpportunities")
        private Long lostOpportunities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RootCauseAnalysis {

        @JsonProperty("primaryCause")
        private String primaryCause;

        @JsonProperty("contributingFactors")
        private List<String> contributingFactors;

        @JsonProperty("systemFactors")
        private List<String> systemFactors;

        @JsonProperty("humanFactors")
        private List<String> humanFactors;

        @JsonProperty("processFactors")
        private List<String> processFactors;

        @JsonProperty("externalFactors")
        private List<String> externalFactors;

        @JsonProperty("causeProbability")
        private BigDecimal causeProbability; // 0-100

        @JsonProperty("evidenceLevel")
        private String evidenceLevel; // STRONG, MODERATE, WEAK, SPECULATIVE

        @JsonProperty("investigationStatus")
        private String investigationStatus; // COMPLETE, ONGOING, PLANNED

        @JsonProperty("recommendedInvestigation")
        private List<String> recommendedInvestigation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StagePerformanceIndicators {

        @JsonProperty("leadTime")
        private BigDecimal leadTime; // hours

        @JsonProperty("cycleTime")
        private BigDecimal cycleTime; // hours

        @JsonProperty("waitTime")
        private BigDecimal waitTime; // hours

        @JsonProperty("processingTime")
        private BigDecimal processingTime; // hours

        @JsonProperty("firstPassYield")
        private BigDecimal firstPassYield; // percentage

        @JsonProperty("reworkRate")
        private BigDecimal reworkRate; // percentage

        @JsonProperty("qualityScore")
        private BigDecimal qualityScore; // 0-100

        @JsonProperty("customerSatisfaction")
        private BigDecimal customerSatisfaction; // 0-100
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OptimizationRecommendation {

        @JsonProperty("recommendationId")
        private String recommendationId;

        @JsonProperty("title")
        private String title;

        @JsonProperty("description")
        private String description;

        @JsonProperty("targetBottleneck")
        private String targetBottleneck;

        @JsonProperty("category")
        private String category; // PROCESS, TECHNOLOGY, RESOURCE, POLICY

        @JsonProperty("impact")
        private String impact; // HIGH, MEDIUM, LOW

        @JsonProperty("effort")
        private String effort; // HIGH, MEDIUM, LOW

        @JsonProperty("priority")
        private Integer priority; // 1-10

        @JsonProperty("estimatedImprovement")
        private BigDecimal estimatedImprovement; // percentage

        @JsonProperty("implementationTime")
        private String implementationTime;

        @JsonProperty("resourceRequirements")
        private List<String> resourceRequirements;

        @JsonProperty("prerequisites")
        private List<String> prerequisites;

        @JsonProperty("risks")
        private List<String> risks;

        @JsonProperty("dependencies")
        private List<String> dependencies;

        @JsonProperty("successMetrics")
        private List<String> successMetrics;

        @JsonProperty("rollbackPlan")
        private String rollbackPlan;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CriticalMetric {

        @JsonProperty("metricName")
        private String metricName;

        @JsonProperty("currentValue")
        private BigDecimal currentValue;

        @JsonProperty("threshold")
        private BigDecimal threshold;

        @JsonProperty("status")
        private String status; // NORMAL, WARNING, CRITICAL

        @JsonProperty("trend")
        private String trend; // IMPROVING, STABLE, DETERIORATING

        @JsonProperty("lastUpdate")
        private LocalDateTime lastUpdate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PredictedBottleneck {

        @JsonProperty("location")
        private String location;

        @JsonProperty("probability")
        private BigDecimal probability; // 0-100

        @JsonProperty("expectedOccurrence")
        private LocalDateTime expectedOccurrence;

        @JsonProperty("estimatedSeverity")
        private String estimatedSeverity;

        @JsonProperty("triggeringFactors")
        private List<String> triggeringFactors;

        @JsonProperty("preventiveMeasures")
        private List<String> preventiveMeasures;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CapacityForecasting {

        @JsonProperty("currentCapacity")
        private Long currentCapacity;

        @JsonProperty("projectedDemand")
        private Map<String, Long> projectedDemand; // time period -> demand

        @JsonProperty("capacityGaps")
        private Map<String, Long> capacityGaps;

        @JsonProperty("recommendedCapacityIncreases")
        private Map<String, Long> recommendedCapacityIncreases;

        @JsonProperty("forecastAccuracy")
        private BigDecimal forecastAccuracy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkloadProjection {

        @JsonProperty("currentWorkload")
        private Long currentWorkload;

        @JsonProperty("projectedWorkload")
        private Map<String, Long> projectedWorkload;

        @JsonProperty("peakPeriods")
        private List<String> peakPeriods;

        @JsonProperty("lowPeriods")
        private List<String> lowPeriods;

        @JsonProperty("workloadVariability")
        private BigDecimal workloadVariability;

        @JsonProperty("seasonalFactors")
        private Map<String, BigDecimal> seasonalFactors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RiskAssessment {

        @JsonProperty("overallRiskLevel")
        private String overallRiskLevel; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("identifiedRisks")
        private List<RiskFactor> identifiedRisks;

        @JsonProperty("mitigationStrategies")
        private List<String> mitigationStrategies;

        @JsonProperty("contingencyPlans")
        private List<String> contingencyPlans;

        @JsonProperty("monitoringRequirements")
        private List<String> monitoringRequirements;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RiskFactor {

        @JsonProperty("riskName")
        private String riskName;

        @JsonProperty("probability")
        private BigDecimal probability;

        @JsonProperty("impact")
        private String impact;

        @JsonProperty("riskScore")
        private BigDecimal riskScore;

        @JsonProperty("mitigation")
        private String mitigation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ScenarioAnalysis {

        @JsonProperty("scenarioName")
        private String scenarioName;

        @JsonProperty("description")
        private String description;

        @JsonProperty("probability")
        private BigDecimal probability;

        @JsonProperty("predictedOutcome")
        private String predictedOutcome;

        @JsonProperty("impactAssessment")
        private String impactAssessment;

        @JsonProperty("responseStrategy")
        private String responseStrategy;
    }
}

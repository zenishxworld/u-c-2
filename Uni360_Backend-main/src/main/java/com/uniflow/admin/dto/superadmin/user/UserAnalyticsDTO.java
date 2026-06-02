package com.uniflow.admin.dto.superadmin.user;

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
 * UserAnalyticsDTO - Comprehensive user analytics and insights for Super Master Admin
 *
 * <p>This DTO provides detailed analytics about user behavior, engagement patterns,
 * demographic insights, and system usage statistics for data-driven decision making.
 *
 * <p>Features:
 * - User engagement and activity analytics
 * - Demographic and geographic insights
 * - User journey and conversion analytics
 * - Risk assessment and security metrics
 * - Growth and retention analytics
 * - Performance benchmarking
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/users/analytics
 * - GET /api/v1/superadmin/dashboard/users/insights
 * - Super Master Admin analytics dashboard
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
public class UserAnalyticsDTO {

    // ===============================
    // USER ENGAGEMENT ANALYTICS
    // ===============================

    @JsonProperty("engagementMetrics")
    private EngagementMetrics engagementMetrics;

    @JsonProperty("demographicInsights")
    private DemographicInsights demographicInsights;

    @JsonProperty("userJourneyAnalytics")
    private UserJourneyAnalytics userJourneyAnalytics;

    @JsonProperty("riskAnalytics")
    private RiskAnalytics riskAnalytics;

    @JsonProperty("growthAnalytics")
    private GrowthAnalytics growthAnalytics;

    @JsonProperty("performanceMetrics")
    private PerformanceMetrics performanceMetrics;

    // Metadata
    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("analysisDate")
    private String analysisDate;

    @JsonProperty("dataQuality")
    private String dataQuality; // EXCELLENT, GOOD, FAIR, POOR

    @JsonProperty("confidenceLevel")
    private BigDecimal confidenceLevel;

    // ===============================
    // ENGAGEMENT METRICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EngagementMetrics {

        @JsonProperty("dailyActiveUsers")
        private Long dailyActiveUsers;

        @JsonProperty("weeklyActiveUsers")
        private Long weeklyActiveUsers;

        @JsonProperty("monthlyActiveUsers")
        private Long monthlyActiveUsers;

        @JsonProperty("averageSessionDuration")
        private String averageSessionDuration; // in minutes

        @JsonProperty("averageLoginsPerUser")
        private BigDecimal averageLoginsPerUser;

        @JsonProperty("userRetentionRate7Days")
        private BigDecimal userRetentionRate7Days;

        @JsonProperty("userRetentionRate30Days")
        private BigDecimal userRetentionRate30Days;

        @JsonProperty("userRetentionRate90Days")
        private BigDecimal userRetentionRate90Days;

        @JsonProperty("churnRate")
        private BigDecimal churnRate;

        @JsonProperty("stickiness")
        private BigDecimal stickiness; // DAU/MAU ratio

        @JsonProperty("engagementScore")
        private BigDecimal engagementScore; // 0-100

        @JsonProperty("activityDistribution")
        private Map<String, Long> activityDistribution;

        @JsonProperty("engagementTrend")
        private List<TrendDataPoint> engagementTrend;

        @JsonProperty("cohortAnalysis")
        private List<CohortData> cohortAnalysis;
    }

    // ===============================
    // DEMOGRAPHIC INSIGHTS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DemographicInsights {

        @JsonProperty("usersByCountry")
        private Map<String, UserCountryStats> usersByCountry;

        @JsonProperty("usersByUserType")
        private Map<String, Long> usersByUserType;

        @JsonProperty("usersByAuthProvider")
        private Map<String, Long> usersByAuthProvider;

        @JsonProperty("usersByVerificationStatus")
        private Map<String, Long> usersByVerificationStatus;

        @JsonProperty("registrationTrends")
        private List<TrendDataPoint> registrationTrends;

        @JsonProperty("topCountries")
        private List<CountryRanking> topCountries;

        @JsonProperty("geographicDistribution")
        private GeographicDistribution geographicDistribution;

        @JsonProperty("verificationRates")
        private VerificationRates verificationRates;
    }

    // ===============================
    // USER JOURNEY ANALYTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserJourneyAnalytics {

        @JsonProperty("conversionFunnel")
        private ConversionFunnel conversionFunnel;

        @JsonProperty("averageTimeToFirstApplication")
        private String averageTimeToFirstApplication; // in days

        @JsonProperty("averageTimeToCompletion")
        private String averageTimeToCompletion; // in days

        @JsonProperty("dropoffPoints")
        private List<DropoffPoint> dropoffPoints;

        @JsonProperty("userPathAnalysis")
        private UserPathAnalysis userPathAnalysis;

        @JsonProperty("featureUsage")
        private Map<String, FeatureUsageStats> featureUsage;

        @JsonProperty("completionRates")
        private CompletionRates completionRates;

        @JsonProperty("journeyOptimization")
        private List<OptimizationInsight> journeyOptimization;
    }

    // ===============================
    // RISK ANALYTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RiskAnalytics {

        @JsonProperty("highRiskUsers")
        private Long highRiskUsers;

        @JsonProperty("mediumRiskUsers")
        private Long mediumRiskUsers;

        @JsonProperty("lowRiskUsers")
        private Long lowRiskUsers;

        @JsonProperty("riskFactors")
        private Map<String, RiskFactor> riskFactors;

        @JsonProperty("suspiciousActivities")
        private List<SuspiciousActivity> suspiciousActivities;

        @JsonProperty("securityMetrics")
        private SecurityMetrics securityMetrics;

        @JsonProperty("fraudPrevention")
        private FraudPreventionStats fraudPrevention;

        @JsonProperty("riskTrends")
        private List<TrendDataPoint> riskTrends;
    }

    // ===============================
    // GROWTH ANALYTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GrowthAnalytics {

        @JsonProperty("growthRate")
        private BigDecimal growthRate;

        @JsonProperty("compoundAnnualGrowthRate")
        private BigDecimal compoundAnnualGrowthRate;

        @JsonProperty("userAcquisitionRate")
        private BigDecimal userAcquisitionRate;

        @JsonProperty("organicGrowthRate")
        private BigDecimal organicGrowthRate;

        @JsonProperty("referralGrowthRate")
        private BigDecimal referralGrowthRate;

        @JsonProperty("growthChannels")
        private Map<String, GrowthChannelStats> growthChannels;

        @JsonProperty("seasonalTrends")
        private List<SeasonalTrend> seasonalTrends;

        @JsonProperty("growthForecast")
        private GrowthForecast growthForecast;

        @JsonProperty("marketPenetration")
        private MarketPenetration marketPenetration;
    }

    // ===============================
    // PERFORMANCE METRICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerformanceMetrics {

        @JsonProperty("averageResponseTime")
        private String averageResponseTime; // in milliseconds

        @JsonProperty("systemLoad")
        private BigDecimal systemLoad;

        @JsonProperty("errorRates")
        private Map<String, BigDecimal> errorRates;

        @JsonProperty("uptime")
        private BigDecimal uptime;

        @JsonProperty("throughput")
        private BigDecimal throughput; // requests per second

        @JsonProperty("capacityUtilization")
        private BigDecimal capacityUtilization;

        @JsonProperty("performanceTrends")
        private List<TrendDataPoint> performanceTrends;

        @JsonProperty("benchmarks")
        private Map<String, Benchmark> benchmarks;
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserCountryStats {

        @JsonProperty("totalUsers")
        private Long totalUsers;

        @JsonProperty("activeUsers")
        private Long activeUsers;

        @JsonProperty("growthRate")
        private BigDecimal growthRate;

        @JsonProperty("averageEngagement")
        private BigDecimal averageEngagement;

        @JsonProperty("conversionRate")
        private BigDecimal conversionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CountryRanking {

        @JsonProperty("countryCode")
        private String countryCode;

        @JsonProperty("countryName")
        private String countryName;

        @JsonProperty("userCount")
        private Long userCount;

        @JsonProperty("percentage")
        private BigDecimal percentage;

        @JsonProperty("rank")
        private Integer rank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConversionFunnel {

        @JsonProperty("registrations")
        private Long registrations;

        @JsonProperty("emailVerifications")
        private Long emailVerifications;

        @JsonProperty("profileCompletions")
        private Long profileCompletions;

        @JsonProperty("firstLogins")
        private Long firstLogins;

        @JsonProperty("firstApplications")
        private Long firstApplications;

        @JsonProperty("completedApplications")
        private Long completedApplications;

        @JsonProperty("conversionRates")
        private Map<String, BigDecimal> conversionRates;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DropoffPoint {

        @JsonProperty("stage")
        private String stage;

        @JsonProperty("description")
        private String description;

        @JsonProperty("dropoffRate")
        private BigDecimal dropoffRate;

        @JsonProperty("affectedUsers")
        private Long affectedUsers;

        @JsonProperty("priority")
        private String priority; // HIGH, MEDIUM, LOW
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RiskFactor {

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("severity")
        private String severity; // HIGH, MEDIUM, LOW

        @JsonProperty("affectedUsers")
        private Long affectedUsers;

        @JsonProperty("riskScore")
        private BigDecimal riskScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SuspiciousActivity {

        @JsonProperty("type")
        private String type;

        @JsonProperty("description")
        private String description;

        @JsonProperty("userId")
        private Long userId;

        @JsonProperty("detectedAt")
        private LocalDateTime detectedAt;

        @JsonProperty("riskLevel")
        private String riskLevel;

        @JsonProperty("status")
        private String status; // OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SecurityMetrics {

        @JsonProperty("loginAttempts")
        private Long loginAttempts;

        @JsonProperty("failedLogins")
        private Long failedLogins;

        @JsonProperty("passwordResets")
        private Long passwordResets;

        @JsonProperty("accountLockouts")
        private Long accountLockouts;

        @JsonProperty("securityIncidents")
        private Long securityIncidents;

        @JsonProperty("twoFactorAdoption")
        private BigDecimal twoFactorAdoption;
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
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CohortData {

        @JsonProperty("cohortMonth")
        private String cohortMonth;

        @JsonProperty("initialSize")
        private Long initialSize;

        @JsonProperty("retentionRates")
        private Map<String, BigDecimal> retentionRates; // month1, month2, etc.
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GeographicDistribution {

        @JsonProperty("continents")
        private Map<String, Long> continents;

        @JsonProperty("regions")
        private Map<String, Long> regions;

        @JsonProperty("topCities")
        private Map<String, Long> topCities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VerificationRates {

        @JsonProperty("emailVerificationRate")
        private BigDecimal emailVerificationRate;

        @JsonProperty("phoneVerificationRate")
        private BigDecimal phoneVerificationRate;

        @JsonProperty("documentVerificationRate")
        private BigDecimal documentVerificationRate;

        @JsonProperty("overallVerificationRate")
        private BigDecimal overallVerificationRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserPathAnalysis {

        @JsonProperty("commonPaths")
        private List<UserPath> commonPaths;

        @JsonProperty("efficientPaths")
        private List<UserPath> efficientPaths;

        @JsonProperty("problematicPaths")
        private List<UserPath> problematicPaths;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserPath {

        @JsonProperty("pathId")
        private String pathId;

        @JsonProperty("description")
        private String description;

        @JsonProperty("steps")
        private List<String> steps;

        @JsonProperty("userCount")
        private Long userCount;

        @JsonProperty("averageTime")
        private String averageTime;

        @JsonProperty("completionRate")
        private BigDecimal completionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FeatureUsageStats {

        @JsonProperty("totalUsage")
        private Long totalUsage;

        @JsonProperty("uniqueUsers")
        private Long uniqueUsers;

        @JsonProperty("averageUsagePerUser")
        private BigDecimal averageUsagePerUser;

        @JsonProperty("adoptionRate")
        private BigDecimal adoptionRate;

        @JsonProperty("usageTrend")
        private List<TrendDataPoint> usageTrend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CompletionRates {

        @JsonProperty("profileCompletion")
        private BigDecimal profileCompletion;

        @JsonProperty("documentUpload")
        private BigDecimal documentUpload;

        @JsonProperty("applicationSubmission")
        private BigDecimal applicationSubmission;

        @JsonProperty("paymentCompletion")
        private BigDecimal paymentCompletion;

        @JsonProperty("overallCompletion")
        private BigDecimal overallCompletion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OptimizationInsight {

        @JsonProperty("area")
        private String area;

        @JsonProperty("description")
        private String description;

        @JsonProperty("impact")
        private String impact; // HIGH, MEDIUM, LOW

        @JsonProperty("effort")
        private String effort; // HIGH, MEDIUM, LOW

        @JsonProperty("priority")
        private Integer priority;

        @JsonProperty("recommendation")
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FraudPreventionStats {

        @JsonProperty("suspiciousRegistrations")
        private Long suspiciousRegistrations;

        @JsonProperty("blockedUsers")
        private Long blockedUsers;

        @JsonProperty("falsitiveRate")
        private BigDecimal falsitiveRate;

        @JsonProperty("falseNegativeRate")
        private BigDecimal falseNegativeRate;

        @JsonProperty("fraudDetectionAccuracy")
        private BigDecimal fraudDetectionAccuracy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GrowthChannelStats {

        @JsonProperty("acquisitions")
        private Long acquisitions;

        @JsonProperty("conversionRate")
        private BigDecimal conversionRate;

        @JsonProperty("cost")
        private BigDecimal cost;

        @JsonProperty("roi")
        private BigDecimal roi;

        @JsonProperty("qualityScore")
        private BigDecimal qualityScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SeasonalTrend {

        @JsonProperty("period")
        private String period;

        @JsonProperty("averageGrowth")
        private BigDecimal averageGrowth;

        @JsonProperty("peak")
        private String peak;

        @JsonProperty("trough")
        private String trough;

        @JsonProperty("volatility")
        private BigDecimal volatility;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GrowthForecast {

        @JsonProperty("nextMonth")
        private BigDecimal nextMonth;

        @JsonProperty("nextQuarter")
        private BigDecimal nextQuarter;

        @JsonProperty("nextYear")
        private BigDecimal nextYear;

        @JsonProperty("confidence")
        private BigDecimal confidence;

        @JsonProperty("methodology")
        private String methodology;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MarketPenetration {

        @JsonProperty("totalAddressableMarket")
        private Long totalAddressableMarket;

        @JsonProperty("servicableAddressableMarket")
        private Long servicableAddressableMarket;

        @JsonProperty("servicableObtainableMarket")
        private Long servicableObtainableMarket;

        @JsonProperty("currentPenetration")
        private BigDecimal currentPenetration;

        @JsonProperty("growthPotential")
        private BigDecimal growthPotential;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Benchmark {

        @JsonProperty("metric")
        private String metric;

        @JsonProperty("currentValue")
        private BigDecimal currentValue;

        @JsonProperty("industryAverage")
        private BigDecimal industryAverage;

        @JsonProperty("bestInClass")
        private BigDecimal bestInClass;

        @JsonProperty("performance")
        private String performance; // EXCELLENT, GOOD, AVERAGE, POOR
    }
}

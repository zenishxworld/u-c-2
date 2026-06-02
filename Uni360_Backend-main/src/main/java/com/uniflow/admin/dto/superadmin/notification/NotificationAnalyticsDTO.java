package com.uniflow.admin.dto.superadmin.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * NotificationAnalyticsDTO - Detailed notification analytics for Super Admin
 *
 * Provides comprehensive analytics including performance trends,
 * user behavior analysis, delivery optimization insights, and ROI metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Detailed notification analytics and performance metrics")
public class NotificationAnalyticsDTO {

    @Schema(description = "Analytics period information")
    @JsonProperty("period_info")
    private AnalyticsPeriodDTO periodInfo;

    @Schema(description = "Performance trends over time")
    @JsonProperty("performance_trends")
    private PerformanceTrendsDTO performanceTrends;

    @Schema(description = "User behavior analytics")
    @JsonProperty("user_behavior")
    private UserBehaviorAnalyticsDTO userBehavior;

    @Schema(description = "Content performance analysis")
    @JsonProperty("content_performance")
    private ContentPerformanceDTO contentPerformance;

    @Schema(description = "Delivery optimization insights")
    @JsonProperty("delivery_insights")
    private DeliveryInsightsDTO deliveryInsights;

    @Schema(description = "ROI and business impact metrics")
    @JsonProperty("business_impact")
    private BusinessImpactDTO businessImpact;

    @Schema(description = "System performance metrics")
    @JsonProperty("system_performance")
    private SystemPerformanceDTO systemPerformance;

    /**
     * Analytics period configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsPeriodDTO {

        @Schema(description = "Period start date")
        @JsonProperty("start_date")
        private LocalDateTime startDate;

        @Schema(description = "Period end date")
        @JsonProperty("end_date")
        private LocalDateTime endDate;

        @Schema(description = "Period type", example = "LAST_30_DAYS")
        @JsonProperty("period_type")
        private String periodType;

        @Schema(description = "Total days in period", example = "30")
        @JsonProperty("total_days")
        private Integer totalDays;

        @Schema(description = "Generated timestamp")
        @JsonProperty("generated_at")
        private LocalDateTime generatedAt;
    }

    /**
     * Performance trends analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceTrendsDTO {

        @Schema(description = "Daily performance data points")
        @JsonProperty("daily_metrics")
        private List<DailyMetricDTO> dailyMetrics;

        @Schema(description = "Weekly performance summaries")
        @JsonProperty("weekly_summaries")
        private List<WeeklyMetricDTO> weeklySummaries;

        @Schema(description = "Overall trend direction", example = "IMPROVING")
        @JsonProperty("trend_direction")
        private String trendDirection;

        @Schema(description = "Performance growth rate", example = "12.5")
        @JsonProperty("growth_rate_percent")
        private BigDecimal growthRatePercent;

        @Schema(description = "Seasonal patterns identified")
        @JsonProperty("seasonal_patterns")
        private List<SeasonalPatternDTO> seasonalPatterns;
    }

    /**
     * Daily performance metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyMetricDTO {

        @Schema(description = "Date of metrics")
        @JsonProperty("date")
        private LocalDateTime date;

        @Schema(description = "Notifications sent", example = "450")
        @JsonProperty("sent_count")
        private Long sentCount;

        @Schema(description = "Delivery rate", example = "96.2")
        @JsonProperty("delivery_rate")
        private BigDecimal deliveryRate;

        @Schema(description = "Read rate", example = "82.1")
        @JsonProperty("read_rate")
        private BigDecimal readRate;

        @Schema(description = "Click-through rate", example = "15.3")
        @JsonProperty("click_rate")
        private BigDecimal clickRate;

        @Schema(description = "Average response time minutes", example = "45.2")
        @JsonProperty("avg_response_time_minutes")
        private BigDecimal avgResponseTimeMinutes;
    }

    /**
     * Weekly performance summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyMetricDTO {

        @Schema(description = "Week start date")
        @JsonProperty("week_start")
        private LocalDateTime weekStart;

        @Schema(description = "Week end date")
        @JsonProperty("week_end")
        private LocalDateTime weekEnd;

        @Schema(description = "Total notifications sent", example = "3150")
        @JsonProperty("total_sent")
        private Long totalSent;

        @Schema(description = "Average daily delivery rate", example = "95.8")
        @JsonProperty("avg_delivery_rate")
        private BigDecimal avgDeliveryRate;

        @Schema(description = "Average daily engagement rate", example = "78.4")
        @JsonProperty("avg_engagement_rate")
        private BigDecimal avgEngagementRate;

        @Schema(description = "Peak activity day", example = "TUESDAY")
        @JsonProperty("peak_day")
        private String peakDay;
    }

    /**
     * Seasonal patterns analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeasonalPatternDTO {

        @Schema(description = "Pattern type", example = "DAILY_PEAK_HOURS")
        @JsonProperty("pattern_type")
        private String patternType;

        @Schema(description = "Pattern description", example = "Peak activity between 2-4 PM")
        @JsonProperty("description")
        private String description;

        @Schema(description = "Pattern strength", example = "HIGH")
        @JsonProperty("strength")
        private String strength;

        @Schema(description = "Confidence level", example = "89.5")
        @JsonProperty("confidence_percent")
        private BigDecimal confidencePercent;
    }

    /**
     * User behavior analytics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserBehaviorAnalyticsDTO {

        @Schema(description = "User segmentation analysis")
        @JsonProperty("user_segments")
        private List<UserSegmentDTO> userSegments;

        @Schema(description = "Engagement patterns by user type")
        @JsonProperty("engagement_by_type")
        private List<UserTypeEngagementDTO> engagementByType;

        @Schema(description = "Optimal send times analysis")
        @JsonProperty("optimal_send_times")
        private OptimalTimingDTO optimalSendTimes;

        @Schema(description = "User preference insights")
        @JsonProperty("preference_insights")
        private UserPreferenceInsightsDTO preferenceInsights;
    }

    /**
     * User segment analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSegmentDTO {

        @Schema(description = "Segment name", example = "Highly Engaged Students")
        @JsonProperty("segment_name")
        private String segmentName;

        @Schema(description = "User count in segment", example = "1250")
        @JsonProperty("user_count")
        private Long userCount;

        @Schema(description = "Average engagement rate", example = "94.2")
        @JsonProperty("avg_engagement_rate")
        private BigDecimal avgEngagementRate;

        @Schema(description = "Preferred notification types")
        @JsonProperty("preferred_types")
        private List<String> preferredTypes;

        @Schema(description = "Optimal send frequency per week", example = "3")
        @JsonProperty("optimal_frequency")
        private Integer optimalFrequency;
    }

    /**
     * User type engagement metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserTypeEngagementDTO {

        @Schema(description = "User type", example = "STUDENT")
        @JsonProperty("user_type")
        private String userType;

        @Schema(description = "Total users of this type", example = "5420")
        @JsonProperty("total_users")
        private Long totalUsers;

        @Schema(description = "Average read rate", example = "87.3")
        @JsonProperty("avg_read_rate")
        private BigDecimal avgReadRate;

        @Schema(description = "Average response time minutes", example = "32.5")
        @JsonProperty("avg_response_time_minutes")
        private BigDecimal avgResponseTimeMinutes;

        @Schema(description = "Most engaging notification types")
        @JsonProperty("top_engaging_types")
        private List<String> topEngagingTypes;
    }

    /**
     * Optimal timing analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptimalTimingDTO {

        @Schema(description = "Best days of week for sending")
        @JsonProperty("optimal_days")
        private List<String> optimalDays;

        @Schema(description = "Best hours of day for sending")
        @JsonProperty("optimal_hours")
        private List<Integer> optimalHours;

        @Schema(description = "Time zone considerations")
        @JsonProperty("timezone_insights")
        private List<TimezoneInsightDTO> timezoneInsights;

        @Schema(description = "Frequency recommendations")
        @JsonProperty("frequency_recommendations")
        private FrequencyRecommendationDTO frequencyRecommendations;
    }

    /**
     * Timezone-specific insights
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimezoneInsightDTO {

        @Schema(description = "Timezone", example = "America/New_York")
        @JsonProperty("timezone")
        private String timezone;

        @Schema(description = "User count in timezone", example = "890")
        @JsonProperty("user_count")
        private Long userCount;

        @Schema(description = "Optimal send hour", example = "14")
        @JsonProperty("optimal_hour")
        private Integer optimalHour;

        @Schema(description = "Engagement rate at optimal time", example = "92.1")
        @JsonProperty("optimal_engagement_rate")
        private BigDecimal optimalEngagementRate;
    }

    /**
     * Frequency recommendations
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FrequencyRecommendationDTO {

        @Schema(description = "Recommended notifications per week", example = "3")
        @JsonProperty("recommended_weekly_frequency")
        private Integer recommendedWeeklyFrequency;

        @Schema(description = "Maximum frequency before fatigue", example = "7")
        @JsonProperty("fatigue_threshold")
        private Integer fatigueThreshold;

        @Schema(description = "Current average frequency", example = "4.2")
        @JsonProperty("current_avg_frequency")
        private BigDecimal currentAvgFrequency;
    }

    /**
     * User preference insights
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPreferenceInsightsDTO {

        @Schema(description = "Most preferred notification types")
        @JsonProperty("preferred_types")
        private List<NotificationTypePreferenceDTO> preferredTypes;

        @Schema(description = "Channel preferences")
        @JsonProperty("channel_preferences")
        private List<ChannelPreferenceDTO> channelPreferences;

        @Schema(description = "Content format preferences")
        @JsonProperty("content_preferences")
        private List<ContentPreferenceDTO> contentPreferences;
    }

    /**
     * Notification type preference
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationTypePreferenceDTO {

        @Schema(description = "Notification type", example = "TASK_COMPLETION")
        @JsonProperty("type")
        private String type;

        @Schema(description = "User preference score", example = "8.7")
        @JsonProperty("preference_score")
        private BigDecimal preferenceScore;

        @Schema(description = "Engagement rate", example = "91.2")
        @JsonProperty("engagement_rate")
        private BigDecimal engagementRate;
    }

    /**
     * Channel preference data
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChannelPreferenceDTO {

        @Schema(description = "Channel name", example = "SYSTEM")
        @JsonProperty("channel")
        private String channel;

        @Schema(description = "User preference percentage", example = "78.5")
        @JsonProperty("preference_percentage")
        private BigDecimal preferencePercentage;

        @Schema(description = "Effectiveness score", example = "85.2")
        @JsonProperty("effectiveness_score")
        private BigDecimal effectivenessScore;
    }

    /**
     * Content format preference
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentPreferenceDTO {

        @Schema(description = "Content format", example = "PLAIN")
        @JsonProperty("format")
        private String format;

        @Schema(description = "Usage percentage", example = "65.8")
        @JsonProperty("usage_percentage")
        private BigDecimal usagePercentage;

        @Schema(description = "User satisfaction score", example = "7.9")
        @JsonProperty("satisfaction_score")
        private BigDecimal satisfactionScore;
    }

    /**
     * Content performance analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentPerformanceDTO {

        @Schema(description = "Top performing notification titles")
        @JsonProperty("top_titles")
        private List<ContentMetricDTO> topTitles;

        @Schema(description = "Message length analysis")
        @JsonProperty("message_length_analysis")
        private MessageLengthAnalysisDTO messageLengthAnalysis;

        @Schema(description = "Call-to-action effectiveness")
        @JsonProperty("cta_effectiveness")
        private List<CTAEffectivenessDTO> ctaEffectiveness;

        @Schema(description = "Content sentiment impact")
        @JsonProperty("sentiment_impact")
        private SentimentImpactDTO sentimentImpact;
    }

    /**
     * Content metric details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentMetricDTO {

        @Schema(description = "Content text", example = "Your application has been approved!")
        @JsonProperty("content")
        private String content;

        @Schema(description = "Engagement rate", example = "95.2")
        @JsonProperty("engagement_rate")
        private BigDecimal engagementRate;

        @Schema(description = "Usage count", example = "234")
        @JsonProperty("usage_count")
        private Long usageCount;

        @Schema(description = "Performance score", example = "9.1")
        @JsonProperty("performance_score")
        private BigDecimal performanceScore;
    }

    /**
     * Message length analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageLengthAnalysisDTO {

        @Schema(description = "Optimal message length range", example = "50-150 characters")
        @JsonProperty("optimal_length_range")
        private String optimalLengthRange;

        @Schema(description = "Average engagement by length ranges")
        @JsonProperty("engagement_by_length")
        private List<LengthEngagementDTO> engagementByLength;

        @Schema(description = "Current average message length", example = "127")
        @JsonProperty("current_avg_length")
        private Integer currentAvgLength;
    }

    /**
     * Length vs engagement correlation
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LengthEngagementDTO {

        @Schema(description = "Character length range", example = "100-150")
        @JsonProperty("length_range")
        private String lengthRange;

        @Schema(description = "Average engagement rate", example = "87.3")
        @JsonProperty("avg_engagement_rate")
        private BigDecimal avgEngagementRate;

        @Schema(description = "Sample size", example = "423")
        @JsonProperty("sample_size")
        private Long sampleSize;
    }

    /**
     * Call-to-action effectiveness
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CTAEffectivenessDTO {

        @Schema(description = "CTA text", example = "View Details")
        @JsonProperty("cta_text")
        private String ctaText;

        @Schema(description = "Click-through rate", example = "23.5")
        @JsonProperty("click_rate")
        private BigDecimal clickRate;

        @Schema(description = "Usage frequency", example = "156")
        @JsonProperty("usage_count")
        private Long usageCount;

        @Schema(description = "Effectiveness ranking", example = "1")
        @JsonProperty("ranking")
        private Integer ranking;
    }

    /**
     * Sentiment impact analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentImpactDTO {

        @Schema(description = "Positive sentiment engagement", example = "91.2")
        @JsonProperty("positive_engagement")
        private BigDecimal positiveEngagement;

        @Schema(description = "Neutral sentiment engagement", example = "78.5")
        @JsonProperty("neutral_engagement")
        private BigDecimal neutralEngagement;

        @Schema(description = "Negative sentiment engagement", example = "65.3")
        @JsonProperty("negative_engagement")
        private BigDecimal negativeEngagement;

        @Schema(description = "Optimal sentiment score", example = "0.7")
        @JsonProperty("optimal_sentiment_score")
        private BigDecimal optimalSentimentScore;
    }

    /**
     * Delivery optimization insights
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryInsightsDTO {

        @Schema(description = "Performance by delivery channel")
        @JsonProperty("channel_performance")
        private List<ChannelPerformanceInsightDTO> channelPerformance;

        @Schema(description = "Delivery timing recommendations")
        @JsonProperty("timing_recommendations")
        private List<TimingRecommendationDTO> timingRecommendations;

        @Schema(description = "Failure pattern analysis")
        @JsonProperty("failure_patterns")
        private FailurePatternAnalysisDTO failurePatterns;

        @Schema(description = "Infrastructure utilization")
        @JsonProperty("infrastructure_utilization")
        private InfrastructureUtilizationDTO infrastructureUtilization;
    }

    /**
     * Channel performance insights
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChannelPerformanceInsightDTO {

        @Schema(description = "Channel name", example = "SYSTEM")
        @JsonProperty("channel")
        private String channel;

        @Schema(description = "Reliability score", example = "98.5")
        @JsonProperty("reliability_score")
        private BigDecimal reliabilityScore;

        @Schema(description = "Average delivery time seconds", example = "1.2")
        @JsonProperty("avg_delivery_time_seconds")
        private BigDecimal avgDeliveryTimeSeconds;

        @Schema(description = "Cost per notification", example = "0.001")
        @JsonProperty("cost_per_notification")
        private BigDecimal costPerNotification;

        @Schema(description = "Recommended usage percentage", example = "75")
        @JsonProperty("recommended_usage_percent")
        private BigDecimal recommendedUsagePercent;
    }

    /**
     * Timing recommendation
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimingRecommendationDTO {

        @Schema(description = "Target audience", example = "STUDENTS")
        @JsonProperty("target_audience")
        private String targetAudience;

        @Schema(description = "Recommended send time", example = "14:00")
        @JsonProperty("recommended_time")
        private String recommendedTime;

        @Schema(description = "Expected improvement", example = "15.3")
        @JsonProperty("expected_improvement_percent")
        private BigDecimal expectedImprovementPercent;

        @Schema(description = "Confidence level", example = "HIGH")
        @JsonProperty("confidence_level")
        private String confidenceLevel;
    }

    /**
     * Failure pattern analysis
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailurePatternAnalysisDTO {

        @Schema(description = "Common failure times")
        @JsonProperty("failure_times")
        private List<String> failureTimes;

        @Schema(description = "Failure correlation factors")
        @JsonProperty("correlation_factors")
        private List<String> correlationFactors;

        @Schema(description = "Prevention recommendations")
        @JsonProperty("prevention_recommendations")
        private List<String> preventionRecommendations;

        @Schema(description = "System resilience score", example = "94.8")
        @JsonProperty("resilience_score")
        private BigDecimal resilienceScore;
    }

    /**
     * Infrastructure utilization metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InfrastructureUtilizationDTO {

        @Schema(description = "Peak usage hours")
        @JsonProperty("peak_hours")
        private List<Integer> peakHours;

        @Schema(description = "Average system load", example = "68.5")
        @JsonProperty("avg_system_load_percent")
        private BigDecimal avgSystemLoadPercent;

        @Schema(description = "Capacity recommendations")
        @JsonProperty("capacity_recommendations")
        private List<String> capacityRecommendations;

        @Schema(description = "Scaling suggestions")
        @JsonProperty("scaling_suggestions")
        private List<String> scalingSuggestions;
    }

    /**
     * Business impact and ROI metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BusinessImpactDTO {

        @Schema(description = "User engagement improvements")
        @JsonProperty("engagement_improvements")
        private EngagementImprovementDTO engagementImprovements;

        @Schema(description = "Operational efficiency gains")
        @JsonProperty("efficiency_gains")
        private EfficiencyGainsDTO efficiencyGains;

        @Schema(description = "Cost analysis")
        @JsonProperty("cost_analysis")
        private CostAnalysisDTO costAnalysis;

        @Schema(description = "Revenue impact estimation")
        @JsonProperty("revenue_impact")
        private RevenueImpactDTO revenueImpact;
    }

    /**
     * Engagement improvement metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EngagementImprovementDTO {

        @Schema(description = "Baseline engagement rate", example = "72.3")
        @JsonProperty("baseline_engagement_rate")
        private BigDecimal baselineEngagementRate;

        @Schema(description = "Current engagement rate", example = "83.7")
        @JsonProperty("current_engagement_rate")
        private BigDecimal currentEngagementRate;

        @Schema(description = "Improvement percentage", example = "15.8")
        @JsonProperty("improvement_percent")
        private BigDecimal improvementPercent;

        @Schema(description = "Target engagement rate", example = "90.0")
        @JsonProperty("target_engagement_rate")
        private BigDecimal targetEngagementRate;
    }

    /**
     * Operational efficiency gains
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EfficiencyGainsDTO {

        @Schema(description = "Time saved in hours per week", example = "24.5")
        @JsonProperty("time_saved_hours_weekly")
        private BigDecimal timeSavedHoursWeekly;

        @Schema(description = "Process automation percentage", example = "78.2")
        @JsonProperty("automation_percent")
        private BigDecimal automationPercent;

        @Schema(description = "Error reduction percentage", example = "45.3")
        @JsonProperty("error_reduction_percent")
        private BigDecimal errorReductionPercent;

        @Schema(description = "Staff productivity improvement", example = "12.8")
        @JsonProperty("productivity_improvement_percent")
        private BigDecimal productivityImprovementPercent;
    }

    /**
     * Cost analysis metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostAnalysisDTO {

        @Schema(description = "Total notification costs per month", example = "1250.00")
        @JsonProperty("total_monthly_cost")
        private BigDecimal totalMonthlyCost;

        @Schema(description = "Cost per delivered notification", example = "0.003")
        @JsonProperty("cost_per_notification")
        private BigDecimal costPerNotification;

        @Schema(description = "Cost savings from optimization", example = "315.50")
        @JsonProperty("optimization_savings")
        private BigDecimal optimizationSavings;

        @Schema(description = "ROI percentage", example = "240.5")
        @JsonProperty("roi_percent")
        private BigDecimal roiPercent;
    }

    /**
     * Revenue impact estimation
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueImpactDTO {

        @Schema(description = "Estimated revenue increase", example = "15420.00")
        @JsonProperty("estimated_revenue_increase")
        private BigDecimal estimatedRevenueIncrease;

        @Schema(description = "Customer retention improvement", example = "8.5")
        @JsonProperty("retention_improvement_percent")
        private BigDecimal retentionImprovementPercent;

        @Schema(description = "Conversion rate improvement", example = "12.3")
        @JsonProperty("conversion_improvement_percent")
        private BigDecimal conversionImprovementPercent;

        @Schema(description = "Customer lifetime value impact", example = "5.7")
        @JsonProperty("clv_impact_percent")
        private BigDecimal clvImpactPercent;
    }

    /**
     * System performance metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemPerformanceDTO {

        @Schema(description = "System uptime percentage", example = "99.85")
        @JsonProperty("uptime_percent")
        private BigDecimal uptimePercent;

        @Schema(description = "Average response time milliseconds", example = "120")
        @JsonProperty("avg_response_time_ms")
        private Long avgResponseTimeMs;

        @Schema(description = "Throughput notifications per minute", example = "850")
        @JsonProperty("throughput_per_minute")
        private Long throughputPerMinute;

        @Schema(description = "Error rate percentage", example = "0.15")
        @JsonProperty("error_rate_percent")
        private BigDecimal errorRatePercent;

        @Schema(description = "Resource utilization metrics")
        @JsonProperty("resource_utilization")
        private ResourceUtilizationDTO resourceUtilization;
    }

    /**
     * Resource utilization details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceUtilizationDTO {

        @Schema(description = "CPU utilization percentage", example = "45.2")
        @JsonProperty("cpu_utilization_percent")
        private BigDecimal cpuUtilizationPercent;

        @Schema(description = "Memory utilization percentage", example = "67.8")
        @JsonProperty("memory_utilization_percent")
        private BigDecimal memoryUtilizationPercent;

        @Schema(description = "Database connection usage", example = "23.5")
        @JsonProperty("db_connection_usage_percent")
        private BigDecimal dbConnectionUsagePercent;

        @Schema(description = "Network bandwidth utilization", example = "12.8")
        @JsonProperty("network_utilization_percent")
        private BigDecimal networkUtilizationPercent;
    }
}

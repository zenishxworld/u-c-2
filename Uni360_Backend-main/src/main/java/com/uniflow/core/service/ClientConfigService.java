package com.uniflow.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Client Configuration Service for UniFLow Platform
 *
 * <p>Provides dynamic client configurations with inheritance, validation, and caching. Supports
 * white-label deployments like UNI360.
 *
 * <p>Configuration Structure: - Base configuration (uniflow.yml) - Client-specific overrides (e.g.,
 * uni360.yml) - Environment-specific settings
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClientConfigService {

  private final ResourceLoader resourceLoader;
  private final ObjectMapper objectMapper = new ObjectMapper();
  private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

  @Value("${uniflow.client.default-id:uniflow}")
  private String defaultClientId;

  @Value("${uniflow.client.config-path:classpath:config/clients}")
  private String configPath;

  @Value("${uniflow.client.cache-timeout:3600}")
  private long cacheTimeout;

  private Map<String, Object> baseConfig;

  @PostConstruct
  public void initialize() {
    loadBaseConfiguration();
  }

  /** Get complete configuration for a client with inheritance */
  @Cacheable(value = "clientConfig", key = "#clientId", unless = "#result == null")
  public Mono<Map<String, Object>> getClientConfig(String clientId) {
    final String finalClientId =
        (clientId == null || clientId.trim().isEmpty()) ? defaultClientId : clientId;

    return Mono.fromCallable(() -> loadAndMergeConfig(finalClientId))
        .doOnSuccess(config -> log.debug("Loaded configuration for client: {}", finalClientId))
        .doOnError(
            error -> log.error("Failed to load configuration for client: {}", finalClientId, error))
        .onErrorReturn(getDefaultConfig());
  }

  /** Get public configuration safe for frontend use */
  public Mono<Map<String, Object>> getFrontendConfig(String clientId) {
    return getClientConfig(clientId).map(this::extractFrontendSafeConfig);
  }

  /** Get feature flags for a specific client */
  public Mono<Map<String, Object>> getFeatures(String clientId) {
    return getClientConfig(clientId)
        .map(config -> (Map<String, Object>) config.getOrDefault("features", new HashMap<>()));
  }

  /** Get branding configuration for a specific client */
  public Mono<Map<String, Object>> getBranding(String clientId) {
    return getClientConfig(clientId)
        .map(config -> (Map<String, Object>) config.getOrDefault("branding", new HashMap<>()));
  }

  /** Get workflow configuration for a specific client */
  public Mono<Map<String, Object>> getWorkflowConfig(String clientId) {
    return getClientConfig(clientId)
        .map(config -> (Map<String, Object>) config.getOrDefault("workflow", new HashMap<>()));
  }

  /** Get validation rule sets configuration for a specific client */
  public Mono<Map<String, Object>> getValidationRuleSets(String clientId) {
    return getClientConfig(clientId)
        .map(
            config ->
                (Map<String, Object>) config.getOrDefault("validation_rule_sets", new HashMap<>()));
  }

  /** Get rule configurations for a specific client */
  public Mono<Map<String, Object>> getRuleConfigurations(String clientId) {
    return getClientConfig(clientId)
        .map(
            config ->
                (Map<String, Object>) config.getOrDefault("rule_configurations", new HashMap<>()));
  }

  /** Get specific rule set configuration */
  public Mono<Map<String, Object>> getRuleSet(String clientId, String ruleSetName) {
    return getValidationRuleSets(clientId)
        .map(
            ruleSets -> {
              Map<String, Object> ruleSet = (Map<String, Object>) ruleSets.get(ruleSetName);
              return ruleSet != null ? ruleSet : new HashMap<>();
            });
  }

  /** Get specific rule configuration from a rule set */
  public Mono<Map<String, Object>> getRule(String clientId, String ruleSetName, String ruleName) {
    return getRuleSet(clientId, ruleSetName)
        .map(
            ruleSet -> {
              Map<String, Object> rules = (Map<String, Object>) ruleSet.get("rules");
              if (rules != null) {
                Map<String, Object> rule = (Map<String, Object>) rules.get(ruleName);
                return rule != null ? rule : new HashMap<>();
              }
              return new HashMap<>();
            });
  }

  /** Check if a specific rule is enabled for a client */
  public Mono<Boolean> isRuleEnabled(String clientId, String ruleSetName, String ruleName) {
    return getRule(clientId, ruleSetName, ruleName)
        .map(rule -> Boolean.TRUE.equals(rule.get("enabled")));
  }

  /** Get rule execution settings for a client */
  public Mono<Map<String, Object>> getRuleExecutionSettings(String clientId) {
    return getRuleConfigurations(clientId)
        .map(
            ruleConfig ->
                (Map<String, Object>)
                    ruleConfig.getOrDefault(
                        "execution_settings", getDefaultRuleExecutionSettings()));
  }

  /** Check if a feature is enabled for a client */
  public Mono<Boolean> isFeatureEnabled(String clientId, String featureName) {
    return getFeatures(clientId)
        .map(
            features -> {
              Object feature = features.get(featureName);
              if (feature instanceof Boolean) {
                return (Boolean) feature;
              }
              if (feature instanceof Map) {
                Map<String, Object> featureConfig = (Map<String, Object>) feature;
                return Boolean.TRUE.equals(featureConfig.get("enabled"));
              }
              return false;
            });
  }

  /** Get database configuration for a client */
  public Mono<Map<String, Object>> getDatabaseConfig(String clientId) {
    return getClientConfig(clientId)
        .map(config -> (Map<String, Object>) config.getOrDefault("database", new HashMap<>()));
  }

  /** Get rules engine configuration for a client */
  public Mono<Map<String, Object>> getRulesEngineConfig(String clientId) {
    return getClientConfig(clientId)
        .map(config -> (Map<String, Object>) config.getOrDefault("rules_engine", new HashMap<>()));
  }

  /** Load base configuration from uniflow.yml */
  private void loadBaseConfiguration() {
    try {
      Resource resource = resourceLoader.getResource(configPath + "/uniflow.yml");
      if (resource.exists()) {
        try (InputStream inputStream = resource.getInputStream()) {
          baseConfig = yamlMapper.readValue(inputStream, Map.class);
          log.info("Loaded base configuration from uniflow.yml");
        }
      } else {
        log.warn("Base configuration file not found, using defaults");
        baseConfig = getDefaultConfig();
      }
    } catch (IOException e) {
      log.error("Failed to load base configuration", e);
      baseConfig = getDefaultConfig();
    }
  }

  /** Load and merge configuration for a specific client */
  private Map<String, Object> loadAndMergeConfig(String clientId) {
    Map<String, Object> config = new HashMap<>(baseConfig);

    // If it's not the default client, try to load client-specific config
    if (!defaultClientId.equals(clientId)) {
      try {
        Resource resource = resourceLoader.getResource(configPath + "/" + clientId + ".yml");
        if (resource.exists()) {
          try (InputStream inputStream = resource.getInputStream()) {
            Map<String, Object> clientConfig = yamlMapper.readValue(inputStream, Map.class);
            config = mergeConfigurations(config, clientConfig);
            log.debug("Loaded and merged configuration for client: {}", clientId);
          }
        } else {
          log.warn("Client-specific configuration not found for: {}, using base config", clientId);
        }
      } catch (IOException e) {
        log.error("Failed to load client configuration for: {}", clientId, e);
      }
    }

    // Add runtime metadata
    config.put("client_id", clientId);
    config.put("loaded_at", System.currentTimeMillis());

    return config;
  }

  /** Deep merge two configuration maps */
  @SuppressWarnings("unchecked")
  private Map<String, Object> mergeConfigurations(
      Map<String, Object> base, Map<String, Object> override) {
    Map<String, Object> result = new HashMap<>(base);

    override.forEach(
        (key, value) -> {
          if (value instanceof Map && result.get(key) instanceof Map) {
            // Recursively merge nested maps
            result.put(
                key,
                mergeConfigurations(
                    (Map<String, Object>) result.get(key), (Map<String, Object>) value));
          } else {
            // Override the value
            result.put(key, value);
          }
        });

    return result;
  }

  /** Extract frontend-safe configuration (removes sensitive data) */
  private Map<String, Object> extractFrontendSafeConfig(Map<String, Object> config) {
    Map<String, Object> safeConfig = new HashMap<>();

    // Only include safe fields
    safeConfig.put("client_id", config.get("client_id"));
    safeConfig.put("name", config.get("name"));
    safeConfig.put("features", config.get("features"));
    safeConfig.put("branding", config.get("branding"));
    safeConfig.put("workflow", config.get("workflow"));
    safeConfig.put("ui", config.get("ui"));
    safeConfig.put("api", getSafeApiConfig(config));

    return safeConfig;
  }

  /** Extract safe API configuration for frontend */
  @SuppressWarnings("unchecked")
  private Map<String, Object> getSafeApiConfig(Map<String, Object> config) {
    Map<String, Object> apiConfig = (Map<String, Object>) config.get("api");
    if (apiConfig == null) {
      return new HashMap<>();
    }

    Map<String, Object> safeApiConfig = new HashMap<>();
    safeApiConfig.put("base_url", apiConfig.get("base_url"));
    safeApiConfig.put("timeout", apiConfig.get("timeout"));
    safeApiConfig.put("rate_limits", apiConfig.get("rate_limits"));

    return safeApiConfig;
  }

  /** Get default configuration when no specific config is found */
  private Map<String, Object>   getDefaultConfig() {
    Map<String, Object> config = new HashMap<>();
    config.put("client_id", defaultClientId);
    config.put("name", "UniFLow Platform");
    config.put("version", "1.0.0");

    // Default features
    Map<String, Object> features = new HashMap<>();
    features.put("profile_builder", true);
    features.put("application_tracking", true);
    features.put("document_upload", true);
    features.put("notifications", true);
    config.put("features", features);

    // Default branding
    Map<String, Object> branding = new HashMap<>();
    branding.put("primary_color", "#2563eb");
    branding.put("secondary_color", "#64748b");
    branding.put("logo_url", "/assets/logo.png");
    branding.put("favicon_url", "/assets/favicon.ico");
    config.put("branding", branding);

    // Default workflow
    Map<String, Object> workflow = new HashMap<>();
    workflow.put("auto_assignment", true);
    workflow.put("require_verification", true);
    workflow.put("notification_channels", new String[] {"email", "in_app"});
    config.put("workflow", workflow);

    // Default rule configurations
    config.put("validation_rule_sets", getDefaultValidationRuleSets());
    config.put("rule_configurations", getDefaultRuleConfigurations());

    return config;
  }

  /** Validate configuration structure and required fields */
  private void validateConfig(Map<String, Object> config, String clientId) {
    if (config == null || config.isEmpty()) {
      throw new IllegalArgumentException(
          "Configuration cannot be null or empty for client: " + clientId);
    }

    // Validate required fields
    if (!config.containsKey("client_id")) {
      throw new IllegalArgumentException("Configuration must contain 'client_id' field");
    }

    if (!config.containsKey("name")) {
      throw new IllegalArgumentException("Configuration must contain 'name' field");
    }

    log.debug("Configuration validation passed for client: {}", clientId);
  }

  /** Get default validation rule sets */
  private Map<String, Object> getDefaultValidationRuleSets() {
    Map<String, Object> ruleSets = new HashMap<>();

    // Basic student profile builder rules
    Map<String, Object> profileBuilder = new HashMap<>();
    profileBuilder.put("description", "Basic validation rules for student profile builder");
    profileBuilder.put("enabled", true);
    profileBuilder.put("execution_order", 1);

    Map<String, Object> rules = new HashMap<>();
    Map<String, Object> basicInfoRule = new HashMap<>();
    basicInfoRule.put("class_name", "BasicInfoValidationRule");
    basicInfoRule.put("enabled", true);
    basicInfoRule.put("priority", 1);
    basicInfoRule.put("description", "Validates basic student information");
    rules.put("basic_info_validation", basicInfoRule);

    profileBuilder.put("rules", rules);
    ruleSets.put("student_profile_builder", profileBuilder);

    return ruleSets;
  }

  /** Get default rule configurations */
  private Map<String, Object> getDefaultRuleConfigurations() {
    Map<String, Object> ruleConfig = new HashMap<>();

    // Default execution settings
    ruleConfig.put("execution_settings", getDefaultRuleExecutionSettings());

    // Default validation thresholds
    Map<String, Object> thresholds = new HashMap<>();
    thresholds.put("gpa_minimum", 2.5);
    ruleConfig.put("validation_thresholds", thresholds);

    // Default feature toggles
    Map<String, Object> features = new HashMap<>();
    features.put("real_time_validation", true);
    features.put("batch_processing", false);
    ruleConfig.put("feature_toggles", features);

    return ruleConfig;
  }

  /** Get default rule execution settings */
  private Map<String, Object> getDefaultRuleExecutionSettings() {
    Map<String, Object> settings = new HashMap<>();
    settings.put("timeout_seconds", 30);
    settings.put("max_retries", 3);
    settings.put("parallel_execution", false);
    settings.put("cache_results", true);
    settings.put("log_execution_details", true);
    return settings;
  }
}

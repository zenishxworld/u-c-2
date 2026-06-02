package com.uniflow.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import groovy.lang.GroovyClassLoader;
import groovy.lang.GroovyObject;
import java.io.InputStream;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Rule Engine Service for UniFLow Platform
 *
 * <p>This service executes validation rules using Groovy scripts based on client-specific
 * configurations loaded from core-service config (uniflow.yml, uni360.yml, etc.).
 *
 * <p>Key features: - Client-specific rule set execution - Groovy script compilation and caching -
 * Parallel and sequential rule execution - Rule inheritance and configuration merging - Performance
 * monitoring and timeout handling
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEngineService {

  private final ClientConfigService clientConfigService;
  private final ResourceLoader resourceLoader;
  private final ObjectMapper objectMapper;

  private final GroovyClassLoader groovyClassLoader = new GroovyClassLoader();
  private final ExecutorService executorService = Executors.newCachedThreadPool();

  /** Execute a complete rule set for a client */
  public Mono<RuleExecutionResult> executeRuleSet(
      String clientId, String ruleSetName, Object inputData, Map<String, Object> executionContext) {
    log.info("Executing rule set: {} for client: {}", ruleSetName, clientId);

    return clientConfigService
        .getRuleSet(clientId, ruleSetName)
        .flatMap(
            ruleSetConfig -> {
              if (ruleSetConfig.isEmpty() || !Boolean.TRUE.equals(ruleSetConfig.get("enabled"))) {
                log.warn(
                    "Rule set {} is not enabled or not found for client: {}",
                    ruleSetName,
                    clientId);
                return Mono.just(createEmptyResult(ruleSetName));
              }

              return executeRuleSetInternal(
                  clientId, ruleSetName, ruleSetConfig, inputData, executionContext);
            })
        .doOnSuccess(
            result ->
                log.info(
                    "Rule set execution completed: {} for client: {}, success: {}",
                    ruleSetName,
                    clientId,
                    result.isSuccess()))
        .doOnError(
            error ->
                log.error(
                    "Rule set execution failed: {} for client: {}", ruleSetName, clientId, error));
  }

  /** Execute multiple rule sets in sequence */
  public Mono<List<RuleExecutionResult>> executeMultipleRuleSets(
      String clientId,
      List<String> ruleSetNames,
      Object inputData,
      Map<String, Object> executionContext) {
    log.info("Executing multiple rule sets: {} for client: {}", ruleSetNames, clientId);

    return Flux.fromIterable(ruleSetNames)
        .flatMapSequential(
            ruleSetName -> executeRuleSet(clientId, ruleSetName, inputData, executionContext))
        .collectList()
        .doOnSuccess(
            results ->
                log.info(
                    "Multiple rule sets execution completed for client: {}, total: {}, successful: {}",
                    clientId,
                    results.size(),
                    results.stream().mapToLong(r -> r.isSuccess() ? 1 : 0).sum()));
  }

  /** Execute a single rule */
  public Mono<RuleExecutionResult> executeRule(
      String clientId,
      String ruleSetName,
      String ruleName,
      Object inputData,
      Map<String, Object> executionContext) {
    log.debug("Executing single rule: {}.{} for client: {}", ruleSetName, ruleName, clientId);

    return clientConfigService
        .getRule(clientId, ruleSetName, ruleName)
        .flatMap(
            ruleConfig -> {
              if (ruleConfig.isEmpty() || !Boolean.TRUE.equals(ruleConfig.get("enabled"))) {
                log.warn(
                    "Rule {}.{} is not enabled or not found for client: {}",
                    ruleSetName,
                    ruleName,
                    clientId);
                return Mono.just(createEmptyResult(ruleName));
              }

              return executeRuleInternal(
                  clientId, ruleSetName, ruleName, ruleConfig, inputData, executionContext);
            });
  }

  /** Validate input data using client-specific validation rules */
  public Mono<ValidationResult> validateInput(
      String clientId, String validationType, Object inputData) {
    log.debug("Validating input for client: {}, type: {}", clientId, validationType);

    Map<String, Object> executionContext =
        createExecutionContext(clientId, validationType, "validation");

    return executeRuleSet(clientId, validationType, inputData, executionContext)
        .map(this::convertToValidationResult)
        .doOnSuccess(
            result ->
                log.debug(
                    "Input validation completed for client: {}, type: {}, valid: {}",
                    clientId,
                    validationType,
                    result.isValid()));
  }

  /** Get available rule sets for a client */
  public Mono<List<String>> getAvailableRuleSets(String clientId) {
    return clientConfigService
        .getValidationRuleSets(clientId)
        .map(ruleSets -> (List<String>) new ArrayList<>(ruleSets.keySet()))
        .doOnSuccess(
            ruleSets -> log.debug("Available rule sets for client {}: {}", clientId, ruleSets));
  }

  /** Internal method to execute a rule set */
  private Mono<RuleExecutionResult> executeRuleSetInternal(
      String clientId,
      String ruleSetName,
      Map<String, Object> ruleSetConfig,
      Object inputData,
      Map<String, Object> executionContext) {
    return Mono.fromCallable(
        () -> {
          RuleExecutionResult.RuleExecutionResultBuilder resultBuilder =
              RuleExecutionResult.builder()
                  .ruleSetName(ruleSetName)
                  .clientId(clientId)
                  .startTime(System.currentTimeMillis());

          try {
            // Get execution settings
            Map<String, Object> executionSettings = getExecutionSettings(clientId, ruleSetConfig);
            boolean parallelExecution =
                Boolean.TRUE.equals(executionSettings.get("parallel_execution"));

            // Get rules from the rule set
            Map<String, Object> rules = (Map<String, Object>) ruleSetConfig.get("rules");
            if (rules == null || rules.isEmpty()) {
              log.warn("No rules found in rule set: {} for client: {}", ruleSetName, clientId);
              return resultBuilder
                  .success(true)
                  .message("No rules to execute")
                  .endTime(System.currentTimeMillis())
                  .build();
            }

            // Sort rules by priority
            List<Map.Entry<String, Object>> sortedRules = sortRulesByPriority(rules);

            // Execute rules
            List<RuleResult> ruleResults = new ArrayList<>();
            boolean allRulesSuccessful = true;
            StringBuilder messages = new StringBuilder();

            if (parallelExecution) {
              // Execute rules in parallel
              List<CompletableFuture<RuleResult>> futures =
                  sortedRules.stream()
                      .map(
                          entry ->
                              CompletableFuture.supplyAsync(
                                  () ->
                                      executeRuleSync(
                                          clientId,
                                          ruleSetName,
                                          entry.getKey(),
                                          (Map<String, Object>) entry.getValue(),
                                          inputData,
                                          executionContext,
                                          executionSettings),
                                  executorService))
                      .collect(Collectors.toList());

              for (CompletableFuture<RuleResult> future : futures) {
                RuleResult result =
                    future.get(
                        (Integer) executionSettings.getOrDefault("timeout_seconds", 30),
                        TimeUnit.SECONDS);
                ruleResults.add(result);
                if (!result.isSuccess()) {
                  allRulesSuccessful = false;
                }
                if (result.getMessage() != null) {
                  messages.append(result.getMessage()).append("; ");
                }
              }
            } else {
              // Execute rules sequentially
              for (Map.Entry<String, Object> entry : sortedRules) {
                String ruleName = entry.getKey();
                Map<String, Object> ruleConfig = (Map<String, Object>) entry.getValue();

                RuleResult result =
                    executeRuleSync(
                        clientId,
                        ruleSetName,
                        ruleName,
                        ruleConfig,
                        inputData,
                        executionContext,
                        executionSettings);
                ruleResults.add(result);

                if (!result.isSuccess()) {
                  allRulesSuccessful = false;
                  // Stop execution if a critical rule fails
                  if (Boolean.TRUE.equals(ruleConfig.get("critical"))) {
                    log.warn(
                        "Critical rule failed, stopping execution: {}.{}", ruleSetName, ruleName);
                    break;
                  }
                }

                if (result.getMessage() != null) {
                  messages.append(result.getMessage()).append("; ");
                }
              }
            }

            return resultBuilder
                .success(allRulesSuccessful)
                .message(messages.toString())
                .ruleResults(ruleResults)
                .endTime(System.currentTimeMillis())
                .build();
          } catch (Exception e) {
            log.error("Error executing rule set: {} for client: {}", ruleSetName, clientId, e);
            return resultBuilder
                .success(false)
                .message("Rule set execution failed: " + e.getMessage())
                .error(e.getMessage())
                .endTime(System.currentTimeMillis())
                .build();
          }
        });
  }

  /** Internal method to execute a single rule */
  private Mono<RuleExecutionResult> executeRuleInternal(
      String clientId,
      String ruleSetName,
      String ruleName,
      Map<String, Object> ruleConfig,
      Object inputData,
      Map<String, Object> executionContext) {
    return Mono.fromCallable(
        () -> {
          RuleExecutionResult.RuleExecutionResultBuilder resultBuilder =
              RuleExecutionResult.builder()
                  .ruleSetName(ruleSetName)
                  .clientId(clientId)
                  .startTime(System.currentTimeMillis());

          try {
            Map<String, Object> executionSettings = getExecutionSettings(clientId, ruleConfig);
            RuleResult result =
                executeRuleSync(
                    clientId,
                    ruleSetName,
                    ruleName,
                    ruleConfig,
                    inputData,
                    executionContext,
                    executionSettings);

            return resultBuilder
                .success(result.isSuccess())
                .message(result.getMessage())
                .ruleResults(List.of(result))
                .endTime(System.currentTimeMillis())
                .build();
          } catch (Exception e) {
            log.error(
                "Error executing rule: {}.{} for client: {}", ruleSetName, ruleName, clientId, e);
            return resultBuilder
                .success(false)
                .message("Rule execution failed: " + e.getMessage())
                .error(e.getMessage())
                .endTime(System.currentTimeMillis())
                .build();
          }
        });
  }

  /** Synchronous rule execution */
  private RuleResult executeRuleSync(
      String clientId,
      String ruleSetName,
      String ruleName,
      Map<String, Object> ruleConfig,
      Object inputData,
      Map<String, Object> executionContext,
      Map<String, Object> executionSettings) {
    long startTime = System.currentTimeMillis();

    try {
      String className = (String) ruleConfig.get("class_name");
      if (className == null) {
        return RuleResult.builder()
            .ruleName(ruleName)
            .success(false)
            .message("Rule class name not specified")
            .executionTimeMs(System.currentTimeMillis() - startTime)
            .build();
      }

      // Load and instantiate the rule class
      GroovyObject ruleInstance = loadRuleClass(className);
      if (ruleInstance == null) {
        return RuleResult.builder()
            .ruleName(ruleName)
            .success(false)
            .message("Failed to load rule class: " + className)
            .executionTimeMs(System.currentTimeMillis() - startTime)
            .build();
      }

      // Set up rule execution context
      setupRuleContext(ruleInstance, clientId, ruleSetName, ruleName, ruleConfig, executionContext);

      // Set rule input
      ruleInstance.setProperty("ruleInput", inputData);

      // Execute the rule
      Object result = ruleInstance.invokeMethod("execute", new Object[0]);

      // Get validation results
      Object validationPassed = ruleInstance.getProperty("validationPassed");
      Object validationErrors = ruleInstance.getProperty("validationErrors");
      Object validationWarnings = ruleInstance.getProperty("validationWarnings");

      boolean success = Boolean.TRUE.equals(validationPassed);
      String message = buildResultMessage(validationErrors, validationWarnings);

      return RuleResult.builder()
          .ruleName(ruleName)
          .success(success)
          .message(message)
          .output(result)
          .validationErrors(
              validationErrors instanceof List
                  ? (List<String>) validationErrors
                  : new ArrayList<>())
          .validationWarnings(
              validationWarnings instanceof List
                  ? (List<String>) validationWarnings
                  : new ArrayList<>())
          .executionTimeMs(System.currentTimeMillis() - startTime)
          .build();
    } catch (Exception e) {
      log.error("Error executing rule: {}.{}", ruleSetName, ruleName, e);
      return RuleResult.builder()
          .ruleName(ruleName)
          .success(false)
          .message("Rule execution error: " + e.getMessage())
          .executionTimeMs(System.currentTimeMillis() - startTime)
          .build();
    }
  }

  /** Load and cache Groovy rule class */
  @Cacheable(value = "ruleClasses", key = "#className")
  private GroovyObject loadRuleClass(String className) {
    try {
      String scriptPath = "classpath:rules/implementations/" + className + ".groovy";
      Resource resource = resourceLoader.getResource(scriptPath);

      if (!resource.exists()) {
        log.error("Rule script not found: {}", scriptPath);
        return null;
      }

      try (InputStream inputStream = resource.getInputStream()) {
        String content = new String(inputStream.readAllBytes());
        Class<?> ruleClass = groovyClassLoader.parseClass(content);
        return (GroovyObject) ruleClass.newInstance();
      }
    } catch (Exception e) {
      log.error("Failed to load rule class: {}", className, e);
      return null;
    }
  }

  /** Setup rule execution context */
  private void setupRuleContext(
      GroovyObject ruleInstance,
      String clientId,
      String ruleSetName,
      String ruleName,
      Map<String, Object> ruleConfig,
      Map<String, Object> executionContext) {
    // Set basic context
    ruleInstance.setProperty("clientType", clientId);
    ruleInstance.setProperty("ruleName", ruleName);
    ruleInstance.setProperty("flowName", executionContext.get("flowName"));
    ruleInstance.setProperty("territory", executionContext.get("territory"));

    // Set client and flow configurations
    clientConfigService
        .getClientConfig(clientId)
        .subscribe(
            clientConfig -> {
              ruleInstance.setProperty("clientConfig", clientConfig);
              ruleInstance.setProperty("flowConfig", clientConfig.get("workflow"));
            });

    // Set rule-specific config
    ruleInstance.setProperty("ruleConfig", ruleConfig.get("config"));

    // Set execution metadata
    ruleInstance.setProperty("executionId", executionContext.get("executionId"));
    ruleInstance.setProperty("executionTimestamp", new java.util.Date());
  }

  /** Get execution settings with defaults */
  private Map<String, Object> getExecutionSettings(String clientId, Map<String, Object> config) {
    // Get client-specific execution settings
    Map<String, Object> clientSettings =
        clientConfigService
            .getRuleExecutionSettings(clientId)
            .block(); // Safe to block here as it should be cached

    Map<String, Object> settings = new HashMap<>();
    if (clientSettings != null) {
      settings.putAll(clientSettings);
    }

    // Override with rule set specific settings if present
    Map<String, Object> ruleSetSettings = (Map<String, Object>) config.get("execution_settings");
    if (ruleSetSettings != null) {
      settings.putAll(ruleSetSettings);
    }

    return settings;
  }

  /** Sort rules by priority */
  private List<Map.Entry<String, Object>> sortRulesByPriority(Map<String, Object> rules) {
    return rules.entrySet().stream()
        .sorted(
            (entry1, entry2) -> {
              Map<String, Object> rule1 = (Map<String, Object>) entry1.getValue();
              Map<String, Object> rule2 = (Map<String, Object>) entry2.getValue();

              Integer priority1 = (Integer) rule1.getOrDefault("priority", 999);
              Integer priority2 = (Integer) rule2.getOrDefault("priority", 999);

              return priority1.compareTo(priority2);
            })
        .collect(Collectors.toList());
  }

  /** Build result message from validation errors and warnings */
  private String buildResultMessage(Object errors, Object warnings) {
    StringBuilder message = new StringBuilder();

    if (errors instanceof List && !((List<?>) errors).isEmpty()) {
      message.append("Errors: ").append(errors).append("; ");
    }

    if (warnings instanceof List && !((List<?>) warnings).isEmpty()) {
      message.append("Warnings: ").append(warnings).append("; ");
    }

    return message.length() > 0 ? message.toString() : "Validation completed successfully";
  }

  /** Create execution context */
  private Map<String, Object> createExecutionContext(
      String clientId, String operation, String type) {
    Map<String, Object> context = new HashMap<>();
    context.put("clientId", clientId);
    context.put("operation", operation);
    context.put("type", type);
    context.put("executionId", java.util.UUID.randomUUID().toString());
    context.put("timestamp", System.currentTimeMillis());
    context.put("flowName", "default_flow");
    context.put("territory", "default");
    return context;
  }

  /** Create empty result */
  private RuleExecutionResult createEmptyResult(String name) {
    return RuleExecutionResult.builder()
        .ruleSetName(name)
        .success(true)
        .message("Rule set not enabled or not found")
        .ruleResults(new ArrayList<>())
        .startTime(System.currentTimeMillis())
        .endTime(System.currentTimeMillis())
        .build();
  }

  /** Convert rule execution result to validation result */
  private ValidationResult convertToValidationResult(RuleExecutionResult executionResult) {
    List<String> errors = new ArrayList<>();
    List<String> warnings = new ArrayList<>();

    for (RuleResult ruleResult : executionResult.getRuleResults()) {
      errors.addAll(ruleResult.getValidationErrors());
      warnings.addAll(ruleResult.getValidationWarnings());
    }

    return ValidationResult.builder()
        .valid(executionResult.isSuccess())
        .errors(errors)
        .warnings(warnings)
        .executionTimeMs(executionResult.getEndTime() - executionResult.getStartTime())
        .build();
  }

  // Data transfer objects

  @Data
  @Builder
  public static class RuleExecutionResult {

    private String ruleSetName;
    private String clientId;
    private boolean success;
    private String message;
    private String error;
    private List<RuleResult> ruleResults;
    private long startTime;
    private long endTime;
  }

  @Data
  @Builder
  public static class RuleResult {

    private String ruleName;
    private boolean success;
    private String message;
    private Object output;
    private List<String> validationErrors;
    private List<String> validationWarnings;
    private long executionTimeMs;
  }

  @Data
  @Builder
  public static class ValidationResult {

    private boolean valid;
    private List<String> errors;
    private List<String> warnings;
    private long executionTimeMs;
  }
}

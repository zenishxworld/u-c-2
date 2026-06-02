package com.uniflow.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class DatabaseInitializerService {

  @Autowired private R2dbcEntityTemplate r2dbcEntityTemplate;

  @Profile({"docker", "development"})
  @Bean
  public CommandLineRunner initializeCoreDatabase() {
    return args -> {
      log.info("Starting Core Service database initialization...");

      createTablesAndData()
          .doOnSuccess(
              result -> log.info("Core Service database initialization completed successfully"))
          .doOnError(error -> log.error("Core Service database initialization failed", error))
          .subscribe();
    };
  }

  private Mono<Void> createTablesAndData() {
    String createTablesSQL =
        """
            -- Core Service Tables
            CREATE TABLE IF NOT EXISTS system_config (
                id BIGSERIAL PRIMARY KEY,
                config_key VARCHAR(255) NOT NULL UNIQUE,
                config_value TEXT NOT NULL,
                description TEXT,
                is_encrypted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS business_rules (
                id BIGSERIAL PRIMARY KEY,
                rule_name VARCHAR(255) NOT NULL UNIQUE,
                rule_type VARCHAR(100) NOT NULL,
                rule_expression TEXT NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                priority INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS application_settings (
                id BIGSERIAL PRIMARY KEY,
                setting_category VARCHAR(100) NOT NULL,
                setting_key VARCHAR(255) NOT NULL,
                setting_value TEXT NOT NULL,
                data_type VARCHAR(50) DEFAULT 'STRING',
                is_system_level BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(setting_category, setting_key)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGSERIAL PRIMARY KEY,
                entity_type VARCHAR(100) NOT NULL,
                entity_id VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                old_values JSONB,
                new_values JSONB,
                user_id VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address INET,
                user_agent TEXT
            );

            CREATE TABLE IF NOT EXISTS rate_limits (
                id BIGSERIAL PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                identifier_type VARCHAR(50) NOT NULL,
                endpoint VARCHAR(255) NOT NULL,
                request_count INTEGER DEFAULT 0,
                window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(identifier, identifier_type, endpoint)
            );

            CREATE TABLE IF NOT EXISTS service_health (
                id BIGSERIAL PRIMARY KEY,
                service_name VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL,
                last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                response_time_ms INTEGER,
                error_message TEXT,
                metadata JSONB
            );
            """;

    String insertDataSQL =
        """
            INSERT INTO system_config (config_key, config_value, description) VALUES
            ('app.name', 'UniFLow Core Service', 'Application name'),
            ('app.version', '1.0.0', 'Application version'),
            ('security.jwt.expiration', '86400000', 'JWT expiration time in milliseconds (24 hours)'),
            ('rate.limit.default.requests', '1000', 'Default rate limit requests per hour'),
            ('audit.retention.days', '90', 'Number of days to retain audit logs'),
            ('cache.default.ttl', '3600', 'Default cache TTL in seconds')
            ON CONFLICT (config_key) DO NOTHING;

            INSERT INTO business_rules (rule_name, rule_type, rule_expression, description) VALUES
            ('default_user_access', 'AUTHORIZATION', 'hasRole(''USER'')', 'Default user access rule'),
            ('admin_only_access', 'AUTHORIZATION', 'hasRole(''ADMIN'')', 'Admin only access rule'),
            ('service_rate_limit', 'RATE_LIMITING', 'requests_per_hour <= 1000', 'Default service rate limiting rule')
            ON CONFLICT (rule_name) DO NOTHING;

            INSERT INTO application_settings (setting_category, setting_key, setting_value, data_type, is_system_level) VALUES
            ('security', 'password.min.length', '8', 'INTEGER', TRUE),
            ('security', 'password.require.special.chars', 'true', 'BOOLEAN', TRUE),
            ('notification', 'email.enabled', 'true', 'BOOLEAN', TRUE),
            ('notification', 'sms.enabled', 'false', 'BOOLEAN', TRUE),
            ('system', 'maintenance.mode', 'false', 'BOOLEAN', TRUE),
            ('system', 'max.file.upload.size', '10485760', 'INTEGER', TRUE)
            ON CONFLICT (setting_category, setting_key) DO NOTHING;
            """;

    return r2dbcEntityTemplate
        .getDatabaseClient()
        .sql(createTablesSQL)
        .then()
        .then(r2dbcEntityTemplate.getDatabaseClient().sql(insertDataSQL).then())
        .doOnSuccess(result -> log.info("Core service database schema and data initialized"))
        .doOnError(error -> log.error("Failed to initialize core service database", error));
  }
}

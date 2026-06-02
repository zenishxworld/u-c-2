package com.uniflow.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.shared.util.JsonNodeToPostgresJsonConverter;
import com.uniflow.shared.util.PostgresJsonToJsonNodeConverter;
import io.r2dbc.spi.ConnectionFactory;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.r2dbc.ConnectionFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.r2dbc.config.AbstractR2dbcConfiguration;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.r2dbc.dialect.PostgresDialect;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.r2dbc.connection.init.ConnectionFactoryInitializer;
import org.springframework.transaction.ReactiveTransactionManager;
import reactor.core.publisher.Mono;

/**
 * Database configuration for the consolidated UniFLow platform.
 *
 * <p>This configuration handles: - R2DBC connection factory setup for reactive database access -
 * Connection pooling configuration - Transaction management - Custom type converters - Repository
 * scanning
 */
@Slf4j
@Configuration
@EnableR2dbcRepositories(
    basePackages = {
        "com.uniflow.auth.repository",
        "com.uniflow.admin.repository",
        "com.uniflow.application.repository",
        "com.uniflow.student.repository",
        "com.uniflow.university.repository",
        "com.uniflow.notification.repository",
        "com.uniflow.workflow.repository",
        "com.uniflow.core.repository",
        "com.uniflow.document.repository",
        "com.uniflow.support.repository",
        "com.uniflow.visa.repository",
        "com.uniflow.meeting.repository",
        "com.uniflow.query.repository",
        "com.uniflow.payment.repository",
        "com.uniflow.commission.repository",
        "com.uniflow.quiz.repository",
        "com.uniflow.contact.repository"
    }
)
public class DatabaseConfig extends AbstractR2dbcConfiguration {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Environment env;

    @Value(
        "${spring.r2dbc.url:r2dbc:postgresql://localhost:5432/uniflow_consolidated}"
    )
    private String databaseUrl;

    @Value("${spring.r2dbc.username:uniflow}")
    private String username;

    @Value("${spring.r2dbc.password:uniflow123}")
    private String password;

    @Value("${spring.r2dbc.pool.initial-size:10}")
    private int initialSize;

    @Value("${spring.r2dbc.pool.max-size:50}")
    private int maxSize;

    @Value("${spring.r2dbc.pool.max-idle-time:30m}")
    private Duration maxIdleTime;

    @Value("${spring.r2dbc.pool.validation-query:SELECT 1}")
    private String validationQuery;

    @Override
    @Bean
    public ConnectionFactory connectionFactory() {
        log.info(
            "Configuring R2DBC connection using Spring Boot ConnectionFactoryBuilder"
        );

        return ConnectionFactoryBuilder.withUrl(databaseUrl)
            .username(username)
            .password(password)
            .build();
    }

    @Bean
    public ReactiveTransactionManager transactionManager(
        ConnectionFactory connectionFactory
    ) {
        return new R2dbcTransactionManager(connectionFactory);
    }

    @Bean
    public R2dbcEntityTemplate r2dbcEntityTemplate(
        ConnectionFactory connectionFactory
    ) {
        return new R2dbcEntityTemplate(connectionFactory);
    }

    @Bean
    public ConnectionFactoryInitializer initializer(
        ConnectionFactory connectionFactory
    ) {
        ConnectionFactoryInitializer initializer =
            new ConnectionFactoryInitializer();
        initializer.setConnectionFactory(connectionFactory);

        // Use custom PostgreSQL script executor that handles dollar-quoted strings properly
        PostgreSQLScriptExecutor scriptExecutor = new PostgreSQLScriptExecutor(
            connectionFactory
        );

        initializer.setDatabasePopulator(connection -> {
            // Initialize schema for all profiles
            log.info("Initializing database schema");
            return scriptExecutor
                .executeScript(new ClassPathResource("schema.sql"))
                .then(
                    Mono.defer(() -> {
                        // Initialize demo data
                        log.info("Initializing demo data");
                        return scriptExecutor.executeScript(
                            new ClassPathResource("init-data-simple.sql")
                        );
                    })
                );
        });

        return initializer;
    }

    @Override
    @Bean
    public R2dbcCustomConversions r2dbcCustomConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();

        // Add JSON converters for PostgreSQL JSONB support
        converters.add(new PostgresJsonToJsonNodeConverter(objectMapper));
        converters.add(new JsonNodeToPostgresJsonConverter(objectMapper));

        // Add custom converters for enum types
        converters.add(new EducationLevelReadConverter());
        converters.add(new EducationLevelWriteConverter());
        converters.add(new VerificationStatusReadConverter());
        converters.add(new VerificationStatusWriteConverter());

        return R2dbcCustomConversions.of(PostgresDialect.INSTANCE, converters);
    }

    private String getActiveProfile() {
        String[] activeProfiles = env.getActiveProfiles();
        if (activeProfiles != null && activeProfiles.length > 0) {
            return activeProfiles[0];
        } else {
            return null;
        }
    }

    // DataSource configuration removed - using Spring Boot's auto-configuration
    // with values from application.yml

    // Custom converters for enum types
    @org.springframework.data.convert.ReadingConverter
    public static class EducationLevelReadConverter
        implements Converter<String, com.uniflow.common.enums.EducationLevel> {

        @Override
        public com.uniflow.common.enums.EducationLevel convert(String source) {
            return com.uniflow.common.enums.EducationLevel.valueOf(source);
        }
    }

    @org.springframework.data.convert.WritingConverter
    public static class EducationLevelWriteConverter
        implements Converter<com.uniflow.common.enums.EducationLevel, String> {

        @Override
        public String convert(com.uniflow.common.enums.EducationLevel source) {
            return source.name();
        }
    }

    @org.springframework.data.convert.ReadingConverter
    public static class VerificationStatusReadConverter
        implements
            Converter<String, com.uniflow.common.enums.VerificationStatus> {

        @Override
        public com.uniflow.common.enums.VerificationStatus convert(
            String source
        ) {
            return com.uniflow.common.enums.VerificationStatus.valueOf(source);
        }
    }

    @org.springframework.data.convert.WritingConverter
    public static class VerificationStatusWriteConverter
        implements
            Converter<com.uniflow.common.enums.VerificationStatus, String> {

        @Override
        public String convert(
            com.uniflow.common.enums.VerificationStatus source
        ) {
            return source.name();
        }
    }
}

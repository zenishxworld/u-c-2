package com.uniflow;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.r2dbc.config.EnableR2dbcAuditing;
// import org.springframework.kafka.annotation.EnableKafka; // KAFKA DISABLED
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for the consolidated UniFLow platform.
 *
 * <p>This application combines all microservices into a single monolithic service while maintaining
 * the modular architecture and reactive programming model.
 *
 * <p>Features: - Reactive WebFlux for non-blocking I/O - R2DBC for reactive database access - Redis
 * for caching and session management - JWT-based authentication - OpenAPI documentation -
 * Comprehensive logging and monitoring
 *
 * <p>Note: Kafka event streaming is currently disabled but can be re-enabled by uncommenting
 * relevant configurations.
 */
@Slf4j
@SpringBootApplication(
    scanBasePackages = "com.uniflow",
    exclude = {
        org.springframework.boot.autoconfigure.flyway
            .FlywayAutoConfiguration.class,
        org.springframework.boot.autoconfigure.orm.jpa
            .HibernateJpaAutoConfiguration.class,
        org.springframework.boot.autoconfigure.data.jpa
            .JpaRepositoriesAutoConfiguration.class,
        // Redis autoconfiguration excluded - will be conditionally enabled
        org.springframework.boot.autoconfigure.data.redis
            .RedisAutoConfiguration.class,
        org.springframework.boot.autoconfigure.data.redis
            .RedisReactiveAutoConfiguration.class,
        org.springframework.boot.actuate.autoconfigure.data.redis
            .RedisHealthContributorAutoConfiguration.class,
        org.springframework.boot.actuate.autoconfigure.data.redis
            .RedisReactiveHealthContributorAutoConfiguration.class,
    }
)
@EnableConfigurationProperties
@EnableR2dbcAuditing
// @EnableKafka // KAFKA DISABLED
@EnableAsync
@EnableScheduling
@OpenAPIDefinition(
    info = @Info(
        title = "UniFLow Platform API",
        version = "1.0.0",
        description = "Consolidated University Application Management Platform - All services in one",
        contact = @Contact(
            name = "UniFLow Development Team",
            email = "dev@uniflow.com"
        ),
        license = @License(
            name = "MIT License",
            url = "https://opensource.org/licenses/MIT"
        )
    )
)
public class UniFlowApplication {

    public static void main(String[] args) {
        // Set system properties for better performance and stability
        System.setProperty(
            "reactor.netty.http.server.accessLogEnabled",
            "false"
        );
        System.setProperty("spring.main.lazy-initialization", "false");
        System.setProperty("spring.devtools.restart.enabled", "false");
        System.setProperty("spring.devtools.livereload.enabled", "false");

        log.info("Starting UniFLow Consolidated Platform...");

        // Print startup banner
        printStartupBanner();

        SpringApplication app = new SpringApplication(UniFlowApplication.class);

        // Configure application for stable startup
        app.setRegisterShutdownHook(true);
        app.setLogStartupInfo(true);

        // Add shutdown hook for graceful shutdown
        Runtime.getRuntime().addShutdownHook(
            new Thread(() -> {
                log.info("UniFLow Platform is shutting down gracefully...");
            })
        );

        try {
            app.run(args);
            log.info("UniFLow Platform started successfully!");
        } catch (Exception e) {
            log.error(
                "Failed to start UniFLow Platform: {}",
                e.getMessage(),
                e
            );
            System.exit(1);
        }
    }

    private static void printStartupBanner() {
        String banner = """

            ██╗   ██╗███╗   ██╗██╗███████╗██╗      ██████╗ ██╗    ██╗
            ██║   ██║████╗  ██║██║██╔════╝██║     ██╔═══██╗██║    ██║
            ██║   ██║██╔██╗ ██║██║█████╗  ██║     ██║   ██║██║ █╗ ██║
            ██║   ██║██║╚██╗██║██║██╔══╝  ██║     ██║   ██║██║███╗██║
            ╚██████╔╝██║ ╚████║██║██║     ███████╗╚██████╔╝╚███╔███╔╝
             ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝

            University Application Management Platform - Consolidated Service
            Version: 1.0.0-SNAPSHOT

            Services Included:
            ✓ Authentication & Authorization
            ✓ Student Management
            ✓ Admin Management
            ✓ University Management
            ✓ Application Processing
            ✓ Notification System
            ✓ Workflow Orchestration
            ✓ Core Business Logic

            """;

        System.out.println(banner);
    }
}

# Multi-stage Dockerfile for UniFlow Application

# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS builder

# Set working directory
WORKDIR /app

# Copy Maven configuration files
COPY pom.xml .

# Download dependencies using BuildKit cache to speed up builds
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application using BuildKit cache
RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests -B

# Verify the JAR was created
RUN ls -la target/

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-jammy

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apt-get update -o Acquire::Retries=3 --fix-missing && \
    apt-get install -y --fix-missing curl && \
    rm -rf /var/lib/apt/lists/* || \
    (sleep 10 && apt-get update -o Acquire::Retries=5 --fix-missing && \
     apt-get install -y --fix-missing curl && \
     rm -rf /var/lib/apt/lists/*)

# Create non-root user for security
RUN groupadd -r uniflow && useradd -r -g uniflow uniflow

# Copy the JAR from builder stage
COPY --from=builder /app/target/uniflow-consolidated-*.jar app.jar

# Change ownership of the application files
RUN chown -R uniflow:uniflow /app

# Switch to non-root user
USER uniflow

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM optimization arguments
ENV JAVA_OPTS="-server -Xms512m -Xmx1024m -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+OptimizeStringConcat"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
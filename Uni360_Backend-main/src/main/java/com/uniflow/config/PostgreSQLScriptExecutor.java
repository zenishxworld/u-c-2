package com.uniflow.config;

import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.spi.Statement;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Custom PostgreSQL script executor that properly handles dollar-quoted strings and other
 * PostgreSQL-specific syntax that R2DBC's ResourceDatabasePopulator may not handle correctly.
 */
@Slf4j
public class PostgreSQLScriptExecutor {

    private static final Pattern DOLLAR_QUOTE_PATTERN = Pattern.compile(
        "\\$([^$]*)\\$"
    );
    private static final String STATEMENT_SEPARATOR = ";";
    private static final String COMMENT_PREFIX = "--";
    private static final String BLOCK_COMMENT_START = "/*";
    private static final String BLOCK_COMMENT_END = "*/";

    private final ConnectionFactory connectionFactory;

    public PostgreSQLScriptExecutor(ConnectionFactory connectionFactory) {
        this.connectionFactory = connectionFactory;
    }

    /** Execute a SQL script from a resource, handling PostgreSQL-specific syntax */
    public Mono<Void> executeScript(Resource resource) {
        return Mono.fromCallable(() -> readScript(resource))
            .flatMap(this::parseStatements)
            .flatMap(this::executeStatements);
    }

    /** Read the entire script content from the resource */
    private String readScript(Resource resource) throws IOException {
        StringBuilder content = new StringBuilder();
        try (
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                    resource.getInputStream(),
                    StandardCharsets.UTF_8
                )
            )
        ) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }
        return content.toString();
    }

    /**
     * Parse the script content into individual SQL statements, properly handling PostgreSQL
     * dollar-quoted strings and multi-line statements
     */
    private Mono<List<String>> parseStatements(String scriptContent) {
        return Mono.fromCallable(() -> {
            List<String> statements = new ArrayList<>();
            StringBuilder currentStatement = new StringBuilder();

            String[] lines = scriptContent.split("\n");
            boolean inBlockComment = false;
            String currentDollarQuote = null;
            boolean inStatement = false;
            int parenthesesLevel = 0;
            boolean inQuotedString = false;
            char quoteChar = '\0';

            for (String line : lines) {
                String trimmedLine = line.trim();

                // Skip empty lines when not in a statement
                if (trimmedLine.isEmpty() && !inStatement) {
                    continue;
                }

                // Handle block comments
                if (
                    !inBlockComment &&
                    trimmedLine.startsWith(BLOCK_COMMENT_START)
                ) {
                    inBlockComment = true;
                    if (trimmedLine.contains(BLOCK_COMMENT_END)) {
                        inBlockComment = false;
                    }
                    continue;
                }

                if (inBlockComment) {
                    if (trimmedLine.contains(BLOCK_COMMENT_END)) {
                        inBlockComment = false;
                    }
                    continue;
                }

                // Skip single-line comments when not in a statement
                if (trimmedLine.startsWith(COMMENT_PREFIX) && !inStatement) {
                    continue;
                }

                // Handle dollar-quoted strings
                if (currentDollarQuote == null) {
                    Matcher matcher = DOLLAR_QUOTE_PATTERN.matcher(line);
                    if (matcher.find()) {
                        currentDollarQuote = matcher.group(0); // e.g., "$$" or "$tag$"
                    }
                } else {
                    // We're inside a dollar-quoted string, look for the closing quote
                    if (line.contains(currentDollarQuote)) {
                        int closeIndex = line.indexOf(currentDollarQuote);
                        // Make sure this isn't the opening quote on the same line
                        if (
                            closeIndex > 0 ||
                            !line.trim().startsWith(currentDollarQuote)
                        ) {
                            currentDollarQuote = null;
                        }
                    }
                }

                // Check if this line starts a new statement
                if (
                    !inStatement &&
                    (trimmedLine.startsWith("INSERT") ||
                        trimmedLine.startsWith("UPDATE") ||
                        trimmedLine.startsWith("DELETE") ||
                        trimmedLine.startsWith("SELECT") ||
                        trimmedLine.startsWith("CREATE") ||
                        trimmedLine.startsWith("ALTER") ||
                        trimmedLine.startsWith("DROP"))
                ) {
                    inStatement = true;
                    parenthesesLevel = 0;
                    inQuotedString = false;
                }

                if (inStatement || !trimmedLine.isEmpty()) {
                    currentStatement.append(line).append("\n");

                    // Track parentheses and quotes to handle complex multi-line statements
                    if (
                        currentDollarQuote == null &&
                        !trimmedLine.startsWith(COMMENT_PREFIX)
                    ) {
                        for (int i = 0; i < line.length(); i++) {
                            char c = line.charAt(i);

                            if (!inQuotedString) {
                                if (c == '\'' || c == '"') {
                                    inQuotedString = true;
                                    quoteChar = c;
                                } else if (c == '(') {
                                    parenthesesLevel++;
                                } else if (c == ')') {
                                    parenthesesLevel--;
                                }
                            } else {
                                if (
                                    c == quoteChar &&
                                    (i == 0 || line.charAt(i - 1) != '\\')
                                ) {
                                    inQuotedString = false;
                                }
                            }
                        }
                    }

                    // Check for statement completion
                    if (
                        inStatement &&
                        currentDollarQuote == null &&
                        !inQuotedString &&
                        trimmedLine.endsWith(STATEMENT_SEPARATOR) &&
                        parenthesesLevel <= 0
                    ) {
                        String statement = currentStatement.toString().trim();
                        if (!statement.isEmpty()) {
                            statements.add(statement);
                            log.debug(
                                "Parsed SQL statement: {}",
                                statement.length() > 100
                                    ? statement.substring(0, 100) + "..."
                                    : statement
                            );
                        }
                        currentStatement = new StringBuilder();
                        inStatement = false;
                        parenthesesLevel = 0;
                        inQuotedString = false;
                    }
                }
            }

            // Add any remaining statement
            String lastStatement = currentStatement.toString().trim();
            if (!lastStatement.isEmpty()) {
                statements.add(lastStatement);
                log.debug(
                    "Parsed final SQL statement: {}",
                    lastStatement.length() > 100
                        ? lastStatement.substring(0, 100) + "..."
                        : lastStatement
                );
            }

            log.info("Parsed {} SQL statements from script", statements.size());
            return statements;
        });
    }

    /** Execute the parsed SQL statements */
    private Mono<Void> executeStatements(List<String> statements) {
        return Mono.usingWhen(
            connectionFactory.create(),
            connection ->
                Flux.fromIterable(statements)
                    .concatMap(sql -> executeStatement(connection, sql))
                    .then(),
            Connection::close
        );
    }

    /** Execute a single SQL statement */
    private Mono<Void> executeStatement(Connection connection, String sql) {
        return Mono.fromRunnable(() ->
            log.debug(
                "Executing SQL: {}",
                sql.length() > 200 ? sql.substring(0, 200) + "..." : sql
            )
        ).then(
            Mono.defer(() -> {
                try {
                    Statement statement = connection.createStatement(sql);
                    return Mono.from(statement.execute())
                        .flatMap(result -> Mono.from(result.getRowsUpdated()))
                        .doOnNext(rowsUpdated ->
                            log.debug(
                                "Statement executed, rows affected: {}",
                                rowsUpdated
                            )
                        )
                        .then()
                        .onErrorMap(throwable -> {
                            log.error(
                                "Error executing SQL statement: {}",
                                sql.trim(),
                                throwable
                            );
                            return new RuntimeException(
                                "Failed to execute SQL: " +
                                    sql.substring(
                                        0,
                                        Math.min(sql.length(), 100)
                                    ) +
                                    (sql.length() > 100 ? "..." : ""),
                                throwable
                            );
                        });
                } catch (Exception e) {
                    log.error(
                        "Error creating statement for SQL: {}",
                        sql.trim(),
                        e
                    );
                    return Mono.error(
                        new RuntimeException(
                            "Failed to create statement for SQL: " +
                                sql.substring(0, Math.min(sql.length(), 100)) +
                                (sql.length() > 100 ? "..." : ""),
                            e
                        )
                    );
                }
            })
        );
    }
}

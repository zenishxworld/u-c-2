package com.uniflow.config;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import java.time.format.DateTimeFormatter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * Jackson Configuration for proper date/time serialization
 *
 * This configuration ensures that LocalDate and LocalDateTime objects
 * are properly serialized to JSON strings in the expected format.
 */
@Configuration
public class JacksonConfig implements WebFluxConfigurer {

    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register Java 8 time module
        JavaTimeModule javaTimeModule = new JavaTimeModule();

        // Configure custom serializers and deserializers for date/time types
        javaTimeModule.addSerializer(
            new LocalDateSerializer(DateTimeFormatter.ofPattern(DATE_FORMAT))
        );
        javaTimeModule.addSerializer(
            new LocalDateTimeSerializer(
                DateTimeFormatter.ofPattern(DATETIME_FORMAT)
            )
        );
        javaTimeModule.addDeserializer(
            java.time.LocalDate.class,
            new LocalDateDeserializer(DateTimeFormatter.ofPattern(DATE_FORMAT))
        );
        javaTimeModule.addDeserializer(
            java.time.LocalDateTime.class,
            new LocalDateTimeDeserializer(
                DateTimeFormatter.ofPattern(DATETIME_FORMAT)
            )
        );

        mapper.registerModule(javaTimeModule);

        // Disable writing dates as timestamps
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Configure other useful settings
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

        // Exclude null values from JSON responses
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        return mapper;
    }

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        ObjectMapper mapper = objectMapper();

        configurer
            .defaultCodecs()
            .jackson2JsonEncoder(new Jackson2JsonEncoder(mapper));
        configurer
            .defaultCodecs()
            .jackson2JsonDecoder(new Jackson2JsonDecoder(mapper));
    }
}

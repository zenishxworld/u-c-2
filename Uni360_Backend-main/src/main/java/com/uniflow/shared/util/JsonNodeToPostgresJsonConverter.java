package com.uniflow.shared.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.r2dbc.postgresql.codec.Json;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;

/**
 * Converter to write JsonNode objects to PostgreSQL JSONB format This converter is used by Spring
 * Data R2DBC to handle JSONB columns
 */
@WritingConverter
public class JsonNodeToPostgresJsonConverter implements Converter<JsonNode, Json> {

  private final ObjectMapper objectMapper;

  public JsonNodeToPostgresJsonConverter(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public Json convert(JsonNode source) {
    if (source == null) {
      return null;
    }

    try {
      String json = objectMapper.writeValueAsString(source);
      return Json.of(json);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to convert JsonNode to JSON string", e);
    }
  }
}

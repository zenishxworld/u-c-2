package com.uniflow.shared.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.r2dbc.postgresql.codec.Json;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

/**
 * Converter to read PostgreSQL JSONB format to JsonNode objects This converter is used by Spring
 * Data R2DBC to handle JSONB columns
 */
@ReadingConverter
public class PostgresJsonToJsonNodeConverter implements Converter<Json, JsonNode> {

  private final ObjectMapper objectMapper;

  public PostgresJsonToJsonNodeConverter(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public JsonNode convert(Json source) {
    if (source == null) {
      return null;
    }

    try {
      String json = source.asString();
      return objectMapper.readTree(json);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to convert JSON string to JsonNode", e);
    }
  }
}

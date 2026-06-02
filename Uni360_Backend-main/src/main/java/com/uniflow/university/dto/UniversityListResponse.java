package com.uniflow.university.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * University List Response DTO
 *
 * This DTO represents the response for university list operations with pagination
 * and total count information, similar to the ApplicationResponse structure.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UniversityListResponse {

    private long totalCount;
    private List<UniversityResponseDTO> data;
    private int page;
    private int size;
    private boolean hasMore;
}

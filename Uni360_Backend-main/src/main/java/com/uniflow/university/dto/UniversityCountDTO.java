package com.uniflow.university.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * University Count DTO for grouped filter operations
 *
 * This DTO represents count information for university filters,
 * similar to ApplicationCountDTO and TaskCountDTO in the reference implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UniversityCountDTO {

    private String filterParam;
    private Object filterId;
    private Long count;
}

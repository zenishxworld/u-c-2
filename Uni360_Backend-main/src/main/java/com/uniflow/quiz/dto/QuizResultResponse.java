package com.uniflow.quiz.dto;

import com.uniflow.university.dto.UniversityResponseDTO;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResultResponse {

    private UUID sessionId;
    private int score;
    private int totalMatched;
    private List<UniversityResponseDTO> matchedUniversities;
    private LocalDateTime completedAt;
}

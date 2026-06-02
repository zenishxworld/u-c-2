package com.uniflow.quiz.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for quiz submission.
 *
 * <p>The 5 expected questionIds are:
 * <ul>
 *   <li>destination_country  — e.g. "Germany", "UK"</li>
 *   <li>degree_level         — e.g. "Bachelors", "Masters"</li>
 *   <li>study_field          — e.g. "Computer Science"</li>
 *   <li>budget               — e.g. "Low", "Medium", "High"</li>
 *   <li>work_preference      — e.g. "Work in the field", "Return to homeland"</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmitRequest {

    /** Answers are optional — if omitted, all active universities are returned as matches. */
    private List<AnswerItem> answers = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerItem {
        private String questionId;
        private String answer;
    }
}

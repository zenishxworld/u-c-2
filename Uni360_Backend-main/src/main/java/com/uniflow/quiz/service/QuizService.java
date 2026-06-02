package com.uniflow.quiz.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.quiz.dto.QuizResultResponse;
import com.uniflow.quiz.dto.QuizSubmitRequest;
import com.uniflow.quiz.dto.QuizSubmitRequest.AnswerItem;
import com.uniflow.quiz.entity.QuizAnswer;
import com.uniflow.quiz.entity.QuizSession;
import com.uniflow.quiz.repository.QuizAnswerRepository;
import com.uniflow.quiz.repository.QuizSessionRepository;
import com.uniflow.university.dto.UniversityResponseDTO;
import com.uniflow.university.entity.University;
import com.uniflow.university.repository.UniversityRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizSessionRepository quizSessionRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final UniversityRepository universityRepository;
    private final ObjectMapper objectMapper;

    public Mono<QuizResultResponse> submitQuiz(Long studentId, QuizSubmitRequest request) {
        // Default to empty list if answers were not provided
        List<AnswerItem> answers = (request.getAnswers() != null) ? request.getAnswers() : List.of();
        String countryFilter = getAnswerValue(answers, "destination_country");

        // Find matching universities (active + matching country if specified)
        return universityRepository.findAll()
                .filter(University::isActive)
                .filter(u -> countryFilter == null ||
                             countryFilter.equalsIgnoreCase(u.getCountry()) ||
                             countryFilter.equalsIgnoreCase("Any"))
                .map(this::mapToDTO)
                .collectList()
                .flatMap(matchedUnivs -> saveQuizSessionAndAnswers(studentId, answers, matchedUnivs));
    }

    private Mono<QuizResultResponse> saveQuizSessionAndAnswers(Long studentId, List<AnswerItem> answers, List<UniversityResponseDTO> matchedUnivs) {
        String matchedUnivsJson;
        try {
            matchedUnivsJson = objectMapper.writeValueAsString(matchedUnivs.stream().map(UniversityResponseDTO::getId).toList());
        } catch (JsonProcessingException e) {
            matchedUnivsJson = "[]";
            log.error("Failed to serialize matched universities", e);
        }

        QuizSession session = QuizSession.builder()
                .studentId(studentId)
                .score(matchedUnivs.size()) // Just a basic score mapping
                .matchedUniversities(matchedUnivsJson)
                .createdAt(LocalDateTime.now())
                .build();

        return quizSessionRepository.save(session)
                .flatMap(savedSession -> {
                    List<QuizAnswer> answerEntities = answers.stream()
                            .map(ans -> QuizAnswer.builder()
                                    .sessionId(savedSession.getId())
                                    .questionId(ans.getQuestionId())
                                    .answer(ans.getAnswer())
                                    .createdAt(LocalDateTime.now())
                                    .build())
                            .toList();

                    return quizAnswerRepository.saveAll(answerEntities)
                            .then(Mono.just(QuizResultResponse.builder()
                                    .sessionId(savedSession.getId())
                                    .score(savedSession.getScore())
                                    .totalMatched(matchedUnivs.size())
                                    .matchedUniversities(matchedUnivs)
                                    .completedAt(savedSession.getCreatedAt())
                                    .build()));
                });
    }

    public Mono<List<QuizResultResponse>> getHistory(Long studentId) {
        return quizSessionRepository.findByStudentIdOrderByCreatedAtDesc(studentId)
                .flatMap(session -> {
                    // In a full implementation, we would deserialize matchedUniversities JSON
                    // to fetch the actual universities again. For now, returning basic session info.
                    return Mono.just(QuizResultResponse.builder()
                            .sessionId(session.getId())
                            .score(session.getScore())
                            .completedAt(session.getCreatedAt())
                            .build());
                })
                .collectList();
    }

    private String getAnswerValue(List<AnswerItem> answers, String questionId) {
        return answers.stream()
                .filter(a -> a.getQuestionId().equals(questionId))
                .findFirst()
                .map(AnswerItem::getAnswer)
                .orElse(null);
    }

    private UniversityResponseDTO mapToDTO(University university) {
        return UniversityResponseDTO.builder()
                .id(university.getId())
                .name(university.getName())
                .country(university.getCountry())
                .city(university.getCity())
                .build();
    }
}

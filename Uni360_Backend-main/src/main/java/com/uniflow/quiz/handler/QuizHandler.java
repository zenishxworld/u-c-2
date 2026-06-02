package com.uniflow.quiz.handler;

import com.uniflow.common.dto.ApiResponse;
import com.uniflow.quiz.dto.QuizSubmitRequest;
import com.uniflow.quiz.service.QuizService;
import com.uniflow.auth.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * QuizHandler - Protected endpoint for university quiz flow.
 *
 * <p>Requires a valid student JWT token to access. Validates the submission
 * and forwards to QuizService for matching and persistence.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class QuizHandler {

    private final QuizService quizService;
    private final JwtUtils jwtUtils;

    /**
     * Submit quiz answers and get matched universities.
     * POST /api/v1/students/quiz/submit
     */
    public Mono<ServerResponse> submitQuiz(ServerRequest request) {
        return jwtUtils.getUserFromServerRequest(request)
                .flatMap(user -> request.bodyToMono(QuizSubmitRequest.class)
                        .defaultIfEmpty(new QuizSubmitRequest())
                        .flatMap(quizRequest -> quizService.submitQuiz(user.getId(), quizRequest))
                        .flatMap(response -> ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(ApiResponse.success(response, "Quiz completed successfully")))
                        .onErrorResume(IllegalArgumentException.class, ex ->
                                ServerResponse.badRequest()
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .bodyValue(ApiResponse.error("Invalid quiz submission: " + ex.getMessage())))
                        .onErrorResume(Exception.class, ex -> {
                            log.error("Error processing quiz submission", ex);
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(ApiResponse.error("Failed to process quiz submission."));
                        }))
                .switchIfEmpty(ServerResponse.status(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Unauthorized: Valid student token required")));
    }

    /**
     * Get quiz history for the authenticated student.
     * GET /api/v1/students/quiz/history
     */
    public Mono<ServerResponse> getQuizHistory(ServerRequest request) {
        return jwtUtils.getUserFromServerRequest(request)
                .flatMap(user -> quizService.getHistory(user.getId())
                        .flatMap(history -> ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(ApiResponse.success(history, "Quiz history retrieved successfully")))
                        .onErrorResume(Exception.class, ex -> {
                            log.error("Error fetching quiz history", ex);
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(ApiResponse.error("Failed to fetch quiz history."));
                        }))
                .switchIfEmpty(ServerResponse.status(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Unauthorized: Valid student token required")));
    }
}

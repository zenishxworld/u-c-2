package com.uniflow.config;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

/**
 * Hierarchical Router Configuration for the consolidated UniFLow platform.
 *
 * <p>
 * This configuration defines a main API router with organized sub-routers for
 * each domain: -
 * /api/v1/** - Main API endpoints - /actuator/** - Management endpoints -
 * /health - Health check
 * endpoint
 *
 * <p>
 * Architecture: - Main Router: Combines all sub-routers and handles base
 * routing - Domain
 * Sub-Routers: Each service domain has its own router - Clean separation of
 * concerns with
 * hierarchical routing - Consistent URL patterns and proper HTTP method mapping
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class RouterConfig {

        // Inject handlers for functional routing
        private final com.uniflow.auth.handler.AuthHandler authHandler;
        private final com.uniflow.workflow.handler.AdminTaskHandler adminTaskHandler;
        private final com.uniflow.workflow.handler.StudentProfileFlagHandler studentProfileFlagHandler;
        private final com.uniflow.student.handler.StudentHandler studentHandler;
        private final com.uniflow.university.handler.UniversityHandler universityHandler;
        private final com.uniflow.university.handler.CourseHandler courseHandler;
        private final com.uniflow.application.handler.ApplicationHandler applicationHandler;
        private final com.uniflow.notification.handler.NotificationHandler notificationHandler;
        private final com.uniflow.workflow.handler.WorkflowHandler workflowHandler;
        private final com.uniflow.admin.handler.SuperAdminHandler superAdminHandler;
        private final com.uniflow.admin.handler.CommissionHandler commissionHandler;
        private final com.uniflow.client.handler.ClientWorkflowHandler clientWorkflowHandler;
        private final com.uniflow.document.handler.GenericDocumentHandler genericDocumentHandler;
        private final com.uniflow.document.handler.DocumentWorkflowHandler documentWorkflowHandler;
        private final com.uniflow.support.handler.SupportTicketHandler supportTicketHandler;
        private final com.uniflow.support.handler.StudentSupportTicketHandler studentSupportTicketHandler;
        private final com.uniflow.ai.handler.AIHandler aiHandler;
        private final com.uniflow.student.handler.ProfileBuilderConfigHandler profileBuilderConfigHandler;
        private final com.uniflow.application.handler.AdminApplicationHandler adminApplicationHandler;
        // New handlers — Visa, Meeting URL, Admin Query
        private final com.uniflow.visa.handler.VisaHandler visaHandler;
        private final com.uniflow.visa.handler.AdminVisaHandler adminVisaHandler;
        private final com.uniflow.meeting.handler.MeetingUrlHandler meetingUrlHandler;
        private final com.uniflow.query.handler.AdminQueryHandler adminQueryHandler;
        private final com.uniflow.payment.handler.PaymentHandler paymentHandler;
        private final com.uniflow.admin.handler.AdminPaymentHandler adminPaymentHandler;
        private final com.uniflow.commission.handler.SuperAdminCommissionHandler superAdminCommissionHandler;
        private final com.uniflow.contact.handler.ContactHandler contactHandler;
        private final com.uniflow.quiz.handler.QuizHandler quizHandler;

        /**
         * Main router function that combines all API routes under /api/v1
         */
        @Bean
        public RouterFunction<ServerResponse> mainRouter() {
                return route()
                                // Health check at root level
                                .add(healthRouter())
                                // Main API under /api/v1
                                .add(apiV1Router())
                                // Core API under /api/core (separate from v1)
                                .build();
        }

        /**
         * Health check router - standalone endpoint
         */
        private RouterFunction<ServerResponse> healthRouter() {
                return route()
                                .GET("/health", this::healthCheck)
                                .GET("/api/v1/health", this::healthCheck)
                                .build();
        }

        /**
         * Main API v1 router - combines all service routers under /api/v1
         */
        private RouterFunction<ServerResponse> apiV1Router() {
                return route()
                                .path("/api/v1", () -> route()
                                                .add(authRouter())
                                                .add(adminRouter())
                                                .add(superAdminRouter())
                                                .add(studentRouter())
                                                .add(universityRouter())
                                                .add(courseRouter())
                                                .add(applicationRouter())
                                                .add(notificationRouter())
                                                .add(workflowRouter())
                                                .add(clientWorkflowRouter())
                                                .add(genericDocumentRouter())
                                                .add(documentWorkflowRouter())
                                                .add(aiRouter())
                                                .add(visaAdminRouter())
                                                .add(meetingUrlAdminRouter())
                                                .add(adminQueryRouter())
                                                .add(superAdminQueryRouter())
                                                .add(paymentRouter())
                                                .add(publicRouter())
                                                .add(quizRouter())
                                                .build())
                                .build();
        }

        // ========================================
        // SERVICE SUB-ROUTERS
        // ========================================

        /**
         * Authentication service router
         */
        private RouterFunction<ServerResponse> authRouter() {
                return route()
                                .path("/auth", () -> route()
                                                // Core authentication operations
                                                .POST("/login", authHandler::login)
                                                .POST("/refresh", authHandler::refreshToken)
                                                .POST("/logout", authHandler::logout)
                                                // Registration endpoints
                                                .POST("/register/student", authHandler::registerStudent)
                                                .POST("/register/admin", authHandler::registerAdmin)
                                                // Password management
                                                .POST("/forgot-password", authHandler::forgotPassword)
                                                .POST("/reset-password", authHandler::resetPassword)
                                                // Set / change password (authenticated — requires JWT)
                                                .POST("/set-password", authHandler::setPassword)
                                                // Email verification
                                                .GET("/verify-email", authHandler::verifyEmail)
                                                // Google OAuth endpoints
                                                .GET("/google/url", authHandler::getGoogleAuthUrl)
                                                .GET("/google/callback", authHandler::googleLogin)
                                                // Health check
                                                .GET("/health", authHandler::healthCheck)
                                                .build())
                                .build();
        }

        /**
         * Admin management router
         */
        private RouterFunction<ServerResponse> adminRouter() {
                return route()
                                .path("/admin", () -> route()
                                                // Dashboard and analytics
                                                // .GET("/dashboard", adminHandler::getDashboard)
                                                // Admin task management
                                                .path("/tasks", () -> route()
                                                                .GET("", adminTaskHandler::getMyTasks)
                                                                .GET("/filters", adminTaskHandler::getTaskFilters)
                                                                .GET(
                                                                                "/task-summary",
                                                                                adminTaskHandler::getTaskSummary)
                                                                .GET("/task-types", adminTaskHandler::getTaskTypes)
                                                                .POST(
                                                                                "/{taskId}/claim",
                                                                                adminTaskHandler::claimTask)
                                                                .POST(
                                                                                "/{taskId}/complete",
                                                                                adminTaskHandler::completeTask)
                                                                .GET(
                                                                                "/{taskId}/details",
                                                                                adminTaskHandler::getTaskDetails)
                                                                .GET(
                                                                                "/{taskId}/requirements",
                                                                                adminTaskHandler::getTaskRequirements)
                                                                .build())
                                                // Workflow progress management
                                                .path("/workflow", () -> route()
                                                                .GET(
                                                                                "/progress/{applicationId}",
                                                                                adminTaskHandler::getWorkflowProgress)
                                                                .GET(
                                                                                "/progress/instance/{workflowInstanceId}",
                                                                                adminTaskHandler::getWorkflowProgressByInstance)
                                                                .GET(
                                                                                "/workload",
                                                                                adminTaskHandler::getAdminWorkloadSummary)
                                                                .build())
                                                // Admin applications management
                                                .path("/applications", () -> route()
                                                                .GET(
                                                                                "",
                                                                                adminApplicationHandler::getAdminApplications)
                                                                .PUT(
                                                                                "/{applicationId}/flags",
                                                                                studentProfileFlagHandler::updateProfileFlags)
                                                                .PUT(
                                                                                "/{applicationId}/flags/{flagName}",
                                                                                studentProfileFlagHandler::updateSingleProfileFlag)
                                                                .GET(
                                                                                "/{applicationId}/flags",
                                                                                studentProfileFlagHandler::getProfileFlags)
                                                                .POST(
                                                                                "/{applicationId}/flags/batch-set",
                                                                                studentProfileFlagHandler::batchSetCommonFlags)
                                                                .build())
                                                // Commission management
                                                .path("/commissions", () -> route()
                                                                .GET(
                                                                                "/stats",
                                                                                commissionHandler::getCommissionStats)
                                                                .GET("", commissionHandler::getCommissionList)
                                                                .GET(
                                                                                "/export",
                                                                                commissionHandler::exportCommissions)
                                                                .GET(
                                                                                "/universities",
                                                                                commissionHandler::getUniversityCommissions)
                                                                .build())
                                                // Document workflow management - AD-02-03 Two-Table Architecture
                                                .path("/documents/workflow", () -> route()
                                                                .POST(
                                                                                "",
                                                                                documentWorkflowHandler::createDocumentWorkflow)
                                                                .GET(
                                                                                "/pending-review",
                                                                                documentWorkflowHandler::getDocumentsPendingReview)
                                                                .GET(
                                                                                "/reviewed",
                                                                                documentWorkflowHandler::getReviewedDocuments)
                                                                .GET(
                                                                                "/{workflowId}/view-url",
                                                                                documentWorkflowHandler::getDocumentViewUrl)
                                                                .GET(
                                                                                "/{applicationId}",
                                                                                documentWorkflowHandler::getWorkflowDocuments)
                                                                .PUT(
                                                                                "/{workflowId}/status",
                                                                                documentWorkflowHandler::updateWorkflowStatus)
                                                                .build())
                                                // Support ticket management - AD-08
                                                .path("/support", () -> route()
                                                                .POST(
                                                                                "/tickets",
                                                                                supportTicketHandler::createSupportTicket)
                                                                .GET(
                                                                                "/tickets",
                                                                                supportTicketHandler::getAdminTickets)
                                                                .GET(
                                                                                "/tickets/{ticketId}",
                                                                                supportTicketHandler::getTicketById)
                                                                .PUT(
                                                                                "/tickets/{ticketId}/status",
                                                                                supportTicketHandler::updateTicketStatus)
                                                                .POST(
                                                                                "/tickets/{ticketId}/messages",
                                                                                supportTicketHandler::addTicketMessage)
                                                                .GET(
                                                                                "/tickets/{ticketId}/messages",
                                                                                supportTicketHandler::getTicketMessages)
                                                                .POST(
                                                                                "/tickets/{ticketId}/escalate",
                                                                                supportTicketHandler::escalateTicket)
                                                                .GET(
                                                                                "/statistics",
                                                                                supportTicketHandler::getTicketStatistics)
                                                                .build())
                                                // Admin Meeting URL management
                                                .path("/meeting-urls", () -> route()
                                                                .POST("", meetingUrlHandler::addMeetingUrl)
                                                                .GET("", meetingUrlHandler::getMeetingUrls)
                                                                .build())
                                                // Admin Payment management
                                                .path("/payments", () -> route()
                                                                .GET("", adminPaymentHandler::getPaymentsForAdmin)
                                                                .build())
                                                // Admin student documents view + profile
                                                .path("/students", () -> route()
                                                                .GET("/{userId}/documents",
                                                                                superAdminHandler::getUserDocuments)
                                                                .GET("/{userId}/profile",
                                                                                superAdminHandler::getStudentProfileForAdmin)
                                                                .build())
                                                // Admin AI Tools — manual JSON body, no profile lookup
                                                .path("/ai", () -> route()
                                                                .POST(
                                                                                "/sop/generate",
                                                                                aiHandler::adminGenerateSop)
                                                                .POST(
                                                                                "/lor/generate",
                                                                                aiHandler::adminGenerateLor)
                                                                .POST(
                                                                                "/cover-letter/generate",
                                                                                aiHandler::adminGenerateCoverLetter)
                                                                .build())
                                                .build())
                                .build();
        }

        /**
         * Super Admin service router
         */
        private RouterFunction<ServerResponse> superAdminRouter() {
                return route()
                                .path("/superadmin", () -> route()
                                                .GET("/admins", superAdminHandler::getAdminsWithFilters)
                                                .GET(
                                                                "/admins/filters",
                                                                superAdminHandler::getAdminFiltersInfo)
                                                .GET(
                                                                "/admins/{adminId}/permissions",
                                                                superAdminHandler::getAdminPermissions)
                                                .PUT(
                                                                "/admins/{adminId}/permissions",
                                                                superAdminHandler::updateAdminPermissions)
                                                .GET(
                                                                "/permissions",
                                                                superAdminHandler::getAvailablePermissions)
                                                .GET("/health", superAdminHandler::healthCheck)
                                                 // Profile Builder Configuration Management routes removed for static handoff
                                                // SA-01: Master Dashboard KPI Routes
                                                .GET(
                                                                "/dashboard/kpis",
                                                                superAdminHandler::getMasterDashboardKPIs)
                                                .GET(
                                                                "/dashboard/system-overview",
                                                                superAdminHandler::getSystemOverviewMetrics)
                                                .GET(
                                                                "/dashboard/conversion-funnel",
                                                                superAdminHandler::getConversionFunnelAnalytics)
                                                .GET(
                                                                "/dashboard/revenue-forecast",
                                                                superAdminHandler::getRevenueForecasting)
                                                .GET(
                                                                "/dashboard/agent-performance",
                                                                superAdminHandler::getAgentPerformanceMetrics)
                                                // SA-02: Notification Oversight Routes
                                                .GET(
                                                                "/dashboard/notifications/overview",
                                                                superAdminHandler::getNotificationOverview)
                                                .POST(
                                                                "/dashboard/notifications/broadcast",
                                                                superAdminHandler::broadcastSystemNotification)
                                                .GET(
                                                                "/dashboard/notifications/analytics",
                                                                superAdminHandler::getNotificationAnalytics)
                                                .GET(
                                                                "/dashboard/notifications/templates",
                                                                superAdminHandler::manageNotificationTemplates)
                                                .GET(
                                                                "/dashboard/notifications/templates/{templateId}",
                                                                superAdminHandler::manageNotificationTemplates)
                                                .POST(
                                                                "/dashboard/notifications/templates",
                                                                superAdminHandler::manageNotificationTemplates)
                                                .PUT(
                                                                "/dashboard/notifications/templates/{templateId}",
                                                                superAdminHandler::manageNotificationTemplates)
                                                .DELETE(
                                                                "/dashboard/notifications/templates/{templateId}",
                                                                superAdminHandler::manageNotificationTemplates)
                                                // SA-03: User Management System Routes
                                                .GET("/dashboard/users", superAdminHandler::getAllUsers)
                                                .GET(
                                                                "/dashboard/users/analytics",
                                                                superAdminHandler::getUserAnalytics)
                                                .PUT(
                                                                "/dashboard/users/{userId}/status",
                                                                superAdminHandler::manageUserStatus)
                                                .GET(
                                                                "/dashboard/users/{userId}/activity-logs",
                                                                superAdminHandler::getUserActivityLogs)
                                                .GET(
                                                                "/dashboard/users/{userId}/documents",
                                                                superAdminHandler::getUserDocuments)
                                                .GET(
                                                                "/dashboard/users/{userId}/profile",
                                                                superAdminHandler::getStudentProfileForSuperAdmin)
                                                // SA-06: Application Oversight System Routes
                                                .GET(
                                                                "/dashboard/applications",
                                                                superAdminHandler::getApplicationOverview)
                                                .GET(
                                                                "/dashboard/applications/analytics",
                                                                superAdminHandler::getApplicationAnalytics)
                                                .GET(
                                                                "/dashboard/applications/bottlenecks",
                                                                superAdminHandler::getBottleneckAnalysis)
                                                .PUT(
                                                                "/dashboard/applications/{applicationId}/override",
                                                                superAdminHandler::overrideApplicationStatus)
                                                // SA-07: Super Admin Payment management
                                                .path("/dashboard/payments", () -> route()
                                                                .GET("", adminPaymentHandler::getAllPaymentsForSuperAdmin)
                                                                .build())
                                                // SA-08: Super Admin Commission management
                                                .path("/commissions", () -> route()
                                                                .GET("", superAdminCommissionHandler::getAllCommissions)
                                                                .GET("/stats", superAdminCommissionHandler::getCommissionStats)
                                                                .GET("/universities",
                                                                                superAdminCommissionHandler::getUniversityRates)
                                                                .PUT("/universities/{universityId}",
                                                                                superAdminCommissionHandler::setUniversityRate)
                                                                .build())
                                                // SA-09: Contact form submissions
                                                .GET("/contacts", contactHandler::getContacts)
                                                .build())
                                .build();
        }

        // ── Visa Admin Router ────────────────────────────────────────────────────
        private RouterFunction<ServerResponse> visaAdminRouter() {
                return route()
                                .path("/admin/visa", () -> route()
                                                .POST("/checklist", adminVisaHandler::saveChecklist)
                                                .GET("/checklist", adminVisaHandler::getChecklist)
                                                .POST("/appointments", adminVisaHandler::createAppointment)
                                                .PUT("/appointments/{id}/status",
                                                                adminVisaHandler::updateAppointmentStatus)
                                                .GET("/appointments",
                                                                adminVisaHandler::getAllAppointments)
                                                .GET("/appointments/student/{studentId}",
                                                                adminVisaHandler::getAppointmentsForStudent)
                                                .build())
                                .path("/students/visa", () -> route()
                                                .GET("/checklist", visaHandler::getVisaChecklist)
                                                .GET("/tracker", visaHandler::getMyVisaTracker)
                                                .PUT("/tracker", visaHandler::updateTrackerItem)
                                                .GET("/appointments", visaHandler::getMyAppointments)
                                                .build())
                                .build();
        }

        // ── Meeting URL Admin Router ─────────────────────────────────────────────
        private RouterFunction<ServerResponse> meetingUrlAdminRouter() {
                return route()
                                .path("/students", () -> route()
                                                .GET("/meeting-url", meetingUrlHandler::getMeetingUrl)
                                                .build())
                                .build();
        }

        // ── Admin Query Router ───────────────────────────────────────────────────
        private RouterFunction<ServerResponse> adminQueryRouter() {
                return route()
                                .path("/admin/queries", () -> route()
                                                .POST("", adminQueryHandler::submitQuery)
                                                .GET("", adminQueryHandler::getMyQueries)
                                                .build())
                                .build();
        }

        // ── SuperAdmin Query Router ──────────────────────────────────────────────
        private RouterFunction<ServerResponse> superAdminQueryRouter() {
                return route()
                                .path("/superadmin/queries", () -> route()
                                                .GET("", adminQueryHandler::getAllQueries)
                                                .PUT("/{id}/reply", adminQueryHandler::replyToQuery)
                                                .PUT("/{id}/close", adminQueryHandler::closeQuery)
                                                .build())
                                .build();
        }

        /**
         * Public router - no authentication required
         */
        private RouterFunction<ServerResponse> publicRouter() {
                return route()
                                .path("/public", () -> route()
                                                .POST("/contact", contactHandler::submitContact)
                                                .build())
                                .build();
        }

        /**
         * Quiz router - student quiz submission and history
         */
        private RouterFunction<ServerResponse> quizRouter() {
                return route()
                                .path("/students/quiz", () -> route()
                                                .POST("/submit", quizHandler::submitQuiz)
                                                .GET("/history", quizHandler::getQuizHistory)
                                                .build())
                                .build();
        }

        /**
         * Student service router
         */
        private RouterFunction<ServerResponse> studentRouter() {
                return route()
                                .path("/students", () -> route()
                                                // Profile builder routes
                                                .path("/profile/builder", () -> route()
                                                                .GET("", studentHandler::getProfileBuilderOverview)
                                                                .GET("/current", studentHandler::getCurrentStep)
                                                                .POST(
                                                                                "/validate/{stepId}",
                                                                                studentHandler::validateAndSaveStep)
                                                                .POST(
                                                                                "/validate",
                                                                                studentHandler::validateEntireProfile)
                                                                .POST("/reset", studentHandler::resetProfileData)
                                                                .POST("/set", studentHandler::bulkSetProfileData)
                                                                .GET(
                                                                                "/steps/{stepId}",
                                                                                studentHandler::getStepDetails)
                                                                .GET("/progress", studentHandler::getProgress)
                                                                .GET(
                                                                                "/config",
                                                                                profileBuilderConfigHandler::getActiveConfiguration)
                                                                .build())
                                                // Profile management routes
                                                .path("/profile", () -> route()
                                                                .GET("", studentHandler::getStudentProfile)
                                                                .GET("/summary", studentHandler::getProfileSummary)
                                                                .build())
                                                // Application management routes
                                                .path("/applications", () -> route()
                                                                .POST("", studentHandler::createApplication)
                                                                .GET("", studentHandler::getStudentApplications)
                                                                .GET("/{id}", studentHandler::getApplicationById)
                                                                .PUT("/{id}", studentHandler::updateApplication)
                                                                .POST(
                                                                                "/{id}/submit",
                                                                                studentHandler::submitApplication)
                                                                .GET(
                                                                                "/{id}/progress",
                                                                                studentHandler::getApplicationProgress)
                                                                .build())
                                                // Student dashboard
                                                .GET("/dashboard", studentHandler::getStudentDashboard)
                                                // Dashboard KPI endpoints (ST-02)
                                                .GET(
                                                                "/dashboard/profile-progress",
                                                                studentHandler::getProfileProgressKPI)
                                                .GET(
                                                                "/dashboard/task-progress",
                                                                studentHandler::getApplicationTasksProgressKPI)
                                                .GET(
                                                                "/dashboard/notifications",
                                                                studentHandler::getRecentNotificationsKPI)
                                                // University and Course endpoints (ST-04)
                                                .GET("/courses", studentHandler::getCoursesForStudent)
                                                .GET(
                                                                "/courses/favorites",
                                                                studentHandler::getFavoriteCourses)
                                                .GET("/courses/{id}", studentHandler::getCourseById)
                                                .GET(
                                                                "/universities",
                                                                studentHandler::getUniversitiesForStudent)
                                                .GET(
                                                                "/universities/country/{country}",
                                                                studentHandler::getUniversitiesByCountry)
                                                .GET(
                                                                "/universities/filters",
                                                                studentHandler::getUniversityFiltersForStudent)
                                                .GET(
                                                                "/university/{id}/popup",
                                                                studentHandler::getUniversityInfoPopup)
                                                .POST(
                                                                "/courses/favorite/{id}",
                                                                studentHandler::addCourseToFavorites)
                                                .DELETE(
                                                                "/courses/favorite/{id}",
                                                                studentHandler::removeCourseFromFavorites)
                                                // Student Document Management routes (AD-02-04)
                                                .path("/documents", () -> route()
                                                                .GET(
                                                                                "/overview",
                                                                                studentHandler::getStudentDocumentOverview)
                                                                .GET(
                                                                                "/pending",
                                                                                studentHandler::getPendingDocuments)
                                                                .GET(
                                                                                "/uploaded",
                                                                                studentHandler::getUploadedDocuments)
                                                                .GET(
                                                                                "/reupload",
                                                                                studentHandler::getReuploadDocuments)
                                                                .POST(
                                                                                "/upload",
                                                                                studentHandler::uploadStudentDocument)
                                                                .POST(
                                                                                "/send-to-application",
                                                                                studentHandler::sendDocumentToApplication)
                                                                .POST(
                                                                                "/bulk-upload",
                                                                                studentHandler::bulkUploadStudentDocuments)
                                                                .build())
                                                // Student Support Ticket routes (AD-08 Student Portal)
                                                .path("/support", () -> route()
                                                                .POST(
                                                                                "/tickets",
                                                                                studentSupportTicketHandler::createSupportTicket)
                                                                .GET(
                                                                                "/tickets",
                                                                                studentSupportTicketHandler::getStudentTickets)
                                                                .GET(
                                                                                "/tickets/{ticketId}",
                                                                                studentSupportTicketHandler::getTicketById)
                                                                .POST(
                                                                                "/tickets/{ticketId}/messages",
                                                                                studentSupportTicketHandler::addTicketMessage)
                                                                .GET(
                                                                                "/tickets/{ticketId}/messages",
                                                                                studentSupportTicketHandler::getTicketMessages)
                                                                .GET(
                                                                                "/statistics",
                                                                                studentSupportTicketHandler::getStudentTicketStatistics)
                                                                .build())
                                                .build())
                                .build();
        }

        /**
         * University service router
         */
        private RouterFunction<ServerResponse> universityRouter() {
                return route()
                                .path("/universities", () -> route()
                                                // Core CRUD operations
                                                .POST("", universityHandler::createUniversity)
                                                .GET("", universityHandler::getUniversities)
                                                // Filter operations (must come before /{id})
                                                .GET("/filters", universityHandler::getUniversityFilters)
                                                // Analytics and statistics (must come before /{id})
                                                .GET("/dashboard", universityHandler::getDashboardOverview)
                                                // University lookup operations
                                                .GET("/code/{code}", universityHandler::getUniversityByCode)
                                                // Search operations
                                                .path("/search", () -> route()
                                                                .POST("", universityHandler::searchUniversities)
                                                                .GET(
                                                                                "/text",
                                                                                universityHandler::searchUniversitiesByText)
                                                                .build())
                                                // Parameterized routes (must come after specific routes)
                                                .GET("/{id}", universityHandler::getUniversityById)
                                                .PUT("/{id}", universityHandler::updateUniversity)
                                                .DELETE("/{id}", universityHandler::deleteUniversity)
                                                .path("/statistics", () -> route()
                                                                .GET(
                                                                                "/country",
                                                                                universityHandler::getUniversityStatisticsByCountry)
                                                                .build())
                                                .build())
                                .build();
        }

        /**
         * Course router - handles global course endpoints accessible to all
         * authenticated users
         */
        private RouterFunction<ServerResponse> courseRouter() {
                return route()
                                .path("/courses", () -> route().GET("/{id}", courseHandler::getCourseById).build())
                                .build();
        }

        /**
         * Application router - handles application-related endpoints
         */
        private RouterFunction<ServerResponse> applicationRouter() {
                return route()
                                .path("/applications", () -> route()
                                                // Core CRUD operations with JWT user context
                                                .POST("", applicationHandler::createApplication)
                                                .GET("", applicationHandler::getAllApplications)
                                                .GET("/{id}", applicationHandler::getApplicationById)
                                                .GET(
                                                                "/reference/{referenceNumber}",
                                                                applicationHandler::getApplicationByReference)
                                                .PUT("/{id}", applicationHandler::updateApplication)
                                                .DELETE("/{id}", applicationHandler::deleteApplication)
                                                // Status and workflow operations
                                                .PUT(
                                                                "/{id}/status",
                                                                applicationHandler::updateApplicationStatus)
                                                // Search operations with user context filtering
                                                .POST("/search", applicationHandler::searchApplications)
                                                // Admin-only endpoints
                                                .GET(
                                                                "/attention",
                                                                applicationHandler::getApplicationsRequiringAttention)
                                                .GET(
                                                                "/statistics",
                                                                applicationHandler::getApplicationStatistics)
                                                // Health and utility endpoints
                                                .GET("/health", applicationHandler::healthCheck)
                                                .GET("/info", applicationHandler::getServiceInfo)
                                                .build())
                                .build();
        }

        /**
         * Notification service router
         */
        private RouterFunction<ServerResponse> notificationRouter() {
                return route()
                                .path("/notifications", () -> route()
                                                // Send notification to single recipient
                                                .POST("/send", notificationHandler::sendNotification)
                                                // Send broadcast notification to multiple recipients (admin only)
                                                .POST("/broadcast", notificationHandler::sendBroadcast)
                                                // Get sent notifications (admin only)
                                                .GET("/sent", notificationHandler::getSentNotifications)
                                                // Get user notifications with pagination
                                                .GET("", notificationHandler::getUserNotifications)
                                                // Get unread notification count
                                                .GET("/unread/count", notificationHandler::getUnreadCount)
                                                // Get students for notification dropdown (admin only)
                                                .GET(
                                                                "/students/dropdown",
                                                                notificationHandler::getStudentsForDropdown)
                                                // Get students for notification with search (admin only)
                                                .GET(
                                                                "/students",
                                                                notificationHandler::getStudentsForNotification)
                                                // Health check endpoint
                                                .GET("/health", notificationHandler::healthCheck)
                                                // Get specific notification by ID (must come after specific paths)
                                                .GET("/{id}", notificationHandler::getNotification)
                                                // Mark notification as read
                                                .PUT("/{id}/read", notificationHandler::markAsRead)
                                                .build())
                                .build();
        }

        /**
         * Workflow service router
         */
        private RouterFunction<ServerResponse> workflowRouter() {
                return route()
                                .path("/workflow", () -> route()
                                                // Workflow Definition Routes
                                                .path("/definitions", () -> route()
                                                                .GET("", workflowHandler::getAllWorkflowDefinitions)
                                                                .GET(
                                                                                "/{definitionKey}",
                                                                                workflowHandler::getWorkflowDefinitionByKey)
                                                                .GET(
                                                                                "/{definitionKey}/versions/{version}",
                                                                                workflowHandler::getWorkflowDefinitionByKeyAndVersion)
                                                                .GET(
                                                                                "/{definitionKey}/versions",
                                                                                workflowHandler::getAllVersionsOfDefinition)
                                                                /*
                                                                 * Disabled for static handoff
                                                                 * .POST("", workflowHandler::createWorkflowDefinition)
                                                                 * .PUT(
                                                                 * "/{definitionKey}",
                                                                 * workflowHandler::updateWorkflowDefinition)
                                                                 * .POST(
                                                                 * "/{definitionKey}/activate",
                                                                 * workflowHandler::activateWorkflowDefinition)
                                                                 * .POST(
                                                                 * "/{definitionKey}/deactivate",
                                                                 * workflowHandler::deactivateWorkflowDefinition)
                                                                 * .POST(
                                                                 * "/{definitionKey}/suspend",
                                                                 * workflowHandler::suspendWorkflowDefinition)
                                                                 * .POST(
                                                                 * "/{definitionKey}/resume",
                                                                 * workflowHandler::resumeWorkflowDefinition)
                                                                 * .DELETE(
                                                                 * "/{definitionKey}",
                                                                 * workflowHandler::deleteWorkflowDefinition)
                                                                 */
                                                                .GET(
                                                                                "/search",
                                                                                workflowHandler::searchWorkflowDefinitions)
                                                                .build())
                                                // Workflow Instances Routes
                                                .path("/instances", () -> route()
                                                                .GET(
                                                                                "/application/{applicationId}",
                                                                                workflowHandler::getWorkflowInstancesByApplication)
                                                                .GET(
                                                                                "/active",
                                                                                workflowHandler::getActiveWorkflowInstances)
                                                                .build())
                                                // Health Check
                                                .GET("/health", workflowHandler::healthCheck)
                                                .build())
                                .build();
        }

        /**
         * Client Workflow Management router
         */
        private RouterFunction<ServerResponse> clientWorkflowRouter() {
                return route()
                                .path("/admin/client-workflows", () -> route()
                                                // Upload new workflow definition
                                                .POST(
                                                                "/upload",
                                                                clientWorkflowHandler::uploadWorkflowDefinition)
                                                // List workflow definitions
                                                .GET("", clientWorkflowHandler::listWorkflowDefinitions)
                                                // Get specific workflow definition
                                                .GET("/{id}", clientWorkflowHandler::getWorkflowDefinition)
                                                // Deactivate workflow definition
                                                .DELETE(
                                                                "/{id}",
                                                                clientWorkflowHandler::deactivateWorkflowDefinition)
                                                .build())
                                .build();
        }

        /**
         * Health check handler
         */
        private reactor.core.publisher.Mono<ServerResponse> healthCheck(
                        org.springframework.web.reactive.function.server.ServerRequest request) {
                log.debug("Health check requested from: {}", request.remoteAddress());

                return ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                                java.util.Map.of(
                                                                "status",
                                                                "UP",
                                                                "service",
                                                                "uniflow-consolidated",
                                                                "version",
                                                                "1.0.0-SNAPSHOT",
                                                                "timestamp",
                                                                java.time.LocalDateTime.now(),
                                                                "components",
                                                                java.util.Map.of("database", "UP", "redis", "UP")));
        }

        /**
         * System info handler
         */
        private reactor.core.publisher.Mono<ServerResponse> systemInfo(
                        org.springframework.web.reactive.function.server.ServerRequest request) {
                return ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                                java.util.Map.of(
                                                                "name",
                                                                "UniFLow Consolidated Platform",
                                                                "version",
                                                                "1.0.0-SNAPSHOT",
                                                                "description",
                                                                "Consolidated University Application Management Platform",
                                                                "services",
                                                                java.util.List.of(
                                                                                "Authentication & Authorization",
                                                                                "Student Management",
                                                                                "Admin Management",
                                                                                "University Management",
                                                                                "Application Processing",
                                                                                "Notification System",
                                                                                "Workflow Orchestration",
                                                                                "Core Business Logic"),
                                                                "buildTime",
                                                                java.time.LocalDateTime.now(),
                                                                "javaVersion",
                                                                System.getProperty("java.version"),
                                                                "springBootVersion",
                                                                org.springframework.boot.SpringBootVersion
                                                                                .getVersion()));
        }

        /**
         * Generic Document service router - AD-02-03 Implementation
         * Independent document operations for all user types
         */
        private RouterFunction<ServerResponse> genericDocumentRouter() {
                return route()
                                .path("/documents", () -> route()
                                                // Generic upload endpoint for all users
                                                .POST("/upload", genericDocumentHandler::uploadDocument)
                                                // Get my documents (JWT-based)
                                                .GET("/my", genericDocumentHandler::getMyDocuments)
                                                // Generate view URL for specific document
                                                .GET(
                                                                "/{documentId}/view-url",
                                                                genericDocumentHandler::generateViewUrl)
                                                // Delete my document
                                                .DELETE(
                                                                "/{documentId}",
                                                                genericDocumentHandler::deleteDocument)
                                                // S3 health check
                                                .GET("/s3-health", genericDocumentHandler::checkS3Health)
                                                .build())
                                .build();
        }

        /**
         * AI service router - n8n integration for SOP, LOR, Cover Letter generation
         */
        private RouterFunction<ServerResponse> aiRouter() {
                return route()
                                .path("/ai", () -> route()
                                                .GET("/health", aiHandler::healthCheck)
                                                .POST("/sop/generate", aiHandler::generateSop)
                                                .POST("/lor/generate", aiHandler::generateLor)
                                                .POST(
                                                                "/cover-letter/generate",
                                                                aiHandler::generateCoverLetter)
                                                .build())
                                .build();
        }

        /**
         * Document Workflow service router - AD-02-03 Implementation
         * Workflow management for document processing
         */
        private RouterFunction<ServerResponse> documentWorkflowRouter() {
                return route()
                                .path("/documents/workflow", () -> route()
                                                // Student endpoints (JWT-based)
                                                .GET("/my", documentWorkflowHandler::getMyDocumentWorkflows)
                                                .GET(
                                                                "/upload/{uploadId}",
                                                                documentWorkflowHandler::getWorkflowByUploadId)
                                                .build())
                                .build();
        }

        /**
         * Payment service router – Razorpay integration
         */
        private RouterFunction<ServerResponse> paymentRouter() {
                return route()
                                .path("/payment", () -> route()
                                                // Create a Razorpay order (payment_type required)
                                                .POST("/create-order", paymentHandler::createOrder)
                                                // Verify payment signature after Razorpay checkout completes
                                                .POST("/verify", paymentHandler::verifyPayment)
                                                // Student: view own payment history (?type= optional filter)
                                                .GET("/history", paymentHandler::getPaymentHistory)
                                                // List all valid payment_type values
                                                .GET("/types", paymentHandler::getPaymentTypes)
                                                // Health check
                                                .GET("/health", paymentHandler::healthCheck)
                                                .build())
                                .build();
        }
}

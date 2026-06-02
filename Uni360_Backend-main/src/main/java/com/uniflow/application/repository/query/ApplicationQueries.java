package com.uniflow.application.repository.query;

/**
 * SQL query constants for Application repository operations
 */
public class ApplicationQueries {

    /**
     * Find applications accessible by specific user based on ownership and
     * assignments
     */
    public static final String FIND_APPLICATIONS_BY_USER = """
            SELECT DISTINCT a.id FROM applications a
            LEFT JOIN student_profiles sp ON a.student_id = sp.id
            LEFT JOIN admin_profile ap ON a.admin_id = ap.id
            WHERE
            (
                sp.user_id = :userId
                OR ap.user_id = :userId
                OR (
                    :userType IN ('ADMIN', 'SUPER_ADMIN')
                    AND (
                        :userType = 'SUPER_ADMIN'
                        OR EXISTS (SELECT 1 FROM admin_profile WHERE user_id = :userId)
                    )
                )
            )
            """;

    /**
     * Find admin applications with filters.
     * Fixes:
     * - `deleted` → `is_active` (no `deleted` column on applications)
     * - `a.intake` → pulled from JSONB data->'academic'->>'intake_term'
     * - `u.country_code` → from JSONB u.data->>'country_code'
     * - `c.degree_level` → from JSONB c.data->>'degree_level'
     */
    public static final String FIND_ADMIN_APPLICATIONS = """
            SELECT
                a.id::text as id,
                a.reference_number,
                a.status,
                a.workflow_stage,
                a.priority,
                a.submitted_at,
                a.deadline,
                a.is_urgent,
                CASE a.workflow_stage
                    WHEN 'APPLICATION_REVIEW'    THEN 15
                    WHEN 'ACADEMIC_EVALUATION'   THEN 35
                    WHEN 'CERTIFICATION_PROCESS' THEN 55
                    WHEN 'UNIVERSITY_SUBMISSION' THEN 75
                    WHEN 'PRE_DEPARTURE'         THEN 90
                    WHEN 'COMPLETED'             THEN 100
                    WHEN 'REJECTED'              THEN 0
                    WHEN 'WITHDRAWN'             THEN 0
                    ELSE 5
                END as completion_percentage,
                u.name as university_name,
                COALESCE(
                    u.data->>'country_code',
                    a.data->'academic'->>'country_code',
                    ''
                ) as country_code,
                COALESCE(c.name, a.data->'academic'->>'program_name', '') as program_name,
                COALESCE(c.data->>'degree_level', a.data->'academic'->>'degree_level', '') as degree_level,
                COALESCE(a.data->'academic'->>'intake_term', 'WINTER') as intake,
                a.student_id,
                a.assigned_admin_id,
                TRIM(COALESCE(su.first_name, '') || ' ' || COALESCE(su.last_name, '')) as student_name,
                COALESCE(su.email, '') as student_email,
                TRIM(COALESCE(au.first_name, '') || ' ' || COALESCE(au.last_name, '')) as admin_name,
                COALESCE(au.email, '') as admin_email,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.application_id = a.id::text AND t.deleted = false AND t.active = true) as pending_task_count,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.application_id = a.id::text AND t.deleted = false AND t.task_status = 'COMPLETED') as completed_task_count,
                (SELECT COUNT(*) FROM tasks t
                 WHERE t.application_id = a.id::text AND t.deleted = false
                 AND (t.active = true OR t.task_status = 'COMPLETED')) as total_task_count
            FROM applications a
            LEFT JOIN universities u ON a.university_id = u.id
            LEFT JOIN courses c ON a.course_id = c.id
            LEFT JOIN users su ON su.id = a.student_id
            LEFT JOIN users au ON au.id = a.assigned_admin_id
            WHERE a.is_active = true
            AND a.assigned_admin_id = :assignedAdminId
            AND (:statusWildcard IS TRUE OR a.status = :status)
            AND (:workflowStageWildcard IS TRUE OR a.workflow_stage = :workflowStage)
            AND (:countryCodeWildcard IS TRUE OR COALESCE(u.data->>'country_code', a.data->'academic'->>'country_code', '') = :countryCode)
            AND (:degreeLevelWildcard IS TRUE OR COALESCE(c.data->>'degree_level', a.data->'academic'->>'degree_level', '') = :degreeLevel)
            AND (:isUrgentWildcard IS TRUE OR a.is_urgent = :isUrgent)
            ORDER BY
                CASE WHEN :sortBy = 'submittedAt' THEN a.submitted_at END DESC,
                CASE WHEN :sortBy = 'deadline'    THEN a.deadline END ASC,
                a.created_at DESC
            LIMIT :size OFFSET :offset
            """;

    /** Count admin applications (mirrors FIND_ADMIN_APPLICATIONS filters) */
    public static final String COUNT_ADMIN_APPLICATIONS = """
            SELECT COUNT(DISTINCT a.id)
            FROM applications a
            LEFT JOIN universities u ON a.university_id = u.id
            LEFT JOIN courses c ON a.course_id = c.id
            WHERE a.is_active = true
            AND a.assigned_admin_id = :assignedAdminId
            AND (:statusWildcard IS TRUE OR a.status = :status)
            AND (:workflowStageWildcard IS TRUE OR a.workflow_stage = :workflowStage)
            AND (:countryCodeWildcard IS TRUE OR u.data->>'country_code' = :countryCode)
            AND (:degreeLevelWildcard IS TRUE OR COALESCE(c.data->>'degree_level', a.data->'academic'->>'degree_level', '') = :degreeLevel)
            AND (:isUrgentWildcard IS TRUE OR a.is_urgent = :isUrgent)
            """;

    /**
     * Returns 3 fixed counts for the summary bar:
     *   - CLAIM_PENDING
     *   - UNDER_REVIEW  (everything active except claim-pending and completed)
     *   - COMPLETED
     * Uses the same base filters as COUNT_ADMIN_APPLICATIONS.
     */
    public static final String STAGE_SUMMARY_ADMIN_APPLICATIONS = """
            SELECT
                SUM(CASE WHEN a.workflow_stage = 'CLAIM_PENDING' THEN 1 ELSE 0 END) AS claim_pending,
                SUM(CASE WHEN a.workflow_stage NOT IN ('CLAIM_PENDING','COMPLETED','REJECTED','WITHDRAWN') THEN 1 ELSE 0 END) AS under_review,
                SUM(CASE WHEN a.workflow_stage = 'COMPLETED'     THEN 1 ELSE 0 END) AS completed
            FROM applications a
            LEFT JOIN universities u ON a.university_id = u.id
            LEFT JOIN courses c ON a.course_id = c.id
            WHERE a.is_active = true
            AND a.assigned_admin_id = :assignedAdminId
            AND (:statusWildcard IS TRUE OR a.status = :status)
            AND (:workflowStageWildcard IS TRUE OR a.workflow_stage = :workflowStage)
            AND (:countryCodeWildcard IS TRUE OR u.data->>'country_code' = :countryCode)
            AND (:degreeLevelWildcard IS TRUE OR COALESCE(c.data->>'degree_level', a.data->'academic'->>'degree_level', '') = :degreeLevel)
            AND (:isUrgentWildcard IS TRUE OR a.is_urgent = :isUrgent)
            """;
}

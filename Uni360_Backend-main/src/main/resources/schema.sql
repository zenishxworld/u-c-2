-- UniFlow Platform - Database Schema
-- Comprehensive schema based on all entities and DTOs analysis
-- Compatible with PostgreSQL and supports all microservices
-- =======================
-- WORKFLOW DEFINITIONS TABLE (CLIENT-BASED CONFIGURATION SYSTEM)
-- =======================
-- Updated for Client Workflow Configuration System (Phase 1-4)
-- Simplified schema focused on client-based workflow selection
-- =======================
CREATE TABLE IF NOT EXISTS workflow_definitions (
                                                    id SERIAL PRIMARY KEY,

    -- Core Definition Fields
                                                    definition_key VARCHAR(255) NOT NULL,
                                                    definition_name VARCHAR(255) NOT NULL,
                                                    definition_description TEXT,
                                                    version INTEGER NOT NULL DEFAULT 1,

    -- Client-Based Workflow Configuration Fields (NEW)
                                                    client_id VARCHAR(50) NOT NULL,
                                                    country_code VARCHAR(10) NOT NULL,
                                                    degree_level VARCHAR(50) NOT NULL,

    -- Complete Workflow Configuration as JSONB (NEW)
                                                    workflow_config JSONB NOT NULL,

    -- Deployment and Version Management
                                                    deployment_id VARCHAR(255) UNIQUE,

    -- Status and Control Fields
                                                    is_active BOOLEAN DEFAULT FALSE,
                                                    is_suspended BOOLEAN DEFAULT FALSE,
                                                    deleted BOOLEAN DEFAULT FALSE,

    -- Audit Fields
                                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    created_by VARCHAR(255),
                                                    updated_by VARCHAR(255),

    -- Legacy Compatibility Fields (for backward compatibility)
                                                    category VARCHAR(100),
                                                    tenant_id VARCHAR(50),

    -- Constraints
                                                    UNIQUE(client_id, country_code, degree_level, version)
);

-- =======================
-- WORKFLOW INSTANCES TABLE (Enhanced for Phase 19 Workflow Engine)
-- =======================
CREATE TABLE IF NOT EXISTS workflow_instances (
                                                  id SERIAL PRIMARY KEY,
                                                  instance_id VARCHAR(255) UNIQUE NOT NULL,
                                                  workflow_definition_key VARCHAR(255) NOT NULL,
                                                  workflow_definition_version INTEGER,
                                                  application_id VARCHAR(255) NOT NULL,
                                                  business_key VARCHAR(255),
                                                  instance_status VARCHAR(50) NOT NULL,
                                                  start_activity_id VARCHAR(100),
                                                  current_activity_id VARCHAR(100),
                                                  end_activity_id VARCHAR(100),
                                                  started_by VARCHAR(255),
                                                  tenant_id VARCHAR(50),
                                                  super_instance_id VARCHAR(255),
                                                  parent_instance_id VARCHAR(255),
                                                  variables JSONB,
                                                  local_variables JSONB,
                                                  is_suspended BOOLEAN DEFAULT FALSE,
                                                  suspension_reason TEXT,
                                                  delete_reason TEXT,
                                                  completion_percentage INTEGER DEFAULT 0,

    -- UniFLow specific fields
                                                  territory_identifier VARCHAR(50),
                                                  client_type VARCHAR(50),
                                                  priority INTEGER DEFAULT 3,
                                                  fast_tracked BOOLEAN DEFAULT FALSE,
                                                  escalated BOOLEAN DEFAULT FALSE,
                                                  escalation_level INTEGER DEFAULT 0,
                                                  last_escalation_date TIMESTAMP,
                                                  sla_due_date TIMESTAMP,
                                                  sla_breached BOOLEAN DEFAULT FALSE,
                                                  milestone_data JSONB,
                                                  performance_metrics JSONB,
                                                  tags TEXT,
                                                  notes TEXT,

    -- Additional workflow-specific fields
                                                  workflow_instance_id VARCHAR(255),
                                                  current_stage VARCHAR(100),
                                                  definition_key VARCHAR(255),
                                                  status VARCHAR(50),

                                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  completed_at TIMESTAMP,
                                                  suspended_at TIMESTAMP,
                                                  terminated_at TIMESTAMP,
                                                  deleted BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS support_tickets (
                                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                               ticket_number VARCHAR(50) UNIQUE NOT NULL,
                                               student_id BIGINT NOT NULL,
                                               application_id UUID,
                                               assigned_admin_id BIGINT,
                                               ticket_type VARCHAR(50) NOT NULL,
                                               priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                                               status VARCHAR(20) NOT NULL DEFAULT 'open',
                                               subject VARCHAR(255) NOT NULL,
                                               description TEXT NOT NULL,
                                               resolution TEXT,
                                               escalated BOOLEAN DEFAULT false,
                                               escalated_to BIGINT,
                                               escalated_at TIMESTAMP,
                                               resolved_at TIMESTAMP,
                                               resolved_by BIGINT,
                                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                               updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Messages Table
CREATE TABLE IF NOT EXISTS ticket_messages (
                                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                               ticket_id UUID NOT NULL REFERENCES support_tickets(id),
                                               sender_id BIGINT NOT NULL,
                                               sender_type VARCHAR(20) NOT NULL, -- 'student', 'admin'
                                               message TEXT NOT NULL,
                                               attachments JSONB,
                                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- =======================
-- USERS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone_number VARCHAR(20),
    user_type VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE,
    oauth_provider_code VARCHAR(50) DEFAULT 'LOCAL'
);

-- =======================
-- ADMIN PROFILES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS admin_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    employee_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'COUNSELOR',
    specialization VARCHAR(100) DEFAULT 'GENERAL',
    department VARCHAR(100),
    phone VARCHAR(20),
    extension VARCHAR(10),
    bio TEXT,
    profile_photo_url TEXT,
    work_hours_start TIME DEFAULT '09:00:00',
    work_hours_end TIME DEFAULT '17:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    max_daily_capacity INTEGER DEFAULT 10,
    current_workload INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Enhanced Permission System (SuperAdmin)
    permissions TEXT DEFAULT '',
    permission_last_updated TIMESTAMP,
    permission_last_updated_by VARCHAR(255),

    -- Enhanced Capacity Management (SuperAdmin)
    max_concurrent_applications INTEGER DEFAULT 5,
    specialization_countries TEXT,
    language_proficiencies TEXT,

    -- Legacy Permission Fields (backward compatibility)
    can_verify_documents BOOLEAN DEFAULT FALSE,
    can_approve_applications BOOLEAN DEFAULT FALSE,
    can_process_payments BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,

    -- Enhanced Performance Metrics (SuperAdmin)
    total_applications_processed INTEGER DEFAULT 0,
    total_documents_verified INTEGER DEFAULT 0,
    average_processing_time DECIMAL DEFAULT 0.0,
    average_processing_time_hours DECIMAL(10,2) DEFAULT 0.0,
    quality_score DECIMAL(5,2) DEFAULT 0.0,
    last_activity_at TIMESTAMP,

    -- Metadata
    client_id VARCHAR(50) DEFAULT 'uniflow',
    hire_date DATE,
    last_login TIMESTAMP,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- =======================
-- ADMIN PERMISSION AUDIT TABLE (SuperAdmin System)
-- =======================
CREATE TABLE IF NOT EXISTS admin_permission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    admin_username VARCHAR(255) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    permission_name VARCHAR(255),
    action VARCHAR(20) NOT NULL CHECK (action IN ('GRANTED', 'REVOKED', 'MODIFIED')),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL,
    change_reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- STUDENT PROFILES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    profile_data JSONB,
    profile_status VARCHAR(20) DEFAULT 'DRAFT',
    completion_percentage INTEGER DEFAULT 0,
    profile_steps_completed JSONB,
    current_step VARCHAR(100),
    cv_resume_url TEXT,
    profile_photo_url TEXT,
    leaving_certificate_url TEXT,
    twelfth_marksheet_url TEXT,
    tenth_marksheet_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by BIGINT,
    workflow_stage VARCHAR(100),
    journey_progress JSONB,
    profile_score DECIMAL,
    matching_criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- =======================
-- PROFILE BUILDER CONFIGURATIONS TABLE
-- =======================
-- Stores dynamic profile builder step configurations per client
-- Allows runtime modification of profile builder steps, fields, and validation rules
CREATE TABLE IF NOT EXISTS profile_builder_configs (
    id SERIAL PRIMARY KEY,

    -- Client identification
    client_id VARCHAR(50) NOT NULL,

    -- Configuration metadata
    config_name VARCHAR(255) NOT NULL,
    config_description TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',

    -- Complete profile builder configuration as JSONB
    -- Contains: steps[], step_order[], field_definitions, validation_rules
    config_data JSONB NOT NULL,

    -- Status and control
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,

    -- Soft delete
    deleted BOOLEAN DEFAULT FALSE,

    -- Constraints
    UNIQUE(client_id, version)
);

-- Create index for quick lookup of active configurations
CREATE INDEX IF NOT EXISTS idx_profile_builder_configs_client_active
    ON profile_builder_configs(client_id, is_active)
    WHERE deleted = FALSE;

-- Create index for default configuration lookup
CREATE INDEX IF NOT EXISTS idx_profile_builder_configs_default
    ON profile_builder_configs(client_id, is_default)
    WHERE deleted = FALSE AND is_active = TRUE;

-- =======================
-- UNIVERSITIES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    code VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- =======================
-- COURSES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL,
    name VARCHAR(500) NOT NULL,
    course_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (university_id) REFERENCES universities(id),
    UNIQUE (course_code, university_id)
);

-- =======================
-- APPLICATIONS TABLE (SIMPLIFIED - Phase 18)
-- =======================
-- **IMPORTANT: We use manual schema updates in schema.sql, NOT Flyway migrations**
-- **All database changes must be made directly in this file**
-- **This follows the User/University pattern with JSONB data storage**
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL,
    university_id UUID NOT NULL,
    course_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    workflow_stage VARCHAR(50) DEFAULT 'INITIAL',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    submitted_at TIMESTAMP,
    deadline TIMESTAMP,
    assigned_admin_id BIGINT,
    completion_percentage INTEGER DEFAULT 0,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    -- Foreign key constraints
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES universities(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)

    -- Unique constraint removed to allow multiple applications per course
    -- Students can now create multiple applications for the same course with different intakes
);

-- Performance indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_university_id ON applications(university_id);
CREATE INDEX IF NOT EXISTS idx_applications_course_id ON applications(course_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_workflow_stage ON applications(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_admin ON applications(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_applications_is_urgent ON applications(is_urgent);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_applications_deadline ON applications(deadline);

-- JSONB indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_data_gin ON applications USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_applications_data_program_name ON applications ((data->'academic'->>'program_name'));
CREATE INDEX IF NOT EXISTS idx_applications_data_degree_level ON applications ((data->'academic'->>'degree_level'));
CREATE INDEX IF NOT EXISTS idx_applications_data_payment_completed ON applications ((data->'payment'->>'payment_completed'));
CREATE INDEX IF NOT EXISTS idx_applications_data_documents_verified ON applications ((data->'documents'->>'documents_verified'));

-- JSONB data structure comment
COMMENT ON COLUMN applications.data IS 'JSONB field containing: academic (program, degree, intake), alternates, workflow, documents, payment, university, tracking, metadata';


-- =======================
-- DOCUMENTS UPLOAD TABLE (Two-Table Architecture - Generic Upload Tracking)
-- =======================
CREATE TABLE IF NOT EXISTS documents_upload (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by BIGINT NOT NULL,           -- User ID from JWT token
    user_type VARCHAR(20) NOT NULL,        -- STUDENT, ADMIN, SUPER_ADMIN
    original_filename VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,                -- S3 URL
    file_size BIGINT,                      -- File size in bytes
    file_type VARCHAR(10),                 -- PDF, JPG, PNG, etc.
    upload_purpose VARCHAR(50),            -- PROFILE, APPLICATION, GENERAL, RECEIPT, etc.
    description TEXT,                      -- Optional description
    is_active BOOLEAN DEFAULT true,        -- Soft delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Documents upload indexes
CREATE INDEX IF NOT EXISTS idx_documents_upload_uploaded_by ON documents_upload(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_upload_user_type ON documents_upload(user_type);
CREATE INDEX IF NOT EXISTS idx_documents_upload_upload_purpose ON documents_upload(upload_purpose);
CREATE INDEX IF NOT EXISTS idx_documents_upload_file_type ON documents_upload(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_upload_is_active ON documents_upload(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_upload_created_at ON documents_upload(created_at);

-- =======================
-- DOCUMENT WORKFLOW TABLE (Two-Table Architecture - Journey-Specific Workflow)
-- =======================
CREATE TABLE IF NOT EXISTS document_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES documents_upload(id),
    workflow_instance_id VARCHAR(255) NOT NULL REFERENCES workflow_instances(instance_id),  -- FK to main workflow instance
    student_id BIGINT NOT NULL,
    application_id UUID,
    document_type VARCHAR(50) NOT NULL,    -- PASSPORT, TRANSCRIPTS, etc.
    document_category VARCHAR(50) NOT NULL, -- IDENTITY, ACADEMIC, etc.
    document_name VARCHAR(500),
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    review_status VARCHAR(20) DEFAULT 'AWAITING_REVIEW',
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    rejection_reason TEXT,
    workflow_stage VARCHAR(50),
    task_id VARCHAR(100),
    is_required BOOLEAN DEFAULT false,
    required_for_stage VARCHAR(50),
    submission_deadline TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (upload_id) REFERENCES documents_upload(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Document workflow indexes
CREATE INDEX IF NOT EXISTS idx_document_workflow_upload_id ON document_workflow(upload_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_workflow_instance_id ON document_workflow(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_student_id ON document_workflow(student_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_application_id ON document_workflow(application_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_document_type ON document_workflow(document_type);
CREATE INDEX IF NOT EXISTS idx_document_workflow_document_category ON document_workflow(document_category);
CREATE INDEX IF NOT EXISTS idx_document_workflow_verification_status ON document_workflow(verification_status);
CREATE INDEX IF NOT EXISTS idx_document_workflow_review_status ON document_workflow(review_status);
CREATE INDEX IF NOT EXISTS idx_document_workflow_reviewed_by ON document_workflow(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_document_workflow_workflow_stage ON document_workflow(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_document_workflow_task_id ON document_workflow(task_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_is_required ON document_workflow(is_required);
CREATE INDEX IF NOT EXISTS idx_document_workflow_is_current_version ON document_workflow(is_current_version);
CREATE INDEX IF NOT EXISTS idx_document_workflow_created_at ON document_workflow(created_at);
CREATE INDEX IF NOT EXISTS idx_document_workflow_submission_deadline ON document_workflow(submission_deadline);

-- =======================
-- COURSE FAVORITES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS course_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id BIGINT NOT NULL,
    course_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),

    -- Unique constraint to prevent duplicate favorites
    CONSTRAINT unique_student_course_favorite
        UNIQUE(student_id, course_id, is_active)
);

-- Performance indexes for course_favorites table
CREATE INDEX IF NOT EXISTS idx_course_favorites_student_id ON course_favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_course_favorites_course_id ON course_favorites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_favorites_is_active ON course_favorites(is_active);

-- =======================
-- APPLICATION NOTES TABLE
-- =======================


-- =======================
-- NOTIFICATIONS TABLE (MINIMAL SCHEMA)
-- =======================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    sender_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'PLAIN',
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);


-- =======================
-- TASKS TABLE (Enhanced for Phase 19 Workflow Engine)
-- =======================
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL,
    task_id VARCHAR(255) NOT NULL,
    application_id VARCHAR(255) NOT NULL,
    workflow_instance_id VARCHAR(255),
    task_type VARCHAR(100),
    task_status VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 3,
    due_date BIGINT,
    owner_id BIGINT,
    stage VARCHAR(100),
    validation_rule VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    claimed_by BIGINT,
    claimed_at BIGINT,
    completed_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id)
);

-- =======================
-- WORKFLOW SYSTEM INDEXES
-- =======================

-- Workflow Definitions indexes (Updated for Client-Based Schema)
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_definition_key ON workflow_definitions (definition_key);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON workflow_definitions (is_active, deleted);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_client_lookup ON workflow_definitions (client_id, country_code, degree_level);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_client_active ON workflow_definitions (client_id, is_active, deleted);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_deployment ON workflow_definitions (deployment_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_version ON workflow_definitions (client_id, country_code, degree_level, version);

-- Workflow Instances indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_instance_id ON workflow_instances (instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_application_id ON workflow_instances (application_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances (instance_status, deleted);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_definition_key ON workflow_instances (workflow_definition_key);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_territory ON workflow_instances (territory_identifier);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_priority ON workflow_instances (priority);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_sla_due ON workflow_instances (sla_due_date);

-- Tasks indexes (simplified schema)
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_application_id ON tasks (application_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_instance_id ON tasks (workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (task_status, deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks (owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks (claimed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks (task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks (stage);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks (active, deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_validation_rule ON tasks (validation_rule);

-- Admin Profiles indexes (SuperAdmin System)
CREATE INDEX IF NOT EXISTS idx_admin_profile_permissions ON admin_profile USING GIN (to_tsvector('english', permissions));
CREATE INDEX IF NOT EXISTS idx_admin_profile_specialization_countries ON admin_profile (specialization_countries);
CREATE INDEX IF NOT EXISTS idx_admin_profile_language_proficiencies ON admin_profile (language_proficiencies);
CREATE INDEX IF NOT EXISTS idx_admin_profile_is_active ON admin_profile (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_profile_role ON admin_profile (role);
CREATE INDEX IF NOT EXISTS idx_admin_profile_specialization ON admin_profile (specialization);
CREATE INDEX IF NOT EXISTS idx_admin_profile_last_activity_at ON admin_profile (last_activity_at);
CREATE INDEX IF NOT EXISTS idx_admin_profile_permission_last_updated ON admin_profile (permission_last_updated);
CREATE INDEX IF NOT EXISTS idx_admin_profile_user_id ON admin_profile (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profile_username ON admin_profile (username);
CREATE INDEX IF NOT EXISTS idx_admin_profile_client_id ON admin_profile (client_id);

-- Admin Permission Audit indexes (SuperAdmin System)
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_admin_id ON admin_permission_audit (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_permission_key ON admin_permission_audit (permission_key);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_action ON admin_permission_audit (action);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_changed_by ON admin_permission_audit (changed_by);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_created_at ON admin_permission_audit (created_at);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_admin_username ON admin_permission_audit (admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_admin_date ON admin_permission_audit (admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_permission_audit_permission_date ON admin_permission_audit (permission_key, created_at);

-- Notifications indexes (updated for minimal schema)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =======================
-- SCHEMA MIGRATIONS (for existing production databases)
-- =======================
-- Use ALTER TABLE ... ADD COLUMN IF NOT EXISTS to safely add new columns
-- to databases where the table already exists from a prior CREATE TABLE run.

-- Student Profiles: document URL columns (added 2026-04)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS leaving_certificate_url TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS twelfth_marksheet_url TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS tenth_marksheet_url TEXT;

-- =======================
-- SCHEMA UPDATE NOTES
-- =======================
-- Updated workflow_definitions table for Client Workflow Configuration System:
-- 1. Added client_id, country_code, degree_level for client-based selection
-- 2. Added workflow_config JSONB field for complete workflow configuration
-- 3. Simplified schema by removing unused complex fields
-- 4. Added proper constraints for client/country/degree/version uniqueness
-- 5. Updated indexes for optimal client-based lookup performance
--
-- Student Profiles document URL columns added:
-- leaving_certificate_url, twelfth_marksheet_url, tenth_marksheet_url
--
-- Compatible with Phase 1-4 implementation of CLIENT_WORKFLOW_CONFIGURATION_REDESIGN_PLAN
-- =======================

-- =======================
-- FOREIGN KEY CONSTRAINTS
-- =======================

-- Add foreign key constraints where applicable
-- Note: Some FKs may be commented out if they reference external systems

-- ALTER TAALTER TABLE admin_profile ADD CONSTRAINT fk_admin_profile_user_id
--     FOREIGN KEY (user_id) REFERENCES users(username);

-- SuperAdmin System Foreign Key Constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_admin_permission_audit_admin_id'
        AND table_name = 'admin_permission_audit'
    ) THEN
        ALTER TABLE admin_permission_audit ADD CONSTRAINT fk_admin_permission_audit_admin_id
            FOREIGN KEY (admin_id) REFERENCES admin_profile(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_admin_permission_audit_changed_by'
        AND table_name = 'admin_permission_audit'
    ) THEN
        ALTER TABLE admin_permission_audit ADD CONSTRAINT fk_admin_permission_audit_changed_by
            FOREIGN KEY (changed_by) REFERENCES admin_profile(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ALTER TABLE student_profiles ADD CONSTRAINT fk_student_profiles_user_id
--     FOREIGN KEY (user_id) REFERENCES users(id);

-- =======================
-- DATABASE FUNCTIONS
-- =======================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_profile_updated_at ON admin_profile;
CREATE TRIGGER update_admin_profile_updated_at BEFORE UPDATE ON admin_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_universities_updated_at ON universities;
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_application_notes_updated_at ON admin_application_notes;
CREATE TRIGGER update_admin_application_notes_updated_at BEFORE UPDATE ON admin_application_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_definitions_updated_at ON workflow_definitions;
CREATE TRIGGER update_workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_instances_updated_at ON workflow_instances;
CREATE TRIGGER update_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS update_documents_upload_updated_at ON documents_upload;
CREATE TRIGGER update_documents_upload_updated_at BEFORE UPDATE ON documents_upload
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_workflow_updated_at ON document_workflow;
CREATE TRIGGER update_document_workflow_updated_at BEFORE UPDATE ON document_workflow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- ENHANCED NOTIFICATION & CHAT SYSTEM TABLES
-- =======================

-- Chat Conversations Table (1-to-1 and 1-to-many support)
CREATE TABLE IF NOT EXISTS notification_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(100) UNIQUE NOT NULL, -- "conv_17_25" or "broadcast_admin_17_2024_01"

    -- Conversation type
    conversation_type VARCHAR(30) DEFAULT 'DIRECT', -- DIRECT, BROADCAST

    -- Creator (for broadcasts, this is the admin)
    creator_id BIGINT NOT NULL,

    -- For direct messages only
    user_1_id BIGINT NULL,
    user_2_id BIGINT NULL,

    -- Status and metadata
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    title VARCHAR(255) NULL, -- For broadcast conversations

    -- Related entities (optional)
    related_application_id UUID NULL,
    related_task_id VARCHAR(50) NULL,

    -- Message counts
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (user_1_id) REFERENCES users(id),
    FOREIGN KEY (user_2_id) REFERENCES users(id),

    -- Ensure either direct (user_1_id, user_2_id) or broadcast setup
    CHECK (
        (conversation_type = 'DIRECT' AND user_1_id IS NOT NULL AND user_2_id IS NOT NULL) OR
        (conversation_type = 'BROADCAST' AND user_1_id IS NULL AND user_2_id IS NULL)
    )
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS notification_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Conversation reference
    conversation_id VARCHAR(100) NOT NULL,

    -- Sender information
    sender_id BIGINT NOT NULL,

    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT', -- TEXT, SYSTEM, BROADCAST

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (conversation_id) REFERENCES notification_conversations(conversation_id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Broadcast Participants Table (for many-to-many broadcast conversations)
CREATE TABLE IF NOT EXISTS notification_broadcast_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,

    -- Participation metadata
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id UUID NULL,
    unread_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Constraints
    FOREIGN KEY (conversation_id) REFERENCES notification_conversations(conversation_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (last_read_message_id) REFERENCES notification_messages(id),
    UNIQUE(conversation_id, user_id)
);

-- System Notifications/Alerts Table
CREATE TABLE IF NOT EXISTS notification_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient information
    user_id BIGINT NOT NULL,

    -- Sender information (optional)
    sender_id BIGINT NULL,

    -- Notification content
    type VARCHAR(50) NOT NULL, -- TASK_COMPLETED, TASK_ASSIGNED, CHAT_MESSAGE, WORKFLOW_UPDATE, BROADCAST_MESSAGE
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'UNREAD', -- UNREAD, READ

    -- Related entities
    related_application_id UUID NULL,
    related_task_id VARCHAR(50) NULL,
    related_conversation_id VARCHAR(100) NULL,

    -- Action information
    action_url VARCHAR(500) NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (related_conversation_id) REFERENCES notification_conversations(conversation_id)
);

-- User Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,

    -- Simple preferences
    chat_notifications_enabled BOOLEAN DEFAULT TRUE,
    task_notifications_enabled BOOLEAN DEFAULT TRUE,
    broadcast_notifications_enabled BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
);

-- =======================
-- NOTIFICATION SYSTEM INDEXES
-- =======================

-- Conversation indexes
CREATE INDEX idx_notification_conversations_creator ON notification_conversations(creator_id, created_at DESC);
CREATE INDEX idx_notification_conversations_users ON notification_conversations(user_1_id, user_2_id);
CREATE INDEX idx_notification_conversations_type ON notification_conversations(conversation_type, status);
CREATE INDEX idx_notification_conversations_updated ON notification_conversations(last_message_at DESC);

-- Message indexes
CREATE INDEX idx_notification_messages_conversation ON notification_messages(conversation_id, created_at DESC);
CREATE INDEX idx_notification_messages_sender ON notification_messages(sender_id, created_at DESC);

-- Broadcast participant indexes
CREATE INDEX idx_notification_broadcast_user ON notification_broadcast_participants(user_id, is_active);
CREATE INDEX idx_notification_broadcast_conversation ON notification_broadcast_participants(conversation_id, is_active);
CREATE INDEX idx_notification_broadcast_unread ON notification_broadcast_participants(user_id, unread_count) WHERE unread_count > 0;

-- Alert indexes
CREATE INDEX idx_notification_alerts_user ON notification_alerts(user_id, status, created_at DESC);
CREATE INDEX idx_notification_alerts_unread ON notification_alerts(user_id) WHERE status = 'UNREAD';
CREATE INDEX idx_notification_alerts_type ON notification_alerts(type, created_at DESC);

-- Settings indexes
CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);

-- =======================
-- NOTIFICATION SYSTEM TRIGGERS
-- =======================

-- Auto-update triggers for notification tables
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- VISA MODULE TABLES
-- =======================

-- Visa Checklists (country-level, set by admin for UK/Germany)
CREATE TABLE IF NOT EXISTS visa_checklists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country     VARCHAR(10)  NOT NULL,
    title       VARCHAR(255),
    items       JSONB,
    admin_id    BIGINT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_visa_checklist_country UNIQUE (country)
);

-- Visa Trackers (per-student progress)
CREATE TABLE IF NOT EXISTS visa_trackers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       BIGINT       NOT NULL,
    country          VARCHAR(10)  NOT NULL,
    status           VARCHAR(30)  NOT NULL DEFAULT 'NOT_STARTED',
    completed_items  JSONB,
    notes            TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_visa_trackers_student_id ON visa_trackers(student_id);

-- Embassy Appointments (admin assigns to student)
CREATE TABLE IF NOT EXISTS embassy_appointments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         BIGINT       NOT NULL,
    country            VARCHAR(10)  NOT NULL,
    appointment_date   DATE,
    appointment_time   TIME,
    location           VARCHAR(255),
    status             VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    notes              TEXT,
    created_by_admin   BIGINT,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_embassy_appts_student_id ON embassy_appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_embassy_appts_status     ON embassy_appointments(status);

-- =======================
-- MEETING URL TABLE
-- =======================

-- Meeting URLs (admin sets Google Meet URL per section: VISA|FINANCE)
CREATE TABLE IF NOT EXISTS meeting_urls (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section            VARCHAR(20)  NOT NULL,
    url                TEXT         NOT NULL,
    label              VARCHAR(255),
    is_active          BOOLEAN      NOT NULL DEFAULT true,
    created_by_admin   BIGINT,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_meeting_urls_section ON meeting_urls(section);

-- =======================
-- ADMIN QUERY TABLE
-- =======================

-- Admin Queries (admin → super-admin communication)
CREATE TABLE IF NOT EXISTS admin_queries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    BIGINT       NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    message     TEXT         NOT NULL,
    reply       TEXT,
    replied_by  BIGINT,
    replied_at  TIMESTAMP,
    status      VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_queries_admin_id ON admin_queries(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_queries_status   ON admin_queries(status);

-- =======================
-- PAYMENTS TABLE (Razorpay)
-- =======================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_purpose VARCHAR(255),  -- e.g. APPLICATION_FEE, APPOINTMENT_FEE, SOP_FEE, etc.
    reference_id VARCHAR(255),     -- optional: application UUID, appointment UUID, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_purpose ON payments(payment_purpose);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =======================
-- UNIVERSITY COMMISSIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS university_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL UNIQUE REFERENCES universities(id),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- =======================
-- CONTACT SUBMISSIONS TABLE (Contact Us Form)
-- =======================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    phone      VARCHAR(30),
    country    VARCHAR(100),
    subject    VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'NEW',  -- NEW, READ, REPLIED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email      ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status     ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- =======================
-- QUIZ SESSIONS TABLE (University Finder Quiz)
-- =======================
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           BIGINT NOT NULL,
    score                INTEGER DEFAULT 0,
    matched_universities JSONB DEFAULT '[]',
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student_id ON quiz_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);

-- =======================
-- QUIZ ANSWERS TABLE (Per-answer storage per quiz session)
-- =======================
CREATE TABLE IF NOT EXISTS quiz_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    answer      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);


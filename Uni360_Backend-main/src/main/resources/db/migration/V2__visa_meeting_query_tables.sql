-- ============================================================
-- Migration: New Features (Visa, Meeting URLs, Admin Queries)
-- Run this ONCE on the new AWS PostgreSQL database.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

-- 1. Visa Checklists (country-level, set by admin)
CREATE TABLE IF NOT EXISTS visa_checklists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country     VARCHAR(10)  NOT NULL,           -- UK | GERMANY
    title       VARCHAR(255),
    items       JSONB,                            -- ["Passport", "CAS Letter", ...]
    admin_id    BIGINT,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_visa_checklist_country UNIQUE (country)
);

-- 2. Visa Trackers (per-student progress)
CREATE TABLE IF NOT EXISTS visa_trackers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       BIGINT       NOT NULL,
    country          VARCHAR(10)  NOT NULL,       -- UK | GERMANY
    status           VARCHAR(30)  NOT NULL DEFAULT 'NOT_STARTED',
                                                  -- NOT_STARTED | IN_PROGRESS | SUBMITTED | APPROVED | REJECTED
    completed_items  JSONB,                       -- [0, 2, 3] (0-based checklist indices)
    notes            TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visa_trackers_student_id ON visa_trackers(student_id);

-- 3. Embassy Appointments (admin assigns to student)
CREATE TABLE IF NOT EXISTS embassy_appointments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         BIGINT       NOT NULL,
    country            VARCHAR(10)  NOT NULL,     -- UK | GERMANY
    appointment_date   DATE,
    appointment_time   TIME,
    location           VARCHAR(255),
    status             VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
                                                  -- PENDING | CONFIRMED | COMPLETED | CANCELLED
    notes              TEXT,
    created_by_admin   BIGINT,
    created_at         TIMESTAMP NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_embassy_appts_student_id ON embassy_appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_embassy_appts_status     ON embassy_appointments(status);

-- 4. Meeting URLs (admin sets Google Meet URL per section)
CREATE TABLE IF NOT EXISTS meeting_urls (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section            VARCHAR(20)  NOT NULL,     -- VISA | FINANCE
    url                TEXT         NOT NULL,
    label              VARCHAR(255),
    is_active          BOOLEAN      NOT NULL DEFAULT true,
    created_by_admin   BIGINT,
    created_at         TIMESTAMP NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meeting_urls_section ON meeting_urls(section);

-- 5. Admin Queries (admin → super-admin communication)
CREATE TABLE IF NOT EXISTS admin_queries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    BIGINT       NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    message     TEXT         NOT NULL,
    reply       TEXT,
    replied_by  BIGINT,
    replied_at  TIMESTAMP,
    status      VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
                                                  -- OPEN | REPLIED | CLOSED
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_queries_admin_id ON admin_queries(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_queries_status   ON admin_queries(status);

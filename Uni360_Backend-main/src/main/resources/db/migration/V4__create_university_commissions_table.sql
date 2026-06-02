-- V4: Create university_commissions table for SuperAdmin commission tracking
CREATE TABLE IF NOT EXISTS university_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL UNIQUE,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,   -- e.g. 12.50 means 12.50%
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

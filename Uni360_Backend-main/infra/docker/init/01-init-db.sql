-- UniFlow Database Initialization Script
-- This script sets up the initial database structure and permissions

-- Create additional databases if needed
CREATE DATABASE IF NOT EXISTS uniflow_test;

-- Create application user with proper permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'uniflow_app') THEN
        CREATE USER uniflow_app WITH PASSWORD 'uniflow_app_password';
    END IF;
END
$$;

-- Grant permissions to application user
GRANT CONNECT ON DATABASE uniflow_db_dev TO uniflow_app;
GRANT CONNECT ON DATABASE uniflow_test TO uniflow_app;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO uniflow_app;
GRANT CREATE ON SCHEMA public TO uniflow_app;

-- Grant table permissions (for future tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO uniflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO uniflow_app;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create initial tables if they don't exist (basic structure)
-- Note: R2DBC will handle the actual table creation through entity mapping

-- Indexes for performance
-- These will be created automatically by R2DBC based on entity annotations

-- Create audit function for tracking changes
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Initial data setup (if needed)
-- This can be used for reference data, configuration, etc.

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'UniFlow database initialization completed successfully';
END
$$;

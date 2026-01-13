-- =============================================================================
-- Trading Signals Platform - Database Initialization
-- =============================================================================
-- This script runs on first database initialization
-- TimescaleDB extension is enabled by default in the timescale/timescaledb image
-- =============================================================================

-- Ensure TimescaleDB extension is enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create additional useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully with TimescaleDB extensions';
END $$;

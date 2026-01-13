-- =============================================================================
-- Trading Signals Platform - PostgreSQL Initialization Script
-- =============================================================================
-- This script runs automatically when the container is first created
-- =============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE '✅ TimescaleDB and extensions initialized successfully';
END $$;

-- Database Setup Script voor hoofdproject
-- Voer dit uit in je nieuwe pgvector PostgreSQL service

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create skill_type enum
CREATE TYPE skill_type AS ENUM ('language', 'library', 'storage', 'tool', 'other');

-- Create source enum (update met 'linkedin' voor microservice)
CREATE TYPE source AS ENUM ('esco', 'user', 'admin', 'linkedin');

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    skill_type skill_type NOT NULL,
    source source NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    esco_id TEXT,
    abbreviations TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    embedding vector(1536) NOT NULL
);

-- Create index for skill lookups
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);

-- Insert some sample skills (optioneel)
INSERT INTO skills (name, skill_type, source, embedding) VALUES
    ('JavaScript', 'language', 'admin', '[0.1, 0.2, 0.3, ...]'::vector),
    ('React', 'library', 'admin', '[0.1, 0.2, 0.3, ...]'::vector),
    ('PostgreSQL', 'storage', 'admin', '[0.1, 0.2, 0.3, ...]'::vector),
    ('TypeScript', 'language', 'admin', '[0.1, 0.2, 0.3, ...]'::vector)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions (pas aan naar je Railway database user)
-- GRANT ALL PRIVILEGES ON TABLE skills TO your_railway_user;
-- GRANT USAGE ON SCHEMA public TO your_railway_user;

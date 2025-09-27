-- backend/scripts/migrate_v2.sql
-- Adds positions, status (if missing), ancillary fields, and helpful indexes.
-- Safe to run multiple times.

DO $$ BEGIN
  CREATE TYPE session_position AS ENUM (
    'Tutor',
    'Learning Strategist',
    'Intro Meeting (solo)',
    'Intro Meeting (facilitated)',
    'Training',
    'Peer Mentorship',
    'Study Solutions',
    'Coordinator',
    'Program Development',
    'Image Description Specialist',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create session_status enum if not present (your DB may already have it)
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('submitted','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Core columns for business rules
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS position           session_position,
  ADD COLUMN IF NOT EXISTS client_first_name  text,
  ADD COLUMN IF NOT EXISTS client_last_name   text,
  ADD COLUMN IF NOT EXISTS subject_code       text,
  ADD COLUMN IF NOT EXISTS course_number      text,
  ADD COLUMN IF NOT EXISTS no_show            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by        integer,
  ADD COLUMN IF NOT EXISTS approved_at        timestamptz;

-- Ensure status column exists with default (won't overwrite existing values)
DO $$ BEGIN
  ALTER TABLE sessions ADD COLUMN status session_status;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

ALTER TABLE sessions
  ALTER COLUMN status SET DEFAULT 'submitted';

-- Helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_date    ON sessions (session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status  ON sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_tutor   ON sessions (tutor_id);

-- Optional: if you later add clients.user_id, consider:
-- CREATE INDEX IF NOT EXISTS idx_clients_user ON clients (user_id);

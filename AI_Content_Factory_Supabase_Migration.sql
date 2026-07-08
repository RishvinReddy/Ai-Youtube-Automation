-- AI Content Factory Supabase Migration
-- This defines the required schema and RPC functions for idempotency.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL UNIQUE,
  request_fingerprint text NOT NULL UNIQUE,
  topic text NOT NULL,
  audience text NOT NULL,
  tone text NOT NULL,
  language text NOT NULL,
  status text NOT NULL,
  execution_id text,
  youtube_video_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  failed_at timestamp with time zone,
  failed_node text,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_jobs_execution_id ON jobs(execution_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- RPC for admitting a job idempotently
CREATE OR REPLACE FUNCTION admit_content_factory_job(
  p_fingerprint text,
  p_topic text,
  p_audience text,
  p_tone text,
  p_language text,
  p_execution_id text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_job_id text;
BEGIN
  -- Check if exists
  SELECT * INTO v_job FROM jobs WHERE request_fingerprint = p_fingerprint;
  IF FOUND THEN
    RETURN json_build_object(
      'admitted', false,
      'job_id', v_job.job_id,
      'status', v_job.status
    )::jsonb;
  END IF;

  -- Create new
  v_job_id := 'acf-' || substr(p_fingerprint, 1, 24);
  INSERT INTO jobs (job_id, request_fingerprint, topic, audience, tone, language, status, execution_id)
  VALUES (v_job_id, p_fingerprint, p_topic, p_audience, p_tone, p_language, 'received', p_execution_id)
  RETURNING * INTO v_job;

  RETURN json_build_object(
    'admitted', true,
    'job_id', v_job.job_id,
    'status', v_job.status
  )::jsonb;
END;
$$;

-- RPC for atomic publishing claim
CREATE OR REPLACE FUNCTION claim_youtube_publishing(
  p_job_id text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_job jobs%ROWTYPE;
BEGIN
  UPDATE jobs 
  SET status = 'publishing', updated_at = now()
  WHERE job_id = p_job_id AND status = 'rendering'
  RETURNING * INTO v_job;

  IF FOUND THEN
    RETURN json_build_object('claimed', true, 'job_id', v_job.job_id)::jsonb;
  ELSE
    RETURN json_build_object('claimed', false, 'job_id', p_job_id)::jsonb;
  END IF;
END;
$$;

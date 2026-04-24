-- FusionBrain database schema
-- Run once after CREATE DATABASE fusionbrain_db; and CREATE ROLE fusionbrain ...
-- Usage: sudo -u postgres psql -d fusionbrain_db -f schema.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
  id              BIGSERIAL PRIMARY KEY,
  source_type     TEXT NOT NULL,          -- 'youtube' | 'pdf' | 'json' | 'markdown' | 'fusion_docs'
  source_name     TEXT NOT NULL,          -- e.g. 'Brad Tallis - Episode 94'
  source_url      TEXT,                   -- clickable back-link (base URL for YouTube; timestamp in source_ref/metadata)
  source_ref      TEXT,                   -- e.g. '14:32' (YouTube) or 'p.87' (PDF)
  chunk_index     INT  NOT NULL,
  text            TEXT NOT NULL,
  embedding       vector(1024) NOT NULL,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_type, source_name, chunk_index)
);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS chunks_source_type_idx
  ON chunks (source_type);

CREATE INDEX IF NOT EXISTS chunks_source_name_idx
  ON chunks (source_name);

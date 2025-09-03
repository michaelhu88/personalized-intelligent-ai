-- Migration to add vector support and persistent memory
-- This updates memory_embeddings to use native vector type and adds user_persistent_memory table

-- Drop existing embedding column and recreate as vector type
ALTER TABLE memory_embeddings DROP COLUMN IF EXISTS embedding;
ALTER TABLE memory_embeddings ADD COLUMN embedding vector(1536);

-- Create persistent memory table for Claude.md-style user context
CREATE TABLE IF NOT EXISTS "user_persistent_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "user_persistent_memory" ADD CONSTRAINT "user_persistent_memory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS "user_persistent_memory_user_id_idx" ON "user_persistent_memory" ("user_id");

-- Create vector indexes for efficient similarity search
CREATE INDEX IF NOT EXISTS memory_embeddings_cosine_idx ON memory_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS memory_embeddings_l2_idx ON memory_embeddings USING hnsw (embedding vector_l2_ops);

-- Add some comments for clarity
COMMENT ON COLUMN memory_embeddings.embedding IS 'Vector embedding using pgvector extension (1536 dimensions for OpenAI text-embedding-ada-002)';
COMMENT ON TABLE user_persistent_memory IS 'User-editable persistent memory that is always read first by AI (like Claude.md)';
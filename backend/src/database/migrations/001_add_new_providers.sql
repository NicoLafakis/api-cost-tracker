-- Migration to add Gemini and Perplexity support and improve token tracking
-- Run this migration to update existing database

-- Step 1: Update the provider enum to include new providers
ALTER TABLE api_keys
MODIFY COLUMN provider ENUM('openai', 'anthropic', 'gemini', 'perplexity') NOT NULL;

-- Step 2: Add more detailed token tracking columns to usage_snapshots
-- This allows us to store input/output tokens separately for accurate cost calculation
ALTER TABLE usage_snapshots
ADD COLUMN input_tokens BIGINT DEFAULT 0 AFTER token_usage,
ADD COLUMN output_tokens BIGINT DEFAULT 0 AFTER input_tokens,
ADD COLUMN cached_tokens BIGINT DEFAULT 0 AFTER output_tokens,
ADD COLUMN requests_with_search INT DEFAULT 0 AFTER request_count;

-- Step 3: Update existing records to populate the new columns from model_breakdown JSON
-- This is a best-effort migration for existing data
UPDATE usage_snapshots
SET
  input_tokens = COALESCE(JSON_EXTRACT(model_breakdown, '$[0].input_tokens'), token_usage),
  output_tokens = COALESCE(JSON_EXTRACT(model_breakdown, '$[0].output_tokens'), 0)
WHERE model_breakdown IS NOT NULL;

-- Note: The token_usage column is kept for backward compatibility
-- but new code should use input_tokens and output_tokens

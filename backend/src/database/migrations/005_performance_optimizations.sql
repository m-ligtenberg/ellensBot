-- Migration: 005_performance_optimizations.sql
-- Description: Add indexes and optimize existing queries for better performance
-- Author: Claude
-- Date: 2025-01-XX

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp 
ON messages(conversation_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender 
ON messages(conversation_id, sender);

CREATE INDEX IF NOT EXISTS idx_messages_denial_timestamp 
ON messages(is_denial, timestamp) WHERE is_denial = true;

CREATE INDEX IF NOT EXISTS idx_messages_interruption_timestamp 
ON messages(is_interruption, timestamp) WHERE is_interruption = true;

CREATE INDEX IF NOT EXISTS idx_conversations_user 
ON conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_status 
ON conversations(status);

CREATE INDEX IF NOT EXISTS idx_user_submissions_status 
ON user_submissions(submission_status);

CREATE INDEX IF NOT EXISTS idx_user_submissions_created 
ON user_submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user 
ON user_profiles(user_id);

-- Add indexes for ML-related tables
CREATE INDEX IF NOT EXISTS idx_ml_user_interactions_user 
ON ml_user_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_ml_user_interactions_created 
ON ml_user_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_patterns_type 
ON conversation_patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_response_effectiveness_type 
ON response_effectiveness(response_type);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_messages_conversation_type_timestamp 
ON messages(conversation_id, message_type, timestamp);

CREATE INDEX IF NOT EXISTS idx_user_submissions_status_created 
ON user_submissions(submission_status, created_at);

-- Optimize user session lookups
CREATE INDEX IF NOT EXISTS idx_users_session_active 
ON users(session_id, last_active);

-- Add constraints to improve query planner
ALTER TABLE messages 
ADD CONSTRAINT chk_sender_valid 
CHECK (sender IN ('user', 'ellens', 'system'));

ALTER TABLE conversations 
ADD CONSTRAINT chk_status_valid 
CHECK (status IN ('active', 'ended', 'paused', 'interrupted'));

-- Add comments for documentation
COMMENT ON INDEX idx_messages_conversation_timestamp IS 'Optimizes chronological message retrieval for conversations';
COMMENT ON INDEX idx_user_submissions_status IS 'Speeds up admin dashboard filtering by submission status';
COMMENT ON INDEX idx_ml_user_interactions_user IS 'Improves ML model training data queries by user';
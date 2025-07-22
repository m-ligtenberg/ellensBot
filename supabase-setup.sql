-- Young Ellens Chatbot - Supabase Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Initial schema for Young Ellens Chatbot

-- Users table for session management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ellens_mood VARCHAR(50) DEFAULT 'chill',
    chaos_level INTEGER DEFAULT 50,
    patience INTEGER DEFAULT 15,
    message_count INTEGER DEFAULT 0,
    cocaine_references INTEGER DEFAULT 0,
    interruption_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP NULL,
    end_reason VARCHAR(100) NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ellens')),
    timestamp TIMESTAMP DEFAULT NOW(),
    mood VARCHAR(50),
    chaos_level INTEGER,
    message_length INTEGER,
    response_time_ms INTEGER,
    is_interruption BOOLEAN DEFAULT FALSE,
    is_denial BOOLEAN DEFAULT FALSE,
    contains_cocaine_ref BOOLEAN DEFAULT FALSE
);

-- User behavior tracking for ML
CREATE TABLE IF NOT EXISTS user_interactions (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_message_length INTEGER,
    user_typing_speed FLOAT,
    response_time INTERVAL,
    user_satisfaction_score FLOAT,
    continued_conversation BOOLEAN,
    interaction_type VARCHAR(50),
    user_reaction VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ML training data for response effectiveness
CREATE TABLE IF NOT EXISTS response_effectiveness (
    id SERIAL PRIMARY KEY,
    response_type VARCHAR(50) NOT NULL,
    user_reaction VARCHAR(50),
    context_keywords TEXT[],
    effectiveness_score FLOAT,
    chaos_level INTEGER,
    mood VARCHAR(50),
    conversation_length INTEGER,
    user_engagement_duration INTERVAL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation patterns for learning optimal behavior
CREATE TABLE IF NOT EXISTS conversation_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(50) NOT NULL,
    trigger_context TEXT,
    trigger_keywords TEXT[],
    success_rate FLOAT,
    avg_conversation_length INTEGER,
    user_retention_score FLOAT,
    optimal_chaos_level INTEGER,
    optimal_mood VARCHAR(50),
    sample_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User personality profiles (ML-generated)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    average_message_length FLOAT,
    typing_speed FLOAT,
    conversation_duration_preference INTEGER,
    chaos_tolerance FLOAT,
    denial_engagement_score FLOAT,
    interruption_tolerance FLOAT,
    humor_preference VARCHAR(50),
    topic_preferences TEXT[],
    optimal_ellens_mood VARCHAR(50),
    optimal_chaos_level INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session analytics
CREATE TABLE IF NOT EXISTS session_analytics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    total_messages INTEGER,
    session_duration INTERVAL,
    avg_response_time INTERVAL,
    chaos_level_progression INTEGER[],
    mood_changes TEXT[],
    denial_count INTEGER,
    interruption_count INTEGER,
    user_satisfaction_score FLOAT,
    ended_by_boredom BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_interactions_conversation_id ON user_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_response_effectiveness_response_type ON response_effectiveness(response_type);
CREATE INDEX IF NOT EXISTS idx_conversation_patterns_pattern_type ON conversation_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_patterns_updated_at 
    BEFORE UPDATE ON conversation_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for production
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, restrict later)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_interactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON response_effectiveness FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON conversation_patterns FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON session_analytics FOR ALL USING (true);
-- ML Training Data Tables for Young Ellens Chatbot

-- Content source performance tracking
CREATE TABLE IF NOT EXISTS content_source_performance (
    id SERIAL PRIMARY KEY,
    source_id VARCHAR(255) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    avg_quality_score FLOAT DEFAULT 0,
    successful_integrations INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    user_satisfaction_score FLOAT DEFAULT 0,
    optimal_check_frequency INTEGER DEFAULT 360, -- minutes
    best_time_windows TEXT[], -- array of time windows when content is best
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_id)
);

-- ML model tracking
CREATE TABLE IF NOT EXISTS ml_models (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(255) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('content_quality', 'user_engagement', 'source_optimization', 'timing_prediction')),
    training_data_size INTEGER DEFAULT 0,
    accuracy FLOAT DEFAULT 0,
    last_trained TIMESTAMP DEFAULT NOW(),
    features TEXT[], -- array of feature names
    weights JSONB, -- feature weights as JSON object
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pattern insights from ML analysis
CREATE TABLE IF NOT EXISTS pattern_insights (
    id SERIAL PRIMARY KEY,
    pattern VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    success_rate FLOAT DEFAULT 0,
    avg_engagement FLOAT DEFAULT 0,
    confidence_level FLOAT DEFAULT 0,
    sample_size INTEGER DEFAULT 0,
    recommended_usage VARCHAR(50) DEFAULT 'experimental',
    context_data JSONB, -- additional context as JSON
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pattern)
);

-- User interaction data for ML learning
CREATE TABLE IF NOT EXISTS ml_user_interactions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    content_type VARCHAR(50),
    source_name VARCHAR(255),
    quality_score FLOAT,
    user_engagement VARCHAR(50) CHECK (user_engagement IN ('positive', 'negative', 'neutral', 'ignored')),
    conversation_length INTEGER,
    response_time INTEGER, -- milliseconds
    chaos_level INTEGER,
    denial_pattern VARCHAR(100),
    interaction_context JSONB, -- additional context data
    created_at TIMESTAMP DEFAULT NOW()
);

-- Content learning data
CREATE TABLE IF NOT EXISTS learned_content (
    id SERIAL PRIMARY KEY,
    content_id VARCHAR(255) UNIQUE NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('lyrics', 'interview', 'social_media', 'speech', 'other')),
    title VARCHAR(500),
    content_text TEXT NOT NULL,
    analysis_data JSONB, -- analysis results as JSON
    integrated_date TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dynamic patterns learned from content
CREATE TABLE IF NOT EXISTS dynamic_patterns (
    id SERIAL PRIMARY KEY,
    pattern_category VARCHAR(50) NOT NULL CHECK (pattern_category IN ('denial_responses', 'knowledge_slips', 'street_slang', 'signature_phrases', 'conversation_starters')),
    pattern_text TEXT NOT NULL,
    source_content_id INTEGER REFERENCES learned_content(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Response optimization data
CREATE TABLE IF NOT EXISTS response_optimization (
    id SERIAL PRIMARY KEY,
    response_id VARCHAR(255),
    original_response TEXT NOT NULL,
    optimized_response TEXT NOT NULL,
    optimization_type VARCHAR(50), -- chaos_adjustment, humor_personalization, etc
    user_profile_data JSONB,
    effectiveness_improvement FLOAT, -- how much better the optimized version performed
    a_b_test_data JSONB, -- A/B testing results
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation context memory
CREATE TABLE IF NOT EXISTS conversation_context (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    context_data JSONB NOT NULL, -- all context information as JSON
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_content_source_performance_source_id ON content_source_performance(source_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_model_type ON ml_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_is_active ON ml_models(is_active);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_pattern_type ON pattern_insights(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_recommended_usage ON pattern_insights(recommended_usage);
CREATE INDEX IF NOT EXISTS idx_ml_user_interactions_session_id ON ml_user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ml_user_interactions_timestamp ON ml_user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_ml_user_interactions_user_engagement ON ml_user_interactions(user_engagement);
CREATE INDEX IF NOT EXISTS idx_learned_content_content_type ON learned_content(content_type);
CREATE INDEX IF NOT EXISTS idx_learned_content_is_active ON learned_content(is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_patterns_category ON dynamic_patterns(pattern_category);
CREATE INDEX IF NOT EXISTS idx_dynamic_patterns_is_active ON dynamic_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_response_optimization_optimization_type ON response_optimization(optimization_type);
CREATE INDEX IF NOT EXISTS idx_conversation_context_user_conversation ON conversation_context(user_id, conversation_id);

-- Update triggers for timestamps
CREATE TRIGGER update_content_source_performance_updated_at 
    BEFORE UPDATE ON content_source_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_models_updated_at 
    BEFORE UPDATE ON ml_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pattern_insights_updated_at 
    BEFORE UPDATE ON pattern_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dynamic_patterns_updated_at 
    BEFORE UPDATE ON dynamic_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old ML training data (keep performance optimized)
CREATE OR REPLACE FUNCTION cleanup_old_ml_data()
RETURNS VOID AS $$
BEGIN
    -- Keep only last 30 days of user interactions for active training
    DELETE FROM ml_user_interactions 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Archive old response optimization data (keep only last 60 days)
    DELETE FROM response_optimization 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    -- Clean up unused patterns (not used in last 90 days and low effectiveness)
    UPDATE dynamic_patterns 
    SET is_active = FALSE 
    WHERE last_used_at < NOW() - INTERVAL '90 days' 
    AND effectiveness_score < 0.3;
    
    RAISE NOTICE 'ML data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Function to update pattern effectiveness based on usage
CREATE OR REPLACE FUNCTION update_pattern_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    -- Update effectiveness score for dynamic patterns
    IF TG_TABLE_NAME = 'dynamic_patterns' THEN
        -- Simple effectiveness calculation based on usage frequency and recency
        NEW.effectiveness_score := LEAST(1.0, 
            (NEW.usage_count::FLOAT / 10.0) * 
            CASE 
                WHEN NEW.last_used_at > NOW() - INTERVAL '7 days' THEN 1.0
                WHEN NEW.last_used_at > NOW() - INTERVAL '30 days' THEN 0.8
                WHEN NEW.last_used_at > NOW() - INTERVAL '90 days' THEN 0.5
                ELSE 0.2
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update pattern effectiveness
CREATE TRIGGER update_dynamic_pattern_effectiveness
    BEFORE UPDATE ON dynamic_patterns
    FOR EACH ROW 
    WHEN (OLD.usage_count IS DISTINCT FROM NEW.usage_count OR OLD.last_used_at IS DISTINCT FROM NEW.last_used_at)
    EXECUTE FUNCTION update_pattern_effectiveness();

-- Insert initial ML models
INSERT INTO ml_models (model_id, model_type, features, weights) VALUES 
(
    'content_quality_v1', 
    'content_quality',
    ARRAY['content_length', 'keyword_density', 'source_reputation', 'freshness_score', 'entity_count', 'sentiment_score', 'language_confidence'],
    '{"content_length": 0.15, "keyword_density": 0.25, "source_reputation": 0.20, "freshness_score": 0.15, "entity_count": 0.10, "sentiment_score": 0.10, "language_confidence": 0.05}'::jsonb
),
(
    'user_engagement_v1',
    'user_engagement', 
    ARRAY['content_type', 'quality_score', 'chaos_level', 'time_of_day', 'conversation_context', 'user_history', 'denial_pattern_type'],
    '{"content_type": 0.20, "quality_score": 0.25, "chaos_level": 0.15, "time_of_day": 0.10, "conversation_context": 0.15, "user_history": 0.10, "denial_pattern_type": 0.05}'::jsonb
),
(
    'source_optimization_v1',
    'source_optimization',
    ARRAY['historical_success_rate', 'content_variety', 'update_frequency', 'server_response_time', 'content_freshness', 'duplicate_rate', 'integration_success'],
    '{"historical_success_rate": 0.30, "content_variety": 0.15, "update_frequency": 0.15, "server_response_time": 0.10, "content_freshness": 0.15, "duplicate_rate": -0.10, "integration_success": 0.25}'::jsonb
)
ON CONFLICT (model_id) DO NOTHING;
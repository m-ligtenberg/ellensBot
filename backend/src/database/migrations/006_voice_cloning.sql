-- Migration: 006_voice_cloning.sql
-- Description: Add tables for voice cloning functionality with Coqui-AI
-- Author: Claude
-- Date: 2025-01-XX

-- Voice clips table for storing uploaded audio samples
CREATE TABLE IF NOT EXISTS voice_clips (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    duration FLOAT NOT NULL DEFAULT 0,
    sample_rate INTEGER NOT NULL DEFAULT 22050,
    transcription TEXT,
    quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    file_size INTEGER,
    uploaded_by VARCHAR(36),
    tags TEXT[]
);

-- Voice models table for storing trained voice cloning models
CREATE TABLE IF NOT EXISTS voice_models (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model_path TEXT NOT NULL,
    training_clips JSONB NOT NULL, -- Array of clip IDs used for training
    quality_score FLOAT NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 1),
    training_duration FLOAT NOT NULL DEFAULT 0, -- Total duration of training audio in seconds
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    model_size BIGINT NOT NULL DEFAULT 0,
    language VARCHAR(10) NOT NULL DEFAULT 'nl',
    training_epochs INTEGER DEFAULT 0,
    training_loss FLOAT,
    validation_loss FLOAT,
    created_by VARCHAR(36),
    description TEXT
);

-- TTS generation logs for tracking usage and performance
CREATE TABLE IF NOT EXISTS tts_generations (
    id VARCHAR(36) PRIMARY KEY,
    model_id VARCHAR(36) NOT NULL REFERENCES voice_models(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    output_path TEXT NOT NULL,
    duration FLOAT NOT NULL DEFAULT 0,
    generation_time FLOAT NOT NULL DEFAULT 0, -- Time taken to generate in seconds
    settings JSONB, -- Speed, emotion, format, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_session_id VARCHAR(255),
    conversation_id VARCHAR(36),
    file_size INTEGER,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5)
);

-- Voice model training jobs for tracking training progress
CREATE TABLE IF NOT EXISTS voice_training_jobs (
    id VARCHAR(36) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    clip_ids JSONB NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'nl',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress FLOAT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    training_logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    estimated_duration INTEGER, -- Estimated training time in minutes
    actual_duration INTEGER, -- Actual training time in minutes
    model_id VARCHAR(36) REFERENCES voice_models(id) ON DELETE SET NULL
);

-- Audio analysis results for clip quality assessment
CREATE TABLE IF NOT EXISTS audio_analysis (
    id VARCHAR(36) PRIMARY KEY,
    clip_id VARCHAR(36) NOT NULL REFERENCES voice_clips(id) ON DELETE CASCADE,
    snr_db FLOAT, -- Signal-to-noise ratio in decibels
    spectral_centroid FLOAT,
    zero_crossing_rate FLOAT,
    mfcc_features JSONB, -- Mel-frequency cepstral coefficients
    pitch_mean FLOAT,
    pitch_std FLOAT,
    energy_mean FLOAT,
    energy_std FLOAT,
    silence_ratio FLOAT, -- Percentage of silence in the clip
    speech_clarity_score FLOAT CHECK (speech_clarity_score >= 0 AND speech_clarity_score <= 1),
    background_noise_level FLOAT,
    voice_consistency_score FLOAT CHECK (voice_consistency_score >= 0 AND voice_consistency_score <= 1),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voice model performance metrics
CREATE TABLE IF NOT EXISTS model_performance (
    id VARCHAR(36) PRIMARY KEY,
    model_id VARCHAR(36) NOT NULL REFERENCES voice_models(id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,
    metric_value FLOAT NOT NULL,
    measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_text TEXT,
    reference_audio_id VARCHAR(36) REFERENCES voice_clips(id),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_clips_status ON voice_clips(processing_status);
CREATE INDEX IF NOT EXISTS idx_voice_clips_quality ON voice_clips(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_voice_clips_created ON voice_clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_clips_duration ON voice_clips(duration);

CREATE INDEX IF NOT EXISTS idx_voice_models_active ON voice_models(is_active);
CREATE INDEX IF NOT EXISTS idx_voice_models_quality ON voice_models(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_voice_models_language ON voice_models(language);
CREATE INDEX IF NOT EXISTS idx_voice_models_created ON voice_models(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tts_generations_model ON tts_generations(model_id);
CREATE INDEX IF NOT EXISTS idx_tts_generations_created ON tts_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tts_generations_session ON tts_generations(user_session_id);

CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON voice_training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_created ON voice_training_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audio_analysis_clip ON audio_analysis(clip_id);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_quality ON audio_analysis(speech_clarity_score DESC);

-- Add constraints and triggers
ALTER TABLE voice_models ADD CONSTRAINT unique_active_model_per_language 
    EXCLUDE (language WITH =) WHERE (is_active = true);

-- Trigger to ensure only one active model per language
CREATE OR REPLACE FUNCTION ensure_single_active_model()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE voice_models 
        SET is_active = false 
        WHERE language = NEW.language 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_model
    BEFORE INSERT OR UPDATE ON voice_models
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_model();

-- Function to calculate clip statistics
CREATE OR REPLACE FUNCTION calculate_clip_stats()
RETURNS TABLE (
    total_clips BIGINT,
    processed_clips BIGINT,
    total_duration FLOAT,
    avg_quality FLOAT,
    languages TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_clips,
        COUNT(*) FILTER (WHERE is_processed = true) as processed_clips,
        COALESCE(SUM(duration), 0) as total_duration,
        COALESCE(AVG(quality_score), 0) as avg_quality,
        ARRAY_AGG(DISTINCT vm.language) as languages
    FROM voice_clips vc
    LEFT JOIN voice_models vm ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get model training statistics
CREATE OR REPLACE FUNCTION get_model_training_stats(model_id_param VARCHAR(36))
RETURNS TABLE (
    total_generations BIGINT,
    avg_generation_time FLOAT,
    total_audio_generated FLOAT,
    last_used TIMESTAMP,
    usage_frequency FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_generations,
        COALESCE(AVG(generation_time), 0) as avg_generation_time,
        COALESCE(SUM(duration), 0) as total_audio_generated,
        MAX(created_at) as last_used,
        COUNT(*)::FLOAT / GREATEST(EXTRACT(epoch FROM (NOW() - MIN(created_at))) / 86400, 1) as usage_frequency
    FROM tts_generations
    WHERE model_id = model_id_param;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE voice_clips IS 'Stores uploaded audio clips for voice cloning training';
COMMENT ON TABLE voice_models IS 'Stores trained voice cloning models and their metadata';
COMMENT ON TABLE tts_generations IS 'Logs all TTS generations for usage tracking and analytics';
COMMENT ON TABLE voice_training_jobs IS 'Tracks voice model training job progress and status';
COMMENT ON TABLE audio_analysis IS 'Stores detailed audio analysis results for quality assessment';
COMMENT ON TABLE model_performance IS 'Tracks voice model performance metrics over time';

COMMENT ON COLUMN voice_clips.quality_score IS 'Automated quality score from 0-1 based on audio analysis';
COMMENT ON COLUMN voice_models.is_active IS 'Only one model per language can be active at a time';
COMMENT ON COLUMN tts_generations.settings IS 'JSON object containing speed, emotion, format, and other TTS settings';
COMMENT ON COLUMN audio_analysis.snr_db IS 'Signal-to-noise ratio in decibels - higher is better';
COMMENT ON COLUMN audio_analysis.speech_clarity_score IS 'AI-computed speech clarity from 0-1';
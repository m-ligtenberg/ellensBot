-- Advanced ML Tables for Language Adaptation and User Modeling

-- User engagement models for personalized interactions
CREATE TABLE IF NOT EXISTS user_engagement_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    engagement_score REAL DEFAULT 0.5,
    preferred_language_profile TEXT DEFAULT 'amsterdam_street',
    conversation_style TEXT DEFAULT 'playful' CHECK (conversation_style IN ('direct', 'playful', 'chaotic', 'calm')),
    topic_interests TEXT, -- JSON array of topics
    response_time_preference INTEGER DEFAULT 2000, -- milliseconds
    chaos_tolerance_level REAL DEFAULT 0.7,
    humor_appreciation REAL DEFAULT 0.8,
    cultural_alignment REAL DEFAULT 0.6,
    predicted_retention REAL DEFAULT 0.5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Language profiles for different speaking styles
CREATE TABLE IF NOT EXISTS language_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    vocabulary_data TEXT, -- JSON object with vocabulary
    grammar_patterns TEXT, -- JSON object with grammar rules
    cultural_context TEXT, -- JSON object with cultural data
    personality_weights TEXT, -- JSON object with personality weights
    usage_count INTEGER DEFAULT 0,
    effectiveness_score REAL DEFAULT 0.5,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation flows for different interaction patterns
CREATE TABLE IF NOT EXISTS conversation_flows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    triggers TEXT, -- JSON array of trigger words
    responses_data TEXT, -- JSON object with response categories
    transitions_data TEXT, -- JSON array of state transitions
    effectiveness REAL DEFAULT 0.5,
    user_satisfaction REAL DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Language adaptation history
CREATE TABLE IF NOT EXISTS language_adaptations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT,
    original_profile TEXT,
    adapted_profile TEXT,
    adaptation_reason TEXT,
    adaptation_data TEXT, -- JSON with adaptation details
    effectiveness REAL,
    user_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vocabulary expansion tracking
CREATE TABLE IF NOT EXISTS vocabulary_expansion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    language_profile TEXT,
    category TEXT, -- streetTerm, fillerWord, exclamation, etc.
    source TEXT, -- where the word was learned from
    confidence_score REAL DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    effectiveness REAL DEFAULT 0.5,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word, language_profile, category)
);

-- Conversation pattern analysis
CREATE TABLE IF NOT EXISTS conversation_patterns_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_name TEXT NOT NULL,
    trigger_context TEXT,
    user_demographics TEXT, -- JSON with user info
    success_indicators TEXT, -- JSON with success metrics
    failure_indicators TEXT, -- JSON with failure metrics
    optimization_suggestions TEXT, -- JSON with improvement ideas
    confidence_level REAL DEFAULT 0.5,
    sample_size INTEGER DEFAULT 0,
    last_analysis DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Real-time language switching logs
CREATE TABLE IF NOT EXISTS language_switches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    conversation_id TEXT,
    from_profile TEXT,
    to_profile TEXT,
    trigger_event TEXT,
    switch_reason TEXT,
    user_reaction TEXT,
    effectiveness REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ML model performance tracking
CREATE TABLE IF NOT EXISTS ml_model_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_type TEXT NOT NULL, -- language_adaptation, engagement_prediction, etc.
    model_version TEXT,
    accuracy REAL,
    precision_score REAL,
    recall_score REAL,
    f1_score REAL,
    training_data_size INTEGER,
    validation_data_size INTEGER,
    training_duration INTEGER, -- seconds
    hyperparameters TEXT, -- JSON
    feature_importance TEXT, -- JSON
    evaluation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Advanced user behavior analysis
CREATE TABLE IF NOT EXISTS user_behavior_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    analysis_type TEXT, -- engagement, language_preference, conversation_style
    analysis_data TEXT, -- JSON with detailed analysis
    insights TEXT, -- JSON with extracted insights
    recommendations TEXT, -- JSON with recommendations
    confidence_score REAL DEFAULT 0.5,
    analysis_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, analysis_type, analysis_date)
);

-- Personality adaptation experiments
CREATE TABLE IF NOT EXISTS personality_experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_name TEXT NOT NULL,
    description TEXT,
    control_group_settings TEXT, -- JSON
    test_group_settings TEXT, -- JSON
    success_metrics TEXT, -- JSON
    start_date DATETIME,
    end_date DATETIME,
    participant_count INTEGER DEFAULT 0,
    results_data TEXT, -- JSON with results
    conclusions TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_engagement_models_user_id ON user_engagement_models(user_id);
CREATE INDEX IF NOT EXISTS idx_language_profiles_active ON language_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_active ON conversation_flows(is_active);
CREATE INDEX IF NOT EXISTS idx_language_adaptations_user_id ON language_adaptations(user_id);
CREATE INDEX IF NOT EXISTS idx_language_adaptations_session ON language_adaptations(session_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_expansion_profile ON vocabulary_expansion(language_profile);
CREATE INDEX IF NOT EXISTS idx_vocabulary_expansion_approved ON vocabulary_expansion(is_approved);
CREATE INDEX IF NOT EXISTS idx_language_switches_user_id ON language_switches(user_id);
CREATE INDEX IF NOT EXISTS idx_language_switches_conversation ON language_switches(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ml_model_performance_type ON ml_model_performance(model_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analysis_user_type ON user_behavior_analysis(user_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_personality_experiments_active ON personality_experiments(is_active);

-- Insert default language profiles
INSERT OR IGNORE INTO language_profiles (id, name, description, vocabulary_data, grammar_patterns, cultural_context, personality_weights) VALUES 
(
    'amsterdam_street',
    'Amsterdam Street Dutch',
    'Authentic Amsterdam street language with heavy slang',
    '{"streetTerms": ["mattie", "sahbi", "akhie", "wallah", "damsko", "dammie"], "fillerWords": ["zo", "ofzo", "gewoon", "man", "bro"], "exclamations": ["yo!", "wollah!", "ewa!", "faka!"]}',
    '{"sentenceStructure": ["Subject-Verb-Object", "Verb-Subject-Object"], "wordOrder": "flexible", "contractions": true, "slangLevel": 9}',
    '{"region": "Amsterdam", "ageGroup": "young_adult", "socialBackground": "street", "musicInfluence": ["drill", "trap", "nederhop"]}',
    '{"chaos": 0.8, "denial": 0.9, "streetCredibility": 0.95, "humor": 0.7, "aggression": 0.3, "friendliness": 0.6}'
),
(
    'standard_dutch',
    'Standard Dutch',
    'More formal Dutch with occasional slang',
    '{"streetTerms": ["man", "dude", "gast"], "fillerWords": ["eigenlijk", "dus", "nou"], "exclamations": ["wow!", "echt waar!", "nice!"]}',
    '{"sentenceStructure": ["Subject-Verb-Object"], "wordOrder": "standard", "contractions": false, "slangLevel": 3}',
    '{"region": "Netherlands", "ageGroup": "general", "socialBackground": "mainstream", "musicInfluence": ["pop", "rock"]}',
    '{"chaos": 0.4, "denial": 0.7, "streetCredibility": 0.3, "humor": 0.8, "aggression": 0.1, "friendliness": 0.9}'
);

-- Insert default conversation flow
INSERT OR IGNORE INTO conversation_flows (id, name, description, triggers, responses_data, transitions_data) VALUES 
(
    'young_ellens_default',
    'Young Ellens Default Flow',
    'Standard conversation flow with denial patterns',
    '["drugs", "cocaine", "wiet", "henny"]',
    '{"opening": ["Yo wat is er mattie?", "Ewa sahbi, alles goed?"], "middle": ["Alleen me wietje en me henny", "Ik ben daar niet op wallah"], "escalation": ["Waarom denkt iedereen dat?", "WACHT EFFE, wat zeg je nu?"], "deescalation": ["Oke chill man", "Geen stress mattie"]}',
    '[{"fromState": "opening", "toState": "middle", "condition": "normal", "probability": 0.7}, {"fromState": "middle", "toState": "escalation", "condition": "drug_mention", "probability": 0.8}]'
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_engagement_models_timestamp 
    AFTER UPDATE ON user_engagement_models 
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN 
        UPDATE user_engagement_models SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_language_profiles_timestamp 
    AFTER UPDATE ON language_profiles 
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN 
        UPDATE language_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_conversation_flows_timestamp 
    AFTER UPDATE ON conversation_flows 
    FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
    BEGIN 
        UPDATE conversation_flows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Function to clean up old data
-- Note: SQLite doesn't support stored procedures, so this would be handled in application code
-- The cleanup would remove:
-- - Language adaptations older than 30 days
-- - Vocabulary expansion entries with low confidence and no usage
-- - Old experiment data after experiments are concluded
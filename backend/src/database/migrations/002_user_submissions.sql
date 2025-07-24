-- User Submissions Feature for Young Ellens Chatbot

-- User submissions table for community-contributed content
CREATE TABLE IF NOT EXISTS user_submissions (
    id SERIAL PRIMARY KEY,
    submission_id VARCHAR(255) UNIQUE NOT NULL,
    user_session_id VARCHAR(255), -- optional, links to users table
    submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('phrase', 'response', 'denial', 'interruption', 'slang')),
    
    -- Content fields
    submitted_text TEXT NOT NULL,
    context_description TEXT, -- when to use this phrase
    category VARCHAR(50), -- chill, chaotic, denial, roast, etc
    
    -- Metadata
    submission_status VARCHAR(20) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected', 'flagged')),
    admin_notes TEXT,
    reviewed_by VARCHAR(100), -- admin who reviewed it
    reviewed_at TIMESTAMP NULL,
    
    -- Voting/Quality metrics
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    quality_score FLOAT, -- 0-1 calculated score
    ellens_appropriateness_score FLOAT, -- how well it fits Ellens' personality
    
    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    effectiveness_score FLOAT, -- how well it worked when used
    last_used_at TIMESTAMP NULL,
    
    -- Administrative
    is_featured BOOLEAN DEFAULT FALSE,
    is_offensive BOOLEAN DEFAULT FALSE,
    auto_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin actions log for submissions
CREATE TABLE IF NOT EXISTS submission_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES user_submissions(id) ON DELETE CASCADE,
    admin_session_id VARCHAR(255), -- who reviewed it
    action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'unflag', 'feature', 'unfeature')),
    reason TEXT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Approved content for integration into personality engine
CREATE TABLE IF NOT EXISTS approved_content (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES user_submissions(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    trigger_keywords TEXT[], -- what keywords trigger this content
    response_text TEXT NOT NULL,
    context_rules TEXT, -- when/how to use this
    mood_requirement VARCHAR(50), -- required mood to use this
    chaos_level_min INTEGER DEFAULT 0,
    chaos_level_max INTEGER DEFAULT 100,
    weight FLOAT DEFAULT 1.0, -- how likely to be selected
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User voting on submissions (to gauge community approval)
CREATE TABLE IF NOT EXISTS submission_votes (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES user_submissions(id) ON DELETE CASCADE,
    user_session_id VARCHAR(255) NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down', 'report')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, user_session_id) -- prevent duplicate votes
);

-- Submission analytics for admin dashboard
CREATE TABLE IF NOT EXISTS submission_analytics (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    total_submissions INTEGER DEFAULT 0,
    pending_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    rejected_submissions INTEGER DEFAULT 0,
    flagged_submissions INTEGER DEFAULT 0,
    avg_review_time_hours FLOAT,
    top_submission_category VARCHAR(50),
    community_engagement_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date) -- one record per day
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_submissions_status ON user_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_type ON user_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_user_submissions_created_at ON user_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_submissions_quality_score ON user_submissions(quality_score);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_submission_id ON submission_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_created_at ON submission_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_approved_content_trigger_keywords ON approved_content USING GIN(trigger_keywords);
CREATE INDEX IF NOT EXISTS idx_approved_content_is_active ON approved_content(is_active);
CREATE INDEX IF NOT EXISTS idx_submission_votes_submission_id ON submission_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_analytics_date ON submission_analytics(date);

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_user_submissions_updated_at 
    BEFORE UPDATE ON user_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate quality score based on votes
CREATE OR REPLACE FUNCTION calculate_submission_quality_score(sub_id INTEGER)
RETURNS FLOAT AS $$
DECLARE
    total_votes INTEGER;
    positive_votes INTEGER;
    score FLOAT;
BEGIN
    SELECT 
        upvotes + downvotes,
        upvotes
    INTO total_votes, positive_votes
    FROM user_submissions 
    WHERE id = sub_id;
    
    IF total_votes = 0 THEN
        RETURN 0.5; -- neutral score for no votes
    END IF;
    
    -- Calculate Wilson score confidence interval (better than simple ratio)
    score := (positive_votes + 1.9208) / (total_votes + 3.8416) - 
             1.96 * SQRT((positive_votes * (total_votes - positive_votes)) / total_votes + 0.9604) / 
             (total_votes + 3.8416);
    
    RETURN GREATEST(0, LEAST(1, score));
END;
$$ LANGUAGE plpgsql;

-- Function to auto-flag potentially problematic submissions
CREATE OR REPLACE FUNCTION auto_flag_submission()
RETURNS TRIGGER AS $$
DECLARE
    offensive_keywords TEXT[] := ARRAY['fuck', 'shit', 'bitch', 'cunt', 'nazi', 'racist', 'kill', 'die', 'suicide'];
    keyword TEXT;
    submitted_lower TEXT;
BEGIN
    submitted_lower := LOWER(NEW.submitted_text);
    
    -- Check for offensive content
    FOREACH keyword IN ARRAY offensive_keywords LOOP
        IF submitted_lower LIKE '%' || keyword || '%' THEN
            NEW.auto_flagged := TRUE;
            NEW.is_offensive := TRUE;
            NEW.flag_reason := 'Auto-flagged for potentially offensive content: ' || keyword;
            NEW.submission_status := 'flagged';
            EXIT;
        END IF;
    END LOOP;
    
    -- Check for extremely long submissions (likely spam)
    IF LENGTH(NEW.submitted_text) > 500 THEN
        NEW.auto_flagged := TRUE;
        NEW.flag_reason := 'Auto-flagged for excessive length (possible spam)';
        NEW.submission_status := 'flagged';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-flag submissions
CREATE TRIGGER auto_flag_new_submissions
    BEFORE INSERT ON user_submissions
    FOR EACH ROW EXECUTE FUNCTION auto_flag_submission();

-- Function to update submission analytics daily
CREATE OR REPLACE FUNCTION update_daily_submission_analytics()
RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
    total_count INTEGER;
    pending_count INTEGER;
    approved_count INTEGER;
    rejected_count INTEGER;
    flagged_count INTEGER;
    avg_review_time FLOAT;
    top_category VARCHAR(50);
BEGIN
    -- Get counts for today's data
    SELECT COUNT(*) INTO total_count FROM user_submissions WHERE DATE(created_at) = today;
    SELECT COUNT(*) INTO pending_count FROM user_submissions WHERE submission_status = 'pending';
    SELECT COUNT(*) INTO approved_count FROM user_submissions WHERE submission_status = 'approved';
    SELECT COUNT(*) INTO rejected_count FROM user_submissions WHERE submission_status = 'rejected';
    SELECT COUNT(*) INTO flagged_count FROM user_submissions WHERE submission_status = 'flagged';
    
    -- Calculate average review time (in hours)
    SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600.0)
    INTO avg_review_time
    FROM user_submissions 
    WHERE reviewed_at IS NOT NULL AND DATE(reviewed_at) = today;
    
    -- Find most popular submission category
    SELECT submission_type INTO top_category
    FROM user_submissions 
    WHERE DATE(created_at) = today
    GROUP BY submission_type 
    ORDER BY COUNT(*) DESC 
    LIMIT 1;
    
    -- Insert or update today's analytics
    INSERT INTO submission_analytics (
        date, total_submissions, pending_submissions, approved_submissions, 
        rejected_submissions, flagged_submissions, avg_review_time_hours, top_submission_category
    ) VALUES (
        today, total_count, pending_count, approved_count, 
        rejected_count, flagged_count, avg_review_time, top_category
    )
    ON CONFLICT (date) DO UPDATE SET
        total_submissions = EXCLUDED.total_submissions,
        pending_submissions = EXCLUDED.pending_submissions,
        approved_submissions = EXCLUDED.approved_submissions,
        rejected_submissions = EXCLUDED.rejected_submissions,
        flagged_submissions = EXCLUDED.flagged_submissions,
        avg_review_time_hours = EXCLUDED.avg_review_time_hours,
        top_submission_category = EXCLUDED.top_submission_category;
END;
$$ LANGUAGE plpgsql;
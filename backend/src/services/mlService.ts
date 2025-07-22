import { db } from '../database/connection';
import { UserModel, UserProfile } from '../models/User';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';

export interface UserBehaviorAnalysis {
  averageMessageLength: number;
  typingSpeed: number;
  conversationDuration: number;
  chaosToleranceScore: number;
  denialEngagementScore: number;
  interruptionToleranceScore: number;
  humorPreference: string;
  topicPreferences: string[];
  optimalEllensSettings: {
    mood: string;
    chaosLevel: number;
  };
}

export interface ResponseEffectivenessData {
  responseType: string;
  userReaction: string;
  contextKeywords: string[];
  effectivenessScore: number;
  chaosLevel: number;
  mood: string;
  conversationLength: number;
}

export class MLService {
  // Analyze user behavior patterns
  async analyzeUserBehavior(userId: number): Promise<UserBehaviorAnalysis> {
    const userStats = await UserModel.getUserStats(userId);
    const conversations = await ConversationModel.getUserConversations(userId, 20);
    
    // Calculate behavior metrics
    const avgMessageLength = userStats.avg_messages_per_conversation || 50;
    const typingSpeed = await this.calculateTypingSpeed(userId);
    const conversationDuration = await this.calculateAverageConversationDuration(userId);
    const chaosToleranceScore = await this.calculateChaosTolerance(userId);
    const denialEngagementScore = await this.calculateDenialEngagement(userId);
    const interruptionToleranceScore = await this.calculateInterruptionTolerance(userId);
    const humorPreference = await this.identifyHumorPreference(userId);
    const topicPreferences = await this.extractTopicPreferences(userId);
    const optimalSettings = await this.findOptimalEllensSettings(userId);

    return {
      averageMessageLength: avgMessageLength,
      typingSpeed,
      conversationDuration,
      chaosToleranceScore,
      denialEngagementScore,
      interruptionToleranceScore,
      humorPreference,
      topicPreferences,
      optimalEllensSettings: optimalSettings
    };
  }

  // Record user interaction for ML learning
  async recordUserInteraction(
    conversationId: number,
    userMessageLength: number,
    responseTimeMs: number,
    userReaction: 'positive' | 'negative' | 'neutral' | 'continued' | 'left',
    interactionType: string
  ): Promise<void> {
    const satisfactionScore = this.calculateSatisfactionScore(userReaction, responseTimeMs);
    const continuedConversation = userReaction === 'continued' || userReaction === 'positive';

    await db.query(`
      INSERT INTO user_interactions (
        conversation_id, user_message_length, response_time, 
        user_satisfaction_score, continued_conversation, 
        interaction_type, user_reaction
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      conversationId,
      userMessageLength,
      `${responseTimeMs} milliseconds`,
      satisfactionScore,
      continuedConversation,
      interactionType,
      userReaction
    ]);
  }

  // Record response effectiveness for training
  async recordResponseEffectiveness(data: ResponseEffectivenessData): Promise<void> {
    await db.query(`
      INSERT INTO response_effectiveness (
        response_type, user_reaction, context_keywords,
        effectiveness_score, chaos_level, mood, conversation_length
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.responseType,
      data.userReaction,
      data.contextKeywords,
      data.effectivenessScore,
      data.chaosLevel,
      data.mood,
      data.conversationLength
    ]);
  }

  // Update conversation pattern data
  async updateConversationPattern(
    patternType: string,
    triggerContext: string,
    wasSuccessful: boolean,
    chaosLevel: number,
    mood: string,
    conversationLength: number
  ): Promise<void> {
    const keywords = this.extractKeywords(triggerContext);
    
    // Check if pattern exists
    const existing = await db.query(`
      SELECT * FROM conversation_patterns 
      WHERE pattern_type = $1 AND trigger_keywords && $2
    `, [patternType, keywords]);

    if (existing.rows.length > 0) {
      // Update existing pattern
      const pattern = existing.rows[0];
      const newSampleCount = pattern.sample_count + 1;
      const currentSuccessRate = pattern.success_rate || 0;
      const newSuccessRate = (currentSuccessRate * pattern.sample_count + (wasSuccessful ? 1 : 0)) / newSampleCount;
      const newAvgLength = (pattern.avg_conversation_length * pattern.sample_count + conversationLength) / newSampleCount;

      await db.query(`
        UPDATE conversation_patterns 
        SET success_rate = $2, avg_conversation_length = $3, 
            sample_count = $4, updated_at = NOW()
        WHERE id = $1
      `, [pattern.id, newSuccessRate, newAvgLength, newSampleCount]);
    } else {
      // Create new pattern
      await db.query(`
        INSERT INTO conversation_patterns (
          pattern_type, trigger_context, trigger_keywords,
          success_rate, avg_conversation_length, optimal_chaos_level,
          optimal_mood, sample_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      `, [
        patternType,
        triggerContext,
        keywords,
        wasSuccessful ? 1.0 : 0.0,
        conversationLength,
        chaosLevel,
        mood
      ]);
    }
  }

  // Get optimal response settings based on user profile
  async getOptimalResponseSettings(userId: number): Promise<{
    mood: string;
    chaosLevel: number;
    interruptionChance: number;
  }> {
    const profile = await UserModel.getProfile(userId);
    
    if (!profile) {
      // Return default settings
      return {
        mood: 'chill',
        chaosLevel: 50,
        interruptionChance: 0.3
      };
    }

    return {
      mood: profile.optimal_ellens_mood,
      chaosLevel: profile.optimal_chaos_level,
      interruptionChance: Math.max(0.1, Math.min(0.8, profile.interruption_tolerance))
    };
  }

  // Predict user reaction to a response type
  async predictUserReaction(
    userId: number,
    responseType: string,
    contextKeywords: string[],
    chaosLevel: number
  ): Promise<number> {
    const result = await db.query(`
      SELECT AVG(effectiveness_score) as predicted_score
      FROM response_effectiveness re
      JOIN conversations c ON true
      JOIN users u ON c.user_id = u.id
      WHERE u.id = $1 
        AND re.response_type = $2
        AND re.context_keywords && $3
        AND ABS(re.chaos_level - $4) < 20
    `, [userId, responseType, contextKeywords, chaosLevel]);

    return result.rows[0]?.predicted_score || 0.5; // Default to neutral
  }

  // Update user profile based on recent interactions
  async updateUserProfile(userId: number): Promise<void> {
    const analysis = await this.analyzeUserBehavior(userId);
    
    await UserModel.createOrUpdateProfile(userId, {
      average_message_length: analysis.averageMessageLength,
      typing_speed: analysis.typingSpeed,
      conversation_duration_preference: analysis.conversationDuration,
      chaos_tolerance: analysis.chaosToleranceScore,
      denial_engagement_score: analysis.denialEngagementScore,
      interruption_tolerance: analysis.interruptionToleranceScore,
      humor_preference: analysis.humorPreference,
      topic_preferences: analysis.topicPreferences,
      optimal_ellens_mood: analysis.optimalEllensSettings.mood,
      optimal_chaos_level: analysis.optimalEllensSettings.chaosLevel
    } as Partial<UserProfile>);
  }

  // Private helper methods
  private calculateSatisfactionScore(
    reaction: 'positive' | 'negative' | 'neutral' | 'continued' | 'left',
    responseTimeMs: number
  ): number {
    let baseScore = 0.5;
    
    switch (reaction) {
      case 'positive': baseScore = 0.8; break;
      case 'continued': baseScore = 0.7; break;
      case 'neutral': baseScore = 0.5; break;
      case 'negative': baseScore = 0.3; break;
      case 'left': baseScore = 0.1; break;
    }

    // Adjust for response time (faster responses generally get higher satisfaction)
    if (responseTimeMs < 1000) baseScore += 0.1;
    else if (responseTimeMs > 5000) baseScore -= 0.1;

    return Math.max(0, Math.min(1, baseScore));
  }

  private async calculateTypingSpeed(userId: number): Promise<number> {
    const result = await db.query(`
      SELECT AVG(
        CASE WHEN response_time_ms > 0 
        THEN message_length::float / (response_time_ms::float / 1000)
        ELSE NULL END
      ) as avg_typing_speed
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = $1 AND m.sender = 'user'
    `, [userId]);

    return result.rows[0]?.avg_typing_speed || 2.0; // Default 2 chars per second
  }

  private async calculateAverageConversationDuration(userId: number): Promise<number> {
    const result = await db.query(`
      SELECT AVG(
        EXTRACT(EPOCH FROM (ended_at - created_at))/60
      ) as avg_duration_minutes
      FROM conversations 
      WHERE user_id = $1 AND ended_at IS NOT NULL
    `, [userId]);

    return result.rows[0]?.avg_duration_minutes || 10; // Default 10 minutes
  }

  private async calculateChaosTolerance(userId: number): Promise<number> {
    const result = await db.query(`
      SELECT 
        AVG(CASE WHEN ui.continued_conversation THEN 1.0 ELSE 0.0 END) as tolerance_score,
        AVG(c.chaos_level) as avg_chaos_experienced
      FROM user_interactions ui
      JOIN conversations c ON ui.conversation_id = c.id
      WHERE c.user_id = $1 AND ui.interaction_type = 'chaotic'
    `, [userId]);

    return result.rows[0]?.tolerance_score || 0.5;
  }

  private async calculateDenialEngagement(userId: number): Promise<number> {
    const result = await db.query(`
      SELECT 
        COUNT(CASE WHEN ui.continued_conversation THEN 1 END)::float / COUNT(*)::float as engagement_score
      FROM user_interactions ui
      JOIN conversations c ON ui.conversation_id = c.id
      WHERE c.user_id = $1 AND ui.interaction_type = 'denial'
    `, [userId]);

    return result.rows[0]?.engagement_score || 0.5;
  }

  private async calculateInterruptionTolerance(userId: number): Promise<number> {
    const result = await db.query(`
      SELECT 
        AVG(CASE WHEN ui.continued_conversation THEN 1.0 ELSE 0.0 END) as tolerance_score
      FROM user_interactions ui
      JOIN conversations c ON ui.conversation_id = c.id
      WHERE c.user_id = $1 AND ui.interaction_type = 'interruption'
    `, [userId]);

    return result.rows[0]?.tolerance_score || 0.5;
  }

  private async identifyHumorPreference(userId: number): Promise<string> {
    const result = await db.query(`
      SELECT 
        ui.interaction_type,
        COUNT(*) as count,
        AVG(ui.user_satisfaction_score) as avg_satisfaction
      FROM user_interactions ui
      JOIN conversations c ON ui.conversation_id = c.id
      WHERE c.user_id = $1
      GROUP BY ui.interaction_type
      ORDER BY avg_satisfaction DESC, count DESC
      LIMIT 1
    `, [userId]);

    return result.rows[0]?.interaction_type || 'mixed';
  }

  private async extractTopicPreferences(userId: number): Promise<string[]> {
    const result = await db.query(`
      SELECT DISTINCT unnest(re.context_keywords) as keyword
      FROM response_effectiveness re
      JOIN conversations c ON true
      WHERE c.user_id = $1 AND re.effectiveness_score > 0.6
      GROUP BY keyword
      HAVING COUNT(*) > 2
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `, [userId]);

    return result.rows.map(row => row.keyword);
  }

  private async findOptimalEllensSettings(userId: number): Promise<{mood: string; chaosLevel: number}> {
    const result = await db.query(`
      SELECT 
        re.mood,
        AVG(re.chaos_level) as avg_chaos_level,
        AVG(re.effectiveness_score) as avg_effectiveness
      FROM response_effectiveness re
      JOIN conversations c ON true
      WHERE c.user_id = $1
      GROUP BY re.mood
      ORDER BY avg_effectiveness DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length > 0) {
      return {
        mood: result.rows[0].mood,
        chaosLevel: Math.round(result.rows[0].avg_chaos_level)
      };
    }

    return { mood: 'chill', chaosLevel: 50 };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, you'd use NLP libraries
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common Dutch/English stop words
    const stopWords = ['deze', 'maar', 'voor', 'zijn', 'niet', 'waar', 'heeft', 'veel', 'that', 'with', 'have', 'this'];
    return words.filter(word => !stopWords.includes(word)).slice(0, 5);
  }

  // Batch processing for ML training
  async generateTrainingData(days: number = 7): Promise<any[]> {
    const conversations = await ConversationModel.getRecentConversationsForAnalysis(days * 24);
    const messages = await MessageModel.getMessagesForMLTraining(10000);
    
    // Combine and format for ML training
    return conversations.map(conv => ({
      conversationData: conv,
      messagesData: messages.filter(msg => msg.conversation_id === conv.conversation_id),
      features: {
        duration_minutes: conv.duration_minutes,
        message_count: conv.message_count,
        denial_ratio: conv.denial_count / Math.max(conv.message_count, 1),
        interruption_ratio: conv.interruption_count / Math.max(conv.message_count, 1),
        avg_chaos_level: conv.avg_chaos_level,
        final_mood: conv.ellens_mood,
        user_satisfaction: conv.duration_minutes > 5 ? 1 : 0 // Simple heuristic
      }
    }));
  }
}
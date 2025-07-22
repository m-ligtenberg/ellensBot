import { db } from '../database/connection';

export interface User {
  id: number;
  session_id: string;
  user_agent?: string;
  ip_address?: string;
  created_at: Date;
  last_active: Date;
  total_conversations: number;
  total_messages: number;
}

export interface UserProfile {
  id: number;
  user_id: number;
  average_message_length: number;
  typing_speed: number;
  conversation_duration_preference: number;
  chaos_tolerance: number;
  denial_engagement_score: number;
  interruption_tolerance: number;
  humor_preference: string;
  topic_preferences: string[];
  optimal_ellens_mood: string;
  optimal_chaos_level: number;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(sessionId: string, userAgent?: string, ipAddress?: string): Promise<User> {
    const result = await db.query(`
      INSERT INTO users (session_id, user_agent, ip_address)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [sessionId, userAgent, ipAddress]);
    
    return result.rows[0];
  }

  static async findBySessionId(sessionId: string): Promise<User | null> {
    const result = await db.query(`
      SELECT * FROM users WHERE session_id = $1
    `, [sessionId]);
    
    return result.rows[0] || null;
  }

  static async updateLastActive(userId: number): Promise<void> {
    await db.query(`
      UPDATE users 
      SET last_active = NOW() 
      WHERE id = $1
    `, [userId]);
  }

  static async incrementConversations(userId: number): Promise<void> {
    await db.query(`
      UPDATE users 
      SET total_conversations = total_conversations + 1 
      WHERE id = $1
    `, [userId]);
  }

  static async incrementMessages(userId: number, count: number = 1): Promise<void> {
    await db.query(`
      UPDATE users 
      SET total_messages = total_messages + $2 
      WHERE id = $1
    `, [userId, count]);
  }

  static async getOrCreateUser(sessionId: string, userAgent?: string, ipAddress?: string): Promise<User> {
    let user = await this.findBySessionId(sessionId);
    
    if (!user) {
      user = await this.create(sessionId, userAgent, ipAddress);
    } else {
      await this.updateLastActive(user.id);
    }
    
    return user;
  }

  static async createOrUpdateProfile(userId: number, profileData: Partial<UserProfile>): Promise<UserProfile> {
    // Check if profile exists
    const existing = await db.query(`
      SELECT * FROM user_profiles WHERE user_id = $1
    `, [userId]);

    if (existing.rows.length > 0) {
      // Update existing profile
      const updateFields = Object.keys(profileData)
        .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = Object.keys(profileData)
        .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
        .map(key => profileData[key as keyof UserProfile]);

      const result = await db.query(`
        UPDATE user_profiles 
        SET ${updateFields}, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `, [userId, ...values]);
      
      return result.rows[0];
    } else {
      // Create new profile
      const result = await db.query(`
        INSERT INTO user_profiles (
          user_id, average_message_length, typing_speed, 
          conversation_duration_preference, chaos_tolerance, 
          denial_engagement_score, interruption_tolerance,
          humor_preference, topic_preferences, optimal_ellens_mood, 
          optimal_chaos_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        userId,
        profileData.average_message_length || 50,
        profileData.typing_speed || 2.0,
        profileData.conversation_duration_preference || 10,
        profileData.chaos_tolerance || 0.5,
        profileData.denial_engagement_score || 0.5,
        profileData.interruption_tolerance || 0.5,
        profileData.humor_preference || 'mixed',
        profileData.topic_preferences || [],
        profileData.optimal_ellens_mood || 'chill',
        profileData.optimal_chaos_level || 50
      ]);
      
      return result.rows[0];
    }
  }

  static async getProfile(userId: number): Promise<UserProfile | null> {
    const result = await db.query(`
      SELECT * FROM user_profiles WHERE user_id = $1
    `, [userId]);
    
    return result.rows[0] || null;
  }

  static async getActiveUsers(hours: number = 24): Promise<User[]> {
    const result = await db.query(`
      SELECT * FROM users 
      WHERE last_active > NOW() - INTERVAL '${hours} hours'
      ORDER BY last_active DESC
    `);
    
    return result.rows;
  }

  static async getUserStats(userId: number): Promise<any> {
    const result = await db.query(`
      SELECT 
        u.*,
        COUNT(DISTINCT c.id) as conversation_count,
        COUNT(m.id) as message_count,
        AVG(c.chaos_level) as avg_chaos_level,
        AVG(c.message_count) as avg_messages_per_conversation
      FROM users u
      LEFT JOIN conversations c ON u.id = c.user_id
      LEFT JOIN messages m ON c.id = m.conversation_id AND m.sender = 'user'
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);
    
    return result.rows[0];
  }
}
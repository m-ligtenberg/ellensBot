import { db } from '../database/connection';

export interface Conversation {
  id: number;
  conversation_id: string;
  user_id: number;
  ellens_mood: string;
  chaos_level: number;
  patience: number;
  message_count: number;
  cocaine_references: number;
  interruption_count: number;
  created_at: Date;
  ended_at?: Date;
  end_reason?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: any[];
}

export class ConversationModel {
  static async create(conversationId: string, userId: number): Promise<Conversation> {
    const result = await db.query(`
      INSERT INTO conversations (conversation_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `, [conversationId, userId]);
    
    return result.rows[0];
  }

  static async findById(conversationId: string): Promise<Conversation | null> {
    const result = await db.query(`
      SELECT * FROM conversations WHERE conversation_id = $1
    `, [conversationId]);
    
    return result.rows[0] || null;
  }

  static async updateState(
    conversationId: string, 
    updates: {
      ellens_mood?: string;
      chaos_level?: number;
      patience?: number;
      message_count?: number;
      cocaine_references?: number;
      interruption_count?: number;
    }
  ): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 2;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length > 0) {
      await db.query(`
        UPDATE conversations 
        SET ${updateFields.join(', ')}
        WHERE conversation_id = $1
      `, [conversationId, ...values]);
    }
  }

  static async incrementMessageCount(conversationId: string): Promise<void> {
    await db.query(`
      UPDATE conversations 
      SET message_count = message_count + 1
      WHERE conversation_id = $1
    `, [conversationId]);
  }

  static async incrementCocaineReferences(conversationId: string): Promise<void> {
    await db.query(`
      UPDATE conversations 
      SET cocaine_references = cocaine_references + 1
      WHERE conversation_id = $1
    `, [conversationId]);
  }

  static async incrementInterruptions(conversationId: string): Promise<void> {
    await db.query(`
      UPDATE conversations 
      SET interruption_count = interruption_count + 1
      WHERE conversation_id = $1
    `, [conversationId]);
  }

  static async endConversation(conversationId: string, reason?: string): Promise<void> {
    await db.query(`
      UPDATE conversations 
      SET ended_at = NOW(), end_reason = $2
      WHERE conversation_id = $1
    `, [conversationId, reason]);
  }

  static async getWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    const result = await db.query(`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', m.message_id,
            'text', m.text,
            'sender', m.sender,
            'timestamp', m.timestamp,
            'mood', m.mood,
            'chaos_level', m.chaos_level,
            'is_interruption', m.is_interruption,
            'is_denial', m.is_denial
          ) ORDER BY m.timestamp
        ) as messages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.conversation_id = $1
      GROUP BY c.id
    `, [conversationId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const conversation = result.rows[0];
    // Filter out null messages (when no messages exist yet)
    conversation.messages = conversation.messages.filter((msg: any) => msg.id !== null);
    
    return conversation;
  }

  static async getUserConversations(userId: number, limit: number = 10): Promise<Conversation[]> {
    const result = await db.query(`
      SELECT * FROM conversations 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [userId, limit]);
    
    return result.rows;
  }

  static async getActiveConversations(): Promise<Conversation[]> {
    const result = await db.query(`
      SELECT * FROM conversations 
      WHERE ended_at IS NULL 
      AND created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
    `);
    
    return result.rows;
  }

  static async getConversationStats(conversationId: string): Promise<any> {
    const result = await db.query(`
      SELECT 
        c.*,
        COUNT(m.id) as total_messages,
        COUNT(CASE WHEN m.sender = 'user' THEN 1 END) as user_messages,
        COUNT(CASE WHEN m.sender = 'ellens' THEN 1 END) as ellens_messages,
        COUNT(CASE WHEN m.is_denial = true THEN 1 END) as denial_count,
        COUNT(CASE WHEN m.is_interruption = true THEN 1 END) as actual_interruption_count,
        AVG(m.chaos_level) as avg_chaos_level,
        EXTRACT(EPOCH FROM (MAX(m.timestamp) - MIN(m.timestamp)))/60 as duration_minutes
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.conversation_id = $1
      GROUP BY c.id
    `, [conversationId]);
    
    return result.rows[0];
  }

  static async getRecentConversationsForAnalysis(hours: number = 24, limit: number = 100): Promise<any[]> {
    const result = await db.query(`
      SELECT 
        c.*,
        u.session_id,
        COUNT(m.id) as message_count,
        COUNT(CASE WHEN m.is_denial = true THEN 1 END) as denial_count,
        COUNT(CASE WHEN m.is_interruption = true THEN 1 END) as interruption_count,
        AVG(m.chaos_level) as avg_chaos_level,
        EXTRACT(EPOCH FROM (c.ended_at - c.created_at))/60 as duration_minutes
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.created_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY c.id, u.session_id
      ORDER BY c.created_at DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  static async cleanupOldConversations(daysOld: number = 30): Promise<number> {
    const result = await db.query(`
      DELETE FROM conversations 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `);
    
    return result.rowCount || 0;
  }
}
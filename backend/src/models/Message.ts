import { db } from '../database/connection';

export interface Message {
  id: number;
  message_id: string;
  conversation_id: number;
  text: string;
  sender: 'user' | 'ellens';
  timestamp: Date;
  mood?: string;
  chaos_level?: number;
  message_length: number;
  response_time_ms?: number;
  is_interruption: boolean;
  is_denial: boolean;
  contains_cocaine_ref: boolean;
}

export class MessageModel {
  static async create(
    messageId: string,
    conversationId: number,
    text: string,
    sender: 'user' | 'ellens',
    metadata?: {
      mood?: string;
      chaos_level?: number;
      response_time_ms?: number;
      is_interruption?: boolean;
      is_denial?: boolean;
      contains_cocaine_ref?: boolean;
    }
  ): Promise<Message> {
    const messageLength = text.length;
    const isDenial = this.checkIfDenial(text);
    const containsCocaineRef = this.checkCocaineReference(text);

    const result = await db.query(`
      INSERT INTO messages (
        message_id, conversation_id, text, sender, message_length,
        mood, chaos_level, response_time_ms, is_interruption, 
        is_denial, contains_cocaine_ref
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      messageId,
      conversationId,
      text,
      sender,
      messageLength,
      metadata?.mood || null,
      metadata?.chaos_level || null,
      metadata?.response_time_ms || null,
      metadata?.is_interruption || false,
      metadata?.is_denial || isDenial,
      metadata?.contains_cocaine_ref || containsCocaineRef
    ]);
    
    return result.rows[0];
  }

  static async getConversationMessages(conversationId: number): Promise<Message[]> {
    const result = await db.query(`
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY timestamp ASC
    `, [conversationId]);
    
    return result.rows;
  }

  static async getRecentMessages(conversationId: number, limit: number = 10): Promise<Message[]> {
    const result = await db.query(`
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `, [conversationId, limit]);
    
    return result.rows.reverse(); // Return in chronological order
  }

  static async updateResponseTime(messageId: string, responseTimeMs: number): Promise<void> {
    await db.query(`
      UPDATE messages 
      SET response_time_ms = $2 
      WHERE message_id = $1
    `, [messageId, responseTimeMs]);
  }

  static async getMessageStats(conversationId: number): Promise<any> {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN sender = 'user' THEN 1 END) as user_messages,
        COUNT(CASE WHEN sender = 'ellens' THEN 1 END) as ellens_messages,
        AVG(message_length) as avg_message_length,
        AVG(CASE WHEN sender = 'user' THEN message_length END) as avg_user_message_length,
        AVG(CASE WHEN sender = 'ellens' THEN message_length END) as avg_ellens_message_length,
        AVG(response_time_ms) as avg_response_time_ms,
        COUNT(CASE WHEN is_denial = true THEN 1 END) as denial_count,
        COUNT(CASE WHEN is_interruption = true THEN 1 END) as interruption_count,
        COUNT(CASE WHEN contains_cocaine_ref = true THEN 1 END) as cocaine_ref_count
      FROM messages 
      WHERE conversation_id = $1
    `, [conversationId]);
    
    return result.rows[0];
  }

  static async getDenialMessages(conversationId: number): Promise<Message[]> {
    const result = await db.query(`
      SELECT * FROM messages 
      WHERE conversation_id = $1 AND is_denial = true
      ORDER BY timestamp ASC
    `, [conversationId]);
    
    return result.rows;
  }

  static async getInterruptionMessages(conversationId: number): Promise<Message[]> {
    const result = await db.query(`
      SELECT * FROM messages 
      WHERE conversation_id = $1 AND is_interruption = true
      ORDER BY timestamp ASC
    `, [conversationId]);
    
    return result.rows;
  }

  static async searchMessages(query: string, limit: number = 50): Promise<Message[]> {
    const result = await db.query(`
      SELECT * FROM messages 
      WHERE text ILIKE $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [`%${query}%`, limit]);
    
    return result.rows;
  }

  static async getMessagesByTimeRange(
    startDate: Date, 
    endDate: Date, 
    conversationId?: number
  ): Promise<Message[]> {
    let query = `
      SELECT * FROM messages 
      WHERE timestamp BETWEEN $1 AND $2
    `;
    const params: any[] = [startDate, endDate];
    
    if (conversationId) {
      query += ` AND conversation_id = $3`;
      params.push(conversationId);
    }
    
    query += ` ORDER BY timestamp ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Helper method to detect denial responses
  private static checkIfDenial(text: string): boolean {
    const denialPhrases = [
      'alleen me wietje',
      'alleen wat cannabis',
      'ik ben daar niet op',
      'ik ben clean',
      'never bro',
      'waarom vraagt iedereen',
      'ik gebruik niet'
    ];
    
    const lowerText = text.toLowerCase();
    return denialPhrases.some(phrase => lowerText.includes(phrase));
  }

  // Helper method to detect cocaine references
  private static checkCocaineReference(text: string): boolean {
    const cocaineKeywords = [
      'cocaine',
      'cocaïne',
      'coke',
      'drugs',
      'dealer',
      'snuiven',
      'poeder',
      'wit spul'
    ];
    
    const lowerText = text.toLowerCase();
    return cocaineKeywords.some(keyword => lowerText.includes(keyword));
  }

  // Analytics method for ML training
  static async getMessagesForMLTraining(limit: number = 1000): Promise<any[]> {
    const result = await db.query(`
      SELECT 
        m.*,
        c.conversation_id,
        c.ellens_mood,
        c.chaos_level as conversation_chaos_level,
        u.session_id,
        LAG(m.text) OVER (PARTITION BY m.conversation_id ORDER BY m.timestamp) as previous_message,
        LEAD(m.text) OVER (PARTITION BY m.conversation_id ORDER BY m.timestamp) as next_message
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE m.timestamp > NOW() - INTERVAL '7 days'
      ORDER BY m.timestamp DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  static async cleanupOldMessages(daysOld: number = 90): Promise<number> {
    const result = await db.query(`
      DELETE FROM messages 
      WHERE timestamp < NOW() - INTERVAL '${daysOld} days'
    `);
    
    return result.rowCount || 0;
  }
}
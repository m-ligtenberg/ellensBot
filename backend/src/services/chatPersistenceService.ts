import { UserModel } from '../models/User';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { MLService } from './mlService';
import { EllensPersonalityState, EllensResponse } from './personalityEngine';

interface ChatSession {
  userId: number;
  conversationId: string;
  conversationDbId: number;
  startTime: Date;
  lastMessageTime: Date;
}

export class ChatPersistenceService {
  private mlService: MLService;
  private activeSessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.mlService = new MLService();
  }

  // Initialize a new chat session with database persistence
  async initializeSession(
    socketId: string, 
    sessionId: string, 
    conversationId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<ChatSession> {
    try {
      // Get or create user
      const user = await UserModel.getOrCreateUser(sessionId, userAgent, ipAddress);
      
      // Create conversation record
      const conversation = await ConversationModel.create(conversationId, user.id);
      
      // Update user stats
      await UserModel.incrementConversations(user.id);

      const session: ChatSession = {
        userId: user.id,
        conversationId: conversationId,
        conversationDbId: conversation.id,
        startTime: new Date(),
        lastMessageTime: new Date()
      };

      this.activeSessions.set(socketId, session);
      
      console.log(`📚 Initialized persistent session for user ${user.id}, conversation ${conversationId}`);
      return session;
    } catch (error) {
      console.error('Failed to initialize persistent session:', error);
      throw error;
    }
  }

  // Save user message to database
  async saveUserMessage(
    socketId: string, 
    messageId: string, 
    text: string, 
    responseTimeMs?: number
  ): Promise<void> {
    const session = this.activeSessions.get(socketId);
    if (!session) return;

    try {
      await MessageModel.create(
        messageId,
        session.conversationDbId,
        text,
        'user',
        { response_time_ms: responseTimeMs }
      );

      // Update session stats
      await ConversationModel.incrementMessageCount(session.conversationId);
      await UserModel.incrementMessages(session.userId);
      
      // Check for cocaine references
      if (this.containsCocaineReference(text)) {
        await ConversationModel.incrementCocaineReferences(session.conversationId);
      }

      session.lastMessageTime = new Date();
    } catch (error) {
      console.error('Failed to save user message:', error);
    }
  }

  // Save Ellens response to database with ML tracking
  async saveEllensResponse(
    socketId: string, 
    messageId: string, 
    response: EllensResponse,
    personalityState: EllensPersonalityState
  ): Promise<void> {
    const session = this.activeSessions.get(socketId);
    if (!session) return;

    try {
      // Save message to database
      await MessageModel.create(
        messageId,
        session.conversationDbId,
        response.text,
        'ellens',
        {
          mood: response.mood,
          chaos_level: response.chaosLevel,
          is_interruption: response.shouldInterrupt || false,
          is_denial: this.isDeinalResponse(response.text),
          contains_cocaine_ref: this.containsCocaineReference(response.text)
        }
      );

      // Update conversation state
      await ConversationModel.updateState(session.conversationId, {
        ellens_mood: response.mood,
        chaos_level: response.chaosLevel,
        patience: personalityState.patience,
        message_count: personalityState.messageCount
      });

      if (response.shouldInterrupt) {
        await ConversationModel.incrementInterruptions(session.conversationId);
      }

      // Record ML data
      await this.recordMLData(session, response, personalityState);

      session.lastMessageTime = new Date();
    } catch (error) {
      console.error('Failed to save Ellens response:', error);
    }
  }

  // End conversation and record final analytics
  async endConversation(socketId: string, reason?: string): Promise<void> {
    const session = this.activeSessions.get(socketId);
    if (!session) return;

    try {
      // Mark conversation as ended
      await ConversationModel.endConversation(session.conversationId, reason);
      
      // Update user profile based on this conversation
      await this.mlService.updateUserProfile(session.userId);
      
      // Record session analytics
      await this.recordSessionAnalytics(session);

      console.log(`📚 Ended persistent session: ${session.conversationId} (${reason})`);
      this.activeSessions.delete(socketId);
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  }

  // Get conversation history for a user
  async getConversationHistory(conversationId: string): Promise<any> {
    try {
      return await ConversationModel.getWithMessages(conversationId);
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return null;
    }
  }

  // Get user's optimal settings based on ML analysis
  async getUserOptimalSettings(sessionId: string): Promise<{
    mood: string;
    chaosLevel: number;
    interruptionChance: number;
  } | null> {
    try {
      const user = await UserModel.findBySessionId(sessionId);
      if (!user) return null;

      return await this.mlService.getOptimalResponseSettings(user.id);
    } catch (error) {
      console.error('Failed to get user optimal settings:', error);
      return null;
    }
  }

  // Record ML training data
  private async recordMLData(
    session: ChatSession, 
    response: EllensResponse, 
    personalityState: EllensPersonalityState
  ): Promise<void> {
    try {
      const responseType = this.classifyResponse(response);
      const contextKeywords = this.extractKeywords(response.text);
      
      // Record response effectiveness (we'll update this when we get user reaction)
      await this.mlService.recordResponseEffectiveness({
        responseType,
        userReaction: 'neutral', // Will be updated based on user's continued engagement
        contextKeywords,
        effectivenessScore: 0.5, // Neutral until we see user reaction
        chaosLevel: response.chaosLevel || 50,
        mood: response.mood,
        conversationLength: personalityState.messageCount
      });

      // Update conversation patterns
      if (response.shouldInterrupt) {
        await this.mlService.updateConversationPattern(
          'interruption',
          response.text,
          true, // We'll measure success by continued conversation
          response.chaosLevel || 50,
          response.mood,
          personalityState.messageCount
        );
      }

      if (this.isDeinalResponse(response.text)) {
        await this.mlService.updateConversationPattern(
          'denial',
          response.text,
          true,
          response.chaosLevel || 50,
          response.mood,
          personalityState.messageCount
        );
      }
    } catch (error) {
      console.error('Failed to record ML data:', error);
    }
  }

  // Record session analytics for ML training
  private async recordSessionAnalytics(session: ChatSession): Promise<void> {
    try {
      const stats = await ConversationModel.getConversationStats(session.conversationId);
      const sessionDuration = (session.lastMessageTime.getTime() - session.startTime.getTime()) / 1000 / 60; // minutes

      // Simple heuristic: longer conversations = higher satisfaction
      const satisfactionScore = Math.min(1.0, sessionDuration / 15); // Max satisfaction at 15+ minutes

      // Record interaction for ML
      await this.mlService.recordUserInteraction(
        session.conversationDbId,
        stats.avg_message_length || 50,
        sessionDuration * 60 * 1000, // Convert to ms
        sessionDuration > 5 ? 'positive' : sessionDuration > 1 ? 'neutral' : 'negative',
        'conversation'
      );
    } catch (error) {
      console.error('Failed to record session analytics:', error);
    }
  }

  // Get session by socket ID
  getSession(socketId: string): ChatSession | undefined {
    return this.activeSessions.get(socketId);
  }

  // Cleanup inactive sessions
  cleanupInactiveSessions(maxAgeMinutes: number = 30): number {
    const now = new Date();
    let cleaned = 0;

    for (const [socketId, session] of this.activeSessions.entries()) {
      const ageMinutes = (now.getTime() - session.lastMessageTime.getTime()) / 1000 / 60;
      
      if (ageMinutes > maxAgeMinutes) {
        this.endConversation(socketId, 'timeout');
        cleaned++;
      }
    }

    return cleaned;
  }

  // Helper methods
  private containsCocaineReference(text: string): boolean {
    const keywords = ['cocaine', 'cocaïne', 'coke', 'drugs', 'dealer', 'snuiven', 'poeder'];
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  private isDeinalResponse(text: string): boolean {
    const denialPhrases = ['alleen me wietje', 'ik ben daar niet op', 'ik ben clean', 'never bro'];
    const lowerText = text.toLowerCase();
    return denialPhrases.some(phrase => lowerText.includes(phrase));
  }

  private classifyResponse(response: EllensResponse): string {
    if (response.shouldInterrupt) return 'interruption';
    if (this.isDeinalResponse(response.text)) return 'denial';
    if (response.mood === 'chaotic') return 'chaotic';
    if (response.mood === 'done') return 'boredom';
    return 'normal';
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }
}

// Export singleton
export const chatPersistence = new ChatPersistenceService();
// Conversation Context Memory System for enhanced AI responses

export interface ConversationContext {
  userId: string;
  conversationId: string;
  
  // Topic tracking
  mentionedTopics: Set<string>;
  currentTopic?: string;
  topicTransitions: Array<{ from: string; to: string; timestamp: Date }>;
  
  // Drug reference tracking for personality consistency
  drugMentions: number;
  denialCount: number;
  lastDenialTopic?: string;
  
  // User behavior patterns
  messageLength: number[];
  responsePatterns: Array<{ userMessage: string; ellensResponse: string; effectiveness: number }>;
  
  // Personality state memory
  maxChaosReached: number;
  interruptionHistory: Array<{ trigger: string; response: string; timestamp: Date }>;
  boredomTriggers: string[];
  
  // Long-term memory (things Ellens should "remember")
  userPreferences: Map<string, any>;
  pastConversationSummary?: string;
  
  // Context freshness
  lastUpdated: Date;
  messagesSinceLastUpdate: number;
}

export class ConversationContextMemory {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly MAX_CONTEXTS = 1000; // Limit memory usage
  private readonly CONTEXT_EXPIRY_HOURS = 24;
  
  // Initialize or get existing context
  getOrCreateContext(userId: string, conversationId: string): ConversationContext {
    const key = `${userId}-${conversationId}`;
    
    if (!this.contexts.has(key)) {
      const newContext: ConversationContext = {
        userId,
        conversationId,
        mentionedTopics: new Set(),
        topicTransitions: [],
        drugMentions: 0,
        denialCount: 0,
        messageLength: [],
        responsePatterns: [],
        maxChaosReached: 0,
        interruptionHistory: [],
        boredomTriggers: [],
        userPreferences: new Map(),
        lastUpdated: new Date(),
        messagesSinceLastUpdate: 0
      };
      
      this.contexts.set(key, newContext);
      this.cleanupOldContexts(); // Prevent memory leaks
    }
    
    return this.contexts.get(key)!;
  }

  // Update context with new message information
  updateContext(
    userId: string, 
    conversationId: string, 
    userMessage: string, 
    ellensResponse: string,
    mood: string,
    chaosLevel: number
  ): void {
    const context = this.getOrCreateContext(userId, conversationId);
    
    // Update basic tracking
    context.lastUpdated = new Date();
    context.messagesSinceLastUpdate++;
    context.messageLength.push(userMessage.length);
    
    // Keep only last 20 message lengths for efficiency
    if (context.messageLength.length > 20) {
      context.messageLength = context.messageLength.slice(-20);
    }
    
    // Track topics mentioned
    const detectedTopics = this.extractTopics(userMessage);
    const previousTopic = context.currentTopic;
    
    detectedTopics.forEach(topic => {
      context.mentionedTopics.add(topic);
      
      // Track topic transitions
      if (previousTopic && previousTopic !== topic) {
        context.topicTransitions.push({
          from: previousTopic,
          to: topic,
          timestamp: new Date()
        });
      }
      
      context.currentTopic = topic;
    });
    
    // Track drug mentions and denials
    if (this.containsDrugReference(userMessage)) {
      context.drugMentions++;
    }
    
    if (this.isDenialResponse(ellensResponse)) {
      context.denialCount++;
      context.lastDenialTopic = context.currentTopic;
    }
    
    // Track chaos levels
    if (chaosLevel > context.maxChaosReached) {
      context.maxChaosReached = chaosLevel;
    }
    
    // Track boredom patterns
    if (mood === 'done') {
      context.boredomTriggers.push(userMessage.toLowerCase());
    }
    
    // Store response pattern for learning
    context.responsePatterns.push({
      userMessage,
      ellensResponse,
      effectiveness: this.calculateResponseEffectiveness(userMessage, ellensResponse)
    });
    
    // Keep only last 10 patterns for efficiency
    if (context.responsePatterns.length > 10) {
      context.responsePatterns = context.responsePatterns.slice(-10);
    }
    
    // Extract user preferences
    this.updateUserPreferences(context, userMessage);
  }

  // Generate enhanced system prompt with context
  generateContextualPrompt(
    userId: string, 
    conversationId: string, 
    basePrompt: string
  ): string {
    const context = this.getOrCreateContext(userId, conversationId);
    
    let contextualAdditions = [];
    
    // Add conversation history context
    if (context.mentionedTopics.size > 0) {
      const topics = Array.from(context.mentionedTopics).slice(-5); // Last 5 topics
      contextualAdditions.push(
        `In this conversation we've discussed: ${topics.join(', ')}.`
      );
    }
    
    // Add drug denial context
    if (context.drugMentions > 0) {
      contextualAdditions.push(
        `The user has mentioned drugs ${context.drugMentions} times. You've denied it ${context.denialCount} times.` +
        ` Stay consistent with your denials but maybe add some variety or get slightly annoyed if asked repeatedly.`
      );
    }
    
    // Add personality state context
    if (context.maxChaosReached > 80) {
      contextualAdditions.push(
        `You've been very chaotic in this conversation (chaos level ${context.maxChaosReached}). ` +
        `The user seems to handle your chaos well, so you can be more wild if needed.`
      );
    }
    
    // Add user preference context
    if (context.userPreferences.size > 0) {
      const prefs = Array.from(context.userPreferences.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      contextualAdditions.push(
        `User seems to prefer talking about: ${prefs}.`
      );
    }
    
    // Add boredom context
    if (context.boredomTriggers.length > 2) {
      contextualAdditions.push(
        `You get bored when users talk about: ${context.boredomTriggers.slice(-3).join(', ')}. ` +
        `Show less patience with these topics.`
      );
    }
    
    // Add interruption context
    if (context.interruptionHistory.length > 0) {
      const recentInterruptions = context.interruptionHistory.slice(-2);
      contextualAdditions.push(
        `You've interrupted recently. Don't interrupt too frequently unless chaos is very high.`
      );
    }
    
    if (contextualAdditions.length > 0) {
      return `${basePrompt}\n\nCONVERSATION CONTEXT:\n${contextualAdditions.join(' ')}`;
    }
    
    return basePrompt;
  }

  // Get conversation insights for analytics
  getConversationInsights(userId: string, conversationId: string): any {
    const context = this.getOrCreateContext(userId, conversationId);
    
    return {
      topicDiversity: context.mentionedTopics.size,
      avgMessageLength: context.messageLength.length > 0 
        ? context.messageLength.reduce((a, b) => a + b, 0) / context.messageLength.length 
        : 0,
      drugEngagementRatio: context.drugMentions > 0 
        ? context.denialCount / context.drugMentions 
        : 0,
      maxChaosReached: context.maxChaosReached,
      conversationLength: context.messagesSinceLastUpdate,
      dominantTopics: this.getDominantTopics(context),
      userEngagementPattern: this.analyzeEngagementPattern(context)
    };
  }

  // Private helper methods
  private extractTopics(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const topics = [];
    
    // Music topics
    if (/\b(muziek|rap|track|beat|studio|song|album)\b/.test(lowerMessage)) {
      topics.push('music');
    }
    
    // Drug topics  
    if (/\b(drugs?|cocaïne|cocaine|dealer|snuiven|poeder)\b/.test(lowerMessage)) {
      topics.push('drugs');
    }
    
    // Lifestyle topics
    if (/\b(leven|lifestyle|party|uitgaan|friends)\b/.test(lowerMessage)) {
      topics.push('lifestyle');
    }
    
    // Money topics
    if (/\b(geld|money|verdienen|rijk|arm|cash)\b/.test(lowerMessage)) {
      topics.push('money');
    }
    
    // Personal topics
    if (/\b(familie|family|vrienden|relationship|love)\b/.test(lowerMessage)) {
      topics.push('personal');
    }
    
    return topics;
  }

  private containsDrugReference(message: string): boolean {
    const drugTerms = [
      'cocaine', 'cocaïne', 'drugs', 'dealer', 'snuiven', 'poeder', 
      'wit spul', 'charlie', 'blow', 'coke'
    ];
    const lowerMessage = message.toLowerCase();
    return drugTerms.some(term => lowerMessage.includes(term));
  }

  private isDenialResponse(response: string): boolean {
    const denialPhrases = [
      'alleen me wietje', 'ben daar niet op', 'ik ben clean', 
      'never bro', 'doe ik niet', 'niet mijn ding'
    ];
    const lowerResponse = response.toLowerCase();
    return denialPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  private calculateResponseEffectiveness(userMessage: string, ellensResponse: string): number {
    // Simple heuristic - can be improved with ML later
    let score = 0.5; // neutral
    
    // Longer responses generally more engaging
    if (ellensResponse.length > 50) score += 0.1;
    if (ellensResponse.length > 100) score += 0.1;
    
    // Responses with emojis more engaging  
    if (/[\u{1F600}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(ellensResponse)) score += 0.1;
    
    // Questions engage users more
    if (ellensResponse.includes('?')) score += 0.15;
    
    // Dutch slang authenticity
    if (/\b(bro|man|yo|snap je|je weet)\b/.test(ellensResponse.toLowerCase())) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private updateUserPreferences(context: ConversationContext, userMessage: string): void {
    const topics = this.extractTopics(userMessage);
    
    topics.forEach(topic => {
      const current = context.userPreferences.get(topic) || 0;
      context.userPreferences.set(topic, current + 1);
    });
    
    // Message length preference
    const avgLength = context.messageLength.length > 0 
      ? context.messageLength.reduce((a, b) => a + b, 0) / context.messageLength.length 
      : 0;
    context.userPreferences.set('message_length', avgLength);
  }

  private getDominantTopics(context: ConversationContext): string[] {
    const topicCounts = new Map<string, number>();
    
    // Count topic mentions from transitions
    context.topicTransitions.forEach(transition => {
      topicCounts.set(transition.to, (topicCounts.get(transition.to) || 0) + 1);
    });
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  private analyzeEngagementPattern(context: ConversationContext): string {
    const avgLength = context.messageLength.length > 0 
      ? context.messageLength.reduce((a, b) => a + b, 0) / context.messageLength.length 
      : 0;
    
    if (avgLength > 100) return 'detailed';
    if (avgLength > 50) return 'moderate';
    return 'brief';
  }

  private cleanupOldContexts(): void {
    if (this.contexts.size <= this.MAX_CONTEXTS) return;
    
    const now = new Date();
    const expireTime = this.CONTEXT_EXPIRY_HOURS * 60 * 60 * 1000;
    
    for (const [key, context] of this.contexts.entries()) {
      if (now.getTime() - context.lastUpdated.getTime() > expireTime) {
        this.contexts.delete(key);
      }
    }
    
    // If still too many, remove oldest
    if (this.contexts.size > this.MAX_CONTEXTS) {
      const sortedEntries = Array.from(this.contexts.entries())
        .sort((a, b) => a[1].lastUpdated.getTime() - b[1].lastUpdated.getTime());
      
      const toRemove = sortedEntries.slice(0, this.contexts.size - this.MAX_CONTEXTS);
      toRemove.forEach(([key]) => this.contexts.delete(key));
    }
  }

  // Public methods for analytics
  getAllContexts(): ConversationContext[] {
    return Array.from(this.contexts.values());
  }

  getContextStats(): any {
    const contexts = this.getAllContexts();
    
    return {
      totalActiveContexts: contexts.length,
      avgConversationLength: contexts.reduce((sum, ctx) => sum + ctx.messagesSinceLastUpdate, 0) / contexts.length,
      totalDrugMentions: contexts.reduce((sum, ctx) => sum + ctx.drugMentions, 0),
      totalDenials: contexts.reduce((sum, ctx) => sum + ctx.denialCount, 0),
      avgChaosLevel: contexts.reduce((sum, ctx) => sum + ctx.maxChaosReached, 0) / contexts.length,
      mostDiscussedTopics: this.getMostDiscussedTopics(contexts)
    };
  }

  private getMostDiscussedTopics(contexts: ConversationContext[]): string[] {
    const allTopics = new Map<string, number>();
    
    contexts.forEach(ctx => {
      ctx.mentionedTopics.forEach(topic => {
        allTopics.set(topic, (allTopics.get(topic) || 0) + 1);
      });
    });
    
    return Array.from(allTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }
}

// Export singleton
export const contextMemory = new ConversationContextMemory();
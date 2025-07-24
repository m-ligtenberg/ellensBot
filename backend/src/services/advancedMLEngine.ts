import { Database } from '../database/connection';
import { mlPatternOptimizer } from './mlPatternOptimizer';

export interface LanguageProfile {
  id: string;
  name: string;
  description: string;
  vocabulary: {
    streetTerms: string[];
    fillerWords: string[];
    exclamations: string[];
    denialPhrases: string[];
    knowledgeSlips: string[];
  };
  grammarPatterns: {
    sentenceStructure: string[];
    wordOrder: 'standard' | 'inverted' | 'flexible';
    contractions: boolean;
    slangLevel: number; // 0-10
  };
  culturalContext: {
    region: string;
    ageGroup: string;
    socialBackground: string;
    musicInfluence: string[];
  };
  personalityWeights: {
    chaos: number;
    denial: number;
    streetCredibility: number;
    humor: number;
    aggression: number;
    friendliness: number;
  };
}

export interface ConversationFlow {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  responses: {
    opening: string[];
    middle: string[];
    escalation: string[];
    deescalation: string[];
    closing: string[];
  };
  transitions: {
    fromState: string;
    toState: string;
    condition: string;
    probability: number;
  }[];
  effectiveness: number;
  userSatisfaction: number;
}

export interface UserEngagementModel {
  userId: string;
  engagementScore: number;
  preferredLanguageProfile: string;
  conversationStyle: 'direct' | 'playful' | 'chaotic' | 'calm';
  topicInterests: string[];
  responseTimePreference: number; // milliseconds
  chaosToleranceLevel: number; // 0-1
  humorAppreciation: number; // 0-1
  culturalAlignment: number; // 0-1
  predictedRetention: number; // 0-1
}

export class AdvancedMLEngine {
  private static instance: AdvancedMLEngine;
  private db: Database;
  private languageProfiles: Map<string, LanguageProfile> = new Map();
  private conversationFlows: Map<string, ConversationFlow> = new Map();
  private userModels: Map<string, UserEngagementModel> = new Map();
  private learningEnabled: boolean = true;

  private constructor() {
    this.db = Database.getInstance();
    this.initializeDefaultProfiles();
    this.startContinuousLearning();
  }

  public static getInstance(): AdvancedMLEngine {
    if (!AdvancedMLEngine.instance) {
      AdvancedMLEngine.instance = new AdvancedMLEngine();
    }
    return AdvancedMLEngine.instance;
  }

  private initializeDefaultProfiles(): void {
    // Amsterdam Street Dutch Profile
    const amsterdamProfile: LanguageProfile = {
      id: 'amsterdam_street',
      name: 'Amsterdam Street Dutch',
      description: 'Authentic Amsterdam street language with heavy slang',
      vocabulary: {
        streetTerms: ['mattie', 'sahbi', 'akhie', 'wallah', 'damsko', 'dammie', 'mocro', 'faka'],
        fillerWords: ['zo', 'ofzo', 'gewoon', 'man', 'bro', 'ouwe'],
        exclamations: ['yo!', 'wollah!', 'ewa!', 'faka!', 'check!'],
        denialPhrases: [
          'Nooo man ik ben daar niet op, alleen me wietje en me henny',
          'Wallah ik doe dat niet, alleen cannabis en hennessy',
          'Sahbi, ik ben clean! Alleen me groene en me drank'
        ],
        knowledgeSlips: [
          'Een vriend van me zei dat de kwaliteit tegenwoordig...',
          'Niet dat ik het gebruik maar ik hoor wel verhalen...',
          'In Amsterdam centrum wordt er wel eens...'
        ]
      },
      grammarPatterns: {
        sentenceStructure: ['Subject-Verb-Object', 'Verb-Subject-Object', 'Object-Verb-Subject'],
        wordOrder: 'flexible',
        contractions: true,
        slangLevel: 9
      },
      culturalContext: {
        region: 'Amsterdam',
        ageGroup: 'young_adult',
        socialBackground: 'street',
        musicInfluence: ['drill', 'trap', 'nederhop']
      },
      personalityWeights: {
        chaos: 0.8,
        denial: 0.9,
        streetCredibility: 0.95,
        humor: 0.7,
        aggression: 0.3,
        friendliness: 0.6
      }
    };

    // Standard Dutch Profile
    const standardProfile: LanguageProfile = {
      id: 'standard_dutch',
      name: 'Standard Dutch',
      description: 'More formal Dutch with occasional slang',
      vocabulary: {
        streetTerms: ['man', 'dude', 'gast', 'kerel'],
        fillerWords: ['eigenlijk', 'dus', 'nou', 'eh'],
        exclamations: ['wow!', 'echt waar!', 'nice!'],
        denialPhrases: [
          'Nee, ik gebruik geen drugs, alleen wiet en alcohol',
          'Ik ben daar niet mee bezig, alleen cannabis',
          'Dat doe ik niet, alleen wat joints'
        ],
        knowledgeSlips: [
          'Iemand vertelde me dat...',
          'Ik heb wel eens gehoord dat...',
          'Blijkbaar is het zo dat...'
        ]
      },
      grammarPatterns: {
        sentenceStructure: ['Subject-Verb-Object'],
        wordOrder: 'standard',
        contractions: false,
        slangLevel: 3
      },
      culturalContext: {
        region: 'Netherlands',
        ageGroup: 'general',
        socialBackground: 'mainstream',
        musicInfluence: ['pop', 'rock', 'electronic']
      },
      personalityWeights: {
        chaos: 0.4,
        denial: 0.7,
        streetCredibility: 0.3,
        humor: 0.8,
        aggression: 0.1,
        friendliness: 0.9
      }
    };

    this.languageProfiles.set('amsterdam_street', amsterdamProfile);
    this.languageProfiles.set('standard_dutch', standardProfile);

    console.log('🧠 Advanced ML Engine initialized with language profiles');
  }

  // Real-time language adaptation
  public async adaptLanguageToUser(userId: string, conversationHistory: string[]): Promise<LanguageProfile> {
    const userModel = await this.getUserEngagementModel(userId);
    
    if (!userModel) {
      return this.languageProfiles.get('amsterdam_street')!; // Default
    }

    // Analyze user's language preferences from conversation
    const languageAnalysis = await this.analyzeUserLanguagePreferences(conversationHistory);
    
    // Select or create optimal language profile
    let optimalProfile = this.languageProfiles.get(userModel.preferredLanguageProfile);
    
    if (!optimalProfile) {
      optimalProfile = await this.generateCustomLanguageProfile(userId, languageAnalysis);
    }

    // Fine-tune the profile based on recent interactions
    return await this.fineTuneProfile(optimalProfile, languageAnalysis, userModel);
  }

  private async analyzeUserLanguagePreferences(history: string[]): Promise<any> {
    const analysis = {
      slangUsage: 0,
      formalityLevel: 0,
      responseLength: 0,
      emotionalTone: 'neutral',
      culturalReferences: [],
      preferredTerms: []
    };

    if (history.length === 0) return analysis;

    const allText = history.join(' ').toLowerCase();
    const words = allText.split(/\s+/);

    // Analyze slang usage
    const slangWords = ['yo', 'bro', 'man', 'mattie', 'sahbi', 'wallah', 'faka'];
    const slangCount = words.filter(word => slangWords.includes(word)).length;
    analysis.slangUsage = slangCount / words.length;

    // Analyze formality
    const formalWords = ['alstublieft', 'dank u wel', 'meneer', 'mevrouw'];
    const formalCount = words.filter(word => formalWords.includes(word)).length;
    analysis.formalityLevel = formalCount / words.length;

    // Average response length
    analysis.responseLength = words.length / history.length;

    // Detect emotional tone
    const positiveWords = ['cool', 'nice', 'goed', 'leuk', 'top'];
    const negativeWords = ['slecht', 'kut', 'irritant', 'dom'];
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) analysis.emotionalTone = 'positive';
    else if (negativeCount > positiveCount) analysis.emotionalTone = 'negative';

    return analysis;
  }

  private async generateCustomLanguageProfile(userId: string, analysis: any): Promise<LanguageProfile> {
    const baseProfile = this.languageProfiles.get('amsterdam_street')!;
    
    const customProfile: LanguageProfile = {
      ...baseProfile,
      id: `custom_${userId}`,
      name: `Custom Profile for User ${userId.substring(0, 8)}`,
      description: 'Dynamically generated profile based on user interactions'
    };

    // Adjust slang level based on user's usage
    customProfile.grammarPatterns.slangLevel = Math.round(analysis.slangUsage * 10);

    // Adjust personality weights based on emotional tone
    if (analysis.emotionalTone === 'positive') {
      customProfile.personalityWeights.friendliness += 0.2;
      customProfile.personalityWeights.humor += 0.1;
    } else if (analysis.emotionalTone === 'negative') {
      customProfile.personalityWeights.aggression += 0.1;
      customProfile.personalityWeights.chaos += 0.1;
    }

    // Store the custom profile
    this.languageProfiles.set(customProfile.id, customProfile);

    return customProfile;
  }

  private async fineTuneProfile(profile: LanguageProfile, analysis: any, userModel: UserEngagementModel): Promise<LanguageProfile> {
    const tunedProfile = { ...profile };

    // Adjust based on user's chaos tolerance
    tunedProfile.personalityWeights.chaos *= userModel.chaosToleranceLevel;

    // Adjust humor level
    tunedProfile.personalityWeights.humor *= userModel.humorAppreciation;

    // Adapt vocabulary based on user preferences
    if (analysis.slangUsage > 0.3) {
      // User likes slang, enhance street terms
      tunedProfile.vocabulary.streetTerms = [
        ...tunedProfile.vocabulary.streetTerms,
        'ewa', 'tatta', 'bloedja', 'dikkie'
      ];
    }

    return tunedProfile;
  }

  // Advanced conversation flow optimization
  public async optimizeConversationFlow(userId: string, context: any): Promise<ConversationFlow> {
    const userModel = await this.getUserEngagementModel(userId);
    
    // Select optimal conversation flow based on user preferences
    let optimalFlow = Array.from(this.conversationFlows.values())
      .sort((a, b) => b.effectiveness - a.effectiveness)[0];

    if (!optimalFlow) {
      optimalFlow = await this.generateDefaultConversationFlow();
    }

    // Personalize the flow for this user
    return await this.personalizeConversationFlow(optimalFlow, userModel, context);
  }

  private async generateDefaultConversationFlow(): Promise<ConversationFlow> {
    const defaultFlow: ConversationFlow = {
      id: 'young_ellens_default',
      name: 'Young Ellens Default Flow',
      description: 'Standard conversation flow with denial patterns',
      triggers: ['drugs', 'cocaine', 'wiet', 'henny'],
      responses: {
        opening: [
          'Yo wat is er mattie?',
          'Ewa sahbi, alles goed?',
          'Faka bro, wat moet je weten?'
        ],
        middle: [
          'Alleen me wietje en me henny zoals altijd',
          'Ik ben daar niet op wallah',
          'Check, ik doe dat niet'
        ],
        escalation: [
          'Waarom denkt iedereen dat?',
          'Ik ben clean sahbi!',
          'WACHT EFFE, wat zeg je nu?'
        ],
        deescalation: [
          'Oke chill man, rustig aan',
          'We kunnen gewoon praten ofzo',
          'Geen stress mattie'
        ],
        closing: [
          'Oke ik ga weer, later',
          'Check je later sahbi',
          'Ewa, tot de volgende'
        ]
      },
      transitions: [
        { fromState: 'opening', toState: 'middle', condition: 'normal', probability: 0.7 },
        { fromState: 'middle', toState: 'escalation', condition: 'drug_mention', probability: 0.8 },
        { fromState: 'escalation', toState: 'deescalation', condition: 'chaos_high', probability: 0.6 }
      ],
      effectiveness: 0.75,
      userSatisfaction: 0.8
    };

    this.conversationFlows.set(defaultFlow.id, defaultFlow);
    return defaultFlow;
  }

  private async personalizeConversationFlow(flow: ConversationFlow, userModel: UserEngagementModel | null, context: any): Promise<ConversationFlow> {
    if (!userModel) return flow;

    const personalizedFlow = { ...flow };

    // Adjust responses based on user's conversation style
    if (userModel.conversationStyle === 'direct') {
      personalizedFlow.responses.opening = [
        'Wat wil je weten?',
        'Zeg het maar',
        'Ik luister'
      ];
    } else if (userModel.conversationStyle === 'playful') {
      personalizedFlow.responses.opening = [
        'Heyyyy wat is er? 😎',
        'Ewa mattie, ready voor een goed gesprek?',
        'Yooo sahbi, let\'s go! 🚀'
      ];
    }

    // Adjust chaos level based on user tolerance
    if (userModel.chaosToleranceLevel < 0.3) {
      // Reduce chaotic responses
      personalizedFlow.responses.escalation = personalizedFlow.responses.escalation.filter(r => 
        !r.includes('WACHT EFFE') && !r.includes('!')
      );
    }

    return personalizedFlow;
  }

  // User engagement prediction and modeling
  public async updateUserEngagementModel(userId: string, interaction: any): Promise<void> {
    let userModel = this.userModels.get(userId);

    if (!userModel) {
      userModel = {
        userId,
        engagementScore: 0.5,
        preferredLanguageProfile: 'amsterdam_street',
        conversationStyle: 'playful',
        topicInterests: [],
        responseTimePreference: 2000,
        chaosToleranceLevel: 0.7,
        humorAppreciation: 0.8,
        culturalAlignment: 0.6,
        predictedRetention: 0.5
      };
    }

    // Update engagement score based on interaction
    const engagementDelta = this.calculateEngagementDelta(interaction);
    userModel.engagementScore = Math.max(0, Math.min(1, userModel.engagementScore + engagementDelta));

    // Update conversation style based on recent interactions
    userModel.conversationStyle = this.predictConversationStyle(interaction);

    // Update chaos tolerance
    if (interaction.chaosLevel && interaction.userReaction) {
      if (interaction.userReaction === 'positive' && interaction.chaosLevel > 70) {
        userModel.chaosToleranceLevel = Math.min(1, userModel.chaosToleranceLevel + 0.05);
      } else if (interaction.userReaction === 'negative' && interaction.chaosLevel > 70) {
        userModel.chaosToleranceLevel = Math.max(0, userModel.chaosToleranceLevel - 0.05);
      }
    }

    // Update retention prediction
    userModel.predictedRetention = await this.predictUserRetention(userModel, interaction);

    this.userModels.set(userId, userModel);

    // Persist to database
    await this.saveUserEngagementModel(userModel);
  }

  private calculateEngagementDelta(interaction: any): number {
    let delta = 0;

    // Positive indicators
    if (interaction.userReaction === 'positive') delta += 0.1;
    if (interaction.continuedConversation) delta += 0.05;
    if (interaction.responseTime < 3000) delta += 0.02; // Quick responses indicate engagement

    // Negative indicators
    if (interaction.userReaction === 'negative') delta -= 0.1;
    if (interaction.leftConversation) delta -= 0.2;
    if (interaction.responseTime > 10000) delta -= 0.05; // Slow responses indicate disengagement

    return delta;
  }

  private predictConversationStyle(interaction: any): 'direct' | 'playful' | 'chaotic' | 'calm' {
    // Simple heuristic - in production this would use ML
    if (interaction.messageLength < 20) return 'direct';
    if (interaction.emojiCount > 2) return 'playful';
    if (interaction.chaosLevel > 80) return 'chaotic';
    return 'calm';
  }

  private async predictUserRetention(userModel: UserEngagementModel, interaction: any): Promise<number> {
    // Weighted factors for retention prediction
    const factors = {
      engagement: userModel.engagementScore * 0.3,
      chaosCompatibility: (1 - Math.abs(userModel.chaosToleranceLevel - 0.7)) * 0.2,
      culturalAlignment: userModel.culturalAlignment * 0.2,
      conversationLength: Math.min(1, interaction.conversationLength / 20) * 0.15,
      responseConsistency: Math.min(1, interaction.responseCount / 10) * 0.15
    };

    return Object.values(factors).reduce((sum, factor) => sum + factor, 0);
  }

  // Dynamic vocabulary expansion
  public async expandVocabulary(content: string, source: string): Promise<void> {
    const words = this.extractNewVocabulary(content);
    
    for (const word of words) {
      await this.analyzeAndCategorizeWord(word, source);
    }
  }

  private extractNewVocabulary(content: string): string[] {
    const words = content.toLowerCase().match(/\b[a-zà-ÿ]+\b/g) || [];
    const existingVocab = new Set();
    
    // Collect all existing vocabulary
    this.languageProfiles.forEach(profile => {
      profile.vocabulary.streetTerms.forEach(term => existingVocab.add(term));
      profile.vocabulary.fillerWords.forEach(term => existingVocab.add(term));
      profile.vocabulary.exclamations.forEach(term => existingVocab.add(term));
    });

    // Return new words
    return words.filter(word => !existingVocab.has(word) && word.length > 2);
  }

  private async analyzeAndCategorizeWord(word: string, source: string): Promise<void> {
    // Simple categorization logic - in production this would use NLP
    const streetTermIndicators = ['street', 'drill', 'trap', 'amsterdam'];
    const fillerIndicators = ['interview', 'speech', 'casual'];
    
    let category = 'unknown';
    
    if (streetTermIndicators.some(indicator => source.toLowerCase().includes(indicator))) {
      category = 'streetTerm';
    } else if (fillerIndicators.some(indicator => source.toLowerCase().includes(indicator))) {
      category = 'fillerWord';
    }

    if (category !== 'unknown') {
      await this.addToVocabulary(word, category, source);
    }
  }

  private async addToVocabulary(word: string, category: string, source: string): Promise<void> {
    // Add to appropriate language profiles
    const profile = this.languageProfiles.get('amsterdam_street');
    if (profile) {
      if (category === 'streetTerm' && !profile.vocabulary.streetTerms.includes(word)) {
        profile.vocabulary.streetTerms.push(word);
      } else if (category === 'fillerWord' && !profile.vocabulary.fillerWords.includes(word)) {
        profile.vocabulary.fillerWords.push(word);
      }
    }

    // Log the addition
    console.log(`📚 Added vocabulary: "${word}" (${category}) from ${source}`);
  }

  // Helper methods
  private async getUserEngagementModel(userId: string): Promise<UserEngagementModel | null> {
    let model = this.userModels.get(userId) || null;
    
    if (!model) {
      // Try to load from database
      try {
        const result = await this.db.query(`
          SELECT * FROM user_engagement_models WHERE user_id = ?
        `, [userId]);
        
        if (result.rows && result.rows.length > 0) {
          model = result.rows[0] as UserEngagementModel;
          this.userModels.set(userId, model);
        }
      } catch (error) {
        console.warn('Failed to load user engagement model:', error);
      }
    }
    
    return model;
  }

  private async saveUserEngagementModel(userModel: UserEngagementModel): Promise<void> {
    try {
      await this.db.query(`
        INSERT OR REPLACE INTO user_engagement_models (
          user_id, engagement_score, preferred_language_profile, 
          conversation_style, response_time_preference, chaos_tolerance_level,
          humor_appreciation, cultural_alignment, predicted_retention,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        userModel.userId,
        userModel.engagementScore,
        userModel.preferredLanguageProfile,
        userModel.conversationStyle,
        userModel.responseTimePreference,
        userModel.chaosToleranceLevel,
        userModel.humorAppreciation,
        userModel.culturalAlignment,
        userModel.predictedRetention
      ]);
    } catch (error) {
      console.warn('Failed to save user engagement model:', error);
    }
  }

  private startContinuousLearning(): void {
    // Run learning algorithms every 30 minutes
    setInterval(() => {
      if (this.learningEnabled) {
        this.runContinuousLearning();
      }
    }, 30 * 60 * 1000);

    console.log('🔄 Continuous learning started (every 30 minutes)');
  }

  private async runContinuousLearning(): Promise<void> {
    console.log('🧠 Running continuous learning cycle...');
    
    try {
      // Update language profiles based on recent interactions
      await this.updateLanguageProfilesFromInteractions();
      
      // Optimize conversation flows
      await this.optimizeConversationFlows();
      
      // Update user engagement models
      await this.batchUpdateUserModels();
      
      console.log('✅ Continuous learning cycle completed');
    } catch (error) {
      console.error('❌ Continuous learning failed:', error);
    }
  }

  private async updateLanguageProfilesFromInteractions(): Promise<void> {
    // Analyze recent successful interactions to improve language profiles
    const recentInteractions = await this.getRecentSuccessfulInteractions();
    
    for (const interaction of recentInteractions) {
      const profile = this.languageProfiles.get(interaction.languageProfile);
      if (profile && interaction.userSatisfaction > 0.7) {
        // Extract successful patterns
        await this.extractSuccessfulPatterns(interaction, profile);
      }
    }
  }

  private async optimizeConversationFlows(): Promise<void> {
    // Analyze conversation flow effectiveness
    for (const [flowId, flow] of this.conversationFlows) {
      const effectiveness = await this.calculateFlowEffectiveness(flowId);
      flow.effectiveness = effectiveness;
    }
  }

  private async batchUpdateUserModels(): Promise<void> {
    // Update all user models based on recent activity
    const activeUsers = await this.getActiveUsers();
    
    for (const userId of activeUsers) {
      const recentActivity = await this.getUserRecentActivity(userId);
      if (recentActivity.length > 0) {
        for (const activity of recentActivity) {
          await this.updateUserEngagementModel(userId, activity);
        }
      }
    }
  }

  // API methods for admin panel
  public getLanguageProfiles(): LanguageProfile[] {
    return Array.from(this.languageProfiles.values());
  }

  public async updateLanguageProfile(profileId: string, updates: Partial<LanguageProfile>): Promise<boolean> {
    const profile = this.languageProfiles.get(profileId);
    if (!profile) return false;

    Object.assign(profile, updates);
    this.languageProfiles.set(profileId, profile);
    
    console.log(`🔧 Updated language profile: ${profileId}`);
    return true;
  }

  public getConversationFlows(): ConversationFlow[] {
    return Array.from(this.conversationFlows.values());
  }

  public getUserEngagementModels(): UserEngagementModel[] {
    return Array.from(this.userModels.values());
  }

  public getMLInsights(): any {
    return {
      languageProfiles: this.getLanguageProfiles().length,
      conversationFlows: this.getConversationFlows().length,
      activeUserModels: this.getUserEngagementModels().length,
      learningEnabled: this.learningEnabled,
      avgEngagementScore: this.calculateAverageEngagement(),
      topPerformingProfile: this.getTopPerformingLanguageProfile(),
      retentionPrediction: this.calculateAverageRetentionPrediction()
    };
  }

  private calculateAverageEngagement(): number {
    const models = this.getUserEngagementModels();
    if (models.length === 0) return 0;
    return models.reduce((sum, model) => sum + model.engagementScore, 0) / models.length;
  }

  private getTopPerformingLanguageProfile(): string {
    // Return the most used language profile
    const usage = new Map<string, number>();
    this.getUserEngagementModels().forEach(model => {
      const current = usage.get(model.preferredLanguageProfile) || 0;
      usage.set(model.preferredLanguageProfile, current + 1);
    });

    let topProfile = 'amsterdam_street';
    let maxUsage = 0;
    usage.forEach((count, profile) => {
      if (count > maxUsage) {
        maxUsage = count;
        topProfile = profile;
      }
    });

    return topProfile;
  }

  private calculateAverageRetentionPrediction(): number {
    const models = this.getUserEngagementModels();
    if (models.length === 0) return 0;
    return models.reduce((sum, model) => sum + model.predictedRetention, 0) / models.length;
  }

  // Placeholder methods for database queries
  private async getRecentSuccessfulInteractions(): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM ml_user_interactions 
        WHERE user_engagement = 'positive' 
        AND timestamp > datetime('now', '-24 hours')
        ORDER BY timestamp DESC
        LIMIT 100
      `);
      return result.rows || [];
    } catch (error) {
      return [];
    }
  }

  private async extractSuccessfulPatterns(interaction: any, profile: LanguageProfile): Promise<void> {
    // Extract patterns from successful interactions
    // This would analyze the interaction content and update the profile
  }

  private async calculateFlowEffectiveness(flowId: string): Promise<number> {
    // Calculate effectiveness based on user satisfaction and engagement
    return 0.75; // Placeholder
  }

  private async getActiveUsers(): Promise<string[]> {
    try {
      const result = await this.db.query(`
        SELECT DISTINCT user_id FROM ml_user_interactions 
        WHERE timestamp > datetime('now', '-7 days')
      `);
      return result.rows?.map(row => row.user_id) || [];
    } catch (error) {
      return [];
    }
  }

  private async getUserRecentActivity(userId: string): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM ml_user_interactions 
        WHERE user_id = ? AND timestamp > datetime('now', '-24 hours')
        ORDER BY timestamp DESC
      `, [userId]);
      return result.rows || [];
    } catch (error) {
      return [];
    }
  }

  public setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
    console.log(`🧠 Continuous learning ${enabled ? 'enabled' : 'disabled'}`);
  }
}

export const advancedMLEngine = AdvancedMLEngine.getInstance();
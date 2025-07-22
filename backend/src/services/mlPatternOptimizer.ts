import { AdvancedScrapedContent, ContentSource } from './advancedScraper';

interface UserInteractionData {
  sessionId: string;
  timestamp: Date;
  contentType: string;
  sourceName: string;
  qualityScore: number;
  userEngagement: 'positive' | 'negative' | 'neutral' | 'ignored';
  conversationLength: number;
  responseTime: number;
  chaosLevel: number;
  denialPattern: string;
}

interface PatternInsight {
  pattern: string;
  successRate: number;
  avgEngagement: number;
  confidenceLevel: number;
  sampleSize: number;
  recommendedUsage: string;
}

interface ContentSourcePerformance {
  sourceId: string;
  sourceName: string;
  avgQualityScore: number;
  successfulIntegrations: number;
  totalAttempts: number;
  userSatisfactionScore: number;
  optimalCheckFrequency: number;
  bestTimeWindows: string[];
}

interface MLModel {
  modelId: string;
  type: 'content_quality' | 'user_engagement' | 'source_optimization' | 'timing_prediction';
  trainingData: any[];
  accuracy: number;
  lastTrained: Date;
  features: string[];
  weights: Record<string, number>;
}

export class MLPatternOptimizer {
  private static instance: MLPatternOptimizer;
  private interactionHistory: UserInteractionData[] = [];
  private sourcePerformance: Map<string, ContentSourcePerformance> = new Map();
  private patternInsights: Map<string, PatternInsight> = new Map();
  private mlModels: Map<string, MLModel> = new Map();
  private trainingSchedule: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeMLModels();
    this.startTrainingSchedule();
  }

  public static getInstance(): MLPatternOptimizer {
    if (!MLPatternOptimizer.instance) {
      MLPatternOptimizer.instance = new MLPatternOptimizer();
    }
    return MLPatternOptimizer.instance;
  }

  private initializeMLModels(): void {
    // Content Quality Prediction Model
    this.mlModels.set('content_quality', {
      modelId: 'content_quality_v1',
      type: 'content_quality',
      trainingData: [],
      accuracy: 0.0,
      lastTrained: new Date(),
      features: [
        'content_length',
        'keyword_density',
        'source_reputation',
        'freshness_score',
        'entity_count',
        'sentiment_score',
        'language_confidence'
      ],
      weights: {
        content_length: 0.15,
        keyword_density: 0.25,
        source_reputation: 0.20,
        freshness_score: 0.15,
        entity_count: 0.10,
        sentiment_score: 0.10,
        language_confidence: 0.05
      }
    });

    // User Engagement Prediction Model
    this.mlModels.set('user_engagement', {
      modelId: 'user_engagement_v1',
      type: 'user_engagement',
      trainingData: [],
      accuracy: 0.0,
      lastTrained: new Date(),
      features: [
        'content_type',
        'quality_score',
        'chaos_level',
        'time_of_day',
        'conversation_context',
        'user_history',
        'denial_pattern_type'
      ],
      weights: {
        content_type: 0.20,
        quality_score: 0.25,
        chaos_level: 0.15,
        time_of_day: 0.10,
        conversation_context: 0.15,
        user_history: 0.10,
        denial_pattern_type: 0.05
      }
    });

    // Source Optimization Model
    this.mlModels.set('source_optimization', {
      modelId: 'source_optimization_v1', 
      type: 'source_optimization',
      trainingData: [],
      accuracy: 0.0,
      lastTrained: new Date(),
      features: [
        'historical_success_rate',
        'content_variety',
        'update_frequency',
        'server_response_time',
        'content_freshness',
        'duplicate_rate',
        'integration_success'
      ],
      weights: {
        historical_success_rate: 0.30,
        content_variety: 0.15,
        update_frequency: 0.15,
        server_response_time: 0.10,
        content_freshness: 0.15,
        duplicate_rate: -0.10, // Negative weight
        integration_success: 0.25
      }
    });

    console.log('🧠 ML Pattern Optimizer initialized with 3 models');
  }

  /**
   * Record user interaction for ML learning
   */
  public recordInteraction(interaction: Omit<UserInteractionData, 'timestamp'>): void {
    const fullInteraction: UserInteractionData = {
      ...interaction,
      timestamp: new Date()
    };

    this.interactionHistory.push(fullInteraction);

    // Keep only recent interactions (last 10,000)
    if (this.interactionHistory.length > 10000) {
      this.interactionHistory = this.interactionHistory.slice(-8000);
    }

    // Update pattern insights
    this.updatePatternInsights(fullInteraction);

    console.log(`📊 Recorded interaction: ${interaction.userEngagement} for ${interaction.contentType} from ${interaction.sourceName}`);
  }

  /**
   * Update pattern insights based on new interaction
   */
  private updatePatternInsights(interaction: UserInteractionData): void {
    const patternKey = `${interaction.contentType}_${interaction.denialPattern}_${Math.floor(interaction.qualityScore / 20) * 20}`;
    
    let insight = this.patternInsights.get(patternKey);
    if (!insight) {
      insight = {
        pattern: patternKey,
        successRate: 0,
        avgEngagement: 0,
        confidenceLevel: 0,
        sampleSize: 0,
        recommendedUsage: 'experimental'
      };
    }

    // Update success rate
    const isSuccess = interaction.userEngagement === 'positive';
    const newSampleSize = insight.sampleSize + 1;
    const newSuccessRate = (insight.successRate * insight.sampleSize + (isSuccess ? 1 : 0)) / newSampleSize;

    // Update engagement score
    const engagementScore = this.mapEngagementToScore(interaction.userEngagement);
    const newAvgEngagement = (insight.avgEngagement * insight.sampleSize + engagementScore) / newSampleSize;

    // Update confidence level (higher with more samples)
    const newConfidenceLevel = Math.min(0.95, Math.log(newSampleSize + 1) / 10);

    // Update recommended usage
    let recommendedUsage = 'experimental';
    if (newSampleSize >= 10) {
      if (newSuccessRate >= 0.7 && newAvgEngagement >= 0.6) {
        recommendedUsage = 'recommended';
      } else if (newSuccessRate >= 0.5 && newAvgEngagement >= 0.4) {
        recommendedUsage = 'cautious';
      } else {
        recommendedUsage = 'avoid';
      }
    }

    this.patternInsights.set(patternKey, {
      pattern: patternKey,
      successRate: newSuccessRate,
      avgEngagement: newAvgEngagement,
      confidenceLevel: newConfidenceLevel,
      sampleSize: newSampleSize,
      recommendedUsage
    });
  }

  private mapEngagementToScore(engagement: string): number {
    switch (engagement) {
      case 'positive': return 1.0;
      case 'neutral': return 0.5;
      case 'negative': return 0.0;
      case 'ignored': return 0.2;
      default: return 0.3;
    }
  }

  /**
   * Predict content quality using ML model
   */
  public predictContentQuality(content: AdvancedScrapedContent, source: ContentSource): number {
    const model = this.mlModels.get('content_quality');
    if (!model) return content.qualityScore.overallScore;

    const features = this.extractContentFeatures(content, source);
    let predictedScore = 0;

    // Simple weighted sum prediction
    for (const [feature, value] of Object.entries(features)) {
      const weight = model.weights[feature] || 0;
      predictedScore += value * weight * 100; // Scale to 0-100
    }

    // Apply sigmoid function to normalize
    predictedScore = 100 / (1 + Math.exp(-predictedScore / 50));

    // Blend with original score if model accuracy is low
    const blendRatio = Math.max(0.3, model.accuracy);
    return (predictedScore * blendRatio) + (content.qualityScore.overallScore * (1 - blendRatio));
  }

  /**
   * Predict user engagement for content
   */
  public predictUserEngagement(content: AdvancedScrapedContent, context: any): number {
    const model = this.mlModels.get('user_engagement');
    if (!model) return 0.5;

    const features = this.extractEngagementFeatures(content, context);
    let engagementScore = 0;

    for (const [feature, value] of Object.entries(features)) {
      const weight = model.weights[feature] || 0;
      engagementScore += value * weight;
    }

    return Math.max(0, Math.min(1, engagementScore));
  }

  /**
   * Optimize source check frequency based on performance
   */
  public optimizeSourceFrequency(sourceId: string): number {
    const performance = this.sourcePerformance.get(sourceId);
    if (!performance) return 360; // Default 6 hours

    const model = this.mlModels.get('source_optimization');
    if (!model) return performance.optimalCheckFrequency || 360;

    // Calculate optimal frequency based on:
    // - Success rate (more successful = more frequent)
    // - Content freshness patterns
    // - Server response time
    // - User engagement with content from this source

    let optimalMinutes = 360; // Base frequency

    // Adjust based on success rate
    if (performance.successfulIntegrations > 5) {
      const successRate = performance.successfulIntegrations / performance.totalAttempts;
      if (successRate > 0.8) optimalMinutes = Math.max(60, optimalMinutes * 0.5);
      else if (successRate > 0.5) optimalMinutes = Math.max(120, optimalMinutes * 0.7);
      else optimalMinutes = Math.min(1440, optimalMinutes * 1.5); // Less frequent if low success
    }

    // Adjust based on user satisfaction
    if (performance.userSatisfactionScore > 0.7) {
      optimalMinutes = Math.max(60, optimalMinutes * 0.8);
    } else if (performance.userSatisfactionScore < 0.3) {
      optimalMinutes = Math.min(1440, optimalMinutes * 2);
    }

    return Math.round(optimalMinutes);
  }

  /**
   * Get optimal denial pattern for current context
   */
  public getOptimalDenialPattern(context: any): string {
    const relevantPatterns = Array.from(this.patternInsights.values())
      .filter(insight => insight.sampleSize >= 5)
      .sort((a, b) => (b.successRate * b.confidenceLevel) - (a.successRate * a.confidenceLevel));

    if (relevantPatterns.length === 0) {
      return 'basic_denial'; // Fallback
    }

    // Consider current context (chaos level, conversation length, etc.)
    const contextualPatterns = relevantPatterns.filter(pattern => {
      if (context.chaosLevel > 70) {
        return pattern.pattern.includes('chaotic') || pattern.pattern.includes('interrupt');
      } else if (context.conversationLength > 10) {
        return pattern.pattern.includes('patient') || pattern.pattern.includes('detailed');
      }
      return true;
    });

    const bestPattern = contextualPatterns[0] || relevantPatterns[0];
    return bestPattern.pattern.split('_')[1] || 'basic_denial';
  }

  /**
   * Update source performance metrics
   */
  public updateSourcePerformance(
    sourceId: string,
    sourceName: string,
    metrics: Partial<ContentSourcePerformance>
  ): void {
    let performance = this.sourcePerformance.get(sourceId);
    
    if (!performance) {
      performance = {
        sourceId,
        sourceName,
        avgQualityScore: 0,
        successfulIntegrations: 0,
        totalAttempts: 0,
        userSatisfactionScore: 0,
        optimalCheckFrequency: 360,
        bestTimeWindows: []
      };
    }

    // Update metrics
    Object.assign(performance, metrics);

    this.sourcePerformance.set(sourceId, performance);
  }

  /**
   * Extract features for content quality prediction
   */
  private extractContentFeatures(content: AdvancedScrapedContent, source: ContentSource): Record<string, number> {
    return {
      content_length: Math.min(1, content.content.length / 1000), // Normalize
      keyword_density: this.calculateKeywordDensity(content.content),
      source_reputation: this.getSourceReputation(source.id),
      freshness_score: this.calculateFreshnessScore(content.timestamp),
      entity_count: Object.values(content.extractedEntities).flat().length / 20, // Normalize
      sentiment_score: content.sentiment === 'positive' ? 1 : content.sentiment === 'negative' ? 0 : 0.5,
      language_confidence: content.language === 'nl' ? 1 : 0.5
    };
  }

  private extractEngagementFeatures(content: AdvancedScrapedContent, context: any): Record<string, number> {
    return {
      content_type: this.mapContentTypeToScore(content.type),
      quality_score: content.qualityScore.overallScore / 100,
      chaos_level: (context.chaosLevel || 50) / 100,
      time_of_day: new Date().getHours() / 24,
      conversation_context: (context.conversationLength || 0) / 20,
      user_history: context.userEngagementHistory || 0.5,
      denial_pattern_type: context.currentDenialPattern ? 0.8 : 0.5
    };
  }

  private calculateKeywordDensity(text: string): number {
    const keywords = ['young ellens', 'mr cocaine', 'cocaine', 'wiet', 'hennessy', 'amsterdam', 'damsko'];
    const lowerText = text.toLowerCase();
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    return Math.min(1, matches / 3); // Normalize to 0-1
  }

  private getSourceReputation(sourceId: string): number {
    const performance = this.sourcePerformance.get(sourceId);
    if (!performance || performance.totalAttempts === 0) return 0.5;
    return performance.successfulIntegrations / performance.totalAttempts;
  }

  private calculateFreshnessScore(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(1, 1 - (daysSinceCreated / 30))); // 1 for today, 0 for 30+ days
  }

  private mapContentTypeToScore(type: string): number {
    const typeScores: Record<string, number> = {
      'lyrics': 0.9,
      'interview': 0.8,
      'video': 0.7,
      'social_media': 0.6,
      'news': 0.5,
      'other': 0.4
    };
    return typeScores[type] || 0.5;
  }

  /**
   * Train ML models with accumulated data
   */
  public trainModels(): void {
    if (this.interactionHistory.length < 50) {
      console.log('🧠 Insufficient data for ML training (need 50+ interactions)');
      return;
    }

    console.log('🧠 Starting ML model training...');

    // Train content quality model
    this.trainContentQualityModel();
    
    // Train user engagement model
    this.trainUserEngagementModel();
    
    // Update source optimization model
    this.updateSourceOptimizationModel();

    console.log('🧠 ML model training completed');
  }

  private trainContentQualityModel(): void {
    const model = this.mlModels.get('content_quality');
    if (!model) return;

    // Simple training: analyze correlations between features and user engagement
    const trainingData = this.interactionHistory.map(interaction => ({
      features: {
        content_length: Math.min(1, (interaction.contentType.length * 100) / 1000),
        keyword_density: 0.5, // Placeholder
        source_reputation: 0.7, // Placeholder
        freshness_score: 0.8, // Placeholder
        entity_count: 0.6, // Placeholder
        sentiment_score: 0.7, // Placeholder
        language_confidence: 0.9 // Placeholder
      },
      target: this.mapEngagementToScore(interaction.userEngagement)
    }));

    // Update model weights based on correlation analysis
    const correlations = this.calculateFeatureCorrelations(trainingData);
    
    for (const [feature, correlation] of Object.entries(correlations)) {
      if (model.weights[feature] !== undefined) {
        // Simple weight update: blend with correlation
        model.weights[feature] = (model.weights[feature] * 0.8) + (correlation * 0.2);
      }
    }

    model.lastTrained = new Date();
    model.trainingData = trainingData.slice(-1000); // Keep last 1000 samples
    
    // Calculate simple accuracy based on recent predictions
    model.accuracy = Math.min(0.9, 0.5 + (this.interactionHistory.length / 2000));
  }

  private trainUserEngagementModel(): void {
    const model = this.mlModels.get('user_engagement');
    if (!model) return;

    // Analyze patterns in user engagement
    const engagementPatterns = this.analyzeEngagementPatterns();
    
    // Update weights based on patterns
    for (const [pattern, impact] of Object.entries(engagementPatterns)) {
      if (model.weights[pattern] !== undefined) {
        model.weights[pattern] = (model.weights[pattern] * 0.7) + (impact * 0.3);
      }
    }

    model.lastTrained = new Date();
    model.accuracy = Math.min(0.85, 0.4 + (this.interactionHistory.length / 3000));
  }

  private updateSourceOptimizationModel(): void {
    // Update source performance based on recent interactions
    for (const interaction of this.interactionHistory.slice(-100)) {
      this.updateSourcePerformance(interaction.sourceName, interaction.sourceName, {
        totalAttempts: (this.sourcePerformance.get(interaction.sourceName)?.totalAttempts || 0) + 1,
        successfulIntegrations: (this.sourcePerformance.get(interaction.sourceName)?.successfulIntegrations || 0) + 
          (interaction.userEngagement === 'positive' ? 1 : 0),
        userSatisfactionScore: this.mapEngagementToScore(interaction.userEngagement),
        avgQualityScore: interaction.qualityScore
      });
    }
  }

  private calculateFeatureCorrelations(trainingData: any[]): Record<string, number> {
    const correlations: Record<string, number> = {};
    
    if (trainingData.length < 10) return correlations;

    const features = Object.keys(trainingData[0].features);
    
    for (const feature of features) {
      const featureValues = trainingData.map(d => d.features[feature]);
      const targets = trainingData.map(d => d.target);
      
      correlations[feature] = this.calculatePearsonCorrelation(featureValues, targets);
    }

    return correlations;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    const sumYY = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeEngagementPatterns(): Record<string, number> {
    const patterns: Record<string, number> = {};
    
    // Analyze time of day patterns
    const hourlyEngagement = Array(24).fill(0);
    const hourlyCounts = Array(24).fill(0);
    
    for (const interaction of this.interactionHistory) {
      const hour = interaction.timestamp.getHours();
      hourlyEngagement[hour] += this.mapEngagementToScore(interaction.userEngagement);
      hourlyCounts[hour]++;
    }

    // Find best hours
    let bestHourScore = 0;
    for (let i = 0; i < 24; i++) {
      if (hourlyCounts[i] > 0) {
        const avgScore = hourlyEngagement[i] / hourlyCounts[i];
        if (avgScore > bestHourScore) bestHourScore = avgScore;
      }
    }

    patterns.time_of_day = bestHourScore;

    // Analyze chaos level patterns
    const chaosEngagement = { low: 0, medium: 0, high: 0 };
    const chaosCounts = { low: 0, medium: 0, high: 0 };

    for (const interaction of this.interactionHistory) {
      const chaosCategory = interaction.chaosLevel < 40 ? 'low' : 
                           interaction.chaosLevel < 70 ? 'medium' : 'high';
      chaosEngagement[chaosCategory] += this.mapEngagementToScore(interaction.userEngagement);
      chaosCounts[chaosCategory]++;
    }

    const bestChaosScore = Math.max(
      chaosCounts.low > 0 ? chaosEngagement.low / chaosCounts.low : 0,
      chaosCounts.medium > 0 ? chaosEngagement.medium / chaosCounts.medium : 0,
      chaosCounts.high > 0 ? chaosEngagement.high / chaosCounts.high : 0
    );

    patterns.chaos_level = bestChaosScore;

    return patterns;
  }

  /**
   * Start automatic training schedule
   */
  private startTrainingSchedule(): void {
    // Retrain models every hour
    this.trainingSchedule = setInterval(() => {
      this.trainModels();
    }, 60 * 60 * 1000);

    console.log('🧠 ML training schedule started (hourly retraining)');
  }

  /**
   * Get ML insights for admin dashboard
   */
  public getMLInsights(): any {
    return {
      modelsStatus: Array.from(this.mlModels.entries()).map(([id, model]) => ({
        id,
        type: model.type,
        accuracy: model.accuracy,
        lastTrained: model.lastTrained,
        trainingDataSize: model.trainingData.length
      })),
      topPatterns: Array.from(this.patternInsights.values())
        .sort((a, b) => (b.successRate * b.confidenceLevel) - (a.successRate * a.confidenceLevel))
        .slice(0, 5),
      sourcePerformance: Array.from(this.sourcePerformance.values())
        .sort((a, b) => b.userSatisfactionScore - a.userSatisfactionScore),
      dataStats: {
        totalInteractions: this.interactionHistory.length,
        recentInteractions: this.interactionHistory.filter(i => 
          Date.now() - i.timestamp.getTime() < 24 * 60 * 60 * 1000
        ).length,
        avgEngagementScore: this.interactionHistory.length > 0 
          ? this.interactionHistory.reduce((sum, i) => sum + this.mapEngagementToScore(i.userEngagement), 0) / this.interactionHistory.length
          : 0
      }
    };
  }

  /**
   * Cleanup and shutdown
   */
  public shutdown(): void {
    if (this.trainingSchedule) {
      clearInterval(this.trainingSchedule);
      this.trainingSchedule = null;
    }
    console.log('🧠 ML Pattern Optimizer shutdown completed');
  }
}

// Export singleton instance
export const mlPatternOptimizer = MLPatternOptimizer.getInstance();
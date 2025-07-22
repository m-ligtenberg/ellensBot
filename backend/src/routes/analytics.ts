import { Router, Request, Response } from 'express';
import { EllensPersonalityEngine } from '../services/personalityEngine';
import { contextMemory } from '../services/contextMemory';

const router = Router();
const personalityEngine = new EllensPersonalityEngine();

// GET /api/analytics/dashboard - Real-time analytics dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get personality engine analytics
    const personalityData = personalityEngine.getAnalyticsData();
    
    // Get context memory stats
    const contextStats = contextMemory.getContextStats();
    
    // Get all contexts for detailed analysis
    const allContexts = contextMemory.getAllContexts();
    
    // Calculate additional metrics
    const totalMessages = allContexts.reduce((sum, ctx) => sum + ctx.messagesSinceLastUpdate, 0);
    const avgConversationDepth = totalMessages > 0 ? totalMessages / allContexts.length : 0;
    
    // Drug mention analysis
    const drugAnalysis = {
      totalDrugMentions: contextStats.totalDrugMentions,
      totalDenials: contextStats.totalDenials,
      denialSuccessRate: contextStats.totalDrugMentions > 0 
        ? (contextStats.totalDenials / contextStats.totalDrugMentions * 100).toFixed(1) 
        : '0'
    };
    
    // Chaos level distribution
    const chaosDistribution = allContexts.reduce((acc, ctx) => {
      const level = Math.floor(ctx.maxChaosReached / 20) * 20; // Group by 20s
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Most popular topics
    const topicAnalysis = {
      mostDiscussed: contextStats.mostDiscussedTopics,
      totalUniqueTopics: contextStats.mostDiscussedTopics.length
    };
    
    // Response patterns
    const responsePatterns = allContexts.reduce((acc, ctx) => {
      ctx.responsePatterns.forEach(pattern => {
        acc.totalResponses++;
        acc.avgEffectiveness += pattern.effectiveness;
        
        if (pattern.effectiveness > 0.7) acc.highQuality++;
      });
      return acc;
    }, { totalResponses: 0, avgEffectiveness: 0, highQuality: 0 });
    
    if (responsePatterns.totalResponses > 0) {
      responsePatterns.avgEffectiveness = 
        Number((responsePatterns.avgEffectiveness / responsePatterns.totalResponses).toFixed(2));
    }
    
    const analytics = {
      overview: {
        activeConversations: personalityData.activeConversations,
        totalMessages,
        avgConversationDepth: Number(avgConversationDepth.toFixed(1)),
        avgChaosLevel: Number(personalityData.averageChaosLevel?.toFixed(1) || 0),
        uptime: process.uptime()
      },
      personality: {
        moodDistribution: personalityData.moodDistribution,
        chaosDistribution,
        drugAnalysis,
        topicAnalysis
      },
      performance: {
        ...responsePatterns,
        qualityPercentage: responsePatterns.totalResponses > 0 
          ? Number((responsePatterns.highQuality / responsePatterns.totalResponses * 100).toFixed(1))
          : 0
      },
      context: {
        ...contextStats,
        memoryEfficiency: allContexts.length > 0 
          ? Number((contextStats.totalActiveContexts / 1000 * 100).toFixed(1)) // % of max capacity
          : 0
      },
      realtime: {
        timestamp: new Date().toISOString(),
        serverLoad: process.memoryUsage(),
        activeUsers: contextStats.totalActiveContexts
      }
    };

    res.json(analytics);
    return;

  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      error: 'Failed to generate analytics',
      message: 'Ellens analytics zijn kapot... B-Negar 😅'
    });
  }
});

// GET /api/analytics/personality/:conversationId - Specific conversation analytics
router.get('/personality/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // Get conversation state
    const conversationState = personalityEngine.getConversationState(conversationId);
    
    if (!conversationState) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Get context insights (assuming default user)
    const contextInsights = contextMemory.getConversationInsights('default', conversationId);
    
    const analysis = {
      conversationId,
      personality: {
        currentMood: conversationState.currentMood,
        chaosLevel: conversationState.chaosLevel,
        patience: conversationState.patience,
        messageCount: conversationState.messageCount,
        cocaineReferences: conversationState.cocaineReferences,
        denialMode: conversationState.denialMode
      },
      context: contextInsights,
      insights: {
        personalityConsistency: calculatePersonalityConsistency(conversationState, contextInsights),
        engagementScore: calculateEngagementScore(contextInsights),
        conversationHealth: assessConversationHealth(conversationState, contextInsights)
      },
      timestamp: new Date().toISOString()
    };

    res.json(analysis);
    return;

  } catch (error) {
    console.error('Error getting conversation analytics:', error);
    res.status(500).json({
      error: 'Failed to get conversation analytics'
    });
    return;
  }
});

// Helper methods for personality scoring
function calculatePersonalityConsistency(state: any, context: any): number {
  let score = 100;
  
  // Reduce score if too many mood swings
  if (state.messageCount > 5 && state.chaosLevel > 90) score -= 10;
  
  // Reduce if denial ratio is off
  if (context.drugEngagementRatio < 0.5 && context.drugEngagementRatio > 0) score -= 15;
  
  // Reward consistent drug denials
  if (context.drugEngagementRatio >= 0.8) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateEngagementScore(context: any): number {
  let score = 50; // Base score
  
  // Reward longer conversations
  if (context.conversationLength > 10) score += 20;
  if (context.conversationLength > 20) score += 15;
  
  // Reward topic diversity
  score += Math.min(context.topicDiversity * 5, 25);
  
  // Reward good message length balance
  if (context.avgMessageLength > 30 && context.avgMessageLength < 150) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function assessConversationHealth(state: any, context: any): 'excellent' | 'good' | 'fair' | 'poor' {
  const consistency = calculatePersonalityConsistency(state, context);
  const engagement = calculateEngagementScore(context);
  const overall = (consistency + engagement) / 2;
  
  if (overall >= 80) return 'excellent';
  if (overall >= 65) return 'good'; 
  if (overall >= 50) return 'fair';
  return 'poor';
}

export default router;
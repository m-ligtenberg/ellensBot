import express from 'express';
import { advancedMLEngine } from '../services/advancedMLEngine';

const router = express.Router();

// Get ML system overview
router.get('/overview', async (req, res) => {
  try {
    const insights = advancedMLEngine.getMLInsights();
    
    res.json({
      status: 'success',
      data: {
        insights,
        systemStatus: {
          timestamp: new Date().toISOString(),
          componentsActive: [
            'Language Adaptation Engine',
            'Conversation Flow Optimizer', 
            'User Engagement Predictor',
            'Vocabulary Expansion System'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Error fetching ML overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ML overview'
    });
  }
});

// Get all language profiles
router.get('/language-profiles', async (req, res) => {
  try {
    const profiles = advancedMLEngine.getLanguageProfiles();
    
    res.json({
      status: 'success',
      data: {
        profiles,
        totalProfiles: profiles.length,
        defaultProfile: 'amsterdam_street'
      }
    });
  } catch (error) {
    console.error('Error fetching language profiles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch language profiles'
    });
  }
});

// Update language profile
router.put('/language-profiles/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;

    // Validate required fields
    if (!profileId) {
      return res.status(400).json({
        status: 'error',
        message: 'Profile ID is required'
      });
    }

    const success = await advancedMLEngine.updateLanguageProfile(profileId, updates);
    
    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Language profile not found'
      });
    }

    return res.json({
      status: 'success',
      message: `Language profile ${profileId} updated successfully`,
      data: {
        profileId,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating language profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update language profile'
    });
  }
});

// Get conversation flows
router.get('/conversation-flows', async (req, res) => {
  try {
    const flows = advancedMLEngine.getConversationFlows();
    
    res.json({
      status: 'success',
      data: {
        flows,
        totalFlows: flows.length,
        activeFlows: flows.filter(f => f.effectiveness > 0.5).length
      }
    });
  } catch (error) {
    console.error('Error fetching conversation flows:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation flows'
    });
  }
});

// Get user engagement models
router.get('/user-models', async (req, res) => {
  try {
    const models = advancedMLEngine.getUserEngagementModels();
    
    // Calculate aggregated statistics
    const totalModels = models.length;
    const avgEngagement = totalModels > 0 
      ? models.reduce((sum, model) => sum + model.engagementScore, 0) / totalModels 
      : 0;
    
    const styleDistribution = models.reduce((acc, model) => {
      acc[model.conversationStyle] = (acc[model.conversationStyle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      status: 'success',
      data: {
        totalModels,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        styleDistribution,
        topStyles: Object.entries(styleDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([style, count]) => ({ style, count }))
      }
    });
  } catch (error) {
    console.error('Error fetching user models:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user engagement models'
    });
  }
});

// Toggle continuous learning
router.post('/learning/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'enabled field must be a boolean'
      });
    }

    advancedMLEngine.setLearningEnabled(enabled);
    
    return res.json({
      status: 'success',
      message: `Continuous learning ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        learningEnabled: enabled,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error toggling learning:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to toggle continuous learning'
    });
  }
});

// Create new language profile
router.post('/language-profiles', async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      vocabulary,
      grammarPatterns,
      culturalContext,
      personalityWeights
    } = req.body;

    // Validate required fields
    if (!id || !name || !vocabulary || !personalityWeights) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: id, name, vocabulary, personalityWeights'
      });
    }

    const newProfile = {
      id,
      name,
      description: description || '',
      vocabulary,
      grammarPatterns: grammarPatterns || {
        sentenceStructure: ['Subject-Verb-Object'],
        wordOrder: 'standard',
        contractions: false,
        slangLevel: 5
      },
      culturalContext: culturalContext || {
        region: 'Netherlands',
        ageGroup: 'general',
        socialBackground: 'mainstream',
        musicInfluence: ['pop']
      },
      personalityWeights
    };

    const success = await advancedMLEngine.updateLanguageProfile(id, newProfile);
    
    if (!success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create language profile'
      });
    }

    return res.status(201).json({
      status: 'success',
      message: 'Language profile created successfully',
      data: {
        profile: newProfile,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating language profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create language profile'
    });
  }
});

// Force vocabulary expansion from text
router.post('/vocabulary/expand', async (req, res) => {
  try {
    const { content, source } = req.body;
    
    if (!content || !source) {
      return res.status(400).json({
        status: 'error',
        message: 'Both content and source are required'
      });
    }

    await advancedMLEngine.expandVocabulary(content, source);
    
    return res.json({
      status: 'success',
      message: 'Vocabulary expansion completed',
      data: {
        processedAt: new Date().toISOString(),
        source,
        contentLength: content.length
      }
    });
  } catch (error) {
    console.error('Error expanding vocabulary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to expand vocabulary'
    });
  }
});

// Get real-time adaptation logs
router.get('/adaptations/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Mock adaptation logs - in production this would come from database
    const recentAdaptations = [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        type: 'language_switch',
        userId: 'user_1234',
        fromProfile: 'standard_dutch',
        toProfile: 'amsterdam_street',
        trigger: 'street_terms_detected',
        effectiveness: 0.85
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'personality_adjustment',
        userId: 'user_5678',
        adjustment: 'reduced_chaos_level',
        reason: 'user_negative_reaction',
        newValue: 0.65,
        effectiveness: 0.72
      },
      {
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        type: 'vocabulary_expansion',
        newTerm: 'tatta',
        category: 'streetTerm',
        source: 'user_interaction',
        confidence: 0.78
      }
    ].slice(0, limit);

    res.json({
      status: 'success',
      data: {
        adaptations: recentAdaptations,
        total: recentAdaptations.length,
        timeRange: '24 hours'
      }
    });
  } catch (error) {
    console.error('Error fetching adaptation logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch adaptation logs'
    });
  }
});

// Get ML performance metrics
router.get('/performance', async (req, res) => {
  try {
    // Mock performance data - in production this would come from ML model evaluation
    const performanceData = {
      languageAdaptation: {
        accuracy: 0.89,
        adaptationRate: 0.73,
        userSatisfaction: 0.85,
        responseTime: 125 // milliseconds
      },
      engagementPrediction: {
        accuracy: 0.82,
        precision: 0.79,
        recall: 0.84,
        f1Score: 0.81
      },
      conversationFlow: {
        effectiveness: 0.77,
        userRetention: 0.68,
        avgSessionLength: 12.4, // minutes
        successfulTransitions: 0.91
      },
      vocabularyExpansion: {
        termsLearned: 147,
        approvalRate: 0.68,
        usageRate: 0.45,
        qualityScore: 0.73
      }
    };

    res.json({
      status: 'success',
      data: {
        performance: performanceData,
        evaluatedAt: new Date().toISOString(),
        modelVersions: {
          languageAdaptation: '2.1.3',
          engagementPrediction: '1.8.7',
          conversationFlow: '3.0.1',
          vocabularyExpansion: '1.5.2'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance metrics'
    });
  }
});

export default router;
import { Router } from 'express';

const router = Router();

// Generate dynamic personality updates
const generateRecentUpdates = () => [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 minutes ago
    type: 'vocabulary' as const,
    message: 'Learned new slang: "wallah" from user interactions',
    source: 'Live Chat Learning'
  },
  {
    id: '2', 
    timestamp: new Date(Date.now() - 1000 * 60 * 23).toISOString(), // 23 minutes ago
    type: 'personality' as const,
    message: 'Adjusted denial intensity based on conversation context',
    source: 'ML Adaptation Engine'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 34).toISOString(), // 34 minutes ago
    type: 'denial' as const,
    message: 'Enhanced "alleen me wietje en me henny" with better timing',
    source: 'Response Optimizer'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(), // 47 minutes ago
    type: 'language' as const,
    message: 'Activated Amsterdam street mode for Dutch conversations',
    source: 'Language Detection ML'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 1 hour ago
    type: 'knowledge' as const,
    message: 'Updated drug knowledge slips with local Amsterdam references',
    source: 'Content Discovery ML'
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 1000 * 60 * 89).toISOString(), // 1.5 hours ago
    type: 'interruption' as const,
    message: 'Fine-tuned "WACHT EFFE" interruption patterns',
    source: 'Chaos Pattern Analysis'
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 1000 * 60 * 112).toISOString(), // 1h 52m ago
    type: 'vocabulary' as const,
    message: 'Added "damsko" and "mattie" to vocabulary from scraped content',
    source: 'Web Scraper Integration'
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 1000 * 60 * 143).toISOString(), // 2h 23m ago
    type: 'personality' as const,
    message: 'Increased boredom threshold for longer conversations',
    source: 'User Engagement Analytics'
  }
];

router.get('/updates', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recentUpdates = generateRecentUpdates();
    const updates = recentUpdates.slice(0, limit);
    
    res.json({
      success: true,
      updates,
      total: recentUpdates.length,
      message: 'Recent personality updates retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve personality updates',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal error'
    });
  }
});

export default router;
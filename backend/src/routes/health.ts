import { Router } from 'express';
import { aiService } from '../services/aiService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const healthCheck = await aiService.healthCheck();
    const serviceStatus = aiService.getServiceStatus();

    res.json({
      status: 'OK',
      service: 'Young Ellens Chatbot API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      message: 'Yo, Ellens is ready to chat! (alleen me wietje en me henny) 😎',
      ai_services: {
        primary: serviceStatus.primary,
        fallback: serviceStatus.fallback,
        chatgpt_available: serviceStatus.chatgpt_available,
        claude_available: serviceStatus.claude_available,
        overall_health: healthCheck.overall
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'Young Ellens Chatbot API',
      timestamp: new Date().toISOString(),
      message: 'AI services health check failed',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal error'
    });
  }
});

export default router;
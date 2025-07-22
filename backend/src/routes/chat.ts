import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EllensPersonalityEngine } from '../services/personalityEngine';
import { aiService } from '../services/aiService';

const router = Router();

// Initialize services
const personalityEngine = new EllensPersonalityEngine();

// POST /api/chat/send - Send message to Ellens
router.post('/send', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }

    // Generate response using Ellens personality engine
    const response = await personalityEngine.generateResponse(message, conversationId || 'default');

    res.json({
      id: uuidv4(),
      text: response.text,
      sender: 'ellens',
      timestamp: new Date().toISOString(),
      mood: response.mood,
      chaosLevel: response.chaosLevel,
      conversationId: conversationId || 'default'
    });
    return;

  } catch (error) {
    console.error('Error in chat/send:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: 'Ellens is having a moment... try again later 😵‍💫'
    });
    return;
  }
});

// POST /api/chat/new - Start new conversation
router.post('/new', async (req, res) => {
  try {
    const conversationId = uuidv4();
    
    // Initialize new personality state for this conversation
    personalityEngine.initializeConversation(conversationId);

    res.json({
      conversationId,
      message: 'Yo! Wat is er? Ik ben Young Ellens! 😎',
      timestamp: new Date().toISOString()
    });
    return;

  } catch (error) {
    console.error('Error in chat/new:', error);
    res.status(500).json({
      error: 'Failed to start new conversation'
    });
    return;
  }
});

// GET /api/chat/:id - Get conversation (placeholder for future implementation)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Implement conversation retrieval from database
    res.json({
      id,
      messages: [],
      message: 'Conversation history not implemented yet'
    });
    return;

  } catch (error) {
    console.error('Error in chat/:id:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation'
    });
    return;
  }
});

export default router;
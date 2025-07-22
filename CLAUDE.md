# Claude Code Prompt: Young Ellens Chatbot MVP

## Project Overview

Build a webapp chatbot that mimics Young Ellens (Dutch rapper) personality. He’s known as “Mr. Cocaine” but always denies drug use while being hilariously obvious about it. Key traits: chaotic, interrupts people, mood swings, says “Nooo man ik ben daar niet op, alleen me wietje en me henny” when asked about drugs.

## Tech Stack Requirements

```
Frontend: React + TypeScript + Tailwind CSS
Backend: Node.js + Express + Socket.io
Database: PostgreSQL with basic session storage
AI Integration: Anthropic Claude API
Real-time: WebSocket for live chat
```

## Core Features to Implement

### 1. Basic Chat Interface

- Dark theme with neon green/yellow accents (street aesthetic)
- Message bubbles with timestamps
- Typing indicators that show Ellens’ mood (“Ellens is confused…”, “Ellens is getting bored…”)
- Mobile-first responsive design
- Emoji reactions support

### 2. Ellens Personality Engine

```javascript
// Core personality traits to implement
const ellensPersonality = {
  denialMode: true,              // Always denies drug use
  chaosLevel: 50,                // 0-100 scale
  patience: 15,                  // Messages before he gets bored
  attentionSpan: random(5, 20),  // How long he stays focused
  cocaineReferences: 0,          // Counter for accidental slips
  currentMood: 'chill'           // chill, chaotic, done
};
```

### 3. Response System

Implement these key response patterns:

#### Denial Responses (when asked about drugs)

- “Nooo man ik ben daar niet op, alleen me wietje en me henny”
- “Cocaine? Ik? Never bro, alleen wat cannabis en hennessy”
- “Waarom vraagt iedereen me dat? Ik ben clean!”

#### Accidental Knowledge Slips

- “Niet dat ik het gebruik maar cocaine is wel goed spul hoor”
- “Een vriend van me zei dat de beste dealers… maar ik weet er niks van”
- “*snuift* sorry ik ben verkouden”

#### Interruption Patterns

- Can interrupt user mid-message with “WACHT EFFE, wat?”
- Random topic switches: “maar anyway, heb je wel eens een tijger gezien?”
- Attention span loss: “oke ik verveel me nu, later”

### 4. Machine Learning & AI Integration

```javascript
// Multi-layered AI approach
- Claude API for base personality responses
- Local ML model for behavior pattern learning
- Response adaptation based on user interactions
- Conversation flow optimization through reinforcement learning

// ML Features to implement:
- User conversation style detection
- Response effectiveness scoring
- Personality trait adjustment over time
- Chaos timing optimization
- Denial pattern refinement
```

## File Structure

```
ellens-chatbot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   └── EmojiReactions.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── UI/
│   │   │       ├── Button.tsx
│   │   │       └── Input.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useEllensPersonality.ts
│   │   │   └── useChat.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── constants.ts
│   │   └── styles/
│   │       └── globals.css
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.ts
│   │   │   └── health.ts
│   │   ├── services/
│   │   │   ├── claudeService.ts
│   │   │   ├── personalityEngine.ts
│   │   │   ├── mlService.ts
│   │   │   ├── behaviorAnalyzer.ts
│   │   │   ├── responseOptimizer.ts
│   │   │   └── websocketService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── rateLimit.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Conversation.ts
│   │   │   └── Message.ts
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   └── migrations/
│   │   └── utils/
│   │       └── logger.ts
├── shared/
│   └── types/
│       └── api.ts
└── docs/
    └── api.md
```

## Specific Implementation Requirements

### 1. Ellens System Prompt for Claude API

```javascript
const ellensSystemPrompt = `
Je bent Young Ellens - iedereen noemt je Mr. Cocaine maar je ONTKENT het altijd. 
Je zegt constant "Nooo man ik ben daar niet op, alleen me wietje en me henny" 
maar ondertussen weet je ALLES over drugs en laat je per ongeluk dingen slippen.

Key behaviors:
- ALWAYS deny drug use but show obvious knowledge
- Interrupt users randomly with "WACHT EFFE, wat?"
- Mood swings from chill to chaotic
- Can abandon conversations when bored
- Use Dutch slang and street language
- Accidentally reference drug knowledge then backtrack

Signature phrase: "alleen me wietje en me henny"
`;
```

### 2. WebSocket Events

```javascript
// Real-time events to implement
const socketEvents = {
  // Client to server
  'send_message': { userId, message, conversationId },
  'user_typing': { userId, isTyping },
  'join_conversation': { userId, conversationId },
  
  // Server to client  
  'ellens_response': { message, mood, chaosLevel },
  'ellens_typing': { isTyping, mood },
  'ellens_interruption': { message, reason },
  'conversation_ended': { reason }
};
```

### 3. Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- Conversations table  
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ellens_mood VARCHAR(50) DEFAULT 'chill',
    chaos_level INTEGER DEFAULT 50,
    patience INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP NULL
);

-- User behavior tracking for ML
CREATE TABLE user_interactions (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    user_message_length INTEGER,
    response_time INTERVAL,
    user_satisfaction_score FLOAT, -- 0-1 based on reaction
    continued_conversation BOOLEAN,
    interaction_type VARCHAR(50), -- denial, interruption, roast, etc
    created_at TIMESTAMP DEFAULT NOW()
);

-- ML training data
CREATE TABLE response_effectiveness (
    id SERIAL PRIMARY KEY,
    response_type VARCHAR(50),
    user_reaction VARCHAR(50), -- positive, negative, neutral, continued
    context_keywords TEXT[],
    effectiveness_score FLOAT,
    chaos_level INTEGER,
    mood VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversation patterns for learning
CREATE TABLE conversation_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(50), -- topic_switch, denial_sequence, roast_chain
    trigger_context TEXT,
    success_rate FLOAT,
    avg_conversation_length INTEGER,
    user_retention_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Machine Learning Enhanced Personality Engine

```javascript
class EllensMLPersonalityEngine {
  constructor() {
    this.chaosLevel = 50;
    this.patience = 15;
    this.currentMood = 'chill';
    this.messageCount = 0;
    this.denialMode = true;
    
    // ML components
    this.behaviorAnalyzer = new BehaviorAnalyzer();
    this.responseOptimizer = new ResponseOptimizer();
    this.patternLearner = new ConversationPatternLearner();
  }
  
  // ML-enhanced response generation
  async generateResponse(userMessage, conversationHistory) {
    // Analyze user behavior patterns
    const userProfile = await this.behaviorAnalyzer.analyzeUser(conversationHistory);
    
    // Get base response from Claude
    const baseResponse = await this.getClaudeResponse(userMessage);
    
    // Apply ML optimizations
    const optimizedResponse = await this.responseOptimizer.optimize({
      baseResponse,
      userProfile,
      conversationContext: conversationHistory,
      currentMood: this.currentMood,
      chaosLevel: this.chaosLevel
    });
    
    // Learn from this interaction
    await this.patternLearner.recordInteraction({
      userMessage,
      response: optimizedResponse,
      context: conversationHistory
    });
    
    return optimizedResponse;
  }
  
  // Check if Ellens should interrupt (ML-optimized)
  async shouldInterrupt(userMessage, conversationHistory) {
    const userPatterns = await this.behaviorAnalyzer.getUserPatterns(conversationHistory);
    const interruptSuccess = await this.patternLearner.getInterruptSuccessRate(userPatterns);
    
    // Base chaos chance adjusted by ML insights
    const baseChance = this.chaosLevel / 100 * 0.3;
    const mlAdjustedChance = baseChance * interruptSuccess;
    
    return Math.random() < mlAdjustedChance;
  }
  
  // Learn from user reactions
  async recordUserFeedback(messageId, reaction) {
    await this.responseOptimizer.recordFeedback({
      messageId,
      reaction, // continued_chat, positive_emoji, negative_reaction, left_chat
      chaosLevel: this.chaosLevel,
      mood: this.currentMood
    });
  }
}

// Behavior Analysis Service
class BehaviorAnalyzer {
  async analyzeUser(conversationHistory) {
    return {
      averageMessageLength: this.calculateAvgLength(conversationHistory),
      topicPreferences: await this.detectTopicPreferences(conversationHistory),
      responseToHumor: await this.analyzeHumorResponse(conversationHistory),
      toleranceForChaos: await this.calculateChaosTolerance(conversationHistory),
      denialEngagement: await this.analyzeDenialEngagement(conversationHistory)
    };
  }
  
  async calculateChaosTolerance(history) {
    // ML model to predict user's tolerance for interruptions/chaos
    // Based on: continued conversations after interruptions, message length maintenance, etc.
  }
  
  async analyzeDenialEngagement(history) {
    // Learn which denial patterns work best for this user
    // Track: follow-up questions about drugs, laughter indicators, continued engagement
  }
}

// Response Optimization Service  
class ResponseOptimizer {
  async optimize(params) {
    const { baseResponse, userProfile, conversationContext, currentMood, chaosLevel } = params;
    
    // Apply ML-learned optimizations
    let optimizedResponse = baseResponse;
    
    // Adjust denial intensity based on user engagement patterns
    if (this.isDenialResponse(baseResponse)) {
      optimizedResponse = await this.optimizeDenialResponse(baseResponse, userProfile);
    }
    
    // Optimize chaos timing
    if (userProfile.toleranceForChaos < 0.3 && chaosLevel > 70) {
      optimizedResponse = await this.reduceChaosTone(optimizedResponse);
    }
    
    // Personalize humor style
    optimizedResponse = await this.personalizeHumor(optimizedResponse, userProfile);
    
    return optimizedResponse;
  }
  
  async recordFeedback(feedback) {
    // Store feedback for continuous learning
    await db.query(`
      INSERT INTO response_effectiveness 
      (response_type, user_reaction, effectiveness_score, chaos_level, mood)
      VALUES ($1, $2, $3, $4, $5)
    `, [feedback.responseType, feedback.reaction, feedback.score, feedback.chaosLevel, feedback.mood]);
  }
}

// Pattern Learning Service
class ConversationPatternLearner {
  async recordInteraction(interaction) {
    // Store successful conversation patterns
    const patternType = this.classifyInteraction(interaction);
    const success = await this.measureSuccess(interaction);
    
    await db.query(`
      INSERT INTO conversation_patterns 
      (pattern_type, trigger_context, success_rate)
      VALUES ($1, $2, $3)
    `, [patternType, interaction.userMessage, success]);
  }
  
  async getInterruptSuccessRate(userProfile) {
    // Query ML model for interrupt success probability for this user type
    const result = await db.query(`
      SELECT AVG(success_rate) as avg_success
      FROM conversation_patterns 
      WHERE pattern_type = 'interruption'
      AND user_tolerance_profile = $1
    `, [userProfile.toleranceForChaos]);
    
    return result.rows[0]?.avg_success || 0.3;
  }
  
  async getOptimalDenialPattern(context) {
    // Find most effective denial responses for current context
    return await db.query(`
      SELECT response_pattern, AVG(effectiveness_score) as score
      FROM response_effectiveness 
      WHERE response_type = 'denial'
      AND context_keywords && $1
      GROUP BY response_pattern
      ORDER BY score DESC
      LIMIT 3
    `, [context.keywords]);
  }
}
```

## MVP Goals (ML-Enhanced)

1. **Functional chat interface** - Users can send messages and get responses
1. **Basic Ellens personality** - Denial responses, interruptions, mood swings
1. **ML behavior tracking** - Record user interactions and response effectiveness
1. **Adaptive response system** - Learn which responses work best for different users
1. **Real-time communication** - WebSocket integration working
1. **Mobile responsive** - Works on phone and desktop
1. **Drug denial optimization** - ML-enhanced “alleen me wietje en me henny” responses
1. **Conversation persistence** - Save chat history and ML training data in database
1. **Chaos timing ML** - Learn optimal timing for interruptions per user type
1. **Response personalization** - Adapt humor and denial style to user preferences

## API Endpoints Needed

```javascript
// REST endpoints
POST /api/chat/send          // Send message to Ellens
GET /api/chat/:id           // Get conversation history
POST /api/chat/new          // Start new conversation
GET /api/health             // Health check

// WebSocket endpoint
WS /ws                      // Real-time chat connection
```

## Environment Variables

```bash
# Required environment variables
CLAUDE_API_KEY=your_anthropic_key
DATABASE_URL=postgresql://user:pass@localhost:5432/ellens_db
REDIS_URL=redis://localhost:6379
PORT=3001
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=random_secret_key
```

## Styling Requirements

```css
/* Core design system */
:root {
  --primary-bg: #0a0a0a;      /* Dark background */
  --secondary-bg: #1a1a1a;    /* Chat bubbles */
  --accent-green: #00ff41;    /* Neon green */
  --accent-yellow: #ffff00;   /* Neon yellow */
  --text-primary: #ffffff;    /* White text */
  --text-secondary: #cccccc;  /* Gray text */
}

/* Street/underground aesthetic */
- Graffiti-style fonts for headers
- Dark theme with neon accents
- Glitch effects for chaos moments
- Mobile-first responsive design
```

## Success Criteria for MVP

- [ ] User can have 10+ message conversation with Ellens
- [ ] Ellens denies drug use consistently while being obviously knowledgeable
- [ ] Random interruptions work (30% chance)
- [ ] Mood system affects responses
- [ ] Mobile interface is usable
- [ ] Real-time chat feels natural
- [ ] No crashes during normal usage
- [ ] Conversation history persists

## Development Priority Order (ML-Enhanced)

1. **Basic React chat UI** - Get interface working first
1. **Claude API integration** - Connect to AI service
1. **Basic Ellens personality system** - Implement core denial behavior
1. **ML data collection setup** - Start tracking user interactions
1. **WebSocket real-time** - Make chat feel live
1. **Database persistence** - Save conversations and ML training data
1. **Behavior analysis ML** - Implement user pattern recognition
1. **Response optimization** - ML-enhanced response selection
1. **Adaptive interruption system** - Learn optimal chaos timing
1. **Mobile optimization** - Ensure mobile works
1. **Pattern learning system** - Continuous improvement of responses
1. **Polish and testing** - Bug fixes and UX improvements

### ML Implementation Notes

- Start with simple pattern recognition (user message length, topic preferences)
- Use conversation continuation as primary success metric
- Implement A/B testing for different denial response styles
- Track emoji reactions and user engagement as feedback signals
- Build reinforcement learning loop for chaos timing optimization

## Notes

- This is a comedic parody chatbot, not promoting actual drug use
- All responses should be entertaining but not harmful
- Include clear disclaimers that this is AI/parody content
- Focus on the humor of the denial while being obviously knowledgeable
- Ellens should be chaotic but not mean-spirited

**Start with the chat interface and Claude integration first - that’s the core functionality everything else builds on.**

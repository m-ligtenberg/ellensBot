# 🎤 Young Ellens Chatbot - Dutch Rapper AI

A comedic AI chatbot that mimics Young Ellens (Dutch rapper) personality. Known as "Mr. Cocaine" but always denies drug use while being hilariously obvious about it.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- At least one AI API key (OpenAI or Claude)

### Installation
```bash
# Install all dependencies
npm run install:all

# Copy environment template and add your API keys
cp .env.local.example .env.local
```

### Development
```bash
# Start both frontend and backend
npm run dev

# Access the app
Frontend: http://localhost:3000
Backend: http://localhost:3001
Admin Panel: Use password 'ellens2024'
```

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL/SQLite with session storage
- **AI**: Anthropic Claude API + OpenAI API
- **Real-time**: WebSocket for live chat
- **Deployment**: Railway (backend) + GitHub Pages (frontend)

## 🎭 Core Features

### Ellens Personality Engine
- **Denial Mode**: Always denies drug use with signature phrase "Nooo man ik ben daar niet op, alleen me wietje en me henny"
- **Chaos System**: Random interruptions and mood swings
- **Knowledge Slips**: Accidentally reveals drug knowledge then backtracks
- **Attention Span**: Gets bored and can abandon conversations

### Chat Features
- Dark theme with neon green/yellow accents
- Real-time WebSocket communication
- Emoji reactions system
- Typing indicators showing Ellens' mood
- Mobile-responsive design
- ML-powered response optimization

### Advanced Features
- Machine learning behavior analysis
- User conversation pattern recognition
- Response effectiveness tracking
- Adaptive interruption timing
- Content scraping and learning system
- Voice cloning capabilities
- Admin panel with analytics

## 📁 Project Structure

```
ellensBot/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/         # Chat interface components
│   │   │   ├── Admin/        # Admin panel components
│   │   │   └── Analytics/    # Analytics dashboard
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API and WebSocket services
│   │   └── types/            # TypeScript definitions
├── backend/           # Node.js Express backend
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Core business logic
│   │   │   ├── personalityEngine.ts  # Ellens personality system
│   │   │   ├── aiService.ts          # AI integration
│   │   │   ├── mlService.ts          # Machine learning
│   │   │   └── websocketService.ts   # Real-time communication
│   │   ├── models/           # Database models
│   │   └── database/         # Database connection and migrations
└── data/              # Training data and responses
```

## 🔧 Configuration

### Required Environment Variables
```bash
SESSION_SECRET=your-session-secret-here
```

### AI API Keys (at least one required)
```bash
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Optional Configuration
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/ellens_db
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=500
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions covering:
- Quick Deploy (Railway + GitHub Pages) - 10 minutes
- Local Development setup
- Environment configuration
- API key setup

## 🎯 Key Personality Traits

### Signature Responses
- **Drug Denial**: "Nooo man ik ben daar niet op, alleen me wietje en me henny"
- **Interruptions**: "WACHT EFFE, wat?"
- **Knowledge Slips**: "Niet dat ik het gebruik maar cocaine is wel goed spul hoor"
- **Boredom**: "oke ik verveel me nu, later"

### Behavior Patterns
- Always denies cocaine use but shows obvious knowledge
- Interrupts users randomly (30% chance)
- Mood swings from chill to chaotic
- Can abandon conversations when attention span runs out
- Uses Dutch slang and street language

## 🧠 Machine Learning Features

- **User Behavior Analysis**: Tracks conversation patterns and preferences
- **Response Optimization**: ML-enhanced response selection based on effectiveness
- **Adaptive Interruptions**: Learns optimal timing for chaos moments
- **Personality Learning**: Continuously improves denial patterns and humor
- **Content Discovery**: Automated scraping for personality enhancement

## 🔒 Security Features

- Rate limiting for API protection
- Environment variable validation
- Secure session management
- Input sanitization and validation
- CORS configuration for cross-origin requests

## 📊 Admin Panel

Access the admin panel with password `ellens2024`:
- Real-time conversation analytics
- ML training data management
- Personality scoring and adjustment
- Source discovery and content scraping
- System health monitoring

## 🧪 Testing

```bash
# Run backend tests
npm run test

# Run linting
npm run lint

# Check deployment readiness
npm run deploy:check
```

## 📝 Development Scripts

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both projects for production
npm start               # Start production server
npm run backend:dev     # Backend development server only
npm run frontend:dev    # Frontend development server only
npm run db:init         # Initialize database
npm run db:reset        # Reset database
```

## 🎨 Design System

- **Colors**: Dark theme with neon green (#00ff41) and yellow (#ffff00) accents
- **Fonts**: Graffiti-style headers with clean body text
- **Effects**: Glitch effects for chaos moments
- **Layout**: Mobile-first responsive design
- **Style**: Street/underground aesthetic

## 🤝 Contributing

This is a comedic parody chatbot for entertainment purposes only. The project:
- Does not promote actual drug use
- Includes clear disclaimers about AI/parody content
- Focuses on humor while remaining non-harmful
- Maintains responsible AI usage practices

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Acknowledgments

- Built for entertainment and demonstration of AI personality systems
- Inspired by Dutch rap culture and comedy
- Uses state-of-the-art AI models for natural language processing
- Implements modern web development best practices
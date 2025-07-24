import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();
import rateLimit from 'express-rate-limit';
import { env, environmentConfig } from './config/environment';

// Import routes
import chatRoutes from './routes/chat';
import healthRoutes from './routes/health';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import scraperRoutes from './routes/scraper';
import submissionsRoutes from './routes/submissions';
import advancedMLRoutes from './routes/advancedML';
import personalityRoutes from './routes/personality';

// Import services
import { initializeWebSocketService } from './services/websocketService';
import { initializeDatabase } from './utils/init-db';

// Load environment variables

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://michligtenberg.nl',
    'https://www.michligtenberg.nl',
    'https://m-ligtenberg.github.io',
    env.FRONTEND_URL
  ].filter((url): url is string => Boolean(url)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to most routes but be more lenient for development
if (environmentConfig.isProduction()) {
  app.use('/api/', limiter);
} else {
  // More lenient rate limiting for development
  const devLimiter = rateLimit({
    windowMs: 1000 * 60, // 1 minute
    max: 500, // 500 requests per minute in development
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', devLimiter);
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/ml', advancedMLRoutes);
app.use('/api/personality', personalityRoutes);

// Socket.io setup
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Initialize WebSocket service
initializeWebSocketService(io);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: environmentConfig.isDevelopment() ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = env.PORT;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🎤 Young Ellens Backend server running on port ${PORT}`);
      console.log(`📡 WebSocket server initialized`);
      console.log(`🌐 CORS enabled for: ${env.FRONTEND_URL}`);
      console.log(`💾 Database initialization completed`);
      
      // Display API configuration status
      const aiKeys = environmentConfig.hasAIKeys();
      console.log(`🤖 AI Configuration: ${aiKeys.any ? '✅ Ready' : '⚠️ Fallback only'}`);
      if (aiKeys.openai) console.log('  - OpenAI: ✅ Available');
      if (aiKeys.claude) console.log('  - Claude: ✅ Available');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

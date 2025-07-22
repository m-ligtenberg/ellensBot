import { Server, Socket } from 'socket.io';
import { EllensPersonalityEngine } from './personalityEngine';
import { chatPersistence } from './chatPersistenceService';
import { advancedScraper } from './advancedScraper';
import { webScraper } from './webScraper';
import { v4 as uuidv4 } from 'uuid';

interface SocketUser {
  id: string;
  socket: Socket;
  conversationId: string;
  isTyping: boolean;
  lastActivity: Date;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ellens';
  timestamp: Date;
  conversationId: string;
  mood?: string;
  chaosLevel?: number;
}

export function initializeWebSocketService(io: Server): void {
  const personalityEngine = new EllensPersonalityEngine();
  const connectedUsers = new Map<string, SocketUser>();
  const adminSockets = new Set<string>(); // Track admin panel connections

  io.on('connection', async (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Initialize user
    const userId = uuidv4();
    const conversationId = uuidv4();
    
    const user: SocketUser = {
      id: userId,
      socket: socket,
      conversationId: conversationId,
      isTyping: false,
      lastActivity: new Date()
    };

    connectedUsers.set(socket.id, user);
    
    // Initialize conversation in personality engine
    personalityEngine.initializeConversation(conversationId);
    
    // Initialize persistent session
    try {
      await chatPersistence.initializeSession(
        socket.id, 
        userId, 
        conversationId,
        socket.handshake.headers['user-agent'],
        socket.handshake.address
      );
    } catch (error) {
      console.error('Failed to initialize persistent session:', error);
      // Continue without persistence
    }

    // Send welcome message
    socket.emit('ellens_response', {
      id: uuidv4(),
      text: "Yo! Wat is er? Ik ben Young Ellens! 😎",
      sender: 'ellens',
      timestamp: new Date().toISOString(),
      mood: 'chill',
      chaosLevel: 30,
      conversationId: conversationId
    });

    // Handle user sending message
    socket.on('send_message', async (data: { message: string; conversationId?: string }) => {
      try {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const { message } = data;
        const currentConversationId = data.conversationId || user.conversationId;

        // Validate message
        if (!message || typeof message !== 'string' || message.length > 500) {
          socket.emit('error', { message: 'Invalid message format or too long' });
          return;
        }

        user.lastActivity = new Date();
        
        // Save user message to database
        const userMessageId = uuidv4();
        const messageStartTime = Date.now();
        
        try {
          await chatPersistence.saveUserMessage(
            socket.id, 
            userMessageId, 
            message,
            Date.now() - messageStartTime
          );
        } catch (error) {
          console.error('Failed to save user message:', error);
        }

        // Show Ellens typing indicator  
        const ellensState = personalityEngine.getConversationState(currentConversationId);
        const typingMood = ellensState?.currentMood || 'chill';
        
        socket.emit('ellens_typing', { 
          isTyping: true, 
          mood: typingMood 
        });

        // Generate response with some delay for realism
        const delay = 800 + Math.random() * 2000; // 0.8-2.8 seconds
        
        setTimeout(async () => {
          try {
            const response = await personalityEngine.generateResponse(message, currentConversationId, user.id);
            
            // Stop typing indicator
            socket.emit('ellens_typing', { 
              isTyping: false, 
              mood: response.mood 
            });

            // Send Ellens response
            const responseMessage: ChatMessage = {
              id: uuidv4(),
              text: response.text,
              sender: 'ellens',
              timestamp: new Date(),
              conversationId: currentConversationId,
              mood: response.mood,
              chaosLevel: response.chaosLevel
            };

            socket.emit('ellens_response', {
              ...responseMessage,
              timestamp: responseMessage.timestamp.toISOString()
            });

            // Save Ellens response to database
            try {
              const currentState = personalityEngine.getConversationState(currentConversationId);
              await chatPersistence.saveEllensResponse(
                socket.id,
                responseMessage.id,
                response,
                currentState!
              );
            } catch (error) {
              console.error('Failed to save Ellens response:', error);
            }

            // Handle interruptions
            if (response.shouldInterrupt && Math.random() < 0.3) {
              setTimeout(() => {
                socket.emit('ellens_interruption', {
                  message: "WACHT EFFE, waar hadden we het ook alweer over? 😵‍💫",
                  reason: response.interruptionReason || 'chaos'
                });
              }, 1000 + Math.random() * 3000);
            }

            // Check if conversation should end due to boredom
            const currentState = personalityEngine.getConversationState(currentConversationId);
            if (currentState?.currentMood === 'done' && currentState.patience <= 0) {
              setTimeout(() => {
                socket.emit('conversation_ended', {
                  reason: 'ellens_bored',
                  message: 'Ellens left the chat... (probably went to get some "hennessy") 🙄'
                });
              }, 2000);
            }

          } catch (error) {
            console.error('Error generating response:', error);
            
            socket.emit('ellens_typing', { isTyping: false, mood: 'confused' });
            socket.emit('ellens_response', {
              id: uuidv4(),
              text: "Eh... mijn brein doet het even niet. Probeer later nog eens? 😵‍💫",
              sender: 'ellens',
              timestamp: new Date().toISOString(),
              mood: 'confused',
              chaosLevel: 50,
              conversationId: currentConversationId
            });
          }
        }, delay);

      } catch (error) {
        console.error('Error in send_message:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle user typing
    socket.on('user_typing', (data: { isTyping: boolean }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.isTyping = data.isTyping;
        user.lastActivity = new Date();
      }
    });

    // Handle join conversation
    socket.on('join_conversation', (data: { conversationId: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.conversationId = data.conversationId;
        user.lastActivity = new Date();
        
        // Initialize conversation if it doesn't exist
        const existingState = personalityEngine.getConversationState(data.conversationId);
        if (!existingState) {
          personalityEngine.initializeConversation(data.conversationId);
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
      
      // End persistent session
      try {
        await chatPersistence.endConversation(socket.id, `disconnect_${reason}`);
      } catch (error) {
        console.error('Failed to end persistent session:', error);
      }
      
      // Clean up both user and admin connections
      connectedUsers.delete(socket.id);
      adminSockets.delete(socket.id);
    });

    // Admin panel WebSocket events
    socket.on('join_admin', () => {
      adminSockets.add(socket.id);
      console.log(`👨‍💼 Admin joined: ${socket.id}`);
      
      // Send initial scraper stats
      const basicStats = webScraper.getScrapingStats();
      const advancedStats = advancedScraper.getMonitoringStats();
      
      socket.emit('scraper_stats_update', {
        basic: basicStats,
        advanced: {
          ...advancedStats,
          contentSources: advancedStats.sources.length,
          highQualityRate: advancedStats.totalContentFound > 0 
            ? Math.round((advancedStats.highQualityContent / advancedStats.totalContentFound) * 100) 
            : 0
        },
        timestamp: new Date().toISOString()
      });
    });

    socket.on('leave_admin', () => {
      adminSockets.delete(socket.id);
      console.log(`👨‍💼 Admin left: ${socket.id}`);
    });

    socket.on('request_scraper_update', () => {
      if (adminSockets.has(socket.id)) {
        const basicStats = webScraper.getScrapingStats();
        const advancedStats = advancedScraper.getMonitoringStats();
        
        socket.emit('scraper_stats_update', {
          basic: basicStats,
          advanced: {
            ...advancedStats,
            contentSources: advancedStats.sources.length,
            highQualityRate: advancedStats.totalContentFound > 0 
              ? Math.round((advancedStats.highQualityContent / advancedStats.totalContentFound) * 100) 
              : 0
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`WebSocket error for ${socket.id}:`, error);
    });
  });

  // Cleanup inactive connections periodically
  setInterval(() => {
    const now = new Date();
    const inactiveTimeout = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, user] of connectedUsers.entries()) {
      if (now.getTime() - user.lastActivity.getTime() > inactiveTimeout) {
        console.log(`🧹 Cleaning up inactive connection: ${socketId}`);
        
        // End persistent session
        chatPersistence.endConversation(socketId, 'inactivity_timeout').catch(console.error);
        
        user.socket.disconnect(true);
        connectedUsers.delete(socketId);
      }
    }
    
    // Also cleanup any orphaned persistent sessions
    const cleanedCount = chatPersistence.cleanupInactiveSessions(30);
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive persistent sessions`);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Broadcast scraper updates to admin panels every 15 seconds
  setInterval(() => {
    if (adminSockets.size > 0) {
      const basicStats = webScraper.getScrapingStats();
      const advancedStats = advancedScraper.getMonitoringStats();
      
      const updateData = {
        basic: basicStats,
        advanced: {
          ...advancedStats,
          contentSources: advancedStats.sources.length,
          highQualityRate: advancedStats.totalContentFound > 0 
            ? Math.round((advancedStats.highQualityContent / advancedStats.totalContentFound) * 100) 
            : 0
        },
        timestamp: new Date().toISOString()
      };

      // Broadcast to all admin connections
      adminSockets.forEach(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('scraper_stats_update', updateData);
        } else {
          // Clean up invalid socket references
          adminSockets.delete(socketId);
        }
      });
    }
  }, 15000); // Every 15 seconds

  // Export broadcast function for external use
  (global as any).broadcastToAdmins = (eventName: string, data: any) => {
    adminSockets.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(eventName, data);
      }
    });
  };

  console.log('🚀 WebSocket service initialized successfully');
}
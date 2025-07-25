import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { websocketService } from '../services/websocket';
import { logger } from '../utils/logger';

export const useWebSocketChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEllensTyping, setIsEllensTyping] = useState(false);
  const [ellensTypingMood, setEllensTypingMood] = useState<string>('chill');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    logger.debug('WebSocket sendMessage called', { text, isConnected });
    if (!isConnected) {
      logger.websocketError('WebSocket not connected when trying to send message');
      return;
    }

    try {
      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text,
        sender: 'user',
        timestamp: new Date()
      };
      logger.debug('Adding user message', { messageId: userMessage.id, textLength: text.length });
      addMessage(userMessage);

      // Send to backend
      logger.debug('Sending message to WebSocket');
      websocketService.sendMessage(text);
    } catch (error) {
      logger.websocketError('Failed to send message', error as Error, { text: text.substring(0, 100) });
      setConnectionError('Failed to send message');
    }
  }, [isConnected, addMessage]);

  const setUserTyping = useCallback((isTyping: boolean) => {
    if (isConnected) {
      websocketService.setUserTyping(isTyping);
    }
  }, [isConnected]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions } || {};
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...msg, reactions };
      }
      return msg;
    }));
    
    // Send reaction to server (if connected)
    if (isConnected) {
      websocketService.sendReaction(messageId, emoji);
    }
  }, [isConnected]);

  // Initialize WebSocket connection
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = async () => {
      try {
        setConnectionError(null);
        
        // Set up connection state listener
        websocketService.onConnectionStateChange((state) => {
          if (isMounted) {
            setConnectionState(state);
            setIsConnected(state === 'connected');
          }
        });
        
        await websocketService.connect();
        
        if (!isMounted) return;

        // Set up event listeners
        websocketService.onEllensResponse((message) => {
          if (isMounted) {
            addMessage(message);
          }
        });

        websocketService.onEllensTyping((isTyping, mood) => {
          if (isMounted) {
            setIsEllensTyping(isTyping);
            setEllensTypingMood(mood);
          }
        });

        websocketService.onEllensInterruption((message, reason) => {
          if (isMounted) {
            const interruptionMessage: Message = {
              id: `interruption-${Date.now()}`,
              text: message,
              sender: 'ellens',
              timestamp: new Date(),
              mood: 'chaotic',
              chaosLevel: 80
            };
            addMessage(interruptionMessage);
          }
        });

        websocketService.onConversationEnded((reason, message) => {
          if (isMounted) {
            const endMessage: Message = {
              id: `end-${Date.now()}`,
              text: message,
              sender: 'ellens',
              timestamp: new Date(),
              mood: 'done',
              chaosLevel: 10
            };
            addMessage(endMessage);
          }
        });

        websocketService.onError((errorMessage) => {
          if (isMounted) {
            console.error('WebSocket error:', errorMessage);
            setConnectionError(errorMessage);
          }
        });

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        if (isMounted) {
          setConnectionError('Failed to connect to server. Please try again.');
          setIsConnected(false);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [addMessage]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    setConnectionError(null);
    try {
      await websocketService.retry();
    } catch (error) {
      console.error('Retry connection failed:', error);
      setConnectionError('Failed to reconnect to server');
    }
  }, []);

  return {
    messages,
    isEllensTyping,
    ellensTypingMood,
    isConnected,
    connectionError,
    connectionState,
    sendMessage,
    setUserTyping,
    retryConnection,
    addReaction
  };
};
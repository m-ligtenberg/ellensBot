import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { websocketService } from '../services/websocket';

export const useWebSocketChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEllensTyping, setIsEllensTyping] = useState(false);
  const [ellensTypingMood, setEllensTypingMood] = useState<string>('chill');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!isConnected) {
      console.error('WebSocket not connected');
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
      addMessage(userMessage);

      // Send to backend
      websocketService.sendMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      setConnectionError('Failed to send message');
    }
  }, [isConnected, addMessage]);

  const setUserTyping = useCallback((isTyping: boolean) => {
    if (isConnected) {
      websocketService.setUserTyping(isTyping);
    }
  }, [isConnected]);

  // Initialize WebSocket connection
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = async () => {
      try {
        setConnectionError(null);
        await websocketService.connect();
        
        if (!isMounted) return;

        setIsConnected(true);

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
  const retryConnection = useCallback(() => {
    setConnectionError(null);
    websocketService.disconnect();
    
    // Reconnect after a short delay
    setTimeout(async () => {
      try {
        await websocketService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Retry connection failed:', error);
        setConnectionError('Failed to reconnect to server');
      }
    }, 1000);
  }, []);

  return {
    messages,
    isEllensTyping,
    ellensTypingMood,
    isConnected,
    connectionError,
    sendMessage,
    setUserTyping,
    retryConnection
  };
};
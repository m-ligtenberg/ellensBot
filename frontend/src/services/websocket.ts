import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

interface ServerToClientEvents {
  ellens_response: (data: {
    id: string;
    text: string;
    sender: 'ellens';
    timestamp: string;
    mood: string;
    chaosLevel: number;
    conversationId: string;
  }) => void;
  ellens_typing: (data: { isTyping: boolean; mood: string }) => void;
  ellens_interruption: (data: { message: string; reason: string }) => void;
  conversation_ended: (data: { reason: string; message: string }) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  send_message: (data: { message: string; conversationId?: string }) => void;
  user_typing: (data: { isTyping: boolean }) => void;
  join_conversation: (data: { conversationId: string }) => void;
}

export class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private conversationId: string = '';

  connect(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to backend WebSocket');
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket:', reason);
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('send_message', {
      message,
      conversationId: this.conversationId
    });
  }

  setUserTyping(isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('user_typing', { isTyping });
    }
  }

  joinConversation(conversationId: string): void {
    this.conversationId = conversationId;
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  onEllensResponse(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('ellens_response', (data) => {
        const message: Message = {
          id: data.id,
          text: data.text,
          sender: data.sender,
          timestamp: new Date(data.timestamp),
          mood: data.mood as any,
          chaosLevel: data.chaosLevel
        };
        callback(message);
      });
    }
  }

  onEllensTyping(callback: (isTyping: boolean, mood: string) => void): void {
    if (this.socket) {
      this.socket.on('ellens_typing', (data) => {
        callback(data.isTyping, data.mood);
      });
    }
  }

  onEllensInterruption(callback: (message: string, reason: string) => void): void {
    if (this.socket) {
      this.socket.on('ellens_interruption', (data) => {
        callback(data.message, data.reason);
      });
    }
  }

  onConversationEnded(callback: (reason: string, message: string) => void): void {
    if (this.socket) {
      this.socket.on('conversation_ended', (data) => {
        callback(data.reason, data.message);
      });
    }
  }

  onError(callback: (message: string) => void): void {
    if (this.socket) {
      this.socket.on('error', (data) => {
        callback(data.message);
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConversationId(): string {
    return this.conversationId;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
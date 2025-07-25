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
  add_reaction: (data: { messageId: string; emoji: string }) => void;
}

export class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private conversationId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isManualDisconnect: boolean = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private onConnectionStateChangeCallback?: (state: string) => void;

  connect(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected && this.connectionState === 'connected') {
        resolve(this.socket);
        return;
      }

      this.isManualDisconnect = false;
      this.connectionState = 'connecting';
      this.notifyConnectionStateChange();

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      
      this.socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to backend WebSocket');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.notifyConnectionStateChange();
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.connectionState = 'disconnected';
        this.notifyConnectionStateChange();
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket:', reason);
        this.connectionState = 'disconnected';
        this.notifyConnectionStateChange();
        
        // Auto-reconnect unless it was a manual disconnect
        if (!this.isManualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });

      // Set connection timeout
      setTimeout(() => {
        if (!this.socket?.connected) {
          this.connectionState = 'disconnected';
          this.notifyConnectionStateChange();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.notifyConnectionStateChange();
  }

  sendMessage(message: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      this.socket.emit('send_message', {
        message,
        conversationId: this.conversationId
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to send message');
    }
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

  sendReaction(messageId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket.emit('add_reaction', { messageId, emoji });
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

  getConnectionState(): string {
    return this.connectionState;
  }

  onConnectionStateChange(callback: (state: string) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  private notifyConnectionStateChange(): void {
    if (this.onConnectionStateChangeCallback) {
      this.onConnectionStateChangeCallback(this.connectionState);
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualDisconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    this.connectionState = 'reconnecting';
    this.notifyConnectionStateChange();

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000); // Exponential backoff, max 10s
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.connect();
        console.log('✅ Reconnected successfully');
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('❌ Max reconnection attempts reached');
          this.connectionState = 'disconnected';
          this.notifyConnectionStateChange();
        }
      }
    }, delay);
  }

  retry(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    this.reconnectAttempts = 0;
    this.isManualDisconnect = false;
    return this.connect();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
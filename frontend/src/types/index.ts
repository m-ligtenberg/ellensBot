export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ellens';
  timestamp: Date;
  mood?: 'chill' | 'chaotic' | 'done';
  chaosLevel?: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
  ellens_mood: string;
  chaos_level: number;
  patience: number;
  created_at: Date;
  ended_at?: Date;
}

export interface EllensPersonality {
  denialMode: boolean;
  chaosLevel: number;
  patience: number;
  attentionSpan: number;
  cocaineReferences: number;
  currentMood: 'chill' | 'chaotic' | 'done';
  messageCount: number;
}

export interface TypingIndicator {
  isTyping: boolean;
  mood: string;
  message?: string;
}
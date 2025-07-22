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

export interface ScrapingTarget {
  name: string;
  type: string;
  enabled: boolean;
  keywords: string[];
}

export interface ScraperStats {
  basic: {
    totalTargets: number;
    enabledTargets: number;
    scrapedContent: number;
    isCurrentlyRunning: boolean;
    targets: any[];
  };
  advanced: {
    isMonitoring: boolean;
    totalSources: number;
    enabledSources: number;
    activeSources: number;
    totalContentFound: number;
    highQualityContent: number;
    averageQualityScore: number;
    highQualityRate: number;
    sources: any[];
  };
  timestamp: string;
}

export interface ContentDiscovery {
  sourceName: string;
  contentCount: number;
  content: Array<{
    title: string;
    source: string;
    qualityScore: number;
    sentiment: string;
    timestamp: string;
  }>;
  totalQualityContent: number;
  timestamp: string;
}
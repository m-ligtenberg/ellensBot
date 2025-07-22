import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ScraperStats {
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

interface ContentDiscovery {
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

interface UseScraperWebSocketReturn {
  isConnected: boolean;
  stats: ScraperStats | null;
  recentDiscoveries: ContentDiscovery[];
  connectToScraper: () => void;
  disconnectFromScraper: () => void;
}

export const useScraperWebSocket = (
  onStatsUpdate?: (stats: ScraperStats) => void,
  onContentDiscovered?: (discovery: ContentDiscovery) => void
): UseScraperWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const statsRef = useRef<ScraperStats | null>(null);
  const discoveriesRef = useRef<ContentDiscovery[]>([]);

  const connectToScraper = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('🔗 Connecting to scraper WebSocket...');
    
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to scraper WebSocket');
      isConnectedRef.current = true;
      socket.emit('join_admin');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from scraper WebSocket');
      isConnectedRef.current = false;
    });

    socket.on('scraper_stats_update', (stats: ScraperStats) => {
      console.log('📊 Received scraper stats update:', stats);
      statsRef.current = stats;
      onStatsUpdate?.(stats);
    });

    socket.on('content_discovered', (discovery: ContentDiscovery) => {
      console.log('🎯 New content discovered:', discovery);
      discoveriesRef.current = [discovery, ...discoveriesRef.current.slice(0, 9)]; // Keep last 10
      onContentDiscovered?.(discovery);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      isConnectedRef.current = false;
    });

    socketRef.current = socket;
  }, [onStatsUpdate, onContentDiscovered]);

  const disconnectFromScraper = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from scraper WebSocket...');
      socketRef.current.emit('leave_admin');
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnectFromScraper();
    };
  }, [disconnectFromScraper]);

  return {
    isConnected: isConnectedRef.current,
    stats: statsRef.current,
    recentDiscoveries: discoveriesRef.current,
    connectToScraper,
    disconnectFromScraper
  };
};
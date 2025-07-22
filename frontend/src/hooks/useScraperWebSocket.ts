import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ScraperStats, ContentDiscovery } from '../types';
import { getWebSocketUrl } from '../utils/api';

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
    
    const socket = io(getWebSocketUrl(), {
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
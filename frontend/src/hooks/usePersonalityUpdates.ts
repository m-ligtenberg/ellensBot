import { useState, useEffect } from 'react';

interface PersonalityUpdate {
  id: string;
  timestamp: string;
  type: 'vocabulary' | 'personality' | 'denial' | 'language' | 'knowledge' | 'interruption';
  message: string;
  source: string;
}

interface PersonalityUpdatesResponse {
  success: boolean;
  updates: PersonalityUpdate[];
  total: number;
  message: string;
}

export const usePersonalityUpdates = (limit: number = 6) => {
  const [updates, setUpdates] = useState<PersonalityUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/personality/updates?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch personality updates');
      }

      const data: PersonalityUpdatesResponse = await response.json();
      setUpdates(data.updates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
    
    // Poll for updates every 60 seconds
    const interval = setInterval(fetchUpdates, 60000);
    
    return () => clearInterval(interval);
  }, [limit]);

  const getUpdateIcon = (type: PersonalityUpdate['type']) => {
    switch (type) {
      case 'vocabulary': return '📚';
      case 'personality': return '🎭';
      case 'denial': return '🚫';
      case 'language': return '🗣️';
      case 'knowledge': return '🧠';
      case 'interruption': return '⚡';
      default: return '🔄';
    }
  };

  const getUpdateColor = (type: PersonalityUpdate['type']) => {
    switch (type) {
      case 'vocabulary': return 'text-blue-400';
      case 'personality': return 'text-purple-400';
      case 'denial': return 'text-red-400';
      case 'language': return 'text-green-400';
      case 'knowledge': return 'text-yellow-400';
      case 'interruption': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return {
    updates,
    isLoading,
    error,
    refresh: fetchUpdates,
    getUpdateIcon,
    getUpdateColor,
    formatTimeAgo
  };
};
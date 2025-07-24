import { useState, useEffect } from 'react';

interface AIStatus {
  primary: string;
  fallback: string;
  chatgpt_available: boolean;
  claude_available: boolean;
  overall_health: boolean;
}

interface HealthResponse {
  status: string;
  ai_services: AIStatus;
  message: string;
  uptime: number;
}

export const useAIStatus = () => {
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/health`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI status');
      }

      const data: HealthResponse = await response.json();
      setAIStatus(data.ai_services);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAIStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    if (!aiStatus) return null;

    if (aiStatus.chatgpt_available && aiStatus.claude_available) {
      return {
        status: 'Full AI',
        color: 'text-apple-green',
        icon: '🤖'
      };
    } else if (aiStatus.claude_available) {
      return {
        status: 'Claude AI',
        color: 'text-apple-blue',
        icon: '🧠'
      };
    } else if (aiStatus.chatgpt_available) {
      return {
        status: 'ChatGPT',
        color: 'text-apple-green',
        icon: '💬'
      };
    } else {
      return {
        status: 'Fallback',
        color: 'text-apple-orange',
        icon: '⚠️'
      };
    }
  };

  return {
    aiStatus,
    isLoading,
    error,
    getStatusInfo,
    refresh: fetchStatus
  };
};
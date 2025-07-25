// Serverless API utility functions for Vercel deployment
const getApiUrl = (): string => {
  // In production, this will be your Vercel domain
  // In development, use local API
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://your-vercel-app.vercel.app';
  }
  return 'http://localhost:3000'; // Vercel dev server
};

export const serverlessApi = {
  // Chat endpoints
  chat: {
    send: async (message: string, conversationHistory: any[] = []) => {
      const response = await fetch(`${getApiUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationHistory })
      });
      return response.json();
    }
  },

  // Submissions endpoints
  submissions: {
    create: async (data: any) => {
      const response = await fetch(`${getApiUrl()}/api/submissions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    getPublic: async (page = 1, limit = 20, status = 'approved') => {
      const response = await fetch(`${getApiUrl()}/api/submissions/public?page=${page}&limit=${limit}&status=${status}`);
      return response.json();
    },

    getPending: async (page = 1, limit = 20) => {
      const response = await fetch(`${getApiUrl()}/api/submissions/admin/pending?page=${page}&limit=${limit}`);
      return response.json();
    },

    getStats: async () => {
      const response = await fetch(`${getApiUrl()}/api/submissions/admin/stats`);
      return response.json();
    },

    review: async (submissionId: string, action: string, reason?: string, adminNotes?: string) => {
      const response = await fetch(`${getApiUrl()}/api/submissions/admin/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, admin_notes: adminNotes })
      });
      return response.json();
    },

    vote: async (submissionId: string, voteType: 'up' | 'down') => {
      const response = await fetch(`${getApiUrl()}/api/submissions/${submissionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType })
      });
      return response.json();
    }
  },

  // Admin endpoints
  admin: {
    // Scraper functionality
    scraper: {
      start: async (sources: string[] = [], options: any = {}) => {
        const response = await fetch(`${getApiUrl()}/api/admin/scraper/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources, options })
        });
        return response.json();
      },

      getStatus: async () => {
        const response = await fetch(`${getApiUrl()}/api/admin/scraper/status`);
        return response.json();
      }
    },

    // ML Discovery functionality
    ml: {
      discover: async () => {
        const response = await fetch(`${getApiUrl()}/api/admin/ml/discover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
      },

      getSources: async () => {
        const response = await fetch(`${getApiUrl()}/api/admin/ml/sources`);
        return response.json();
      },

      analyze: async () => {
        const response = await fetch(`${getApiUrl()}/api/admin/ml/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
      }
    },

    // Analytics
    getAnalytics: async () => {
      const response = await fetch(`${getApiUrl()}/api/admin/analytics`);
      return response.json();
    },

    // Health check
    getHealth: async () => {
      const response = await fetch(`${getApiUrl()}/api/admin/health`);
      return response.json();
    },

    // Content approval
    approveContent: async (contentId: string, action: 'approve' | 'reject') => {
      const response = await fetch(`${getApiUrl()}/api/admin/content/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, action })
      });
      return response.json();
    }
  }
};

// Legacy compatibility - update existing API calls to use serverless
export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = `${getApiUrl()}${endpoint}`;
  return fetch(url, options);
};

export const getBackendUrl = (): string => getApiUrl();
export const getWebSocketUrl = (): string => getApiUrl();
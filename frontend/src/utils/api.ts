// API utility functions
export const getBackendUrl = (): string => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
};

export const getWebSocketUrl = (): string => {
  return process.env.REACT_APP_WS_URL || 'http://localhost:3001';
};

export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = `${getBackendUrl()}${endpoint}`;
  return fetch(url, options);
};
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  
  // App information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Menu actions listeners
  onNewConversation: (callback) => ipcRenderer.on('new-conversation', callback),
  onClearHistory: (callback) => ipcRenderer.on('clear-history', callback),
  onOpenAdmin: (callback) => ipcRenderer.on('open-admin', callback),
  
  // Cleanup listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// Expose a simple API for the settings window
contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  closeWindow: () => window.close()
});

console.log('🔒 Electron preload script loaded - secure IPC bridge established');
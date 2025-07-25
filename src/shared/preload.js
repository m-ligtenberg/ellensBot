const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMessages: () => ipcRenderer.invoke('get-messages'),
  saveMessage: (message) => ipcRenderer.invoke('save-message', message),
  clearChat: () => ipcRenderer.invoke('clear-chat'),
  sendAIMessage: (message) => ipcRenderer.invoke('send-ai-message', message),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  onNewChat: (callback) => {
    ipcRenderer.on('new-chat', callback);
    return () => ipcRenderer.removeListener('new-chat', callback);
  },
  
  onExportChat: (callback) => {
    ipcRenderer.on('export-chat', callback);
    return () => ipcRenderer.removeListener('export-chat', callback);
  }
});
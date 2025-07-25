const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const { DatabaseManager } = require('./database');
const { SecurityManager } = require('./security');

class YoungEllensApp {
  constructor() {
    this.mainWindow = null;
    this.db = new DatabaseManager();
    this.setupApp();
  }

  setupApp() {
    SecurityManager.setupSecurity();
    
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIPC();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../shared/preload.js')
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:8080');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Chat',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('new-chat');
            }
          },
          {
            label: 'Export Chat',
            accelerator: 'CmdOrCtrl+E',
            click: async () => {
              const result = await dialog.showSaveDialog(this.mainWindow, {
                defaultPath: 'chat-export.json',
                filters: [
                  { name: 'JSON Files', extensions: ['json'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled) {
                this.mainWindow.webContents.send('export-chat', result.filePath);
              }
            }
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Young Ellens',
            click: () => {
              dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'About Young Ellens',
                message: 'Young Ellens AI Chatbot',
                detail: 'Version 2.0.0\nA desktop AI chatbot application'
              });
            }
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    ipcMain.handle('get-messages', async () => {
      return await this.db.getMessages();
    });

    ipcMain.handle('save-message', async (event, message) => {
      return await this.db.saveMessage(message);
    });

    ipcMain.handle('clear-chat', async () => {
      return await this.db.clearMessages();
    });

    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('send-ai-message', async (event, message) => {
      return await this.handleAIMessage(message);
    });
  }

  async handleAIMessage(userMessage) {
    const responses = [
      "Yo, that's fire! 🔥",
      "I feel you, that's real talk.",
      "Respect, keep grinding!",
      "That hits different, for real.",
      "Big mood, I'm with that energy.",
      "Facts, that's the vibe!",
      "You speaking truth right there.",
      "I see you, that's solid.",
      "Pure fire, keep that up!",
      "Real recognize real!"
    ];

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    return {
      text: response,
      timestamp: Date.now(),
      sender: 'ai'
    };
  }
}

new YoungEllensApp();
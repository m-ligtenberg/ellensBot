const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

class EllensDesktopApp {
  constructor() {
    this.mainWindow = null;
    this.settingsWindow = null;
    this.backendProcess = null;
    this.frontendProcess = null;
    this.isQuitting = false;
    this.appDataPath = path.join(os.homedir(), '.ellens-chatbot');
    this.settingsPath = path.join(this.appDataPath, 'settings.json');
    this.dbPath = path.join(this.appDataPath, 'ellens-local.db');
  }

  async initialize() {
    // Create app data directory
    await this.ensureAppDataDirectory();
    
    // Load or create settings
    await this.loadSettings();
    
    // Set up app event listeners
    this.setupAppEvents();
    
    // Create main window when ready
    app.whenReady().then(() => this.createMainWindow());
  }

  async ensureAppDataDirectory() {
    try {
      await fs.mkdir(this.appDataPath, { recursive: true });
      console.log(`📁 App data directory: ${this.appDataPath}`);
    } catch (error) {
      console.error('Error creating app data directory:', error);
    }
  }

  async loadSettings() {
    try {
      const settingsData = await fs.readFile(this.settingsPath, 'utf8');
      this.settings = JSON.parse(settingsData);
    } catch (error) {
      // Create default settings
      this.settings = {
        apiKeys: {
          openai: '',
          claude: ''
        },
        appearance: {
          theme: 'dark',
          fontSize: 'medium'
        },
        behavior: {
          chaosLevel: 50,
          denialMode: true,
          autoSave: true
        },
        tts: {
          enabled: false,
          voice: 'ellens-dutch-male',
          speed: 1.0,
          pitch: 1.0,
          volume: 0.8
        },
        firstRun: true
      };
      await this.saveSettings();
    }
  }

  async saveSettings() {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('⚙️ Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  setupAppEvents() {
    app.on('ready', this.onAppReady.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));
    
    // IPC handlers
    ipcMain.handle('get-settings', () => this.settings);
    ipcMain.handle('save-settings', async (event, newSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      return this.settings;
    });
    ipcMain.handle('open-settings', () => this.openSettingsWindow());
    ipcMain.handle('get-app-info', () => ({
      version: app.getVersion(),
      dataPath: this.appDataPath,
      platform: process.platform
    }));
  }

  async onAppReady() {
    await this.startBackendServer();
    setTimeout(() => this.createMainWindow(), 2000); // Wait for backend to start
  }

  onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }

  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }

  onBeforeQuit() {
    this.isQuitting = true;
    this.cleanup();
  }

  async startBackendServer() {
    console.log('🚀 Starting Young Ellens backend server...');
    
    // Set environment variables from settings
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      DEPLOYMENT_MODE: 'desktop',
      PORT: '3001',
      DATABASE_URL: `sqlite:${this.dbPath}`,
      SESSION_SECRET: 'ellens-desktop-session',
      FRONTEND_URL: 'http://localhost:3000'
    };

    // Add API keys if available
    if (this.settings.apiKeys.openai) {
      env.OPENAI_API_KEY = this.settings.apiKeys.openai;
    }
    if (this.settings.apiKeys.claude) {
      env.CLAUDE_API_KEY = this.settings.apiKeys.claude;
    }

    // Add TTS settings
    if (this.settings.tts.enabled) {
      env.COQUI_TTS_ENABLED = 'true';
    }

    try {
      this.backendProcess = spawn('node', [
        path.join(__dirname, 'backend', 'dist', 'index.js')
      ], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data.toString().trim()}`);
      });

      this.backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`);
      });

      this.backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        if (!this.isQuitting) {
          // Restart backend if it crashes
          setTimeout(() => this.startBackendServer(), 3000);
        }
      });

      console.log('✅ Backend server started successfully');
    } catch (error) {
      console.error('❌ Failed to start backend server:', error);
    }
  }

  createMainWindow() {
    console.log('🖥️ Creating main window...');
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, 'assets', 'icon.png'), // Add your icon
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'electron-preload.js')
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false // Don't show until ready
    });

    // Create application menu
    this.createApplicationMenu();

    // Load the app
    this.mainWindow.loadURL('http://localhost:3000');

    // Show window when content is loaded
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Show welcome dialog on first run
      if (this.settings.firstRun) {
        this.showWelcomeDialog();
        this.settings.firstRun = false;
        this.saveSettings();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    console.log('✅ Main window created');
  }

  createApplicationMenu() {
    const template = [
      {
        label: 'Young Ellens',
        submenu: [
          {
            label: 'About Young Ellens',
            click: () => this.showAboutDialog()
          },
          { type: 'separator' },
          {
            label: 'Settings...',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.openSettingsWindow()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Chat',
        submenu: [
          {
            label: 'New Conversation',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.mainWindow.webContents.send('new-conversation')
          },
          {
            label: 'Clear History',
            click: () => this.mainWindow.webContents.send('clear-history')
          },
          { type: 'separator' },
          {
            label: 'Admin Panel',
            accelerator: 'CmdOrCtrl+Shift+A',
            click: () => this.mainWindow.webContents.send('open-admin')
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => this.mainWindow.webContents.reload()
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => this.mainWindow.webContents.reloadIgnoringCache()
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => this.mainWindow.webContents.toggleDevTools()
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            role: 'resetZoom'
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            role: 'zoomIn'
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            role: 'zoomOut'
          },
          { type: 'separator' },
          {
            label: 'Toggle Fullscreen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            role: 'togglefullscreen'
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Installation Guide',
            click: () => shell.openExternal('file://' + path.join(__dirname, 'COQUI_INSTALLATION.md'))
          },
          {
            label: 'GitHub Repository',
            click: () => shell.openExternal('https://github.com/your-username/ellensBot')
          },
          { type: 'separator' },
          {
            label: 'Report Issue',
            click: () => shell.openExternal('https://github.com/your-username/ellensBot/issues')
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  openSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 700,
      resizable: false,
      parent: this.mainWindow,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js')
      }
    });

    this.settingsWindow.loadFile(path.join(__dirname, 'electron-settings.html'));

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow.show();
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  showWelcomeDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Welcome to Young Ellens Desktop!',
      message: 'Welcome to Young Ellens Chatbot Desktop Edition!',
      detail: 'To get started:\n\n1. Add your API keys in Settings (⌘/Ctrl+,)\n2. Chat with Young Ellens - he\'ll deny everything!\n3. Use the Admin Panel (⌘/Ctrl+Shift+A) for advanced features\n\nYour conversations are stored locally on your computer.',
      buttons: ['Open Settings', 'Start Chatting'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        this.openSettingsWindow();
      }
    });
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Young Ellens',
      message: `Young Ellens Chatbot v${app.getVersion()}`,
      detail: 'A comedic AI chatbot that mimics Young Ellens (Dutch rapper) personality.\n\n' +
             'Known as "Mr. Cocaine" but always denies drug use while being hilariously obvious about it.\n\n' +
             'Built with React, Node.js, and Electron.\n' +
             'Data stored locally on your computer.\n\n' +
             '© 2024 Young Ellens Bot Team',
      buttons: ['OK']
    });
  }

  cleanup() {
    console.log('🧹 Cleaning up processes...');
    
    if (this.backendProcess && !this.backendProcess.killed) {
      this.backendProcess.kill('SIGTERM');
      setTimeout(() => {
        if (!this.backendProcess.killed) {
          this.backendProcess.kill('SIGKILL');
        }
      }, 5000);
    }

    if (this.frontendProcess && !this.frontendProcess.killed) {
      this.frontendProcess.kill('SIGTERM');
    }
  }
}

// Initialize the app
const ellensApp = new EllensDesktopApp();
ellensApp.initialize();

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://localhost:')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
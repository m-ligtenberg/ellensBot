# 🖥️ Young Ellens Desktop Chatbot

> **This is the Desktop Application fork** - For the web version, see the `main` branch

A standalone desktop application version of the Young Ellens chatbot that runs completely on your computer with local data storage and your own AI API keys.

## 🎯 Desktop Edition Features

### 🏠 **Fully Local Experience**
- **No server dependency** - runs entirely on your computer
- **Local SQLite database** - all conversations stored privately
- **Your API keys** - use your own OpenAI/Claude API keys
- **Offline capable** - works without internet (except for AI API calls)

### 🖥️ **Native Desktop Integration**
- **System menus** with keyboard shortcuts
- **Settings panel** for API keys and configuration
- **System tray** integration (optional)
- **Cross-platform** - Windows, macOS, Linux

### 🎤 **Advanced Features**
- **Coqui AI TTS** - Generate Dutch voice audio of Ellens
- **Admin panel** with ML controls and analytics
- **Voice cloning** capabilities for custom Ellens voices
- **Real-time personality learning** and adaptation

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (required)
- **Python 3.8-3.11** (optional, for TTS features)

### Installation

```bash
# Clone the desktop branch
git clone -b desktop-app https://github.com/your-username/ellensBot.git
cd ellensBot

# Install all dependencies
npm run install:all

# Install Electron dependencies
npm install
```

### First Run

```bash
# Start in development mode
npm run dev
```

This will:
1. **Start the backend server** automatically on port 3001
2. **Start the React frontend** on port 3000
3. **Show setup instructions** for API keys

### Desktop App (Electron)

```bash
# Run as desktop application
npm run electron:dev

# Or build desktop installers
npm run electron:dist
```

## ⚙️ Configuration

### 1. API Keys Setup
On first launch, you'll be prompted to add your API keys:

- **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
- **Claude API Key**: Get from [console.anthropic.com](https://console.anthropic.com/)

Keys are stored securely in: `~/.ellens-chatbot/settings.json`

### 2. Personality Settings
Customize Ellens behavior:
- **Chaos Level**: 0-100% (how unpredictable he is)
- **Denial Mode**: Always deny drug use with signature phrases
- **Auto-save**: Automatically save conversations

### 3. TTS Configuration (Optional)
Enable voice generation:
1. Install Coqui TTS (see [COQUI_INSTALLATION.md](./COQUI_INSTALLATION.md))
2. Enable TTS in Settings
3. Choose Dutch voice model
4. Adjust speed, pitch, volume

## 📁 Data Storage

Your data is stored locally in:
- **Windows**: `%USERPROFILE%\.ellens-chatbot\`
- **macOS**: `~/.ellens-chatbot/`
- **Linux**: `~/.ellens-chatbot/`

Contains:
- `settings.json` - Your preferences and API keys
- `ellens-local.db` - SQLite database with conversations
- `logs/` - Application logs

## 🎮 How to Use

### Basic Chat
1. **Launch the app** (web or desktop)
2. **Start chatting** with Young Ellens
3. **Try drug-related questions** to see his signature denials:
   - "Gebruik je cocaine?" → "Nooo man ik ben daar niet op, alleen me wietje en me henny"
   - "Ben jij Mr. Cocaine?" → Always denies while being obviously knowledgeable

### Admin Panel
Access with password: `ellens2024`
- **Real-time analytics** of conversations
- **Personality scoring** and adjustments
- **ML training data** management
- **TTS voice generation** panel
- **Source discovery** and content scraping

### Keyboard Shortcuts (Desktop App)
- `Ctrl/Cmd + N` - New conversation
- `Ctrl/Cmd + ,` - Open settings
- `Ctrl/Cmd + Shift + A` - Open admin panel
- `F11` - Toggle fullscreen

## 📦 Distribution

### Building Installers

```bash
# Build for current platform
npm run electron:dist

# Creates platform-specific installers:
# Windows: Young Ellens Chatbot Setup.exe
# macOS: Young Ellens Chatbot.dmg  
# Linux: Young Ellens Chatbot.AppImage + .deb
```

### Packaging for Others
1. **Build the installers** with `npm run electron:dist`
2. **Distribute the installer files** from `dist-electron/`
3. **Include installation instructions** from [DESKTOP_SETUP.md](./DESKTOP_SETUP.md)

## 🔧 Development

### Project Structure (Desktop-Specific)
```
ellensBot/
├── electron-main.js          # Electron main process
├── electron-preload.js       # Secure IPC bridge
├── electron-settings.html    # Settings window
├── backend/                  # Node.js backend (same as web)
├── frontend/                 # React frontend (enhanced for desktop)
├── assets/                   # App icons and resources
├── DESKTOP_SETUP.md         # Installation guide
├── COQUI_INSTALLATION.md    # TTS setup guide
└── dist-electron/           # Built installers
```

### Desktop-Specific Components
- **CoquiTTSPanel.tsx** - TTS interface in admin panel
- **Settings persistence** - Local storage management
- **Desktop notifications** - System integration
- **Menu shortcuts** - Native keyboard shortcuts

## 🔄 Difference from Web Version

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| **Deployment** | Railway + GitHub Pages | Local installation |
| **Data Storage** | PostgreSQL cloud | SQLite local |
| **API Keys** | Server environment | User settings |
| **TTS** | Server-side only | Local Coqui AI |
| **Updates** | Auto-deploy | Manual installer |
| **Privacy** | Server logs | Completely local |
| **Offline** | Requires internet | Works offline |

## 🐛 Troubleshooting

### Common Issues

#### App Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules
npm run install:all
```

#### Settings Not Saving
- Check write permissions to `~/.ellens-chatbot/`
- Antivirus may be blocking file creation

#### TTS Not Working
1. Install Coqui TTS: `pip install TTS`
2. Verify: `tts --help`
3. See [COQUI_INSTALLATION.md](./COQUI_INSTALLATION.md) for details

#### Build Fails
```bash
# Clean build
rm -rf dist-electron frontend/build backend/dist
npm run build
npm run electron:dist
```

## 🆘 Support

- **Installation Issues**: See [DESKTOP_SETUP.md](./DESKTOP_SETUP.md)
- **TTS Problems**: See [COQUI_INSTALLATION.md](./COQUI_INSTALLATION.md)
- **Bug Reports**: Create issue on GitHub
- **Feature Requests**: Use GitHub discussions

## 🎉 What You Get

With the desktop version, you have:

✅ **Complete privacy** - your data never leaves your computer  
✅ **Your own AI keys** - use your OpenAI/Claude accounts  
✅ **Offline capable** - works without internet connection  
✅ **Native desktop app** - system integration and shortcuts  
✅ **TTS voice generation** - hear Ellens speak in Dutch  
✅ **Persistent conversations** - all chats saved locally  
✅ **Admin controls** - ML training and personality tuning  
✅ **Cross-platform** - Windows, macOS, Linux support  

**Young Ellens is now truly yours - no servers, no dependencies, just pure local AI comedy!** 🎤🖥️

## 📝 License

MIT License - Feel free to modify and redistribute.

**This is entertainment software - Young Ellens is a parody character for comedy purposes only.**
# 🖥️ Young Ellens Desktop App Setup Guide

This guide explains how to build and run Young Ellens as a standalone desktop application.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** (with npm)
- **Python 3.8-3.11** (for optional Coqui TTS)
- **Git** (for cloning repository)

### Platform-Specific Requirements

#### Windows
- Visual Studio Build Tools or Visual Studio Community
- Windows SDK

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Linux
- Build essentials: `sudo apt install build-essential`

## 🚀 Quick Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/ellensBot.git
cd ellensBot

# Install all dependencies (root, frontend, backend)
npm run install:all

# Install Electron dependencies
npm install electron electron-builder electron-reload --save-dev
```

### 2. Build the Application

```bash
# Build frontend and backend for production
npm run build

# Build backend TypeScript
cd backend && npm run build && cd ..
```

### 3. Development Mode

```bash
# Run in Electron development mode (with hot reload)
npm run electron:dev
```

This will:
- Start the backend server automatically
- Open the Electron window
- Enable development tools
- Support hot reload for changes

### 4. Package for Distribution

```bash
# Create packaged app (development build)
npm run electron:pack

# Create distributable installers
npm run electron:dist
```

## 🔧 Configuration

### Desktop-Specific Settings

The desktop app stores settings locally in:
- **Windows**: `%USERPROFILE%\.ellens-chatbot\`
- **macOS**: `~/Library/Application Support/ellens-chatbot/`
- **Linux**: `~/.ellens-chatbot/`

### Settings Files
- `settings.json` - User preferences and API keys
- `ellens-local.db` - SQLite database with conversations
- `logs/` - Application logs

### First Run Setup

1. **Launch the app** - Shows welcome dialog
2. **Add API Keys** - Open Settings (⌘/Ctrl+,)
   - OpenAI API key from [platform.openai.com](https://platform.openai.com)
   - Claude API key from [console.anthropic.com](https://console.anthropic.com)
3. **Configure Personality** - Adjust chaos level and behavior
4. **Optional TTS Setup** - Install Coqui TTS (see COQUI_INSTALLATION.md)

## 🎮 Desktop Features

### Native Desktop Integration
- **System Menu Bar** - Native application menu
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + N` - New conversation
  - `Ctrl/Cmd + ,` - Settings
  - `Ctrl/Cmd + Shift + A` - Admin panel
  - `F11` - Fullscreen mode
- **Window Management** - Resizable, minimizable, remembers size
- **Tray Integration** - Minimize to system tray (optional)

### Data Storage
- **Local SQLite Database** - All conversations stored locally
- **No Cloud Dependency** - Works completely offline (except AI API calls)
- **Privacy First** - Your data never leaves your computer
- **Automatic Backups** - Settings and conversations backed up locally

### Settings Management
- **Persistent Settings** - API keys and preferences saved securely
- **Export/Import** - Backup and restore your settings
- **Multi-Profile Support** - Switch between different configurations

## 📦 Distribution

### Building Installers

#### Windows (NSIS Installer)
```bash
npm run electron:dist
# Creates: dist-electron/Young Ellens Chatbot Setup.exe
```

#### macOS (DMG)
```bash
npm run electron:dist
# Creates: dist-electron/Young Ellens Chatbot.dmg
```

#### Linux (AppImage + DEB)
```bash
npm run electron:dist
# Creates: 
# - dist-electron/Young Ellens Chatbot.AppImage
# - dist-electron/young-ellens-chatbot.deb
```

### Code Signing (Optional)

For distribution without security warnings:

#### macOS
```bash
# Set up code signing certificate
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
npm run electron:dist
```

#### Windows
```bash
# Set up code signing certificate
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
npm run electron:dist
```

## 🔧 Customization

### App Icons
Place your custom icons in `assets/`:
- `icon.png` (512x512) - Linux
- `icon.icns` - macOS bundle
- `icon.ico` - Windows

### Menu Customization
Edit `electron-main.js` to modify:
- Application menu items
- Keyboard shortcuts
- Context menus

### Window Behavior
Modify `createMainWindow()` in `electron-main.js`:
- Default window size
- Minimum dimensions
- Window decorations
- Startup behavior

## 🐛 Troubleshooting

### Common Issues

#### "Application Not Signed" Warning
- **Solution**: Either sign the app or instruct users to right-click → Open on first launch

#### Backend Server Won't Start
- **Check**: Node.js version (requires 18+)
- **Check**: Port 3001 is available
- **Check**: Backend build completed successfully

#### Settings Not Persisting
- **Check**: Write permissions to user data directory
- **Check**: Antivirus not blocking file creation

#### TTS Not Working
- **Check**: Coqui TTS installation (see COQUI_INSTALLATION.md)
- **Check**: Python environment and PATH
- **Check**: Required audio libraries installed

### Development Issues

#### Electron Won't Launch
```bash
# Clear electron cache
rm -rf node_modules/.cache/electron
npm install
```

#### Build Fails
```bash
# Clean and rebuild
rm -rf node_modules dist-electron frontend/build backend/dist
npm run install:all
npm run build
```

### Debug Mode
```bash
# Enable debug output
DEBUG=electron* npm run electron:dev
```

## 📊 Performance

### Resource Usage
- **Memory**: ~200-500MB (depends on conversation history)
- **CPU**: Low idle, moderate during AI responses
- **Disk**: ~100MB base installation + conversation data
- **Network**: Only for AI API calls

### Optimization Tips
1. **Limit conversation history** in settings
2. **Use local TTS** to reduce API calls
3. **Close unused windows** (Settings, Admin)
4. **Regular database cleanup** via Admin panel

## 🔐 Security

### Data Protection
- **API keys encrypted** at rest using system keychain
- **Local database** protected by file system permissions
- **No telemetry** - your usage data stays private
- **Optional password protection** for sensitive conversations

### Network Security
- **HTTPS only** for API calls
- **Certificate validation** enforced
- **No external tracking** or analytics

## 🆕 Updates

### Auto-Updates (Optional)
To enable auto-updates, set up update server and add to `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "ellensBot"
    }
  }
}
```

### Manual Updates
1. Download new release
2. Install over existing (settings preserved)
3. Restart application

## 🎉 Success!

When everything is working, you should have:
- ✅ Standalone desktop application
- ✅ Native system integration
- ✅ Local data storage
- ✅ Settings persistence
- ✅ Full Young Ellens personality
- ✅ Optional TTS capabilities

Your Young Ellens chatbot is now a **fully independent desktop application**! 🖥️🎤
# 🖥️ Desktop Application Branch

This branch (`desktop-app`) contains the standalone desktop application version of Young Ellens chatbot.

## 🌿 Branch Purpose

**Main Branch**: Web application (Railway + GitHub Pages deployment)  
**Desktop Branch**: Electron desktop application (local installation)

## 🔄 Key Differences

### Desktop Branch Adds:
- `electron-main.js` - Electron wrapper
- `electron-preload.js` - Secure IPC bridge  
- `electron-settings.html` - Settings interface
- `backend/src/routes/tts.ts` - Coqui TTS integration
- `frontend/src/components/Admin/CoquiTTSPanel.tsx` - TTS UI
- Desktop packaging configuration in `package.json`
- Local SQLite database support
- Installation guides for desktop deployment

### Desktop Branch Removes:
- Vercel deployment configurations
- Railway-specific environment handling
- Cloud database dependencies
- Server-side API key management

## 📦 Usage

```bash
# Clone desktop branch
git clone -b desktop-app https://github.com/your-username/ellensBot.git

# Or switch to desktop branch
git checkout desktop-app

# Install and run
npm run install:all
npm run electron:dev
```

## 🔀 Merging Strategy

**Do NOT merge desktop branch back to main** - they serve different purposes:

- **Main branch**: For web deployment and cloud hosting
- **Desktop branch**: For local desktop application distribution

Both branches should be maintained separately for their specific use cases.

## 🚀 Releases

Desktop releases should be tagged on this branch:
- `desktop-v1.0.0` - First desktop release
- `desktop-v1.1.0` - Desktop feature update
- etc.

This keeps desktop releases separate from web deployment releases.
# 🎤 Coqui AI TTS Installation Guide

This guide explains how to install and configure Coqui AI Text-to-Speech for the Young Ellens chatbot admin panel.

## 📋 Prerequisites

### System Requirements
- **Python 3.8-3.11** (required for Coqui TTS)
- **Node.js 18+** (for the main application)
- **FFmpeg** (for audio processing)
- **SoX** (for audio effects)

### Operating System Support
- ✅ **Linux** (Ubuntu, Debian, CentOS) - Recommended
- ✅ **macOS** (Intel and Apple Silicon)
- ⚠️ **Windows** (requires WSL or Docker)

## 🚀 Quick Installation

### 1. Install System Dependencies

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install FFmpeg and SoX
sudo apt install ffmpeg sox -y

# Install build tools
sudo apt install build-essential -y
```

#### macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python@3.11 ffmpeg sox
```

#### Windows (WSL2):
```bash
# Enable WSL2 and install Ubuntu
wsl --install -d Ubuntu

# Then follow Ubuntu instructions above
```

### 2. Install Coqui TTS

```bash
# Create virtual environment (recommended)
python3 -m venv ~/coqui-tts-env
source ~/coqui-tts-env/bin/activate

# Install Coqui TTS
pip install TTS

# Verify installation
tts --help
```

### 3. Download Dutch Models

Coqui TTS will automatically download models on first use, but you can pre-download them:

```bash
# Download Dutch models
tts --model_name "tts_models/nl/css10/vits" --text "test" --out_path /tmp/test.wav

# List available models
tts --list_models
```

## 🔧 Configuration for ellensBot

### 1. Environment Setup

Add to your `.env.local` file:
```bash
# Coqui TTS Configuration
COQUI_TTS_ENABLED=true
COQUI_MODELS_PATH=/path/to/models  # Optional
COQUI_TEMP_DIR=/tmp/ellens-tts     # Optional
```

### 2. Backend Configuration

The TTS routes are already configured in `/backend/src/routes/tts.ts`. Available endpoints:

- `GET /api/tts/health` - Check TTS service status
- `GET /api/tts/models` - List available models
- `POST /api/tts/generate` - Generate speech from text

### 3. Model Configuration

Available models for Dutch (configured in `tts.ts`):

```javascript
const TTS_MODELS = {
  'ellens-dutch-male': {
    model: 'tts_models/nl/css10/vits',
    language: 'nl'
  },
  'dutch-casual-male': {
    model: 'tts_models/nl/mai/tacotron2-DDC',
    language: 'nl'
  },
  'dutch-standard': {
    model: 'tts_models/nl/css10/vits',
    language: 'nl'
  }
};
```

## 🎯 Testing the Installation

### 1. Test CLI Installation
```bash
# Activate virtual environment
source ~/coqui-tts-env/bin/activate

# Test basic TTS
tts --model_name "tts_models/nl/css10/vits" \
    --text "Nooo man ik ben daar niet op, alleen me wietje en me henny" \
    --out_path ~/test-ellens.wav

# Play the result
play ~/test-ellens.wav  # Linux/macOS with SoX
```

### 2. Test Backend Integration
```bash
# Start your ellensBot backend
npm run backend:dev

# Test health endpoint
curl http://localhost:3001/api/tts/health

# Expected response (when working):
# {"status":"healthy","coqui_available":true,"models_count":3}
```

### 3. Test Admin Panel
1. Open admin panel: `http://localhost:3000` (use password: `ellens2024`)
2. Navigate to **Text-to-Speech** tab (🎤)
3. Enter text: `"Yo wat is er chef?"`
4. Click **Generate Voice**
5. Play the generated audio

## 🐛 Troubleshooting

### Common Issues

#### 1. "tts command not found"
```bash
# Ensure virtual environment is activated
source ~/coqui-tts-env/bin/activate

# Or install globally (not recommended)
pip install --user TTS
export PATH="$HOME/.local/bin:$PATH"
```

#### 2. "CUDA/GPU errors"
```bash
# Install CPU-only version
pip uninstall TTS
pip install TTS --no-deps
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

#### 3. "Model download fails"
```bash
# Pre-download models manually
mkdir -p ~/.local/share/tts
tts --model_name "tts_models/nl/css10/vits" --text "test" --out_path /tmp/test.wav
```

#### 4. "Permission denied" errors
```bash
# Fix permissions for temp directory
sudo mkdir -p /tmp/ellens-tts
sudo chown $USER:$USER /tmp/ellens-tts
chmod 755 /tmp/ellens-tts
```

### Audio Issues

#### 5. "sox: command not found"
```bash
# Ubuntu/Debian
sudo apt install sox

# macOS
brew install sox
```

#### 6. "ffmpeg: command not found"
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

## 🔄 Running with Virtual Environment

### Automatic Activation Script

Create `start-ellens-with-tts.sh`:
```bash
#!/bin/bash
echo "🎤 Starting Young Ellens with TTS support..."

# Activate Coqui TTS environment
source ~/coqui-tts-env/bin/activate

# Export environment variables
export COQUI_TTS_ENABLED=true
export PATH="$HOME/coqui-tts-env/bin:$PATH"

# Start the application
cd /path/to/ellensBot
npm run dev
```

Make it executable:
```bash
chmod +x start-ellens-with-tts.sh
./start-ellens-with-tts.sh
```

## 🐳 Docker Alternative

If you prefer Docker, create `docker-compose.tts.yml`:

```yaml
version: '3.8'
services:
  ellens-backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.tts
    ports:
      - "3001:3001"
    environment:
      - COQUI_TTS_ENABLED=true
    volumes:
      - ./data:/app/data
      - tts_models:/app/models

  ellens-frontend:
    build: ./frontend
    ports:
      - "3000:3000"

volumes:
  tts_models:
```

## 📊 Performance Notes

### Resource Usage
- **CPU**: High during generation (1-5 seconds per sentence)
- **Memory**: ~500MB-2GB depending on model
- **Disk**: ~500MB-1GB for downloaded models
- **Network**: Only needed for initial model download

### Optimization Tips
1. **Pre-warm models** by generating a test audio on startup
2. **Cache common phrases** to avoid regeneration
3. **Use smaller models** for faster generation
4. **Implement queuing** for multiple simultaneous requests

## 🎵 Sample Ellens Phrases for Testing

```javascript
const testPhrases = [
  "Nooo man ik ben daar niet op, alleen me wietje en me henny",
  "WACHT EFFE, wat?",
  "Hahahaha iedereen noemt me Mr. Cocaine maar ik ben daar niet op!",
  "Yo wat is er chef?",
  "Niet dat ik het gebruik maar cocaine is wel goed spul hoor",
  "Oke ik verveel me nu, later"
];
```

## 🆘 Support

If you encounter issues:

1. **Check logs**: Backend console and browser DevTools
2. **Verify installation**: Run `tts --help` in terminal
3. **Test models**: Generate a simple test file
4. **Check permissions**: Ensure write access to temp directories
5. **Update dependencies**: `pip install --upgrade TTS`

## 🎉 Success!

When everything works, you should see:
- ✅ TTS health endpoint returns `{"status":"healthy"}`
- ✅ Admin panel shows TTS tab with audio controls
- ✅ Generated audio plays Ellens' phrases in Dutch
- ✅ Download functionality works for WAV files

Your Young Ellens chatbot now has **voice capabilities**! 🎤🔥
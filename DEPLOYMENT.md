# 🚀 Deployment Guide - Young Ellens Chatbot

This project supports multiple deployment methods. Choose the one that fits your needs:

## 🚀 Quick Deploy (Recommended - 10 minutes)

### Step 1: GitHub Repository (2 min)
1. Go to [github.com](https://github.com) → New repository
2. Name: `ellens_bot2.0`
3. Description: `🎤 Young Ellens Chatbot - Dutch rapper AI with drug denial patterns`
4. Public repository ✅
5. Create repository

### Step 2: Push Code (1 min)
```bash
git remote add origin https://github.com/YOURUSERNAME/ellens_bot2.0.git
git branch -M main
git push -u origin main
```

### Step 3: Railway Backend (5 min)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Deploy from GitHub repo → Select `ellens_bot2.0`
3. Add environment variables:
   - `CLAUDE_API_KEY`: Your Anthropic API key
   - `OPENAI_API_KEY`: Your OpenAI API key  
   - `NODE_ENV`: production
   - `FRONTEND_URL`: https://yourusername.github.io/ellens_bot2.0

### Step 4: GitHub Pages (2 min)
1. GitHub repo → Settings → Pages
2. Source: "GitHub Actions"
3. Wait for green checkmark ✅

### Step 5: Update URLs (1 min)
After Railway gives you a URL (like `https://yourapp.up.railway.app`):
1. Update `frontend/.env.production` with your Railway URL
2. Commit and push the change

**Result:**
- **Frontend**: https://yourusername.github.io/ellens_bot2.0
- **Backend**: https://yourapp.up.railway.app
- **Admin Panel**: Password: `ellens2024`

## 🏠 Local Development (Hardcoded API Keys)

For local development with your own API keys hardcoded in the environment file.

### Setup:

1. **Edit `.env.local`** with your API keys:
```bash
# Replace with your actual API keys
CLAUDE_API_KEY=sk-ant-api03-your-claude-key-here
OPENAI_API_KEY=sk-your-openai-key-here
```

2. **Run in local mode:**
```bash
cd backend
npm run dev:local
```

3. **Build for local:**
```bash
npm run build:local
```

### Features in Local Mode:
- ✅ Hardcoded API keys in `.env.local`
- ✅ In-memory database fallback
- ✅ Lenient rate limiting (500 req/min)
- ✅ Full error logging
- ✅ Hot reload development

---

## 🚂 Railway Production (Environment Variables)

For production deployment on Railway with environment variables managed through Railway dashboard.

### Setup:

1. **Railway Environment Variables:**
   Set these in Railway dashboard:
   ```
   CLAUDE_API_KEY=sk-ant-api03-...
   OPENAI_API_KEY=sk-...
   DATABASE_URL=postgresql://...
   FRONTEND_URL=https://your-frontend.railway.app
   SESSION_SECRET=your-production-secret
   ```

2. **Deploy to Railway:**
   ```bash
   railway login
   railway link
   railway up
   ```

3. **Local testing of Railway config:**
   ```bash
   npm run dev:railway
   ```

### Features in Production Mode:
- ✅ Environment variables from Railway
- ✅ Production database (PostgreSQL)
- ✅ Strict rate limiting (100 req/15min)
- ✅ Production error handling
- ✅ SSL database connections

---

## 🔄 Environment Auto-Detection

The system automatically detects the deployment mode:

1. **Railway**: Detected via `RAILWAY_ENVIRONMENT` variable
2. **Production**: Detected via `NODE_ENV=production`
3. **Local**: Default fallback mode

You can also force a mode:
```bash
DEPLOYMENT_MODE=local npm run dev
```

---

## 📁 Configuration Files

- `.env.local` - Local development with hardcoded keys
- `.env.production` - Production template (Railway overrides)
- `railway.toml` - Railway deployment configuration
- `backend/src/config/deployment.ts` - Environment switching logic

---

## 🎯 Quick Start Commands

### Local Development:
```bash
# Backend
cd backend
npm run dev:local

# Frontend  
cd frontend
npm start
```

### Railway Production:
```bash
# Deploy
railway up

# Check logs
railway logs

# Check environment
railway env
```

### Testing Railway Config Locally:
```bash
cd backend
npm run dev:railway
```

---

## 🔧 Environment Variables Reference

### Local Development (`.env.local`):
```env
NODE_ENV=development
DEPLOYMENT_MODE=local
CLAUDE_API_KEY=sk-ant-api03-your-key
OPENAI_API_KEY=sk-your-key
DATABASE_URL=postgresql://localhost:5432/ellens_local
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=500
SESSION_SECRET=local-dev-secret
```

### Railway Production:
```env
NODE_ENV=production
DEPLOYMENT_MODE=production
CLAUDE_API_KEY=<set in Railway>
OPENAI_API_KEY=<set in Railway>
DATABASE_URL=<Railway PostgreSQL>
FRONTEND_URL=<Railway frontend URL>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=<production secret>
```
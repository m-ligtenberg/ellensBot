# GitHub Deployment Guide for Young Ellens Chatbot

This guide shows you how to deploy the Young Ellens chatbot completely for free using GitHub and various free hosting services.

## 🚀 Quick Deployment Summary

1. **Frontend**: GitHub Pages (Free)
2. **Backend**: Railway or Render (Free tier)
3. **Database**: Railway PostgreSQL (Free)
4. **CI/CD**: GitHub Actions (Free)

## 📋 Prerequisites

- GitHub account
- Railway account (free) OR Render account (free)
- API keys for Claude and OpenAI

## 🎯 Step-by-Step Deployment

### 1. Repository Setup

```bash
# Clone and push to your GitHub
git clone https://github.com/yourusername/ellens_bot2.0.git
cd ellens_bot2.0
git remote set-url origin https://github.com/YOURUSERNAME/ellens_bot2.0.git
git push origin main
```

### 2. Frontend Deployment (GitHub Pages)

1. Go to your GitHub repository
2. Settings → Pages
3. Source: "GitHub Actions"
4. The workflow will automatically deploy on push to main

**Frontend will be available at**: `https://yourusername.github.io/ellens_bot2.0`

### 3. Backend Deployment Options

#### Option A: Railway (Recommended)

1. **Sign up**: [railway.app](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Deploy**: 
   ```bash
   # Install Railway CLI (optional)
   npm install -g @railway/cli
   railway login
   railway link [project-id]
   railway up
   ```
4. **Add environment variables**:
   - `CLAUDE_API_KEY`: Your Anthropic API key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `FRONTEND_URL`: Your GitHub Pages URL
   - `NODE_ENV`: production

#### Option B: Render

1. **Sign up**: [render.com](https://render.com)
2. **Connect GitHub**: Link your repository
3. **Deploy**: Render will use the `render.yaml` file automatically
4. **Add environment variables** in Render dashboard

### 4. Database Setup

#### Railway Database
```bash
# Railway automatically provides PostgreSQL
# Database URL is automatically set via environment variable
```

#### Render Database
```bash
# Render provides free PostgreSQL
# Connection string automatically injected
```

### 5. GitHub Actions Configuration

Add these secrets to your GitHub repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. **Add Repository Secrets**:
   - `RAILWAY_TOKEN`: (if using Railway)
   - `BACKEND_URL`: Your backend deployment URL
   - `WS_URL`: Your WebSocket URL

### 6. Environment Variables Setup

#### Required Environment Variables:

```bash
# Backend (.env)
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...  # Auto-provided by hosting service
CLAUDE_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=https://yourusername.github.io/ellens_bot2.0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (build time):
```bash
# Automatically set by GitHub Actions
REACT_APP_BACKEND_URL=https://your-backend.railway.app
REACT_APP_WS_URL=wss://your-backend.railway.app
```

## 🔧 Customization

### Update Frontend API URLs

Edit `frontend/.env.production`:
```bash
REACT_APP_BACKEND_URL=https://your-backend-url.railway.app
REACT_APP_WS_URL=wss://your-backend-url.railway.app
```

### Custom Domain (Optional)

1. **GitHub Pages**: Add `CNAME` file to frontend/public/
2. **Railway/Render**: Configure custom domain in dashboard

## 🚦 Monitoring and Logs

### Railway
```bash
railway logs
```

### Render
- View logs in Render dashboard
- Real-time log streaming available

### GitHub Actions
- Check workflow status in "Actions" tab
- View deployment logs and errors

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**:
   ```bash
   # Check TypeScript compilation
   cd backend && npx tsc --noEmit
   ```

2. **Frontend Can't Connect to Backend**:
   - Check CORS settings in backend
   - Verify API URLs in frontend

3. **Database Connection Issues**:
   - Verify DATABASE_URL environment variable
   - Check database service status

4. **WebSocket Issues**:
   - Ensure WSS (secure WebSocket) is used in production
   - Check firewall/proxy settings

### Debug Commands

```bash
# Test backend locally
cd backend && npm start

# Test frontend locally
cd frontend && npm run dev

# Check deployment status
railway status  # or check Render dashboard
```

## 💡 Production Optimizations

### Security
- Enable rate limiting (already configured)
- Use HTTPS everywhere (automatic with GitHub Pages/Railway/Render)
- Environment variables for all secrets

### Performance
- CDN for static assets (automatic with GitHub Pages)
- Database connection pooling (configured)
- Gzip compression (enabled)

### Monitoring
- Health checks (configured)
- Error logging (implemented)
- Performance metrics (basic implementation)

## 📈 Scaling

### Free Tier Limits
- **Railway**: 500 hours/month, 1GB RAM
- **Render**: 750 hours/month, 512MB RAM
- **GitHub Pages**: 1GB storage, 100GB bandwidth/month

### Upgrade Path
When you outgrow free tiers:
1. Railway Pro: $5/month
2. Render paid plans: $7/month
3. Database scaling available on both platforms

## 🎉 Final Result

After deployment:
- **Frontend**: `https://yourusername.github.io/ellens_bot2.0`
- **Backend**: `https://your-app.railway.app` or `https://your-app.onrender.com`
- **Database**: Managed PostgreSQL with automatic backups
- **CI/CD**: Automatic deployments on every commit

Your Young Ellens chatbot will be live, scalable, and completely hosted for free! 🎤

## 🚨 Security Note

Never commit API keys to Git. Use GitHub Secrets and environment variables for all sensitive data.
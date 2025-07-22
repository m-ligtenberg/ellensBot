# Young Ellens Chatbot - Eenvoudige Vercel Deployment

## Waarom Vercel?
✅ Frontend + Backend op 1 platform  
✅ Automatische deployments via Git  
✅ Gratis SSL en custom domains  
✅ Simpele environment variables  
✅ PostgreSQL database via Vercel Storage  

## Stap-voor-Stap Deployment

### 1. Vercel CLI Installeren
```bash
npm install -g vercel
```

### 2. Frontend Deployen
```bash
cd frontend
vercel --prod

# Vercel vraagt:
# - Link to existing project? N
# - Project name: ellens-chatbot-frontend  
# - Directory: ./build
```

### 3. Backend Deployen  
```bash
cd ../backend
vercel --prod

# Vercel vraagt:
# - Link to existing project? N
# - Project name: ellens-chatbot-backend
```

### 4. Database Setup (Vercel Postgres)
```bash
# In Vercel dashboard:
# 1. Go to Storage tab
# 2. Create Postgres Database
# 3. Connect to your backend project
# 4. Run SQL commands from supabase-setup.sql
```

### 5. Environment Variables
In Vercel dashboard voor backend project:

```bash
OPENAI_API_KEY=sk-proj-your-key
DATABASE_URL=postgresql://... (auto-filled by Vercel)
FRONTEND_URL=https://ellens-chatbot-frontend.vercel.app
NODE_ENV=production
```

### 6. Custom Domain (michligtenberg.nl)
```bash
# In Vercel dashboard voor frontend:
# 1. Go to Domains tab
# 2. Add michligtenberg.nl
# 3. Configure DNS records (Vercel shows which)
```

### 7. Update Frontend Config
```bash
# Update .env.production
REACT_APP_API_URL=https://ellens-chatbot-backend.vercel.app

# Rebuild and redeploy
npm run build
vercel --prod
```

## Voordelen vs Supabase
- ✅ 1 platform voor alles
- ✅ Makkelijker DNS setup  
- ✅ Automatische deployments
- ✅ Goedkoper (free tier ruim voldoende)
- ✅ Betere WebSocket support

## Live URLs na deployment:
- Frontend: https://michligtenberg.nl
- Backend: https://ellens-chatbot-backend.vercel.app  
- Database: Vercel Postgres (managed)

## Ready to Deploy!
Alle config files zijn klaar. Run gewoon de commando's hierboven! 🎉
# Young Ellens Chatbot Deployment Guide

## Frontend Deployment (michligtenberg.nl)

### Build Ready ✅
- Production build created in `/build` folder
- Size: 74.51 kB main bundle + 4.74 kB CSS

### Deployment Options:

**Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend folder
cd frontend
vercel --prod

# Set custom domain in Vercel dashboard to michligtenberg.nl
```

**Option 2: Netlify**
```bash
# Install Netlify CLI  
npm i -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod --dir=build

# Configure domain in Netlify dashboard
```

**Option 3: Manual Upload**
- Upload contents of `/build` folder to your hosting provider
- Point michligtenberg.nl to the uploaded files

## Backend Deployment (Supabase)

### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Create new project
3. Note down:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: `eyJ...`
   - Service Role Key: `eyJ...`

### Step 2: Database Migration
```sql
-- Run this in Supabase SQL Editor
-- Copy from: backend/src/database/migrations/

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ellens_mood VARCHAR(50) DEFAULT 'chill',
    chaos_level INTEGER DEFAULT 50,
    patience INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP NULL
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    sender VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(50),
    chaos_level INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add other tables from migrations...
```

### Step 3: Backend Deployment Options

**Option A: Supabase Edge Functions**
```typescript
// Create edge function for chat API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Move Express routes to Edge Function format
})
```

**Option B: Vercel (Easier)**
```bash
# Add vercel.json to backend
{
  "functions": {
    "src/index.ts": {
      "runtime": "@vercel/node"
    }
  }
}

# Deploy
cd backend
vercel --prod
```

### Step 4: Environment Variables

**Frontend (.env.production)**
```bash
REACT_APP_API_URL=https://your-backend.vercel.app
# or https://your-project.supabase.co/functions/v1
```

**Backend (Vercel/Supabase)**
```bash
OPENAI_API_KEY=sk-proj-your-key
CLAUDE_API_KEY=sk-ant-your-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
FRONTEND_URL=https://michligtenberg.nl
```

## Quick Start Commands

1. **Deploy Frontend:**
   ```bash
   cd frontend
   npm run build
   vercel --prod
   # Configure domain: michligtenberg.nl
   ```

2. **Setup Supabase:**
   - Create project at supabase.com
   - Run SQL migrations
   - Get connection details

3. **Deploy Backend:**
   ```bash
   cd backend
   vercel --prod
   # Add environment variables in Vercel dashboard
   ```

4. **Update Frontend Config:**
   ```bash
   # Update API URL in frontend
   REACT_APP_API_URL=https://your-backend.vercel.app
   npm run build
   vercel --prod
   ```

## Live URLs
- Frontend: https://michligtenberg.nl
- Backend API: https://your-backend.vercel.app
- Database: Supabase PostgreSQL

## Next Steps
1. Test full deployment
2. Setup monitoring
3. Configure SSL certificates
4. Setup analytics
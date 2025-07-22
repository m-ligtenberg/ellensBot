# Young Ellens Chatbot - Hybrid Deployment

## Setup: Frontend op eigen hosting + Backend op Vercel

### Voordelen:
✅ **Frontend**: Volledige controle op michligtenberg.nl  
✅ **Backend**: Vercel's krachtige serverless + database  
✅ **Kosten**: Frontend gratis, backend Vercel free tier  
✅ **Performance**: CDN voor static files, edge functions voor API  

---

## 🖥️ FRONTEND - Eigen Hosting

### 1. Production Build Klaar
```bash
# Al gedaan! Build staat in frontend/build/
ls frontend/build/
# → index.html, static/, asset-manifest.json, etc.
```

### 2. Upload naar je hosting
```bash
# Via FTP/SFTP/cPanel File Manager:
# Upload INHOUD van frontend/build/ naar public_html/ellens/ 
# of rechtstreeks naar domain root

# Via rsync (als je SSH access hebt):
rsync -avz frontend/build/ user@michligtenberg.nl:/var/www/html/ellens/
```

### 3. .htaccess voor React Router (indien Apache)
```apache
# Upload naar zelfde folder als index.html
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 4. nginx config (indien nginx)
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 🚀 BACKEND - Vercel Deployment

### 1. Deploy Backend
```bash
cd backend
vercel --prod

# Vercel vraagt:
# Project name: ellens-chatbot-api
# Deploy? Y
```

### 2. Database Setup
```bash
# In Vercel dashboard > Storage > Create Database > Postgres
# Connect to ellens-chatbot-api project
# Run SQL van supabase-setup.sql in database query tab
```

### 3. Environment Variables (Vercel Dashboard)
```bash
OPENAI_API_KEY=sk-proj-your-key
DATABASE_URL=postgresql://... (auto-filled)
FRONTEND_URL=https://michligtenberg.nl
NODE_ENV=production
```

---

## 🔗 FRONTEND CONFIG UPDATE

### 1. Update productie config
```bash
# frontend/.env.production
REACT_APP_API_URL=https://ellens-chatbot-api.vercel.app
REACT_APP_WS_URL=wss://ellens-chatbot-api.vercel.app
```

### 2. Rebuild met nieuwe config
```bash
cd frontend
npm run build
# Upload nieuwe build/ naar hosting
```

---

## 🌐 CORS CONFIGURATIE

### Backend CORS update (al gedaan, maar check):
```javascript
// backend/src/index.ts
const corsOptions = {
  origin: 'https://michligtenberg.nl', // je domain
  credentials: true
};
```

---

## 📋 DEPLOYMENT CHECKLIST

### Backend Deployment:
- [ ] `cd backend && vercel --prod`
- [ ] Vercel Postgres database aangemaakt
- [ ] SQL schema geïmporteerd  
- [ ] Environment variables ingesteld
- [ ] CORS configured voor michligtenberg.nl

### Frontend Deployment:
- [ ] `npm run build` met production config
- [ ] Files geüpload naar hosting
- [ ] .htaccess/.nginx config toegevoegd
- [ ] HTTPS werkend op michligtenberg.nl

### Testing:
- [ ] https://michligtenberg.nl/ellens laadt correct
- [ ] Chat interface werkt
- [ ] WebSocket connectie succesvol
- [ ] Young Ellens reageert op berichten
- [ ] Database slaat gesprekken op

---

## 🎯 LIVE URLS

**Frontend**: https://michligtenberg.nl/ellens (of main domain)  
**Backend API**: https://ellens-chatbot-api.vercel.app  
**Database**: Vercel Postgres (managed)

## 🚀 READY TO DEPLOY!

1. **Backend eerst**: `cd backend && vercel --prod`
2. **Get API URL** van Vercel output  
3. **Update frontend** config met API URL
4. **Upload build** naar je hosting
5. **Test!** 🎉
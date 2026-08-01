# 🚀 RENDER — Guía Rápida para Antonio

## TL;DR — 3 Pasos

### 1️⃣ Prepara Upstash Redis (5 min)
```
1. Ve a https://upstash.com
2. Sign up (Google/GitHub OK)
3. Create Database → Gratuito
4. Copia la URL: redis://...
```

### 2️⃣ Crea los servicios en Render (10 min)

**PostgreSQL:**
- New → PostgreSQL
- Name: `pixeles-db`
- Database: `pixeles`
- User: `pixeles`
- Create

**Backend (Node.js):**
- New → Web Service
- Connect GitHub → `pixeles` repo
- Root Directory: `backend`
- Build: `npm install`
- Start: `node src/index.js`
- Environment vars:
  ```
  NODE_ENV = production
  PORT = 10000
  DB_HOST = pixeles-db
  DB_PORT = 5432
  DB_NAME = pixeles
  DB_USER = pixeles
  DB_PASSWORD = (misma que en DB)
  REDIS_URL = (de Upstash)
  CORS_ORIGIN = https://pixeles-web.onrender.com
  TZ = America/Guatemala
  ```
- Create

**Frontend (Static):**
- New → Static Site
- Connect GitHub → `pixeles` repo
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Environment vars:
  ```
  VITE_API_URL = https://pixeles-api.onrender.com
  ```
- Create

### 3️⃣ Conecta Namecheap
- Namecheap → Tu dominio → Custom Nameservers
- Usa los que Render te da
- Espera 24h

---

## ¿Dónde estoy?
- En Render → **Dashboard** → https://dashboard.render.com
- **Ya creaste cuenta?** Entonces estás listo para empezar.

---

## Siguiente paso
Dime cuando esté Render abierto en tu pantalla y te guío click por click. 🔥

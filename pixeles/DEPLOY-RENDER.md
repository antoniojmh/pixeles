# 🔥 PIXELES en Render — Guía Paso a Paso

## Fase 0: Preparar Redis (Upstash)

**Redis es obligatorio** para el sistema de timers en PIXELES.

1. Ve a https://upstash.com
2. Crea una cuenta (puedes usar Google/GitHub)
3. Ve a "Databases" → "Create Database"
4. Elige **Gratuito**, nombre: `pixeles-redis`, Region: `us-east-1`
5. Una vez creada, abre la DB y copia la URL (algo como `redis://default:xxxxx@xxxxx.upstash.io:xxxxx`)
6. **Guarda esa URL** — la usaremos en Render

---

## Fase 1: Preparar GitHub (para Render detecte cambios)

**Opción A: Si ya tienes el repo en GitHub**
- Vete al repo
- Sube los cambios: `git push`

**Opción B: Si NO tienes repo GitHub todavía**
```bash
cd ~/pixeles
git init
git add .
git commit -m "PIXELES v1.0 - Sistema gaming"
```
Luego crea un repo en GitHub y sube:
```bash
git remote add origin https://github.com/TU_USUARIO/pixeles.git
git branch -M main
git push -u origin main
```

---

## Fase 2: Crear servicios en Render

### 2.1 — Base de Datos PostgreSQL

1. Ve a https://dashboard.render.com
2. Click en **"New +"** → **"PostgreSQL"**
3. Datos:
   - **Name:** `pixeles-db`
   - **Database:** `pixeles`
   - **User:** `pixeles`
   - **Plan:** `Free` ✅
4. Click **"Create Database"**
5. Espera 1-2 min a que se cree
6. Una vez activa, **copia la Internal Database URL** (inferior en la página, donde dice "Internal Database URL") — algo como `postgresql://...` pero con `localhost` o la IP interna

---

### 2.2 — Backend (Node.js API)

1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repo GitHub:
   - Click "Connect account" o "Select repository"
   - Elige `pixeles`
   - Branch: `main`
3. Datos del servicio:
   - **Name:** `pixeles-api`
   - **Root Directory:** `backend` (Render buscará `backend/` como raíz)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Plan:** `Free` ✅
4. Ve a **"Environment"** y añade variables:
   ```
   NODE_ENV = production
   PORT = 10000
   DB_HOST = pixeles-db (el nombre del servicio PostgreSQL)
   DB_PORT = 5432
   DB_NAME = pixeles
   DB_USER = pixeles
   DB_PASSWORD = (misma contraseña que pusiste en la DB)
   REDIS_URL = (URL que copiaste de Upstash)
   CORS_ORIGIN = https://pixeles-web.onrender.com (aprox, crearemos después)
   TZ = America/Guatemala
   ```
5. Click **"Create Web Service"**
6. Espera a que construya y desplegue (~5-10 min)
7. Una vez activo, copia la URL del servicio (algo como `https://pixeles-api.onrender.com`)

---

### 2.3 — Frontend (React estático)

1. Click en **"New +"** → **"Static Site"**
2. Conecta GitHub:
   - Elige `pixeles`
   - Branch: `main`
3. Datos:
   - **Name:** `pixeles-web`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** `Free` ✅
4. Ve a **"Environment"** y añade:
   ```
   VITE_API_URL = https://pixeles-api.onrender.com (la URL del backend que copiaste)
   ```
5. Click **"Create Static Site"**
6. Espera a que construya (~3-5 min)
7. Tu app estará en `https://pixeles-web.onrender.com`

---

## Fase 3: Verificar que todo esté conectado

Una vez que el backend y frontend están activos:

1. Ve a `https://pixeles-web.onrender.com` en el navegador
2. Deberías ver el dashboard de PIXELES
3. Intenta crear una consola o iniciar una sesión
4. Si todo funciona → **¡Éxito! 🔥**

---

## Troubleshooting

### Backend no arranca
- Ve a **Logs** del servicio `pixeles-api`
- Busca mensajes de error (ej: "Cannot connect to database")
- **Causa común:** Variable de entorno mal configurada o DB no lista

### Frontend no carga
- Abre DevTools (F12) → Console
- Busca errores de CORS o conexión a API
- **Causa común:** `VITE_API_URL` incorrecta

### Base de datos vacía
- El script `scripts/init-db.sql` debería ejecutarse automáticamente
- Si no, conéctate manualmente a la DB y ejecuta el SQL

---

## Paso Final: Conectar Dominio Namecheap

1. Ve a **Namecheap** → Tu dominio
2. Entra a **Manage** → **Nameservers**
3. Cambia a **"Custom Nameservers"** y usa los que Render proporciona (mira en el dashboard del sitio estático)
4. Espera 24h para propagación
5. Listo — accede a `https://tu-dominio.com`

---

## Notas finales

- **Gratuito:** Render solo mantiene activos servicios con tráfico. Si no hay visitas en 15 días, se duerme.
- **Despertarlo:** Basta visitarlo y tarda ~50 segundos en reiniciar.
- **PostgreSQL libre:** 256 MB de almacenamiento, bastante para empezar.
- **Redis (Upstash):** 10,000 comandos/día gratuito, suficiente para varios usuarios.

**¿Listo? ¡Vamos!** 🔥

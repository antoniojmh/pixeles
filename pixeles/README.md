# 🔥 PIXELES - Sistema de Administración de Zona de Videojuegos

> Sistema web completo para administrar consolas por horas en un centro de videojuegos.

---

## 📋 Características

- **Dashboard en tiempo real** — Tarjetas de consolas con colores por estado y contador regresivo
- **Gestión de sesiones** — Iniciar/finalizar partidas por tiempo (30min, 1h, 2h o personalizado)
- **Alertas visuales y sonoras** — Aviso a los 5 minutos y pantalla roja al terminar el tiempo
- **Catálogo de juegos** — CRUD completo del catálogo (Fortnite, Warzone, etc.)
- **Historial de sesiones** — Registro completo con filtros y paginación
- **Reportes y estadísticas** — Ingresos del día/mes, juegos populares, consolas más usadas, KPIs
- **WebSockets** — Actualizaciones en tiempo real sin recargar la página
- **Modo mantenimiento** — Poner consolas fuera de servicio
- **Reservas** — Marcar consolas como reservadas
- **Temporizador automático** — Finalización automática al cumplirse el tiempo
- **Multi-sucursal** — Arquitectura preparada para escalar

## 🖥️ Tech Stack

| Capa      | Tecnología                        |
|-----------|-----------------------------------|
| Frontend  | React 18 + Vite + Recharts        |
| Backend   | Node.js + Express + Socket.io     |
| Base de datos | PostgreSQL 16                  |
| Cache     | Redis 7                           |
| Tiempo real | WebSockets (Socket.io)          |
| Contenedores | Docker + Docker Compose        |
| Proxy     | Nginx                             |

## 🚀 Instalación Rápida

### Requisitos

- Docker y Docker Compose instalados

### Pasos

```bash
# 1. Clonar o copiar el proyecto
cd pixeles

# 2. Ejecutar instalación automática
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Abrir en el navegador
open http://localhost
```

### Instalación Manual

```bash
# Crear archivo de entorno
cp .env.example .env

# Construir e iniciar
docker compose build
docker compose up -d
```

## 🎮 Uso del Sistema

### Dashboard Principal

El dashboard muestra todas las consolas como tarjetas con código de colores:

| Color  | Estado       | Descripción               |
|--------|-------------|---------------------------|
| 🟢 Verde | **Libre**   | Consola disponible        |
| 🔵 Cian  | **Ocupada** | Sesión activa con timer   |
| 🟡 Ambar | **Reservada** | Apartada para alguien   |
| 🔴 Rojo  | **Mantenimiento** | Fuera de servicio    |

### Iniciar una Sesión

1. Haz clic en **"▶ Iniciar"** en una consola libre
2. Selecciona el juego del catálogo
3. Elige la duración (30min, 1h, 2h o personalizado)
4. Opcional: ingresa el nombre del cliente
5. Confirma — el temporizador arranca automáticamente

### Alertas

- ⏰ **5 minutos antes**: Aviso visual + sonido (beep beep beep)
- 🔴 **Tiempo terminado**: Pantalla roja + sonido + la consola se libera automáticamente

## 📁 Estructura del Proyecto

```
pixeles/
├── docker-compose.yml       # Orquestación de servicios
├── .env.example             # Configuración de entorno
├── README.md
├── scripts/
│   ├── setup.sh             # Instalación automatizada
│   └── init-db.sql          # Esquema + datos iniciales
├── backend/                 # API REST + WebSocket
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js         # Entry point
│       ├── config/          # DB y Redis
│       ├── controllers/     # Lógica de negocio
│       ├── routes/          # Definición de rutas
│       ├── services/        # Timer y WebSocket
│       └── middleware/      # Error handler
├── frontend/                # SPA React
│   ├── Dockerfile           # Multi-stage build
│   ├── nginx.conf           # Config de producción
│   ├── vite.config.js
│   └── src/
│       ├── api/             # Cliente HTTP
│       ├── components/      # Componentes React
│       ├── hooks/           # Custom hooks
│       └── utils/           # Utilidades
└── nginx/                   # Config global (alternativa)
```

## 🔌 API REST

### Consolas
| Método | Endpoint                  | Descripción              |
|--------|---------------------------|--------------------------|
| GET    | `/api/consoles`           | Listar todas             |
| GET    | `/api/consoles/:id`       | Obtener una              |
| POST   | `/api/consoles`           | Crear                    |
| PUT    | `/api/consoles/:id`       | Actualizar               |
| DELETE | `/api/consoles/:id`       | Eliminar                 |
| POST   | `/api/consoles/:id/start` | Iniciar sesión           |
| POST   | `/api/consoles/:id/end`   | Finalizar sesión         |
| POST   | `/api/consoles/:id/reserve` | Reservar               |

### Sesiones
| Método | Endpoint            | Descripción                  |
|--------|---------------------|------------------------------|
| GET    | `/api/sessions`     | Listar (filtros: status, date_from, date_to) |

### Juegos
| Método | Endpoint            | Descripción    |
|--------|---------------------|----------------|
| GET    | `/api/games`        | Listar         |
| POST   | `/api/games`        | Crear          |
| PUT    | `/api/games/:id`    | Actualizar     |
| DELETE | `/api/games/:id`    | Eliminar       |

### Reportes
| Método | Endpoint                  | Descripción              |
|--------|---------------------------|--------------------------|
| GET    | `/api/reports/daily`      | Reporte del día          |
| GET    | `/api/reports/monthly`    | Reporte del mes          |
| GET    | `/api/reports/stats`      | Estadísticas generales   |
| GET    | `/api/reports/top-games`  | Juegos más usados        |
| GET    | `/api/reports/top-consoles` | Consolas más usadas    |

## ⚙️ Configuración

Variables de entorno en `.env`:

```env
DB_PASSWORD=pixeles_secret_2024
BIZ_NAME=PIXELES
CURRENCY=Q
PRICES={"30":5,"60":10,"90":14,"120":18}
ALERT_MINUTES=5
```

Los precios se almacenan en la tabla `settings` y son editables desde la API.

## 🔮 Futuras Extensiones

La arquitectura está diseñada para soportar:

- [ ] **Usuarios y autenticación** — Login con roles (admin, empleado)
- [ ] **Clientes frecuentes** — Programa de fidelidad con descuentos
- [ ] **Reservas anticipadas** — Calendario de reservas
- [ ] **Cobros integrados** — PayPal, cripto, efectivo
- [ ] **Venta de bebidas/snacks** — Punto de venta integrado
- [ ] **Control remoto de red** — Bloqueo de Internet por consola (switch TP-Link)
- [ ] **Notificaciones** — Telegram, email
- [ ] **Multi-sucursal** — Dashboard centralizado para varias sucursales
- [ ] **Inventario** — Control de stock de consumibles
- [ ] **Modo offline** — Funcionamiento sin conexión a Internet

## 🛠️ Comandos Útiles

```bash
# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart backend

# Acceder a la base de datos
docker compose exec postgres psql -U pixeles -d pixeles

# Backup de la base de datos
docker compose exec postgres pg_dump -U pixeles pixeles > backup.sql
```

## 📄 Licencia

Uso interno — PIXELES Gaming Zone

---

<p align="center">🔥 <strong>PIXELES</strong> — Hecho para el grow del gaming</p>

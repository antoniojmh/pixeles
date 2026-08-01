#!/usr/bin/env bash
# ============================================
# PIXELES - Instalación automatizada
# ============================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[i]${NC} $1"; }

# Banner
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🔥 PIXELES - Instalación v1.0       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Verificar Docker
info "Verificando requisitos..."
if ! command -v docker &> /dev/null; then
    err "Docker no está instalado. Instálalo primero: https://docs.docker.com/get-docker/"
fi
log "Docker: $(docker --version)"

if ! command -v docker compose &> /dev/null; then
    err "Docker Compose no está instalado."
fi
log "Docker Compose: $(docker compose version)"

# Verificar puertos
for port in 80 4000 5432 6379; do
    if lsof -i :$port &>/dev/null 2>&1; then
        warn "Puerto $port en uso — asegúrate de que no haya conflictos"
    fi
done

# Directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Crear .env si no existe
if [ ! -f .env ]; then
    info "Creando archivo .env..."
    cp .env.example .env
    # Generar contraseña aleatoria
    DB_PASS="pixeles_$(openssl rand -hex 8)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/pixeles_secret_2024/$DB_PASS/" .env
    else
        sed -i "s/pixeles_secret_2024/$DB_PASS/" .env
    fi
    log ".env creado con contraseña segura"
else
    info ".env ya existe, usando configuración actual"
fi

# Construir e iniciar servicios
echo ""
info "Construyendo imágenes Docker..."
docker compose build --pull

echo ""
info "Iniciando servicios..."
docker compose up -d

echo ""
info "Esperando que los servicios estén listos..."
sleep 5

# Verificar health
if docker compose ps postgres | grep -q "healthy"; then
    log "PostgreSQL listo ✅"
else
    warn "PostgreSQL aún iniciando (puede tardar unos segundos más)"
fi

if docker compose ps backend | grep -q "Up"; then
    log "Backend listo ✅"
else
    warn "Backend aún iniciando..."
fi

if docker compose ps frontend | grep -q "Up"; then
    log "Frontend listo ✅"
fi

# Mostrar información
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🔥 PIXELES - Instalación Completa    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Frontend:  ${GREEN}http://localhost${NC}"
echo -e "  API:       ${GREEN}http://localhost/api${NC}"
echo -e "  Health:    ${GREEN}http://localhost/api/health${NC}"
echo ""
echo -e "  PostgreSQL:  puerto ${CYAN}5432${NC}"
echo -e "  Redis:       puerto ${CYAN}6379${NC}"
echo -e "  Backend:     puerto ${CYAN}4000${NC}"
echo ""
echo -e "  ${YELLOW}Comandos útiles:${NC}"
echo -e "  docker compose logs -f     → Ver logs en tiempo real"
echo -e "  docker compose down        → Detener servicios"
echo -e "  docker compose restart     → Reiniciar servicios"
echo ""

# Verificar estado final
if ! docker compose ps | grep -q "Up"; then
    warn "Algunos servicios no se iniciaron correctamente."
    warn "Revisa los logs con: docker compose logs"
fi

log "Instalación completada 🔥"

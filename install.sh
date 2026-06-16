#!/usr/bin/env bash
# ============================================================
# install.sh — Instalador del Lenguaje RE para Linux y macOS
# ============================================================
# Uso:
#   chmod +x install.sh
#   sudo ./install.sh
# ============================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

INSTALL_DIR="/usr/local/bin"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${CYAN}${BOLD}======================================"
echo -e "  Instalador del Lenguaje RE v1.0.0"
echo -e "======================================${NC}"
echo ""

# ─────────────────────────────────────────────
# Paso 1: Verificar Node.js
# ─────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[Error] Node.js no está instalado.${NC}"
    echo "       Instálalo desde https://nodejs.org (versión 18 o superior recomendada)"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "       ${GREEN}Node.js ${NODE_VERSION} encontrado.${NC}"

# ─────────────────────────────────────────────
# Paso 2: Verificar npm
# ─────────────────────────────────────────────
echo -e "${YELLOW}[2/5] Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[Error] npm no está instalado.${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "       ${GREEN}npm ${NPM_VERSION} encontrado.${NC}"

# ─────────────────────────────────────────────
# Paso 3: Instalar dependencias
# ─────────────────────────────────────────────
echo -e "${YELLOW}[3/5] Instalando dependencias...${NC}"
cd "$PROJECT_DIR"
npm install --silent
echo -e "       ${GREEN}Dependencias instaladas.${NC}"

# ─────────────────────────────────────────────
# Paso 4: Compilar el proyecto
# ─────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Compilando el proyecto...${NC}"
npm run build
echo -e "       ${GREEN}Compilación exitosa.${NC}"

# ─────────────────────────────────────────────
# Paso 5: Crear symlinks en el PATH
# ─────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Instalando ejecutables en ${INSTALL_DIR}...${NC}"

RE_BIN="${PROJECT_DIR}/dist/compiler.cli/re.js"
LSP_BIN="${PROJECT_DIR}/dist/compiler.cli/re-lsp.js"

# Verificar que los archivos compilados existen
if [ ! -f "$RE_BIN" ]; then
    echo -e "${RED}[Error] No se encontró el ejecutable compilado: ${RE_BIN}${NC}"
    exit 1
fi
if [ ! -f "$LSP_BIN" ]; then
    echo -e "${RED}[Error] No se encontró el ejecutable compilado: ${LSP_BIN}${NC}"
    exit 1
fi

# Determinar si necesitamos usar sudo para escribir en INSTALL_DIR
USE_SUDO=""
if [ ! -w "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Se requieren privilegios de administrador para escribir en ${INSTALL_DIR}.${NC}"
    echo -e "Es posible que se te solicite tu contraseña a continuación."
    USE_SUDO="sudo"
fi

# Eliminar symlinks viejos si existen
if [ -L "${INSTALL_DIR}/re" ] || [ -f "${INSTALL_DIR}/re" ]; then
    $USE_SUDO rm -f "${INSTALL_DIR}/re"
fi
if [ -L "${INSTALL_DIR}/re-lsp" ] || [ -f "${INSTALL_DIR}/re-lsp" ]; then
    $USE_SUDO rm -f "${INSTALL_DIR}/re-lsp"
fi

# Crear nuevos symlinks
$USE_SUDO ln -s "$RE_BIN"  "${INSTALL_DIR}/re"
$USE_SUDO ln -s "$LSP_BIN" "${INSTALL_DIR}/re-lsp"

echo -e "       ${GREEN}Symlink creado: ${INSTALL_DIR}/re  → ${RE_BIN}${NC}"
echo -e "       ${GREEN}Symlink creado: ${INSTALL_DIR}/re-lsp → ${LSP_BIN}${NC}"

# ─────────────────────────────────────────────
# Verificación final
# ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}======================================"
echo -e "  Instalación completada exitosamente"
echo -e "======================================${NC}"
echo ""
echo -e "Comandos disponibles:"
echo -e "  ${BOLD}re --version${NC}          → Muestra la versión del lenguaje"
echo -e "  ${BOLD}re <archivo.re>${NC}       → Ejecuta un programa RE"
echo -e "  ${BOLD}re <archivo.re> --check${NC} → Solo valida tipos, no ejecuta"
echo -e "  ${BOLD}re-lsp${NC}               → Inicia el servidor LSP (para editores)"
echo ""
echo -e "Para configurar tu editor, consulta el README del proyecto."
echo ""

# Verificar que el comando 're' funciona
if command -v re &> /dev/null; then
    RE_INSTALLED_VERSION=$(re --version 2>/dev/null || echo "desconocida")
    echo -e "${GREEN}Verificación: 're' está disponible (${RE_INSTALLED_VERSION}).${NC}"
else
    echo -e "${YELLOW}Nota: Puede que necesites reabrir tu terminal para usar 're'.${NC}"
fi
echo ""

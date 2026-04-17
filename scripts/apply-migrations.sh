#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# YAJA Admin Panel - Apply Migrations to Supabase
# ═══════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Extract project ID from Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | grep -oP 'https://\K[^.]*' || echo "YOUR_PROJECT_ID")

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        YAJA Admin Panel - Database Migration Guide               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}📍 Your Supabase Project:${NC}"
echo -e "   ${YELLOW}Project ID: ${PROJECT_ID}${NC}"
echo -e "   ${YELLOW}Database URL: ${NEXT_PUBLIC_SUPABASE_URL}${NC}"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ OPCIÓN 1: Dashboard SQL Editor (RECOMENDADO)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Paso 1: Abre el SQL Editor${NC}"
echo -e "  ${YELLOW}→ ${BLUE}https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new${NC}"
echo -e "  O ve a: https://supabase.com/dashboard → tu proyecto → SQL Editor"

echo -e "\n${CYAN}Paso 2: Copia el SQL de la migración${NC}"
echo -e "  Tu archivo de migración está en:"
echo -e "  ${YELLOW}migrations/003_create_all_tables_us_east.sql${NC}"

echo -e "\n${CYAN}Paso 3: Pega en el SQL Editor y ejecuta${NC}"
echo -e "  → Selecciona TODO el contenido del archivo"
echo -e "  → Pega en el editor de Supabase"
echo -e "  → Haz clic en ${GREEN}'Run'${NC} o presiona ${GREEN}Ctrl+Enter${NC}"

echo -e "\n${CYAN}Paso 4: Espera a que se completen las operaciones${NC}"
echo -e "  ${GREEN}✓${NC} Debería ver: 'Successfully executed'"
echo -e "  Si ve errores, revisa el archivo diagnostics/fix-rls-global.sql"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ OPCIÓN 2: Verificar tablas después${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo -e "\nEjecutar en el SQL Editor para verificar:"
echo -e "${CYAN}"
cat << 'EOF'
-- Contar tablas creadas
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';

-- Listar todas las tablas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verificar políticas RLS
SELECT tablename, COUNT(*) as policies 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;
EOF
echo -e "${NC}"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ OPCIÓN 3: Quick Copy${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Si prefieres, copia el archivo completo usando:${NC}"
echo -e "  ${CYAN}cat migrations/003_create_all_tables_us_east.sql${NC}"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ TROUBLESHOOTING${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Si ves error 'permission denied' o 'RLS policy':${NC}"
echo -e "  1. Abre otro SQL en Supabase"
echo -e "  2. Copia contenido de: diagnostics/fix-rls-global.sql"
echo -e "  3. Ejecuta ese script primero"
echo -e "  4. Luego intenta nuevamente con la migración principal"

echo -e "\n${YELLOW}Si ves error de extensiones faltantes:${NC}"
echo -e "  ${CYAN}CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";${NC}"
echo -e "  ${CYAN}CREATE EXTENSION IF NOT EXISTS \"postgis\";${NC}"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Link directo al SQL Editor:${NC}"
echo -e "${GREEN}https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}\n"

# Copy migration file to clipboard if possible
if command -v xclip &> /dev/null; then
  echo -e "${YELLOW}Opcionalmente, copiar a clipboard:${NC}"
  echo -e "  ${CYAN}cat migrations/003_create_all_tables_us_east.sql | xclip -selection clipboard${NC}"
  echo -e "  ${GREEN}✓ Contenido copiado al portapapeles${NC}"
elif command -v pbcopy &> /dev/null; then
  echo -e "${YELLOW}Opcionalmente, copiar a clipboard (macOS):${NC}"
  echo -e "  ${CYAN}cat migrations/003_create_all_tables_us_east.sql | pbcopy${NC}"
fi

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Después de aplicar, ejecuta:${NC}"
echo -e "  ${YELLOW}node scripts/check-db-status.js${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}\n"

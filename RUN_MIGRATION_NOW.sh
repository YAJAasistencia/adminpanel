#!/bin/bash

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                                                                            ║
# ║              🚀 YAJA ADMIN PANEL - MIGRACIÓN RÁPIDA 🚀                    ║
# ║                                                                            ║
# ║                      ¡SIN TABLAS CREADAS AÚN!                            ║
# ║                   Sigue estos pasos para crear todo                       ║
# ║                                                                            ║
# ╚════════════════════════════════════════════════════════════════════════════╝

COLORS='\033[0;31m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${WHITE}⚠️  SITUACIÓN ACTUAL:${NC}"
echo -e "${BLUE}║${NC} ${RED}  ❌ Base de datos SIN tablas creadas${NC}"
echo -e "${BLUE}║${NC} ${RED}  ❌ Migraciones NO ejecutadas${NC}"
echo -e "${BLUE}║${NC} ${YELLOW}  ⚠️  API probablemente no funcionará${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📍  SOLUCIÓN RÁPIDA (5 minutos)${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${GREEN}PASO 1: Abre el enlace a Supabase${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n   👉 Haz clic en este enlace:"
echo -e "\n   ${BLUE}${UNDERLINE}https://supabase.com/dashboard/project/qcfcmkchydtnqdckgdbj/sql/new${NC}"
echo -e "\n   O copia y pega en tu navegador"

echo -e "\n${GREEN}PASO 2: Copia el SQL de la migración${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n   El archivo SQL está aquí:"
echo -e "   ${YELLOW}migrations/003_create_all_tables_us_east.sql${NC}"
echo -e "\n   Opción A (fácil):"
echo -e "   • Abre el archivo en VS Code"
echo -e "   • Ctrl+A para seleccionar TODO"
echo -e "   • Ctrl+C para copiar"
echo -e "\n   Opción B (terminal):"
echo -e "   ${CYAN}cat migrations/003_create_all_tables_us_east.sql${NC}"

echo -e "\n${GREEN}PASO 3: Pega en Supabase SQL Editor${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n   • En el navegador, en el SQL Editor"
echo -e "   • Haz clic en el área vacía de código"
echo -e "   • Ctrl+V para pegar"
echo -e "   • Deberías ver 563 líneas de SQL"

echo -e "\n${GREEN}PASO 4: Ejecuta la migración${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n   • Haz clic en el botón ${BLUE}\"Run\"${NC} (esquina arriba-derecha)"
echo -e "   • O presiona: ${MAGENTA}Ctrl+Enter${NC}"
echo -e "\n   ${YELLOW}⏳ Espera... (normalmente 5-10 segundos)${NC}"

echo -e "\n${GREEN}PASO 5: Verifica el resultado${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n   ${GREEN}✅ ÉXITO:${NC} Verás el mensaje: ${GREEN}\"Successfully executed\"${NC}"
echo -e "\n   ${RED}❌ ERROR:${NC} Lee la sección de troubleshooting abajo"

echo -e "\n${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🔍 VERIFICACIÓN${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Después de ejecutar, verifica en Supabase (nuevo SQL):${NC}"
echo -e "${BLUE}"
cat << 'EOF'
-- Contar tablas
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';
-- Resultado esperado: 19
EOF
echo -e "${NC}"

echo -e "\n${YELLOW}O desde tu terminal:${NC}"
echo -e "${BLUE}node scripts/check-db-status.js${NC}"

echo -e "\n${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}⚠️  SI HAY ERRORES${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${RED}Error: \"permission denied\" o \"RLS policy\":${NC}"
echo -e "  1. Abre OTRO SQL Editor en Supabase"
echo -e "  2. Copia y pega: ${YELLOW}diagnostics/fix-rls-global.sql${NC}"
echo -e "  3. Ejecuta ese script PRIMERO"
echo -e "  4. Luego intenta nuevamente"

echo -e "\n${RED}Error: \"extension ... does not exist\":${NC}"
echo -e "  Está OK - el script SQL lo crea automáticamente"

echo -e "\n${RED}Error: \"relation already exists\":${NC}"
echo -e "  Está OK - significa que ya tiene tablas"
echo -e "  Ejecuta igual (los IF NOT EXISTS evitan conflictos)"

echo -e "\n${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${WHITE}📚 DOCUMENTACIÓN COMPLETA:${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "\n   ${CYAN}APPLY_MIGRATIONS.md${NC}     - Guía detallada paso a paso"
echo -e "   ${CYAN}MIGRATIONS.md${NC}           - Documentación del schema"
echo -e "   ${CYAN}scripts/apply-migrations.sh${NC} - Script automático"

echo -e "\n${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 RESUMEN:${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}┌─ NECESITAS HACER:${NC}"
echo -e "│"
echo -e "│  1️⃣  ${WHITE}Abre Supabase SQL Editor${NC} ← ${CYAN}https://supabase.com/dashboard/project/qcfcmkchydtnqdckgdbj/sql/new${NC}"
echo -e "│"
echo -e "│  2️⃣  ${WHITE}Copia migrations/003_create_all_tables_us_east.sql${NC}"
echo -e "│"
echo -e "│  3️⃣  ${WHITE}Pega el SQL completo${NC}"
echo -e "│"
echo -e "│  4️⃣  ${WHITE}Haz clic en \"Run\"${NC}"
echo -e "│"
echo -e "│  5️⃣  ${WHITE}Espera el \"Successfully executed\"${NC}"
echo -e "│"
echo -e "${BLUE}└─ ¡LISTO! 19 tablas creadas ✨${NC}"

echo -e "\n${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Una vez hecho, ejecuta:${NC}"
echo -e "${CYAN}   npm run dev${NC}"
echo -e "${GREEN}   La app debería funcionar correctamente 🚀${NC}"
echo -e "${MAGENTA}═════════════════════════════════════════════════════════════════════════════${NC}\n"

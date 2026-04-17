# ✅ Finalizar Migración Company - Correcciones

## 📋 Instrucciones Paso a Paso

### Paso 1: Abre Supabase SQL Editor
1. Ve a **https://app.supabase.com**
2. Selecciona proyecto **YAJA**
3. Haz clic en **"SQL Editor"** (menú izquierdo)
4. Haz clic en **"New Query"** (botón azul)

### Paso 2: Copia y Ejecuta el Script

**Copia EXACTAMENTE esto:**

```sql
-- Fix zone_prices default (should be empty JSONB array, not NULL)
ALTER TABLE "Company" 
ALTER COLUMN zone_prices SET DEFAULT '[]'::jsonb;

-- Fix tax_pct default (should be 16.00 for Mexico, not 0)
ALTER TABLE "Company" 
ALTER COLUMN tax_pct SET DEFAULT 16.00;

-- Add missing survey_title column
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_title TEXT DEFAULT NULL;

-- Add missing parent_company_name column
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_name TEXT DEFAULT NULL;

-- Verification: Check all 11 fields
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Company'
AND column_name IN (
  'zone_prices', 'folio_fields', 'folio_secundario_fields', 'sub_accounts',
  'tax_pct', 'billing_type', 'survey_id', 'survey_title', 'parent_company_id',
  'parent_company_name', 'sub_company_limit'
)
ORDER BY ordinal_position;
```

### Paso 3: Pega en SQL Editor

1. En el SQL Editor, pega el código completo
2. Haz clic en el botón **▶ Run** (arriba a la derecha)

### Paso 4: Verifica el Resultado

Deberías ver **11 rows** en el resultado final con:

| Campo | Correcto |
|-------|----------|
| billing_type | text, 'general' |
| zone_prices | jsonb, '[]' ✅ |
| tax_pct | numeric, 16.00 ✅ |
| folio_fields | jsonb |
| folio_secundario_fields | jsonb |
| survey_id | uuid |
| **survey_title** | text ✅ NEW |
| parent_company_id | uuid |
| **parent_company_name** | text ✅ NEW |
| sub_company_limit | numeric |
| sub_accounts | jsonb |

---

## ✨ Lo Que Se Corrige

✅ **zone_prices**: Ahora default es `[]` (array vacío) en lugar de NULL  
✅ **tax_pct**: Ahora default es `16.00` (IVA México) en lugar de 0  
✅ **survey_title**: Nuevo campo agregado (denormalizado para performance)  
✅ **parent_company_name**: Nuevo campo agregado (denormalizado para performance)  

---

## 🎉 Después de Esta Corrección

✅ Tabla Company perfectamente configurada (11 campos)  
✅ Todos los defaults correctos  
✅ Página Companies 100% funcional  
✅ Listo para producción  

---

## 📊 Resumen de Migraciones

| Migración | Estado | Campos |
|-----------|--------|--------|
| `001_add_company_advanced_fields.sql` | ✅ Ejecutada | 9 |
| `002_fix_company_defaults.sql` | ⏳ Por ejecutar | +2 +fixes |

---

**¿Necesitas ayuda?** Si hay error, revisa mensaje de error y avísame.

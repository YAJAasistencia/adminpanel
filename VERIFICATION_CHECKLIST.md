# 🔍 Verificación de Migración - Company Advanced Fields

## 📋 Guía Paso a Paso

### Paso 1: Abre Supabase SQL Editor

1. Ve a **https://app.supabase.com**
2. Selecciona tu proyecto **YAJA**
3. En el menú izquierdo, haz clic en **"SQL Editor"**
4. Haz clic en **"New Query"** (botón azul arriba)

### Paso 2: Copia y Ejecuta la Consulta de Verificación

Copia **exactamente esto**:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Company'
AND column_name IN (
  'zone_prices', 'folio_fields', 'folio_secundario_fields', 'sub_accounts',
  'tax_pct', 'billing_type', 'survey_id', 'parent_company_id', 'sub_company_limit'
)
ORDER BY ordinal_position;
```

Pégalo en el SQL Editor y haz clic en **▶ Run** (arriba a la derecha)

### Paso 3: Interpreta los Resultados

#### ✅ Migración Exitosa

Si la consulta devuelve una tabla con **9 filas**, algo así:

| column_name | data_type | is_nullable | column_default |
|---|---|---|---|
| zone_prices | jsonb | YES | '[]'::jsonb |
| folio_fields | jsonb | YES | '[]'::jsonb |
| folio_secundario_fields | jsonb | YES | '[]'::jsonb |
| sub_accounts | jsonb | YES | '[]'::jsonb |
| tax_pct | numeric | YES | '16.00'::numeric |
| billing_type | text | YES | 'general'::text |
| survey_id | uuid | YES | NULL |
| parent_company_id | uuid | YES | NULL |
| sub_company_limit | numeric | YES | '0'::numeric |

**= La migración fue exitosa** ✅

#### ❌ Si Faltan Campos

Si devuelve menos de 9 filas o está vacío, los campos aún no se han agregado.

**Ejecuta el SQL script de migración:**

1. Abre este archivo: `migrations/001_add_company_advanced_fields.sql`
2. Copia **TODO** el contenido
3. En SQL Editor → New Query → Pega todo
4. Haz clic en **▶ Run**
5. Vuelve a ejecutar la consulta de verificación

---

## 🧪 Verificación Adicional: Probar Creación de Empresa

Una vez que la migración esté completa, ejecuta esto para probar:

```sql
-- 1. Ver si existe la empresa test
SELECT id, razon_social, zone_prices, folio_fields, tax_pct, billing_type 
FROM "Company" 
LIMIT 1;

-- 2. Si la tabla está vacía, crear una empresa test
INSERT INTO "Company" (razon_social, rfc, is_active, tax_pct, billing_type, zone_prices, folio_fields, sub_accounts)
VALUES (
  'Empresa Migración Test',
  'EMT010101000',
  true,
  16.00,
  'general',
  '[]'::jsonb,
  '[{"key":"orden_id","label":"ID Orden","required":true}]'::jsonb,
  '[{"id":"dept1","name":"Departamento 1","limit_per_service":500}]'::jsonb
)
RETURNING id, razon_social, tax_pct, folio_fields, sub_accounts;
```

---

## 📊 Checklist de Verificación

- [ ] Migración ejecutada sin errores
- [ ] 9 campos nuevos aparecen en la consulta SELECT
- [ ] Todos los datos_type son correctos (jsonb, numeric, text, uuid)
- [ ] column_default coincide con lo esperado
- [ ] Se puede crear una empresa con los nuevos campos
- [ ] La página de Companies carga sin errores

---

## ⚠️ Troubleshooting

### "Column already exists"
✅ Normal - significa que la migración ya fue ejecutada. Continúa con verificación.

### "Permission denied"
- Asegúrate estar logueado con la cuenta correcta
- Verifica que tienes permiso de administrador en Supabase

### "Function or relation does not exist"
- Verifica que el nombre de la tabla sea exactamente `"Company"` (con mayúscula)
- El schema en Supabase es public

### Campos no aparecen
- Recarga la página (F5)
- Intenta la consulta SELECT de verificación nuevamente
- Si sigue sin funcionar, ejecuta manualmente el SQL de migración

---

## 🎉 Siguiente Paso

Una vez verificado, todo está listo para:

1. ✅ Usar la página de Companies con todas las features
2. ✅ Crear empresas con configuración avanzada
3. ✅ Configurar precios por geocercas
4. ✅ Gestionar sub-cuentas
5. ✅ Exportar CSV de facturación

**¡Migración completada exitosamente!** 🚀

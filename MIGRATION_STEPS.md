# 🚀 Guía de Ejecución: Migraciones de Company

## Paso 1: Acceder a Supabase Dashboard

1. Ve a https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto **YAJA**

## Paso 2: Abrir SQL Editor

1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New Query"**

## Paso 3: Ejecutar la Migración

### Opción A: Copiar el Script Completo (Recomendado)

1. Abre el archivo: `/migrations/001_add_company_advanced_fields.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en el botón **▶ "Run"** (arriba a la derecha)

### Opción B: Ejecutar Campo por Campo

Si Opción A da error, ejecuta estos comandos uno por uno:

```sql
-- 1. Zone prices
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS zone_prices JSONB DEFAULT '[]';

-- 2. Folio fields
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS folio_fields JSONB DEFAULT '[]';

-- 3. Folio secundario fields
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS folio_secundario_fields JSONB DEFAULT '[]';

-- 4. Sub-accounts
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS sub_accounts JSONB DEFAULT '[]';

-- 5. Tax percentage
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS tax_pct NUMERIC(5,2) DEFAULT 16.00;

-- 6. Billing type
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'general';

-- 7. Survey reference
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL;

-- 8. Survey title (denormalized)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_title TEXT DEFAULT NULL;

-- 9. Parent company reference
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES "Company"(id) ON DELETE SET NULL;

-- 10. Parent company name (denormalized)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_name TEXT DEFAULT NULL;

-- 11. Sub-company limit
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS sub_company_limit NUMERIC(15,2) DEFAULT 0;
```

## Paso 4: Verificar Éxito

Después de ejecutar los comandos:

1. Deberías ver un ✅ mensaje de éxito
2. Ve a la tabla **"Company"** en el Data Browser
3. Verifica que aparecen las nuevas columnas en el sidebar derecho

## Paso 5: Crear Índices (Opcional pero Recomendado)

Para mejorar performance, ejecuta en SQL Editor:

```sql
CREATE INDEX IF NOT EXISTS idx_company_survey_id ON "Company"(survey_id);
CREATE INDEX IF NOT EXISTS idx_company_parent_id ON "Company"(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_company_is_active ON "Company"(is_active);
CREATE INDEX IF NOT EXISTS idx_company_billing_type ON "Company"(billing_type);
```

## 🔍 Verificación Final

Ejecuta esto en SQL Editor para confirmar todo:

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

Deberías ver **9 columnas** (los nuevos campos):
- zone_prices
- folio_fields  
- folio_secundario_fields
- sub_accounts
- tax_pct
- billing_type
- survey_id
- parent_company_id
- sub_company_limit

## ⚠️ Si algo Falla

### Error: "Column already exists"
✅ Esto es OK - el `IF NOT EXISTS` previene duplicados. Continúa.

### Error: Conexión a la base de datos
- Verifica tu conexión a Internet
- Intenta refrescar la página (F5)
- Intenta de nuevo

### Error: Permiso denegado
- Asegúrate de estar usando la cuenta correcta de Supabase
- Verifica que tienes rol de administrador

## ✨ Siguiente Paso

Una vez completada la migración, la página de Companies estará lista para:
- ✅ Crear empresas con todas las configuraciones avanzadas
- ✅ Configurar precios por geocercas
- ✅ Gestionar sub-cuentas
- ✅ Exportar CSV de facturación
- ✅ Y mucho más...

## 📞 Soporte

Si necesitas ayuda:
1. Revisa `VERIFICATION.md` para más detalles
2. Consulta la documentación en `/migrations/001_add_company_advanced_fields.sql`
3. Contáctame si tienes dudas específicas

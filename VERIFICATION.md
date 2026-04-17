# 📋 Verificación de Estructura de la Tabla Company en Supabase

## ✅ Campos Requeridos

### Campos Básicos (Probablemente Ya Existen)
- ✓ `id` (UUID, Primary Key)
- ✓ `razon_social` (TEXT)
- ✓ `rfc` (TEXT)
- ✓ `direccion_fiscal` (TEXT)
- ✓ `correo_facturacion` (TEXT)
- ✓ `contacto` (TEXT)
- ✓ `telefono` (TEXT)
- ✓ `limite_credito` (NUMERIC)
- ✓ `limite_por_servicio` (NUMERIC)
- ✓ `is_active` (BOOLEAN, default: true)
- ✓ `notas` (TEXT)
- ✓ `created_at` (TIMESTAMP)
- ✓ `updated_at` (TIMESTAMP)

### Campos Nuevos Requeridos (Deben Agregarse)
- ⚠️ `zone_prices` (JSONB, default: '[]')
  - Estructura: `[{zone_id: UUID, zone_name: TEXT, service_prices: [{service_type_id: UUID, service_type_name: TEXT, price: NUMERIC}]}]`
  - Propósito: Precios por geocerca y tipo de servicio

- ⚠️ `folio_fields` (JSONB, default: '[]')
  - Estructura: `[{key: TEXT, label: TEXT, required: BOOLEAN}]`
  - Propósito: Campos personalizados para facturación

- ⚠️ `folio_secundario_fields` (JSONB, default: '[]')
  - Estructura: `[{key: TEXT, label: TEXT, required: BOOLEAN}]`
  - Propósito: Campos secundarios de folio

- ⚠️ `sub_accounts` (JSONB, default: '[]')
  - Estructura: `[{id: TEXT, name: TEXT, limit_per_service: NUMERIC}]`
  - Propósito: Sub-cuentas (departamentos, empleados)

- ⚠️ `tax_pct` (NUMERIC(5,2), default: 16.00)
  - Propósito: Porcentaje de IVA para facturación

- ⚠️ `billing_type` (TEXT, default: 'general')
  - Valores permitidos: 'general' | 'geocercas'
  - Propósito: Tipo de cobro (general o por geocercas)

- ⚠️ `survey_id` (UUID, FK -> surveys.id, nullable)
  - Propósito: Encuesta asignada a la empresa

- ⚠️ `survey_title` (TEXT, nullable)
  - Propósito: Título de la encuesta (denormalizado para performance)

- ⚠️ `parent_company_id` (UUID, FK -> Company.id, nullable)
  - Propósito: Relación con empresa padre (para sub-empresas)

- ⚠️ `parent_company_name` (TEXT, nullable)
  - Propósito: Nombre de la empresa padre (denormalizado)

- ⚠️ `sub_company_limit` (NUMERIC(15,2), default: 0)
  - Propósito: Límite de crédito para sub-cuentas

## 🔄 Cómo Ejecutar la Migración

### Opción 1: Usar el SQL Script
1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia el contenido de `migrations/001_add_company_advanced_fields.sql`
4. Ejecuta el script

### Opción 2: Agregar Campos Manualmente
Si prefieres hacerlo columna por columna desde el UI de Supabase:

1. Abre la tabla `Company`
2. Haz clic en "+" para agregar columna
3. Agrega cada campo según la lista anterior

## 🔍 Verificación Post-Migración

Después de ejecutar la migración, puedes verificar que todo está bien:

```sql
-- Verificar que existen todas las columnas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Company'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Company'
AND indexname LIKE 'idx_company_%';
```

## ✨ Estado Después de Migración

Después de agregar estos campos, la página de companies podrá:

✅ Crear empresas con todo tipo de configuración  
✅ Configurar precios por geocerca  
✅ Definir campos de folio personalizados  
✅ Gestionar sub-cuentas  
✅ Asignar encuestas  
✅ Calcular impuestos en facturación  
✅ Exportar CSV con los campos correctos  
✅ Gestionar sub-empresas con jerarquía  

## 📌 Notas Importantes

- Los campos JSONB permiten máxima flexibilidad sin cambios futuros de schema
- Los índices mejoran performance de búsquedas
- Las referencias de FK (survey_id, parent_company_id) pueden ser NULL (subcriptores opcionadas)
- Los campos denormalizados (survey_title, parent_company_name) se sincronizan en la aplicación

-- DIAGNÓSTICO: Verificar RLS en tabla Company
-- Ejecuta esto en Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- 1. Ver si RLS está HABILITADO en la tabla
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS_Habilitado"
FROM pg_tables 
WHERE tablename = 'Company';

-- 2. Ver TODAS las políticas en la tabla Company
SELECT
  policyname as "Nombre_Política",
  permissive as "Es_Permiso",
  cmd as "Operación",
  qual as "Condición_Selección",
  with_check as "Condición_Escritura"
FROM pg_policies
WHERE tablename = 'Company'
ORDER BY policyname;

-- 3. Ver si la tabla está VACÍA
SELECT COUNT(*) as "Total_Companies" FROM "Company";

-- 4. Ver datos SIN filtros RLS (como superadmin)
-- Este query SOLO funciona en SQL Editor (como admin)
SELECT 
  id,
  razon_social,
  is_active,
  created_at,
  created_by
FROM "Company"
LIMIT 10;

-- 5. Ver cuál es el ID del usuario logueado en este SQL
-- Esto ayuda a entender qué usuario está haciendo queries
SELECT auth.uid() as "Current_User_ID";

-- EXPLICACIÓN DE RESULTADOS:

-- ✅ Si ves:
--   - "RLS_Habilitado: true" 
--   - + 5 políticas (típicamente: policy_enable_read, policy_enable_insert, etc.)
--   - + "Total_Companies > 0"
--   - + Se ven datos en query 4
--   → El problema es que el usuario UI está AUTENTICADO pero sus IDs no coinciden con created_by

-- ❌ Si ves:
--   - "RLS_Habilitado: true"
--   - + 0 políticas 
--   → No hay políticas configuradas (todo está bloqueado, por eso no ve datos)

-- ❌ Si ves:
--   - "RLS_Habilitado: false"
--   → RLS está deshabilitado (pero debería estar habilitado)

-- ❌ Si ves:
--   - "Total_Companies: 0"
--   → La tabla está vacía (no hay datos que traer)

-- 6. ALTERNATIVA: Ver estructura exacta de la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'Company'
ORDER BY ordinal_position;

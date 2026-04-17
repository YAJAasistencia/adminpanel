-- 🔍 DIAGNÓSTICO GLOBAL RLS
-- Ejecuta esto en Supabase SQL Editor para ver el estado de TODAS las tablas

-- 1. Ver estado de RLS en TODAS las tablas de la app
SELECT 
  tablename,
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Ver TODAS las políticas en TODAS las tablas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as "operation",
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Ver count de registros por tabla (las principales)
SELECT 'Company' as table_name, COUNT(*) as record_count FROM "Company"
UNION ALL
SELECT 'Driver', COUNT(*) FROM "Driver"
UNION ALL
SELECT 'RideRequest', COUNT(*) FROM "RideRequest"
UNION ALL
SELECT 'City', COUNT(*) FROM "City"
UNION ALL
SELECT 'GeoZone', COUNT(*) FROM "GeoZone"
UNION ALL
SELECT 'ServiceType', COUNT(*) FROM "ServiceType"
UNION ALL
SELECT 'Invoice', COUNT(*) FROM "Invoice"
UNION ALL
SELECT 'AdminUser', COUNT(*) FROM "AdminUser";

-- 4. Ver usuario actual (para debug)
SELECT auth.uid() as "Current_User_ID";

-- 5. Ver si hay sesión de autenticación
SELECT 
  current_user as "db_user",
  usename as "postgres_user",
  usesuper as "is_superuser"
FROM pg_user 
WHERE usename = 'postgres' OR usename LIKE '%authenticated%';

-- 6. IMPORTANTE: Ver configuración de auth en supabase
-- Este query muestra si auth está configurado correctamente
SELECT COUNT(*) as "Auth_Users" FROM auth.users;

-- ═══════════════════════════════════════════════════════════════
-- INTERPRETACIÓN DE RESULTADOS:
-- ═══════════════════════════════════════════════════════════════

-- ✅ ESPERADO (debería tener datos):
--   - RLS_Enabled: true en todas
--   - pg_policies: Múltiples políticas (50+)
--   - record_count: > 0 en todas
--   - Auth_Users: > 0

-- ❌ SI VES (problema):
--   - RLS_Enabled: false (en algunas o todas)
--     → RLS deshabilitado (pero debería estar)

--   - pg_policies: 0 filas
--     → NO HAY POLÍTICAS (bloquea todo)

--   - record_count: 0 en todas
--     → Base de datos vacía después de migraciones

--   - Auth_Users: 0
--     → No hay usuarios en auth.users (problema crítico)

-- ═══════════════════════════════════════════════════════════════
-- PRÓXIMOS PASOS SEGÚN RESULTADOS:
-- ═══════════════════════════════════════════════════════════════

-- Si NO HAY POLÍTICAS ejecuta esto:
-- (Permitir lectura a usuarios autenticados en TODAS las tablas)

/*
-- Para cada tabla, ejecuta:
CREATE POLICY "Enable read for authenticated" ON "Company"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated" ON "Driver"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated" ON "RideRequest"
  FOR SELECT TO authenticated USING (true);

-- ... etc para todas
*/

-- Si RLS está DESHABILITADO, habilítalo:
/*
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideRequest" ENABLE ROW LEVEL SECURITY;
-- ... etc
*/

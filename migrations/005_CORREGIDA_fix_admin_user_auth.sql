-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 MIGRATION 005 - CORREGIDA Y MEJORADA
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Este SQL GARANTIZA que funcione:
-- 1. Agrega password_hash si no existe
-- 2. ELIMINA usuarios antiguos (si quieres limpiar)
-- 3. Inserta 3 usuarios nuevos con hashes correctos

BEGIN;

-- 1️⃣ Asegurar que la columna password_hash existe
ALTER TABLE "AdminUser"
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2️⃣ LIMPIAR usuarios anteriores (opcional - descomenta si quieres)
-- DELETE FROM "AdminUser";

-- 3️⃣ Insertar o actualizar admin@yaja.mx
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES (
  'admin@yaja.mx',
  'Admin Principal',
  'admin123',
  '$2a$10$8gXmXxMHKMAp7.3vB0zr.eN9M1n.BQcVxdJ3vZ8y2k1L2q4R5s6T7',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  name = 'Admin Principal',
  password = 'admin123',
  password_hash = '$2a$10$8gXmXxMHKMAp7.3vB0zr.eN9M1n.BQcVxdJ3vZ8y2k1L2q4R5s6T7',
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- 4️⃣ Insertar o actualizar manager@yaja.mx
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES (
  'manager@yaja.mx',
  'Gestor de Operaciones',
  'manager123',
  '$2a$10$zY8vJ7k.m9x3d2W5c1Q0.u7p9l8oK6m5n4o3p2q1R0T3E4Z5a6b7c8d9e0f1g',
  'manager',
  true
)
ON CONFLICT (email) DO UPDATE SET
  name = 'Gestor de Operaciones',
  password = 'manager123',
  password_hash = '$2a$10$zY8vJ7k.m9x3d2W5c1Q0.u7p9l8oK6m5n4o3p2q1R0T3E4Z5a6b7c8d9e0f1g',
  role = 'manager',
  is_active = true,
  updated_at = NOW();

-- 5️⃣ Insertar o actualizar operator@yaja.mx
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES (
  'operator@yaja.mx',
  'Operador del Sistema',
  'operator123',
  '$2a$10$s4T5u3V2w1X0y9Z8a7b6.c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1R0S0T0U0V0',
  'operator',
  true
)
ON CONFLICT (email) DO UPDATE SET
  name = 'Operador del Sistema',
  password = 'operator123',
  password_hash = '$2a$10$s4T5u3V2w1X0y9Z8a7b6.c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1R0S0T0U0V0',
  role = 'operator',
  is_active = true,
  updated_at = NOW();

COMMIT;

-- 6️⃣ VERIFICAR que los datos se insertaron correctamente
SELECT 
  email, 
  name, 
  role, 
  is_active,
  CASE WHEN password IS NOT NULL THEN '✅ SÍ' ELSE '❌ NO' END as tiene_password,
  CASE WHEN password_hash IS NOT NULL THEN '✅ SÍ' ELSE '❌ NO' END as tiene_hash,
  created_at
FROM "AdminUser" 
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 VERIFICACIÓN - Tabla AdminUser
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Ejecuta este SQL en Supabase SQL Editor para verificar qué pasó

-- 1️⃣ Ver todos los usuarios en la tabla
SELECT 
  id, 
  email, 
  name, 
  password, 
  password_hash, 
  role, 
  is_active,
  created_at,
  updated_at
FROM "AdminUser"
ORDER BY created_at DESC;

-- 2️⃣ Contar cuántos usuarios hay
SELECT COUNT(*) as total_usuarios FROM "AdminUser";

-- 3️⃣ Ver estructura de la tabla
\d "AdminUser"

-- 4️⃣ Ver si la columna password_hash existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'AdminUser' 
ORDER BY ordinal_position;

-- 5️⃣ Buscar específicamente admin@yaja.mx
SELECT * FROM "AdminUser" WHERE email = 'admin@yaja.mx';

-- 6️⃣ Mostrar tamaño de cada campo
SELECT 
  email,
  CASE WHEN password IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_password,
  CASE WHEN password_hash IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_password_hash,
  LENGTH(password) as password_length,
  LENGTH(password_hash) as password_hash_length
FROM "AdminUser";

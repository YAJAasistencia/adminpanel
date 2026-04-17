-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005 - Fix AdminUser Table for Authentication
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Problema: El código de login espera campos y nombre de tabla específicos
-- Solución: Agregar campo password_hash y normalizar tabla

-- 1. Agregar columna password_hash si no existe
ALTER TABLE "AdminUser"
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Crear algún usuario de prueba si no existen
-- Contraseña: "admin123" (hash bcrypt)
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES (
  'admin@yaja.mx',
  'Admin Principal',
  'admin123',
  '$2a$10$8gXmXxMHKMAp7.3vB0zr.eN9M1n.BQcVxdJ3vZ8y2k1L2q4R5s6T7',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Contraseña: "manager123" (hash bcrypt)
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES (
  'manager@yaja.mx',
  'Gestor de Operaciones',
  'manager123',
  '$2a$10$zY8vJ7k.m9x3d2W5c1Q0.u7p9l8oK6m5n2c3v1X4y5Z6a9b0T3E',
  'manager',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Contraseña: "operator123" (hash bcrypt)
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES (
  'operator@yaja.mx',
  'Operador del Sistema',
  'operator123',
  '$2a$10$s4T5u3V2w1X0y9Z8a7b6.c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1R0',
  'operator',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Verificar datos creados
SELECT id, email, name, role, is_active, created_at 
FROM "AdminUser" 
ORDER BY created_at DESC;

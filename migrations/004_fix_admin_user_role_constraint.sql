-- ═══════════════════════════════════════════════════════════════════════════
-- YAJA Admin Panel - Migration 004
-- Fix AdminUser role constraint to include "Administrador"
-- Region: us-east-1 (N. Virginia)
-- Date: 2026-04-17
-- ═══════════════════════════════════════════════════════════════════════════

-- Remove the old constraint
ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_role_check";

-- Add new constraint with additional role values
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_role_check" 
  CHECK (role IN ('admin', 'manager', 'operator', 'viewer', 'Administrador', 'Gestor', 'Operador'));

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════════════════

-- Run this to verify the constraint was updated:
-- SELECT constraint_name, constraint_definition 
-- FROM information_schema.table_constraints t
-- WHERE t.table_name = 'AdminUser' AND constraint_type = 'CHECK';

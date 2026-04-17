-- Migration: Fix Company Table Defaults and Add Missing Fields
-- Description: Complete the Company table schema setup
-- Date: 2026-04-17

-- 1. Fix zone_prices default (should be empty JSONB array, not NULL)
ALTER TABLE "Company" 
ALTER COLUMN zone_prices SET DEFAULT '[]'::jsonb;

-- 2. Fix tax_pct default (should be 16.00 for Mexico, not 0)
ALTER TABLE "Company" 
ALTER COLUMN tax_pct SET DEFAULT 16.00;

-- 3. Add missing survey_title column (denormalized for performance)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_title TEXT DEFAULT NULL;

-- 4. Add missing parent_company_name column (denormalized for performance)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_name TEXT DEFAULT NULL;

-- Verification: Check all 11 fields are now correctly configured
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Company'
AND column_name IN (
  'zone_prices', 'folio_fields', 'folio_secundario_fields', 'sub_accounts',
  'tax_pct', 'billing_type', 'survey_id', 'survey_title', 'parent_company_id',
  'parent_company_name', 'sub_company_limit'
)
ORDER BY ordinal_position;

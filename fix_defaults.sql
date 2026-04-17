-- Fix defaults for zone_prices (should be empty JSONB array, not NULL)
ALTER TABLE "Company" ALTER COLUMN zone_prices SET DEFAULT '[]'::jsonb;

-- Fix tax_pct default (should be 16.00 for Mexico, not 0)
ALTER TABLE "Company" ALTER COLUMN tax_pct SET DEFAULT 16.00;

-- Add missing survey_title column
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_title TEXT DEFAULT NULL;

-- Add missing parent_company_name column  
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_name TEXT DEFAULT NULL;

-- Verify all fields are now correct
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Company'
AND column_name IN (
  'zone_prices', 'folio_fields', 'folio_secundario_fields', 'sub_accounts',
  'tax_pct', 'billing_type', 'survey_id', 'survey_title', 'parent_company_id',
  'parent_company_name', 'sub_company_limit'
)
ORDER BY ordinal_position;

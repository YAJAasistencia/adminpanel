-- Migration: Add Advanced Company Features
-- Description: Add JSONB and configuration fields to support:
--   - Zone-based pricing (geocercas)
--   - Custom folio fields (for corporate billing)
--   - Sub-accounts management
--   - IVA/Tax configuration
--   - Billing type selection
--   - Survey integration
--   - Sub-company hierarchy

-- 1. Add zone pricing configuration (JSONB)
-- Structure: [{zone_id, zone_name, service_prices: [{service_type_id, service_type_name, price}]}]
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS zone_prices JSONB DEFAULT '[]';

-- 2. Add custom folio fields for billing
-- Structure: [{key, label, required}]
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS folio_fields JSONB DEFAULT '[]';

-- 3. Add secondary folio fields (for multi-level billing)
-- Structure: [{key, label, required}]
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS folio_secundario_fields JSONB DEFAULT '[]';

-- 4. Add sub-accounts (departments, employees within company)
-- Structure: [{id, name, limit_per_service}]
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS sub_accounts JSONB DEFAULT '[]';

-- 5. Add IVA/Tax percentage for invoicing
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS tax_pct NUMERIC(5,2) DEFAULT 16.00;

-- 6. Add billing type selection (general or geocercas-based)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'general' CHECK (billing_type IN ('general', 'geocercas'));

-- 7. Add survey integration (linked survey for company)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL;

-- 8. Add survey title for quick reference
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS survey_title TEXT DEFAULT NULL;

-- 9. Add sub-company hierarchy support
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES "Company"(id) ON DELETE SET NULL;

-- 10. Add parent company name for quick reference (denormalized)
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS parent_company_name TEXT DEFAULT NULL;

-- 11. Add credit limit for sub-accounts
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS sub_company_limit NUMERIC(15,2) DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_survey_id ON "Company"(survey_id);
CREATE INDEX IF NOT EXISTS idx_company_parent_id ON "Company"(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_company_is_active ON "Company"(is_active);
CREATE INDEX IF NOT EXISTS idx_company_billing_type ON "Company"(billing_type);

-- Add comment documentation
COMMENT ON COLUMN "Company".zone_prices IS 'JSONB array of zone pricing configurations for geocercas billing model';
COMMENT ON COLUMN "Company".folio_fields IS 'JSONB array of custom folio field definitions for corporate billing';
COMMENT ON COLUMN "Company".sub_accounts IS 'JSONB array of sub-accounts (departments/employees) with their own limits';
COMMENT ON COLUMN "Company".tax_pct IS 'IVA/Tax percentage for invoicing (default 16% for Mexico)';
COMMENT ON COLUMN "Company".billing_type IS 'Billing model: general (flat rate) or geocercas (zone-based pricing)';
COMMENT ON COLUMN "Company".survey_id IS 'Associated survey for ride service quality assessment';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Company'
AND column_name IN (
  'zone_prices', 'folio_fields', 'folio_secundario_fields', 'sub_accounts',
  'tax_pct', 'billing_type', 'survey_id', 'parent_company_id', 'sub_company_limit'
)
ORDER BY ordinal_position;

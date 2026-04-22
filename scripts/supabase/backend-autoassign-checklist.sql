-- Backend auto-assign checklist (manual execution in Supabase SQL Editor)
-- 1) Ensure required settings columns exist (already executed if you ran previous script)
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS auto_primary_radius_km numeric DEFAULT 5;

ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS auto_secondary_radius_km numeric DEFAULT 8;

ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS total_search_window_seconds integer DEFAULT 180;

UPDATE public.app_settings
SET
  auto_primary_radius_km = COALESCE(auto_primary_radius_km, auction_primary_radius_km, 5),
  auto_secondary_radius_km = COALESCE(auto_secondary_radius_km, auction_secondary_radius_km, 8),
  total_search_window_seconds = COALESCE(total_search_window_seconds, 180);

-- 2) Optional safety constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_settings_total_search_window_seconds_check'
  ) THEN
    ALTER TABLE public.app_settings
    ADD CONSTRAINT app_settings_total_search_window_seconds_check
    CHECK (total_search_window_seconds IS NULL OR total_search_window_seconds >= 30);
  END IF;
END $$;

-- 3) IMPORTANT:
-- Deploy your backend assignment worker (Edge Function or server worker).
-- When backend worker is active and stable, set this env var in frontend deployment:
-- NEXT_PUBLIC_BACKEND_AUTO_ASSIGN_ENABLED=true
-- This disables the panel-driven assignment hook and avoids duplicate assignment engines.

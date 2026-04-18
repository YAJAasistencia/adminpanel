-- Migration: Create AppSettings Table with Comprehensive Schema
-- Date: 2026-04-18
-- Purpose: Define complete AppSettings structure required by admin panel code

-- Drop existing if necessary (WARNING: This deletes data)
-- DROP TABLE IF EXISTS "AppSettings" CASCADE;

-- Create AppSettings table with all required fields
CREATE TABLE IF NOT EXISTS "AppSettings" (
  -- Primary Key & Timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- User Info (who created/updated)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ============================================================================
  -- INFORMACIÓN GENERAL / BRANDING
  -- ============================================================================
  company_name TEXT,
  primary_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#FF9500',
  secondary_color TEXT DEFAULT '#6B7280',
  currency TEXT DEFAULT 'MXN',
  currency_symbol TEXT DEFAULT '$',
  timezone TEXT DEFAULT 'America/Mexico_City',
  contact_phone TEXT,
  contact_email TEXT,
  logo_url TEXT,
  welcome_message TEXT,
  driver_app_instructions TEXT,

  -- ============================================================================
  -- TARIFAS / PRICING
  -- ============================================================================
  base_fare DECIMAL(10, 2) DEFAULT 0,
  price_per_km DECIMAL(10, 2) DEFAULT 0,
  price_per_minute DECIMAL(10, 2) DEFAULT 0,
  price_per_hour DECIMAL(10, 2) DEFAULT 0,
  platform_commission_pct DECIMAL(5, 2) DEFAULT 25,
  minimum_ride_amount DECIMAL(10, 2) DEFAULT 50,

  -- ============================================================================
  -- CONFIGURACIÓN DE FUNCIONES
  -- ============================================================================
  require_admin_approval_to_start BOOLEAN DEFAULT FALSE,
  auto_assign_nearest_driver BOOLEAN DEFAULT FALSE,
  destination_required BOOLEAN DEFAULT TRUE,
  allow_driver_cancel BOOLEAN DEFAULT TRUE,
  allow_passenger_cancel BOOLEAN DEFAULT TRUE,

  -- ============================================================================
  -- MAPAS & GEOLOCALIZACIÓN
  -- ============================================================================
  maps_provider TEXT DEFAULT 'leaflet',
  google_maps_api_key TEXT,
  city_traffic_factor DECIMAL(3, 2) DEFAULT 1.0,

  -- ============================================================================
  -- MODO SUBASTA
  -- ============================================================================
  auction_mode_enabled BOOLEAN DEFAULT TRUE,
  auction_primary_radius_km DECIMAL(7, 2) DEFAULT 5,
  auction_secondary_radius_km DECIMAL(7, 2) DEFAULT 15,
  auction_timeout_seconds INTEGER DEFAULT 30,
  auction_max_drivers INTEGER DEFAULT 10,
  auction_max_retries INTEGER DEFAULT 3,
  max_concurrent_rides INTEGER DEFAULT 5,

  -- ============================================================================
  -- ETA & TIEMPOS
  -- ============================================================================
  eta_speed_kmh INTEGER DEFAULT 40,
  eta_update_interval_seconds INTEGER DEFAULT 5,
  driver_location_update_interval_seconds INTEGER DEFAULT 5,
  eta_modal_duration_seconds INTEGER DEFAULT 5,
  service_flow_update_minutes INTEGER DEFAULT 5,

  -- ============================================================================
  -- JORNADA LABORAL / WORK HOURS
  -- ============================================================================
  work_max_hours INTEGER DEFAULT 12,
  work_break_interval_minutes INTEGER DEFAULT 180,
  work_break_duration_minutes INTEGER DEFAULT 30,
  work_long_break_duration_minutes INTEGER DEFAULT 60,
  work_rest_trigger_minutes INTEGER DEFAULT 0,
  work_rest_ratio DECIMAL(3, 2) DEFAULT 1.0,
  work_long_rest_minutes INTEGER DEFAULT 480,

  -- ============================================================================
  -- TIPOS DE VEHÍCULOS ACEPTADOS
  -- ============================================================================
  accept_cars BOOLEAN DEFAULT TRUE,
  accept_motos BOOLEAN DEFAULT FALSE,

  -- ============================================================================
  -- OPERACIONES & CONTROL
  -- ============================================================================
  driver_inactivity_timeout_minutes INTEGER DEFAULT 30,
  rating_window_minutes INTEGER DEFAULT 1440,
  payment_timeout_hours INTEGER DEFAULT 24,
  search_phase_seconds INTEGER DEFAULT 30,
  cutoff_interval_days INTEGER DEFAULT 1,

  -- ============================================================================
  -- CONTROL DE RECHAZOS
  -- ============================================================================
  rejection_rate_warning_threshold DECIMAL(3, 2) DEFAULT 0.3,
  rejection_count_threshold INTEGER DEFAULT 5,
  soft_block_low_acceptance_rate_enabled BOOLEAN DEFAULT TRUE,
  low_acceptance_rate_threshold DECIMAL(3, 2) DEFAULT 0.6,
  low_acceptance_rate_offer_reduction_pct DECIMAL(5, 2) DEFAULT 10,

  -- ============================================================================
  -- SOPORTE & WALLET
  -- ============================================================================
  support_whatsapp_number TEXT,
  support_whatsapp_message TEXT DEFAULT 'Hola, necesito ayuda con mi cuenta.',
  wallet_min_balance DECIMAL(10, 2) DEFAULT 0,

  -- ============================================================================
  -- NOTIFICACIONES & AUDIO
  -- ============================================================================
  notification_sound_type TEXT DEFAULT 'bell',
  notification_volume INTEGER DEFAULT 100,
  notification_interval_seconds INTEGER DEFAULT 1,

  -- ============================================================================
  -- SEGURIDAD & PRIVACIDAD
  -- ============================================================================
  require_email_verification BOOLEAN DEFAULT FALSE,
  show_passenger_phone_to_driver BOOLEAN DEFAULT TRUE,
  show_driver_photo_to_passenger BOOLEAN DEFAULT TRUE,

  -- ============================================================================
  -- PAGOS & MÉTODOS
  -- ============================================================================
  payment_gateway TEXT DEFAULT 'stripe',
  payment_methods JSONB DEFAULT '[]', -- Array de métodos de pago disponibles

  -- ============================================================================
  -- DOCUMENTOS REQUERIDOS
  -- ============================================================================
  driver_vehicle_docs JSONB DEFAULT '[]', -- Docs requeridos para vehículos
  driver_required_docs JSONB DEFAULT '[]', -- Docs requeridos para conductores

  -- ============================================================================
  -- FEATURES TOGGLES
  -- ============================================================================
  features_enabled JSONB DEFAULT '{
    "scheduling": true,
    "promotions": true,
    "driver_earnings_panel": true,
    "proof_photo": true,
    "geo_assignment": true,
    "show_app_install_section": true
  }',

  -- ============================================================================
  -- CONFIGURACIONES DINÁMICAS (JSON)
  -- ============================================================================
  nav_config JSONB DEFAULT '[]', -- Configuración de navegación
  landing_config JSONB DEFAULT '{}', -- Configuración landing
  pending_payment_methods JSONB DEFAULT '[]', -- Métodos pendientes de validar

  -- ============================================================================
  -- AUDITORÍA & METADATOS
  -- ============================================================================
  version INTEGER DEFAULT 1,
  notes TEXT,

  CONSTRAINT "check_commission_valid" CHECK (platform_commission_pct >= 0 AND platform_commission_pct <= 100),
  CONSTRAINT "check_city_traffic_valid" CHECK (city_traffic_factor >= 0.5 AND city_traffic_factor <= 2),
  CONSTRAINT "check_eta_speed_valid" CHECK (eta_speed_kmh >= 5 AND eta_speed_kmh <= 120),
  CONSTRAINT "check_low_acceptance_threshold" CHECK (low_acceptance_rate_threshold >= 0 AND low_acceptance_rate_threshold <= 1),
  CONSTRAINT "check_rejection_threshold" CHECK (rejection_rate_warning_threshold >= 0 AND rejection_rate_warning_threshold <= 1)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for updated_at for real-time queries
CREATE INDEX IF NOT EXISTS "idx_appsettings_updated_at" ON "AppSettings"(updated_at DESC);

-- Index for created_at for historical queries
CREATE INDEX IF NOT EXISTS "idx_appsettings_created_at" ON "AppSettings"(created_at DESC);

-- Index for updated_by for auditing
CREATE INDEX IF NOT EXISTS "idx_appsettings_updated_by" ON "AppSettings"(updated_by);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appsettings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_appsettings_timestamp_trigger ON "AppSettings";

CREATE TRIGGER update_appsettings_timestamp_trigger
BEFORE UPDATE ON "AppSettings"
FOR EACH ROW
EXECUTE FUNCTION update_appsettings_timestamp();

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) - ADD IF NEEDED
-- ============================================================================

-- Uncomment and modify based on your auth requirements:
-- ALTER TABLE "AppSettings" ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "AppSettings readable by authenticated users" 
--   ON "AppSettings" FOR SELECT 
--   USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "AppSettings writable by admin users" 
--   ON "AppSettings" FOR UPDATE 
--   USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- FIX: Ensure RideRequest has correct columns with defaults
-- ============================================================================

-- Add missing columns if they don't exist (safe operations)
ALTER TABLE "RideRequest"
  ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_earnings DECIMAL(10, 2) DEFAULT 0;

-- Add CHECK constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'RideRequest' AND constraint_name = 'check_prices_non_negative'
  ) THEN
    ALTER TABLE "RideRequest"
    ADD CONSTRAINT "check_prices_non_negative" CHECK (
      final_price >= 0 AND 
      cancellation_fee >= 0 AND 
      driver_earnings >= 0
    );
  END IF;
END $$;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
/*
CAMBIOS REALIZADOS:

1. CREACIÓN DE TABLA AppSettings
   - 80+ campos para almacenar configuración global de la plataforma
   - Tipos de datos apropiados (DECIMAL para dinero, JSONB para estructuras)
   - Constraints para validar rangos de valores
   - Timestamps automáticos (created_at, updated_at)

2. AUDITORÍA
   - Campos created_by y updated_by para rastrear cambios
   - Índices para queries frecuentes
   - Trigger para auto-actualizar updated_at

3. SEGURIDAD
   - CHECK constraints en campos críticos
   - Validaciones de rango (comisión 0-100%, velocidad ETA, etc.)
   - Estructura preparada para RLS (Row Level Security)

4. CAMPOS JSON FLEXIBLES
   - payment_methods: Array de métodos dinámicamente configurables
   - driver_vehicle_docs: Documentos requeridos por vehículo
   - driver_required_docs: Documentos generales requeridos
   - nav_config: Configuración de navegación dinámica
   - landing_config: Configuración de página landing
   - features_enabled: Toggles de features

5. FIX: RideRequest
   - Se añaden columnas faltantes a tabla RideRequest
   - Define valores por defecto
   - Añade constraints de validación

PRÓXIMOS PASOS DESPUÉS DE MIGRACIÓN:

1. Regenerar database.types.ts desde Supabase:
   npx supabase gen types typescript > lib/database.types.ts

2. Verificar que AppSettings tenga al menos 1 registro:
   INSERT INTO "AppSettings" (company_name) 
   VALUES ('YAJAasistencia') 
   ON CONFLICT DO NOTHING;

3. Probar en UI:
   - Settings page debe cargar todas las configuraciones
   - Guardar cambios debe persistir en BD
   - Images deben subirse y guardarse URLs
*/

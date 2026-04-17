-- ═══════════════════════════════════════════════════════════════════════════
-- YAJA Admin Panel - Database Schema
-- Region: us-east-1 (N. Virginia)
-- Created: 2026-04-17
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CITY
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "City" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'Mexico',
  state TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SERVICE TYPE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "ServiceType" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Servicios',
  description TEXT,
  base_price NUMERIC(10, 2) DEFAULT 0,
  per_km_price NUMERIC(8, 2) DEFAULT 0,
  per_minute_price NUMERIC(8, 4) DEFAULT 0,
  minimum_price NUMERIC(10, 2) DEFAULT 0,
  commission_rate NUMERIC(5, 2) DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  requires_proof_photo BOOLEAN DEFAULT false,
  requires_admin_approval BOOLEAN DEFAULT false,
  icon_name TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. GEO ZONE (Geocercas)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "GeoZone" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  center_lat NUMERIC(10, 6) NOT NULL,
  center_lng NUMERIC(10, 6) NOT NULL,
  radius_km NUMERIC(10, 3) NOT NULL DEFAULT 5,
  city_id UUID REFERENCES "City"(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RED ZONE (Zonas Prohibidas)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "RedZone" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  center_lat NUMERIC(10, 6) NOT NULL,
  center_lng NUMERIC(10, 6) NOT NULL,
  radius_km NUMERIC(10, 3) NOT NULL DEFAULT 1,
  city_id UUID REFERENCES "City"(id) ON DELETE SET NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. SURVEYS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "surveys" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. COMPANY (Empresas Corporativas)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Company" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  rfc TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  city_id UUID REFERENCES "City"(id) ON DELETE SET NULL,
  invoice_email TEXT,
  estimated_monthly_rides INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Advanced fields (from migration 001)
  zone_prices JSONB DEFAULT '[]',
  folio_fields JSONB DEFAULT '[]',
  folio_secundario_fields JSONB DEFAULT '[]',
  sub_accounts JSONB DEFAULT '[]',
  tax_pct NUMERIC(5, 2) DEFAULT 16.00,
  billing_type TEXT DEFAULT 'general' CHECK (billing_type IN ('general', 'geocercas')),
  survey_id UUID REFERENCES "surveys"(id) ON DELETE SET NULL,
  survey_title TEXT DEFAULT NULL,
  parent_company_id UUID REFERENCES "Company"(id) ON DELETE SET NULL,
  parent_company_name TEXT DEFAULT NULL,
  sub_company_limit NUMERIC(15, 2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_company_survey_id ON "Company"(survey_id);
CREATE INDEX IF NOT EXISTS idx_company_parent_id ON "Company"(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_company_is_active ON "Company"(is_active);
CREATE INDEX IF NOT EXISTS idx_company_billing_type ON "Company"(billing_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. DRIVER
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Driver" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  password TEXT,
  city_id UUID REFERENCES "City"(id) ON DELETE SET NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  rating NUMERIC(3, 2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  total_earnings NUMERIC(15, 2) DEFAULT 0,
  photo_url TEXT,
  vehicles JSONB DEFAULT '[]',
  commission_rate NUMERIC(5, 2) DEFAULT 25,
  doc_expiries JSONB DEFAULT '{}',
  suspended_until TIMESTAMP,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  admin_notes TEXT,
  access_code TEXT,
  online_since TIMESTAMP,
  accumulated_work_minutes INTEGER DEFAULT 0,
  rest_required_until TIMESTAMP,
  last_disconnect_reason TEXT,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  license_plate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_city_id ON "Driver"(city_id);
CREATE INDEX IF NOT EXISTS idx_driver_approval_status ON "Driver"(approval_status);
CREATE INDEX IF NOT EXISTS idx_driver_is_active ON "Driver"(is_active);
CREATE INDEX IF NOT EXISTS idx_driver_phone ON "Driver"(phone);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RIDE REQUEST
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "RideRequest" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id TEXT UNIQUE,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  passenger_user_id UUID,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT,
  pickup_lat NUMERIC(10, 6),
  pickup_lon NUMERIC(10, 6),
  dropoff_lat NUMERIC(10, 6),
  dropoff_lon NUMERIC(10, 6),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'auction', 'assigned', 'admin_approved', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_drivers')),
  assignment_mode TEXT DEFAULT 'auto' CHECK (assignment_mode IN ('auto', 'manual', 'auction')),
  auction_expires_at TIMESTAMP,
  driver_id UUID REFERENCES "Driver"(id) ON DELETE SET NULL,
  driver_name TEXT,
  city_id UUID REFERENCES "City"(id) ON DELETE SET NULL,
  city_name TEXT,
  service_type_id UUID REFERENCES "ServiceType"(id) ON DELETE SET NULL,
  service_type_name TEXT,
  company_id UUID REFERENCES "Company"(id) ON DELETE SET NULL,
  company_name TEXT,
  ride_type TEXT DEFAULT 'normal' CHECK (ride_type IN ('normal', 'corporativo')),
  geo_zone_id UUID REFERENCES "GeoZone"(id) ON DELETE SET NULL,
  geo_zone_name TEXT,
  estimated_price NUMERIC(10, 2),
  final_price NUMERIC(10, 2),
  company_price NUMERIC(10, 2),
  driver_earnings NUMERIC(10, 2),
  driver_earnings_base NUMERIC(10, 2),
  payment_method TEXT,
  paid_by TEXT,
  commission_rate NUMERIC(5, 2),
  distance_km NUMERIC(10, 2),
  duration_minutes INTEGER,
  rating NUMERIC(3, 2),
  admin_rating NUMERIC(3, 2),
  notes TEXT,
  proof_photo_url TEXT,
  proof_photo_required BOOLEAN DEFAULT false,
  require_admin_approval BOOLEAN DEFAULT false,
  show_phone_to_driver BOOLEAN DEFAULT true,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_time TIMESTAMP,
  is_gasoline BOOLEAN DEFAULT false,
  gasoline_liters NUMERIC(10, 2),
  is_red_zone_blocked BOOLEAN DEFAULT false,
  questionnaire_answers JSONB DEFAULT '[]',
  folio_data JSONB,
  created_by TEXT,
  requested_at TIMESTAMP,
  created_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ride_status ON "RideRequest"(status);
CREATE INDEX IF NOT EXISTS idx_ride_driver_id ON "RideRequest"(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_company_id ON "RideRequest"(company_id);
CREATE INDEX IF NOT EXISTS idx_ride_service_type_id ON "RideRequest"(service_type_id);
CREATE INDEX IF NOT EXISTS idx_ride_city_id ON "RideRequest"(city_id);
CREATE INDEX IF NOT EXISTS idx_ride_created_at ON "RideRequest"(created_at);
CREATE INDEX IF NOT EXISTS idx_ride_service_id ON "RideRequest"(service_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. INVOICE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Invoice" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  company_name TEXT,
  ride_ids UUID[] DEFAULT '{}',
  service_ids TEXT[] DEFAULT '{}',
  period_from TIMESTAMP,
  period_to TIMESTAMP,
  ride_count INTEGER DEFAULT 0,
  subtotal NUMERIC(15, 2) DEFAULT 0,
  tax_pct NUMERIC(5, 2) DEFAULT 16,
  tax_amount NUMERIC(15, 2) DEFAULT 0,
  total NUMERIC(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_company_id ON "Invoice"(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON "Invoice"(status);
CREATE INDEX IF NOT EXISTS idx_invoice_invoice_number ON "Invoice"(invoice_number);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ADMIN USER
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "AdminUser" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  name TEXT,
  role TEXT DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON "AdminUser"(email);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON "AdminUser"(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. BONUS RULE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "BonusRule" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT DEFAULT 'rides_count' CHECK (rule_type IN ('rides_count', 'earnings', 'rating', 'custom')),
  triggers JSONB DEFAULT '{}',
  reward JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. BONUS LOG
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "BonusLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES "Driver"(id) ON DELETE CASCADE,
  bonus_rule_id UUID REFERENCES "BonusRule"(id) ON DELETE SET NULL,
  bonus_type TEXT,
  amount NUMERIC(10, 2),
  reason TEXT,
  ride_id UUID REFERENCES "RideRequest"(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bonus_driver_id ON "BonusLog"(driver_id);
CREATE INDEX IF NOT EXISTS idx_bonus_status ON "BonusLog"(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. SOS ALERT
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "SosAlert" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES "RideRequest"(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES "Driver"(id) ON DELETE SET NULL,
  passenger_name TEXT,
  location_lat NUMERIC(10, 6),
  location_lng NUMERIC(10, 6),
  alert_type TEXT DEFAULT 'emergency' CHECK (alert_type IN ('emergency', 'accident', 'medical', 'security', 'other')),
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  responder_id UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sos_driver_id ON "SosAlert"(driver_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON "SosAlert"(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. SUPPORT TICKET
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT NOT NULL UNIQUE,
  driver_id UUID REFERENCES "Driver"(id) ON DELETE SET NULL,
  ride_id UUID REFERENCES "RideRequest"(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('payment', 'ride', 'safety', 'account', 'technical', 'general')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to UUID REFERENCES "AdminUser"(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]',
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_driver_id ON "SupportTicket"(driver_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON "SupportTicket"(status);
CREATE INDEX IF NOT EXISTS idx_ticket_ticket_number ON "SupportTicket"(ticket_number);

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. SURVEY RESPONSE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "SurveyResponse" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES "surveys"(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES "RideRequest"(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES "Driver"(id) ON DELETE SET NULL,
  company_id UUID REFERENCES "Company"(id) ON DELETE SET NULL,
  answers JSONB DEFAULT '[]',
  rating INTEGER,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survey_response_survey_id ON "SurveyResponse"(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_response_ride_id ON "SurveyResponse"(ride_id);
CREATE INDEX IF NOT EXISTS idx_survey_response_driver_id ON "SurveyResponse"(driver_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 16. DRIVER NOTIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "DriverNotification" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES "Driver"(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES "RideRequest"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  notification_type TEXT DEFAULT 'ride' CHECK (notification_type IN ('ride', 'bonus', 'alert', 'message', 'system')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_driver_id ON "DriverNotification"(driver_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON "DriverNotification"(is_read);

-- ═══════════════════════════════════════════════════════════════════════════
-- 17. APP SETTINGS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "AppSettings" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 18. CHAT MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "chat_messages" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES "RideRequest"(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('driver', 'passenger', 'admin')),
  sender_id TEXT,
  sender_name TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
  media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_ride_id ON "chat_messages"(ride_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON "chat_messages"(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- 19. CANCELLATION POLICIES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "cancellation_policies" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cancellation_fee NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Enable RLS (Row Level Security) on all tables
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "City" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GeoZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RedZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "surveys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BonusRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BonusLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SosAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SurveyResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DriverNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cancellation_policies" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE BASIC RLS POLICIES - Allow authenticated users
-- ═══════════════════════════════════════════════════════════════════════════

-- CITY
CREATE POLICY "Enable read for authenticated users" ON "City" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "City" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "City" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- ServiceType
CREATE POLICY "Enable read for authenticated users" ON "ServiceType" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "ServiceType" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "ServiceType" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- GeoZone
CREATE POLICY "Enable read for authenticated users" ON "GeoZone" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "GeoZone" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "GeoZone" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- RedZone
CREATE POLICY "Enable read for authenticated users" ON "RedZone" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "RedZone" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "RedZone" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Surveys
CREATE POLICY "Enable read for authenticated users" ON "surveys" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "surveys" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "surveys" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Company
CREATE POLICY "Enable read for authenticated users" ON "Company" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "Company" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "Company" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Driver
CREATE POLICY "Enable read for authenticated users" ON "Driver" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "Driver" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "Driver" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- RideRequest
CREATE POLICY "Enable read for authenticated users" ON "RideRequest" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "RideRequest" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "RideRequest" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Invoice
CREATE POLICY "Enable read for authenticated users" ON "Invoice" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "Invoice" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "Invoice" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- AdminUser
CREATE POLICY "Enable read for authenticated users" ON "AdminUser" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "AdminUser" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "AdminUser" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- BonusRule
CREATE POLICY "Enable read for authenticated users" ON "BonusRule" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "BonusRule" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "BonusRule" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- BonusLog
CREATE POLICY "Enable read for authenticated users" ON "BonusLog" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "BonusLog" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "BonusLog" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- SosAlert
CREATE POLICY "Enable read for authenticated users" ON "SosAlert" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "SosAlert" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "SosAlert" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- SupportTicket
CREATE POLICY "Enable read for authenticated users" ON "SupportTicket" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "SupportTicket" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "SupportTicket" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- SurveyResponse
CREATE POLICY "Enable read for authenticated users" ON "SurveyResponse" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "SurveyResponse" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "SurveyResponse" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- DriverNotification
CREATE POLICY "Enable read for authenticated users" ON "DriverNotification" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "DriverNotification" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "DriverNotification" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- AppSettings
CREATE POLICY "Enable read for authenticated users" ON "AppSettings" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "AppSettings" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "AppSettings" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- ChatMessages
CREATE POLICY "Enable read for authenticated users" ON "chat_messages" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "chat_messages" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "chat_messages" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- CancellationPolicies
CREATE POLICY "Enable read for authenticated users" ON "cancellation_policies" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "cancellation_policies" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "cancellation_policies" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification Queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Run these to verify all tables were created:
-- SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

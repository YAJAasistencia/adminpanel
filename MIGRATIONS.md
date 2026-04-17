# 📊 Database Schema - YAJA Admin Panel

## Overview

Complete PostgreSQL schema for the YAJA Ride-Sharing Admin Panel with 19 tables covering all operational requirements.

**Region**: us-east-1 (N. Virginia)  
**Database Type**: PostgreSQL (Supabase)  
**Features**: PostGIS, Row Level Security (RLS), UUID Primary Keys

---

## 📋 Migration Files

### Current Migrations

| File | Description | Status |
|------|-------------|--------|
| `migrations/001_initial_schema.sql` | Initial schema setup | ✅ Applied |
| `migrations/002_company_migrations.sql` | Company advanced features | ✅ Applied |
| `migrations/003_create_all_tables_us_east.sql` | Complete table schema | ⏳ Ready to Apply |

### How to Apply Migrations

#### Option 1: Using Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**
   - Go to: https://supabase.com/dashboard/project/_YOUR_PROJECT_ID_/sql

2. **Copy and Execute Migration**
   ```sql
   -- Open migrations/003_create_all_tables_us_east.sql
   -- Copy the entire contents
   -- Paste into the SQL Editor
   -- Click "Run"
   ```

3. **Verify Tables**
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
   ```

#### Option 2: Using Database Connection

```bash
# Using psql
psql -h your-db-host -U your-db-user -d adminpanel \
  -f migrations/003_create_all_tables_us_east.sql

# Using Supabase CLI
supabase db push
```

#### Option 3: Interactive Setup Script

```bash
chmod +x scripts/init-db.sh
./scripts/init-db.sh --full
```

---

## 📁 Tables

### 1. **Location Management**

#### City
```sql
-- Central locations where services operate
-- Fields: name, country, state, coordinates, status
SELECT * FROM "City";
```

#### GeoZone
```sql
-- Geographic boundaries for pricing and operations
-- Fields: name, center coordinates, radius_km, city_id
SELECT * FROM "GeoZone";
```

#### RedZone
```sql
-- Prohibited service areas
-- Fields: name, reason, coordinates, is_active
SELECT * FROM "RedZone";
```

---

### 2. **Service Configuration**

#### ServiceType
```sql
-- Types of services (economy, premium, etc.)
-- Fields: name, pricing, commission rates, requirements
SELECT * FROM "ServiceType";
```

#### Company
```sql
-- Corporate clients with advanced features
-- Features:
--   - Zone-based pricing (geocercas)
--   - Folio field customization
--   - Sub-account management
--   - Hierarchical relationships
--   - Survey integration
SELECT * FROM "Company";
```

---

### 3. **User Management**

#### Driver
```sql
-- Vehicle operators
-- Features:
--   - Vehicle information
--   - Approval workflow (pending/approved/rejected)
--   - Document expiry tracking
--   - Suspension capability
--   - Online status and work hour tracking
--   - Commission configuration
SELECT * FROM "Driver" WHERE approval_status = 'approved';
```

#### AdminUser
```sql
-- Admin dashboard users with role-based permissions
-- Roles: admin, manager, operator, viewer
SELECT * FROM "AdminUser" WHERE is_active = true;
```

---

### 4. **Core Operations**

#### RideRequest
```sql
-- Complete ride lifecycle tracking
-- Features:
--   - Full address and GPS tracking
--   - Corporate vs. normal ride types
--   - Proof photo requirements
--   - Admin approval workflows
--   - Payment and commission tracking
--   - Questionnaire integration
--   - Folio data for corporate billing
SELECT * FROM "RideRequest" WHERE status = 'completed';

-- Find rides by company
SELECT * FROM "RideRequest" 
WHERE company_id = 'YOUR_COMPANY_ID' 
ORDER BY created_at DESC;

-- Calculate earnings
SELECT 
  driver_id,
  SUM(driver_earnings) as total_earnings,
  COUNT(*) as total_rides
FROM "RideRequest"
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY driver_id;
```

#### Invoice
```sql
-- Company billing and invoicing
-- Fields: invoice_number, period, rides_included, amounts, status
SELECT * FROM "Invoice" WHERE status = 'draft';
```

---

### 5. **Driver Performance**

#### BonusRule
```sql
-- Define bonus structures and triggers
-- Types: rides_count, earnings, rating, custom
SELECT * FROM "BonusRule" WHERE is_active = true;
```

#### BonusLog
```sql
-- Track driver bonuses and approvals
-- Status: pending, approved, paid, rejected
SELECT * FROM "BonusLog" 
ORDER BY created_at DESC LIMIT 10;
```

---

### 6. **Safety & Support**

#### SosAlert
```sql
-- Emergency SOS alerts from drivers/passengers
-- Types: emergency, accident, medical, security, other
SELECT * FROM "SosAlert" WHERE status = 'active';
```

#### SupportTicket
```sql
-- Customer support tickets with message history
-- Categories: payment, ride, safety, account, technical
-- Priorities: low, normal, high, urgent
SELECT * FROM "SupportTicket" 
WHERE status = 'open' 
ORDER BY priority DESC;
```

#### DriverNotification
```sql
-- Real-time notifications to drivers
-- Types: ride, bonus, alert, message, system
SELECT * FROM "DriverNotification"
WHERE driver_id = 'YOUR_DRIVER_ID'
AND is_read = false;
```

---

### 7. **Communications**

#### chat_messages
```sql
-- Real-time chat between drivers, passengers, admin
-- Types: text, image, location
SELECT * FROM "chat_messages"
WHERE ride_id = 'YOUR_RIDE_ID'
ORDER BY created_at ASC;
```

---

### 8. **Feedback & Configuration**

#### surveys
```sql
-- Survey templates for customers/drivers
-- Fields: title, description, questions (JSONB)
SELECT * FROM "surveys" WHERE is_active = true;
```

#### SurveyResponse
```sql
-- Recorded survey responses
SELECT * FROM "SurveyResponse"
WHERE survey_id = 'YOUR_SURVEY_ID';
```

#### AppSettings
```sql
-- Global application configuration
SELECT setting_key, setting_value 
FROM "AppSettings" 
ORDER BY setting_key;
```

#### cancellation_policies
```sql
-- Cancellation fee rules and policies
SELECT * FROM "cancellation_policies" WHERE is_active = true;
```

---

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies allowing authenticated users:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies
SELECT tablename, COUNT(*) as policies 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename 
ORDER BY tablename;
```

### Default Policies

Each table includes CRUD policies for authenticated users:
- ✅ SELECT (Read)
- ✅ INSERT (Create)
- ✅ UPDATE (Edit)
- ✅ DELETE (Remove)

---

## 📊 Key Indexes

For optimal performance, indexes are created on:

- **City**: `name` (unique)
- **Company**: `survey_id`, `parent_id`, `is_active`, `billing_type`
- **Driver**: `city_id`, `approval_status`, `is_active`, `phone` (unique)
- **RideRequest**: `status`, `driver_id`, `company_id`, `service_type_id`, `city_id`, `created_at`, `service_id` (unique)
- **Invoice**: `company_id`, `status`, `invoice_number` (unique)
- **BonusLog**: `driver_id`, `status`
- **SosAlert**: `driver_id`, `status`
- **SupportTicket**: `driver_id`, `status`, `ticket_number` (unique)
- **SurveyResponse**: `survey_id`, `ride_id`, `driver_id`
- **DriverNotification**: `driver_id`, `is_read`
- **chat_messages**: `ride_id`, `created_at`

---

## 🧪 Testing & Verification

### Verify Tables Created

```sql
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected: 19 tables
```

### Verify Extensions

```sql
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'postgis');
```

### Test Data Insertion

```sql
-- Insert test city
INSERT INTO "City" (name, country, state)
VALUES ('Mexico City', 'Mexico', 'CDMX')
RETURNING *;

-- Insert test company
INSERT INTO "Company" (razon_social, billing_type)
VALUES ('Test Company', 'general')
RETURNING *;
```

---

## 📋 Quick Reference

### Common Queries

**Get all active drivers**
```sql
SELECT * FROM "Driver" 
WHERE is_active = true AND approval_status = 'approved';
```

**Get today's revenue**
```sql
SELECT SUM(final_price) as total_revenue
FROM "RideRequest"
WHERE DATE(created_at) = CURRENT_DATE
AND status = 'completed';
```

**Get driver earnings summary**
```sql
SELECT 
  d.name,
  COUNT(r.id) as rides,
  SUM(r.driver_earnings) as earnings,
  AVG(r.rating) as avg_rating
FROM "Driver" d
LEFT JOIN "RideRequest" r ON d.id = r.driver_id
GROUP BY d.id
ORDER BY earnings DESC;
```

**Active support tickets**
```sql
SELECT * FROM "SupportTicket"
WHERE status IN ('open', 'in_progress')
ORDER BY priority DESC, created_at ASC;
```

---

## 🚀 Environment Setup

1. **Copy environment file**
   ```bash
   cp .env.example .env.local
   ```

2. **Update Supabase credentials**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Apply migrations** (see section above)

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

---

## 📝 Notes

- All timestamps are in UTC
- All tables use UUID primary keys with `uuid_generate_v4()`
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- JSONB columns allow flexible data storage (vehicles, settings, etc.)
- PostGIS enables geospatial queries for location features

---

## ❓ Troubleshooting

### RLS Access Denied
If you get "permission denied" errors after creating tables:
1. Run `diagnostics/fix-rls-global.sql`
2. Add appropriate RLS policies for your users

### Missing Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### Foreign Key Constraint Errors
Ensure parent records exist before inserting child records. Use `ON DELETE CASCADE` carefully.

---

**Last Updated**: April 17, 2026  
**Region**: us-east-1 (N. Virginia)  
**Maintenance**: Review and update annually or as requirements change

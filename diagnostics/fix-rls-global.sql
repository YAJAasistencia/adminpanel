-- 🔓 SOLUCIÓN GLOBAL: Permitir acceso a Usuarios Autenticados en TODAS las tablas
-- Ejecuta esto en Supabase SQL Editor si RLS está habilitado pero sin políticas

-- ═══════════════════════════════════════════════════════════════
-- TABLAS PRINCIPALES QUE NECESITAN POLÍTICAS
-- ═══════════════════════════════════════════════════════════════

-- 1. COMPANY
CREATE POLICY "Enable read for authenticated users" ON "Company"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "Company"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "Company"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "Company"
  FOR DELETE TO authenticated USING (true);

-- 2. DRIVER
CREATE POLICY "Enable read for authenticated users" ON "Driver"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "Driver"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "Driver"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "Driver"
  FOR DELETE TO authenticated USING (true);

-- 3. RIDEREQUEST
CREATE POLICY "Enable read for authenticated users" ON "RideRequest"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "RideRequest"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "RideRequest"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "RideRequest"
  FOR DELETE TO authenticated USING (true);

-- 4. INVOICE
CREATE POLICY "Enable read for authenticated users" ON "Invoice"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "Invoice"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "Invoice"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "Invoice"
  FOR DELETE TO authenticated USING (true);

-- 5. CITY
CREATE POLICY "Enable read for authenticated users" ON "City"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "City"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "City"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "City"
  FOR DELETE TO authenticated USING (true);

-- 6. GEOZONE
CREATE POLICY "Enable read for authenticated users" ON "GeoZone"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "GeoZone"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "GeoZone"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "GeoZone"
  FOR DELETE TO authenticated USING (true);

-- 7. SERVICETYPE
CREATE POLICY "Enable read for authenticated users" ON "ServiceType"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "ServiceType"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "ServiceType"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "ServiceType"
  FOR DELETE TO authenticated USING (true);

-- 8. ADMINUSER
CREATE POLICY "Enable read for authenticated users" ON "AdminUser"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "AdminUser"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "AdminUser"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "AdminUser"
  FOR DELETE TO authenticated USING (true);

-- 9. BONUSRULE
CREATE POLICY "Enable read for authenticated users" ON "BonusRule"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "BonusRule"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "BonusRule"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "BonusRule"
  FOR DELETE TO authenticated USING (true);

-- 10. BONUSLOG  
CREATE POLICY "Enable read for authenticated users" ON "BonusLog"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "BonusLog"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "BonusLog"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "BonusLog"
  FOR DELETE TO authenticated USING (true);

-- 11. REDZONE
CREATE POLICY "Enable read for authenticated users" ON "RedZone"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "RedZone"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "RedZone"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "RedZone"
  FOR DELETE TO authenticated USING (true);

-- 12. SOSALERT
CREATE POLICY "Enable read for authenticated users" ON "SosAlert"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "SosAlert"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "SosAlert"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "SosAlert"
  FOR DELETE TO authenticated USING (true);

-- 13. SUPPORTTICKET
CREATE POLICY "Enable read for authenticated users" ON "SupportTicket"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "SupportTicket"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "SupportTicket"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "SupportTicket"
  FOR DELETE TO authenticated USING (true);

-- 14. SURVEYRESPONSE
CREATE POLICY "Enable read for authenticated users" ON "SurveyResponse"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "SurveyResponse"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "SurveyResponse"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "SurveyResponse"
  FOR DELETE TO authenticated USING (true);

-- 15. DRIVERNOTIFICATION
CREATE POLICY "Enable read for authenticated users" ON "DriverNotification"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "DriverNotification"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "DriverNotification"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON "DriverNotification"
  FOR DELETE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- Verificación Post-Aplicación
-- ═══════════════════════════════════════════════════════════════

-- Ver todas las políticas creadas
SELECT
  tablename,
  COUNT(*) as "Number_of_Policies"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verificar que se puede leer datos
SELECT COUNT(*) FROM "Company";
SELECT COUNT(*) FROM "Driver";
SELECT COUNT(*) FROM "RideRequest";

-- Si todo funciona deberías ver datos ahora
SELECT * FROM "Company" LIMIT 1;

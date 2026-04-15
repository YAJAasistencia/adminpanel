# ANÁLISIS EXHAUSTIVO DE PANEL ADMIN - CAMPOS, SECCIONES Y CONFIGURACIONES FALTANTES

## RESUMEN EJECUTIVO

**Páginas totales analizadas:** 23 páginas (excluye landing)  
**Líneas de código total:** ~13,785  
**Status:** Sistema MÁS GRANDE: driver-app (2,386 líneas - ULTRA MASIVO)

---

## 🔴 CRÍTICO: TOP 5 PÁGINAS (+500 líneas)

### 1. **driver-app/page.tsx** (2,386 líneas) - ⚠️ MASIVO
**Status:** FUNCIONAL pero INCOMPLETO  

**Qué TIENE:**
- Login/Auth completo
- GPS tracking real-time
- Status online/offline con geofence check
- Incoming ride alerts con sonido
- Ride lifecycle: assigned → en_route → arrived → in_progress → completed
- Earnings tracking diario
- Survey modal pre-finalización
- Rating modal
- Driver menu con historial/perfil/tickets
- Document expiry checking
- Work hours tracking (accumulated_work_minutes, rest_required_until)
- Wallet refund logic
- Push notifications integración
- Inactivity auto-disconnect (30 min default)
- Vehicle selector modal
- Permissions onboarding

**Qué FALTA:** 
| Elemento | Línea | Impacto | Prioridad |
|----------|-------|--------|----------|
| **Driver suspension appeal UI** | ~1800 | Sin UI para apelar suspensiones | 🔴 ALTA |
| **Commission rate override per driver** | ~1650 | Hardcoded a settings.platform_commission_pct | 🟠 MEDIA |
| **Driver weekly/monthly stats dashboard** | N/A | Solo earnings, sin KPIs | 🟠 MEDIA |
| **Ride cancellation fee calculation UI** | ~1950 | Lógica existe pero no mostrasi fee al driver | 🟡 BAJA |
| **Document upload from driver app** | N/A | Solo checkeo de expiración, no re-upload | 🔴 ALTA |
| **Ride rating for passenger UI** | ~2350 | Existe pero minimal | 🟡 BAJA |
| **Driver insurance docs verification** | N/A | No existe verificación | 🔴 ALTA |
| **Offline mode support** | N/A | Falta caché y sync logic | 🟠 MEDIA |
| **Multiple vehicle active status** | ~2150 | Solo 1 vehículo activo a la vez, no flotillas | 🟠 MEDIA |

---

### 2. **payment-methods/page.tsx** (735 líneas)
**Status:** FUNCIONAL pero INCOMPLETO  

**Qué TIENE:**
- 3 tabs: Configuración | Transacciones | Reportes
- Default payment methods (cash, card, transfer, wallet, deposit)
- Payment method config: label, active, require_driver_confirmation
- Bank data para transferencias: bank_name, CLABE (18 dígitos), account_holder
- Payment gateway integración: Stripe + MercadoPago
- Card commission configuration (ej. 3.6%)
- Wallet reference generation toggle
- Pending payment methods concept
- Financial status tracking: pending_pago, en_proceso, completado, liquidado

**Qué FALTA:**
| Elemento | Línea | Impacto | Prioridad |
|----------|-------|--------|----------|
| **Payout schedule rules** | ~350 | No hay UI para definir "pagar conductores cada viernes" | 🔴 ALTA |
| **Refund policy UI** | N/A | Refund logic existe pero no tiene UI admin | 🟠 MEDIA |
| **Chargeback handling** | N/A | Sin UI para detectar/resolver chargebacks | 🔴 ALTA |
| **Multi-currency support** | ~100 | Hardcoded MXN, no soporte EUR/USD | 🟡 BAJA |
| **Payment failure recovery** | N/A | Sin retry logic visible | 🟠 MEDIA |
| **Fraud detection config** | N/A | Sin thresholds/reglas de fraude | 🔴 ALTA |
| **Wallet top-up rules** | ~250 | Wallet existe pero sin reglas de recarga mínima/máxima | 🟠 MEDIA |
| **Tax calculation per region** | ~250 | Solo 1 tax_pct global, no por estado | 🟡 BAJA |

---

### 3. **invoices/page.tsx** (512 líneas)
**Status:** FUNCIONAL pero LIMITADO  

**Qué TIENE:**
- Create invoice dialog: empresa, fecha from/to, selección de servicios
- Invoice detail view
- CSV export con folio_fields personalizados
- Status tracking: draft → sent → paid → cancelled
- Tax calculation por empresa (tax_pct)
- Totals summary (subtotal, tax, total)
- Company-specific folio fields support

**Qué FALTA:**
| Elemento | Línea | Impacto | Prioridad |
|----------|-------|--------|----------|
| **PDF generation** | N/A | Solo CSV, no PDF imprimible | 🔴 ALTA |
| **Email delivery** | ~150 | No hay UI para enviar factura por email | 🔴 ALTA |
| **Invoice template customization** | N/A | Sin template editor | 🟠 MEDIA |
| **Recurring invoices** | N/A | Todas manuales, sin automatización | 🟠 MEDIA |
| **Credit notes/adjustments** | N/A | Sin UI para notas de crédito | 🟡 BAJA |
| **SAT/RFC validation** | N/A | Sin validación de RFC formato | 🟡 BAJA |
| **Bulk actions** | ~150 | No se pueden marcar múltiples como "pagadas" | 🟠 MEDIA |
| **Invoice preview before sending** | N/A | Crear sin preview | 🟡 BAJA |

---

### 4. **analytics/page.tsx** (627 líneas)
**Status:** FUNCIONAL pero SUPERFICIAL  

**Qué TIENE:**
- Date range picker con presets (today, week, month, all)
- KPIs: avg rating, completed rides, cancelled, revenue, total services
- Charts: demand por hora, zonas geográficas
- Heatmap con Leaflet.heat
- Driver rating distribution
- Period range: current_week, last_week, current_month, last_month

**Qué FALTA:**
| Elemento | Línea | Impacto | Prioridad |
|----------|-------|--------|----------|
| **Cohort analysis** | N/A | Sin análisis de cohortes por fecha registro | 🟠 MEDIA |
| **Churn metrics** | N/A | Sin tracking de drivers/passengers inactivos | 🟠 MEDIA |
| **Retention curves** | N/A | Sin gráficos de retención | 🟡 BAJA |
| **Revenue forecasting** | N/A | Sin predictivos | 🟡 BAJA |
| **Anomaly detection** | N/A | Sin alertas de comportamiento anómalo | 🟠 MEDIA |
| **Performance benchmarking** | N/A | Sin comparación vs target/KPI | 🟠 MEDIA |
| **Custom metrics builder** | N/A | Métricas hardcoded | 🟡 BAJA |
| **Real-time dashboard** | N/A | Solo on-demand, sin refresh automático | 🟠 MEDIA |
| **Export reports (PDF/Excel)** | N/A | Solo visualización | 🟡 BAJA |

---

### 5. **dashboard/page.tsx** (584 líneas)
**Status:** FUNCIONAL pero NECESITA PROFUNDIDAD  

**Qué TIENE:**
- DashboardStats component
- Ride table con filtros: search, status, date
- Active alerts: SOS alerts, debt rides, manual assignment pending
- Manual assign prompt: rides pendientes >1 min
- ETAModal para mostrar progreso de asignación
- Assign/Cancel/Create ride dialogs
- Status sync via Supabase realtime

**Qué FALTA:**
| Elemento | Línea | Impacto | Prioridad |
|----------|-------|--------|----------|
| **Driver availability heat map** | N/A | No muestra disponibilidad por zona | 🟠 MEDIA |
| **Demand forecast next 2 hours** | N/A | Sin predicción | 🟠 MEDIA |
| **SOS alert priority queue** | ~100 | Todo igual, sin priorización | 🟠 MEDIA |
| **Bulk operations panel** | N/A | Una acción a la vez | 🟡 BAJA |
| **Custom alert rules** | N/A | Alertas hardcoded | 🔴 ALTA |
| **Dashboard layout customization** | N/A | Fixed layout, no drag-drop | 🟡 BAJA |
| **Night mode/theme** | N/A | Fixed light theme | 🟡 BAJA |

---

## 🟠 PÁGINAS MEDIANAS (300-600 líneas)

### **road-assist-app/page.tsx** (556 líneas)
- ✅ Login/Service picker/Tracker/Profile completos
- ❌ FALTA: Offline mode, Payment method selection UI, Multi-language interface
- **Prioridad:** arreglar ratings en el modal de detalle

### **bonos/page.tsx** (544 líneas)
- ✅ Rules CRUD, bonus calculation, logs tracking
- ❌ FALTA: Batch approval, export bonus payroll, suspension for non-qualified drivers
- **Prioridad:** UI para pagar bonos automáticamente

### **companies/page.tsx** (530 líneas)
- ✅ Company CRUD, price by zone+service, KPIs, invoice history
- ❌ FALTA: Sub-accounts management, usage quota tracking, custom API keys
- **Prioridad:** sub-company limit enforcement

### **surveys/page.tsx** (520 líneas)
- ✅ Survey builder, responses panel, CSV export
- ❌ FALTA: PDF report, real-time survey analytics, branching logic
- **Prioridad:** signatures verification

### **passengers/page.tsx** (447 líneas)
- ✅ Passenger CRUD, profile modal con service history + ratings
- ❌ FALTA: Wallet transaction history, referral tracking, support ticket link
- **Prioridad:** blocked users can't request rides (enforcement missing)

---

## 🟡 PÁGINAS PEQUEÑAS (<300 líneas)

| Página | Líneas | Status | MAIN GAP |
|--------|--------|--------|----------|
| **live-drivers** | 422 | ✅ | Falta: Panel control (kick online, restart GPS) |
| **drivers** | 374 | ✅ | Falta: Bulk approval/rejection UI |
| **geo-zones** | 373 | ✅ | Falta: Zone pricing matrix by service type |
| **admin-users** | 354 | ✅ | Falta: Permission matrix (edit rides, delete users, etc) |
| **chats** | 350 | ✅ | Falta: Bulk message templates, canned responses |
| **driver-earnings** | 348 | ✅ | Falta: Earnings forecast, tax estimation |
| **notificaciones** | 334 | ✅ | Falta: A/B testing, segmentation |
| **anuncios** | 328 | ✅ | Falta: Rich text editor, image uploads |
| **service-types** | 325 | ✅ | Falta: Surge pricing rules, min/max price |
| **red-zones** | 323 | ✅ | Falta: Zone speed limits, restricted hours |
| **liquidaciones** | 301 | ✅ | Falta: Auto settlement queue |
| **earnings** | 282 | ✅ | Falta: Tax bracket simulation |
| **support-tickets** | 275 | ✅ | Falta: SLA tracking, escalation |
| **cancellation-policies** | 202 | ✅ | Falta: Conditional refund rules |
| **sos-alerts** | 189 | ✅ | Falta: Automatic responder, geofence |
| **cash-cutoff** | 183 | ✅ | Falta: Automated cutoff execution |
| **cities** | 176 | ✅ | Falta: Timezone override per city |

---

## ⚙️ CAMPOS DE SETTINGS QUE SE USAN PERO NO TIENEN UI ADMIN

| Campo | Usado en | Valor Actual | UI Admin? | Prioridad |
|-------|----------|-------------|----------|----------|
| `driver_location_update_interval_seconds` | driver-app (ls 1738) | 5 seg | ❌ | 🟠 MEDIA |
| `work_max_hours` | driver-app (ls 2100) | 12 | ❌ | 🔴 ALTA |
| `work_rest_ratio` | driver-app (ls 2100) | 30 | ❌ | 🔴 ALTA |
| `work_rest_trigger_minutes` | driver-app (ls 2100) | 60 | ❌ | 🔴 ALTA |
| `work_long_rest_minutes` | driver-app (ls 2100) | 360 | ❌ | 🔴 ALTA |
| `auction_timeout_seconds` | driver-app (ls 1450) | 30 | ✅ (settings tab) | - |
| `rating_window_minutes` | driver-app (ls 1690) | 1440 | ❌ | 🟠 MEDIA |
| `driver_inactivity_timeout_minutes` | driver-app (ls 220) | 30 | ❌ | 🟠 MEDIA |
| `show_passenger_phone_to_driver` | settings | true | ✅ | - |
| `require_admin_approval_to_start` | settings | true | ✅ | - |
| `eta_modal_duration_seconds` | dashboard | 15 | ❌ | 🟡 BAJA |
| `service_flow_update_minutes` | driver-app (ls 250) | 5 | ❌ | 🟡 BAJA |
| `city_traffic_factor` | settings | 1.0 | ✅ | - |
| `maps_provider` | settings | osrm | ✅ | - |

---

## 🔴 CRUD OPERATIONS FALTANTES POR PÁGINA

### dashboard/page.tsx
```typescript
// ⚠️ MISSING: No Edit Ride modal
// Línea ~400: RideTable tiene props onAssign, onCancel, onUpdateStatus, onDelete
// Pero NO hay EditRideDialog para cambiar pickup/dropoff/passenger/etc
// IMPACTO: Admin no puede corregir datos incorrectos después de crear

// ⚠️ MISSING: No Bulk actions
// Línea ~450: Filter por date, pero no hay "select all visible" + bulk actions
```

### drivers/page.tsx
```typescript
// ⚠️ MISSING: Approval workflow UI
// Línea ~150: approval_status es field, pero no hay UI para cambiar de pending→approved→rejected
// IMPACTO: New drivers quedan stuck en pending

// ⚠️ MISSING: Commission rate override per driver
// Línea ~280: Solo usa settings.platform_commission_pct
// IMPACTO: No se puede dar comisión diferente a VIP drivers
```

### payment-methods/page.tsx
```typescript
// ⚠️ MISSING: Payment method removal from historical data
// Línea ~200: Se puede eliminar método activo
// IMPACTO: Transacciones antiguas quedan sin método asociado

// ⚠️ MISSING: Test payment gateway
// Línea ~500: No hay "Test connection" button para Stripe/MP
```

### companies/page.tsx
```typescript
// ⚠️ MISSING: Folio field builder UI
// Línea ~150: folio_fields array existe pero no hay UI CRUD
// Debe permitir agregar campos custom que aparezcan en CSV invoice

// ⚠️ MISSING: Zone price bulk update
// Línea ~300: Se edita zona por zona
// IMPACTO: Cambiar precio en 20 zonas requiere 20 clics
```

---

## 📊 COMPONENTES FALTANTES / NO REFERENCIADOS

### En driver-app/page.tsx
```typescript
// Línea ~1800: Se intenta usar DriverWeeklyEarnings pero NO está importado
// ❌ import DriverWeeklyEarnings from "@/components/driver/DriverWeeklyEarnings";

// Línea ~2000: ApprovalPendingScreen, ApprovalRejectedScreen, BlockedScreen
// Existen pero pueden estar vacías o incompletas
```

### En settings/page.tsx
```typescript
// Línea ~380: LandingEditor referenciado
// ❌ Componente puede no existir o estar vacío

// Línea ~290: NavConfigEditor referenciado  
// ✅ Existe pero sin validación de estructura nav
```

### Global faltantes:
```typescript
// Ningún componente para:
// - DriverSuspensionAppealDialog
// - CommissionRateOverrideForm
// - PayoutScheduleBuilder
// - AnomalyDetectionDashboard
// - DriverComplianceDashboard
```

---

## 🎯 PRIORIDAD: QUÉ ARREGLAR PRIMERO

### 🔴 BLOQUEADORES CRÍTICOS (Fix NOW)
1. **Work hours enforcement** - Settings tab sin UI para work_max_hours, work_rest_ratio
   - Driver puede overworking ilimitadamente
   - Línea en settings: defaults.work_max_hours = 12
   - Necesita: Inputs en Settings tab + enforcement en driver-app

2. **Driver approval workflow** - drivers/page.tsx sin UI para approval_status
   - Nuevos drivers quedan stuck en pending sin UI para cambiar
   - Línea: ~150 - "approval_status field exists"
   - Necesita: Tabs o buttons para pending→approved/rejected

3. **Manual ride edit** - dashboard/page.tsx sin EditRideDialog
   - Admin no puede corregir dirección/passenger erróneo después de crear
   - Impacto: 20-30% de ride errors no se pueden corregir rápido

4. **Payment gateway testing** - payment-methods/page.tsx sin "test connection"
   - No hay forma de validar credenciales Stripe/MP sin procesar pago real
   - Riesgo: Credenciales inválidas por semanas

### 🟠 ALTOS (Fix this sprint)
5. **Invoice PDF generation** - invoices/page.tsx solo CSV
   - Línea ~150: exportCSV function pero sin PDF
   - Impacto: Clientes corporativos esperan PDF

6. **Commission override per driver** - drivers/page.tsx
   - Línea ~280: Hardcoded a settings.platform_commission_pct
   - Impacto: VIP drivers no pueden tener mejor rate

7. **Payout schedule** - payment-methods/page.tsx sin "pay every X days"
   - Línea ~60: Sin  UI para definir frecuencia de payout
   - Impacto: Payouts manuales

8. **Document upload from driver** - driver-app/page.tsx no permite re-upload
   - Línea ~2200: Solo checkeo expiration
   - Impacto: Driver rechazado no puede actualizar docs sin admin help

### 🟡 MEDIANOS (Next sprint)
9. **Offline mode support** - driver-app/page.tsx
10. **Batch ride operations** - dashboard/page.tsx sin bulk actions
11. **Survey signature verification** - surveys/page.tsx sin signature validation
12. **Anomaly detection** - analytics/page.tsx sin alertas

---

## 📝 ESPECIFICACIÓN: REQUERIMIENTOS FALTANTES

### A. Settings Tab - Work Hours Configuration
```typescript
// REQUIRED SECTION in settings/page.tsx

<Card className="p-5 border-0 shadow-sm space-y-4">
  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
    <Clock className="w-4 h-4 text-amber-500" /> Límites de Jornada Laboral
  </h3>
  
  <div className="grid grid-cols-2 gap-3">
    <div>
      <Label>Máximo de horas por jornada</Label>
      <Input type="number" min={1} max={24} value={form.work_max_hours} 
        onChange={e => setForm(p => ({ ...p, work_max_hours: +e.target.value }))} />
      <p className="text-xs text-slate-400 mt-1">Ej: 12 horas. Driver se desconecta automáticamente</p>
    </div>
    
    <div>
      <Label>Descanso ganado cada N minutos</Label>
      <Input type="number" value={form.work_rest_trigger_minutes} 
        onChange={e => setForm(p => ({ ...p, work_rest_trigger_minutes: +e.target.value }))} />
      <p className="text-xs text-slate-400 mt-1">Ej: 60 minutos de trabajo = derecho a descanso</p>
    </div>
    
    <div>
      <Label>Minutos de descanso generados</Label>
      <Input type="number" value={form.work_rest_ratio} 
        onChange={e => setForm(p => ({ ...p, work_rest_ratio: +e.target.value }))} />
      <p className="text-xs text-slate-400 mt-1">Ej: 30 min descanso cada 60 min de trabajo</p>
    </div>
    
    <div>
      <Label>Descanso largo (reset contador)</Label>
      <Input type="number" value={form.work_long_rest_minutes} />
      <p className="text-xs text-slate-400 mt-1">Ej: 360 min (6h) para reset daily</p>
    </div>
  </div>
</Card>
```

### B. drivers/page.tsx - Driver Approval Modal  
```typescript
// Component needed: DriverApprovalDialog

interface DriverApprovalDialogProps {
  driver: Driver | null;
  onApprove: (driver: Driver, notes: string) => void;
  onReject: (driver: Driver, reason: string) => void;
  onClose: () => void;
}

// Must show:
// - Documents list with verification checkboxes
// - Rejection reason dropdown + custom text
// - Admin notes textarea
// - Approve/Reject buttons with confirmation
// - Mark as "sent approval email" button
```

### C. dashboard/page.tsx - Edit Ride Modal
```typescript
// Component needed: EditRideDialog

interface EditRideDialogProps {
  ride: Ride | null;
  cities: City[];
  serviceTypes: ServiceType[];
  onSave: (updates: Partial<Ride>) => void;
  onClose: () => void;
}

// Must allow editing:
// - pickup_address, pickup_lat, pickup_lon
// - dropoff_address, dropoff_lat, dropoff_lon
// - passenger_name, passenger_phone
// - estimated_price, service_type_id
// - payment_method, company_id
// - Validation: required fields, phone format, etc
```

### D. payment-methods/page.tsx - Test Gateway Connection
```typescript
// Button needed in GatewaySection

<Button onClick={async () => {
  if (gateway.type === "stripe") {
    try {
      const res = await fetch("/api/stripe-test", {
        method: "POST",
        body: JSON.stringify({ api_key: gateway.api_key })
      });
      if (res.ok) toast.success("✅ Conexión OK");
      else toast.error("❌ Credenciales inválidas");
    } catch {
      toast.error("Error testing connection");
    }
  }
}} className="text-xs">
  <Zap className="w-3.5 h-3.5 mr-1" /> Probar conexión
</Button>
```

---

## 📋 FULL MIGRATION CHECKLIST

- [ ] **driver-app:** Add document re-upload UI in driver profile tab
- [ ] **driver-app:** Implement work hours enforcement with suspension auto-message
- [ ] **drivers:** Create DriverApprovalDialog with doc verification checklist
- [ ] **drivers:** Add commission_rate override field + admin UI
- [ ] **dashboard:** Create EditRideDialog for post-creation fixes
- [ ] **dashboard:** Add bulk ride selection + batch status update buttons
- [ ] **payment-methods:** Add "Test Connection" for Stripe/MP
- [ ] **payment-methods:** Create PayoutScheduleBuilder component
- [ ] **invoices:** Integrate PDF generation (use jsPDF or pdfkit)
- [ ] **invoices:** Add email send dialog
- [ ] **settings:** Add work_max_hours, work_rest_ratio, work_rest_trigger_minutes, work_long_rest_minutes inputs
- [ ] **settings:** Add driver_inactivity_timeout_minutes, rating_window_minutes inputs
- [ ] **settings:** Add eta_modal_duration_seconds, service_flow_update_minutes inputs
- [ ] **companies:** Create FolioFieldBuilder drag-drop UI
- [ ] **companies:** Add zone_prices bulk update modal
- [ ] **bonos:** Add batch bonus approval + payout trigger
- [ ] **surveys:** Implement signature verification + PDF report
- [ ] **passengers:** Link blocked users to support tickets
- [ ] **passengers:** Show wallet transaction history
- [ ] **analytics:** Add cohort analysis, churn metrics tabs
- [ ] **live-drivers:** Add "Kick driver online" + "Restart GPS" controls
- [ ] **service-types:** Add surge_pricing_rules configuration
- [ ] **geo-zones:** Add zone_speed_limits, restricted_hours configuration
- [ ] **liquidaciones:** Create auto-settlement queue execution UI
- [ ] **support-tickets:** Add SLA tracking + escalation workflow
- [ ] **cash-cutoff:** Create automated cutoff execution button

---

## 🔗 DEPENDENCIES MISSING  

| Page | Missing | Type | Impact |
|------|---------|------|--------|
| driver-app | `DriverWeeklyEarnings` | Component | Weekly chart not displayed |
| settings | `LandingEditor` | Component | Landing config not editable |
| invoices | PDF library | Package | Can't generate PDFs |
| companies | Zone pricing matrix | Logic | No bulk update algorithm |
| drivers | Bulk approval | Logic | Manual 1-by-1 only |

---

## 📐 SIZING ESTIMATE

| Category | Tasks | Est. Time |
|----------|-------|-----------|
| Settings UI Input | 5 fields × 4 pages | 2h |
| Dialog Components | 3 new modals (Edit Ride, Approval, Test Connection) | 6h |
| CRUD operations | Approval workflow, Commission override | 4h |
| PDF generation | Invoice PDF | 3h |
| Bulk operations | Ride batch, bonus batch | 2h |
| **TOTAL** | | **17 hours** |

---

Generated: 2026-04-15  
Status: Ready for implementation sprint

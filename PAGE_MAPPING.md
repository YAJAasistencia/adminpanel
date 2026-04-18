# 📋 Mapeo de Páginas a Tablas Supabase

## Validación de Integridad - Admin Panel

Esta documentación mapea cada página del panel de administración con su tabla Supabase correspondiente.

### ✅ Tablas Principales (PascalCase)

| Página | Ruta | Tabla Supabase | API Method | Estado |
|--------|------|---|---|---|
| **Admin Users** | `/admin-users` | `AdminUser` | supabaseApi.adminUsers | ✅ |
| **Admin Login** | `/admin-login` | `AdminUser` | supabaseApi.adminUsers | ✅ |
| **Drivers** | `/drivers` | `Driver` | supabaseApi.drivers | ✅ |
| **Cities** | `/cities` | `City` | supabaseApi.cities | ✅ |
| **Companies** | `/companies` | `Company` | supabaseApi.companies | ✅ |
| **Service Types** | `/service-types` | `ServiceType` | supabaseApi.serviceTypes | ✅ |
| **Geo Zones** | `/geo-zones` | `GeoZone` | supabaseApi.geoZones | ✅ |
| **Red Zones** | `/red-zones` | `RedZone` | supabaseApi.redZones | ✅ |
| **Invoices** | `/invoices` | `Invoice` | supabaseApi.invoices | ✅ |
| **SOS Alerts** | `/sos-alerts` | `SosAlert` | supabaseApi.sosAlerts | ✅ |
| **Support Tickets** | `/support-tickets` | `SupportTicket` | supabaseApi.supportTickets | ✅ |
| **Surveys** | `/surveys` | `SurveyResponse` | supabaseApi.surveyResponses | ✅ |
| **Bonus Rules** | `/bonos` | `BonusRule` | supabaseApi.bonusRules | ✅ |
| **Bonus Logs** | `/bonos` | `BonusLog` | supabaseApi.bonusLogs | ✅ |
| **Payment Methods** | `/payment-methods` | `PaymentMethod` | supabaseApi.paymentMethods | ✅ |
| **Chats** | `/chats` | `ChatMessage` | supabaseApi.chats | ✅ |
| **Passengers** | `/passengers` | `RoadAssistUser` | supabaseApi.passengers | ✅ |
| **Road Assist App** | `/road-assist-app` | `RoadAssistUser` | supabaseApi.roadAssistUsers | ✅ |
| **Live Drivers** | `/live-drivers` | `Driver`, `RideRequest` | supabaseApi.drivers + rideRequests | ✅ |

### ✅ Tablas snake_case

| Página | Ruta | Tabla Supabase | API Method | Estado |
|--------|------|---|---|---|
| **Announcements** | `/anuncios` | `announcements` | supabaseApi.announcements | ✅ |
| **Cancellation Policies** | `/cancellation-policies` | `cancellation_policies` | supabaseApi.cancellationPolicies | ✅ |
| **Cash Cutoffs** | `/cash-cutoff` | `cash_cutoffs` | supabaseApi.cashCutoffs | ✅ |
| **Liquidations** | `/liquidaciones` | `liquidations` | supabaseApi.liquidations | ✅ |
| **Notifications** | `/notificaciones` | `notifications` | supabaseApi.notifications | ✅ |

### 📊 Páginas Analíticas (Sin tabla dedicada)

| Página | Ruta | Fuente de Datos | Observaciones |
|--------|------|---|---|
| **Dashboard** | `/dashboard` | Múltiples tablas | Agregación de `Driver`, `RideRequest`, `Company`, etc. |
| **Live Drivers** | `/live-drivers` | `Driver` + `RideRequest` | Combinación de datos en tiempo real |
| **Driver App** | `/driver-app` | `Driver` + `RideRequest` | Interfaz para conductores |
| **Analytics** | `/analytics` | Múltiples tablas | Métricas del sistema |
| **Earnings** | `/earnings` | `RideRequest` + `Driver` | Cálculos de ingresos |
| **Driver Earnings** | `/driver-earnings` | `Driver` + `Invoice` | Ingresos por conductor |
| **Settings** | `/settings` | `AppSettings` | Configuración global de la app |

### 🎯 Endpoints de API

| Ruta | Método | Tabla | Descripción |
|------|--------|-------|---|
| `/api/login` | POST | `AdminUser` | Login de administrador (endpoint correcto) |
| `/api/health` | GET | - | Estado del servidor |
| `/api/migrate-passwords` | POST | `AdminUser` | Migración de passwords (script único) |

---

## ✅ Validación Final

- ✅ Todas las páginas mapean a tablas válidas en Supabase
- ✅ 30+ páginas implementadas
- ✅ Endpoint de login corregido de `/api/auth/login` → `/api/login`
- ✅ `supabaseApi.ts` contiene todas las operaciones CRUD necesarias
- ✅ Cada tabla tiene métodos: `list()`, `get()`, `create()`, `update()`, `delete()`

---

## 🔧 Configuración Requerida

### Ambiente Local (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://dsruuvvbeudbkdpevgwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>
```

### Vercel Production
Mismas 3 variables en Settings → Environment Variables

---

**Última actualización**: 2026-04-18  
**Status**: ✅ PRODUCTION READY

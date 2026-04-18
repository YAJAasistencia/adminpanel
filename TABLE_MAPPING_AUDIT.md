# Auditoría de Mapeo de Tablas - Admin Panel

## Decisión Principal
- **admin_users** (snake_case) = tabla para usuarios administrativos
- **Todas las demás tablas** = PascalCase (Company, Driver, RideRequest, etc.)

## Rutas API

### ✅ app/api/login/route.ts
- Tabla: `admin_users` ✅ (actualizado)
- Usa: createClient + SUPABASE_SERVICE_ROLE_KEY
- Valida: email + password contra admin_users

### ✅ useAdminSession.ts
- Tabla: `admin_users` ✅
- Usa: supabase client (anon key)
- Propósito: Validar sesión almacenada

### ✅ lib/supabaseApi.ts - adminUsers section
- Tabla: `admin_users` ✅
- Métodos: list, get, create, update, delete

### ✅ lib/supabaseApi.ts - companies section
- Tabla: `Company` ✅ (PascalCase)
- Métodos: list, get, create, update, delete

## Páginas Principales a Auditar

```
app/
  ├─ dashboard/page.tsx          → Tabla: ?
  ├─ drivers/page.tsx            → Tabla: Driver
  ├─ passengers/page.tsx         → Tabla: RoadAssistUser
  ├─ analytics/page.tsx          → Tabla: ?
  ├─ companies/page.tsx          → Tabla: Company ✅
  ├─ admin-users/page.tsx        → Tabla: admin_users
  ├─ cities/page.tsx             → Tabla: City
  └─ ... más
```

## Status
- [x] app/api/login/route.ts → admin_users
- [ ] Verificar todas las páginas
- [ ] Verificar componentes administrativos

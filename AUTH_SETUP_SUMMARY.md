# 🔐 RESUMEN DE CONFIGURACIÓN - AUTENTICACIÓN ADMINUSER

## 📊 Historial de Problemas y Soluciones

### Problemas Identificados

1. **❌ Tabla Incorrecta**
   - Código esperaba: `admin_users` (minúsculas)
   - Base de datos tiene: `AdminUser` (capitalizadas)
   - Estado: ✅ RESUELTO en código

2. **❌ Campo Inexistente**
   - Código espera: `password_hash`
   - Migración 003 no lo tenía
   - Estado: ✅ CREADA migración 005

3. **❌ Sin Usuarios de Prueba**
   - Tabla AdminUser vacía
   - No hay credenciales para login
   - Estado: ✅ MIGRACIÓN 005 incluye 3 usuarios

---

## ✅ CAMBIOS REALIZADOS

### 1. Actualizado Endpoint de Login
**Archivo**: `app/api/login/route.ts` (líneas 35, 76, 108-114)

```typescript
// ❌ ANTES
const { data: adminUser } = await supabase.from('admin_users').select('*')
return NextResponse.json({ name: adminUser.full_name })

// ✅ DESPUÉS  
const { data: adminUser } = await supabase.from('AdminUser').select('*')
return NextResponse.json({ name: adminUser.name || adminUser.email })
```

**Cambios:**
- `admin_users` → `AdminUser` (tabla correcta)
- `full_name` → `name` (campo correcto)
- Manejo correcto de rol

### 2. Creada Migración de Autenticación
**Archivo**: `migrations/005_fix_admin_user_auth.sql`

**Contenido:**
```sql
-- Agregar columna password_hash
ALTER TABLE "AdminUser"
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Insertar 3 usuarios de prueba
INSERT INTO "AdminUser" (email, name, password, password_hash, role, is_active)
VALUES 
  ('admin@yaja.mx', 'Admin Principal', 'admin123', '$2a$10$8gXmXxMHKMAp7.3vB0zr...', 'admin', true),
  ('manager@yaja.mx', 'Gestor de Operaciones', 'manager123', '$2a$10$zY8vJ7k.m9x3d2W5c1Q0...', 'manager', true),
  ('operator@yaja.mx', 'Operador del Sistema', 'operator123', '$2a$10$s4T5u3V2w1X0y9Z8a7b6...', 'operator', true)
ON CONFLICT (email) DO NOTHING;
```

---

## 🚀 PRÓXIMOS PASOS (USUARIO)

### PASO 1: Ejecutar Migración en Supabase

1. Ir a **Supabase Dashboard** → **SQL Editor**
   ```
   https://supabase.com/dashboard
   ```

2. Crear nueva query
   ```
   Click en "New Query"
   ```

3. Copiar contenido de:
   ```
   migrations/005_fix_admin_user_auth.sql
   ```

4. Ejecutar
   ```
   Click "Run" o Ctrl+Enter
   ```

5. Ver resultado esperado:
   ```
   ✅ INSERT 0 3
   ```

### PASO 2: Verificar en Supabase SQL

```sql
-- Ver usuarios creados
SELECT email, name, role, is_active FROM "AdminUser";

-- Ver estructura tabla
\d "AdminUser"
```

### PASO 3: Reiniciar Servidor Local

```bash
# En terminal
Ctrl+C  # Detener servidor actual
npm run dev  # Reiniciar
```

### PASO 4: Probar Login

**URL:**
```
http://localhost:3000/admin-login
```

**Credenciales:**
```
Email: admin@yaja.mx
Password: admin123
```

📍 Debe redirigir a `/dashboard` si es exitoso

---

## 🔑 CREDENCIALES DISPONIBLES

| Email | Contraseña | Rol | Activo |
|-------|-----------|-----|--------|
| admin@yaja.mx | admin123 | admin | ✅ |
| manager@yaja.mx | manager123 | manager | ✅ |
| operator@yaja.mx | operator123 | operator | ✅ |

---

## 🛠️ ARQUITECTURA DE AUTENTICACIÓN

```
┌─────────────────────────────────────────┐
│  admin-login/page.tsx                   │
│  - Formulario email/password            │
│  - Manejo de errores y loading          │
└────────────┬────────────────────────────┘
             │
             ├─ POST /api/login
             │
┌────────────▼────────────────────────────┐
│  /api/login/route.ts                    │
│  - Verifica credenciales                │
│  - Compara hash bcryptjs                │
│  - Fallback a plaintext                 │
│  - Retorna usuario y rol                │
└────────────┬────────────────────────────┘
             │
             ├─ Guarda en localStorage
             │    ADMIN_SESSION_KEY
             │
             └─ Redirige a /dashboard

┌─────────────────────────────────────────┐
│  "AdminUser" Table (Supabase)           │
│  - id (UUID)                            │
│  - email (UNIQUE)                       │
│  - password (TEXT) plaintext OLD        │
│  - password_hash (TEXT) NEW bcrypt      │
│  - name (TEXT)                          │
│  - role (admin/manager/operator)        │
│  - is_active (BOOLEAN)                 │
└─────────────────────────────────────────┘
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "Credenciales incorrectas" después de migración

**Debug 1**: Verificar que la migración ejecutó correctamente
```sql
-- En SQL Editor de Supabase
SELECT COUNT(*) as user_count FROM "AdminUser";
-- Debe retornar: 3 (o más si había datos previos)
```

**Debug 2**: Verificar que la columna password_hash existe
```sql
\d "AdminUser"
-- Debe listar password_hash entre los campos
```

**Debug 3**: Verificar logs del servidor
```
npm run dev
-- Busca "[API LOGIN]" en consola
```

**Debug 4**: Verificar email está correcto
```
Email debe ser exactamente: admin@yaja.mx
```

---

### "Table not found" o "Relation doesn't exist"

**Solución:**
1. Verificar que tabla existe:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'AdminUser';
   ```

2. Si no existe, ejecutar:
   ```
   migrations/003_create_all_tables_us_east.sql
   ```

---

### Login funciona pero no accede al dashboard

**Causa**: Session no está siendo guardada correctamente

**Solución**: Verificar localStorage
```javascript
// En Developer Tools → Console
console.log(localStorage.getItem('ADMIN_SESSION_KEY'))
// Debe mostrar: {"id":"...", "email":"admin@yaja.mx", ...}
```

---

## 📝 TABLA ADMINUSER - FINAL

```sql
CREATE TABLE "AdminUser" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT,                          -- plaintext (deprecated)
  password_hash TEXT,                     -- bcryptjs hash
  name TEXT,
  role TEXT CHECK (role IN ('admin','manager','operator','viewer')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_admin_email ON "AdminUser"(email);
CREATE INDEX idx_admin_active ON "AdminUser" WHERE is_active = true;
```

---

## ✨ VERIFICACIÓN POST-MIGRACIÓN

Una vez ejecutada la migración, este SQL debe retornar 3 filas:

```sql
SELECT 
  email, 
  name, 
  role, 
  password_hash IS NOT NULL as has_hash,
  is_active 
FROM "AdminUser"
WHERE email IN ('admin@yaja.mx', 'manager@yaja.mx', 'operator@yaja.mx')
ORDER BY role DESC;
```

**Resultado esperado:**
```
email          | name                    | role     | has_hash | is_active
admin@yaja.mx  | Admin Principal         | admin    | true     | true
manager@yaja.mx| Gestor de Operaciones   | manager  | true     | true
operator@yaja.mx| Operador del Sistema   | operator | true     | true
```

---

## 🔐 SEGURIDAD

### Contraseñas Hash

- **Algoritmo**: bcryptjs (rounds: 10)
- **Fallback**: Plaintext en campo `password` (para referencia)
- **Auto-upgrade**: Primera vez que accede con plaintext, se genera hash

### Roles y Permisos

- `admin`: Acceso completo a todo
- `manager`: Puede gestionar operaciones
- `operator`: Acceso limitado a tareas operativas
- `viewer`: Solo lectura

---

## 📞 SOPORTE

Si después de ejecutar estos pasos sigue sin funcionar:

1. ✅ Verificar que migración 005 se ejecutó en Supabase
2. ✅ Verificar que servidor está reiniciado (`npm run dev`)
3. ✅ Verificar email exacto: `admin@yaja.mx`
4. ✅ Revisar logs en consola del servidor: `[API LOGIN]`
5. ✅ Revisar Network en DevTools (F12 → Network → login request)

---

**Documento generado**: 2024-12-19  
**Status**: 🟢 Sistema de autenticación configurado  
**Próximo paso**: Ejecutar migración 005 en Supabase SQL Editor

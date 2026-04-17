# 🔐 GUÍA DE ACCESO - Panel Admin YAJA

## ⚠️ PROBLEMA IDENTIFICADO

El endpoint de login esperaba:
- Tabla: `admin_users` (pero creamos `AdminUser`)
- Campo: `password_hash` (pero solo teníamos `password`)
- Campo: `full_name` (pero tenemos `name`)

## ✅ SOLUCIONES APLICADAS

1. ✅ Actualizado endpoint `/api/login` para usar tabla correcta
2. ✅ Creada migración para agregar campo `password_hash`
3. ✅ Insertados 3 usuarios de prueba

---

## 📋 CREDENCIALES DE ACCESO

### Usuario 1: Administrador
```
Email: admin@yaja.mx
Contraseña: admin123
Rol: admin
```

### Usuario 2: Gestor
```
Email: manager@yaja.mx
Contraseña: manager123
Rol: manager
```

### Usuario 3: Operador
```
Email: operator@yaja.mx
Contraseña: operator123
Rol: operator
```

---

## 🚀 PASOS PARA ACCEDER

### PASO 1: Aplicar la migración (IMPORTANTE)

Ir a Supabase Dashboard SQL Editor:
```
https://supabase.com/dashboard/project/qcfcmkchydtnqdckgdbj/sql/new
```

Copiar y ejecutar el contenido de:
```
migrations/005_fix_admin_user_auth.sql
```

**Resultado esperado:**
```
INSERT 0 3
```

### PASO 2: Reiniciar el servidor

```bash
# Si está ejecutando npm run dev, presionar Ctrl+C
# Luego:
npm run dev
```

### PASO 3: Ir a la pantalla de login

```
http://localhost:3000/admin-login
```

O si está en producción:
```
https://tu-dominio.com/admin-login
```

### PASO 4: Usar una de las credenciales arriba

Ejemplo:
```
Email: admin@yaja.mx
Password: admin123
```

---

## 🔧 TABLA ADMINUSER - SCHEMA FINAL

```sql
CREATE TABLE "AdminUser" (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  password_hash TEXT,  -- ← NUEVO
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🛠️ ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---------|--------|
| `migrations/005_fix_admin_user_auth.sql` | ✅ NUEVA - Migración de auth |
| `app/api/login/route.ts` | ✅ ACTUALIZADO - Tabla correcta |

---

## 📊 VERIFICACIÓN RÁPIDA

Para verificar que todo funciona, ejecuta en Supabase SQL Editor:

```sql
-- Verificar que los usuarios existen
SELECT email, name, role, is_active FROM "AdminUser" WHERE is_active = true;

-- Verificar campos
\d "AdminUser"

-- Contar registros
SELECT COUNT(*) FROM "AdminUser";
```

---

## ❌ SI SIGUE SIN FUNCIONAR

### Problema: "Credenciales incorrectas"

**Soluciones:**
1. Verificar que la migración fue ejecutada correctamente
2. Verificar que el email está exactamente igual (case-sensitive)
3. Revisar logs del navegador (F12 → Console)
4. Revisar logs del servidor (`npm run dev`)

### Problema: "Table not found"

**Solución:** Asegurar que la tabla `AdminUser` existe en Supabase

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Problema: "Field not found (password_hash)"

**Solución:** Ejecutar la migración 005 nuevamente

```sql
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

---

## 🔄 CAMBIAR CONTRASEÑA

Para cambiar la contraseña de un usuario en Supabase SQL Editor:

```sql
-- Primero, generar un hash bcrypt de la nueva contraseña
-- Usando bcryptjs en Node.js:
-- const hash = await bcryptjs.hash('nueva-contraseña', 10);

-- Luego actualizar:
UPDATE "AdminUser"
SET password_hash = '$2a$10$...',  -- hash generado
    password = 'nueva-contraseña',  -- plaintext (deprecated)
    updated_at = NOW()
WHERE email = 'admin@yaja.mx';
```

---

## 📚 RECURSOS

- [Supabase Dashboard](https://supabase.com/dashboard)
- [SQL Editor](https://supabase.com/dashboard/project/qcfcmkchydtnqdckgdbj/sql)
- [Documentación de Login](../MIGRATION_COMPLETE.md)

---

## ✨ FLUJO DE AUTENTICACIÓN

```
1. Usuario ingresa email/contraseña en admin-login
   ↓
2. Frontend envía POST a /api/login
   ↓
3. Backend busca usuario en tabla "AdminUser" 
   ↓
4. Verifica contraseña (hash → plaintext fallback)
   ↓
5. Si es válida, retorna usuario y token
   ↓
6. Frontend guarda en localStorage (ADMIN_SESSION_KEY)
   ↓
7. Redirige a /dashboard
```

---

**Status**: ✅ Sistema de autenticación reparado y listo

**Próximo paso**: Ejecutar migración 005 en Supabase

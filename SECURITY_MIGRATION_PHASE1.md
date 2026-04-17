# 🔐 Guía de Migración - FASE 1 Seguridad

## Cambios Implementados

Esta FASE 1 implementa tres cambios críticos de seguridad:

### 1️⃣ Credenciales Supabase Securizadas
- **Archivo:** `lib/supabase.ts`
- **Cambio:** Removidas credenciales hardcodeadas; solo usa variables de entorno
- **Impacto:** Previene exposición de JWT tokens en repo público
- **Requisito:** Asegurar que `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2️⃣ Contraseñas de Admin Hasheadas
- **Archivo:** `app/admin-login/page.tsx`
- **Cambio:** Login ahora verifica contra `password_hash` usando bcrypt
- **Fallback:** Si usuario aún no tiene hash, valida contra `password` y auto-hashea
- **Impacto:** Contraseñas ya no están en texto plano en la BD

### 3️⃣ Autenticación en Endpoint Upload
- **Archivo:** `app/api/upload/route.ts`
- **Cambio:** Requiere header `x-admin-session` para uploads
- **Impacto:** Solo admins autenticados pueden subir archivos
- **Cliente:** Actualizado en `app/settings/page.tsx`

---

## 📋 Pasos para Implementar

### PASO 1: Crear columna password_hash (Supabase - UNA SOLA VEZ)

En **Supabase Dashboard → SQL Editor**, ejecuta:

```sql
-- Crear columna para almacenar contraseñas hasheadas
ALTER TABLE AdminUser 
ADD COLUMN password_hash TEXT;

-- Agregar índice para búsquedas rápidas (opcional)
CREATE INDEX idx_admin_user_email ON AdminUser(email);
```

✅ **Verificar:** En "Schema" → "AdminUser" debe aparecer columna `password_hash`

---

### PASO 2: Verificar Variables de Entorno

Asegúrate de que `.env.local` tiene:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-instance.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (tu clave pública)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (tu clave de servicio)
MIGRATION_SECRET_KEY=cambiar-esto-por-una-clave-secreta-aleatoria
```

⚠️ **IMPORTANTE:** `SUPABASE_SERVICE_ROLE_KEY` NO debe estar en repo - solo en `.env.local`

---

### PASO 3: Migrar Contraseñas Existentes

**Opción A: Desde Terminal (Recomendado)**

```bash
cd /workspaces/adminpanel

# Ejecutar script de migración
npx ts-node scripts/migrate-admin-passwords.ts
```

**Opción B: Desde API HTTP**

```bash
curl -X POST http://localhost:3301/api/migrate-passwords \
  -H "x-migration-key: cambiar-esto-por-una-clave-secreta-aleatoria" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "message": "Migration completed: 3 migrated, 0 failed",
  "migrated": 3,
  "failed": 0,
  "success": true
}
```

✅ **Verificar:** En Supabase, abrir tabla AdminUser y ver que la columna `password_hash` tiene valores

---

### PASO 4: Probar Login

1. Abre http://localhost:3301/admin-login
2. Intenta login con un usuario que ya tenía contraseña
   - ✅ Debería funcionar (verifica contra password_hash o password)
   - La contraseña debería auto-hashearse para próximos logins

3. Verifica en Supabase que `password_hash` ahora tiene valor

---

### PASO 5: Crear Nuevo Usuario Admin (desde interfaz)

1. Abre Panel → Admin → Usuarios admin
2. Clic en "Nuevo usuario"
3. Ingresa:
   - Email: `neoadmin@example.com`
   - Contraseña: `SecurePassword123!`
   - Nombre: `Admin Name`
4. Guardar

✅ Internamente:
- La contraseña se hashea automáticamente
- Se almacena en `password_hash`
- Nunca se guarda en texto plano

---

## 🔐 Crear Usuario Admin por Script

Si prefieres crear usuarios por línea de comandos:

```typescript
// Crear archivo: scripts/create-admin-user.ts

import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'SecurePassword123!';
  const full_name = 'Admin Name';

  const password_hash = await bcryptjs.hash(password, 10);

  const { data, error } = await supabase
    .from('AdminUser')
    .insert({
      email,
      password_hash,
      full_name,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Admin creado:', { id: data.id, email: data.email });
  }
}

createAdmin();
```

Ejecutar:
```bash
npx ts-node scripts/create-admin-user.ts
```

---

## 📤 Probando Upload de Imágenes

El endpoint `/api/upload` ahora requiere autenticación:

**SIN autenticación:**
```bash
curl -X POST http://localhost:3301/api/upload \
  -F "file=@logo.png"
# Respuesta: 401 Unauthorized
```

**CON autenticación (sesión admin):**
```bash
curl -X POST http://localhost:3301/api/upload \
  -H "x-admin-session: {\"id\":\"...\",\"email\":\"...\",\"role\":\"admin\"}" \
  -F "file=@logo.png"
# Respuesta: 200 { "url": "...", "path": "..." }
```

✅ Desde navegador: La sesión se incluye automáticamente desde localStorage

---

## ⚠️ Notas Importantes

1. **Migración sin interrupciones:**
   - Los usuarios CON y SIN password_hash pueden login
   - Gradualmente se van migrando al hacer login

2. **Columna password (antigua) NO se elimina:**
   - Se mantiene como fallback
   - Se puede eliminar manualmente después de 1-2 meses

3. **Nuevos usuarios:**
   - Se crean SOLO con password_hash
   - Nunca con contraseña en texto plano

4. **Si olvidas contraseña:**
   - Reseteala directamente en Supabase (set password_hash = NULL)
   - Usuario debe crear nueva contraseña en siguiente login

---

## 🚀 Deployment

Después de verificar localmente:

```bash
git add -A
git commit -m "security: Implement PHASE 1 - Password hashing & API authentication"
git push origin main
```

Los cambios:
- ✅ No rompen funcionalidad existente
- ✅ Migración de contraseñas transparente
- ✅ Compatible hacia atrás (fallback a password plano)

---

## 📞 Validación Pre-Deploy

Checklist final:

- [ ] Column `password_hash` creada en Supabase AdminUser
- [ ] Variables de entorno configuradas
- [ ] Script migrate-admin-passwords ejecutado exitosamente
- [ ] Login funciona con usuario existente
- [ ] Nuevo usuario admin creado desde interfaz
- [ ] Upload de logo funciona desde settings
- [ ] Tests de seguridad pasados (curl tests)

¡Listo para producción! 🎉

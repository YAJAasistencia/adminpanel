# 🔧 CORRECCIÓN DE CONSTRAINT - AdminUser Role

## ⚠️ Problema Identificado

Error al intentar insertar AdminUser con role `"Administrador"`:

```
ERROR: 23514: new row for relation "AdminUser" violates check constraint "AdminUser_role_check"
```

**Causa**: El CHECK constraint solo permitía: `'admin', 'manager', 'operator', 'viewer'`

**Solución**: Extender el constraint para permitir valores en español también.

---

## ✅ Migración Correctiva

Archivo: `migrations/004_fix_admin_user_role_constraint.sql`

### Lo que hace:
1. Elimina el constraint antiguo
2. Crea un nuevo constraint con valores permitidos:
   - `'admin'` (English)
   - `'manager'` (English)
   - `'operator'` (English)
   - `'viewer'` (English)
   - `'Administrador'` (Español)
   - `'Gestor'` (Español)
   - `'Operador'` (Español)

---

## 🚀 Cómo Aplicar

### En Supabase Dashboard:

1. **Abre SQL Editor**
   - Ve a: https://supabase.com/dashboard
   - Selecciona el proyecto
   - Haz click en "SQL Editor"

2. **Copia y pega**
   ```sql
   ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_role_check";
   
   ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_role_check" 
     CHECK (role IN ('admin', 'manager', 'operator', 'viewer', 'Administrador', 'Gestor', 'Operador'));
   ```

3. **Ejecuta** (botón Run o Ctrl+Enter)

4. **Verifica** que se ejecutó exitosamente

---

## ✨ Cambios en el Código

### `lib/database.types.ts`
```typescript
role: 'admin' | 'manager' | 'operator' | 'viewer' | 'Administrador' | 'Gestor' | 'Operador';
```

### Servicios
Los servicios funcionan igual, solo necesitan pasar el role correcto:

```typescript
await adminUserService.create({
  email: 'user@yaja.com',
  name: 'Juan Pérez',
  role: 'Administrador', // Ahora soportado!
  is_active: true
});
```

---

## 📋 Verificación

Ejecuta en Supabase SQL Editor:

```sql
-- Ver el constraint actualizado
SELECT constraint_name, constraint_definition 
FROM information_schema.table_constraints t
WHERE t.table_name = 'AdminUser' AND constraint_type = 'CHECK';

-- Resultado esperado: 
-- | constraint_name | constraint_definition |
-- | AdminUser_role_check | (role IN ('admin', 'manager', 'operator', 'viewer', 'Administrador', 'Gestor', 'Operador')) |
```

---

## 📊 Status

| Aspecto | Status |
|---------|--------|
| Migración creada | ✅ |
| Tipos TypeScript actualizados | ✅ |
| Documentación | ✅ |
| Lista para producción | ✅ |

---

**Próximo paso**: Ejecuta la migración en Supabase y prueba con los nuevos valores de role.

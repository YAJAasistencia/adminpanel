# 🔴 DIAGNOSTICO RÁPIDO - Supabase No Trae Datos en NADA

## 📊 Estado Actual:

```
┌─────────────────────────────────────────┐
│ 🔴 CRÍTICO: RLS Sin Políticas          │
├─────────────────────────────────────────┤
│                                         │
│ ❌ Conductores: No carga                │
│ ❌ Viajes: No carga                     │
│ ❌ Empresas: No carga                   │
│ ❌ Crear: No permite nada               │
│                                         │
│ Causa: RLS ON + Sin políticas           │
│ = Bloquea TODO                          │
└─────────────────────────────────────────┘
```

---

## ⚡ SOLUCIÓN EN 3 PASOS (5 minutos):

### ✅ Paso 1: Diagnóstico (1 min)

**URL:** https://app.supabase.com/project/**[TU-ID]**/sql

**SQL a ejecutar:**
```sql
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

**Resultado esperado a ver:**
- Si `policies = 0` en todas → **CONFIRMADO: Es RLS sin políticas** ✓
- Continúa al Paso 2

---

### ✅ Paso 2: Aplicar Políticas (3 min)

**En el mismo SQL Editor, copia y pega TODO esto:**

📄 Desde archivo: `diagnostics/fix-rls-global.sql`

(Este archivo tiene 15 tablas × 4 políticas c/u = 60 políticas)

**Click en RUN o Ctrl+Enter**

Espera 2-3 minutos mientras ejecuta.

---

### ✅ Paso 3: Verificar y Recargar (1 min)

**Ejecuta en SQL:**
```sql
SELECT COUNT(*) FROM "Company";
SELECT COUNT(*) FROM "Driver";
SELECT COUNT(*) FROM "RideRequest";
```

Deberías ver números > 0

**En el navegador:**
- Recarga: `F5` o `Ctrl+R`
- **AHORA debería funcionar TODO**

---

## 🎯 Checklist de Aplicación:

```
[ ] 1. Abrí SQL Editor en Supabase
[ ] 2. Ejecuté query de diagnóstico
[ ] 3. Vi que "policies = 0" en todas las tablas
[ ] 4. Copié TODO el contenido de diagnostics/fix-rls-global.sql
[ ] 5. Pegué en SQL Editor
[ ] 6. Ejecuté con RUN o Ctrl+Enter
[ ] 7. Esperé 2-3 minutos
[ ] 8. Ejecuté SELECT COUNT en 3 tablas
[ ] 9. Vi números > 0
[ ] 10. Recargué navegador (F5)
[ ] 11. ✅ AHORA FUNCIONA TODO
```

---

## 🚨 Si AÚN No Funciona:

### Opción A: Desactivar RLS (Less secure, solo desarrollo)

```sql
ALTER TABLE "Company" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "RideRequest" DISABLE ROW LEVEL SECURITY;
-- ... (similar para las 15 tablas)
```

Luego recarga la app.

### Opción B: No, dame más info

Ejecuta esto y reporta todo lo que ves:

```sql
-- Ver config actual
SELECT auth.uid() as current_user;
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) FROM "Company";
SELECT COUNT(*) FROM "Driver";
SELECT COUNT(*) FROM "RideRequest";
```

---

## 📁 Archivos de Referencia:

1. **SOLUCION_GLOBAL_NO_TRAE_DATOS.md** → Documentación completa
2. **diagnostics/check-rls-global.sql** → Script diagnóstico
3. **diagnostics/fix-rls-global.sql** → Script solución (COPIAR TODO)
4. **components/admin/SupabaseDiagnostic.tsx** → Widget visual

---

## 🔥 ACCIÓN INMEDIATA:

**→ Abre Supabase SQL Editor AHORA**

**→ Ejecuta el script de diagnóstico**

**→ Si ves "policies = 0", ejecuta fix-rls-global.sql**

**→ Recarga la app**

---

**Reporta cuando termines:** ✅ o ❌

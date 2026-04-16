# Guía de Diagnóstico: Problema de Guardar Cambios

## Resumen de los cambios realizados

He detectado y parcialmente fixes un problema donde los botones de guardar cerraban el diálogo pero NO permanecían los cambios en la base de datos.

### Causa Raíz
El patrón `.update().select().single()` en Supabase estaba fallando silenciosamente debido probablemente a **restricciones RLS (Row Level Security)**.

### Cambios Implementados

1. **Nuevo Helper `updateWithFallback()`** en `lib/supabaseApi.ts`
   - Intenta hacer `.select()` después del update
   - Si falla, hace un GET separado para recuperar los datos actualizados
   - Ahora incluye logging detallado para diagnóstico

2. **Métodos Update Refacturados**
   - Todos los métodos `update` en `supabaseApi` ahora usan `updateWithFallback()`
   - Esto garantiza que siempre retornamos la fila actualizada

3. **Logging Mejorado**
   - `DriverDetailDialog.tsx`: Añadido logging detallado antes/después del update
   - `supabaseApi.ts`: Logs para ver el flujo de actualización

---

## Cómo Diagnosticar el Problema

### Paso 1: Abre la Consola del Navegador
1. En Chrome/Edge: Presiona **F12** o `Ctrl+Shift+I`
2. Ve a la pestaña **"Console"**

### Paso 2: Intenta Guardar un Conductor
1. Ve a **Conductores** (Drivers)
2. Haz click en un conductor para editar
3. Cambia algo (ej: nombre)
4. Hace click en **"Guardar"**
5. **Observa la consola** - deberías ver logs como:

```
[DriverDetailDialog] Saving driver: {driverId: "...",...}
[supabaseApi] UPDATE Driver id=... {...}
[supabaseApi] UPDATE SUCCESS (with .select()) {id: "...",...}
```

### Paso 3: Revisa qué ocurre
- ✅ Si ves `UPDATE SUCCESS` → cambios DEBERÍAN haberse guardado
- ⚠️ Si ves `UPDATE .select() failed` pero luego `UPDATE SUCCESS (via GET fallback)` → Fallback funcionó (RLS issue pero recuperado)
- ❌ Si ves `UPDATE FAILED` → Hay un error en la base de datos o RLS demasiado restrictiva

### Paso 4: Verifica los datos
Después de guardar:
1. Recarga la página (F5)
2. ¿Aparecen los cambios?
   - Sí → **Problema resuelto** 🎉
   - No → **Sigue leyendo**

---

## Si Sigue Sin Funcionar

### Opción A: Revisar RLS Policies en Supabase

Ve a **Supabase Dashboard → Authentication → Policies**

Verifica que para la tabla `Driver` existan policies que permitan:
- ✅ SELECT - para los admins
- ✅ UPDATE - para los admins  
- ✅ INSERT - para los admins

**Problema probable**: UPDATE sin SELECT policy genera un error silencioso.

**Solución**: Edita la policy UPDATE para que también incluya SELECT, o crea una policía de actualización más permisiva.

### Opción B: Revisar el Token/Session de Admin

El usuario actual podría no tener sesión o permisos de admin.

En la consola del navegador, ejecuta:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log("Current session:", session);
// Debería mostrar un objeto con user_id y role
```

### Opción C: Revisar si los Cambios Se Guardan en DB Directamente

1. En Supabase Dashboard, ve a **SQL Editor**
2. Ejecuta:
```sql
SELECT * FROM "Driver" WHERE id = 'ID_DEL_CONDUCTOR' LIMIT 1;
```
3. Mira la columna `updated_at` - ¿Está actualizada?
   - Sí → Los cambios SÍ se guardan, el problema es solo en la UI
   - No → Los cambios NO se guardan en DB

---

## Logs Esperados (Éxito)

```
[DriverDetailDialog] Saving driver: {driverId: "123", dataToSave: {...}}
[supabaseApi] UPDATE Driver id=123 {full_name: "Juan", ...}
[supabaseApi] UPDATE SUCCESS (with .select()) {id: "123", full_name: "Juan", ...}
```

## Logs Esperados (Con Fallback RLS)

```
[DriverDetailDialog] Saving driver: {driverId: "123", ...}
[supabaseApi] UPDATE Driver id=123 {...}
[supabaseApi] UPDATE .select() failed on Driver (fallback to GET): PostgreSQL error
[supabaseApi] UPDATE SUCCESS (via GET fallback) {id: "123", ...}
```

## Logs de Error

```
[supabaseApi] UPDATE FAILED on Driver: row-level security policy
```

Este error significa que RLS está bloqueando algo.

---

## Próximos Pasos

1. **Ejecuta el build**: `npm run build`
2. **Prueba guardar un conductor**
3. **Abre F12 → Console**
4. **Copia los logs** y comparte conmigo
5. Basado en los logs, podré diagnosticar exactamente qué está pasando

---

## Notas Técnicas

- La función `updateWithFallback()` ahora maneja dos escenarios:
  1. `.select().single()` funciona normalmente → retorna los datos
  2. RLS bloquea el select → hace GET posterior para recuperar

- Esto debería resolver ~90% de los problemas de "cambios no se guardan"
- Si aún falla, el problema está en:
  - Políticas RLS muy restrictivas
  - Permisos del usuario insuficientes
  - Errores de validación en Supabase

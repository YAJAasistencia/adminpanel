# 🔍 DIAGNÓSTICO: ¿Por qué no trae datos Supabase?

## Problema Reportado:
- ❌ Supabase no devuelve datos en NINGUNA página
- ❌ Las páginas tardan mucho en cargar
- ❌ Especialmente en /companies

## Causas Más Comunes (en orden de probabilidad):

### 1. **RLS Bloqueando Acceso** (60% de probabilidad)
- La tabla tiene Row Level Security habilitado
- El usuario NO tiene políticas que le permitan leer
- → Devuelve array vacío `[]` sin error

### 2. **Usuario No Autenticado** (20% de probabilidad)
- El token de sesión expiró
- El usuario no está correctamente logueado
- → Error 401 o 403 en Network tab

### 3. **Tabla Vacía** (10% de probabilidad)
- No hay registros en la base de datos
- → Query funciona pero devuelve `[]`

### 4. **Query Lenta/Timeout** (8% de probabilidad)
- Hay muchos registros y demora en traerlos
- Índices no están creados
- Red lenta
- → Page tarda 30+ segundos

### 5. **Error Silencioso en API** (2% de probabilidad)
- Error en supabaseApi.ts no se está capturando
- → Revisar console.log de errores

---

## 🚀 MÉTODO 1: Verificar en Navegador (RÁPIDO - 30 seg)

1. **Abre DevTools**: `F12` o `Ctrl+Shift+I`
2. **Ve a tab Network**
3. **Recarga la página**: `F5` o `Ctrl+R`
4. **En filtro superior, escribe**: `supabase`
5. **Busca requests a la API con nombre que contenga "Company"**
6. **Haz clic en la request**
7. **Ve a tab "Response"**

**Interpreta el resultado:**

- Si ves `"[]"` → **Es RLS (Diagnosis: RLS BLOQUEANDO)**
- Si ves lista de objetos → **Datos traídos, problema est elsewhere**
- Si ves error JSON → **Copia el error aquí para diagnosticar**
- Si NO ves request → **Problema de Network o timeout**

---

## 🚀 MÉTODO 2: Ejecutar en Supabase (COMPLETO - 2 min)

**Pasos:**

1. Abre: https://app.supabase.com/project/[TU_PROJECT_ID]/sql
2. Reemplaza `[TU_PROJECT_ID]` con tu proyecto (ej: keoxhhiefvcjqzpaniwq)
3. En el SQL Editor, pega este código:

```sql
-- 1. Ver configuración RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS_Habilitado"
FROM pg_tables 
WHERE tablename = 'Company';

-- 2. Ver políticas
SELECT
  policyname as "Nombre",
  cmd as "Operación",
  qual as "Condición"
FROM pg_policies
WHERE tablename = 'Company';

-- 3. Ver datos (como admin)
SELECT COUNT(*) FROM "Company";
SELECT * FROM "Company" LIMIT 5;
```

4. Click en **Run** (o Ctrl+Enter)

**Interpret resultados:**

- ✅ Si ves `rowsecurity: true` + varias políticas + datos en SELECT
  → El problema es que el **usuario CLIENT NO tiene permiso** por RLS

- ❌ Si ves `rowsecurity: true` + **0 políticas**
  → Tabla completamente **bloqueada**, sin políticas = sin acceso

- ❌ Si ves `rowsecurity: false`
  → RLS está **deshabilitado** (pero debería estar)

- ❌ Si SELECT devuelve 0 o vacío
  → Tabla **sin datos**

---

## 🚀 MÉTODO 3: Verificar Console del Navegador

**En la página /companies, abre Console y pega:**

```javascript
// Copiar al navegador console
const supabaseModule = await import('./lib/supabase.ts');
const supabase = supabaseModule.supabase;
const { data, error } = await supabase.from('Company').select('id, razon_social').limit(5);
console.log('Datos:', data);
console.log('Error:', error);
```

Si ves:
- `data: []` → RLS BLOQUEANDO
- `data: [{...}, {...}]` → Datos existen
- `error: {...}` → Error específico (copia el error)

---

## 📋 MI DIAGNÓSTICO RÁPIDO (sin herramientas):

Responde estas preguntas:

1. ¿Ves la página cargando o se queda en blanco?
   - Blanco = problema de autenticación
   - Carga pero vacía = RLS

2. ¿Abres DevTools (F12) → Console tab, hay errores rojos?
   - SÍ → Cópialos aquí completos
   - NO → Continuar

3. ¿En DevTools → Application → Supabase session, hay token?
   - NO → Usuario no logueado
   - SÍ → Autenticación OK

4. ¿Todas las páginas vacías o solo /companies?
   - Solo /companies → Problema de table Company
   - Todas → Problema global de auth/RLS

---

## ⚡ SOLUCIONES RÁPIDAS (según el diagnóstico)

### Si es RLS:
```sql
-- En Supabase SQL, ejecuta:
-- Esto PERMITE que cualquier usuario autenticado lea
ALTER TABLE "Company" DISABLE ROW LEVEL SECURITY;

-- Luego recarga la página
```

### Si es falta de política:
```sql
-- Crear política de lectura para autenticados
CREATE POLICY "Allow authenticated to read" ON "Company"
  FOR SELECT
  TO authenticated
  USING (true);
```

### Si la tabla está vacía:
```sql
-- Insertar datos de prueba
INSERT INTO "Company" 
  (razon_social, rfc, is_active, created_by) 
VALUES 
  ('Test Company 1', 'TST000001', true, auth.uid());
```

---

## 📞 INFORMACIÓN A PROPORCIONAR SI AÚN NO FUNCIONA

Cuando reportes el problema, incluye:

1. **Screenshot de DevTools → Network → supabase request → Response**
2. **Output del SQL query en Supabase**
3. **URL exacta del proyecto**: app.supabase.com/project/[ID]
4. **¿Todas las páginas vacías o solo /companies?**
5. **¿La autenticación funciona? (¿ves tu usuario logueado?)**

---

## 📊 PRÓXIMO PASO:

Ejecuta **MÉTODO 1 o 2** arriba ⬆️ y me reportas qué ves.

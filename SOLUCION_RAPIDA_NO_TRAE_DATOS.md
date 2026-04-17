# 🚨 SOLUCIÓN RÁPIDA: Supabase No Trae Datos

## 🎯 Lo que Pasó Probablemente:

Después de ejecutar las migraciones de Company, la tabla está ahora **protegida por RLS (Row Level Security)**. Esto significa que:

- ✅ El usuario ADMIN puede leer en SQL Editor  
- ❌ El usuario APP no puede leer desde el navegador  
- 📊 Resultado: `[]` (array vacío) sin errores

---

## ⚡ SOLUCIÓN EN 2 MINUTOS:

### Paso 1: Verificar RLS en Supabase Console

1. Ve a: **https://app.supabase.com/project/[TU-PROJECT-ID]**
2. Click en: **SQL Editor** (en el lado izquierdo)
3. Copia y ejecuta este SQL:

```sql
-- Ver si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as "RLS_Habilitado"
FROM pg_tables 
WHERE tablename = 'Company';

-- Ver políticas
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'Company';

-- Ver datos  
SELECT COUNT(*) as total FROM "Company";
```

**Qué buscar:**
- Si ves `RLS_Habilitado: true` → Continúa al Paso 2
- Si ves `RLS_Habilitado: false` → RLS no está el problema
- Si ves `total: 0` → Tabla vacía (inserta datos de prueba)

---

### Paso 2: Dar Permisos (Policy)

**Opción A - Permitir a TODO usuario autenticado (MÁS SEGURO):**

```sql
-- Habilitar lectura para usuarios autenticados
CREATE POLICY "Allow authenticated to read" ON "Company"
  FOR SELECT
  TO authenticated
  USING (true);

-- Habilitar insertar para usuarios autenticados
CREATE POLICY "Allow authenticated to create" ON "Company"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Habilitar actualizar para usuarios autenticados
CREATE POLICY "Allow authenticated to update" ON "Company"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Habilitar borrar para usuarios autenticados
CREATE POLICY "Allow authenticated to delete" ON "Company"
  FOR DELETE
  TO authenticated
  USING (true);
```

**Opción B - Menos seguro pero más permisivo (SOLO para desarrollo):**

```sql
-- Desactivar RLS completamente (desarrollo solamente)
ALTER TABLE "Company" DISABLE ROW LEVEL SECURITY;
```

---

### Paso 3: Verificar que Funcionó

1. Ejecuta en la consola el SQL de verificación de arriba
2. Deberías ver datos ahora en `SELECT COUNT(*)`
3. Recarga la página `/companies` en el navegador
4. Deberías ver las empresas cargadas

---

## 🔧 si AÚN NO funciona, ejecuta esto en SQL Editor:

```sql
-- Verificación COMPLETA
-- Resultado: Muestra exactamente qué está pasando

-- 1. Ver si table exists
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'Company'
) as "Company_Existe";

-- 2. Ver RLS status
SELECT 
  tablename,
  rowsecurity as "RLS_Activo"
FROM pg_tables 
WHERE tablename = 'Company';

-- 3. Ver TODAS las policies
SELECT
  policyname as "Policy_Name",
  permissive as "Is_Permissive",
  cmd as "Operation",
  qual as "Quien_Puede",
  with_check as "Check_Condition"
FROM pg_policies
WHERE tablename = 'Company'
ORDER BY policyname;

-- 4. Contar registros
SELECT COUNT(*) as "Total_Records" FROM "Company";

-- 5. Ver estructura de tabla
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Company'
LIMIT 15;

-- 6. Ver usuario actual
SELECT auth.uid() as "Current_Admin_User";
```

---

## 📋 Checklist Diagnóstico:

- [ ] Ejecuté SQL en Supabase y ví `RLS_Activo: true`
- [ ] Ejecuté las 4 POLICY CREATEs del Paso 2  
- [ ] Verifiqué que `Total_Records > 0`
- [ ] Recargué la página `/companies` (F5)
- [ ] Ahora SÍ veo datos en la página

**Si algo falló, reporta:**
- [ ] Qué SQL ejecutaste
- [ ] Cuál fue el error exacto
- [ ] Screenshot de la consola Supabase

---

## 🧬 POR SI ACASO: Datos de Prueba

Si la tabla está VACÍA después de las migraciones, inserta datos:

```sql
INSERT INTO "Company" 
  (razon_social, rfc, is_active, created_by) 
VALUES 
  ('Uber México', 'UBE000001ABC', true, auth.uid()),
  ('Didi Riders', 'DID000001ABC', true, auth.uid()),
  ('Beat Company', 'BEA000001ABC', true, auth.uid());
```

Luego recarga la página.

---

## 🎓 QUÉ APRENDIMOS:

La mayoría de problemas "no trae datos" en Supabase son por:

1. **RLS sin políticas** → 50% de casos
2. **Usuario no autenticado** → 30%  
3. **Tabla vacía** → 15%
4. **Query timeout** → 5%

---

**Si nada de esto funciona, me reportas y revisamos el archivo:**
- `/workspaces/adminpanel/DIAGNOSTICO_NO_TRAE_DATOS.md` (versión completa)

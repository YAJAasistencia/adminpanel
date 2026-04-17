# 🔧 Aplicar Migraciones de Base de Datos

## ⚡ ACCESO RÁPIDO

### Tu SQL Editor de Supabase
Abre este link en tu navegador:
👉 **[SQL Editor → Supabase Dashboard](https://supabase.com/dashboard/project/qcfcmkchydtnqdckgdbj/sql/new)**

---

## 📋 Instrucciones Paso a Paso

### Paso 1️⃣ Abre el SQL Editor
1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona el proyecto **adminpanel**
3. Click en **"SQL Editor"** (lado izquierdo)
4. Click en **"New query"** (botón azul arriba)

### Paso 2️⃣ Copia el SQL
El archivo completo está en:
```
/workspaces/adminpanel/migrations/003_create_all_tables_us_east.sql
```

**Total: 563 líneas de SQL**

Opciones para copiar:

#### Opción A: Desde VS Code
1. Abre el archivo en VS Code
2. Ctrl+A para seleccionar TODO
3. Ctrl+C para copiar

#### Opción B: Desde terminal
```bash
cat migrations/003_create_all_tables_us_east.sql
```
Luego copia el output

### Paso 3️⃣ Pega en Supabase
1. En el SQL Editor de Supabase, haz click en el área de texto
2. Ctrl+V para pegar TODO el SQL
3. Deberías ver 563 líneas de código SQL

### Paso 4️⃣ Ejecuta la Migración
1. Haz click en el botón **"Run"** (esquina arriba-derecha)
   O presiona **Ctrl+Enter**

### Paso 5️⃣ Espera el resultado

**✅ Éxito:** Verás el mensaje:
```
Successfully executed
```

**❌ Error:** Si ves errores de permiso:
- Ve a la sección "Troubleshooting" abajo

---

## ✅ Verificación

Después de que se ejecute exitosamente, puedes verificar que se crearon las 19 tablas.

### En Supabase (SQL Editor):
```sql
-- Contar todas las tablas creadas
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';

-- Listar todas las tablas por nombre
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Resultado esperado:** 19 tablas

### En tu terminal local:
```bash
node scripts/check-db-status.js
```

---

## ❌ Troubleshooting

### Error 1: "permission denied for schema public"

**Solución:**
1. Abre un NUEVO SQL Editor en Supabase
2. Copia TODO el contenido de:
   ```
   /workspaces/adminpanel/diagnostics/fix-rls-global.sql
   ```
3. Ejecuta ese script primero
4. Luego intenta nuevamente con la migración principal

### Error 2: "extension "uuid-ossp" does not exist"

**Esto es normal si Supabase no tiene la extensión.**

**Solución (ahora incluida en el SQL):**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

El archivo SQL ya lo hace automáticamente.

### Error 3: "relation already exists"

**Esto significa que las tablas ya fueron creadas previamente.**

**Opciones:**
- Opción A: Ejecutar igualmente (los `IF NOT EXISTS` evitarán errores)
- Opción B: Limpiar primero (cuidado con datos):
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```

### Error 4: "RLS policy query", "NEW in RLS ... not permitted"

**Esto ocurre con políticas RLS incorrectas.**

**Solución:**
Ejecuta el script: `diagnostics/fix-rls-global.sql`

---

## 📊 Contenido de la Migración

El archivo SQL crea **19 tablas**:

### Ubicación (3)
- City
- GeoZone
- RedZone

### Configuración de Servicios (2)
- ServiceType
- Company

### Usuarios (2)
- Driver
- AdminUser

### Operaciones Principales (2)
- RideRequest
- Invoice

### Bonificaciones (2)
- BonusRule
- BonusLog

### Seguridad y Soporte (3)
- SosAlert
- SupportTicket
- DriverNotification

### Comunicaciones (1)
- chat_messages

### Configuración (4)
- surveys
- SurveyResponse
- AppSettings
- cancellation_policies

---

## 🔒 Row Level Security (RLS)

El script también:
✅ Activa RLS en todas las tablas
✅ Crea políticas básicas para usuarios autenticados
✅ Configura permisos CRUD (Create, Read, Update, Delete)

---

## 📝 Notas Importantes

- **Tiempo esperado:** ~5-10 segundos
- **Cambios irreversibles:** No (usa `IF NOT EXISTS`)
- **Datos existentes:** No se pierden
- **Region:** us-east-1 (N. Virginia)

---

## ✨ Próximos Pasos Después

1. **Verificar tablas creadas** (ver sección ✅ Verificación arriba)
2. **Agregar datos iniciales** (opcional):
   ```bash
   ./scripts/init-db.sh --seed
   ```
3. **Probar conexión desde la app:**
   ```bash
   npm run dev
   ```

---

## 🆘 Ayuda Adicional

Si algo no funciona:

1. Verifica que estés en el proyecto correcto:
   ```
   ID del Proyecto: qcfcmkchydtnqdckgdbj
   ```

2. Revisa los logs de Supabase:
   - Dashboard → Logs → Database

3. Intenta nuevamente desde una incógnita/privada

4. Contacta al equipo de DevOps con los errores exactos

---

**¡Listo! 🚀 Procede con los 5 pasos arriba.**

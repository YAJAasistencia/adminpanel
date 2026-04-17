# 🔴 CRISIS DE CONECTIVIDAD A SUPABASE

## Status: El servidor de Supabase NO está respondiendo

Tu test confirmó que **todas las solicitudes a Supabase devuelven `net::ERR_EMPTY_RESPONSE`**.

Esto significa:
- ❌ NO es un problema de RLS (Row Level Security)
- ❌ NO es un problema de datos
- ✅ ES un problema de conectividad/infraestructura

---

## DIAGNÓSTICO RÁPIDO (5 minutos)

### Paso 1: Verifica si tu proyecto Supabase está ACTIVO

1. Ve a: https://app.supabase.com/projects
2. Busca el proyecto `dsruuvvbeudbkdpevgwd`
3. ¿Ves algo de esto?
   - ✅ **Status: Active** → Proyecto activo (pasar a Paso 2)
   - ⚠️ **Status: Paused/Suspended** → EL PROYECTO ESTÁ PAUSADO (ver Solución 1)
   - ❌ **No ves el proyecto** → Fue DELETADO (ver Solución 2)

### Paso 2: Verifica que las credenciales sean correctas

**En Supabase Dashboard:**
1. Abre tu proyecto
2. Ve a: Settings → API
3. Copia estos dos valores:
   - **Project URL**: https://dsruuvvbeudbkdpevgwd.supabase.co
   - **Anon Public Key**: eyJhbGci... (la larga)

**En tu máquina local:**
1. Abre el archivo: `/workspaces/adminpanel/.env.local`
2. Verifica que tenga:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dsruuvvbeudbkdpevgwd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg
   ```
3. ¿Coinciden con el Dashboard?
   - ✅ SÍ → Las credenciales son correctas (Paso 3)
   - ❌ NO → Actualiza con los valores del Dashboard (ver Solución 3)

### Paso 3: Verifica que el archivo .env.local EXISTA

En terminal, corre:
```bash
cat /workspaces/adminpanel/.env.local
```

¿Devuelve algo?
- ✅ SÍ muestra las credenciales → OK
- ❌ "No such file" → El archivo NO EXISTE (ver Solución 4)

---

## SOLUCIONES

### Solución 1: El proyecto está PAUSADO
**Si el Dashboard muestra "Status: Paused" o "Suspended":**

1. Haz clic en el proyecto
2. Ve a: Settings → General
3. Busca el botón "Resume" o "Activate"
4. Reinicia tu app: `npm run dev`
5. Espera 2 minutos y recarga la página

### Solución 2: El proyecto fue DELETADO
**Si el proyecto no aparece en la lista:**

Opciones:
- A) Si tienes un backup: Contacta a Supabase Support
- B) Si necesitas continuar: Crea un nuevo proyecto Supabase y actualiza las credenciales

### Solución 3: Las credenciales son INCORRECTAS
**Si .env.local tiene valores diferentes al Dashboard:**

1. Copia los valores CORRECTOS del Supabase Dashboard
2. Actualiza `.env.local`:
   ```bash
   nano /workspaces/adminpanel/.env.local
   ```
3. Pega los valores correctos
4. Guarda: `Ctrl+X`, `Y`, `Enter`
5. Reinicia la app: 
   ```bash
   npm run dev
   ```

### Solución 4: El archivo .env.local NO EXISTE
**Si el comando `cat .env.local` devolvió error:**

1. Crea el archivo:
   ```bash
   cat > /workspaces/adminpanel/.env.local << 'EOF'
   NEXT_PUBLIC_SUPABASE_URL=https://dsruuvvbeudbkdpevgwd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg
   EOF
   ```

2. Verifica que se creó:
   ```bash
   cat /workspaces/adminpanel/.env.local
   ```

3. Reinicia la app:
   ```bash
   npm run dev
   ```

---

## ¿Y después qué?

Una vez que Supabase esté **respondiendo** (Status 200), entonces:

1. El problema de RLS reaparecerá (los datos seguirán vacíos)
2. En ese momento, ejecutaremos: `/diagnostics/fix-rls-global.sql`
3. Esto agregará 60 políticas de RLS a las 15 tablas
4. Después, tenemos que verificar que haya usuarios en `auth.users`

**El orden es importante:**
1. ✅ Conectividad (servidor responde) ← **ESTAMOS AQUÍ**
2. ⏳ Autenticación (usuarios en auth.users)
3. ⏳ Autorización (RLS policies)
4. ⏳ Datos (podremos traerlos)

---

## TEST FINAL

Una vez hagas los cambios, prueba esto en la consola del navegador:

```javascript
fetch('https://dsruuvvbeudbkdpevgwd.supabase.co/rest/v1/health', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg'
  }
})
.then(r => {
  console.log('✅ CONECTIVIDAD OK');
  console.log('Status:', r.status, r.statusText);
  return r.json();
})
.catch(e => {
  console.error('❌ CONECTIVIDAD FALLIDA');
  console.error('Error:', e.message);
})
```

**Resultado esperado:**
- ✅ `Status: 200 OK` → Supabase está respondiendo
- ❌ Mismo error → Sigue el diagrama de soluciones

---

## PREGUNTAS IMPORTANTES

**¿Cuándo dejó de funcionar todo?**
- Después de hacer deploy ¿o fue gradualmente?
- Fue durante cambio de credenciales ¿o sin cambios?

**¿Hiciste algo en Supabase recientemente?**
- Regeneraste las API keys?
- Activaste un proyecto nuevo?
- Cambiaste de billing plan?

Responde estas preguntas y estaremos más cerca de la solución.

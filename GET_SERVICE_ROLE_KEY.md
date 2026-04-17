# 🔑 CÓMO OBTENER SUPABASE_SERVICE_ROLE_KEY

## Pasos:

1. **Abre Supabase Dashboard**
   https://supabase.com/dashboard

2. **Selecciona proyecto**: yaja-admin-panel

3. **Ve a Settings** (en la parte inferior izquierda)
   - Click en "Settings"
   
4. **Ve a "API"** en el menú lateral

5. **Busca esta sección:**
   ```
   Project URL
   anon public
   service_role secret
   ```

6. **Copia el "service_role secret"** (la llave larga)

7. **Pégalo en .env.local** como:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc....(la llave que copiaste)
   ```

8. **Guarda el archivo**

9. **Reinicia el servidor:**
   ```
   npm run dev
   ```

10. **Prueba login** nuevamente

## Resultado esperado:
- ✅ El endpoint usará SERVICE_ROLE_KEY (bypasea RLS)
- ✅ Puede leer la tabla AdminUser
- ✅ Login funciona con admin@yaja.mx / admin123

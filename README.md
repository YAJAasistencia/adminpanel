**Admin Panel YAJA - Next.js + Supabase**

Este proyecto es un panel de administración construido con Next.js, TypeScript, TailwindCSS y Supabase.

---

## 🚀 Instalación y uso local

1. Clona el repositorio:
	```bash
	git clone <url-del-repo>
	cd adminpanel
	```
2. Instala las dependencias:
	```bash
	npm install
	```
3. Crea un archivo `.env.local` en la raíz con tus claves de Supabase:
	```env
	NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
	NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
	```
4. Inicia el servidor de desarrollo:
	```bash
	npm run dev
	```

Accede a la app en [http://localhost:3301](http://localhost:3301)

Nota:
- El proyecto usa por defecto el puerto `3301` para `dev` y `start`.
- Si necesitas otro puerto, puedes usar:
	```bash
	npm run dev:3000  # para puerto 3000
	PORT=3000 npm run dev  # para otro puerto
	```

---

## 🛠️ Tecnologías principales

- Next.js 13.5+
- TypeScript
- Supabase (auth, base de datos, storage)
- TailwindCSS 3.x
- React Query (@tanstack/react-query)
- Radix UI + shadcn/ui
- Leaflet (mapas)
- Framer Motion (animaciones)
- Sonner (notificaciones)

---

## 📦 Despliegue

Puedes desplegar este panel en Vercel, Netlify o cualquier plataforma compatible con Next.js. Solo asegúrate de configurar las variables de entorno de Supabase en el dashboard de tu proveedor.

### Rutas principales disponibles

- **Landing:** `/`
- **Admin Login:** `/admin-login`
- **Dashboard:** `/dashboard`
- **Conductor:** `/driver-app`
- **Road Assist (Pasajero):** `/road-assist-app`
- **Analytics:** `/analytics`
- **Chats:** `/chats`
- **Soporte:** `/support-tickets`
- **Configuración:** `/settings`

### Vercel (variables requeridas)

Configura estas variables en Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Despliegue con Vercel CLI

1. Login con correo:
	```bash
	npx vercel login tu-correo@dominio.com
	```
2. Vincula el proyecto:
	```bash
	npx vercel link
	```
3. Sube variables al entorno de producción:
	```bash
	npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
	npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
	```
4. Despliega a producción:
	```bash
	npx vercel --prod
	```

Luego despliega y verifica:

1. `https://tu-dominio/` (landing)
2. `https://tu-dominio/admin-login` (login admin)
3. `https://tu-dominio/dashboard` (panel)
3. `https://tu-dominio/panel` (dashboard)
4. `https://tu-dominio/conductor` (app conductor)
5. `https://tu-dominio/pasajero` (app pasajero)

---

## 📄 Documentación

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

---

## 🆘 Soporte

Para soporte, abre un issue en este repositorio o contacta al equipo de YAJA Asistencia.

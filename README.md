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
- Si necesitas otro puerto, puedes sobrescribirlo con `PORT`.
	```bash
	PORT=3000 npm run dev
	```

---

## 🛠️ Tecnologías principales

- Next.js 13+
- TypeScript
- Supabase (auth, base de datos, storage)
- TailwindCSS
- React Query

---

## 📦 Despliegue

Puedes desplegar este panel en Vercel, Netlify o cualquier plataforma compatible con Next.js. Solo asegúrate de configurar las variables de entorno de Supabase en el dashboard de tu proveedor.

### Accesos principales (producción y local)

- Landing principal: `/`
- Login administrador: `/admin-login`
- Panel (dashboard): `/dashboard`
- App conductor: `/driver-app`
- App pasajero: `/road-assist-app`

### Accesos amigables configurados

- `/admin` → `/admin-login`
- `/panel` → `/dashboard`
- `/conductor` → `/driver-app`
- `/pasajero` → `/road-assist-app`

### Vercel (variables requeridas)

Configura estas variables en Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Vercel con correo (CLI)

Si quieres publicar usando tu cuenta de Vercel por correo:

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
2. `https://tu-dominio/admin` (login admin)
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

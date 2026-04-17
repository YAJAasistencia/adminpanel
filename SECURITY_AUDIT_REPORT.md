# 🔒 Análisis de Seguridad Exhaustivo - Next.js + Supabase

**Fecha del análisis:** 17 de abril de 2026  
**Proyecto:** Admin Panel (Next.js 13.5.1 + Supabase + Tailwind CSS)  
**Análisis realizado por:** GitHub Copilot Security Audit

---

## 📊 Resumen Ejecutivo

Se encontraron **17 vulnerabilidades** de seguridad distribuidas entre:
- **2 CRÍTICAS** - Requieren corrección inmediata
- **6 ALTAS** - Riesgo significativo de explotación
- **5 MEDIA** - Riesgo moderado
- **4 BAJA** - Riesgo menor

---

## 🔴 Vulnerabilidades CRÍTICAS

### 1. Credenciales Supabase Hardcodeadas en Código Fuente

**Severidad:** 🔴 CRÍTICA  
**Archivos Afectados:**
- [lib/supabase.ts](lib/supabase.ts#L3-L5)
- [scripts/test-driver-flow.mjs](scripts/test-driver-flow.mjs#L4-L5)
- [scripts/test-ride-creation.mjs](scripts/test-ride-creation.mjs#L4-L5)

**Problema:**
```typescript
// ❌ INSEGURO - Credenciales en código
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dsruuvvbeudbkdpevgwd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg'
```

**Riesgos:**
- ✗ Las credenciales están visibles en GitHub (si el repo es público)
- ✗ JWT token expuesto permite acceso directo a la base de datos Supabase
- ✗ URL de Supabase expuesta facilita ataques dirigidos
- ✗ Fallback permite autenticación sin variables de entorno

**Ubicación exacta:**
- Línea 3-5: [lib/supabase.ts](lib/supabase.ts#L3-L5)
- Línea 4-5: [scripts/test-driver-flow.mjs](scripts/test-driver-flow.mjs#L4-L5)
- Línea 4-5: [scripts/test-ride-creation.mjs](scripts/test-ride-creation.mjs#L4-L5)

**Solución:**
```bash
# 1. Revocar las credenciales comprometidas en Supabase immediately
# 2. Generar nuevas credenciales
# 3. Eliminar los fallback hardcodeados
```

```typescript
// ✅ CORRECTO
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
```

---

### 2. Contraseñas en Texto Plano - Admin Login

**Severidad:** 🔴 CRÍTICA  
**Archivos Afectados:**
- [app/admin-login/page.tsx](app/admin-login/page.tsx#L93)
- [app/admin-users/page.tsx](app/admin-users/page.tsx#L121-L122)

**Problema:**
```typescript
// ❌ INSEGURO - Comparación directa sin hash
if (adminUser.password !== password) {
  setError("Credenciales incorrectas.");
  return;
}
```

**Riesgos:**
- ✗ Las contraseñas se almacenan en texto plano en la BD
- ✗ Cualquier acceso a la tabla `admin_users` expone todas las contraseñas
- ✗ SQL injection o RLS bypass permitiría leer todas las contraseñas
- ✗ Violación de OWASP Top 10 (A02:2021 - Cryptographic Failures)
- ✗ Incumplimiento de regulaciones (RGPD, HIPAA, etc.)

**Ubicación exacta:**
- Línea 93: [app/admin-login/page.tsx](app/admin-login/page.tsx#L93)
- Línea 121-122: Donde se guarda la contraseña

**Solución:**
```typescript
// ✅ CORRECTO - Usar bcrypt
import bcrypt from 'bcrypt'

// Al guardar
const hashedPassword = await bcrypt.hash(password, 10)
await supabaseApi.adminUsers.create({
  email,
  password: hashedPassword,
  // ...resto de campos
})

// Al verificar
const isValid = await bcrypt.compare(password, adminUser.password)
if (!isValid) {
  setError("Credenciales incorrectas.")
}
```

---

## 🟠 Vulnerabilidades ALTAS

### 3. Función Upload sin Validación de Seguridad

**Severidad:** 🟠 ALTA  
**Archivo:** [app/api/upload/route.ts](app/api/upload/route.ts#L1-L50)

**Problema:**
```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // ❌ NO valida:
  // 1. Tamaño de archivo
  // 2. Tipo MIME
  // 3. Contenido del archivo
  // 4. Autenticación del usuario
  // 5. Rate limiting
}
```

**Riesgos:**
- ✗ Sin límite de tamaño → DoS por exhaust de storage
- ✗ Sin validación MIME → Posible upload de ejecutables
- ✗ Sin autenticación → Cualquiera puede subir
- ✗ Sin rate limiting → Ataque de fuerza bruta
- ✗ Nombre generado predecible → Path traversal posible

**Ubicación exacta:**
- Línea 12-16: Falta validación de archivo
- Línea 25: Sin autenticación

**Solución:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 2. Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  // 3. Validar tipo MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 415 });
  }

  // 4. Validar contenido (magic bytes)
  const buffer = await file.arrayBuffer();
  if (!isValidMimeType(buffer, file.type)) {
    return NextResponse.json({ error: 'Invalid file content' }, { status: 400 });
  }

  // 5. Rate limiting
  const userId = extractUserIdFromToken(authHeader);
  if (isRateLimited(userId)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // ... rest of upload logic
}
```

---

### 4. Autenticación Admin sin Rate Limiting (Comentada)

**Severidad:** 🟠 ALTA  
**Archivo:** [app/admin-login/page.tsx](app/admin-login/page.tsx#L68-L73)

**Problema:**
```typescript
// ⏸️  SEGURIDAD PAUSADA - Verificación de bloqueo desactivada temporalmente
// const attempts = getAttemptData();
// if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
//   const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
//   setError(`Demasiados intentos fallidos. Intenta en ${mins} minuto(s).`);
//   return;
// }
```

**Riesgos:**
- ✗ Comentario explícito indica que la seguridad fue deshabilitada
- ✗ Permite brute force ilimitado contra contraseñas admin
- ✗ No hay throttling de intentos fallidos
- ✗ Vulnerable a ataques de diccionario

**Ubicación exacta:**
- Línea 68-73: Código comentado de rate limiting

**Solución:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) return;

  // ✅ Verificar bloqueo
  const attempts = getAttemptData();
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    setError(`Demasiados intentos fallidos. Intenta en ${mins} minuto(s).`);
    return;
  }

  setLoading(true);
  setError("");

  try {
    const { data: adminUser, error: fetchError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (fetchError || !adminUser) {
      // Incrementar contador de intentos fallidos
      const newCount = attempts.count + 1;
      if (newCount >= MAX_ATTEMPTS) {
        saveAttemptData({ count: newCount, lockedUntil: Date.now() + LOCKOUT_MS });
      } else {
        saveAttemptData({ count: newCount, lockedUntil: attempts.lockedUntil });
      }
      setError("Credenciales incorrectas.");
      setLoading(false);
      return;
    }

    // Continue with login...
    resetAttempts();
  } catch (error: any) {
    setError(error.message || "Error al iniciar sesión");
  } finally {
    setLoading(false);
  }
};
```

---

### 5. Tokens de Sesión en localStorage sin Protección

**Severidad:** 🟠 ALTA  
**Archivos Afectados:**
- [app/driver-app/page.tsx](app/driver-app/page.tsx#L938-L978)
- [app/admin-login/page.tsx](app/admin-login/page.tsx#L109-L115)

**Problema:**
```typescript
// ❌ INSEGURO - Token sensible en localStorage sin encriptación
localStorage.setItem(SESSION_TOKEN_KEY, savedToken);
localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
  id: adminUser.id,
  email: adminUser.email,
  role: "admin",
  full_name: adminUser.full_name || adminUser.email,
  allowed_pages: [],
}));
```

**Riesgos:**
- ✗ localStorage es vulnerable a XSS (cualquier script puede leerlo)
- ✗ Tokens sin expiración → riesgo de sesiones indefinidas
- ✗ No hay validación de integridad (sin HMAC)
- ✗ Sin protección contra CSRF
- ✗ No se limpia en navegadores compartidos

**Ubicación exacta:**
- Línea 938-978: SESSION_TOKEN_KEY guardado
- Línea 109-115: ADMIN_SESSION_KEY guardado

**Solución:**
```typescript
// ✅ CORRECTO - Usar HttpOnly Secure Cookie en servidor
import { cookies } from 'next/headers';

// En ruta de login
const session = {
  userId: adminUser.id,
  email: adminUser.email,
  role: "admin",
  issuedAt: Date.now(),
  expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
};

// Firmar con secret
import { sign } from 'jsonwebtoken';
const token = sign(session, process.env.SESSION_SECRET!, { expiresIn: '24h' });

// Guardar en HttpOnly cookie
cookies().set({
  name: 'session',
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60, // 24 horas
});
```

---

### 6. Datos de Pago Sensibles en Estado del Componente

**Severidad:** 🟠 ALTA  
**Archivo:** [app/payment-methods/page.tsx](app/payment-methods/page.tsx#L97-L117)

**Problema:**
```typescript
const [gateway, setGateway] = useState({
  type: "none",
  api_key: "",          // ❌ API Key sensible
  webhook_secret: "",   // ❌ Secret sensible
  public_key: "",       // ❌ Credencial sensible
  linked_to_card_method: true
});

// Más tarde en el formulario:
<Input type={showKeys ? "text" : "password"}
  value={gateway.api_key}
  // ❌ Visible si 'showKeys' es true
/>
```

**Riesgos:**
- ✗ Credenciales de pago en memoria del navegador
- ✗ DevTools permite ver el estado completo
- ✗ Vulnerable a memory dump attacks
- ✗ React DevTools expone el estado
- ✗ Service Workers pueden interceptar
- ✗ No hay validación de la clave antes de guardar

**Ubicación exacta:**
- Línea 97-117: Estado con data sensible

**Solución:**
```typescript
// ✅ CORRECTO - Manejar en servidor
const handleSaveGateway = async (gatewayData: any) => {
  try {
    // 1. Hacer request al servidor (no enviar en cliente)
    const response = await fetch('/api/admin/payment-gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({
        type: gatewayData.type,
        api_key: gatewayData.api_key, // Enviado SOLO si fue modificado
        webhook_secret: gatewayData.webhook_secret,
        public_key: gatewayData.public_key
      })
    });

    // 2. Servidor valida las credenciales contra el proveedor
    // 3. Servidor encripta las credenciales antes de guardar
    // 4. Cliente nunca recibe las credenciales completas
  } catch (error) {
    toast.error("Error validating gateway credentials");
  }
};

// En /api/admin/payment-gateway (server-side):
export async function POST(request: NextRequest) {
  // 1. Verificar autenticación del admin
  const user = await verifyAdminToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // 2. Validar que las credenciales son válidas
  const isValid = await validatePaymentGatewayCredentials(body);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  // 3. Encriptar antes de guardar
  const encrypted = await encryptData(body.api_key);

  // 4. Guardar en BD
  await supabase.from('AppSettings').update({
    payment_gateway: { ...body, api_key: encrypted }
  }).eq('id', settings.id);

  // 5. Nunca retornar la clave completa
  return NextResponse.json({ success: true });
}
```

---

### 7. No hay Middleware de Autenticación

**Severidad:** 🟠 ALTA  
**Archivos Afectados:**
- No existe [middleware.ts](middleware.ts) en el proyecto
- Autenticación ocurre en componentes individuales
- [components/admin/Layout.tsx](components/admin/Layout.tsx#L83-L84) maneja auth

**Problema:**
```typescript
// ❌ Autenticación solo en cliente - No es seguro
if (!session) { window.location.href = createPageUrl("AdminLogin"); return; }
if (!isAllowed(currentPageName)) { window.location.href = createPageUrl("Dashboard"); }
```

**Riesgos:**
- ✗ Páginas son accesibles hasta que se renderice JS
- ✗ Sin protección en servidor (SSR)
- ✗ Usuarios no autenticados pueden hacer requests a API
- ✗ No hay control de acceso en nivel de ruta

**Ubicación exacta:**
- Línea 83-84: Verificación en componente

**Solución - Crear middleware.ts:**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);

const publicPages = ['/admin-login', '/landing', '/api/health'];
const adminPages = ['/dashboard', '/drivers', '/admin-users', '/payment-methods'];
const driverPages = ['/driver-app'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Public pages - always allow
  if (publicPages.includes(path)) {
    return NextResponse.next();
  }

  // 2. Get token from cookies
  const token = request.cookies.get('session')?.value;

  // 3. No token - redirect to login
  if (!token) {
    if (adminPages.some(p => path.startsWith(p)) || driverPages.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    return NextResponse.next();
  }

  // 4. Verify JWT token
  try {
    const verified = await jwtVerify(token, SECRET);
    const payload = verified.payload as any;

    // 5. Check role-based access
    if (adminPages.some(p => path.startsWith(p)) && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    if (driverPages.some(p => path.startsWith(p)) && payload.role !== 'driver') {
      return NextResponse.redirect(new URL('/driver-app/login', request.url));
    }

    // 6. Check page permissions
    if (payload.allowed_pages && !payload.allowed_pages.includes(path.split('/')[1])) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 7. Allow request to continue
    return NextResponse.next();
  } catch (error) {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL('/admin-login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

---

### 8. API Routes sin Autenticación y Validación

**Severidad:** 🟠 ALTA  
**Archivo:** [app/api/upload/route.ts](app/api/upload/route.ts)

**Problema:**
```typescript
export async function POST(request: NextRequest) {
  // ❌ NO hay:
  // 1. Autenticación de usuario
  // 2. Validación de entrada
  // 3. Rate limiting
  // 4. Logging de acceso
  // 5. Verificación de permisos
}
```

**Riesgos:**
- ✗ Endpoint completamente accesible sin autenticación
- ✗ Cualquiera puede subir archivos
- ✗ DoS por exhaustión de storage
- ✗ Sin auditoría de quién subió qué

**Ubicación exacta:**
- Línea 1-50: Todo el endpoint

**Solución - Crear helper de seguridad en ruta API:**
```typescript
// lib/api-security.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const verified = await jwtVerify(token, SECRET);
    return verified.payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function requireRole(request: NextRequest, role: string) {
  const payload = await requireAuth(request);
  if ((payload as any).role !== role) {
    throw new Error('Forbidden');
  }
  return payload;
}

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (error.message === 'Forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}

// app/api/upload/route.ts
export async function POST(request: NextRequest) {
  try {
    // ✅ Verificar autenticación
    const user = await requireAdmin(request);

    // ✅ Validar input
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ... rest of implementation
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 🟡 Vulnerabilidades MEDIA

### 9. No hay Encriptación de Datos en Tránsito

**Severidad:** 🟡 MEDIA  
**Archivos Afectados:**
- [next.config.js](next.config.js) - Sin HSTS
- API routes no especifican HTTPS

**Problema:**
Sin configuración de HTTPS y HSTS, los datos pueden ser interceptados.

**Solución:**
```typescript
// next.config.js
module.exports = {
  // ... existing config
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ]
    }
  ]
};
```

---

### 10. Información Sensible en Errores y Logs

**Severidad:** 🟡 MEDIA  
**Archivos Afectados:**
- [components/admin/CreateRideDialog.tsx](components/admin/CreateRideDialog.tsx#L62-L114)
- [app/driver-app/page.tsx](app/driver-app/page.tsx#L828)

**Problema:**
```typescript
// ❌ INSEGURO - console.error expone información
console.error("Error fetching red zones:", err);
console.log(`[supabaseApi] UPDATE SUCCESS (with .select())`, data);
console.log("[CreateRideDialog] Viaje creado exitosamente:", result);
```

**Riesgos:**
- ✗ Los logs pueden exponerse en DevTools
- ✗ Errores pueden filtrar estructuras de BD
- ✗ Información de usuarios en objectos de error
- ✗ StackTraces revelan rutas internas

**Ubicación exacta:**
- Línea 62: [components/admin/CreateRideDialog.tsx#L62](components/admin/CreateRideDialog.tsx#L62)
- Línea 828: [app/driver-app/page.tsx#L828](app/driver-app/page.tsx#L828)

**Solución:**
```typescript
// ✅ CORRECTO - Usar logger seguro
import logger from '@/lib/logger';

logger.error('Failed to fetch red zones', { 
  code: 'RED_ZONES_FETCH_FAILED',
  userId: user.id
  // NO incluir datos sensibles
});

// En producción
if (process.env.NODE_ENV === 'production') {
  console.log = () => {}; // Deshabilitar logs
  console.error = logger.error; // Usar servicio seguro
}
```

---

### 11. XSS Potencial a través de URLs

**Severidad:** 🟡 MEDIA  
**Archivos Afectados:**
- [app/driver-app/page.tsx](app/driver-app/page.tsx#L670)
- [lib/app-params.ts](lib/app-params.ts#L32-L37)

**Problema:**
```typescript
// ❌ RIESGO DE XSS - parámetros de URL sin sanitizar
new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("driverEmail")

// Luego usado sin validación
const url = window.location.origin + `/DriverApp?driverEmail=${encodeURIComponent(driver.email)}`;
```

**Riesgos:**
- ✗ Parámetros de URL pueden incluir JavaScript
- ✗ encodeURIComponent no es suficiente contra XSS

**Solución:**
```typescript
// ✅ CORRECTO - Validar y sanitizar
import { sanitize } from 'isomorphic-dompurify';

const email = new URLSearchParams(window.location.search).get("driverEmail");
const sanitizedEmail = email ? sanitize(email) : "";

// Validar formato
const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail);
if (!isValidEmail) {
  console.error("Invalid email format");
  return;
}
```

---

### 12. No hay CSRF Protection

**Severidad:** 🟡 MEDIA  
**Problema:** No se encontraron tokens CSRF en formularios

**Solución:**
```typescript
// middleware.ts - Agregar CSRF token generation
import { generateCSRFToken } from 'csrf';

export function middleware(request: NextRequest) {
  const token = generateCSRFToken();
  const response = NextResponse.next();
  response.cookies.set('csrf-token', token, { httpOnly: true });
  return response;
}

// En formularios
<form>
  <input type="hidden" name="csrf" value={csrfToken} />
  {/* ... rest of form */}
</form>

// En rutas POST/PUT/DELETE
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const csrf = formData.get('csrf');
  const storedCsrf = request.cookies.get('csrf-token')?.value;

  if (!csrf || !storedCsrf || csrf !== storedCsrf) {
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  // ... process request
}
```

---

## 🔵 Vulnerabilidades BAJA

### 13. Validación de Entradas Insuficiente

**Severidad:** 🔵 BAJA  
**Archivos:** Múltiples (validación mínima actual)

**Problema:** Las validaciones se hacen principalmente en cliente

**Solución:** Implementar Zod schema validation en servidor

```typescript
import { z } from 'zod';

const RideCreationSchema = z.object({
  passenger_name: z.string().min(3).max(100),
  pickup_address: z.string().min(5).max(255),
  dropoff_address: z.string().min(5).max(255).optional(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'wallet']),
  service_type_name: z.string().min(1),
});

export async function createRide(data: unknown) {
  const validated = RideCreationSchema.parse(data);
  // ... proceed with validated data
}
```

---

### 14. No hay Rate Limiting Global

**Severidad:** 🔵 BAJA  
**Solución:**
```typescript
// lib/rate-limit.ts
import Ratelimit from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

// En API routes
export async function POST(request: NextRequest) {
  const ip = request.ip || 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // ... proceed
}
```

---

### 15. Falta Validación de RLS Policies

**Severidad:** 🔵 BAJA  
**Archivo:** [TEST_SUPABASE_CONSOLE.js](TEST_SUPABASE_CONSOLE.js#L43)

**Problema:**
```typescript
console.warn("⚠️ UPDATE .select() failed (this is expected if RLS is restrictive)");
```

**Riesgos:**
- ✗ Asumimos que RLS está configurado
- ✗ No hay validación de que funciona

**Solución:** Crear test automatizado

```typescript
// scripts/validate-rls.mjs
async function validateRLS() {
  // Test que anon_key no pueda acceder datos privados
  // Test que service_role_key funcione
  // Test que RLS policies están en todas las tablas
}
```

---

### 16. Sin Protección contra Clickjacking

**Severidad:** 🔵 BAJA  

**Solución:** Ya implementado en la solución de HSTS (X-Frame-Options), pero se recomienda:
```typescript
// next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  }
]
```

---

### 17. Tokens sin Expiración

**Severidad:** 🔵 BAJA  
**Archivos:** [app/admin-login/page.tsx](app/admin-login/page.tsx#L109-L115)

**Problema:** Sesión admin no tiene expiración

**Solución:** Agregar expiración
```typescript
const session = {
  id: adminUser.id,
  email: adminUser.email,
  role: "admin",
  expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
};

// Validar expiración antes de cada acción
if (session.expiresAt < Date.now()) {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  router.push('/admin-login');
}
```

---

## 📋 Checklist de Correcciones

### Inmediato (Próximos 48 horas)
- [ ] **Revocar credenciales Supabase comprometidas**
- [ ] **Generar nuevas credenciales y guardar en .env**
- [ ] **Eliminar hardcoded values en lib/supabase.ts**
- [ ] **Implementar bcrypt para contraseñas admin**
- [ ] **Re-hashing de todas las contraseñas existentes**

### Corto Plazo (Próxima semana)
- [ ] Crear middleware.ts con autenticación en nivel de ruta
- [ ] Implementar HttpOnly cookies en lugar de localStorage
- [ ] Crear API routes con validación y autenticación
- [ ] Implementar rate limiting
- [ ] Re-habilitar protección brute force en login

### Mediano Plazo (Próximas 2-3 semanas)
- [ ] Agregar HSTS y CSP headers
- [ ] Implementar CSRF protection
- [ ] Agregar encriptación de datos sensibles
- [ ] Crear sistema centralizado de logging seguro
- [ ] Implementar validación con Zod en servidor

### Largo Plazo (Próximo mes)
- [ ] Auditoría completa de RLS policies
- [ ] Penetration testing profesional
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Monitoreo de seguridad 24/7
- [ ] Capacitación de seguridad para equipo

---

## 📚 Referencias y Recursos

- **OWASP Top 10 2021:** https://owasp.org/Top10/
- **OWASP Application Security Verification Standard:** https://owasp.org/www-project-application-security-verification-standard/
- **Supabase Security:** https://supabase.com/docs/guides/security
- **Next.js Security:** https://nextjs.org/docs/basic-features/security
- **CWE (Common Weakness Enumeration):** https://cwe.mitre.org

---

## 🔐 Recomendaciones Generales

1. **Implementar Secret Management:** Usar Vault, AWS Secrets Manager, o Supabase Vault
2. **Auditoría Regular:** Realizar auditorías de seguridad cada 3-6 meses
3. **Dependency Scanning:** Usar `npm audit`, Snyk, o Dependabot
4. **Security Headers:** Implementar todas las security headers recomendadas
5. **Testing de Seguridad:** Agregar tests de seguridad automatizados
6. **Incident Response Plan:** Tener plan de respuesta ante brechas de seguridad
7. **Backup Strategy:** Seguridad de backups de BD
8. **Logging y Monitoring:** Auditoría detallada de todas las acciones sensibles

---

**Generado por:** GitHub Copilot Security Audit  
**Fecha:** 17 de abril de 2026  
**Confiabilidad:** Este análisis se basa en inspección de código estática y debe complementarse con testing dinámico.

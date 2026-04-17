```
╔════════════════════════════════════════════════════════════════════════════╗
║                   🔴 SUPABASE: NO TRAE DATOS EN NADA                      ║
║                                                                            ║
║  🚨 CRÍTICO: Todas las páginas están sin datos                             ║
║  📊 Conductores ❌ | Viajes ❌ | Empresas ❌ | Crear ❌                    ║
║                                                                            ║
║  ⚡ SOLUCIÓN RÁPIDA: 3 pasos, 5 minutos                                   ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## 📌 COMIENZA AQUÍ (elige según urgencia):

| Urgencia | Archivo | Tiempo | Qué hace |
|----------|---------|--------|----------|
| 🔴 **MÁXIMA** | [`DIAGNOSTICO_RAPIDO.md`](DIAGNOSTICO_RAPIDO.md) | **3-5 min** | ✅ Solución inmediata |
| 🟡 Normal | [`SOLUCION_GLOBAL_NO_TRAE_DATOS.md`](SOLUCION_GLOBAL_NO_TRAE_DATOS.md) | 5-10 min | 📖 Guía paso a paso |
| 🟢 Profundo | [`DIAGNOSTICO_NO_TRAE_DATOS.md`](DIAGNOSTICO_NO_TRAE_DATOS.md) | 10-15 min | 🔬 Diagnóstico completo |

---

## 🛠️ ARCHIVOS TÉCNICOS (SQL):

###📋 Scripts SQL en `diagnostics/`:

```
diagnostics/
├── check-rls-global.sql           ← Diagnóstico de RLS en TODAS las tablas
├── fix-rls-global.sql             ← SOLUCIÓN: Añade políticas a 15 tablas
├── check-rls-company.sql          ← (obsoleto, solo para tabla Company)
└── README estos archivos
```

**Para usar:**
1. Ve a: https://app.supabase.com/project/[TU-ID]/sql
2. Abre archivo SQL
3. Copiar TODO
4. Pegar en Supabase SQL Editor
5. Click **RUN**

---

## 🔧 ARCHIVOS DE DEBUGGING:

```
components/admin/
└── SupabaseDiagnostic.tsx         ← Widget visual (ver status en tiempo real)

debug-supabase.ts                  ← Script diagnóstico para consola browser
```

**Para usar SupabaseDiagnostic:**
```tsx
// En tu layout.tsx o página, agrega:
import SupabaseDiagnostic from '@/components/admin/SupabaseDiagnostic';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <SupabaseDiagnostic />  {/* Aparece como botón en esquina inferior derecha */}
    </>
  );
}
```

---

## 📚 DOCUMENTACIÓN COMPLETA:

### 📖 Orden Recomendado:

1. **[DIAGNOSTICO_RAPIDO.md](DIAGNOSTICO_RAPIDO.md)** ← EMPEZAR AQUÍ
   - ¿Qué está pasando?
   - Checklist 3 pasos
   - Script SQL directo

2. **[SOLUCION_GLOBAL_NO_TRAE_DATOS.md](SOLUCION_GLOBAL_NO_TRAVE_DATOS.md)** ← Segunda lectura
   - Si primero no funciona
   - Diagnosticar qué pasó
   - Opciones alternativas

3. **[DIAGNOSTICO_NO_TRAE_DATOS.md](DIAGNOSTICO_NO_TRAE_DATOS.md)** ← Referencia completa
   - Métodos de diagnóstico
   - 3 formas de verificar
   - Información detallada

4. **[SOLUCION_RAPIDA_NO_TRAE_DATOS.md](SOLUCION_RAPIDA_NO_TRAE_DATOS.md)** ← En caso de ser solo tabla Company
   - Si el problema fuera solo en /companies
   - (Probablemente no necesites esto)

---

## 🎯 EL PROBLEMA EN 30 SEGUNDOS:

```
┌─────────────────────────────────────────────┐
│ QUÉ PASÓ:                                   │
├─────────────────────────────────────────────┤
│                                             │
│ 1. Ejecutaste migraciones ✓                 │
│ 2. Campos se agregaron a tabla Company ✓   │
│ 3. RLS se activó automáticamente ✓         │
│ 4. PERO: Sin políticas configuradas ❌     │
│                                             │
│ RESULTADO:                                  │
│ Supabase bloquea TODO acceso de la app     │
│ (RLS = ON + Sin políticas = Todo bloqueado) │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ⚡ LA SOLUCIÓN EN 1 LÍNEA:

**Agregar políticas RLS para permitir a usuarios autenticados acceder**

---

## 🚀 ACCIONES INMEDIATAS:

### 👉 OPCIÓN 1: Sin pensarlo (Máxima urgencia)
```
1. Lee: DIAGNOSTICO_RAPIDO.md (3 minutos)
2. Ejecuta SQL diagnóstico
3. Ejecuta SQL solución
4. Recarga app
✅ LISTO
```

### 👉 OPCIÓN 2: Con cuidado (Normal)
```
1. Lee: SOLUCION_GLOBAL_NO_TRAE_DATOS.md
2. Entiende qué estás haciendo
3. Ejecuta paso a paso
4. Verifica cada paso
✅ LISTO
```

### 👉 OPCIÓN 3: Debugging profundo (Si nada funciona)
```
1. Lee: DIAGNOSTICO_NO_TRAE_DATOS.md
2. Ejecuta 3 métodos de diagnóstico
3. Reporta todos los resultados
4. Juntos debuggeamos
✅ LISTO
```

---

## 📞 CHECKLIST RÁPIDO ANTES DE EMPEZAR:

- [ ] ¿Tu proyecto ID es válido? (en la URL de Supabase)
- [ ] ¿Tienes acceso al SQL Editor? (no bloqueado)
- [ ] ¿El navegador está en HTTPS? (Supabase lo requiere)
- [ ] ¿Tienes tabla "Company" con datos? (no vacía)

---

## 🎓 LECCIONES APRENDIDAS:

1. **RLS es poderoso pero peligroso**
   - Habilitarlo sin políticas = todo bloqueado
   - Recuerda: RLS ON + Sin políticas = ❌ acceso

2. **Políticas se necesitan en TODAS las tablas**
   - No solo en Company
   - Por eso TODAS las páginas están vacías

3. **El culpable es RLS, no la BD**
   - Base de datos tiene datos ✓
   - La app solo no puede acceder ❌

---

## ✅ CUANDO FUNCIONE:

Deberías ver:
- ✅ Página de Conductores trae datos
- ✅ Página de Viajes carga
- ✅ Página de Empresas muestra registros
- ✅ Puedes crear nuevos registros
- ✅ Todo rápido (sin timeouts)

---

## 📞 SI AÚN NO FUNCIONA:

Prepara esta información:
- Screenshot de: DevTools → Network → Supabase request → Response
- Output del SQL query de diagnóstico
- ¿Todas las páginas vacías o solo algunas?
- ¿Error específico en Console?

Luego reporta y debuggeamos juntos.

---

**¿LISTO?** Abre [`DIAGNOSTICO_RAPIDO.md`](DIAGNOSTICO_RAPIDO.md) ahora 👈

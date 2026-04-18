# Análisis de Inconsistencias en settings/page.tsx

**Fecha:** 18 de Abril, 2026
**Archivo:** `app/settings/page.tsx`
**Objeto defaults:** Líneas 44-131

---

## 📋 TABLA DE PROBLEMAS IDENTIFICADOS

| # | Tipo | Campo | Ubicación | Problema | Severidad | Impacto |
|---|------|-------|-----------|----------|-----------|---------|
| 1 | Faltante en UI | `city_traffic_factor` | defaults L66 | Campo en defaults (1.0) pero NO existe UI para editarlo. No aparece en ninguna pestaña. | 🔴 ALTA | Factor de tráfico no configurable por admin |
| 2 | Faltante en UI | `pending_payment_methods` | defaults L134 | Array en defaults pero NO se usa en ningún UI. Posible campo abandonado. | 🟡 MEDIA | Funcionalidad incompleta o dato huérfano |
| 3 | Merge incompleto (Arrays) | `payment_methods` | useEffect L181-185 | Se sobrescribe con `...settings` en lugar de mergear. Pierde valores por defecto si Supabase vacío. | 🔴 ALTA | Perder configuración, inconsistencia de estado |
| 4 | Merge incompleto (Arrays) | `driver_required_docs` | useEffect L181-185 | Se sobrescribe en lugar de mergear. No preserva estructura si hay cambios parciales. | 🔴 ALTA | Pérdida de documentos requeridos |
| 5 | Merge incompleto (Arrays) | `driver_vehicle_docs` | useEffect L181-185 | Se sobrescribe en lugar de mergear. Inconsistencia entre defaults y Supabase. | 🔴 ALTA | Documentos de vehículos se pierden |
| 6 | Merge incompleto (Arrays) | `nav_config` | useEffect L181-185 | Se sobrescribe. NavConfigEditor podría recibir datos inconsistentes. | 🔴 ALTA | Menú lateral no se sincroniza correctamente |
| 7 | Merge incompleto (Objetos) | `landing_config` | useEffect L181-185 | Se sobrescribe (no merges como `features_enabled`). Abandona campos no editados. | 🔴 ALTA | Landing config pierde propiedades |
| 8 | Validación faltante | `payment_methods` | handleSave L193-207 | NO valida: nombres vacíos, duplicados, tipos. Se guarda sin verificación. | 🟡 MEDIA | Métodos de pago inválidos en BD |
| 9 | Validación faltante | `driver_required_docs` | handleSave L193-207 | NO valida: Labels vacíos, duplicados, campos requeridos. | 🟡 MEDIA | Documentos incompletos |
| 10 | Validación faltante | `driver_vehicle_docs` | handleSave L193-207 | NO valida: Labels, applies_to único, require_expiry sin fecha. | 🟡 MEDIA | Inconsistencia de documentos |
| 11 | Validación faltante | Tarifas (pricing) | handleSave L193-207 | NO valida: base_fare negativo, price_per_km en 0, comisión >100%. | 🟡 MEDIA | Tarifas inválidas generan problemas financieros |
| 12 | Validación faltante | Umbrales (rejection) | handleSave L193-207 | NO valida: %thresholds fuera de rango (0-100), valores inconsistentes. | 🟡 MEDIA | Umbrales de rechazo no operativos |
| 13 | Validación faltante | `email` / `phone` | handleSave L193-207 | NO valida formato de contact_email, contact_phone, support_whatsapp_number. | 🟡 MEDIA | Contactos inválidos |
| 14 | Validación faltante | Strings vacíos | handleSave L193-207 | NO requier company_name ≠ "". Support numbers sin validar. | 🟡 MEDIA | Datos incompletos |
| 15 | Validación faltante | `features_enabled` | handleSave L193-207 | Objeto anidado no valida keys desconocidas o tipos. | 🟡 MEDIA | UI agranda features sin validar |
| 16 | Validación faltante | Números (ETA/Auction) | handleSave L193-207 | NO valida: eta_speed_kmh en 0, auction_timeout_seconds <10. | 🟡 MEDIA | Parámetros inválidos rompen lógica |
| 17 | Validación faltante | `promotions` array | handleSave L193-207 | NO valida: code duplicados, discount_pct >100%, descripción vacía. | 🟡 MEDIA | Promociones duplicadas / inválidas |
| 18 | Actualización Supabase | `features_enabled` | useEffect L181-188 | Merges OK pero asume estructura conocida. Si Supabase tiene keys nuevas, pueden perderse. | 🟡 MEDIA | Backwards compatibility problem |
| 19 | Actualización Supabase | `landing_config` | useEffect L185 | Se sobrescribe entero. LandingEditor puede perder datos si Supabase parcial. | 🔴 ALTA | Landing config se trunca |
| 20 | Actualización Supabase | `nav_config` | useEffect L185 | Se sobrescribe. NavConfigEditor podría recibir estructura corrupta. | 🟡 MEDIA | Menú corrupto en carga |
| 21 | Lógica incompleta | Promociones | addPromo L189-191 | Crea nuevo promo SIN validar campo `code` único. Permite duplicados. | 🟡 MEDIA | Códigos promocionales duplicados |
| 22 | Lógica incompleta | Documentos | driverdocs L1139-1148 | NO hay validación de `label` único. Permite 2 docs con mismo nombre. | 🟡 MEDIA | Ambigüedad en docs requeridos |
| 23 | Lógica incompleta | Maps provider | L1064-1100 | Si cambias a Google Maps pero no llegas API Key, se guarda sin Key = error. | 🟡 MEDIA | Google maps se queda sin config |
| 24 | Tipos de datos inconsistentes | Numeric parsing | Múltiples campos | `parseFloat()` sin validar NaN. Podría guardar Infinity o NaN. | 🟡 MEDIA | BD corrupción silenciosa |
| 25 | Documentos complejos | `driver_vehicle_docs` | Pestaña driverdocs | Estructura incompleta: falta `require_expiry` UI en form. Solo se edita label/applies_to. | 🟡 MEDIA | Vencimiento de docs nunca se configura |
| 26 | Documentos complejos | `driver_required_docs` | Pestaña driverdocs | Estructura incompleta: falta `require_expiry` UI. Solo se edita label. | 🟡 MEDIA | Vencimiento de docs nunca se configura |
| 27 | Props inconsistentes | `LandingEditor` | L1246-1249 | Pasa `landing_config || {}` pero LandingEditor espera estructura específica. | 🟡 MEDIA | LandingEditor puede recibir datos vacíos |
| 28 | Props inconsistentes | `NavConfigEditor` | L1263-1267 | Pasa `nav_config || []` pero sin validar que sea array de objetos válidos. | 🟡 MEDIA | NavConfigEditor puede recibir data corrupta |
| 29 | Actualización notificaciones | `notification_*` fields | update() L165-171 | Se actualiza en 2 lugares: form state Y setNotificationSettings(). Riesgo de inconsistencia. | 🟡 MEDIA | Notificaciones pueden desincronizarse |
| 30 | Error handling | handleSave() | L193-207 | catch captura error pero no distingue: DB error, validación, red. Toast genérico. | 🟡 MEDIA | Debugging difícil, UX pobre |

---

## 🔍 ANÁLISIS DETALLADO POR CATEGORÍA

### 1. CAMPOS EN `defaults` PERO NO EN UI (3 campos)

| Campo | Ubicación defaults | Tipo | Valor default | Razón probable |
|-------|------------------|------|---------------|----|
| `city_traffic_factor` | L66 | number | 1.0 | Olvidado, no existe input. Seguramente para ETA pero nunca usado en cálculos del UI |
| `pending_payment_methods` | L134 | array | [] | Abandoned feature. Parece para pagos en espera pero nunca se muestra/edita |
| ~~`cutoff_interval_days`~~ | L102 | number | 7 | ✅ SÍ EXISTE en UI (Operaciones, L672-673) |

**Conclusión:** 2 campos huérfanos que deberían ser:
- Removidos si no se usan
- O agregarse UI si son funcionales

---

### 2. MERGE INCORRECTO EN useEffect (Líneas 177-188)

**Código actual:**
```typescript
useEffect(() => {
  if (settings) {
    setForm({
      ...defaults,
      ...settings,                    // ❌ Sobrescribe TODOS
      features_enabled: {             // ✅ Sólo merges features_enabled
        ...defaults.features_enabled,
        ...(settings.features_enabled || {}),
      },
    });
  }
}, [settings]);
```

**Problema:** Arrays complejos se sobrescriben completamente:
- `payment_methods: []` → Si Supabase es `null`, pierde defaults
- `driver_required_docs: []` → Si Supabase no la tiene, pierde configuración
- `driver_vehicle_docs: []` → Idem
- `nav_config: []` → Idem
- `landing_config: {}` → Se sobrescribe sin mergear como `features_enabled`

**Impacto:** Si Supabase no guarda un campo inicialmente, se pierde al recargar.

**Solución requerida:** Mergear todos los objetos/arrays anidados como se hace con `features_enabled`:
```typescript
promotions: [...(defaults.promotions || []), ...(settings.promotions || [])],
payment_methods: {
  ...defaults.payment_methods,
  ...(settings.payment_methods || {}),
},
```

---

### 3. VALIDACIONES AUSENTES EN handleSave (Línea 193-207)

**No hay validación para:**

#### 3a. Tarifas (pricing)
- `base_fare` podría ser negativo
- `price_per_km` en 0 = divide por cero en cálculos
- `price_per_minute` en 0
- `platform_commission_pct` > 100%

#### 3b. Email/Phone
- `contact_email` no validado (formato)
- `contact_phone` no validado (formato)
- `support_whatsapp_number` sin validar (formato +país)

#### 3c. Campos requeridos
- `company_name` vacío = no debería guardarse
- `payment_gateway` sin seleccionar (podría ser "")

#### 3d. Promociones
```typescript
// NO hay validación:
promo.code === "" ✓ Se guarda
duplicated codes ✓ Se permite (problema!)
promo.discount_pct > 100 ✓ Se guarda
```

#### 3e. Documentos
```typescript
// NO hay validación:
doc.label === "" ✓ Se guarda
duplicate labels ✓ Se permite
require_expiry sin semántica ✓ No se edita en UI
```

#### 3f. Números/Ranges
- `eta_speed_kmh` = 0 → error en cálculos
- `auction_timeout_seconds` < 10 = timing incorrecto
- `notification_volume` > 1 = volumen inválido
- `work_max_hours` > 24 = sin sentido
- `rating_window_minutes` < 60 = muy corto

#### 3g. Thresholds de rechazo
- `rejection_rate_warning_threshold` en [-100, 200] = sin validación
- Inconsistencia: `low_acceptance_rate_threshold` > `rejection_rate_warning_threshold`

**Resultado:** Basura en BD, errores silenciosos en runtime.

---

### 4. CAMPOS CON LÓGICA INCOMPLETA EN UI

#### 4a. `driver_required_docs` (Pestaña driverdocs, L1133-1167)
**UI actual:**
```tsx
<Input value={doc.label} ... /> // Solo permite editar label
<Button onClick={() => delete} />

// Falta:
// - doc.required (checkbox)
// - doc.require_expiry (checkbox)
// - doc.key preservado?
```

**Estructura en defaults:**
```typescript
driver_required_docs: [] // Debería ser: [{key, label, required, require_expiry}]
```

**Problema:** UI no edita todas las propiedades. Si vienen de Supabase, se pierden.

---

#### 4b. `driver_vehicle_docs` (Pestaña driverdocs, L1181-1232)
**UI actual:**
```tsx
<Input value={doc.label} ... />
<Select value={doc.applies_to || "both"} />  // ✅ Editado
<Button onClick={() => delete} />

// Falta:
// - doc.required
// - doc.require_expiry (IMPORTANTE para vencimientos)
// - doc.key preservado?
```

**Estructura esperada:**
```typescript
{
  key: string,
  label: string,
  required: boolean,
  require_expiry: boolean,
  applies_to: "car" | "moto" | "both"
}
```

**Problema:** `require_expiry` no tiene UI, pero Field existe en defaults. Vencimientos nunca se configuran.

---

#### 4c. `payment_methods` (Pestaña payment, L937-1001)
**UI actual:**
```tsx
<Input value={method.name} />
<Switch checked={!!method.is_active} />
<Button onClick={delete} />

// Falta:
// - method.type (hardcoded "card")
// - method.id autoincremento (OK, pero revisar si se preservan IDs)
```

**Problema:** Siempre crea type="card". No hay opción para otros tipos.

---

#### 4d. `promotions` array (Pestaña promos, L1283-1333)
**UI:**
```tsx
code, discount_pct, is_active, description // ✅ Se editan todos

// Pero falta validación:
// - code UNIQUE?
// - discount_pct > 100%?
// - Code debe estar alfanumérico/símbolos específicos?
```

**Problema:** addPromo() crea duplicados sin prevención.

---

#### 4e. `landing_config` (Pestaña landing, L1250-1252)
**UI:**
```tsx
<LandingEditor
  value={form.landing_config || {}}
  onChange={v => update("landing_config", v)}
/>
```

**Problema:**
- No sabemos qué estructura espera `LandingEditor`
- Si Supabase no la tiene, se pasa `{}` vacío
- No hay merge de propiedades parciales
- useEffect sobrescribe: `...settings` → Landing vacía desaparece

---

#### 4f. `nav_config` (Pestaña navconfig, L1255-1267)
**UI:**
```tsx
<NavConfigEditor
  value={form.nav_config || []}
  onChange={v => update("nav_config", v)}
/>
```

**Problema:**
- No hay validación de estructura esperada
- Si Supabase tiene config corrupta, no se valida
- useEffect sobrescribe: `...settings` → Config se reemplaza sin merge

---

### 5. PROBLEMAS DE ACTUALIZACIÓN DESDE SUPABASE

#### 5a. Arrays que se pierden
**Escenario:**
1. Admin configura `payment_methods: [{name: "Tarjeta", is_active: true}]`
2. Se guarda en Supabase
3. OnMount, se carga desde Supabase
4. useEffect hace `...settings` → reemplaza `defaults.payment_methods`
5. Si Supabase devuelve `undefined` o `null`, se pierde array

**Línea problemática:** L180 `...settings`

#### 5b. Landing config se trunca
**Escenario:**
1. LandingEditor hace ediciones parciales (sólo algunos campos)
2. Se guarda `{certain_fields: values}`
3. Al cargar: useEffect hace `...settings` → Sobrescribe `landing_config: {...}`
4. Si entrada desde Supabase no tiene ciertos campos, se pierden

#### 5c. Objetos anidados no se mergean
**features_enabled es correcto:**
```typescript
features_enabled: {
  ...defaults.features_enabled,        // Preserve defaults
  ...(settings.features_enabled || {}), // Override con Supabase
}
```

**Pero otros no:**
```typescript
// MALO (sobrescribe):
payment_methods: settings.payment_methods,

// CORRECTO sería:
payment_methods: {
  ...defaults.payment_methods,
  ...(settings.payment_methods || {}),
}
```

---

### 6. TIPOS DE DATOS INCONSISTENTES

#### 6a. Parseadores sin validación
```typescript
parseFloat(e.target.value) || 0    // Si parseFloat(x) === NaN, devuelve 0 pero no lo marca
parseInt(e.target.value) || 1      // Idem

// Mejor sería:
const val = parseFloat(e.target.value);
if (isNaN(val) || val < 0) {
  toast.error("Valor inválido");
  return;
}
```

#### 6b. Valores pueden ser Infinity
```typescript
// Si usuario entra "1e400" en campo numérico:
parseFloat("1e400") // = Infinity
// Se guarda en BD sin validar
```

#### 6c. Strings vacíos no diferenciados
```typescript
form.support_whatsapp_number || "" // Vacío se permite
// Debería validar si es field requerido
```

---

### 7. INCONSISTENCIA NOTIFICACIONES

**Línea 165-171:**
```typescript
const update = (field, value) => {
  setForm(prev => ({ ...prev, [field]: value }));
  if (["notification_interval_seconds", "notification_volume", "notification_sound_type"].includes(field)) {
    setNotificationSettings({ ... }); // ⚠️ ACTUALIZA 2 FUENTES
  }
};
```

**Problema:** 
- Actualiza `form` state
- Y TAMBIÉN ejecuta `setNotificationSettings()` (presumiblemente un contexto/hook)
- Riesgo: si `setNotificationSettings` falla, `form` ya cambió
- Si se cancela guardación, notification settings quedó actualizado

---

## 🎯 RECOMENDACIONES (Prioridad)

### CRÍTICO (🔴)
1. **Reescribir useEffect para mergear arrays/objetos correctamente**
   - Aplicar lógica similar a `features_enabled` a: `payment_methods`, `driver_required_docs`, `driver_vehicle_docs`, `nav_config`, `landing_config`

2. **Agregar validación en handleSave()**
   - Validar email, phone, +país format
   - Validar ranges: tarifas (≥0), percentajes (0-100), tiempos (>0)
   - Validar campos requeridos

3. **Arreglar landing_config y nav_config merge**
   - useEffect debe mergear, no sobrescribir

### IMPORTANTE (🟡)
4. **Completar UI para campos olvidados**
   - Agregar `city_traffic_factor` UI (o eliminar si no se usa)
   - Remover o completar `pending_payment_methods`

5. **Completar UI para documentos con require_expiry**
   - Agregar checkbox/UI para `require_expiry` en `driver_required_docs` y `driver_vehicle_docs`

6. **Prevenir duplicados en arrays**
   - Validar `code` único en promotions
   - Validar `label` único en documentos

7. **Mejorar error handling**
   - Distinguer tipos de error (validación vs. BD vs. red)
   - Mostrar campo específico que falla

### TÉCNICO (🟢)
8. **Usar zod/yup para schema validation**
   - Definir estructura esperada de cada objeto complejo

9. **Refactorizar arrays editable con componente reutilizable**
   - DRY: payment_methods, promotions, docs comparten lógica

---

## 📊 RESUMEN NUMÉRICO

| Categoría | Cantidad | Severity |
|-----------|----------|----------|
| Campos faltantes en UI | 2 | 🔴 |
| Merge incorrecto arrays | 5 | 🔴 |
| Validaciones faltantes | 7 | 🟡 |
| Lógica incompleta | 6 | 🟡 |
| Tipos inconsistentes | 3 | 🟡 |
| Misc issues | 7 | 🟡 |
| **TOTAL** | **30** | |

---

**Conclusión:**  
El settings page tiene **30 problemas identificados**, siendo los 3 más críticos:
1. Merge incorrecto en useEffect (pierde datos de Supabase)
2. Validações ausentes en handleSave (basura en BD)
3. Campos UI incompletos (features_enabled no totalmente editable)

Recomendado: **Refactor prioritario** de la lógica de actualización/guardación.

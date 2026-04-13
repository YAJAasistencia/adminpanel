/**
 * usePushNotifications
 *
 * Gestiona el registro del Service Worker, solicitud de permisos y
 * suscripción VAPID para notificaciones push en segundo plano.
 *
 * Soporta:
 *  - Conductores  → guarda push_subscription en entidad Driver
 *  - Pasajeros    → guarda push_subscription en entidad RoadAssistUser
 */

import { base44 } from '@/api/base44Client';

// ─── Clave Pública VAPID ──────────────────────────────────────────────────────
// Par generado con: npx web-push generate-vapid-keys
// La clave privada se usará en el backend para firmar los mensajes push.
const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9bBdqVW9_5V6RgdNFXTMJ6n6XBWG1HQyLGHmlWyFI7Y1mBKjVEs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte una clave base64url a Uint8Array (necesario para subscribe) */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// ─── Registro del Service Worker ─────────────────────────────────────────────

let _swRegistration = null;

/** Registra /sw.js como Service Worker. Solo se ejecuta una vez. */
export async function registerDriverSW() {
  if (_swRegistration) return _swRegistration;
  if (!('serviceWorker' in navigator)) return null;
  try {
    _swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return _swRegistration;
  } catch (err) {
    console.warn('[Push] SW registration failed:', err.message);
    return null;
  }
}

// ─── Obtener / crear PushSubscription ────────────────────────────────────────

async function getOrCreateSubscription(swReg) {
  try {
    let sub = await swReg.pushManager.getSubscription();
    if (!sub) {
      sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    return sub;
  } catch (err) {
    console.warn('[Push] Could not get subscription:', err.message);
    return null;
  }
}

// ─── Init para Conductores ────────────────────────────────────────────────────

/**
 * Solicita permiso, registra el SW, obtiene la suscripción VAPID
 * y la guarda en la entidad Driver.
 *
 * @param {string} driverId - ID del conductor en la entidad Driver
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export async function initDriverPush(driverId) {
  if (!('Notification' in window)) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') {
    // Add timeout so it never hangs forever waiting for user decision
    try {
      permission = await Promise.race([
        Notification.requestPermission(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
    } catch (_) {
      return 'default';
    }
  }

  if (permission === 'granted') {
    // Only attempt SW subscription if ServiceWorker is supported (i.e. app is installable)
    if (!('serviceWorker' in navigator)) return permission;
    try {
      const swReg = await Promise.race([
        registerDriverSW(),
        new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (swReg && driverId) {
        const sub = await Promise.race([
          getOrCreateSubscription(swReg),
          new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
        if (sub) {
          try {
            await base44.entities.Driver.update(driverId, {
              push_subscription: sub.toJSON(),
            });
          } catch (e) {
            console.warn('[Push] Could not save driver subscription:', e.message);
          }
        }
      }
    } catch (e) {
      console.warn('[Push] SW init failed (non-fatal):', e.message);
    }
  }

  return permission;
}

// ─── Init para Pasajeros ──────────────────────────────────────────────────────

/**
 * Solicita permiso, registra el SW, obtiene la suscripción VAPID
 * y la guarda en la entidad RoadAssistUser.
 *
 * @param {string} userId - ID del pasajero en la entidad RoadAssistUser
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export async function initPassengerPush(userId) {
  if (!('Notification' in window)) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Promise.race([
        Notification.requestPermission(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
    } catch (_) {
      return 'default';
    }
  }

  if (permission === 'granted') {
    if (!('serviceWorker' in navigator)) return permission;
    try {
      const swReg = await Promise.race([
        registerDriverSW(),
        new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (swReg && userId) {
        const sub = await Promise.race([
          getOrCreateSubscription(swReg),
          new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
        if (sub) {
          try {
            await base44.entities.RoadAssistUser.update(userId, {
              push_subscription: sub.toJSON(),
            });
          } catch (e) {
            console.warn('[Push] Could not save passenger subscription:', e.message);
          }
        }
      }
    } catch (e) {
      console.warn('[Push] Passenger SW init failed (non-fatal):', e.message);
    }
  }

  return permission;
}

// ─── Mostrar notificación (desde tab activo) ──────────────────────────────────

/**
 * Envía un mensaje al SW para mostrar una notificación aunque el tab
 * esté en segundo plano o minimizado.
 */
export async function showDriverNotification({ title, body, rideId, tag, url }) {
  if (Notification.permission !== 'granted') return;

  const swReg = _swRegistration || (await registerDriverSW());
  const payload = {
    type: 'SHOW_NOTIFICATION',
    title,
    body,
    tag: tag || (rideId ? `ride-${rideId}` : `notif-${Date.now()}`),
    ride: { id: rideId },
    url: url || '/DriverApp',
  };

  if (swReg?.active) {
    swReg.active.postMessage(payload);
    return;
  }

  // Fallback directo si el SW aún no está activo
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: payload.tag,
      requireInteraction: true,
    });
  } catch {}
}

/**
 * Alias para notificaciones del pasajero — redirige a /RoadAssistApp al hacer clic.
 */
export async function showPassengerNotification({ title, body, rideId, tag }) {
  return showDriverNotification({ title, body, rideId, tag, url: '/RoadAssistApp' });
}

// ─── Descartar notificación ───────────────────────────────────────────────────

export async function dismissDriverNotification(tag) {
  if (_swRegistration?.active) {
    _swRegistration.active.postMessage({ type: 'DISMISS', tag });
  }
}

// ─── Control de timers en el Service Worker ───────────────────────────────────

/**
 * Inicia el contador de aceptación de un servicio DENTRO del SW.
 * Si el conductor no acepta antes de expirar, el SW dispara RIDE_TIMEOUT
 * aunque la app esté cerrada o minimizada.
 *
 * @param {string} rideId
 * @param {number} timeoutMs - milisegundos para expirar (ej: 30000)
 * @param {string} passengerName
 * @param {string} pickupAddress
 */
export async function startSWRideTimer(rideId, timeoutMs, passengerName, pickupAddress) {
  const sw = _swRegistration?.active || (await registerDriverSW())?.active;
  if (!sw) return;
  sw.postMessage({ type: 'START_RIDE_TIMER', rideId, timeoutMs, passengerName, pickupAddress });
}

/**
 * Cancela el contador de un servicio en el SW (conductor aceptó o fue cancelado).
 */
export async function cancelSWRideTimer(rideId) {
  const sw = _swRegistration?.active;
  if (!sw) return;
  sw.postMessage({ type: 'CANCEL_RIDE_TIMER', rideId });
}

/**
 * Envía un heartbeat al SW para reiniciar el temporizador de inactividad.
 * Llamar periódicamente mientras el conductor esté en línea.
 *
 * @param {number} timeoutMs - duración de inactividad en ms
 */
export async function sendDriverHeartbeat(timeoutMs) {
  const sw = _swRegistration?.active;
  if (!sw) return;
  sw.postMessage({ type: 'DRIVER_HEARTBEAT', timeoutMs });
}

/**
 * Detiene el temporizador de inactividad en el SW
 * (cuando el conductor se desconecta voluntariamente).
 */
export async function stopDriverHeartbeat() {
  const sw = _swRegistration?.active;
  if (!sw) return;
  sw.postMessage({ type: 'STOP_HEARTBEAT' });
}

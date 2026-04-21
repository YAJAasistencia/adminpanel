import { supabaseApi } from "@/lib/supabaseApi";

const VAPID_PUBLIC_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9bBdqVW9_5V6RgdNFXTMJ6n6XBWG1HQyLGHmlWyFI7Y1mBKjVEs";

type PushPermissionResult = "granted" | "denied" | "default" | "unsupported";

interface NotificationPayload {
  title: string;
  body?: string;
  rideId?: string;
  tag?: string;
  url?: string;
}

interface ServiceWorkerMessage {
  type: string;
  [key: string]: any;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

export async function registerDriverSW() {
  if (serviceWorkerRegistration) return serviceWorkerRegistration;
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return serviceWorkerRegistration;
  } catch (err: any) {
    console.warn("[Push] SW registration failed:", err?.message || err);
    return null;
  }
}

async function waitForActiveWorker(swReg: ServiceWorkerRegistration): Promise<ServiceWorker | null> {
  if (swReg.active) return swReg.active;
  const worker = swReg.installing || swReg.waiting;
  if (!worker) return null;
  return new Promise((resolve) => {
    worker.addEventListener("statechange", function handler() {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", handler);
        resolve(worker);
      } else if (worker.state === "redundant") {
        worker.removeEventListener("statechange", handler);
        resolve(null);
      }
    });
    setTimeout(() => resolve(null), 8000);
  });
}

async function getOrCreateSubscription(swReg: ServiceWorkerRegistration) {
  try {
    await waitForActiveWorker(swReg);
    let subscription = await swReg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    return subscription;
  } catch (err: any) {
    console.warn("[Push] Could not get subscription:", err?.message || err);
    return null;
  }
}

export async function initDriverPush(driverId?: string): Promise<PushPermissionResult> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";

  let permission: NotificationPermission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Promise.race([
        Notification.requestPermission(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000)),
      ]);
    } catch {
      return "default";
    }
  }

  if (permission === "granted") {
    if (!("serviceWorker" in navigator)) return permission;
    try {
      const swReg = await Promise.race([
        registerDriverSW(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (swReg && driverId) {
        const sub = await Promise.race([
          getOrCreateSubscription(swReg),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);

        if (sub) {
          try {
            await supabaseApi.drivers.update(driverId, {
              push_subscription: sub.toJSON(),
            });
          } catch (err: any) {
            console.warn("[Push] Could not save driver subscription:", err?.message || err);
          }
        }
      }
    } catch (err: any) {
      console.warn("[Push] SW init failed (non-fatal):", err?.message || err);
    }
  }

  return permission;
}

export async function initPassengerPush(userId?: string): Promise<PushPermissionResult> {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";

  let permission: NotificationPermission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Promise.race([
        Notification.requestPermission(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000)),
      ]);
    } catch {
      return "default";
    }
  }

  if (permission === "granted") {
    if (!("serviceWorker" in navigator)) return permission;
    try {
      const swReg = await Promise.race([
        registerDriverSW(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (swReg && userId) {
        const sub = await Promise.race([
          getOrCreateSubscription(swReg),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);

        if (sub) {
          try {
            await supabaseApi.passengers.update(userId, {
              push_subscription: sub.toJSON(),
            });
          } catch (err: any) {
            console.warn("[Push] Could not save passenger subscription:", err?.message || err);
          }
        }
      }
    } catch (err: any) {
      console.warn("[Push] Passenger SW init failed (non-fatal):", err?.message || err);
    }
  }

  return permission;
}

export async function showDriverNotification({ title, body, rideId, tag, url }: NotificationPayload) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const swReg = serviceWorkerRegistration || (await registerDriverSW());
  const payload: ServiceWorkerMessage = {
    type: "SHOW_NOTIFICATION",
    title,
    body,
    tag: tag || (rideId ? `ride-${rideId}` : `notif-${Date.now()}`),
    ride: { id: rideId },
    url: url || "/driver-app",
  };

  if (swReg?.active) {
    swReg.active.postMessage(payload);
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: payload.tag,
      requireInteraction: true,
    });
  } catch {
  }
}

export async function showPassengerNotification({ title, body, rideId, tag }: NotificationPayload) {
  return showDriverNotification({ title, body, rideId, tag, url: "/RoadAssistApp" });
}

export async function dismissDriverNotification(tag: string) {
  if (serviceWorkerRegistration?.active) {
    serviceWorkerRegistration.active.postMessage({ type: "DISMISS", tag });
  }
}

export async function startSWRideTimer(
  rideId: string,
  timeoutMs: number,
  passengerName?: string,
  pickupAddress?: string,
) {
  const sw = serviceWorkerRegistration?.active || (await registerDriverSW())?.active;
  if (!sw) return;

  sw.postMessage({
    type: "START_RIDE_TIMER",
    rideId,
    timeoutMs,
    passengerName,
    pickupAddress,
  });
}

export async function cancelSWRideTimer(rideId: string) {
  const sw = serviceWorkerRegistration?.active;
  if (!sw) return;
  sw.postMessage({ type: "CANCEL_RIDE_TIMER", rideId });
}

export async function sendDriverHeartbeat(timeoutMs: number) {
  const sw = serviceWorkerRegistration?.active;
  if (!sw) return;
  sw.postMessage({ type: "DRIVER_HEARTBEAT", timeoutMs });
}

export async function stopDriverHeartbeat() {
  const sw = serviceWorkerRegistration?.active;
  if (!sw) return;
  sw.postMessage({ type: "STOP_HEARTBEAT" });
}
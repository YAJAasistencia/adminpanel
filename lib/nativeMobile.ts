import { Capacitor } from "@capacitor/core";
import { supabaseApi } from "@/lib/supabaseApi";
import { nowCDMX } from "@/components/shared/dateUtils";

export type AppPermissionState = "granted" | "denied" | "prompt" | "unsupported" | "checking";

export type LiveLocationWatchHandle = {
  native: boolean;
  id: string | number;
};

function normalizePermission(state?: string | null): AppPermissionState {
  if (!state) return "prompt";
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  if (state === "prompt" || state === "prompt-with-rationale") return "prompt";
  return "prompt";
}

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export async function getLocationPermissionState(): Promise<AppPermissionState> {
  if (typeof window === "undefined") return "checking";

  if (isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const permissions = await Geolocation.checkPermissions();
      return normalizePermission(permissions.location || permissions.coarseLocation);
    } catch {
      return "prompt";
    }
  }

  if (!navigator.geolocation) return "denied";
  if (!navigator.permissions) return "prompt";

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return normalizePermission(result.state);
  } catch {
    return "prompt";
  }
}

export async function requestLocationPermissionAccess(): Promise<AppPermissionState> {
  if (typeof window === "undefined") return "checking";

  if (isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const permissions = await Geolocation.requestPermissions();
      return normalizePermission(permissions.location || permissions.coarseLocation);
    } catch {
      return "denied";
    }
  }

  if (!navigator.geolocation) return "denied";

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (error) => resolve(error.code === 1 ? "denied" : "prompt"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export async function getNotificationPermissionState(): Promise<AppPermissionState> {
  if (typeof window === "undefined") return "checking";

  if (isNativePlatform()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const permissions = await PushNotifications.checkPermissions();
      return normalizePermission(permissions.receive);
    } catch {
      return "prompt";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  return normalizePermission(Notification.permission);
}

let registeredDriverId: string | null = null;
let lastNativePushToken: string | null = null;
let nativePushListenersReady = false;

async function persistNativeDriverPushToken() {
  if (!registeredDriverId || !lastNativePushToken) return;
  try {
    await supabaseApi.drivers.update(registeredDriverId, {
      push_subscription: {
        platform: "android-native",
        provider: "fcm",
        token: lastNativePushToken,
        registered_at: nowCDMX(),
      },
    });
  } catch (error) {
    console.warn("[NativePush] Could not save FCM token", error);
  }
}

async function ensureNativePushListeners() {
  if (nativePushListenersReady || !isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  await PushNotifications.removeAllListeners().catch(() => {});

  await PushNotifications.addListener("registration", async (token) => {
    lastNativePushToken = token.value;
    await persistNativeDriverPushToken();
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = String(action.notification.data?.url || "/driver-app");
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  });

  nativePushListenersReady = true;
}

export async function initNativeDriverPush(driverId?: string): Promise<AppPermissionState> {
  if (!isNativePlatform()) return "unsupported";
  if (driverId) registeredDriverId = driverId;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await ensureNativePushListeners();

    let permissions = await PushNotifications.checkPermissions();
    if (permissions.receive !== "granted") {
      permissions = await PushNotifications.requestPermissions();
    }
    if (permissions.receive !== "granted") {
      return normalizePermission(permissions.receive);
    }

    await PushNotifications.register();
    await persistNativeDriverPushToken();
    return "granted";
  } catch (error) {
    console.warn("[NativePush] Init failed", error);
    return "denied";
  }
}

export async function showNativeDriverNotification({
  title,
  body,
  url = "/driver-app",
}: {
  title: string;
  body?: string;
  url?: string;
}) {
  if (!isNativePlatform()) return false;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    let permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== "granted") {
      permissions = await LocalNotifications.requestPermissions();
    }
    if (permissions.display !== "granted") return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2147483000),
          title,
          body: body || "",
          extra: { url },
          schedule: { at: new Date(Date.now() + 200) },
        },
      ],
    });

    return true;
  } catch (error) {
    console.warn("[NativePush] Local notification failed", error);
    return false;
  }
}

export async function getCurrentLiveLocation() {
  if (isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }

  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

export async function watchLiveLocation(
  onSuccess: (position: { coords: { latitude: number; longitude: number } }) => void,
  onError?: (error: { message?: string }) => void,
): Promise<LiveLocationWatchHandle | null> {
  if (isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      (position, error) => {
        if (position?.coords) onSuccess(position as any);
        if (error) onError?.(error as any);
      }
    );
    return { native: true, id };
  }

  if (!navigator.geolocation) return null;

  const id = navigator.geolocation.watchPosition(
    (position) => onSuccess(position),
    (error) => onError?.(error),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );

  return { native: false, id };
}

export async function clearLiveLocationWatch(watch: LiveLocationWatchHandle | null) {
  if (!watch) return;

  if (watch.native) {
    const { Geolocation } = await import("@capacitor/geolocation");
    await Geolocation.clearWatch({ id: String(watch.id) }).catch(() => {});
    return;
  }

  navigator.geolocation?.clearWatch(watch.id as number);
}

export async function openNativeAppSettings() {
  if (!isNativePlatform()) return false;
  try {
    const { App } = await import("@capacitor/app");
    const openSettings = (App as any).openSettings;
    if (typeof openSettings === "function") {
      await openSettings();
      return true;
    }
  } catch {}
  return false;
}
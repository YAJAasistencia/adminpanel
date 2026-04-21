self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push notification handler ────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Nuevo aviso", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "YAJA";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "yaja-notification",
    data: { url: data.url || "/driver-app" },
    requireInteraction: !!data.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click handler ───────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/driver-app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes("/driver-app"));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

// ─── Message handler (timers from app) ───────────────────────────────────────
const rideTimers = {};

self.addEventListener("message", (event) => {
  const { type, rideId, durationSeconds } = event.data || {};

  if (type === "START_RIDE_TIMER" && rideId) {
    if (rideTimers[rideId]) clearTimeout(rideTimers[rideId]);
    rideTimers[rideId] = setTimeout(() => {
      self.registration.showNotification("⏱️ Tiempo de espera", {
        body: "El pasajero no ha abordado. Puedes cancelar el viaje.",
        tag: `ride-timer-${rideId}`,
        icon: "/icon-192.png",
        data: { url: "/driver-app" },
      });
      delete rideTimers[rideId];
    }, (durationSeconds || 300) * 1000);
  }

  if (type === "CANCEL_RIDE_TIMER" && rideId) {
    if (rideTimers[rideId]) {
      clearTimeout(rideTimers[rideId]);
      delete rideTimers[rideId];
    }
  }
});

// ─── Fetch passthrough (required to be a valid PWA SW) ────────────────────────
self.addEventListener("fetch", (event) => {
  // Passthrough — no caching strategy, just let requests go through.
  return;
});

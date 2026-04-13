import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { initDriverPush, showDriverNotification } from "@/components/shared/usePushNotifications";

const STATUS_MESSAGES = {
  pending:     { admin: (r) => ({ title: "🚖 Nuevo viaje solicitado", msg: `${r.passenger_name} · ${r.pickup_address}`, color: "blue", sound: "new_ride" }) },
  assigned:    { driver: (r) => ({ title: "📋 Viaje asignado", msg: `Recoge a ${r.passenger_name}`, color: "blue", sound: "new_ride" }) },
  en_route:    { admin: (r) => ({ title: "🚗 Conductor en camino", msg: `${r.driver_name} va hacia ${r.passenger_name}`, color: "indigo", sound: "status" }) },
  arrived:     { admin: (r) => ({ title: "📍 Conductor llegó", msg: `${r.driver_name} llegó al punto de recogida`, color: "amber", sound: "status" }),
                 driver: (r) => ({ title: "📍 Llegaste al punto", msg: `Esperando a ${r.passenger_name}`, color: "amber", sound: "status" }) },
  admin_approved: { driver: (r) => ({ title: "✅ Viaje aprobado", msg: "El administrador aprobó el inicio del viaje", color: "emerald", sound: "status" }) },
  in_progress: { admin: (r) => ({ title: "▶️ Viaje iniciado", msg: `${r.passenger_name} · conductor: ${r.driver_name}`, color: "emerald", sound: "status" }),
                 driver: (r) => ({ title: "▶️ Viaje en curso", msg: `Lleva a ${r.passenger_name} al destino`, color: "emerald", sound: "status" }) },
  completed:   { admin: (r) => ({ title: "✅ Viaje completado", msg: `${r.passenger_name} · $${(r.final_price || r.estimated_price || 0).toFixed(0)}`, color: "green", sound: "complete" }),
                 driver: (r) => ({ title: "✅ Viaje completado", msg: `+$${(r.driver_earnings || r.final_price || r.estimated_price || 0).toFixed(0)} ganados`, color: "green", sound: "complete" }) },
  cancelled:   { admin: (r) => ({ title: "❌ Viaje cancelado", msg: `${r.passenger_name} · ${r.cancellation_reason || "sin motivo"}`, color: "red", sound: "cancel" }),
                 driver: (r) => ({ title: "❌ Viaje cancelado", msg: r.cancellation_reason || "El viaje fue cancelado", color: "red", sound: "cancel" }) },
};

// ─── Configurable settings ────────────────────────────────────────────────────
let _alarmIntervalMs = 3000;
let _alarmVolume = 0.7;
let _soundType = "classic"; // classic | urgent | chime | beep

export function setNotificationSettings({ interval_seconds, volume, sound_type }) {
  if (interval_seconds != null) _alarmIntervalMs = Math.max(1, interval_seconds) * 1000;
  if (volume != null) _alarmVolume = Math.min(1, Math.max(0, volume));
  if (sound_type != null) _soundType = sound_type;
}

// ─── Sound engine using Web Audio API ────────────────────────────────────────
// Sound sets per notification sound_type
const ALL_SOUND_SETS = {
  classic: {
    new_ride: [
      { freq: 1047, start: 0,    dur: 0.15, waveType: "square" },
      { freq: 1319, start: 0.18, dur: 0.15, waveType: "square" },
      { freq: 1047, start: 0.36, dur: 0.15, waveType: "square" },
      { freq: 1319, start: 0.54, dur: 0.22, waveType: "square" },
    ],
    status:   [{ freq: 660, start: 0, dur: 0.1, waveType: "sine" }, { freq: 880, start: 0.12, dur: 0.15, waveType: "sine" }],
    complete: [{ freq: 523, start: 0, dur: 0.1, waveType: "sine" }, { freq: 659, start: 0.12, dur: 0.1, waveType: "sine" }, { freq: 784, start: 0.24, dur: 0.2, waveType: "sine" }],
    cancel:   [{ freq: 440, start: 0, dur: 0.15, waveType: "sawtooth" }, { freq: 330, start: 0.18, dur: 0.2, waveType: "sawtooth" }],
    message:  [{ freq: 1047, start: 0, dur: 0.08, waveType: "sine" }, { freq: 1047, start: 0.12, dur: 0.08, waveType: "sine" }],
  },
  urgent: {
    new_ride: [
      { freq: 880, start: 0,    dur: 0.1,  waveType: "sawtooth" },
      { freq: 1100, start: 0.12, dur: 0.1,  waveType: "sawtooth" },
      { freq: 880, start: 0.24, dur: 0.1,  waveType: "sawtooth" },
      { freq: 1100, start: 0.36, dur: 0.1,  waveType: "sawtooth" },
      { freq: 1320, start: 0.48, dur: 0.18, waveType: "sawtooth" },
    ],
    status:   [{ freq: 700, start: 0, dur: 0.08, waveType: "sawtooth" }, { freq: 900, start: 0.1, dur: 0.12, waveType: "sawtooth" }],
    complete: [{ freq: 600, start: 0, dur: 0.1, waveType: "sine" }, { freq: 800, start: 0.12, dur: 0.1, waveType: "sine" }, { freq: 1000, start: 0.24, dur: 0.2, waveType: "sine" }],
    cancel:   [{ freq: 300, start: 0, dur: 0.2, waveType: "sawtooth" }, { freq: 200, start: 0.22, dur: 0.25, waveType: "sawtooth" }],
    message:  [{ freq: 900, start: 0, dur: 0.07, waveType: "sawtooth" }, { freq: 900, start: 0.1, dur: 0.07, waveType: "sawtooth" }],
  },
  chime: {
    new_ride: [
      { freq: 1568, start: 0,    dur: 0.2,  waveType: "sine" },
      { freq: 1319, start: 0.22, dur: 0.2,  waveType: "sine" },
      { freq: 1047, start: 0.44, dur: 0.25, waveType: "sine" },
      { freq: 1319, start: 0.7,  dur: 0.3,  waveType: "sine" },
    ],
    status:   [{ freq: 1319, start: 0, dur: 0.15, waveType: "sine" }, { freq: 1047, start: 0.18, dur: 0.2, waveType: "sine" }],
    complete: [{ freq: 1047, start: 0, dur: 0.15, waveType: "sine" }, { freq: 1319, start: 0.18, dur: 0.15, waveType: "sine" }, { freq: 1568, start: 0.36, dur: 0.25, waveType: "sine" }],
    cancel:   [{ freq: 784, start: 0, dur: 0.2, waveType: "sine" }, { freq: 523, start: 0.22, dur: 0.25, waveType: "sine" }],
    message:  [{ freq: 1568, start: 0, dur: 0.1, waveType: "sine" }, { freq: 1319, start: 0.12, dur: 0.1, waveType: "sine" }],
  },
  beep: {
    new_ride: [
      { freq: 1000, start: 0,   dur: 0.07, waveType: "square" },
      { freq: 1000, start: 0.1, dur: 0.07, waveType: "square" },
      { freq: 1000, start: 0.2, dur: 0.07, waveType: "square" },
      { freq: 1500, start: 0.3, dur: 0.15, waveType: "square" },
    ],
    status:   [{ freq: 800, start: 0, dur: 0.06, waveType: "square" }, { freq: 800, start: 0.09, dur: 0.06, waveType: "square" }],
    complete: [{ freq: 1000, start: 0, dur: 0.06, waveType: "square" }, { freq: 1200, start: 0.09, dur: 0.06, waveType: "square" }, { freq: 1500, start: 0.18, dur: 0.1, waveType: "square" }],
    cancel:   [{ freq: 400, start: 0, dur: 0.1, waveType: "square" }, { freq: 300, start: 0.13, dur: 0.15, waveType: "square" }],
    message:  [{ freq: 1000, start: 0, dur: 0.05, waveType: "square" }, { freq: 1000, start: 0.08, dur: 0.05, waveType: "square" }],
  },
};

const SOUND_PATTERNS = new Proxy({}, {
  get(_, type) {
    return (ALL_SOUND_SETS[_soundType] || ALL_SOUND_SETS.classic)[type] || ALL_SOUND_SETS.classic.status;
  }
});

function playSoundOnce(type, volume = _alarmVolume) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = SOUND_PATTERNS[type] || SOUND_PATTERNS.status;
    const now = ctx.currentTime;
    notes.forEach(({ freq, start, dur, waveType }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = waveType;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 3000);
  } catch (e) {}
}

// Active repeating alarms: rideId -> intervalId
const activeAlarms = {};

export function startNewRideAlarm(rideId) {
  if (activeAlarms[rideId]) return;
  // Play sound once only — no repetition
  playSoundOnce("new_ride", _alarmVolume);
  // Store a non-null sentinel so stopNewRideAlarm still works cleanly
  activeAlarms[rideId] = true;
}

export function stopNewRideAlarm(rideId) {
  if (activeAlarms[rideId]) {
    // May be an interval id (number) or just a sentinel (true) — handle both
    if (typeof activeAlarms[rideId] === 'number') clearInterval(activeAlarms[rideId]);
    delete activeAlarms[rideId];
  }
}

export function stopAllAlarms() {
  Object.keys(activeAlarms).forEach(id => {
    if (typeof activeAlarms[id] === 'number') clearInterval(activeAlarms[id]);
    delete activeAlarms[id];
  });
}

export function playMessageSound() {
  playSoundOnce("message");
}

// ─── Notification display ─────────────────────────────────────────────────────
function showNotification({ title, msg, color, sound }) {
  const colorMap = {
    blue: "#3B82F6", indigo: "#6366F1", amber: "#F59E0B",
    emerald: "#10B981", green: "#22C55E", red: "#EF4444",
  };
  toast(title, {
    description: msg,
    duration: 5000,
    style: { borderLeft: `4px solid ${colorMap[color] || "#3B82F6"}` },
  });
  if (sound) playSoundOnce(sound);
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: msg, icon: "/favicon.ico" });
  }
}

// ─── Admin hook ───────────────────────────────────────────────────────────────
export function useAdminNotifications() {
  const prevRides = useRef({});

  useEffect(() => {
    const unsubscribe = base44.entities.RideRequest.subscribe((event) => {
      const ride = event.data;
      if (!ride) return;
      const prev = prevRides.current[ride.id];

      if (event.type === "create") {
        // New ride created — check if from passenger app
        const isPassengerAppRide = !!ride.passenger_user_id;
        if (["pending", "auction"].includes(ride.status)) {
          const cfg = STATUS_MESSAGES.pending?.admin?.(ride);
          if (isPassengerAppRide && ride.assignment_mode !== "manual") {
            // Passenger app ride: silent toast only, no alarm until escalated to manual
            if (cfg) showNotification({ ...cfg, sound: null });
            // Do NOT start alarm yet
          } else {
            if (cfg) showNotification({ ...cfg, sound: null });
            startNewRideAlarm(ride.id);
          }
        }
      } else if (event.type === "update") {
        const prevStatus = prev?.status;
        const newStatus = ride.status;

        // Stop alarm as soon as ride has a driver or reaches a terminal/active state
        const shouldStop = ride.driver_id || ["assigned", "admin_approved", "en_route", "arrived", "in_progress", "completed", "cancelled"].includes(newStatus);
        if (shouldStop) {
          stopNewRideAlarm(ride.id);
        }

        // Show status-change notification (only when status actually changed)
        if (prevStatus && prevStatus !== newStatus) {
          const cfg = STATUS_MESSAGES[newStatus]?.admin?.(ride);
          if (cfg) showNotification(cfg);
        }

        // If ride went back to pending without driver (rejected/timeout) → restart alarm
        if (newStatus === "pending" && !ride.driver_id) {
          startNewRideAlarm(ride.id);
        }

        // Passenger app ride escalated to manual panel → NOW play alarm with sound
        if (newStatus === "pending" && ride.passenger_user_id && ride.manual_assignment_requested_at
            && !prev?.manual_assignment_requested_at) {
          startNewRideAlarm(ride.id);
        }
      }

      prevRides.current[ride.id] = ride;
    });
    return unsubscribe;
  }, []);
}

// ─── Driver hook ──────────────────────────────────────────────────────────────
export function useDriverNotifications(driverId) {
  const prevRides = useRef({});

  useEffect(() => {
    if (!driverId) return;
    const unsubscribe = base44.entities.RideRequest.subscribe((event) => {
      const ride = event.data;
      if (!ride) return;

      // ── Auction ride: notify this driver ──
      if (event.type === "update" && ride.status === "auction" &&
          Array.isArray(ride.auction_driver_ids) && ride.auction_driver_ids.includes(driverId)) {
        const auctionCfg = { title: "🚗 ¡Nuevo servicio disponible!", msg: `${ride.passenger_name || "Pasajero"} · ${ride.pickup_address || ""}`, color: "blue" };
        showNotification({ ...auctionCfg, sound: null });
        startNewRideAlarm(ride.id);
        // Background push notification via SW
        showDriverNotification({
          title: "🚗 ¡Nuevo servicio disponible!",
          body: `${ride.passenger_name || "Pasajero"} · ${ride.pickup_address || ""}`,
          rideId: ride.id,
        });
        prevRides.current[ride.id] = ride;
        return;
      }

      if (ride.driver_id !== driverId) return;
      const prev = prevRides.current[ride.id];

      if (event.type === "update" && prev && prev.status !== ride.status) {
        if (["assigned", "cancelled", "completed"].includes(ride.status)) {
          stopNewRideAlarm(ride.id);
        }
        if (ride.status === "assigned" && prev.status !== "assigned") {
          showNotification({ ...STATUS_MESSAGES.assigned?.driver?.(ride), sound: null });
          startNewRideAlarm(ride.id);
          // Background push via SW for direct assignment
          showDriverNotification({
            title: "🚗 ¡Servicio asignado!",
            body: `Recoge a ${ride.passenger_name || "Pasajero"} · ${ride.pickup_address || ""}`,
            rideId: ride.id,
          });
        } else {
          const cfg = STATUS_MESSAGES[ride.status]?.driver?.(ride);
          if (cfg) showNotification(cfg);
        }
      }
      prevRides.current[ride.id] = ride;
    });
    return unsubscribe;
  }, [driverId]);
}

export function requestNotificationPermission(driverId) {
  // Use the enhanced push init which registers the SW too
  initDriverPush(driverId);
}

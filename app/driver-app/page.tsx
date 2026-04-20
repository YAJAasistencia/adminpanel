"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useDriverNotifications, requestNotificationPermission, stopNewRideAlarm, startNewRideAlarm } from "@/components/shared/useRideNotifications";
import { Button } from "@/components/ui/button";
import { Car, Star, Clock, User, AlertTriangle, DollarSign, ShieldAlert, HelpCircle, Wifi, MapPin, CheckCircle2, XCircle, ChevronLeft, Map, Download, AlertCircle, Navigation, TrendingUp, History, LogOut, X, Menu } from "lucide-react";
import { AnimatePresence as AP } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
// Leaflet CSS is imported via npm package
import L from "leaflet";
import { formatCDMX, setSystemTimezone } from "@/components/shared/dateUtils";
import IncomingRideAlert, { playAcceptedSound } from "@/components/driver/IncomingRideAlert";
import DriverSurveyModal from "@/components/driver/DriverSurveyModal";
import DriverHelpTicket from "@/components/driver/DriverHelpTicket";
import TicketsPanel from "@/components/shared/TicketsPanel";
import PullToRefresh from "@/components/driver/PullToRefresh";
import PushPermissionBanner from "@/components/driver/PushPermissionBanner";
import { showDriverNotification, startSWRideTimer, cancelSWRideTimer, sendDriverHeartbeat, stopDriverHeartbeat, registerDriverSW } from "@/components/shared/usePushNotifications";
import DriverNotificationsPanel from "@/components/driver/DriverNotificationsPanel";
import PermissionsOnboarding from "@/components/driver/PermissionsOnboarding";
import VehicleSelectorModal from "@/components/driver/VehicleSelectorModal";
import DriverProfileTab from "@/components/driver/DriverProfileTab";
import DocumentExpiryBanner from "@/components/driver/DocumentExpiryBanner";
import { SESSION_KEY, SESSION_TOKEN_KEY, getDistance } from "@/components/driver/driverUtils";
import DriverLoginScreen from "@/components/driver/DriverLoginScreen";
import RideCard from "@/components/driver/RideCard";
import InstallAppBanner from "@/components/shared/InstallAppBanner";
import DriverEarningsTab from "@/components/driver/DriverEarningsTab";
import { LocationPermissionScreen, SuspendedScreen, AdminSuspendedScreen } from "@/components/driver/DriverStatusScreens";
import AnnouncementModal from "@/components/shared/AnnouncementModal";
import RideSummaryScreen from "@/components/driver/RideSummaryScreen";
import RideHistoryModal from "@/components/driver/RideHistoryModal";
import RatingModal from "@/components/driver/RatingModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Driver = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  total_rides?: number;
  total_earnings?: number;
  photo_url?: string;
  vehicles?: any[];
  commission_rate?: number;
  doc_expiries?: Record<string, string>;
  suspended_until?: string;
  approval_status?: string;
  rejection_reason?: string;
  admin_notes?: string;
  access_code?: string;
  online_since?: string;
  accumulated_work_minutes?: number;
  rest_required_until?: string;
  last_disconnect_reason?: string;
  city_id?: string;
  password?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  license_plate?: string;
  [key: string]: any;
};

type Ride = {
  id: string;
  driver_id?: string;
  passenger_user_id?: string;
  passenger_name?: string;
  pickup_address?: string;
  dropoff_address?: string;
  pickup_lat?: number;
  pickup_lon?: number;
  dropoff_lat?: number;
  dropoff_lon?: number;
  status: string;
  estimated_price?: number;
  final_price?: number;
  driver_earnings?: number;
  platform_commission?: number;
  commission_rate?: number;
  payment_method?: string;
  created_date?: string;
  updated_date?: string;
  requested_at?: string;
  en_route_at?: string;
  arrived_at?: string;
  in_progress_at?: string;
  completed_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  cancellation_fee?: number;
  wallet_amount_used?: number;
  wallet_refund_amount?: number;
  wallet_excess_amount?: number;
  rating_window_expires_at?: string;
  auction_driver_ids?: string[];
  auction_expires_at?: string;
  driver_accepted?: boolean;
  driver_accepted_at?: string;
  assignment_mode?: string;
  company_id?: string;
  driver_rating_for_passenger?: number;
  _excluded_driver_ids?: string[];
  [key: string]: any;
};

type AppSettings = {
  id: string;
  company_name?: string;
  logo_url?: string;
  accent_color?: string;
  primary_color?: string;
  timezone?: string;
  platform_commission_pct?: number;
  auction_timeout_seconds?: number;
  rating_window_minutes?: number;
  driver_location_update_interval_seconds?: number;
  driver_inactivity_timeout_minutes?: number;
  payment_methods?: any[];
  driver_required_docs?: any[];
  driver_vehicle_docs?: any[];
  service_flow_update_minutes?: number;
  work_max_hours?: number;
  work_rest_ratio?: number;
  work_rest_trigger_minutes?: number;
  work_long_rest_minutes?: number;
  support_whatsapp_number?: string;
  driver_app_instructions?: string;
  [key: string]: any;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useLocationPermission() {
  const [permission, setPermission] = useState("checking");
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission("denied");
      return;
    }
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermission(result.state);
          result.onchange = () => setPermission(result.state);
        })
        .catch(() => setPermission("prompt"));
    } else {
      navigator.geolocation.getCurrentPosition(
        () => setPermission("granted"),
        (err) => setPermission(err.code === 1 ? "denied" : "prompt"),
        { timeout: 3000 }
      );
    }
  }, []);
  return permission;
}

function useGeofenceCheck(driver: Driver | null, cities: any[]) {
  const [outsideGeofence, setOutsideGeofence] = useState(false);
  useEffect(() => {
    if (!driver?.city_id || !driver?.latitude || !cities?.length) return;
    const city = cities.find((c) => c.id === driver.city_id);
    if (!city?.center_lat || !city?.center_lon || !city?.geofence_radius_km) return;
    const dist = getDistance(driver.latitude, driver.longitude, city.center_lat, city.center_lon);
    setOutsideGeofence(dist > city.geofence_radius_km);
  }, [driver?.latitude, driver?.longitude, driver?.city_id, cities]);
  return outsideGeofence;
}

const _lastActivity = { t: Date.now() };
if (typeof window !== "undefined") {
  const bump = () => {
    _lastActivity.t = Date.now();
  };
  window.addEventListener("touchstart", bump, { passive: true });
  window.addEventListener("touchmove", bump, { passive: true });
  window.addEventListener("click", bump);
  window.addEventListener("scroll", bump, { passive: true });
  window.addEventListener("mousemove", bump, { passive: true });
}

function useInactivityAutoDisconnect({
  driver,
  settings,
  onDisconnect,
  onWarn,
}: {
  driver: Driver | null;
  settings: AppSettings | undefined;
  onDisconnect: () => void;
  onWarn: () => void;
}) {
  const driverRef = useRef(driver);
  const onDisconnectRef = useRef(onDisconnect);
  const onWarnRef = useRef(onWarn);
  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  useEffect(() => {
    onWarnRef.current = onWarn;
  }, [onWarn]);

  useEffect(() => {
    const mins = settings?.driver_inactivity_timeout_minutes ?? 30;
    if (!mins || mins <= 0) return;
    const warnMins = Math.max(1, mins - 3);
    let warned = false;
    const iv = setInterval(() => {
      const d = driverRef.current;
      if (!d?.id || d.status !== "available") {
        warned = false;
        return;
      }
      const idleMin = (Date.now() - _lastActivity.t) / 60000;
      if (idleMin >= mins) {
        onDisconnectRef.current?.();
      } else if (idleMin >= warnMins && !warned) {
        warned = true;
        onWarnRef.current?.();
      } else if (idleMin < warnMins) {
        warned = false;
      }
    }, 30000);
    return () => clearInterval(iv);
  }, [settings?.driver_inactivity_timeout_minutes]);
}

function useWakeLock() {
  const wakeLockRef = useRef<any>(null);
  useEffect(() => {
    const acquire = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        } catch (_) {}
      }
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      wakeLockRef.current?.release?.();
    };
  }, []);
}

function useDarkModeSync() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
}

// ─── MapRecenter helper ───────────────────────────────────────────────────────
function MapRecenter({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

// ─── HomeMap — mapa pantalla completa con heatmap de flujo ───────────────────
function HomeMap({
  driver,
  allRides,
  onToggleOnline,
  isSuspended,
  hasActiveRide,
  todayEarnings,
  settings,
}: {
  driver: Driver | null;
  allRides: Ride[];
  onToggleOnline: () => Promise<void>;
  isSuspended: boolean;
  hasActiveRide: boolean;
  todayEarnings: number;
  settings: AppSettings | undefined;
}) {
  const lat = driver?.latitude;
  const lon = driver?.longitude;
  const center = lat && lon ? [lat, lon] : [19.4326, -99.1332];
  const isOnline = driver?.status === "available";

  // Flow data: fetch ALL platform rides periodically
  const [flowRides, setFlowRides] = React.useState<Ride[]>([]);
  const updateIntervalMs = (settings?.service_flow_update_minutes ?? 5) * 60 * 1000;

  const fetchFlowRides = React.useCallback(async () => {
    try {
      // Fetch ALL recent rides from the platform
      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Only show active/recent rides (not cancelled), last 24h
      const since = Date.now() - 24 * 60 * 60 * 1000;
      const relevant = (data || []).filter(
        (r) =>
          r.status !== "cancelled" &&
          new Date(r.requested_at).getTime() > since
      );
      setFlowRides(relevant);
    } catch (_) {}
  }, []);

  // Fetch on mount
  React.useEffect(() => {
    fetchFlowRides();
  }, [fetchFlowRides]);

  // Refresh periodically
  React.useEffect(() => {
    const iv = setInterval(fetchFlowRides, updateIntervalMs);
    return () => clearInterval(iv);
  }, [fetchFlowRides, updateIntervalMs]);

  // Crear icono de conductor personalizado
  const driverIcon = L.divIcon({
    className: "",
    html: `<div style="width:44px;height:44px;background:${
      isOnline ? "#10b981" : "#64748b"
    };border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h.5"/><path d="M9 17l-1.5-5h9L15 17"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M9 5h6l1 5H8L9 5z"/></svg>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  // Puntos de calor: basado en DONDE SE SOLICITAN los servicios (pickup_lat/lon)
  const heatPoints = flowRides
    .filter((r) => r.pickup_lat && r.pickup_lon && r.status !== "cancelled")
    .slice(0, 200);

  // Agrupar en zonas de calor por coordenadas de RECOGIDA
  const zoneMap: Record<string, any> = {};
  heatPoints.forEach((r) => {
    const key = `${Math.round(r.pickup_lat! * 20) / 20}_${Math.round(r.pickup_lon! * 20) / 20}`;
    zoneMap[key] = zoneMap[key] || { lat: r.pickup_lat, lon: r.pickup_lon, count: 0 };
    zoneMap[key].count++;
  });
  const zones = Object.values(zoneMap);
  const maxCount = Math.max(...zones.map((z) => z.count), 1);

  return (
    <div className="relative w-full h-full" style={{ zIndex: 0 }}>
      <MapContainer
        center={center as any}
        zoom={14}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapRecenter lat={lat} lon={lon} />

        {/* Zonas de calor de flujo */}
        {zones.map((z, i) => {
          const intensity = z.count / maxCount;
          const color = intensity > 0.7 ? "#ef4444" : intensity > 0.4 ? "#f97316" : "#eab308";
          const opacity = 0.15 + intensity * 0.25;
          return (
            <Circle
              key={i}
              center={[z.lat, z.lon] as any}
              radius={400 + intensity * 600}
              pathOptions={{ color, fillColor: color, fillOpacity: opacity, weight: 0 }}
            />
          );
        })}

        {/* Marcador del conductor */}
        {lat && lon && (
          <Marker position={[lat, lon]} icon={driverIcon}>
            <Popup>Tu ubicación actual</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Overlay: Ganancias del día */}
      <div className="absolute left-0 right-0 z-10 flex justify-center pointer-events-none" style={{ top: 12 }}>
        <div className="bg-black/70 backdrop-blur-md rounded-2xl px-5 py-2.5 flex items-center gap-2.5 shadow-xl border border-white/10 pointer-events-auto">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] text-slate-400 leading-none">Ganancias de hoy</p>
            <p className="text-base font-black text-emerald-400 leading-tight">${todayEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Overlay: botón GPS */}
      {lat && lon && (
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
          <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Botón principal de conexión */}
      {!isSuspended && !hasActiveRide && (
        <div className="absolute left-0 right-0 z-10 flex flex-col items-center gap-2 px-6" style={{ bottom: "10px" }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onToggleOnline}
            className={`w-full max-w-xs py-4 rounded-3xl font-black text-base shadow-2xl flex items-center justify-center gap-3 transition-all ${
              isOnline
                ? "bg-emerald-500 text-white shadow-emerald-500/40"
                : "bg-white text-slate-900 shadow-slate-900/20"
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-white animate-pulse" : "bg-slate-400"}`} />
            {isOnline ? "Estoy en línea · Toca para salir" : "Conectarme para recibir viajes"}
          </motion.button>
          {/* Leyenda de flujo de servicios */}
          <div className="bg-black/55 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-orange-400" />
            <span className="text-white text-[11px] font-semibold">Flujo de servicios</span>
            <div className="flex gap-1 ml-0.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
              <div className="w-2 h-2 rounded-full bg-orange-500 opacity-80" />
              <div className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {hasActiveRide && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center px-6">
          <div className="bg-blue-600 text-white py-3.5 px-6 rounded-3xl font-bold text-sm flex items-center gap-2 shadow-2xl shadow-blue-600/40">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            En servicio activo
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DriverMenu ───────────────────────────────────────────────────────────────
function DriverMenu({
  driver,
  onClose,
  onOpenEarnings,
  onOpenHistory,
  onOpenProfile,
  onOpenTickets,
  onLogout,
  onSOS,
  hasActiveRide,
}: {
  driver: Driver;
  onClose: () => void;
  onOpenEarnings: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onOpenTickets: () => void;
  onLogout: () => void;
  onSOS: () => void;
  hasActiveRide: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full bg-slate-900 rounded-t-3xl border-t border-white/10"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {/* Driver info */}
        <div className="px-5 pb-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
            {driver.photo_url ? (
              <img src={driver.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xl font-black text-white">
                {driver.full_name?.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate">{driver.full_name || "Desconocido"}</p>
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-white/50 text-xs">
                {driver.rating || 5} · {driver.total_rides || 0} servicios
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        {/* Menu items */}
        <div className="px-4 py-3 space-y-1">
          {[
            {
              icon: DollarSign,
              label: "Ganancias",
              color: "text-emerald-400",
              bg: "bg-emerald-500/15",
              onPress: onOpenEarnings,
            },
            {
              icon: History,
              label: "Historial de viajes",
              color: "text-blue-400",
              bg: "bg-blue-500/15",
              onPress: onOpenHistory,
            },
            {
              icon: User,
              label: "Mi perfil",
              color: "text-violet-400",
              bg: "bg-violet-500/15",
              onPress: onOpenProfile,
            },
            {
              icon: HelpCircle,
              label: "Ayuda / Soporte",
              color: "text-amber-400",
              bg: "bg-amber-500/15",
              onPress: onOpenTickets,
            },
          ].map(({ icon: Icon, label, color, bg, onPress }) => (
            <button
              key={label}
              onClick={() => {
                onClose();
                onPress();
              }}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-white font-medium text-sm">{label}</span>
            </button>
          ))}
          {hasActiveRide && (
            <button
              onClick={() => {
                onClose();
                onSOS();
              }}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl hover:bg-red-500/10 active:bg-red-500/15 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-red-400 font-medium text-sm">Enviar SOS de emergencia</span>
            </button>
          )}
          <div className="border-t border-white/10 pt-2 mt-2">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-white/50" />
              </div>
              <span className="text-white/60 font-medium text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DriverApp() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [sessionLoading, setSessionLoading] = useState(() => typeof window !== 'undefined' ? !!localStorage.getItem(SESSION_KEY) : false);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [activeTab, setActiveTab] = useState<"rides" | "earnings" | "profile">("rides");
  const [tabDir, setTabDir] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpRideContext, setHelpRideContext] = useState<Ride | null>(null);
  const [showTickets, setShowTickets] = useState(false);
  const [pendingSurvey, setPendingSurvey] = useState<any>(null);
  const [pendingPassengerRating, setPendingPassengerRating] = useState<any>(null);
  const [rideSummary, setRideSummary] = useState<any>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPermissionsOnboarding, setShowPermissionsOnboarding] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      let locGranted = false;
      let notifGranted = typeof Notification === "undefined" || Notification.permission === "granted";
      if (navigator.permissions) {
        try {
          const r = await navigator.permissions.query({ name: "geolocation" });
          locGranted = r.state === "granted";
        } catch {
          locGranted = false;
        }
      }
      if (!locGranted || !notifGranted) {
        setShowPermissionsOnboarding(true);
      }
    };
    checkPermissions();
  }, []);

  const [suspendedUntil, setSuspendedUntil] = useState(() => {
    const stored = localStorage.getItem("driver_suspended_until");
    if (stored) {
      const val = parseInt(stored);
      if (val > Date.now()) return val;
      localStorage.removeItem("driver_suspended_until");
    }
    return null;
  });

  const locationPermission = useLocationPermission();
  useDarkModeSync();
  useWakeLock();

  const queryClient = useQueryClient();
  const prefilledEmail = useRef(
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("driverEmail") || ""
  ).current;
  const rejectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      setHelpRideContext(e.detail || null);
      setShowHelp(true);
    };
    window.addEventListener("openDriverHelp", handler);
    return () => window.removeEventListener("openDriverHelp", handler);
  }, []);

  // Restore session
  useEffect(() => {
    const savedId = localStorage.getItem(SESSION_KEY);
    if (savedId && !driver) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from("Driver")
            .select("*")
            .eq("id", savedId)
            .single();

          if (error) throw error;

          if (data) {
            const { password: _, ...d } = data as any;
            setDriver(d);
            if (d.suspended_until && new Date(d.suspended_until) > new Date()) {
              const until = new Date(d.suspended_until).getTime();
              setSuspendedUntil(until);
              localStorage.setItem("driver_suspended_until", String(until));
            } else {
              setSuspendedUntil(null);
              localStorage.removeItem("driver_suspended_until");
            }
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
          setSessionLoading(false);
        } catch {
          setSessionLoading(false);
        }
      })();
    } else {
      setSessionLoading(false);
    }
  }, []);

  useDriverNotifications(driver?.id);
  useEffect(() => {
    if (driver?.id) requestNotificationPermission(driver.id);
  }, [driver?.id]);

  const handleRejectRideRef = useRef<any>(null);
  useEffect(() => {
    handleRejectRideRef.current = handleRejectRide;
  });

  useEffect(() => {
    if (!driver?.id) return;
    registerDriverSW();

    const handleSWMessage = (event: any) => {
      const msg = event.data || {};

      if (msg.type === "RIDE_TIMEOUT") {
        const rideId = msg.rideId;
        setIncomingRide((prev) => {
          if (prev?.id === rideId) {
            stopNewRideAlarm(rideId);
            handleRejectRideRef.current?.(prev, "timeout");
            return null;
          }
          return prev;
        });
      }

      if (msg.type === "INACTIVITY_TIMEOUT") {
        handleInactivityDisconnectRef.current?.();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
  }, [driver?.id]);

  const handleInactivityDisconnectRef = useRef<any>(null);

  // Admin broadcast notifications
  useEffect(() => {
    if (!driver?.id) return;
    
    const channel = supabase
      .channel(`driver_notificaciones:${driver.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_notificaciones",
          filter: `driver_ids=cs.{${driver.id}}`,
        },
        (payload) => {
          const notif = payload.new as any;
          if (!notif) return;
          showDriverNotification({
            title: notif.title,
            body: notif.body,
            tag: notif.tag || `admin-notif-${notif.id}`,
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [driver?.id]);

  const lastLocationSaveRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const driverRef = useRef(driver);
  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);
  const settingsRef = useRef<AppSettings | undefined>(null);

  const locationIntervalMsRef = useRef(5000);

  const saveLocation = useCallback((lat: number, lon: number) => {
    const d = driverRef.current;
    if (!d?.id) return;
    if (!lat || !lon || Math.abs(lat) < 0.001 || Math.abs(lon) < 0.001) return;
    const now = Date.now();
    if (now - lastLocationSaveRef.current < locationIntervalMsRef.current) return;
    lastLocationSaveRef.current = now;
    if (d.status === "available") {
      _lastActivity.t = now;
      setInactivityWarning(false);
    }
    supabase
      .from("Driver")
      .update({ latitude: lat, longitude: lon, last_seen_at: new Date().toISOString() })
      .eq("id", d.id)
      .then(() => {});
  }, []);

  useEffect(() => {
    if (!driver?.id) return;
    const startWatch = () => {
      if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = navigator.geolocation?.watchPosition(
        (pos) => saveLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      ) as any;
    };
    startWatch();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        startWatch();
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            lastLocationSaveRef.current = 0;
            saveLocation(pos.coords.latitude, pos.coords.longitude);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rejectTimerRef.current) clearTimeout(rejectTimerRef.current);
    };
  }, [driver?.id, saveLocation]);

  const { data: settingsList = [] } = useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").limit(1);
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
  const settings = settingsList[0] as AppSettings | undefined;
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const appLogo = settings?.logo_url;
  const appName = settings?.company_name;

  useEffect(() => {
    if (settings?.timezone) setSystemTimezone(settings.timezone);
  }, [settings?.timezone]);

  useEffect(() => {
    locationIntervalMsRef.current = (settings?.driver_location_update_interval_seconds ?? 5) * 1000;
  }, [settings?.driver_location_update_interval_seconds]);

  const { data: rides = [] } = useQuery({
    queryKey: ["driverRides", driver?.id],
    queryFn: async () => {
      if (!driver?.id) return [];
      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("driver_id", driver.id)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!driver?.id) return;
    const intervalMs = (settings?.driver_location_update_interval_seconds ?? 20) * 1000;
    if (backupIntervalRef.current) clearInterval(backupIntervalRef.current);
    backupIntervalRef.current = setInterval(() => {
      navigator.geolocation?.getCurrentPosition(
        (pos) => saveLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, intervalMs);
    return () => {
      if (backupIntervalRef.current) clearInterval(backupIntervalRef.current);
    };
  }, [driver?.id, settings?.driver_location_update_interval_seconds, saveLocation]);

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
  });

  const outsideGeofence = useGeofenceCheck(driver, cities);

  // Live sync driver
  useEffect(() => {
    if (!driver?.id) return;
    const channel = supabase
      .channel(`driver:${driver.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Driver", filter: `id=eq.${driver.id}` },
        (payload) => {
          const evt = payload.new as Driver;
          if (evt?.id === driver.id) {
            const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
            if (savedToken && evt.access_code && evt.access_code !== savedToken) {
              localStorage.removeItem(SESSION_KEY);
              localStorage.removeItem(SESSION_TOKEN_KEY);
              setDriver(null);
              import("sonner").then(({ toast }) =>
                toast.error("⚠️ Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo.", {
                  duration: 10000,
                })
              );
              return;
            }
            setDriver((prev) => (prev ? { ...prev, ...evt } : prev));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [driver?.id]);

  useEffect(() => {
    if (!driver?.id) return;

    const verifySession = async () => {
      const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!savedToken) return;
      const { data, error } = await supabase
        .from("Driver")
        .select("*")
        .eq("id", driver.id)
        .single();

      if (error) throw error;

      const current = data as Driver;
      if (current.access_code && current.access_code !== savedToken) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setDriver(null);
        import("sonner").then(({ toast }) =>
          toast.error("⚠️ Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo.", {
            duration: 10000,
          })
        );
      }
    };

    const interval = setInterval(verifySession, 60 * 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") verifySession();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [driver?.id]);

  // ─── UNIFIED real-time ride subscription ─────────────────────────────────
  const initializedRef = useRef(false);
  const shownRideAssignmentsRef = useRef<Record<string, string>>({});
  const acceptedRideIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!driver?.id) return;
    initializedRef.current = false;
    shownRideAssignmentsRef.current = {};
    acceptedRideIdsRef.current = new Set();
  }, [driver?.id]);

  useEffect(() => {
    if (!driver?.id) return;
    if (initializedRef.current) return;
    initializedRef.current = true;
    rides
      .filter((r) => r.status === "assigned" && r.driver_id === driver.id)
      .forEach((r) => {
        shownRideAssignmentsRef.current[r.id] = r.requested_at || "";
        acceptedRideIdsRef.current.add(r.id);
      });
  }, [rides.length > 0 || initializedRef.current, driver?.id]);

  useEffect(() => {
    if (!driver?.id) return;
    const driverId = driver.id;

    const channel = supabase
      .channel(`ride_updates:${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_requests",
        },
        (payload: any) => {
          const data = payload.new as Ride;
          if (!data) return;

          // ── 1. Sync cache for rides belonging to this driver ──────────────────
          if (payload.type === "UPDATE" && data.driver_id && data.driver_id !== driverId) {
            queryClient.setQueryData(["driverRides", driverId], (old: any[] = []) =>
              old.filter((r) => r.id !== data.id)
            );
          }
          if (data.driver_id === driverId || payload.type === "INSERT") {
            queryClient.setQueryData(["driverRides", driverId], (old: any[] = []) => {
              if (payload.type === "DELETE") return old.filter((r) => r.id !== data.id);
              const idx = old.findIndex((r) => r.id === data.id);
              if (idx === -1) return data.driver_id === driverId ? [data, ...old] : old;
              return old.map((r) => (r.id === data.id ? { ...r, ...data } : r));
            });
          }
          if (
            payload.type === "UPDATE" &&
            data.driver_id === driverId &&
            !["completed", "cancelled"].includes(data.status)
          ) {
            queryClient.invalidateQueries({ queryKey: ["driverRides", driverId] });
          }

          // ── 2. Auction ride: show alert to this driver ────────────────────────
          if (
            payload.type === "UPDATE" &&
            data.status === "auction" &&
            Array.isArray(data.auction_driver_ids) &&
            data.auction_driver_ids.includes(driverId)
          ) {
            const prevShown = shownRideAssignmentsRef.current[data.id];
            const isNew = !prevShown || prevShown !== (data.auction_expires_at || data.requested_at);
            if (isNew) {
              shownRideAssignmentsRef.current[data.id] = data.auction_expires_at || data.requested_at || "";
              stopNewRideAlarm(data.id);
              startNewRideAlarm(data.id);
              showDriverNotification({
                title: "🚗 ¡Nuevo servicio disponible!",
                body: `${data.passenger_name || "Pasajero"} · ${data.pickup_address || ""}`,
                rideId: data.id,
              });
              const auctionTimeoutMs = data.auction_expires_at
                ? Math.max(0, new Date(data.auction_expires_at).getTime() - Date.now())
                : (settingsRef.current?.auction_timeout_seconds || 30) * 1000;
              startSWRideTimer(data.id, auctionTimeoutMs, data.passenger_name, data.pickup_address);
              setIncomingRide(data);
            }
            return;
          }

          // ── 3. Direct assignment (auto/manual): show alert ────────────────────
          if (payload.type === "UPDATE" && data.status === "assigned" && data.driver_id === driverId) {
            if (!initializedRef.current) return;
            const prevShownAt = shownRideAssignmentsRef.current[data.id];
            const thisAssignmentAt = data.requested_at;
            const isNewAssignment = !prevShownAt || prevShownAt !== thisAssignmentAt;
            const alreadyAccepted = acceptedRideIdsRef.current.has(data.id);
            if (isNewAssignment && !alreadyAccepted) {
              shownRideAssignmentsRef.current[data.id] = thisAssignmentAt || "";
              stopNewRideAlarm(data.id);
              startNewRideAlarm(data.id);
              showDriverNotification({
                title: "🚗 ¡Servicio asignado!",
                body: `Recoge a ${data.passenger_name || "Pasajero"} · ${data.pickup_address || ""}`,
                rideId: data.id,
              });
              const assignTimeoutMs = (settingsRef.current?.auction_timeout_seconds || 30) * 1000;
              startSWRideTimer(data.id, assignTimeoutMs, data.passenger_name, data.pickup_address);
              setIncomingRide(data);
            }
            return;
          }

          // ── 4. Ride no longer available for this driver ──
          if (payload.type === "UPDATE") {
            if (data.driver_id && data.driver_id !== driverId && data.status === "assigned") {
              delete shownRideAssignmentsRef.current[data.id];
              acceptedRideIdsRef.current.delete(data.id);
            }

            if (data.status === "cancelled" && data.driver_id === driverId) {
              setIncomingRide((prev) => {
                if (prev?.id === data.id) {
                  stopNewRideAlarm(prev.id);
                }
                return prev?.id === data.id ? null : prev;
              });
              if (data.cancelled_by !== "driver") {
                const pmConfig = { auto_charge: false, require_driver_confirmation: false };
                setRideSummary({ ride: data, paymentMethodConfig: pmConfig });
              }
              supabase
                .from("Driver")
                .update({ status: "available" })
                .eq("id", driverId);
              setDriver((prev) => (prev ? { ...prev, status: "available" } : prev));
              return;
            }

            setIncomingRide((prev) => {
              if (!prev || prev.id !== data.id) return prev;
              const takenByOther = data.status === "assigned" && data.driver_id && data.driver_id !== driverId;
              const noLongerAuction =
                prev.status === "auction" && data.status !== "auction" && data.driver_id !== driverId;
              const cancelled = data.status === "cancelled";
              const revertedToPending = data.status === "pending" && !data.driver_id;
              if (takenByOther || noLongerAuction || cancelled || revertedToPending) {
                stopNewRideAlarm(prev.id);
                return null;
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [driver?.id, queryClient]);

  // ─── REAL-TIME incoming ride notifications channel ─────────────────────
  useEffect(() => {
    if (!driver?.id) return;
    const driverId = driver.id;

    const notificationChannel = supabase
      .channel(`driver:${driverId}:incoming-rides`)
      .on('broadcast', { event: 'new_ride_notification' }, (message: any) => {
        const payload = message.payload;
        console.log('[DRIVER-APP] Received incoming ride notification:', payload);

        if (!payload?.ride_id) return;

        // Refetch rides to ensure we have the latest data
        queryClient.invalidateQueries({ queryKey: ['driverRides', driverId] });

        // Show notification to driver
        if (payload.notification_type === 'ride_assigned') {
          showDriverNotification({
            title: '🚗 ¡Servicio asignado!',
            body: `Recoge a ${payload.ride_data?.passenger_name || 'Pasajero'} · ${payload.ride_data?.pickup_address || ''}`,
            rideId: payload.ride_id,
          });
          startNewRideAlarm(payload.ride_id);
          const assignTimeoutMs = (settingsRef.current?.auction_timeout_seconds || 30) * 1000;
          startSWRideTimer(
            payload.ride_id,
            assignTimeoutMs,
            payload.ride_data?.passenger_name || 'Pasajero',
            payload.ride_data?.pickup_address || ''
          );
        } else if (payload.notification_type === 'ride_offer') {
          showDriverNotification({
            title: '🚗 ¡Nuevo servicio disponible!',
            body: `${payload.ride_data?.passenger_name || 'Pasajero'} · ${payload.ride_data?.pickup_address || ''}`,
            rideId: payload.ride_id,
          });
          startNewRideAlarm(payload.ride_id);
          const auctionTimeoutMs = (settingsRef.current?.auction_timeout_seconds || 30) * 1000;
          startSWRideTimer(
            payload.ride_id,
            auctionTimeoutMs,
            payload.ride_data?.passenger_name || 'Pasajero',
            payload.ride_data?.pickup_address || ''
          );
        }
      })
      .subscribe();

    return () => {
      notificationChannel.unsubscribe();
    };
  }, [driver?.id, queryClient]);

  const { data: surveys = [] } = useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .order("id", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ride, newStatus }: { ride: Ride; newStatus: string }) => {
      const now = new Date().toISOString();
      const updates: any = { status: newStatus };
      if (newStatus === "en_route") updates.en_route_at = now;
      if (newStatus === "arrived") updates.arrived_at = now;
      if (newStatus === "in_progress") updates.in_progress_at = now;
      if (newStatus === "completed") {
        updates.completed_at = now;
        const commissionRate = driver?.commission_rate ?? settings?.platform_commission_pct ?? 20;
        const price = ride.final_price || ride.estimated_price || 0;
        const driverEarnings = parseFloat((price * (1 - commissionRate / 100)).toFixed(2));
        updates.final_price = price;
        updates.driver_earnings = driverEarnings;
        updates.platform_commission = parseFloat((price * (commissionRate / 100)).toFixed(2));
        updates.rating_window_expires_at = new Date(
          Date.now() + (settings?.rating_window_minutes ?? 1440) * 60000
        ).toISOString();

        await supabase
          .from("Driver")
          .update({
            status: "available",
            total_rides: (driver?.total_rides || 0) + 1,
            total_earnings: (driver?.total_earnings || 0) + driverEarnings,
          })
          .eq("id", driver?.id || "");

        setDriver((prev) =>
          prev
            ? {
                ...prev,
                status: "available",
                total_rides: (prev.total_rides || 0) + 1,
              }
            : prev
        );
      }

      const { error } = await supabase
        .from("ride_requests")
        .update(updates)
        .eq("id", ride.id);

      if (error) throw error;
    },
    onMutate: async ({ ride, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["driverRides", driver?.id] });
      const prev = queryClient.getQueryData(["driverRides", driver?.id]);
      queryClient.setQueryData(["driverRides", driver?.id], (old: any[] = []) =>
        old.map((r) => (r.id === ride.id ? { ...r, status: newStatus } : r))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["driverRides", driver?.id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["driverRides"] }),
  });

  const getPaymentMethodConfig = useCallback(
    (paymentMethod: string) => {
      const pms = settings?.payment_methods || [];
      const pm = pms.find((m) => m.key === paymentMethod);
      if (!pm) {
        return {
          auto_charge: paymentMethod === "company" || paymentMethod === "transfer",
          require_driver_confirmation: paymentMethod === "cash",
        };
      }
      return {
        auto_charge: !!pm.auto_charge,
        require_driver_confirmation: pm.require_driver_confirmation !== false && !pm.auto_charge,
      };
    },
    [settings?.payment_methods]
  );

  const handleUpdateStatus = useCallback(
    async (ride: Ride, newStatus: string) => {
      if (newStatus === "completed" && ride.company_id) {
        let survey = surveys.find(
          (s) => s.is_active !== false && (s.company_ids || []).includes(ride.company_id)
        );
        if (!survey) {
          const { data: comps, error } = await supabase
            .from("companies")
            .select("*")
            .eq("id", ride.company_id)
            .single();

          if (!error && comps?.survey_id) {
            survey = surveys.find(
              (s) => s.id === comps.survey_id && s.is_active !== false
            );
          }
        }
        if (survey) {
          const { data: existing, error } = await supabase
            .from("survey_responses")
            .select("*")
            .eq("ride_id", ride.id);

          if (!error && existing?.length === 0) {
            setPendingSurvey({ survey, ride });
            return;
          }
        }
      }
      await updateStatusMutation.mutateAsync({ ride, newStatus });
      if (newStatus === "completed") {
        const pmConfig = getPaymentMethodConfig(ride.payment_method || "cash");
        const commissionRate = driver?.commission_rate ?? settings?.platform_commission_pct ?? 20;
        const price = ride.final_price || ride.estimated_price || 0;
        const driverEarnings = parseFloat((price * (1 - commissionRate / 100)).toFixed(2));
        const platformCommission = parseFloat((price * (commissionRate / 100)).toFixed(2));
        const completedRide = {
          ...ride,
          status: "completed",
          final_price: price,
          driver_earnings: driverEarnings,
          platform_commission: platformCommission,
          commission_rate: commissionRate,
        };
        setRideSummary({ ride: completedRide, paymentMethodConfig: pmConfig });
      }
    },
    [updateStatusMutation, surveys, getPaymentMethodConfig, driver?.id, settings, queryClient]
  );

  const handleAcceptRide = async () => {
    if (!incomingRide) return;
    const ride = incomingRide;
    stopNewRideAlarm(ride.id);
    cancelSWRideTimer(ride.id);
    setIncomingRide(null);

    acceptedRideIdsRef.current.add(ride.id);

    if (ride.status === "auction") {
      const { data: current, error } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("id", ride.id)
        .single();

      if (error || !current || current.status !== "auction") return;

      await Promise.all([
        supabase
          .from("ride_requests")
          .update({
            status: "assigned",
            driver_id: driver?.id,
            driver_name: driver?.full_name,
            assignment_mode: "auction",
          })
          .eq("id", ride.id),
        supabase
          .from("Driver")
          .update({ status: "busy" })
          .eq("id", driver?.id || "")
      ]);
    } else if (ride.status === "assigned" && ride.driver_id === driver?.id) {
      await supabase
        .from("Driver")
        .update({ status: "busy" })
        .eq("id", driver?.id || "");
    }

    // Update local driver state
    setDriver((prev) => (prev ? { ...prev, status: "busy" } : prev));

    playAcceptedSound();
    queryClient.invalidateQueries({ queryKey: ["driverRides", driver?.id] });
  };

  const handleRejectRide = async (ride: Ride | null, reason: string = "driver_declined") => {
    if (ride?.id) {
      stopNewRideAlarm(ride.id);
      cancelSWRideTimer(ride.id);
    }
    setIncomingRide(null);

    const isActiveCancellation =
      reason === "driver_cancelled" &&
      ride?.id &&
      ["en_route", "arrived", "in_progress", "assigned", "admin_approved"].includes(ride?.status);

    if (isActiveCancellation) {
      const cancelledRide = {
        ...ride,
        status: "cancelled",
        cancelled_by: "driver",
        cancellation_reason: "Cancelado por el conductor",
      };
      const pms = settingsRef.current?.payment_methods || [];
      const pm = pms.find((m) => m.key === (ride?.payment_method || "cash"));
      const pmConfig = pm
        ? {
            auto_charge: !!pm.auto_charge,
            require_driver_confirmation: pm.require_driver_confirmation !== false && !pm.auto_charge,
          }
        : { auto_charge: false, require_driver_confirmation: true };
      setTimeout(() => setRideSummary({ ride: cancelledRide, paymentMethodConfig: pmConfig }), 500);
    }

    const isCancelByDriver = reason === "driver_cancelled";

    if (
      isCancelByDriver &&
      ride?.id &&
      ["en_route", "arrived", "in_progress", "assigned", "admin_approved"].includes(ride?.status)
    ) {
      await supabase
        .from("ride_requests")
        .update({
          status: "cancelled",
          cancelled_by: "driver",
          cancellation_reason: "Cancelado por el conductor",
          cancellation_fee: 0,
          final_price: 0,
          driver_earnings: 0,
          platform_commission: 0,
        })
        .eq("id", ride.id)

      const suspendUntil = Date.now() + 30 * 60 * 1000;
      const suspendUntilISO = new Date(suspendUntil).toISOString();
      await supabase
        .from("Driver")
        .update({ status: "offline", suspended_until: suspendUntilISO })
        .eq("id", driver?.id || "")

      setDriver((prev) => (prev ? { ...prev, status: "offline", suspended_until: suspendUntilISO } : prev));
      setSuspendedUntil(suspendUntil);
      localStorage.setItem("driver_suspended_until", String(suspendUntil));
      queryClient.invalidateQueries({ queryKey: ["driverRides"] });
      return;
    }

    if (ride?.status === "auction") {
      if (reason === "timeout" || reason === "driver_declined") {
        if (driver?.status !== "available") {
          await supabase
            .from("Driver")
            .update({ status: "available" })
            .eq("id", driver?.id || "")
          setDriver((prev) => (prev ? { ...prev, status: "available" } : prev));
        }
      }
      return;
    }

    // Reset ride to pending so it can be reassigned
    await supabase
      .from("ride_requests")
      .update({
        status: "pending",
        driver_id: null,
        driver_name: null,
      })
      .eq("id", ride?.id || "")

    if (isCancelByDriver) {
      const suspendUntil = Date.now() + 30 * 60 * 1000;
      const suspendUntilISO = new Date(suspendUntil).toISOString();
      await supabase
        .from("Driver")
        .update({ status: "offline", suspended_until: suspendUntilISO })
        .eq("id", driver?.id || "")
      setDriver((prev) => (prev ? { ...prev, status: "offline", suspended_until: suspendUntilISO } : prev));
      setSuspendedUntil(suspendUntil);
      localStorage.setItem("driver_suspended_until", String(suspendUntil));
    } else if (reason === "timeout" || reason === "driver_declined") {
      await supabase
        .from("Driver")
        .update({ status: "available" })
        .eq("id", driver?.id || "")
      setDriver((prev) => (prev ? { ...prev, status: "available" } : prev));
    } else if (reason && !["timeout", "assigned"].includes(reason)) {
      await supabase
        .from("Driver")
        .update({ status: "available" })
        .eq("id", driver?.id || "")
      setDriver((prev) => (prev ? { ...prev, status: "available" } : prev));
    } else {
      await supabase
        .from("Driver")
        .update({ status: "available" })
        .eq("id", driver?.id || "")
    }
    queryClient.invalidateQueries({ queryKey: ["driverRides"] });
  };

  const handleSelectVehicle = async (v: any) => {
    const vehicles = (driver?.vehicles || []).map((x) => ({ ...x, is_active: x.id === v.id }));
    const vf = {
      vehicle_brand: v.brand,
      vehicle_model: v.model,
      vehicle_year: v.year,
      vehicle_color: v.color,
      license_plate: v.plates,
    };
    await supabase
      .from("Driver")
      .update({ status: "available", vehicles, ...vf })
      .eq("id", driver?.id || "");
    setDriver((prev) => (prev ? { ...prev, status: "available", vehicles, ...vf } : prev));
    setShowVehicleSelector(false);
  };

  const toggleOnline = async () => {
    if (driver?.status === "suspended" || driver?.status === "blocked") return;
    if (driver?.status !== "available") {
      if (
        locationPermission === "denied" ||
        locationPermission === "prompt" ||
        locationPermission === "unknown" ||
        locationPermission === "checking"
      ) {
        setShowPermissionsOnboarding(true);
        return;
      }

      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => {});
      }

      const personalDocs = settings?.driver_required_docs || [];
      const docExpiries = driver?.doc_expiries || {};
      const expiredPersonalDoc = personalDocs.find((doc) => {
        if (doc.require_expiry === false) return false;
        const expiry = docExpiries[doc.key];
        if (!expiry) return false;
        return new Date(expiry) < new Date();
      });
      if (expiredPersonalDoc) {
        import("sonner").then(({ toast }) =>
          toast.error(
            `❌ No puedes conectarte: "${expiredPersonalDoc.label}" está vencido. Actualiza el documento y espera aprobación del administrador.`,
            { duration: 8000 }
          )
        );
        return;
      }

      const vehicles = driver?.vehicles || [];
      const vehicleDocs = settings?.driver_vehicle_docs || [];
      let targetVehicles = vehicles.length > 1 ? undefined : vehicles;

      if (vehicles.length > 1) {
        setShowVehicleSelector(true);
        return;
      }

      const av = vehicles.find((v) => v.is_active) || vehicles[0];
      if (av && vehicleDocs.length > 0) {
        const vtype = av.vehicle_type || "car";
        const docs = vehicleDocs.filter(
          (d) =>
            d.require_expiry !== false &&
            (!d.applies_to || d.applies_to === "both" || d.applies_to === vtype)
        );
        const expiredVehicleDoc = docs.find((doc) => {
          const expiry = av[`doc_${doc.key}_expiry`];
          if (!expiry) return false;
          return new Date(expiry) < new Date();
        });
        if (expiredVehicleDoc) {
          import("sonner").then(({ toast }) =>
            toast.error(
              `❌ No puedes conectarte: "${expiredVehicleDoc.label}" del vehículo está vencido. Actualiza el documento en tu perfil.`,
              { duration: 8000 }
            )
          );
          return;
        }
      }

      const vf = av
        ? {
            vehicle_brand: av.brand,
            vehicle_model: av.model,
            vehicle_year: av.year,
            vehicle_color: av.color,
            license_plate: av.plates,
          }
        : {};

      if (driver?.rest_required_until && new Date(driver.rest_required_until) > new Date()) {
        const until = new Date(driver.rest_required_until).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        });
        import("sonner").then(({ toast }) =>
          toast.error(`⛔ Debes descansar hasta las ${until} antes de reconectarte.`, {
            duration: 8000,
          })
        );
        return;
      }

      try {
        await supabase
          .from("Driver")
          .update({ status: "available", online_since: new Date().toISOString(), ...vf })
          .eq("id", driver?.id || "")
        setDriver((prev) => (prev ? { ...prev, status: "available", ...vf } : prev));
      } catch (e) {
        import("sonner").then(({ toast }) =>
          toast.error("Error al conectarte. Intenta de nuevo.")
        );
        return;
      }

      lastLocationSaveRef.current = 0;
      navigator.geolocation?.getCurrentPosition(
        (pos) => saveLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return;
    }

    if (driver?.online_since) {
      const worked = Math.round((Date.now() - new Date(driver.online_since).getTime()) / 60000);
      const newAccumulated = (driver.accumulated_work_minutes || 0) + worked;
      const s = settingsRef.current;
      const workMaxMins = (s?.work_max_hours ?? 12) * 60;
      const restRatioMins = s?.work_rest_ratio ?? 30;
      const restTriggerMins = s?.work_rest_trigger_minutes ?? 60;
      const longRestMins = s?.work_long_rest_minutes ?? 360;

      let restUntil = null;
      let resetAccumulated = false;

      if (newAccumulated >= workMaxMins) {
        restUntil = new Date(Date.now() + longRestMins * 60000).toISOString();
        resetAccumulated = true;
      } else {
        const earnedRestMins = Math.floor(worked / restTriggerMins) * restRatioMins;
        if (earnedRestMins > 0) {
          restUntil = new Date(Date.now() + earnedRestMins * 60000).toISOString();
        }
      }

      await supabase
        .from("Driver")
        .update({
          status: "offline",
          online_since: null,
          accumulated_work_minutes: resetAccumulated ? 0 : newAccumulated,
          ...(restUntil ? { rest_required_until: restUntil } : {}),
        })
        .eq("id", driver?.id || "")

      setDriver((prev) =>
        prev
          ? {
              ...prev,
              status: "offline",
              online_since: null,
              accumulated_work_minutes: resetAccumulated ? 0 : newAccumulated,
              ...(restUntil ? { rest_required_until: restUntil } : {}),
            }
          : prev
      );
    } else {
      await supabase
        .from("Driver")
        .update({ status: "offline" })
        .eq("id", driver?.id || "")
      setDriver((prev) => (prev ? { ...prev, status: "offline" } : prev));
    }
  };

  const handleSelectVehicleWithCheck = async (v: any) => {
    const vehicleDocs = settings?.driver_vehicle_docs || [];
    const vtype = v.vehicle_type || "car";
    const docs = vehicleDocs.filter(
      (d) =>
        d.require_expiry !== false &&
        (!d.applies_to || d.applies_to === "both" || d.applies_to === vtype)
    );
    const expiredVehicleDoc = docs.find((doc) => {
      const expiry = v[`doc_${doc.key}_expiry`];
      if (!expiry) return false;
      return new Date(expiry) < new Date();
    });
    if (expiredVehicleDoc) {
      import("sonner").then(({ toast }) =>
        toast.error(
          `❌ Este vehículo tiene "${expiredVehicleDoc.label}" vencido. Actualiza el documento antes de usarlo.`,
          { duration: 8000 }
        )
      );
      return;
    }
    await handleSelectVehicle(v);
  };

  const handleInactivityDisconnect = useCallback(async () => {
    if (!driver?.id || driver.status !== "available") return;
    const reason = "Desconexión automática por inactividad";
    await supabase
      .from("Driver")
      .update({ status: "offline", last_disconnect_reason: reason })
      .eq("id", driver.id)
    setDriver((prev) => (prev ? { ...prev, status: "offline", last_disconnect_reason: reason } : prev));
    setInactivityWarning(false);
    stopDriverHeartbeat();
    import("sonner").then(({ toast }) => toast.warning("⚠️ " + reason, { duration: 10000 }));
    showDriverNotification({
      title: "⚠️ Desconexión automática",
      body: reason,
      tag: "inactivity-disconnect",
    });
  }, [driver?.id, driver?.status]);

  useEffect(() => {
    handleInactivityDisconnectRef.current = handleInactivityDisconnect;
  }, [handleInactivityDisconnect]);

  useEffect(() => {
    if (!driver?.id || driver.status !== "available") {
      stopDriverHeartbeat();
      return;
    }
    const inactivityMs = (settings?.driver_inactivity_timeout_minutes ?? 30) * 60 * 1000;
    sendDriverHeartbeat(inactivityMs);
    const iv = setInterval(() => sendDriverHeartbeat(inactivityMs), 60 * 1000);
    return () => {
      clearInterval(iv);
    };
  }, [driver?.id, driver?.status, settings?.driver_inactivity_timeout_minutes]);

  useInactivityAutoDisconnect({
    driver,
    settings,
    onDisconnect: handleInactivityDisconnect,
    onWarn: () => setInactivityWarning(true),
  });

  useEffect(() => {
    if (!driver?.id || driver.status !== "available") return;
    const checkExpiredDocs = () => {
      const d = driverRef.current;
      if (!d || d.status !== "available") return;
      const s = settingsRef.current;

      const personalDocs = s?.driver_required_docs || [];
      const docExpiries = d.doc_expiries || {};
      const expiredPersonal = personalDocs.find((doc) => {
        if (doc.require_expiry === false) return false;
        const expiry = docExpiries[doc.key];
        return expiry && new Date(expiry) < new Date();
      });
      if (expiredPersonal) {
        const reason = `Desconexión automática: "${expiredPersonal.label}" está vencido`;
        supabase
          .from("Driver")
          .update({ status: "offline", last_disconnect_reason: reason })
          .eq("id", d.id)
        setDriver((prev) =>
          prev ? { ...prev, status: "offline", last_disconnect_reason: reason } : prev
        );
        import("sonner").then(({ toast }) =>
          toast.error(`⚠️ ${reason}. Actualiza el documento y espera aprobación.`, {
            duration: 10000,
          })
        );
        return;
      }

      const vehicles = d.vehicles || [];
      const av = vehicles.find((v) => v.is_active) || vehicles[0];
      if (!av) return;
      const vehicleDocs = s?.driver_vehicle_docs || [];
      const vtype = av.vehicle_type || "car";
      const docs = vehicleDocs.filter(
        (doc) =>
          doc.require_expiry !== false &&
          (!doc.applies_to || doc.applies_to === "both" || doc.applies_to === vtype)
      );
      const expiredVehicle = docs.find((doc) => {
        const expiry = av[`doc_${doc.key}_expiry`];
        return expiry && new Date(expiry) < new Date();
      });
      if (expiredVehicle) {
        const reason = `Desconexión automática: "${expiredVehicle.label}" del vehículo está vencido`;
        supabase
          .from("Driver")
          .update({ status: "offline", last_disconnect_reason: reason })
          .eq("id", d.id)
        setDriver((prev) =>
          prev ? { ...prev, status: "offline", last_disconnect_reason: reason } : prev
        );
        import("sonner").then(({ toast }) =>
          toast.error(`⚠️ ${reason}. Actualiza el documento en tu perfil.`, {
            duration: 10000,
          })
        );
      }
    };
    const iv = setInterval(checkExpiredDocs, 60 * 1000);
    return () => clearInterval(iv);
  }, [driver?.id, driver?.status]);

  const handleLogout = async () => {
    const msg = hasActiveRide
      ? "Tienes un servicio activo. ¿Seguro que deseas cerrar sesión?"
      : "¿Deseas cerrar sesión?";
    if (!window.confirm(msg)) return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    if (driver?.id) {
      await supabase
        .from("Driver")
        .update({ status: "offline" })
        .eq("id", driver.id)
    }
    setDriver(null);
  };

  const sendSOS = async () => {
    if (!window.confirm("¿Enviar alerta de emergencia SOS al administrador?")) return;
    let lat = null,
      lon = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch {}
    await supabase
      .from("sos_alerts")
      .insert([
        {
          driver_id: driver?.id,
          driver_name: driver?.full_name,
          message: "El conductor ha enviado una alerta de emergencia SOS",
          status: "active",
          latitude: lat,
          longitude: lon,
        },
      ])
    alert("✅ Alerta SOS enviada. El administrador fue notificado.");
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (locationPermission === "denied") return <LocationPermissionScreen onGranted={() => {}} onDenied={() => {}} />;
  if (sessionLoading)
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  if (!driver) return <DriverLoginScreen onLogin={setDriver} prefilledEmail={prefilledEmail} appLogo={appLogo} appName={appName} />;
  if (showPermissionsOnboarding)
    return (
      <PermissionsOnboarding
        onDone={() => {
          localStorage.setItem("driver_perms_done", "1");
          setShowPermissionsOnboarding(false);
        }}
      />
    );

  const handleStatusLogout = () => {
    if (!window.confirm("¿Deseas cerrar sesión?")) return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setDriver(null);
  };

  if (driver.approval_status === "pending")
    return <ApprovalPendingScreen onLogout={handleStatusLogout} />;
  if (driver.approval_status === "rejected")
    return <ApprovalRejectedScreen driver={driver} onLogout={handleStatusLogout} />;
  if (driver.status === "blocked")
    return <BlockedScreen driver={driver} onLogout={handleStatusLogout} />;
  if (driver.status === "suspended" && !suspendedUntil)
    return (
      <AdminSuspendedScreen
        driver={driver}
        whatsapp={settings?.support_whatsapp_number}
        onLogout={handleStatusLogout}
      />
    );
  if (suspendedUntil && suspendedUntil > Date.now())
    return (
      <SuspendedScreen
        suspendedUntil={suspendedUntil}
        whatsapp={settings?.support_whatsapp_number}
        reason="Cancelaste un servicio. Debes esperar antes de volver a conectarte."
        onReady={async () => {
          localStorage.removeItem("driver_suspended_until");
          setSuspendedUntil(null);
          await supabase
            .from("Driver")
            .update({ status: "available", suspended_until: null })
            .eq("id", driver.id)
          setDriver((prev) =>
            prev ? { ...prev, status: "available", suspended_until: null } : prev
          );
        }}
      />
    );

  const isSuspended = driver.status === "suspended" || driver.status === "blocked";
  const activeRides = rides.filter((r) => !["completed", "cancelled"].includes(r.status));
  const completedRides = rides.filter((r) => ["completed", "cancelled"].includes(r.status));
  const hasActiveRide = activeRides.some((r) =>
    ["assigned", "admin_approved", "en_route", "arrived", "in_progress"].includes(r.status)
  );

  return (
    <div
      className="min-h-screen bg-slate-900 select-none"
      style={{ overscrollBehavior: "none", touchAction: "pan-y" }}
    >
      <AnnouncementModal audience="drivers" cityId={driver?.city_id} serviceTypeId="ride" storageKey="driver_shown_announcements" />
      <IncomingRideAlert
        ride={incomingRide}
        driver={driver}
        settings={settings}
        onAccept={handleAcceptRide}
        onReject={handleRejectRide}
        timeoutSeconds={settings?.auction_timeout_seconds || 30}
      />

      {/* Header compacto flotante */}
      <div className="fixed top-0 left-0 right-0 z-20 select-none" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="bg-black/80 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between border-b border-white/10">
          <button
            className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
            onClick={() => setShowMenu(true)}
          >
            {appLogo && <img src={appLogo} alt="Logo" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />}
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
              {driver.photo_url ? (
                <img src={driver.photo_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                driver.full_name?.charAt(0)
              )}
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-sm leading-tight">{driver.full_name?.split(" ")[0]}</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-slate-300">
                  {driver.rating || 5} · {driver.total_rides || 0} viajes
                </span>
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <DriverNotificationsPanel driver={driver} />
            {/* Status pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                hasActiveRide
                  ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                  : driver.status === "available"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-slate-700 text-slate-400 border border-slate-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hasActiveRide
                    ? "bg-blue-400 animate-pulse"
                    : driver.status === "available"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-slate-500"
                }`}
              />
              {hasActiveRide ? "En servicio" : driver.status === "available" ? "En línea" : "Offline"}
            </div>
          </div>
        </div>

        {/* Alertas compactas debajo del header */}
        {isSuspended && (
          <div className="mx-4 mt-1 bg-red-500/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Cuenta {driver.status === "blocked" ? "bloqueada" : "suspendida"}. Contacta al administrador.
          </div>
        )}
        {outsideGeofence && driver.status === "available" && (
          <div className="mx-4 mt-1 bg-amber-500/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Fuera del área de servicio. No recibirás viajes.
          </div>
        )}
        {inactivityWarning && driver.status === "available" && (
          <div className="mx-4 mt-1 bg-orange-500/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5" />
              <span>¿Sigues activo? Te desconectarás en ~3 min.</span>
            </div>
            <button
              onClick={() => {
                _lastActivity.t = Date.now();
                setInactivityWarning(false);
              }}
              className="bg-white/20 rounded-lg px-2 py-0.5 text-[10px] font-bold ml-2 whitespace-nowrap"
            >
              Sigo aquí
            </button>
          </div>
        )}
        <div className="mx-4">
          <InstallAppBanner settings={settings} />
          <PushPermissionBanner driverId={driver?.id} />
          <DocumentExpiryBanner driver={driver} />
        </div>
        {settings?.driver_app_instructions && (
          <div className="mx-3 mt-1 bg-blue-500/80 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white">
            {settings.driver_app_instructions}
          </div>
        )}
      </div>

      {/* Pantalla principal */}
      <div className="fixed inset-0">
        {activeRides.length > 0 ? (
          <div className="fixed inset-0" style={{ zIndex: 5 }}>
            <AnimatePresence>
              {activeRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onUpdateStatus={handleUpdateStatus}
                  onRejectRide={handleRejectRide}
                  settings={settings}
                  driver={driver}
                  hideMap={!!incomingRide}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="fixed inset-0 overflow-hidden" style={{ paddingTop: "calc(env(safe-area-inset-top) + 64px)" }}>
            <HomeMap
              driver={driver}
              allRides={rides}
              settings={settings}
              onToggleOnline={toggleOnline}
              isSuspended={isSuspended}
              hasActiveRide={hasActiveRide}
              todayEarnings={(() => {
                const today = new Date().toDateString();
                const commissionRate = driver?.commission_rate ?? settings?.platform_commission_pct ?? 20;
                return rides
                  .filter(
                    (r) =>
                      r.status === "completed" &&
                      new Date(r.completed_at || r.requested_at || "").toDateString() ===
                        today
                  )
                  .reduce((sum, r) => {
                    const price = r.final_price || r.estimated_price || 0;
                    const earning =
                      r.driver_earnings != null
                        ? r.driver_earnings
                        : parseFloat((price * (1 - commissionRate / 100)).toFixed(2));
                    return sum + earning;
                  }, 0);
              })()}
            />
            {driver.license_plate && (
              <div className="absolute left-0 right-0 z-10 flex justify-center" style={{ top: 8 }}>
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-slate-300 mt-2">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {driver.vehicle_brand} {driver.vehicle_model} ·{" "}
                    <span className="text-white font-bold">{driver.license_plate}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menú desplegable */}
      <AnimatePresence>
        {showMenu && (
          <DriverMenu
            driver={driver}
            hasActiveRide={hasActiveRide}
            onClose={() => setShowMenu(false)}
            onOpenEarnings={() => setActiveTab("earnings")}
            onOpenHistory={() => setShowHistory(true)}
            onOpenProfile={() => setActiveTab("profile")}
            onOpenTickets={() => setShowTickets(true)}
            onLogout={handleLogout}
            onSOS={sendSOS}
          />
        )}
      </AnimatePresence>

      {/* Vistas de ganancias y perfil */}
      <AnimatePresence>
        {activeTab === "earnings" && (
          <motion.div
            key="earnings"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-0 bg-slate-900 z-[60] flex flex-col"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900 flex-shrink-0"
              style={{ paddingTop: "max(16px, calc(env(safe-area-inset-top) + 12px))" }}
            >
              <button
                onClick={() => setActiveTab("rides")}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-white font-bold">Ganancias</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PullToRefresh
                onRefresh={() =>
                  queryClient.invalidateQueries({ queryKey: ["driverRides", driver?.id] })
                }
              >
                <DriverEarningsTab driver={driver} rides={rides} onShowHistory={() => setShowHistory(true)} />
              </PullToRefresh>
            </div>
          </motion.div>
        )}
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-0 bg-slate-900 z-[60] flex flex-col"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900 flex-shrink-0"
              style={{ paddingTop: "max(16px, calc(env(safe-area-inset-top) + 12px))" }}
            >
              <button
                onClick={() => setActiveTab("rides")}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-white font-bold">Mi perfil</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DriverProfileTab
                driver={driver}
                onPhotoUpdate={(url) => setDriver((prev) => (prev ? { ...prev, photo_url: url } : prev))}
                onLogout={handleLogout}
                onDeleteAccount={() => setDriver(null)}
                onDriverUpdate={(updated) => setDriver(updated)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <RideHistoryModal rides={completedRides} driver={driver} onClose={() => setShowHistory(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showHelp && (
          <DriverHelpTicket
            driver={driver}
            rideContext={helpRideContext}
            onClose={() => {
              setShowHelp(false);
              setHelpRideContext(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTickets && (
          <DriverHelpTicket driver={driver} rideContext={null} onClose={() => setShowTickets(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVehicleSelector && (
          <VehicleSelectorModal
            vehicles={driver.vehicles || []}
            vehicleDocs={settings?.driver_vehicle_docs || []}
            onSelect={handleSelectVehicleWithCheck}
            onClose={() => setShowVehicleSelector(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {pendingSurvey && (
          <DriverSurveyModal
            survey={pendingSurvey.survey}
            ride={pendingSurvey.ride}
            driver={driver}
            onComplete={() => {
              const { ride } = pendingSurvey;
              setPendingSurvey(null);
              updateStatusMutation.mutate({ ride, newStatus: "completed" });
              if (!ride.driver_rating_for_passenger) setPendingPassengerRating({ ride });
            }}
            onClose={() => setPendingSurvey(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rideSummary && (
          <RideSummaryScreen
            ride={rideSummary.ride}
            driver={driver}
            paymentMethodConfig={rideSummary.paymentMethodConfig}
            onDone={() => {
              setRideSummary(null);
              queryClient.invalidateQueries({ queryKey: ["driverRides", driver?.id] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Status Screens ───────────────────────────────────────────────────────────
function ApprovalPendingScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-6 select-none"
      style={{
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="w-24 h-24 bg-amber-500/20 border-2 border-amber-400/40 rounded-3xl flex items-center justify-center mx-auto">
          <Clock className="w-12 h-12 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Solicitud en revisión</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tu cuenta está siendo revisada por el equipo de administración. Te notificaremos cuando sea
            aprobada.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left space-y-1.5">
          <p className="text-amber-300 text-xs">📋 Tu solicitud fue recibida correctamente.</p>
          <p className="text-amber-300/70 text-xs">El proceso de revisión puede tomar 24-48 horas hábiles.</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-2xl min-h-[48px] flex items-center justify-center gap-2 transition-all"
        >
          Cerrar sesión
        </button>
      </motion.div>
    </div>
  );
}

function ApprovalRejectedScreen({ driver, onLogout }: { driver: Driver; onLogout: () => void }) {
  return (
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-6 select-none"
      style={{
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="w-24 h-24 bg-red-500/20 border-2 border-red-400/40 rounded-3xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Solicitud rechazada</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {driver.rejection_reason
              ? `Motivo: ${driver.rejection_reason}`
              : "Tu solicitud de registro fue rechazada. Por favor contacta al administrador."}
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-left">
          <p className="text-red-300 text-xs">
            Si crees que esto es un error, comunícate con soporte para revisar tu caso.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-2xl min-h-[48px] flex items-center justify-center gap-2 transition-all"
        >
          Cerrar sesión
        </button>
      </motion.div>
    </div>
  );
}

function BlockedScreen({ driver, onLogout }: { driver: Driver; onLogout: () => void }) {
  return (
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-6 select-none"
      style={{
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="w-24 h-24 bg-red-700/20 border-2 border-red-600/40 rounded-3xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Cuenta bloqueada</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tu cuenta ha sido bloqueada permanentemente. Por favor contacta al administrador para resolver
            esta situación.
          </p>
        </div>
        {driver.admin_notes && (
          <div className="bg-red-700/10 border border-red-600/30 rounded-2xl p-4 text-left">
            <p className="text-red-300 text-xs">{driver.admin_notes}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-2xl min-h-[48px] flex items-center justify-center gap-2 transition-all"
        >
          Cerrar sesión
        </button>
      </motion.div>
    </div>
  );
}

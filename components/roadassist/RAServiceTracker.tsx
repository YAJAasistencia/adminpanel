import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showPassengerNotification, initPassengerPush } from "@/components/shared/usePushNotifications";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Phone, Star, Car, CheckCircle, Loader2,
  XCircle, AlertCircle, User, Navigation, Truck, Clock, MessageCircle, ChevronUp, ChevronDown
} from "lucide-react";
import moment from "moment";
import { AnimatePresence, motion } from "framer-motion";
import PassengerRideSummary from "@/components/roadassist/PassengerRideSummary";
import { getRoute, getHaverDist } from "@/components/shared/mapsUtils";
import SearchingPhase from "@/components/roadassist/RASearchingPhase";
import RAPassengerChat from "@/components/roadassist/RAPassengerChat";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:40px;height:40px;background:#3B82F6;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.5)">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12H9.5a1.5 1.5 0 010-3h.5V14a2 2 0 012-2h3a2 2 0 012 2v3h.5a1.5 1.5 0 010 3H18m-5-6h2"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const dropoffIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:32px;height:32px;background:#EF4444;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const pickupIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:36px;height:36px;background:#10B981;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 32],
});

function MapFitBounds({ driverLat, driverLon, pickupLat, pickupLon }) {
  const map = useMap();
  const fittedRef = useRef(false);
  const prevDriverRef = useRef(null);

  useEffect(() => {
    if (fittedRef.current) return;
    if (!pickupLat || !pickupLon) return;
    if (driverLat && driverLon) {
      try {
        const bounds = L.latLngBounds([driverLat, driverLon], [pickupLat, pickupLon]).pad(0.3);
        map.fitBounds(bounds, { maxZoom: 15, animate: true });
        fittedRef.current = true;
      } catch {}
    } else {
      map.setView([pickupLat, pickupLon], 14, { animate: true });
      fittedRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!driverLat, !!driverLon, !!pickupLat]);

  useEffect(() => {
    if (!driverLat || !driverLon || !fittedRef.current) return;
    const prev = prevDriverRef.current;
    if (prev && prev.lat === driverLat && prev.lon === driverLon) return;
    prevDriverRef.current = { lat: driverLat, lon: driverLon };
    map.panTo([driverLat, driverLon], { animate: true, duration: 1.2 });
  }, [driverLat, driverLon]);

  return null;
}

function formatETA(minutes) {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
// ─── Main component ───────────────────────────────────────────────────────────
const STATUS_INFO = {
  pending:        { label: "Buscando conductor...", color: "text-amber-400",   bg: "bg-amber-500/20",   icon: Loader2, spin: true },
  auction:        { label: "Buscando conductor...", color: "text-amber-400",   bg: "bg-amber-500/20",   icon: Loader2, spin: true },
  no_drivers:     { label: "Sin conductores",       color: "text-red-400",     bg: "bg-red-500/20",     icon: XCircle },
  assigned:       { label: "Conductor asignado",    color: "text-blue-400",    bg: "bg-blue-500/20",    icon: User },
  admin_approved: { label: "Conductor en camino",   color: "text-blue-400",    bg: "bg-blue-500/20",    icon: Navigation },
  en_route:       { label: "Conductor en camino",   color: "text-blue-400",    bg: "bg-blue-500/20",    icon: Navigation },
  arrived:        { label: "¡Conductor llegó!",     color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle },
  in_progress:    { label: "Servicio en progreso",  color: "text-purple-400",  bg: "bg-purple-500/20",  icon: Truck },
  completed:      { label: "¡Servicio completado!", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle },
  cancelled:      { label: "Cancelado",             color: "text-red-400",     bg: "bg-red-500/20",     icon: XCircle },
};

export default function RAServiceTracker({ ride, user, onRefresh, onRideEnded }) {
  useEffect(() => {
    if (user?.id) initPassengerPush(user.id);
  }, [user?.id]);

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [unreadDriverMessages, setUnreadDriverMessages] = useState(0);
  const [mapRoute, setMapRoute] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryRide, setSummaryRide] = useState(null);
  const [rideSnapshot, setRideSnapshot] = useState(ride);
  const [noDriversAction, setNoDriversAction] = useState(null);
  const [checkingAgents, setCheckingAgents] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [distKm, setDistKm] = useState(null);
  const queryClient = useQueryClient();

  const { data: liveRide } = useQuery({
    queryKey: ["ra_live_ride", ride?.id],
    enabled: !!ride?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase.from("ride_requests").select("*").eq("id", ride.id);
      return data?.[0] || ride;
    },
  });

  useEffect(() => {
    if (!ride?.id) return;
    const channel = supabase.channel(`rt:ride_requests:${ride.id}`);
    const sub = channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "ride_requests", filter: `id=eq.${ride.id}` }, (event) => {
      const data = event.new;
      if (data?.id !== ride.id) return;
      queryClient.setQueryData(["ra_live_ride", ride.id], data);
      setRideSnapshot(data);
    }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [ride?.id, queryClient]);

  const currentRide = liveRide || rideSnapshot || ride;

  const { data: driverData } = useQuery({
    queryKey: ["ra_driver", currentRide?.driver_id],
    enabled: !!currentRide?.driver_id,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase.from("Driver").select("*").eq("id", currentRide.driver_id);
      return data?.[0];
    },
  });

  useEffect(() => {
    if (!currentRide?.driver_id) return;
    const channel = supabase.channel(`rt:Driver:${currentRide.driver_id}`);
    const sub = channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "Driver", filter: `id=eq.${currentRide.driver_id}` }, (event) => {
      const data = event.new;
      if (data?.id !== currentRide.driver_id) return;
      queryClient.setQueryData(["ra_driver", currentRide.driver_id], data);
    }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentRide?.driver_id, queryClient]);

  const { data: settings } = useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      const { data } = await supabase.from("AppSettings").select("*");
      return data?.[0];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["cancellationPolicies"],
    queryFn: async () => {
      const { data } = await supabase.from("cancellation_policies").select("*").eq("is_active", true);
      return data || [];
    },
  });

  // Subscribe to chat messages for unread badge + sound notification
  useEffect(() => {
    if (!ride?.id) return;
    const channel = supabase.channel(`rt:ChatMessage:${ride.id}`);
    const sub = channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `ride_id=eq.${ride.id}` }, (event) => {
      const msg = event.new;
      if (!msg || msg.ride_id !== ride.id) return;
      if ((msg.sender_role === "driver" || msg.sender_role === "admin") && !msg.read_by_passenger) {
        if (!showChat) {
          setUnreadDriverMessages(prev => prev + 1);
          // Play notification sound
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
            setTimeout(() => ctx.close(), 500);
          } catch (_) {}
        }
      }
    }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [ride?.id, showChat]);

  const prevStatusRef = useRef(currentRide?.status || null);
  const summaryShownRef = useRef(
    currentRide?.status === "completed" || currentRide?.status === "cancelled"
  );
  const pushSentRef = useRef(new Set());

  useEffect(() => {
    const status = currentRide?.status;
    if (!status) return;
    const key = `${currentRide?.id}_${status}`;
    if (!prevStatusRef.current || prevStatusRef.current === status || pushSentRef.current.has(key)) return;
    const pushMessages = {
      assigned: { title: "🚗 Conductor asignado", body: `${currentRide.driver_name || "Tu conductor"} está en camino` },
      en_route: { title: "🚗 Conductor en camino", body: `${currentRide.driver_name || "El conductor"} se dirige hacia ti` },
      admin_approved: { title: "✅ Servicio aprobado", body: "Tu conductor está en camino" },
      arrived: { title: "📍 ¡Tu conductor llegó!", body: `${currentRide.driver_name || "El conductor"} te espera en el punto de recogida` },
      in_progress: { title: "🚙 Servicio en curso", body: "Tu servicio ha comenzado" },
      completed: { title: "✅ Servicio completado", body: `Total: $${(currentRide.final_price || currentRide.estimated_price || 0).toFixed(2)}` },
      cancelled: { title: "❌ Servicio cancelado", body: currentRide.cancellation_reason || "Tu servicio fue cancelado" },
    };
    const msg = pushMessages[status];
    if (msg) { pushSentRef.current.add(key); showPassengerNotification({ ...msg, rideId: currentRide.id }); }
  }, [currentRide?.status]);

  // ETA calculation
  useEffect(() => {
    if (!currentRide?.pickup_lat || !driverData?.latitude) return;
    const speedKmh = settings?.eta_speed_kmh ?? 30;
    const trafficFactor = settings?.city_traffic_factor ?? 1.0;
    const provider = settings?.maps_provider || "osrm";
    const apiKey = settings?.google_maps_api_key;
    getRoute(driverData.latitude, driverData.longitude, currentRide.pickup_lat, currentRide.pickup_lon, provider, apiKey)
      .then(route => {
        if (route) { setDistKm(route.distKm); setEtaMinutes(Math.round(route.durationMin * trafficFactor)); }
        else {
          const km = getHaverDist(driverData.latitude, driverData.longitude, currentRide.pickup_lat, currentRide.pickup_lon);
          setDistKm(km); setEtaMinutes(km ? Math.ceil((km / speedKmh) * 60 * trafficFactor) : null);
        }
      }).catch(() => {});
  }, [driverData?.latitude, driverData?.longitude, currentRide?.pickup_lat]);

  // Fetch route for map polyline
  useEffect(() => {
    if (!currentRide?.pickup_lat || !driverData?.latitude) return;
    fetch(`https://router.project-osrm.org/route/v1/driving/${driverData.longitude},${driverData.latitude};${currentRide.pickup_lon},${currentRide.pickup_lat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) setMapRoute(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      }).catch(() => {});
  }, [driverData?.latitude, driverData?.longitude, currentRide?.pickup_lat]);

  // Single effect to show summary on ride completion/cancellation
  useEffect(() => {
    const status = currentRide?.status;
    if (!status) return;
    const isTerminal = status === "completed" || status === "cancelled";
    if (isTerminal && !summaryShownRef.current) {
      summaryShownRef.current = true;
      setSummaryRide(currentRide);
      setShowSummary(true);
    }
    prevStatusRef.current = status;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRide?.status]);

  const isNoDrivers = currentRide?.status === "no_drivers";
  useEffect(() => {
    if (isNoDrivers && !noDriversAction) setNoDriversAction("asking");
    // Reset noDriversAction when ride transitions away from no_drivers (e.g. manual assignment accepted)
    if (!isNoDrivers && noDriversAction === "requesting_manual") setNoDriversAction(null);
  }, [isNoDrivers]);

  if (!currentRide) return null;

  const calcCancellationFee = () => {
    const policy = policies[0];
    if (!policy || !currentRide) return 0;
    const mins = moment().diff(moment(currentRide.created_at), "minutes");
    if (mins <= (policy.free_cancellation_minutes || 5)) return 0;
    return policy.fee_type === "percentage"
      ? ((currentRide.estimated_price || 0) * (policy.fee_amount || 0)) / 100
      : policy.fee_amount || 0;
  };

  const handleCancel = async () => {
    setCancelling(true);
    const fee = calcCancellationFee();
    const cancelledRide = { ...currentRide, status: "cancelled", cancelled_by: "passenger", cancellation_fee: fee, cancellation_reason: "Cancelado por el pasajero" };
    await supabase.from("ride_requests").update({
      status: "cancelled", cancelled_by: "passenger",
      cancellation_fee: fee, cancellation_reason: "Cancelado por el pasajero",
      payment_status: fee > 0 ? "debt" : "not_required",
    }).eq("id", currentRide.id);
    if (currentRide.driver_id) await supabase.from("Driver").update({ status: "available" }).eq("id", currentRide.driver_id);
    if (fee > 0 && user?.id) await supabase.from("RoadAssistUser").update({ pending_balance: (user.pending_balance || 0) + fee }).eq("id", user.id);
    setCancelling(false);
    setShowCancelConfirm(false);
    setSummaryRide(cancelledRide);
    setShowSummary(true);
    queryClient.invalidateQueries({ queryKey: ["ra_active_rides"] });
  };

  const handleRequestManual = async () => {
    setCheckingAgents(true);
    try {
      const updatedRide = {
        ...currentRide,
        status: "pending",
        assignment_mode: "manual",
        cancellation_reason: null,
        manual_assignment_requested_at: new Date().toISOString(),
      };
      await supabase.from("ride_requests").update({
        status: "pending", assignment_mode: "manual",
        cancellation_reason: null, manual_assignment_requested_at: updatedRide.manual_assignment_requested_at,
      }).eq("id", currentRide.id);
      // Update local state immediately so isNoDrivers becomes false right away
      setRideSnapshot(updatedRide);
      queryClient.setQueryData(["ra_live_ride", currentRide.id], updatedRide);
      setNoDriversAction("requesting_manual");
    } finally { setCheckingAgents(false); }
  };

  const handleCancelNoDrivers = async () => {
    await supabase.from("ride_requests").update({
      status: "cancelled", cancelled_by: "passenger",
      cancellation_reason: "Sin conductores disponibles — cancelado por pasajero",
    }).eq("id", currentRide.id);
    queryClient.invalidateQueries({ queryKey: ["ra_active_rides"] });
    onRideEnded();
  };

  const fee = calcCancellationFee();
  const canCancel = !["completed", "cancelled", "in_progress"].includes(currentRide.status);
  const statusInfo = STATUS_INFO[currentRide.status] || STATUS_INFO.pending;
  const StatusIcon = statusInfo.icon;
  const isSearching = ["pending", "auction"].includes(currentRide.status);
  const isArrived = currentRide.status === "arrived";
  const isInProgress = currentRide.status === "in_progress";
  const etaLabel = formatETA(etaMinutes);
  const mapCenterLat = currentRide.pickup_lat || 19.4326;
  const mapCenterLon = currentRide.pickup_lon || -99.1332;

  // ── No drivers screens ────────────────────────────────────────────────────────
  if (isNoDrivers && noDriversAction === "asking") {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-5">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-white font-black text-2xl mb-2">Sin conductores disponibles</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-4">No encontramos conductores disponibles en tu zona en este momento.</p>
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 text-left">
          <div className="flex items-start gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" /><p className="text-white/70 text-sm">{currentRide.pickup_address}</p></div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10"><span className="text-white/40 text-xs">{currentRide.service_type_name}</span><span className="text-emerald-400 font-bold text-sm">${(currentRide.estimated_price || 0).toFixed(0)}</span></div>
        </div>
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5">
          <p className="text-amber-200 font-semibold text-sm mb-1">¿Solicitar asignación manual?</p>
          <p className="text-amber-300/60 text-xs">Un operador asignará el conductor manualmente.</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={handleCancelNoDrivers} className="flex-1 py-3.5 text-sm font-semibold text-red-400 border border-red-500/30 rounded-2xl bg-red-500/10">No, cancelar</button>
          <button onClick={handleRequestManual} disabled={checkingAgents} className="flex-1 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-2xl disabled:opacity-60">
            {checkingAgents ? "Enviando..." : "Sí, solicitar"}
          </button>
        </div>
      </div>
    );
  }

  if (isNoDrivers && noDriversAction === "requesting_manual") {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-5">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        </div>
        <h2 className="text-white font-black text-xl mb-2">Esperando asignación</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-6">Tu solicitud fue enviada. Un agente asignará tu conductor en breve.</p>
        <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" /><p className="text-white/70 text-sm">{currentRide.pickup_address}</p></div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10"><span className="text-white/40 text-xs">{currentRide.service_type_name}</span><span className="text-emerald-400 font-bold text-sm">${(currentRide.estimated_price || 0).toFixed(0)}</span></div>
        </div>
        <button onClick={handleCancelNoDrivers} className="mt-5 text-red-400 text-sm underline">Cancelar solicitud</button>
      </div>
    );
  }

  // ── Main full-screen layout: MAP BACKGROUND + BOTTOM SHEET ───────────────────
  return (
    <div className="fixed inset-0 bg-slate-900" style={{ touchAction: "pan-y" }}>

      {/* FULL-SCREEN MAP */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={[mapCenterLat, mapCenterLon]}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {mapRoute && <Polyline positions={mapRoute} color="#3B82F6" weight={4} opacity={0.9} />}
          {currentRide.dropoff_lat && currentRide.dropoff_lon && (
            <Marker position={[currentRide.dropoff_lat, currentRide.dropoff_lon]} icon={dropoffIcon}>
              <Popup>🏁 Destino</Popup>
            </Marker>
          )}
          <MapFitBounds
            driverLat={driverData?.latitude}
            driverLon={driverData?.longitude}
            pickupLat={currentRide.pickup_lat}
            pickupLon={currentRide.pickup_lon}
          />
          {currentRide.pickup_lat && currentRide.pickup_lon && (
            <Marker position={[currentRide.pickup_lat, currentRide.pickup_lon]} icon={pickupIcon}>
              <Popup>Tu ubicación de recogida</Popup>
            </Marker>
          )}
          {driverData?.latitude && driverData?.longitude && (
            <Marker position={[driverData.latitude, driverData.longitude]} icon={driverIcon}>
              <Popup>{driverData.full_name}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* TOP STATUS BAR — full width, pinned to top */}
      <div className="absolute left-0 right-0 z-10" style={{ top: 0, paddingTop: "env(safe-area-inset-top)" }}>
        <div className="bg-slate-900 px-3 py-2.5 flex items-center gap-2 border-b border-white/10 shadow-xl">
          {/* Logo */}
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
            : <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Truck className="w-3.5 h-3.5 text-white" /></div>}
          {/* Service info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate" style={{ color: '#fff' }}>{ride?.service_type_name || "Asistencia Vial"}</p>
            <p className="text-white/50 text-[10px] truncate">{currentRide.passenger_name}</p>
          </div>
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0 ${statusInfo.bg}`}>
            <StatusIcon className={`w-3 h-3 ${statusInfo.color} ${statusInfo.spin ? "animate-spin" : ""}`} />
            <span className={`text-[10px] font-bold ${statusInfo.color} whitespace-nowrap`}>{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* ETA PILL — only when driver is assigned and has ETA */}
      {!isSearching && etaLabel && !isArrived && !isInProgress && (
        <div className="absolute z-10 left-0 right-0 flex justify-center" style={{ top: "calc(env(safe-area-inset-top) + 68px)" }}>
          <div className="bg-blue-600/90 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-2 shadow-xl border border-blue-400/30">
            <Navigation className="w-4 h-4 text-blue-200" />
            <span className="text-white font-black text-lg">{etaLabel}</span>
            <span className="text-blue-200 text-xs">estimado</span>
            {distKm && <span className="text-blue-300/60 text-xs ml-1">· {distKm.toFixed(1)} km</span>}
          </div>
        </div>
      )}

      {/* ARRIVED PILL */}
      {isArrived && (
        <div className="absolute z-10 left-0 right-0 flex justify-center" style={{ top: "calc(env(safe-area-inset-top) + 68px)" }}>
          <div className="bg-emerald-500/90 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-2 shadow-xl border border-emerald-400/30">
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-white font-black text-base">¡Tu conductor llegó!</span>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET */}
      <div className="absolute left-0 right-0 bottom-0 z-20" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <motion.div
          animate={{ height: sheetExpanded ? "65vh" : "auto" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-white rounded-t-3xl border-t border-slate-200 flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Drag handle + toggle */}
          <button
            onClick={() => setSheetExpanded(v => !v)}
            className="w-full flex flex-col items-center pt-3 pb-1 flex-shrink-0"
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 mb-1" />
          </button>

          {/* Cancel confirmation — always visible above searching/driver view */}
          {showCancelConfirm && (
            <div className="px-4 pb-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">¿Confirmar cancelación?</p>
                    {fee > 0 ? (
                      <div className="mt-2 bg-amber-500/15 border border-amber-500/30 rounded-xl p-3">
                        <p className="text-amber-300 text-xs font-semibold">⚠️ Cargo por cancelación tardía</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-white/60 text-xs">Cargo</span>
                          <span className="text-amber-400 font-black text-xl">${fee.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                        <p className="text-emerald-300 text-xs font-medium">✓ Sin cargo — dentro del tiempo de tolerancia</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCancel} disabled={cancelling}
                    className="flex-1 bg-red-600 hover:bg-red-500 rounded-xl text-sm h-10">
                    {cancelling ? "Cancelando..." : fee > 0 ? `Cancelar ($${fee.toFixed(0)})` : "Sí, cancelar"}
                  </Button>
                  <button onClick={() => setShowCancelConfirm(false)}
                    className="px-4 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200">
                    Volver
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed view: driver info + action button */}
          {!sheetExpanded && !showCancelConfirm && (
            <div className="px-4 pb-4 space-y-3">
              {isSearching ? (
                <SearchingPhase ride={currentRide} onCancel={() => setShowCancelConfirm(true)} cancelling={cancelling} />
              ) : (
                <>
                  {/* Driver info row */}
                  {driverData && (
                    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-slate-100">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {driverData.photo_url
                          ? <img src={driverData.photo_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xl font-black text-blue-500">{driverData.full_name?.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-bold text-base truncate">{driverData.full_name}</p>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-slate-600 text-xs">{driverData.rating || 5}</span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">{driverData.license_plate}</span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">{driverData.vehicle_color} {driverData.vehicle_brand} {driverData.vehicle_model}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {driverData.phone && (
                          <a href={`tel:${driverData.phone}`}
                            className="w-11 h-11 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center">
                            <Phone className="w-5 h-5 text-emerald-600" />
                          </a>
                        )}
                        <button onClick={() => setSheetExpanded(true)}
                                  className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600">
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex gap-2">
                    {!!currentRide.driver_id && (
                      <button onClick={() => { setShowChat(true); setUnreadDriverMessages(0); }}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold py-3 rounded-2xl relative">
                        <MessageCircle className="w-4 h-4" /> Chat
                        {unreadDriverMessages > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">{unreadDriverMessages}</span>
                        )}
                      </button>
                    )}
                    {canCancel && (
                      <button onClick={() => setShowCancelConfirm(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-red-400 text-sm border border-red-500/20 py-3 rounded-2xl bg-red-500/5">
                        Cancelar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Expanded sheet: full details */}
          {sheetExpanded && (
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {/* Header close */}
              <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-slate-900 font-bold text-base">Detalle del servicio</p>
                <button onClick={() => setSheetExpanded(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {isSearching ? (
                <SearchingPhase ride={currentRide} onCancel={() => setShowCancelConfirm(true)} cancelling={cancelling} />
              ) : (
                <>
                  {/* Driver card */}
                  {driverData && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-100">
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-3">Tu conductor</p>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {driverData.photo_url
                            ? <img src={driverData.photo_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-2xl font-black text-blue-500">{driverData.full_name?.charAt(0)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-bold text-base">{driverData.full_name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-slate-600 text-xs">{driverData.rating || 5}</span>
                            <span className="text-slate-400 text-xs">· {driverData.total_rides || 0} servicios</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Car className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500 text-xs">{driverData.vehicle_color} {driverData.vehicle_brand} {driverData.vehicle_model}</span>
                          </div>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono mt-1 inline-block">{driverData.license_plate}</span>
                        </div>
                        {driverData.phone && (
                          <a href={`tel:${driverData.phone}`}
                            className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-emerald-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ride info */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Ruta</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-800 text-sm">{currentRide.pickup_address}</p>
                    </div>
                    {currentRide.dropoff_address && (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0 ml-1" />
                        <p className="text-slate-600 text-sm">{currentRide.dropoff_address}</p>
                      </div>
                    )}
                    {currentRide.notes && <p className="text-slate-400 text-xs border-t border-slate-100 pt-2">📝 {currentRide.notes}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-slate-500 text-xs">Pago</span>
                      <span className="text-slate-700 text-sm capitalize">{currentRide.payment_method || "efectivo"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs">Tarifa estimada</span>
                      <span className="text-emerald-600 font-bold">${(currentRide.estimated_price || 0).toFixed(0)}</span>
                    </div>
                    {currentRide.final_price > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Tarifa final</span>
                        <span className="text-slate-900 font-bold text-lg">${currentRide.final_price.toFixed(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Chat button */}
                  {!!currentRide.driver_id && (
                    <button onClick={() => { setSheetExpanded(false); setShowChat(true); setUnreadDriverMessages(0); }}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold py-3.5 rounded-2xl relative">
                      <MessageCircle className="w-4 h-4" /> Chat con tu conductor
                      {unreadDriverMessages > 0 && (
                        <span className="absolute -top-1 right-2 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">{unreadDriverMessages}</span>
                      )}
                    </button>
                  )}

                  {/* Cancel */}
                  {canCancel && !showCancelConfirm && (
                    <button onClick={() => setShowCancelConfirm(true)}
                      className="w-full text-red-600 text-sm border border-red-200 py-3 rounded-2xl bg-red-50">
                      Cancelar solicitud
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {showChat && <RAPassengerChat ride={currentRide} user={user} onClose={() => setShowChat(false)} />}
      </AnimatePresence>

      {/* SUMMARY SCREEN */}
      <AnimatePresence>
        {showSummary && summaryRide && (
          <PassengerRideSummary
            ride={summaryRide}
            user={user}
            onDone={() => {
              setShowSummary(false);
              setSummaryRide(null);
              onRideEnded();
              queryClient.invalidateQueries({ queryKey: ["ra_active_rides"] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

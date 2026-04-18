import React, { useState, useEffect } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  MapPin, Phone, Navigation, CheckCircle2, Car, Star, Camera,
  MessageCircle, AlertTriangle, HelpCircle, ChevronUp, ChevronDown, User
} from "lucide-react";
import RideMap from "@/components/driver/RideMap";
import RideFareBreakdown from "@/components/driver/RideFareBreakdown";
import DriverChat from "@/components/driver/DriverChat";
import { getDistance } from "@/components/driver/driverUtils";

function CancelRideConfirm({ ride, onConfirm }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-2 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">¿Confirmas la cancelación?</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
          <p className="text-emerald-700 text-xs font-medium">✓ Sin cargo al pasajero</p>
        </div>
        <p className="text-xs text-red-600">Serás <strong>desconectado por 30 minutos</strong>.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 rounded-xl min-h-[44px] border-slate-200 text-slate-600 select-none"
            onClick={() => setShowConfirm(false)}>
            Volver atrás
          </Button>
          <Button size="sm" className="flex-1 rounded-xl min-h-[44px] bg-red-600 hover:bg-red-700 text-white select-none"
            onClick={() => { setShowConfirm(false); onConfirm(); }}>
            Sí, cancelar
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <Button variant="ghost" size="sm"
      className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl mb-2 min-h-[44px] select-none"
      onClick={() => setShowConfirm(true)}>
      Cancelar servicio
    </Button>
  );
}

export default function RideCard({ ride, onUpdateStatus, onRejectRide, settings, driver, hideMap = false }) {
  const [uploadingProof, setUploadingProof] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [waitTime, setWaitTime] = useState(0); // Timer for pickup wait time in seconds
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery({
    queryKey: ["cancellationPolicies"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("cancellation_policies").select("*").eq("is_active", true);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching cancellation policies:", err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Live chat query so unread badge stays current even when chat is closed
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["chatMessages", ride.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("chat_messages").select("*").eq("ride_id", ride.id).order("created_at", { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching chat messages:", err);
        return [];
      }
    },
    enabled: !!ride.id && isActive,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const unreadAdminMessages = chatMessages.filter(
    m => (m.sender_role === "admin" || m.sender_role === "passenger") && !m.read_by_driver
  ).length;

  const isRoadAssistRide = !!ride.passenger_user_id;
  const requireAdminApproval = !isRoadAssistRide && (
    ride.require_admin_approval === true || settings?.require_admin_approval_to_start === true
  );
  const proofPhotoRequired = ride.proof_photo_required === true;
  const canComplete = !proofPhotoRequired || !!ride.proof_photo_url;

  useEffect(() => {
    if (ride.status !== "en_route") return;
    const watchId = navigator.geolocation?.watchPosition(
      pos => setDriverLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => { if (watchId != null) navigator.geolocation?.clearWatch(watchId); };
  }, [ride.status]);

  // Timer for arrival: track how long driver has been waiting at pickup
  useEffect(() => {
    if (ride.status !== "arrived") {
      setWaitTime(0);
      return;
    }

    const arrivalTime = ride.arrived_at ? new Date(ride.arrived_at).getTime() : Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - arrivalTime) / 1000);
      setWaitTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [ride.status, ride.arrived_at]);

  const pickupLat = ride.pickup_lat;
  const pickupLon = ride.pickup_lon;
  const distanceToPickup = driverLocation && pickupLat && pickupLon
    ? getDistance(driverLocation.lat, driverLocation.lon, pickupLat, pickupLon) * 1000
    : null;
  const nearPickup = distanceToPickup !== null ? distanceToPickup <= 50 : true;

  const statusFlow = {
    assigned: { next: "en_route", label: "Ir en camino", icon: Navigation },
    en_route: { next: "arrived", label: "He llegado", icon: MapPin, requiresNearPickup: true },
    arrived: requireAdminApproval ? null : { next: "in_progress", label: "Iniciar viaje", icon: Car },
    admin_approved: { next: "in_progress", label: "Iniciar viaje ✓", icon: Car },
    in_progress: { next: "completed", label: "Finalizar viaje", icon: CheckCircle2, canComplete },
  };
  const action = statusFlow[ride.status];
  const waitingAdminApproval = ride.status === "arrived" && requireAdminApproval;
  const allowCancel = settings?.allow_driver_cancel ?? true;
  const isActive = !["completed", "cancelled"].includes(ride.status);

  const handleProofUpload = async (file) => {
    setUploadingProof(true);
    try {
      const timestamp = Date.now();
      const fileName = `proof-${timestamp}-${file.name}`;
      const { data, error } = await supabase.storage.from("app-uploads").upload(`ride-proofs/${fileName}`, file);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from("app-uploads").getPublicUrl(`ride-proofs/${fileName}`);
      const file_url = publicUrlData.publicUrl;
      await supabaseApi.rideRequests.update(ride.id, { proof_photo_url: file_url });
      queryClient.invalidateQueries({ queryKey: ["driverRides"] });
    } catch (err) {
      console.error("Error uploading proof:", err);
    }
    setUploadingProof(false);
  };

  const handleSOS = async () => {
    if (!window.confirm("¿Enviar alerta SOS? El administrador será notificado inmediatamente.")) return;
    
    let lat = null, lon = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true })
      );
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch (err) {
      console.log("Geolocation error (proceeding with alert):", err);
    }

    try {
      await supabase.from("sos_alerts").insert([{
        driver_id: driver?.id,
        driver_name: driver?.full_name,
        ride_id: ride.id,
        passenger_name: ride.passenger_name,
        message: `🆘 SOS durante viaje ${ride.service_id || ""}`,
        status: "active",
        latitude: lat,
        longitude: lon,
        ride_status: ride.status,
        created_at: new Date().toISOString(),
      }]);
      alert("✅ Alerta SOS enviada. El administrador ha sido notificado.");
    } catch (err) {
      console.error("Error sending SOS:", err);
      alert("❌ Error al enviar alerta. Intenta de nuevo.");
    }
  };

  // Format wait time: convert seconds to MM:SS format
  const formatWaitTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get wait time status: green < 3min, yellow 3-5min, red > 5min
  const getWaitTimeStatus = () => {
    if (waitTime < 180) return { status: 'ok', color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' };
    if (waitTime < 300) return { status: 'warning', color: 'bg-amber-500/20 border-amber-400/30 text-amber-300' };
    return { status: 'alert', color: 'bg-red-500/20 border-red-400/30 text-red-300' };
  };

  // ─── Full-screen layout for active rides ──────────────────────────────────
  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white flex flex-col"
        style={{ zIndex: 5, touchAction: "pan-y" }}
      >
        {/* FULL-SCREEN MAP */}
        {!hideMap && (
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <RideMap ride={ride} fullScreen driverLocation={driverLocation} />
          </div>
        )}
        {hideMap && <div className="absolute inset-0 bg-slate-200" style={{ zIndex: 0 }} />}

        {/* TOP HEADER — floating, positioned below DriverApp header */}
        <div className="absolute left-0 right-0 z-10 px-3" style={{ top: "calc(env(safe-area-inset-top) + 64px)" }}>
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-3 py-2.5 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100/20 flex items-center justify-center flex-shrink-0">
                {ride.passenger_photo_url
                  ? <img src={ride.passenger_photo_url} alt="" className="w-full h-full object-cover" />
                  : <span className="font-bold text-white text-sm">{ride.passenger_name?.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">{ride.passenger_name}</p>
                <div className="flex items-center gap-1.5">
                  {ride.passenger_rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-amber-300 font-semibold">{ride.passenger_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {ride.passenger_phone && ride.show_phone_to_driver !== false && settings?.show_passenger_phone_to_driver !== false && (
                    <a href={`tel:${ride.passenger_phone}`} className="text-xs text-blue-300 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> {ride.passenger_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <StatusBadge status={ride.status} />
          </div>
        </div>

        {/* BOTTOM SHEET */}
        <div className="absolute left-0 right-0 bottom-0 z-20" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <motion.div
            animate={{ height: sheetExpanded ? "72vh" : "auto" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Drag handle */}
            <button onClick={() => setSheetExpanded(v => !v)}
              className="w-full flex flex-col items-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20 mb-1" />
            </button>

            {/* Collapsed view */}
            {!sheetExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Ride location summary */}
                <div className="bg-white/10 rounded-2xl p-3 space-y-1.5">
                  {ride.service_id && <p className="text-[10px] text-white/40 font-mono">ID: {ride.service_id}</p>}
                  <div className="flex items-start gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                    <p className="text-sm font-medium text-white leading-tight">{ride.pickup_address}</p>
                  </div>
                  {ride.dropoff_address && (
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                      <p className="text-sm font-medium text-white/80 leading-tight">{ride.dropoff_address}</p>
                    </div>
                  )}
                </div>

                {/* Warnings */}
                {waitingAdminApproval && (
                  <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-300">Esperando aprobación del administrador...</p>
                  </div>
                )}
                {action?.requiresNearPickup && !nearPickup && (
                  <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-2.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                      Debes estar a menos de 50m del punto de recogida
                      {distanceToPickup !== null ? ` (estás a ${Math.round(distanceToPickup)}m)` : ""}
                    </p>
                  </div>
                )}
                {proofPhotoRequired && !action?.canComplete && ride.status === "in_progress" && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-2.5 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300 font-medium">Debes subir la foto de prueba antes de finalizar</p>
                  </div>
                )}

                {/* Wait time timer at pickup */}
                {ride.status === "arrived" && (
                  <div className={`border rounded-xl p-3 flex items-center justify-between ${getWaitTimeStatus().color}`}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs font-medium">
                        {getWaitTimeStatus().status === 'ok' && `Llegaste al punto de recogida`}
                        {getWaitTimeStatus().status === 'warning' && `Esperando pasajero`}
                        {getWaitTimeStatus().status === 'alert' && `⏱️ Tiempo de espera excesivo`}
                      </p>
                    </div>
                    <p className="font-mono font-bold text-base">{formatWaitTime(waitTime)}</p>
                  </div>
                )}

                {/* Main action button */}
                {action && (
                  <Button
                    onClick={async () => { setUpdatingStatus(true); await onUpdateStatus(ride, action.next); setUpdatingStatus(false); }}
                    disabled={updatingStatus || !!(action.requiresNearPickup && !nearPickup) || (ride.status === "in_progress" && proofPhotoRequired && !action.canComplete)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-2xl min-h-[52px] text-base font-bold select-none"
                  >
                    {updatingStatus
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Actualizando...</span>
                      : <><action.icon className="w-5 h-5 mr-2" /> {action.label}</>
                    }
                  </Button>
                )}

                {/* Proof photo upload */}
                {ride.status === "in_progress" && !ride.proof_photo_url && (
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleProofUpload(f); }} />
                    <div className="w-full border-2 border-dashed border-white/20 rounded-xl p-3 text-center text-xs text-white/50 min-h-[44px] flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" />
                      {uploadingProof ? "Subiendo foto..." : "Subir foto de prueba"}
                    </div>
                  </label>
                )}
                {ride.proof_photo_url && (
                  <a href={ride.proof_photo_url} target="_blank" rel="noreferrer" className="block">
                    <div className="bg-emerald-500/20 text-emerald-300 text-xs text-center py-3 rounded-lg flex items-center justify-center gap-1 min-h-[44px]">
                      <Camera className="w-3.5 h-3.5" /> Foto de prueba subida ✓
                    </div>
                  </a>
                )}

                {/* Bottom row: cancel + SOS + chat + expand */}
                <div className="flex gap-2">
                  {allowCancel && ride.status === "assigned" && (
                    <button onClick={() => setSheetExpanded(true)}
                      className="flex-1 text-red-400 text-xs border border-red-500/30 py-2.5 rounded-xl bg-red-500/10 font-medium">
                      Cancelar
                    </button>
                  )}
                  <button onClick={handleSOS}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-700 transition-all min-h-[44px] select-none shadow-lg">
                    <AlertTriangle className="w-4 h-4" />
                    SOS
                  </button>
                  <button onClick={() => setShowChat(v => !v)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border transition-colors min-h-[44px] select-none relative ${showChat ? "bg-blue-600 text-white border-blue-600" : "bg-blue-500/15 text-blue-300 border-blue-500/30"}`}>
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                    {unreadAdminMessages > 0 && !showChat && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                        {unreadAdminMessages}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setSheetExpanded(true)}
                    className="w-11 flex items-center justify-center bg-white/10 border border-white/10 rounded-xl">
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  </button>
                </div>
                {showChat && <DriverChat driver={driver} ride={ride} />}
              </div>
            )}

            {/* Expanded sheet */}
            {sheetExpanded && (
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between flex-shrink-0">
                  <p className="font-bold text-white text-base">Detalle del servicio</p>
                  <button onClick={() => setSheetExpanded(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Fare */}
                <RideFareBreakdown ride={ride} driver={driver} settings={settings} />

                {/* Extra info */}
                {ride.geo_zone_name && (
                  <div className="flex items-center gap-2 bg-emerald-500/15 rounded-xl px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs text-emerald-300">Zona: <strong>{ride.geo_zone_name}</strong></p>
                  </div>
                )}
                {ride.company_name && (
                  <div className="bg-blue-500/15 rounded-xl px-3 py-2">
                    <p className="text-xs text-blue-300">🏢 Corporativo: <strong>{ride.company_name}</strong></p>
                    {(ride.questionnaire_answers || []).map((qa, i) => (
                      <p key={i} className="text-xs text-blue-300/80 mt-1"><span className="font-medium">{qa.question}:</span> {qa.answer}</p>
                    ))}
                  </div>
                )}
                {(ride.custom_field_answers || []).length > 0 && (
                  <div className="bg-violet-500/15 rounded-xl px-3 py-2.5 space-y-1">
                    <p className="text-xs font-semibold text-violet-300 mb-1.5">📋 Información del servicio</p>
                    {ride.custom_field_answers.map((f, i) => (
                      <p key={i} className="text-xs text-violet-300"><span className="font-medium">{f.label}:</span> {f.answer}</p>
                    ))}
                  </div>
                )}
                {ride.notes && <p className="text-xs text-white/50 bg-amber-500/10 rounded-lg p-2">📝 {ride.notes}</p>}

                {/* Cancel confirm in expanded */}
                {allowCancel && ride.status === "assigned" && (
                  <CancelRideConfirm ride={ride} onConfirm={() => onRejectRide(ride, "driver_cancelled")} />
                )}

                {/* Help */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSOS}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-2xl border border-red-700 min-h-[44px] select-none shadow-lg">
                    <AlertTriangle className="w-4 h-4" />
                    🆘 SOS de Emergencia
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("openDriverHelp", { detail: { ride_id: ride.id, passenger_name: ride.passenger_name, service_id: ride.service_id } }))}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white/70 text-xs font-medium py-3 rounded-2xl border border-white/10 min-h-[44px] select-none">
                    <HelpCircle className="w-4 h-4" />
                    Reportar problema
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ─── Completed/cancelled: compact card ────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-4 rounded-3xl overflow-hidden shadow-lg border border-slate-100 bg-white">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
              {ride.passenger_name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{ride.passenger_name}</p>
            </div>
          </div>
          <StatusBadge status={ride.status} />
        </div>
        <div className="p-4">
          {ride.status === "completed" && (
            <div className="text-center py-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-emerald-600">Viaje completado</p>
              <p className="text-lg font-bold text-emerald-600">${(ride.driver_earnings || ride.final_price || ride.estimated_price || 0).toFixed(0)} ganados</p>
              {ride.admin_rating && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-4 h-4 ${n <= ride.admin_rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

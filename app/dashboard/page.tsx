"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/admin/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, AlertTriangle, UserCheck, ChevronRight, Wifi, CalendarClock, Calendar, XCircle } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardStats from "@/components/admin/DashboardStats";
import RideTable from "@/components/admin/RideTable";
import AssignDriverDialog from "@/components/admin/AssignDriverDialog";
import CreateRideDialog from "@/components/admin/CreateRideDialog";
import CancelRideDialog from "@/components/admin/CancelRideDialog";
import ETAModal from "@/components/admin/ETAModal";
import { todayCDMX, startOfDayCDMX, endOfDayCDMX, formatCDMX } from "@/components/shared/dateUtils";
import { toast } from "sonner";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(todayCDMX());
  const [assignRide, setAssignRide] = useState(null);
  const [cancelRide, setCancelRide] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [manualAssignPrompt, setManualAssignPrompt] = useState(null);
  const [etaModalData, setEtaModalData] = useState(null);
  const queryClient = useQueryClient();

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ["sosAlerts"],
    queryFn: async () => {
      try {
        return await supabaseApi.sosAlerts.list() || [];
      } catch { return []; }
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["rides"],
    queryFn: async () => {
      try {
        return await supabaseApi.rideRequests.list();
      } catch { return []; }
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      try {
        return await supabaseApi.drivers.list();
      } catch { return []; }
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      try {
        return await supabaseApi.cities.list();
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: geoZones = [] } = useQuery({
    queryKey: ["geoZones"],
    queryFn: async () => {
      try {
        return await supabaseApi.geoZones.list();
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: async () => {
      try {
        return await supabaseApi.serviceTypes.list();
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      try {
        return await supabaseApi.cancellationPolicies.list();
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: settings = {} } = useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      try {
        const data = await supabaseApi.appSettings.list();
        return data?.[0] || {};
      } catch { return {}; }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase.channel("drivers_changes").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "drivers" },
      (payload: any) => {
        queryClient.setQueryData(["drivers"], (old: any = []) => {
          if (payload.eventType === "DELETE") return old.filter((d: any) => d.id !== payload.old.id);
          if (payload.eventType === "INSERT") return [...old, payload.new];
          if (payload.eventType === "UPDATE") return old.map((d: any) => d.id === payload.new.id ? payload.new : d);
          return old;
        });
      }
    ).subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase.channel("sos_changes").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sos_alerts" },
      (payload: any) => {
        queryClient.setQueryData(["sosAlerts"], (old: any = []) => {
          if (payload.eventType === "DELETE") return old.filter((s: any) => s.id !== payload.old.id);
          if (payload.eventType === "UPDATE") {
            return old.map((s: any) => s.id === payload.new.id ? payload.new : s)
                     .filter((s: any) => s.status === "active");
          }
          if (payload.eventType === "INSERT" && payload.new?.status === "active") return [...old, payload.new];
          return old;
        });
      }
    ).subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  const ridesRef = useRef(rides);
  ridesRef.current = rides;
  const driversRef = useRef(drivers);
  driversRef.current = drivers;

  useEffect(() => {
    const unsub = supabase.channel("rides_changes").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ride_requests" },
      async (payload: any) => {
        if (payload.eventType === "INSERT") {
          const event = payload.new;
          const isPassengerAppRide = !!event.passenger_user_id;
          if (!isPassengerAppRide && event.status === "pending" && event.assignment_mode !== "manual") {
            setEtaModalData({ ride: event, driver: null, phase: "searching" });
          }
          if (!isPassengerAppRide && event.status === "auction") {
            setEtaModalData({ ride: event, driver: null, phase: "searching" });
          }
          if (event.assignment_mode === "manual" && event.status === "pending") {
            setAssignRide(event);
          }
        }
        if (payload.eventType === "UPDATE") {
          const d = payload.new;
          const prevRide = ridesRef.current.find((r: any) => r.id === d?.id);
          const prevStatus = prevRide?.status;

          if (d?.status === "no_drivers") {
            const fullRide = prevRide ? { ...prevRide, ...d } : d;
            setEtaModalData({ ride: fullRide, driver: null, phase: "no_drivers" });
            return;
          }

          if (d?.status === "pending" && d?.assignment_mode === "manual" && d?.manual_assignment_requested_at) {
            const fullRide = prevRide ? { ...prevRide, ...d } : d;
            setAssignRide(fullRide);
            return;
          }

          if (d?.status === "auction" && !d?.passenger_user_id) {
            setEtaModalData((prev: any) => {
              if (prev?.ride?.id === d.id) {
                const fullRide = prevRide ? { ...prevRide, ...d } : d;
                return { ...prev, ride: fullRide, phase: "searching" };
              }
              if (!prev) {
                const fullRide = prevRide ? { ...prevRide, ...d } : d;
                return { ride: fullRide, driver: null, phase: "searching" };
              }
              return prev;
            });
            return;
          }

          if (d?.status === "pending" && !d?.driver_id && !d?.assignment_mode?.includes("manual")) {
            setEtaModalData((prev: any) => {
              if (prev?.ride?.id === d.id) {
                const fullRide = prevRide ? { ...prevRide, ...d } : d;
                return { ...prev, ride: fullRide, phase: "searching" };
              }
              return prev;
            });
            return;
          }

          if (d?.status === "assigned" && d?.driver_id && prevStatus !== "assigned") {
            const fullRide = prevRide ? { ...prevRide, ...d } : d;
            const driverAccepted = !!d.driver_accepted_at;
            if (driverAccepted) {
              const driver = driversRef.current.find((dr: any) => dr.id === d.driver_id);
              if (driver) {
                setEtaModalData({ ride: fullRide, driver, phase: "assigned" });
              } else {
                const fetched = await supabaseApi.drivers.get(d.driver_id);
                if (fetched) setEtaModalData({ ride: fullRide, driver: fetched, phase: "assigned" });
              }
            } else {
              setEtaModalData((prev: any) => ({ ride: fullRide, driver: null, phase: "waiting_acceptance" }));
            }
          }

          if (d?.status === "assigned" && d?.driver_id && d?.driver_accepted_at && !prevRide?.driver_accepted_at) {
            const fullRide = prevRide ? { ...prevRide, ...d } : d;
            const driver = driversRef.current.find((dr: any) => dr.id === d.driver_id);
            if (driver) {
              setEtaModalData({ ride: fullRide, driver, phase: "assigned" });
            } else {
              const fetched = await supabaseApi.drivers.get(d.driver_id);
              if (fetched) setEtaModalData({ ride: fullRide, driver: fetched, phase: "assigned" });
            }
          }

          if (["cancelled", "completed"].includes(d?.status)) {
            setEtaModalData((prev: any) => prev?.ride?.id === d.id ? null : prev);
          }

          queryClient.invalidateQueries({ queryKey: ["rides"] });
        }
      }
    ).subscribe();
    return () => { unsub.unsubscribe(); };
  }, [queryClient]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const unassigned = rides.find((r: any) =>
        (r.status === "pending" || r.status === "auction") &&
        !r.driver_id &&
        !r.scheduled_time &&
        (now - new Date(r.created_date).getTime()) > 60000
      );
      if (unassigned && (!manualAssignPrompt || manualAssignPrompt.id !== unassigned.id)) {
        setManualAssignPrompt(unassigned);
      }
      if (manualAssignPrompt) {
        const stillPending = rides.find((r: any) => r.id === manualAssignPrompt.id && (r.status === "pending" || r.status === "auction") && !r.driver_id);
        if (!stillPending) setManualAssignPrompt(null);
      }
    };
    const id = setInterval(check, 10000);
    check();
    return () => clearInterval(id);
  }, [rides, manualAssignPrompt]);

  const handleUpdateStatus = async (ride: any, newStatus: string) => {
    const now = new Date().toISOString();
    const updates: any = { status: newStatus };
    if (newStatus === "en_route") updates.en_route_at = now;
    if (newStatus === "arrived") updates.arrived_at = now;
    if (newStatus === "admin_approved") updates.in_progress_at = now;
    if (newStatus === "in_progress") updates.in_progress_at = now;
    if (newStatus === "completed") updates.completed_at = now;
    if (newStatus === "completed") {
      const driver = drivers.find((d: any) => d.id === ride.driver_id);
      const commissionRate = ride.commission_rate ?? driver?.commission_rate ?? (settings as any)?.platform_commission_pct ?? 20;
      const basePrice = ride.estimated_price || 0;
      const extras = Array.isArray(ride.extra_charges) ? ride.extra_charges : [];
      const totalExtras = extras.reduce((s: number, c: any) => s + (parseFloat(c.amount) || 0), 0);
      const extrasForDriver = extras.filter((c: any) => c.paid_to_driver).reduce((s: number, c: any) => s + (parseFloat(c.amount) || 0), 0);
      const extrasWithCommission = extras.filter((c: any) => !c.paid_to_driver).reduce((s: number, c: any) => s + (parseFloat(c.amount) || 0), 0);
      const finalPrice = basePrice + totalExtras;
      const commissionableAmount = basePrice + extrasWithCommission;
      const commission = parseFloat((commissionableAmount * commissionRate / 100).toFixed(2));
      const netEarnings = parseFloat((commissionableAmount - commission + extrasForDriver).toFixed(2));
      updates.final_price = finalPrice;
      updates.driver_earnings = netEarnings;
      updates.platform_commission = commission;
      updates.commission_rate = commissionRate;
      const ratingWindowMinutes = (settings as any)?.rating_window_minutes ?? 60;
      updates.rating_window_expires_at = new Date(Date.now() + ratingWindowMinutes * 60 * 1000).toISOString();
    }
    try {
      await supabaseApi.rideRequests.update(ride.id, updates);
      if ((newStatus === "completed" || newStatus === "cancelled") && ride.driver_id) {
        const driver = drivers.find((d: any) => d.id === ride.driver_id);
        const otherActive = rides.filter((r: any) =>
          r.driver_id === ride.driver_id && r.id !== ride.id && !["completed", "cancelled"].includes(r.status)
        );
        if (otherActive.length === 0) {
          const driverUpdates: any = { status: "available" };
          if (newStatus === "completed") {
            driverUpdates.total_rides = (driver?.total_rides || 0) + 1;
            driverUpdates.total_earnings = (driver?.total_earnings || 0) + (updates.driver_earnings || 0);
          }
          await supabaseApi.drivers.update(ride.driver_id, driverUpdates);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    } catch (error) {
      toast.error("Error al actualizar viaje");
    }
  };

  const dayStart = startOfDayCDMX(dateFilter);
  const dayEnd = endOfDayCDMX(dateFilter);
  const ACTIVE_STATUSES = ["pending", "scheduled", "auction", "no_drivers", "assigned", "admin_approved", "en_route", "arrived", "in_progress"];

  const filtered = rides.filter((r: any) => {
    const matchSearch = !search ||
      r.passenger_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.pickup_address?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || r.status === statusFilter;

    if (ACTIVE_STATUSES.includes(r.status)) return matchSearch && matchStatus;

    const rideDate = new Date(r.requested_at || r.created_date);
    const matchDate = rideDate >= dayStart && rideDate <= dayEnd;

    return matchSearch && matchStatus && matchDate;
  });

  const sortedFiltered = [
    ...filtered.filter((r: any) => ACTIVE_STATUSES.includes(r.status)).sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()),
    ...filtered.filter((r: any) => !ACTIVE_STATUSES.includes(r.status)).sort((a: any, b: any) => new Date(b.updated_date || b.created_date).getTime() - new Date(a.updated_date || a.created_date).getTime()),
  ];


  return (
    <Layout currentPageName="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de control</h1>
            <p className="text-sm text-slate-400 mt-0.5">{rides.filter((r: any) => !["completed", "cancelled"].includes(r.status)).length} viajes activos · {rides.length} totales</p>
          </div>
          <div className="flex gap-2">
            <Link href="/live-drivers">
              <Button variant="outline" className="rounded-xl shadow-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Wifi className="w-4 h-4 mr-2" /> EN VIVO
              </Button>
            </Link>
            <Button onClick={() => setShowCreate(true)} className="rounded-xl shadow-sm bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Nuevo viaje
            </Button>
          </div>
        </div>

        {(() => {
          const today = todayCDMX();
          const todayStart = startOfDayCDMX(today);
          const todayEnd = endOfDayCDMX(today);
          const completedToday = rides.filter((r: any) =>
            r.status === "completed" &&
            new Date(r.updated_date || r.created_date) >= todayStart &&
            new Date(r.updated_date || r.created_date) < todayEnd
          ).length;
          const pendingScheduled = rides.filter((r: any) =>
            r.scheduled_time &&
            r.status === "scheduled" &&
            !r.driver_id &&
            new Date(r.scheduled_time) >= todayStart &&
            new Date(r.scheduled_time) < todayEnd
          );
          if (pendingScheduled.length === 0) return null;
          return (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CalendarClock className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-emerald-800 text-sm">
                  {pendingScheduled.length} cita{pendingScheduled.length > 1 ? "s" : ""} programada{pendingScheduled.length > 1 ? "s" : ""} hoy pendiente{pendingScheduled.length > 1 ? "s" : ""} de asignar
                  <span className="ml-2 font-normal text-emerald-600">({completedToday} completados hoy · {pendingScheduled.length} sin asignar)</span>
                </p>
                <p className="text-xs text-emerald-600 mt-0.5 truncate">
                  {pendingScheduled.map((r: any) => {
                    const t = new Date(r.scheduled_time);
                    const svc = serviceTypes.find((s: any) => s.name === r.service_type_name);
                    const adv = svc?.advance_assignment_minutes ?? 15;
                    return `${r.passenger_name} · ${formatCDMX(t, "time")} (asigna ${adv}min antes)`;
                  }).join("   |   ")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setStatusFilter("scheduled")} className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs flex-shrink-0">
                Ver
              </Button>
            </div>
          );
        })()}

        {(() => {
          const debtRides = rides.filter((r: any) =>
            (r.payment_status === "debt" || r.payment_reported_unpaid) &&
            !["cancelled"].includes(r.status)
          );
          if (debtRides.length === 0) return null;
          return (
            <Link href="/payment-methods" className="block">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 flex items-center gap-3 hover:opacity-95 transition-opacity shadow-lg shadow-orange-200">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">
                    {debtRides.length} servicio{debtRides.length > 1 ? "s" : ""} con pago pendiente / adeudo
                  </p>
                  <p className="text-sm text-orange-100 truncate">
                    {debtRides.slice(0, 2).map((r: any) => r.passenger_name).join(", ")}
                    {debtRides.length > 2 ? ` y ${debtRides.length - 2} más` : ""}
                    {" "}· Toca para revisar y confirmar
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
              </div>
            </Link>
          );
        })()}

        {sosAlerts.length > 0 && (
          <Link href="/sos-alerts" className="block">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 flex items-center gap-3 hover:opacity-95 transition-opacity shadow-lg shadow-red-200">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{sosAlerts.length} Alerta{sosAlerts.length > 1 ? "s" : ""} SOS activa{sosAlerts.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-red-100">Toca para ver y gestionar las alertas</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          </Link>
        )}

        {rides.filter((r: any) => r.status === "pending" && r.assignment_mode === "manual" && r.manual_assignment_requested_at && !r.driver_id).map((r: any) => (
          <div key={r.id} className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-400 rounded-2xl p-4 flex items-center gap-3 shadow-md shadow-red-100">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-800 text-sm">⚠️ Pasajero solicita asignación manual</p>
              <p className="text-xs text-red-600 truncate">{r.passenger_name} · {r.pickup_address}</p>
              <p className="text-xs text-red-500 mt-0.5">Sin conductores automáticos disponibles</p>
            </div>
            <Button size="sm" onClick={() => setAssignRide(r)} className="bg-red-600 hover:bg-red-700 rounded-xl text-xs flex-shrink-0">
              Asignar
            </Button>
          </div>
        ))}

        {manualAssignPrompt && !["assigned", "completed", "cancelled"].includes(manualAssignPrompt.status) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 text-sm">Viaje sin asignar por más de 1 minuto</p>
              <p className="text-xs text-amber-600 truncate">{manualAssignPrompt.passenger_name} · {manualAssignPrompt.pickup_address}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" onClick={() => { setAssignRide(manualAssignPrompt); setManualAssignPrompt(null); }} className="bg-amber-600 hover:bg-amber-700 rounded-xl text-xs">
                Asignar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setManualAssignPrompt(null)} className="rounded-xl text-xs text-amber-500">
                Ignorar
              </Button>
            </div>
          </div>
        )}

        <DashboardStats rides={rides} drivers={drivers} selectedDate={dateFilter} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por pasajero, conductor o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl bg-white">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="assigned">Asignados</SelectItem>
              <SelectItem value="en_route">En camino</SelectItem>
              <SelectItem value="in_progress">En curso</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="scheduled">Programados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 rounded-xl bg-white w-full sm:w-44"
            />
          </div>
        </div>

        <RideTable
          rides={sortedFiltered}
          onAssign={setAssignRide}
          onCancel={setCancelRide}
          onUpdateStatus={handleUpdateStatus}
          onDelete={async (ride: any) => {
            if (!window.confirm(`¿Eliminar el viaje de ${ride.passenger_name}? Esta acción no se puede deshacer.`)) return;
            try {
              await supabaseApi.rideRequests.delete(ride.id);
              queryClient.invalidateQueries({ queryKey: ["rides"] });
            } catch (error) {
              toast.error("Error al eliminar viaje");
            }
          }}
          canEdit={true}
          canDelete={true}
          drivers={drivers}
          settings={settings}
        />

        <AssignDriverDialog
          ride={assignRide}
          drivers={drivers}
          rides={rides}
          open={!!assignRide}
          onOpenChange={(v) => { if (!v) setAssignRide(null); }}
          onAssigned={(updatedRide: any, driver: any) => { setAssignRide(null); setEtaModalData({ ride: updatedRide, driver, phase: "assigned" }); }}
        />

        <ETAModal
          ride={etaModalData?.ride}
          driver={etaModalData?.driver}
          phase={etaModalData?.phase}
          settings={settings}
          open={!!etaModalData}
          onClose={() => setEtaModalData(null)}
          onAssignManual={(ride: any) => { setEtaModalData(null); setAssignRide(ride); }}
        />

        <CancelRideDialog
          ride={cancelRide}
          policies={policies}
          open={!!cancelRide}
          onOpenChange={(open) => !open && setCancelRide(null)}
        />

        <CreateRideDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          serviceTypes={serviceTypes}
          paymentMethods={(settings as any)?.payment_methods}
        />
      </div>
    </Layout>
  );
}

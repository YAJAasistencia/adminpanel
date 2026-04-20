"use client";
export const dynamic = 'force-dynamic';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import Layout from "@/components/admin/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, MapPin, Users, Flame, Download, Map, Calendar, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { startOfDayCDMX, endOfDayCDMX, todayCDMX } from "@/components/shared/dateUtils";

// ─── Leaflet.heat lazy loader ──────────────────────────────────────────────────
async function ensureHeat() {
  if (window.L?.heatLayer) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);
  useEffect(() => {
    if (!points || points.length === 0) return;
    ensureHeat().then(() => {
      if (layerRef.current) map.removeLayer(layerRef.current);
      if (window.L?.heatLayer) {
        layerRef.current = window.L.heatLayer(points, {
          radius: 30, blur: 20, maxZoom: 17,
          gradient: { 0.2: "#3B82F6", 0.5: "#F59E0B", 0.8: "#EF4444", 1.0: "#7C3AED" },
        }).addTo(map);
      }
    });
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [points, map]);
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points?.length > 0) {
      try { map.fitBounds(L.latLngBounds(points.map(([lat, lng]) => [lat, lng])), { padding: [40, 40] }); } catch {}
    }
  }, [points?.length]);
  return null;
}

// ─── Date Range Picker ─────────────────────────────────────────────────────────
const PRESETS = [
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "this_week", label: "Esta semana" },
  { key: "last_7", label: "Últimos 7 días" },
  { key: "this_month", label: "Este mes" },
  { key: "last_30", label: "Últimos 30 días" },
  { key: "all", label: "Todo" },
];

function dateStrOffset(days) {
  const todayStr = todayCDMX();
  const [y, m, d] = todayStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function mondayOfWeek() {
  const todayStr = todayCDMX();
  const [y, m, d] = todayStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(Date.UTC(y, m - 1, d + diffToMon));
  return mon.toISOString().slice(0, 10);
}

function firstOfMonth() {
  return todayCDMX().slice(0, 8) + "01";
}
function lastOfMonth() {
  const [y, m] = todayCDMX().split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(last).padStart(2,"0")}`;
}

function getPresetRange(key) {
  switch (key) {
    case "today": return { from: startOfDayCDMX(todayCDMX()), to: endOfDayCDMX(todayCDMX()) };
    case "yesterday": { const y = dateStrOffset(-1); return { from: startOfDayCDMX(y), to: endOfDayCDMX(y) }; }
    case "this_week": { const mon = mondayOfWeek(); const sun = dateStrOffset(6 - getDayOfWeekOffset()); return { from: startOfDayCDMX(mon), to: endOfDayCDMX(sun) }; }
    case "last_7": return { from: startOfDayCDMX(dateStrOffset(-6)), to: endOfDayCDMX(todayCDMX()) };
    case "this_month": return { from: startOfDayCDMX(firstOfMonth()), to: endOfDayCDMX(lastOfMonth()) };
    case "last_30": return { from: startOfDayCDMX(dateStrOffset(-29)), to: endOfDayCDMX(todayCDMX()) };
    case "all": return null;
    default: return null;
  }
}

function getDayOfWeekOffset() {
  const [y, m, d] = todayCDMX().split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

function DateRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("today");
  const [customRange, setCustomRange] = useState(undefined);
  const [mode, setMode] = useState("preset");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePreset = (key) => {
    setActivePreset(key);
    setMode("preset");
    onChange(getPresetRange(key));
    if (key !== "custom") setOpen(false);
  };

  const handleCustom = (range) => {
    setCustomRange(range);
    const toDateStr = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : null;
    if (range?.from && range?.to) {
      setMode("custom");
      setActivePreset(null);
      onChange({ from: startOfDayCDMX(toDateStr(range.from)), to: endOfDayCDMX(toDateStr(range.to)) });
    } else if (range?.from) {
      onChange({ from: startOfDayCDMX(toDateStr(range.from)), to: endOfDayCDMX(toDateStr(range.from)) });
    }
  };

  const label = useMemo(() => {
    if (mode === "custom" && customRange?.from) {
      if (customRange.to && customRange.from.toDateString() !== customRange.to.toDateString()) {
        return `${format(customRange.from, "dd MMM", { locale: es })} – ${format(customRange.to, "dd MMM", { locale: es })}`;
      }
      return format(customRange.from, "dd MMM yyyy", { locale: es });
    }
    return PRESETS.find(p => p.key === activePreset)?.label || "Seleccionar";
  }, [mode, activePreset, customRange]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-[800] flex flex-col sm:flex-row overflow-hidden min-w-[280px]">
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-slate-100 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible sm:w-40">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 hidden sm:block">Períodos</p>
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={`flex-shrink-0 text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activePreset === p.key && mode === "preset"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => { setMode("custom"); setActivePreset(null); }}
              className={`flex-shrink-0 text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                mode === "custom" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📅 Personalizado
            </button>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {mode === "custom" ? "Selecciona un rango" : "Vista del período"}
            </p>
            <DayPicker
              mode="range"
              selected={mode === "custom" ? customRange : (() => {
                const r = getPresetRange(activePreset);
                return r ? { from: r.from, to: r.to } : undefined;
              })()}
              onSelect={mode === "custom" ? handleCustom : undefined}
              locale={es}
              weekStartsOn={1}
              showOutsideDays
              className="text-sm"
              modifiersClassNames={{
                selected: "bg-blue-600 text-white rounded-full",
                range_start: "bg-blue-600 text-white rounded-l-full",
                range_end: "bg-blue-600 text-white rounded-r-full",
                range_middle: "bg-blue-100 text-blue-700",
                today: "font-bold text-blue-600",
              }}
              styles={{ caption: { fontSize: "0.8rem" }, head_cell: { fontSize: "0.7rem" }, cell: { fontSize: "0.8rem" } }}
            />
            {mode === "custom" && customRange?.from && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {customRange.to
                    ? `${format(customRange.from, "dd MMM", { locale: es })} – ${format(customRange.to, "dd MMM yyyy", { locale: es })}`
                    : format(customRange.from, "dd MMM yyyy", { locale: es })
                  }
                </span>
                <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => setOpen(false)}>Aplicar</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Analytics Page ───────────────────────────────────────────────────────
function AnalyticsContent() {
  const [globalRange, setGlobalRange] = useState(() => getPresetRange("today"));
  const [filterService, setFilterService] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");

  const { data: rides = [] } = useQuery({
    queryKey: ["analytics_rides"],
    queryFn: () => supabaseApi.rideRequests.list(),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["analytics_drivers"],
    queryFn: () => supabaseApi.drivers.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["analytics_service_types"],
    queryFn: () => supabaseApi.serviceTypes.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const filteredRides = useMemo(() => {
    if (!globalRange) return rides;
    return rides.filter(r => {
      const d = new Date(r.requested_at);
      return d >= globalRange.from && d <= globalRange.to;
    });
  }, [rides, globalRange]);

  const demandByHour = useMemo(() => {
    const hourMap = {};
    for (let i = 0; i < 24; i++) hourMap[i] = 0;
    filteredRides.forEach(ride => {
      if (ride.requested_at) hourMap[new Date(ride.requested_at).getHours()]++;
    });
    return Object.entries(hourMap).map(([hour, count]) => ({
      hora: `${String(hour).padStart(2, "0")}:00`,
      servicios: count,
    }));
  }, [filteredRides]);

  const demandByZone = useMemo(() => {
    const zoneMap = {};
    filteredRides.forEach(ride => {
      const zone = ride.geo_zone_name || "Sin zona";
      zoneMap[zone] = (zoneMap[zone] || 0) + 1;
    });
    return Object.entries(zoneMap).map(([zone, count]) => ({ zone, servicios: count }))
      .sort((a, b) => b.servicios - a.servicios).slice(0, 8);
  }, [filteredRides]);

  const kpis = useMemo(() => {
    const avgRating = drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / (drivers.length || 1);
    const completedRides = filteredRides.filter(r => r.status === "completed").length;
    const cancelledRides = filteredRides.filter(r => r.status === "cancelled").length;
    const totalRevenue = filteredRides.reduce((sum, r) => sum + (r.final_price || 0), 0);
    
    // Calculate driver payments (estimate: 70-80% of fare goes to driver)
    // Using a platform commission rate of 20% (80% to driver)
    const driverPayments = filteredRides.reduce((sum, r) => sum + (r.final_price || 0) * 0.80, 0);
    const netRevenue = totalRevenue - driverPayments;
    
    // Calculate average acceptance rate
    const avgAcceptance = drivers.length > 0 
      ? drivers.reduce((sum, d) => sum + (d.acceptance_rate || 100), 0) / drivers.length 
      : 100;
    
    return {
      avgRating: avgRating.toFixed(2),
      avgAcceptance: avgAcceptance.toFixed(1),
      totalDrivers: drivers.length,
      completedRides,
      cancelledRides,
      totalRevenue: totalRevenue.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
      completionRate: ((completedRides / (completedRides + cancelledRides)) * 100 || 0).toFixed(1),
    };
  }, [filteredRides, drivers]);

  const [ratingDriverFilter, setRatingDriverFilter] = useState("all");

  const filteredDriversForRating = useMemo(() => {
    if (ratingDriverFilter === "all") return drivers;
    return drivers.filter(d => d.id === ratingDriverFilter);
  }, [drivers, ratingDriverFilter]);

  const ratingDistribution = useMemo(() => [
    { rating: "5⭐", count: filteredDriversForRating.filter(d => d.rating >= 4.8).length },
    { rating: "4-4.9⭐", count: filteredDriversForRating.filter(d => d.rating >= 4 && d.rating < 4.8).length },
    { rating: "3-3.9⭐", count: filteredDriversForRating.filter(d => d.rating >= 3 && d.rating < 4).length },
    { rating: "<3⭐", count: filteredDriversForRating.filter(d => d.rating < 3 && d.rating > 0).length },
  ], [filteredDriversForRating]);

  const companies = useMemo(() => {
    const map = {};
    rides.forEach(r => { if (r.company_id && r.company_name) map[r.company_id] = r.company_name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [rides]);

  const heatPoints = useMemo(() => {
    let filtered = filteredRides.filter(r => r.pickup_lat && r.pickup_lon);
    if (filterService !== "all") filtered = filtered.filter(r => r.service_type_id === filterService);
    if (filterCompany === "general") filtered = filtered.filter(r => !r.company_id);
    else if (filterCompany !== "all") filtered = filtered.filter(r => r.company_id === filterCompany);
    return filtered.map(r => [r.pickup_lat, r.pickup_lon, 1]);
  }, [filteredRides, filterService, filterCompany]);

  const revenueByServiceType = useMemo(() => {
    const typeMap = {};
    filteredRides.forEach(ride => {
      const typeName = ride.service_type_name || "Sin categoría";
      if (!typeMap[typeName]) typeMap[typeName] = 0;
      typeMap[typeName] += ride.final_price || 0;
    });
    return Object.entries(typeMap)
      .map(([name, revenue]) => ({ name, revenue: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredRides]);

  const topDrivers = useMemo(() => {
    const driverStats = {};
    filteredRides.filter(r => r.status === "completed").forEach(ride => {
      if (!ride.driver_id) return;
      if (!driverStats[ride.driver_id]) {
        const driver = drivers.find(d => d.id === ride.driver_id);
        driverStats[ride.driver_id] = {
          id: ride.driver_id,
          name: driver?.full_name || "Desconocido",
          rides: 0,
          earnings: 0,
          rating: driver?.rating || 0,
          acceptance_rate: driver?.acceptance_rate || 100,
        };
      }
      driverStats[ride.driver_id].rides += 1;
      driverStats[ride.driver_id].earnings += ride.driver_earnings || (ride.final_price || 0) * 0.8;
    });
    return Object.values(driverStats)
      .sort((a, b) => b.rides - a.rides)
      .slice(0, 10);
  }, [filteredRides, drivers]);

  const heatCenter = heatPoints.length > 0 ? [heatPoints[0][0], heatPoints[0][1]] : [19.4326, -99.1332];

  const handleDownloadMap = async () => {
    try {
      const mapEl = document.getElementById("heatmap-capture");
      if (!mapEl) return;
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(mapEl, { useCORS: true, allowTaint: true });
      const link = document.createElement("a");
      link.download = `mapa-calor-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Mapa descargado");
    } catch { toast.error("No se pudo descargar el mapa"); }
  };

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analíticas</h1>
          <p className="text-slate-500 mt-1">
            {filteredRides.length} servicios en el período · {rides.length} totales históricos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeFilter value={globalRange} onChange={setGlobalRange} />
          {globalRange && (
            <button
              onClick={() => setGlobalRange(null)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Ver todo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Rating Promedio", value: kpis.avgRating, sub: `de ${kpis.totalDrivers} conductores`, color: "text-slate-900" },
          { label: "Aceptación", value: `${kpis.avgAcceptance}%`, sub: "promedio conductores", color: "text-emerald-600" },
          { label: "Viajes Completados", value: kpis.completedRides, sub: `${kpis.completionRate}% tasa`, color: "text-emerald-600" },
          { label: "Cancelados", value: kpis.cancelledRides, sub: "en el período", color: "text-red-600" },
          { label: "Ingresos Brutos", value: `$${kpis.totalRevenue}`, sub: "MXN", color: "text-slate-900" },
          { label: "Ingreso Neto", value: `$${kpis.netRevenue}`, sub: "ganancia plataforma", color: "text-blue-600" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-slate-500 text-sm mb-2">{k.label}</p>
              <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-slate-400 mt-2">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Ingresos por Tipo de Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByServiceType.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={revenueByServiceType} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Top 10 Conductores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDrivers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">Sin datos</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {topDrivers.map((driver, idx) => (
                  <div key={driver.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{driver.name}</p>
                        <p className="text-[10px] text-slate-400">{driver.rides} viajes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600">${driver.earnings.toFixed(0)}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span className="text-[10px] text-amber-600">⭐ {driver.rating.toFixed(1)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${driver.acceptance_rate >= 80 ? "bg-emerald-100 text-emerald-700" : driver.acceptance_rate >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {driver.acceptance_rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Demanda de Servicios por Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="servicios" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Zonas Geográficas Más Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandByZone} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="zone" width={100} fontSize={11} />
                <Tooltip />
                <Bar dataKey="servicios" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Mapa de Calor — Concentración de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative z-[600] flex flex-wrap gap-3 items-end bg-white pb-1">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Tipo de servicio:</span>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Todos los servicios" />
                </SelectTrigger>
                <SelectContent className="z-[700]">
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  {serviceTypes.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name || "Sin nombre"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Empresa / Tipo:</span>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="z-[700]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="general">🚶 Generales (sin empresa)</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>🏢 {c.name || "Sin nombre"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-1">
                {heatPoints.length} servicios con GPS
              </span>
              <Button size="sm" variant="outline" onClick={handleDownloadMap} className="h-8 text-xs gap-1.5 rounded-lg">
                <Download className="w-3.5 h-3.5" /> Descargar PNG
              </Button>
            </div>
          </div>

          <div id="heatmap-capture" className="relative z-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 460 }}>
            {heatPoints.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-3">
                <Map className="w-10 h-10 text-slate-300" />
                <p className="text-sm text-slate-400">No hay servicios con coordenadas GPS para los filtros seleccionados</p>
              </div>
            ) : (
              <MapContainer center={heatCenter} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                <HeatLayer points={heatPoints} />
                <FitBounds points={heatPoints} />
              </MapContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 px-1">
            <span className="font-medium text-slate-600">Intensidad:</span>
            {[
              { color: "bg-blue-500", label: "Baja" },
              { color: "bg-amber-400", label: "Media" },
              { color: "bg-red-500", label: "Alta" },
              { color: "bg-purple-600", label: "Muy alta" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Distribución de Ratings de Conductores
              </CardTitle>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Filtrar por conductor:</span>
                <Select value={ratingDriverFilter} onValueChange={setRatingDriverFilter}>
                  <SelectTrigger className="h-8 w-52 text-xs">
                    <SelectValue placeholder="Todos los conductores" />
                  </SelectTrigger>
                  <SelectContent className="z-[700]">
                    <SelectItem value="all">Todos los conductores</SelectItem>
                    {drivers
                      .slice()
                      .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
                      .map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.full_name} {d.rating > 0 ? `· ⭐ ${Number(d.rating).toFixed(1)}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ratingDriverFilter !== "all" ? (() => {
              const driver = drivers.find(d => d.id === ratingDriverFilter);
              if (!driver) return null;
              return (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <span className="text-2xl font-black text-purple-600">{driver.full_name?.charAt(0)}</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-900 text-lg">{driver.full_name || "Desconocido"}</p>
                    <p className="text-slate-500 text-sm">{driver.phone || driver.email || ""}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                    <span className="text-4xl font-black text-amber-500">{driver.rating > 0 ? Number(driver.rating).toFixed(1) : "—"}</span>
                    <div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-xl ${s <= Math.round(driver.rating) ? "text-amber-400" : "text-slate-200"}`}>★</span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{driver.total_rides || 0} viajes completados</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {[
                      { label: "Viajes totales", value: driver.total_rides || 0, color: "text-blue-600" },
                      { label: "Estado", value: driver.status === "available" ? "Disponible" : driver.status === "busy" ? "Ocupado" : "Inactivo", color: driver.status === "available" ? "text-emerald-600" : driver.status === "busy" ? "text-amber-600" : "text-slate-400" },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={ratingDistribution} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={100} label>
                    {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Desempeño Promedio de Conductores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Rating Promedio", value: `${kpis.avgRating}⭐`, bg: "bg-slate-50", color: "text-slate-900" },
              { label: "Tasa de Finalización", value: `${kpis.completionRate}%`, bg: "bg-emerald-50", color: "text-emerald-600" },
              { label: "Total de Conductores", value: kpis.totalDrivers, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "Viajes Completados", value: kpis.completedRides, bg: "bg-purple-50", color: "text-purple-600" },
            ].map(item => (
              <div key={item.label} className={`flex justify-between items-center p-3 ${item.bg} rounded-lg`}>
                <span className="text-slate-600 font-medium">{item.label}</span>
                <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Layout currentPageName="Analytics">
      <AnalyticsContent />
    </Layout>
  );
}

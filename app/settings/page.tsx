
"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { toast } from "sonner";
import Layout from "@/components/admin/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Palette, Building2, Phone, Mail, DollarSign, Settings2, Zap, Tag, Plus, Trash2, Bell, Scissors, Car, Users, Clock, MapPin, Shield, RefreshCw, Layers, Share2, Copy, Check, Truck, Globe, LayoutDashboard, Map, Layout as LayoutIcon, AlertTriangle } from "lucide-react";
import LandingEditor from "@/components/settings/LandingEditor";
import NavConfigEditor from "@/components/admin/NavConfigEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setNotificationSettings } from "@/components/shared/useRideNotifications";

const TIMEZONES = [
  { value: "America/Mexico_City",   label: "Ciudad de México (GMT-6)" },
  { value: "America/Monterrey",     label: "Monterrey (GMT-6)" },
  { value: "America/Tijuana",       label: "Tijuana (GMT-8 / GMT-7)" },
  { value: "America/Hermosillo",    label: "Hermosillo (GMT-7)" },
  { value: "America/Chihuahua",     label: "Chihuahua (GMT-7)" },
  { value: "America/Cancun",        label: "Cancún (GMT-5)" },
  { value: "America/Merida",        label: "Mérida (GMT-6)" },
  { value: "America/Mazatlan",      label: "Mazatlán (GMT-7)" },
  { value: "America/Bogota",        label: "Bogotá (GMT-5)" },
  { value: "America/Lima",          label: "Lima (GMT-5)" },
  { value: "America/Santiago",      label: "Santiago (GMT-4)" },
  { value: "America/Buenos_Aires",  label: "Buenos Aires (GMT-3)" },
  { value: "America/Sao_Paulo",     label: "São Paulo (GMT-3)" },
  { value: "America/New_York",      label: "Nueva York (GMT-5)" },
  { value: "America/Los_Angeles",   label: "Los Ángeles (GMT-8)" },
  { value: "America/Chicago",       label: "Chicago (GMT-6)" },
  { value: "Europe/Madrid",         label: "Madrid (GMT+1)" },
  { value: "Europe/London",         label: "Londres (GMT+0)" },
  { value: "UTC",                   label: "UTC (GMT+0)" },
];

const defaults = {
  // Información general
  company_name: "", primary_color: "#0F172A", accent_color: "#3B82F6",
  secondary_color: "#10B981", currency: "MXN", contact_phone: "", contact_email: "", logo_url: "",
  welcome_message: "Bienvenido a tu plataforma de transporte", driver_app_instructions: "",
  
  // Tarifas
  base_fare: 30, price_per_km: 8, price_per_minute: 1.5, platform_commission_pct: 20,
  
  // Control de funciones
  require_admin_approval_to_start: true, auto_assign_nearest_driver: true,
  destination_required: false, allow_driver_cancel: true,
  features_enabled: { scheduling: true, promotions: true, driver_earnings_panel: true, proof_photo: true, geo_assignment: true, show_app_install_section: false },
  promotions: [],
  
  // Configuración regional
  timezone: "America/Mexico_City",
  
  // Mapas
  maps_provider: "osrm",
  google_maps_api_key: "",
  city_traffic_factor: 1.0,
  
  // Modo Subasta
  auction_mode_enabled: true,
  auction_primary_radius_km: 5,
  auction_secondary_radius_km: 8,
  auction_timeout_seconds: 35,
  auction_max_drivers: 5,
  auction_max_retries: 3,
  max_concurrent_rides: 1,
  
  // ETA Parameters
  eta_speed_kmh: 30,
  eta_update_interval_seconds: 15,
  driver_location_update_interval_seconds: 5,
  eta_modal_duration_seconds: 15,
  service_flow_update_minutes: 5,
  
  // Jornada Laboral
  work_max_hours: 12,
  work_break_interval_minutes: 60,
  work_break_duration_minutes: 30,
  work_long_break_duration_minutes: 360,
  work_rest_trigger_minutes: 60,
  work_rest_ratio: 0.5,
  work_long_rest_minutes: 360,
  
  // Tipos de vehículos
  accept_cars: true,
  accept_motos: true,
  
  // Operaciones
  driver_inactivity_timeout_minutes: 30,
  rating_window_minutes: 1440,
  payment_timeout_hours: 24,
  search_phase_seconds: 5,
  cutoff_interval_days: 7,
  
  // Control de rechazos
  rejection_rate_warning_threshold: 60,
  rejection_count_threshold: 5,
  soft_block_low_acceptance_rate_enabled: true,
  low_acceptance_rate_threshold: 60,
  low_acceptance_rate_offer_reduction_pct: 90,
  
  // Soporte
  support_whatsapp_number: "",
  support_whatsapp_message: "",
  wallet_min_balance: 0,
  
  // Alertas y notificaciones
  notification_sound_type: "classic",
  notification_volume: 0.7,
  notification_interval_seconds: 3,
  
  // Documentos y configuración
  payment_methods: [],
  driver_vehicle_docs: [],
  driver_required_docs: [],
  nav_config: [],
  landing_config: {},
  
  // Seguridad y validación
  require_email_verification: false,
  show_passenger_phone_to_driver: true,
  
  // Pagos
  payment_gateway: "",
  pending_payment_methods: [],
  
  // Metadata
  updated_date: new Date().toISOString(),
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...defaults });
  const [copied, setCopied] = useState(null);

  const getAppOrigin = () => {
    try { return window.top.location.origin; } catch { return window.location.origin; }
  };
  const appOrigin = getAppOrigin();
  const passengerAppUrl = `${appOrigin}/RoadAssistApp`;
  const driverAppUrl = `${appOrigin}/DriverApp`;

  const copyLink = (url, key) => {
    navigator.clipboard.writeText(url);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const { data: settingsList = [] } = useQuery({
    queryKey: ["appSettings"],
    queryFn: () => supabaseApi.settings.list(),
  });

  const settings = settingsList[0];

  useEffect(() => {
    if (settings) {
      setForm({
        ...defaults,
        ...settings,
        features_enabled: {
          ...defaults.features_enabled,
          ...(settings.features_enabled || {}),
        },
      });
    }
  }, [settings]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (["notification_interval_seconds", "notification_volume", "notification_sound_type"].includes(field)) {
      setNotificationSettings({
        interval_seconds: field === "notification_interval_seconds" ? value : form.notification_interval_seconds,
        volume: field === "notification_volume" ? value : form.notification_volume,
        sound_type: field === "notification_sound_type" ? value : form.notification_sound_type,
      });
    }
  };
  const updateFeature = (key, value) => setForm(prev => ({ ...prev, features_enabled: { ...prev.features_enabled, [key]: value } }));

  const handleSave = async () => {
    try {
      setSaving(true);
      if (settings?.id) {
        await supabaseApi.settings.update(settings.id, form);
      } else {
        await supabaseApi.settings.create(form);
      }
      queryClient.invalidateQueries({ queryKey: ["appSettings"] });
      toast.success("Configuración guardada");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // ✅ Obtener sesión de admin del localStorage
      const adminSession = localStorage.getItem('adminSession');
      if (!adminSession) {
        toast.error("Sesión expirada - inicia sesión nuevamente");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          "x-admin-session": adminSession,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en upload");
      }
      
      const { url } = await response.json();
      update("logo_url", url);
      toast.success("Logo subido");
    } catch (error: any) {
      toast.error(error.message || "Error al subir logo");
    }
  };

  const addPromo = () => {
    const promos = form.promotions || [];
    update("promotions", [...promos, { code: "", discount_pct: 10, is_active: true, description: "" }]);
  };

  const updatePromo = (i, field, value) => {
    const promos = [...(form.promotions || [])];
    promos[i] = { ...promos[i], [field]: value };
    update("promotions", promos);
  };

  const removePromo = (i) => {
    const promos = (form.promotions || []).filter((_, idx) => idx !== i);
    update("promotions", promos);
  };

  return (
    <Layout currentPageName="Settings">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
            <p className="text-sm text-slate-400 mt-0.5">Gestiona todos los parámetros del sistema</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 rounded-xl px-8">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex flex-wrap w-full h-auto gap-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Tarifas</TabsTrigger>
            <TabsTrigger value="features">Funciones</TabsTrigger>
            <TabsTrigger value="auction">🔨 Subasta</TabsTrigger>
            <TabsTrigger value="eta">⏱️ ETA</TabsTrigger>
            <TabsTrigger value="jornada">⏰ Jornada</TabsTrigger>
            <TabsTrigger value="vehicles">🚗 Vehículos</TabsTrigger>
            <TabsTrigger value="operations">⚙️ Operaciones</TabsTrigger>
            <TabsTrigger value="payment">💳 Pagos</TabsTrigger>
            <TabsTrigger value="security">🔒 Seguridad</TabsTrigger>
            <TabsTrigger value="alerts">🔔 Alertas</TabsTrigger>
            <TabsTrigger value="rejection">⛔ Rechazos</TabsTrigger>
            <TabsTrigger value="promos">Promociones</TabsTrigger>
            <TabsTrigger value="maps">Mapas</TabsTrigger>
            <TabsTrigger value="driverdocs">Docs Conductores</TabsTrigger>
            <TabsTrigger value="navconfig">Menú lateral</TabsTrigger>
            <TabsTrigger value="landing"><LayoutIcon className="w-3.5 h-3.5 mr-1" />Landing</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600"><Building2 className="w-5 h-5" /></div>
                <h2 className="font-semibold text-slate-900">Información de la empresa</h2>
              </div>
              <div className="space-y-4">
                <div><Label>Nombre de la empresa</Label><Input value={form.company_name} onChange={e => update("company_name", e.target.value)} /></div>
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4 mt-1">
                    {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-slate-50 border" />}
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} className="max-w-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</Label><Input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} /></div>
                  <div><Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label><Input value={form.contact_email} onChange={e => update("contact_email", e.target.value)} /></div>
                </div>
                <div><Label>Moneda</Label><Input value={form.currency} onChange={e => update("currency", e.target.value)} className="max-w-xs" /></div>
                <div><Label>Mensaje de bienvenida</Label><Textarea value={form.welcome_message} onChange={e => update("welcome_message", e.target.value)} rows={2} /></div>
                <div><Label>Instrucciones para conductores</Label><Textarea value={form.driver_app_instructions || ""} onChange={e => update("driver_app_instructions", e.target.value)} rows={3} placeholder="Estas instrucciones se mostrarán a los conductores en la app..." /></div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-green-50 text-green-600"><Phone className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Soporte WhatsApp</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Información de contacto para pasajeros y conductores</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Número WhatsApp de soporte</Label>
                  <Input value={form.support_whatsapp_number || ""} onChange={e => update("support_whatsapp_number", e.target.value)} placeholder="+1 (555) 123-4567" />
                  <p className="text-xs text-slate-400 mt-1">Formato: +código_país número</p>
                </div>
                <div>
                  <Label>Mensaje predeterminado</Label>
                  <Textarea value={form.support_whatsapp_message || ""} onChange={e => update("support_whatsapp_message", e.target.value)} placeholder="Hola, necesito ayuda con mi viaje..." rows={2} />
                  <p className="text-xs text-slate-400 mt-1">Mensaje sugerido al hacer clic en WhatsApp</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600"><Globe className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Zona horaria</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Define la zona horaria para mostrar fechas y horas</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Zona horaria del sistema</Label>
                  <Select value={form.timezone || "America/Mexico_City"} onValueChange={v => update("timezone", v)}>
                    <SelectTrigger className="mt-1 max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl">
                  <p className="text-xs text-sky-700">
                    <strong>Hora actual en esta zona:</strong>{" "}
                    {new Date().toLocaleString("es-MX", { timeZone: form.timezone || "America/Mexico_City", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600"><Palette className="w-5 h-5" /></div>
                <h2 className="font-semibold text-slate-900">Colores de marca</h2>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "Color primario", field: "primary_color" },
                  { label: "Color de acento", field: "accent_color" },
                  { label: "Color secundario", field: "secondary_color" },
                ].map(c => (
                  <div key={c.field} className="text-center">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-2 shadow-sm border cursor-pointer relative overflow-hidden" style={{ backgroundColor: form[c.field] }}>
                      <input type="color" value={form[c.field]} onChange={e => update(c.field, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{form[c.field]}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="w-5 h-5" /></div>
                <h2 className="font-semibold text-slate-900">Tarifas globales</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Estas tarifas se usan como base global. Cada tipo de servicio puede tener sus propias tarifas.</p>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Tarifa base por viaje ($)</Label>
                  <Input type="number" value={form.base_fare} onChange={e => update("base_fare", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Precio por kilómetro ($)</Label>
                  <Input type="number" value={form.price_per_km} onChange={e => update("price_per_km", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Precio por minuto ($)</Label>
                  <Input type="number" value={form.price_per_minute} onChange={e => update("price_per_minute", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Comisión de la plataforma (%)</Label>
                  <Input type="number" value={form.platform_commission_pct} onChange={e => update("platform_commission_pct", parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-slate-400 mt-1">El conductor recibe el {100 - (form.platform_commission_pct || 0)}% del viaje</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Zap className="w-5 h-5" /></div>
                <h2 className="font-semibold text-slate-900">Control de funciones</h2>
              </div>
              <div className="space-y-4">
                {[
                  { key: "require_admin_approval_to_start", label: "Requerir aprobación del admin para iniciar viaje", desc: "El conductor debe esperar confirmación antes de iniciar", direct: true },
                  { key: "auto_assign_nearest_driver", label: "Asignación automática al conductor más cercano", desc: "Al crear un viaje, se sugiere el conductor más cercano", direct: true },
                  { key: "destination_required", label: "Destino obligatorio", desc: "Si está desactivado, el destino es opcional", direct: true },
                  { key: "allow_driver_cancel", label: "Permitir que conductores cancelen viajes", desc: "Los conductores pueden cancelar desde la app", direct: true },
                  { key: "scheduling", label: "Viajes programados", desc: "Permite programar viajes a futuro", direct: false },
                  { key: "promotions", label: "Promociones y descuentos", desc: "Habilita códigos de promoción", direct: false },
                  { key: "driver_earnings_panel", label: "Panel de ganancias del conductor", desc: "El conductor puede ver sus ganancias", direct: false },
                  { key: "proof_photo", label: "Foto de prueba al finalizar", desc: "Requerir que conductores tomen foto al completar viaje", direct: false },
                  { key: "geo_assignment", label: "Asignación por geo-zona", desc: "Usar geozonas para asignación automática de viajes", direct: false },
                  { key: "show_app_install_section", label: "Mostrar banner de instalación de app", desc: "Mostrar sección PWA en landing page", direct: false },
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={item.direct ? !!form[item.key] : !!(form.features_enabled?.[item.key] ?? true)}
                      onCheckedChange={v => item.direct ? update(item.key, v) : updateFeature(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </Card>

          </TabsContent>

          <TabsContent value="auction" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Users className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">🔨 Modo Subasta Global</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Controla cómo se asignan los viajes a los conductores</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-800">Subasta de viajes</p>
                    <p className="text-xs text-slate-400 mt-0.5">Si está activo, se notifica a múltiples conductores y el primero en aceptar toma el viaje</p>
                  </div>
                  <Switch checked={!!form.auction_mode_enabled} onCheckedChange={v => update("auction_mode_enabled", v)} />
                </div>
                
                {form.auction_mode_enabled && (
                  <div className="grid grid-cols-2 gap-5 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div>
                      <Label>Radio primario (km)</Label>
                      <Input type="number" min={1} value={form.auction_primary_radius_km ?? 5} onChange={e => update("auction_primary_radius_km", parseFloat(e.target.value) || 5)} />
                      <p className="text-xs text-slate-500 mt-1">Busca conductores en este radio primero</p>
                    </div>
                    <div>
                      <Label>Radio secundario (km)</Label>
                      <Input type="number" min={1} value={form.auction_secondary_radius_km ?? 8} onChange={e => update("auction_secondary_radius_km", parseFloat(e.target.value) || 8)} />
                      <p className="text-xs text-slate-500 mt-1">Si no hay conductores, expande a este radio</p>
                    </div>
                    <div>
                      <Label>Tiempo para aceptar (segundos)</Label>
                      <Input type="number" min={10} value={form.auction_timeout_seconds ?? 35} onChange={e => update("auction_timeout_seconds", parseFloat(e.target.value) || 35)} />
                      <p className="text-xs text-slate-500 mt-1">Máximo tiempo que tiene el conductor</p>
                    </div>
                    <div>
                      <Label>Máximo conductores notificados</Label>
                      <Input type="number" min={1} value={form.auction_max_drivers ?? 5} onChange={e => update("auction_max_drivers", parseFloat(e.target.value) || 5)} />
                      <p className="text-xs text-slate-500 mt-1">Cuántos se notificarán simultáneamente</p>
                    </div>
                    <div>
                      <Label>Máximo viajes simultáneos por conductor</Label>
                      <Input type="number" min={1} max={5} value={form.max_concurrent_rides ?? 1} onChange={e => update("max_concurrent_rides", parseInt(e.target.value) || 1)} />
                      <p className="text-xs text-slate-500 mt-1">Límite de viajes activos asignados</p>
                    </div>
                    <div>
                      <Label>Máximo reintentos de subasta</Label>
                      <Input type="number" min={1} max={10} value={form.auction_max_retries ?? 3} onChange={e => update("auction_max_retries", parseInt(e.target.value) || 3)} />
                      <p className="text-xs text-slate-500 mt-1">Reintentos al rechazar un conductor</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="eta" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Clock className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Tiempo de Llegada (ETA) Avanzado</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configura cálculos y actualizaciones de ETA</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Velocidad promedio urbana (km/h)</Label>
                  <Input type="number" min={5} max={120} value={form.eta_speed_kmh ?? 30} onChange={e => update("eta_speed_kmh", parseFloat(e.target.value) || 30)} />
                  <p className="text-xs text-slate-500 mt-1">Se usa: distancia ÷ velocidad</p>
                </div>
                <div>
                  <Label>Intervalo actualización ETA (seg)</Label>
                  <Input type="number" min={1} value={form.eta_update_interval_seconds ?? 15} onChange={e => update("eta_update_interval_seconds", parseFloat(e.target.value) || 15)} />
                </div>
                <div>
                  <Label>Intervalo ubicación conductor (seg)</Label>
                  <Input type="number" min={1} value={form.driver_location_update_interval_seconds ?? 5} onChange={e => update("driver_location_update_interval_seconds", parseFloat(e.target.value) || 5)} />
                  <p className="text-xs text-slate-500 mt-1">Cada cuántos segundos se consulta GPS</p>
                </div>
                <div>
                  <Label>Duración pantalla ETA (seg)</Label>
                  <Input type="number" min={5} value={form.eta_modal_duration_seconds ?? 15} onChange={e => update("eta_modal_duration_seconds", parseFloat(e.target.value) || 15)} />
                  <p className="text-xs text-slate-500 mt-1">Tiempo de pantalla interactiva</p>
                </div>
                <div>
                  <Label>Actualizar mapa calor (min)</Label>
                  <Input type="number" min={1} value={form.service_flow_update_minutes ?? 5} onChange={e => update("service_flow_update_minutes", parseFloat(e.target.value) || 5)} />
                  <p className="text-xs text-slate-500 mt-1">Intervalo refresco mapa de flujo</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="jornada" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-red-50 text-red-600"><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Límites de Jornada Laboral</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Prevención de accidentes por fatiga</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Máximo horas trabajo al día</Label>
                  <Input type="number" min={1} value={form.work_max_hours ?? 12} onChange={e => update("work_max_hours", parseFloat(e.target.value) || 12)} />
                  <p className="text-xs text-slate-500 mt-1">Limite acumulado diario</p>
                </div>
                <div>
                  <Label>Triggers descanso (min)</Label>
                  <Input type="number" min={1} value={form.work_rest_trigger_minutes ?? 60} onChange={e => update("work_rest_trigger_minutes", parseFloat(e.target.value) || 60)} />
                  <p className="text-xs text-slate-500 mt-1">Trabajar X minutos → descanso</p>
                </div>
                <div>
                  <Label>Ratio descanso</Label>
                  <Input type="number" min={0} max={1} step={0.1} value={form.work_rest_ratio ?? 0.5} onChange={e => update("work_rest_ratio", parseFloat(e.target.value) || 0.5)} />
                  <p className="text-xs text-slate-500 mt-1">0.5 = 30min descanso por 60min trabajo</p>
                </div>
                <div>
                  <Label>Descanso largo (min)</Label>
                  <Input type="number" min={30} value={form.work_long_rest_minutes ?? 360} onChange={e => update("work_long_rest_minutes", parseFloat(e.target.value) || 360)} />
                  <p className="text-xs text-slate-500 mt-1">Al completar máx horas del día</p>
                </div>
                <div>
                  <Label>Descanso después de X minutos</Label>
                  <Input type="number" min={1} value={form.work_break_interval_minutes ?? 60} onChange={e => update("work_break_interval_minutes", parseFloat(e.target.value) || 60)} />
                  <p className="text-xs text-slate-500 mt-1">Cada cuántos minutos de trabajo</p>
                </div>
                <div>
                  <Label>Minutos descanso a acumular</Label>
                  <Input type="number" min={1} value={form.work_break_duration_minutes ?? 30} onChange={e => update("work_break_duration_minutes", parseFloat(e.target.value) || 30)} />
                  <p className="text-xs text-slate-500 mt-1">Ejemplo: 30 min por cada 60 min trabajados</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600"><Truck className="w-5 h-5" /></div>
                <h2 className="font-semibold text-slate-900">Tipos de Vehículos</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">🚗 Aceptar carros</p>
                    <p className="text-xs text-slate-400 mt-0.5">Permite que conductores con carro se registren</p>
                  </div>
                  <Switch checked={!!form.accept_cars} onCheckedChange={v => update("accept_cars", v)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">🏍️ Aceptar motos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Permite que conductores con moto se registren</p>
                  </div>
                  <Switch checked={!!form.accept_motos} onCheckedChange={v => update("accept_motos", v)} />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Settings2 className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Operaciones y Pagos</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configuración operacional del sistema</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Inactividad conductor (min)</Label>
                  <Input type="number" min={5} value={form.driver_inactivity_timeout_minutes ?? 30} onChange={e => update("driver_inactivity_timeout_minutes", parseFloat(e.target.value) || 30)} />
                  <p className="text-xs text-slate-500 mt-1">Minutos sin actividad antes de logout</p>
                </div>
                <div>
                  <Label>Ventana de calificación (min)</Label>
                  <Input type="number" min={60} value={form.rating_window_minutes ?? 1440} onChange={e => update("rating_window_minutes", parseFloat(e.target.value) || 1440)} />
                  <p className="text-xs text-slate-500 mt-1">Minutos para calificar viaje (1440=24h)</p>
                </div>
                <div>
                  <Label>Timeout pagos (horas)</Label>
                  <Input type="number" min={1} value={form.payment_timeout_hours ?? 24} onChange={e => update("payment_timeout_hours", parseFloat(e.target.value) || 24)} />
                  <p className="text-xs text-slate-500 mt-1">Horas para confirmar pago pendiente</p>
                </div>
                <div>
                  <Label>Saldo mínimo billetera ($)</Label>
                  <Input type="number" min={0} value={form.wallet_min_balance ?? 0} onChange={e => update("wallet_min_balance", parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-slate-500 mt-1">Saldo mínimo permitido en billetera</p>
                </div>
                <div>
                  <Label>Fase de búsqueda (segundos)</Label>
                  <Input type="number" min={1} max={60} value={form.search_phase_seconds ?? 5} onChange={e => update("search_phase_seconds", parseFloat(e.target.value) || 5)} />
                  <p className="text-xs text-slate-500 mt-1">Segundos que dura la fase visual de "buscando conductor"</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Scissors className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Cortes de caja</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configuración del período de corte para conductores</p>
                </div>
              </div>
              <div>
                <Label>Intervalo de corte (días)</Label>
                <p className="text-xs text-slate-400 mb-2">Cada cuántos días se realiza el corte de caja del conductor</p>
                <Input
                  type="number" min={1} max={30}
                  value={form.cutoff_interval_days ?? 7}
                  onChange={e => update("cutoff_interval_days", parseFloat(e.target.value) || 7)}
                  className="max-w-[120px]"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Bell className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Soporte y Alertas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Información de contacto y notificaciones</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <Label>Número WhatsApp soporte</Label>
                  <Input value={form.support_whatsapp_number || ""} onChange={e => update("support_whatsapp_number", e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label>Mensaje WhatsApp predeterminado</Label>
                  <Textarea value={form.support_whatsapp_message || ""} onChange={e => update("support_whatsapp_message", e.target.value)} placeholder="Hola, necesito ayuda..." rows={3} />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Bell className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Alertas de nuevos servicios</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configura el comportamiento de las notificaciones sonoras en el panel de administración</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <Label>Tipo de sonido</Label>
                  <p className="text-xs text-slate-400 mb-2">Sonido que se reproduce al recibir un nuevo servicio</p>
                  <Select value={form.notification_sound_type || "classic"} onValueChange={v => update("notification_sound_type", v)}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">🔔 Clásico</SelectItem>
                      <SelectItem value="urgent">🚨 Urgente</SelectItem>
                      <SelectItem value="chime">🎵 Campana</SelectItem>
                      <SelectItem value="beep">📣 Beep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Volumen de alertas</Label>
                  <p className="text-xs text-slate-400 mb-2">Ajusta el volumen del sonido de notificaciones (0 = silencio, 1 = máximo)</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number" min={0} max={1} step={0.1}
                      value={form.notification_volume ?? 0.7}
                      onChange={e => update("notification_volume", parseFloat(e.target.value) || 0)}
                      className="max-w-[100px]"
                    />
                    <span className="text-sm text-slate-500">{Math.round((form.notification_volume ?? 0.7) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <Label>Intervalo de repetición (segundos)</Label>
                  <p className="text-xs text-slate-400 mb-2">Cada cuántos segundos se repite la alerta sonora si el servicio sigue sin atender</p>
                  <Input
                    type="number" min={1} max={60}
                    value={form.notification_interval_seconds ?? 3}
                    onChange={e => update("notification_interval_seconds", parseFloat(e.target.value) || 3)}
                    className="max-w-[120px]"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-green-50 text-green-600"><DollarSign className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Métodos de Pago</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configura los métodos de pago disponibles</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Gateway de Pagos</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <input
                        type="radio"
                        id="stripe"
                        name="gateway"
                        value="stripe"
                        checked={form.payment_gateway === "stripe"}
                        onChange={e => update("payment_gateway", e.target.value)}
                        className="mr-2"
                      />
                      <label htmlFor="stripe" className="text-sm">Stripe</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="paypal"
                        name="gateway"
                        value="paypal"
                        checked={form.payment_gateway === "paypal"}
                        onChange={e => update("payment_gateway", e.target.value)}
                        className="mr-2"
                      />
                      <label htmlFor="paypal" className="text-sm">PayPal</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="mercadopago"
                        name="gateway"
                        value="mercadopago"
                        checked={form.payment_gateway === "mercadopago"}
                        onChange={e => update("payment_gateway", e.target.value)}
                        className="mr-2"
                      />
                      <label htmlFor="mercadopago" className="text-sm">Mercado Pago</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="manual"
                        name="gateway"
                        value="manual"
                        checked={form.payment_gateway === "manual"}
                        onChange={e => update("payment_gateway", e.target.value)}
                        className="mr-2"
                      />
                      <label htmlFor="manual" className="text-sm">Manual</label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-800">Métodos Activos</p>
                      <p className="text-xs text-slate-400 mt-0.5">Métodos disponibles para pasajeros y conductores</p>
                    </div>
                    <Button size="sm" onClick={() => {
                      const methods = form.payment_methods || [];
                      update("payment_methods", [...methods, { id: `pm_${Date.now()}`, name: "", type: "card", is_active: true }]);
                    }} className="rounded-lg"><Plus className="w-4 h-4 mr-1" />Agregar</Button>
                  </div>
                  {(!form.payment_methods || form.payment_methods.length === 0) && (
                    <p className="text-sm text-slate-400 text-center py-6">Sin métodos configurados</p>
                  )}
                  <div className="space-y-3">
                    {(form.payment_methods || []).map((method, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-xs">Nombre del método</Label>
                            <Input value={method.name} onChange={e => {
                              const methods = [...(form.payment_methods || [])];
                              methods[i] = { ...methods[i], name: e.target.value };
                              update("payment_methods", methods);
                            }} placeholder="Ej: Tarjeta de crédito, PayPal..." className="mt-1" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs">Activo</Label>
                            <Switch checked={!!method.is_active} onCheckedChange={v => {
                              const methods = [...(form.payment_methods || [])];
                              methods[i] = { ...methods[i], is_active: v };
                              update("payment_methods", methods);
                            }} />
                          </div>
                          <Button variant="ghost" size="icon" className="text-red-400 h-9 w-9 flex-shrink-0" onClick={() => {
                            update("payment_methods", (form.payment_methods || []).filter((_, idx) => idx !== i));
                          }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Shield className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Seguridad y Privacidad</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Configuración de acceso y validación</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">Requerir verificación de email</p>
                    <p className="text-xs text-slate-400 mt-0.5">Los usuarios deben confirmar email para registrarse</p>
                  </div>
                  <Switch checked={!!form.require_email_verification} onCheckedChange={v => update("require_email_verification", v)} />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">Mostrar teléfono pasajero al conductor</p>
                    <p className="text-xs text-slate-400 mt-0.5">El conductor verá el teléfono del pasajero</p>
                  </div>
                  <Switch checked={!!form.show_passenger_phone_to_driver} onCheckedChange={v => update("show_passenger_phone_to_driver", v)} />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rejection" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-red-50 text-red-600"><AlertTriangle className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Control de Rechazos de Conductores</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Umbrales y penalizaciones por baja aceptación de viajes</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label>Umbral de tasa de rechazo (%)</Label>
                  <Input type="number" min={0} max={100} value={form.rejection_rate_warning_threshold ?? 60} onChange={e => update("rejection_rate_warning_threshold", parseInt(e.target.value) || 60)} />
                  <p className="text-xs text-slate-500 mt-1">Porcentaje de rechazo para generar alerta</p>
                </div>
                <div>
                  <Label>Umbral de rechazos acumulados</Label>
                  <Input type="number" min={1} value={form.rejection_count_threshold ?? 5} onChange={e => update("rejection_count_threshold", parseInt(e.target.value) || 5)} />
                  <p className="text-xs text-slate-500 mt-1">Número de rechazos antes de penalizar</p>
                </div>
                <div>
                  <Label>Umbral de tasa de aceptación baja (%)</Label>
                  <Input type="number" min={0} max={100} value={form.low_acceptance_rate_threshold ?? 60} onChange={e => update("low_acceptance_rate_threshold", parseInt(e.target.value) || 60)} />
                  <p className="text-xs text-slate-500 mt-1">Si tasa de aceptación es menor, se aplica penalización suave</p>
                </div>
                <div>
                  <Label>Reducción de oferta (%)</Label>
                  <Input type="number" min={0} max={100} value={form.low_acceptance_rate_offer_reduction_pct ?? 90} onChange={e => update("low_acceptance_rate_offer_reduction_pct", parseInt(e.target.value) || 90)} />
                  <p className="text-xs text-slate-500 mt-1">Probabilidad de recibir oferta → 90% = 10% menos probable</p>
                </div>
              </div>

              <div className="border-t pt-5 mt-5">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-800">Activar penalizaciones suaves</p>
                    <p className="text-xs text-slate-400 mt-0.5">Reduce oferta a conductores con baja aceptación</p>
                  </div>
                  <Switch checked={!!form.soft_block_low_acceptance_rate_enabled} onCheckedChange={v => update("soft_block_low_acceptance_rate_enabled", v)} />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="promos" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-50 text-pink-600"><Tag className="w-5 h-5" /></div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Códigos de promoción</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Gestiona descuentos y promociones</p>
                  </div>
                </div>
                <Button size="sm" onClick={addPromo} className="rounded-lg"><Plus className="w-4 h-4 mr-1" />Agregar</Button>
              </div>
              <div className="space-y-3">
                {(!form.promotions || form.promotions.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-6">Sin promociones configuradas</p>
                )}
                {(form.promotions || []).map((promo, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Código</Label>
                        <Input value={promo.code} onChange={e => updatePromo(i, "code", e.target.value)} placeholder="VERANO2024" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Descuento %</Label>
                        <Input type="number" value={promo.discount_pct} onChange={e => updatePromo(i, "discount_pct", parseFloat(e.target.value) || 0)} className="mt-1" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Label className="text-xs">Activo</Label>
                        <Switch checked={!!promo.is_active} onCheckedChange={v => updatePromo(i, "is_active", v)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Textarea value={promo.description} onChange={e => updatePromo(i, "description", e.target.value)} placeholder="Descripción para usuarios..." rows={2} className="mt-1" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removePromo(i)} className="text-red-500"><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="maps" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600"><Map className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Proveedor de Mapas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Selecciona qué servicio de mapas usar</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Proveedor de mapas</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => update("maps_provider", "osrm")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.maps_provider === "osrm"
                          ? "border-cyan-500 bg-cyan-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${form.maps_provider === "osrm" ? "border-cyan-500 bg-cyan-500" : "border-slate-300"}`}>
                          {form.maps_provider === "osrm" && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">OSRM (Predeterminado)</p>
                          <p className="text-xs text-slate-500 mt-1">Servicio libre de enrutamiento. Gratis, sin API Key.</p>
                          <p className="text-[10px] text-emerald-600 font-medium mt-2">✓ No requiere configuración</p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => update("maps_provider", "google_maps")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.maps_provider === "google_maps"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${form.maps_provider === "google_maps" ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                          {form.maps_provider === "google_maps" && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">Google Maps</p>
                          <p className="text-xs text-slate-500 mt-1">Mayor precisión. Requiere API Key pagada.</p>
                          <p className="text-[10px] text-orange-600 font-medium mt-2">⚙ Requiere configuración</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {form.maps_provider === "google_maps" && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div>
                      <Label className="text-sm font-medium">Google Maps API Key</Label>
                      <Input
                        type="password"
                        value={form.google_maps_api_key || ""}
                        onChange={e => update("google_maps_api_key", e.target.value)}
                        placeholder="AIzaSyD..."
                        className="font-mono mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="driverdocs" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Users className="w-5 h-5" /></div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Documentos personales</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Se solicitan al registrarse</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const docs = form.driver_required_docs || [];
                  update("driver_required_docs", [...docs, { key: `doc_${Date.now()}`, label: "", required: true, require_expiry: false }]);
                }} className="rounded-lg">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
              {(!form.driver_required_docs || form.driver_required_docs.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-6">No hay documentos configurados.</p>
              )}
              <div className="space-y-3">
                {(form.driver_required_docs || []).map((doc, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-xs">Nombre del documento</Label>
                        <Input value={doc.label} onChange={e => {
                          const docs = [...(form.driver_required_docs || [])];
                          docs[i] = { ...docs[i], label: e.target.value };
                          update("driver_required_docs", docs);
                        }} placeholder="Ej: INE, Comprobante de domicilio..." className="mt-1" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-400 h-9 w-9 flex-shrink-0" onClick={() => {
                        update("driver_required_docs", (form.driver_required_docs || []).filter((_, idx) => idx !== i));
                      }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600"><Truck className="w-5 h-5" /></div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Documentos del vehículo</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Requeridos para registrar vehículos</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const docs = form.driver_vehicle_docs || [];
                  update("driver_vehicle_docs", [...docs, { key: `vdoc_${Date.now()}`, label: "", required: true, require_expiry: false, applies_to: "both" }]);
                }} className="rounded-lg">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
              {(!form.driver_vehicle_docs || form.driver_vehicle_docs.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-6">No hay documentos de vehículo configurados.</p>
              )}
              <div className="space-y-3">
                {(form.driver_vehicle_docs || []).map((doc, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-xs">Nombre del documento</Label>
                        <Input value={doc.label} onChange={e => {
                          const docs = [...(form.driver_vehicle_docs || [])];
                          docs[i] = { ...docs[i], label: e.target.value };
                          update("driver_vehicle_docs", docs);
                        }} placeholder="Ej: Tarjeta de circulación, Póliza de seguro..." className="mt-1" />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs">Aplica a</Label>
                        <Select value={doc.applies_to || "both"} onValueChange={v => {
                          const docs = [...(form.driver_vehicle_docs || [])];
                          docs[i] = { ...docs[i], applies_to: v };
                          update("driver_vehicle_docs", docs);
                        }}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Ambos</SelectItem>
                            <SelectItem value="car">🚗 Carro</SelectItem>
                            <SelectItem value="moto">🏍️ Moto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-400 h-9 w-9 flex-shrink-0" onClick={() => {
                        update("driver_vehicle_docs", (form.driver_vehicle_docs || []).filter((_, idx) => idx !== i));
                      }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="landing" className="mt-5">
            <LandingEditor
              value={form.landing_config || {}}
              onChange={v => update("landing_config", v)}
            />
          </TabsContent>

          <TabsContent value="navconfig" className="space-y-5 mt-5">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><LayoutDashboard className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Configuración del menú lateral</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Define qué categorías aparecen en el sidebar</p>
                </div>
              </div>
              <NavConfigEditor
                value={form.nav_config || []}
                onChange={v => update("nav_config", v)}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

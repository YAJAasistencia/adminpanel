"use client";

import React, { useState } from "react";
import Layout from "@/components/admin/Layout";
import { supabaseApi } from "@/lib/supabaseApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, Pencil, Trash2, TrendingUp, FileText, Download, Search, Calendar, DollarSign, Car, Clock, XCircle, BarChart3, Layers, MapPin, ChevronDown, ChevronRight, FileCheck, Percent, ClipboardList, GitBranch, Shield, Users, PenLine, AlertCircle, CheckCircle2 } from "lucide-react";
import CompanyKPITab from "@/components/admin/CompanyKPITab";
import { toast } from "sonner";
import moment from "moment";
import { formatCDMX } from "@/components/shared/dateUtils";

const empty = {
  razon_social: "", rfc: "", direccion_fiscal: "", correo_facturacion: "",
  contacto: "", telefono: "", limite_credito: 0, limite_por_servicio: 0, is_active: true, notas: "",
  billing_type: "general", zone_prices: [], tax_pct: 0, folio_fields: [], folio_secundario_fields: [],
  parent_company_id: "", parent_company_name: "", sub_company_limit: 0,
  sub_accounts: [],
};

function PriceCorrectionTab({ rides, company }) {
  const [corrections, setCorrections] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [search, setSearch] = useState("");

  const completedRides = rides
    .filter(r => r.status === "completed")
    .filter(r => !search || r.passenger_name?.toLowerCase().includes(search.toLowerCase()) || r.service_id?.includes(search))
    .slice(0, 100);

  const getVal = (ride) => corrections[ride.id] !== undefined
    ? corrections[ride.id]
    : (ride.company_price ?? ride.final_price ?? ride.estimated_price ?? 0);

  const handleSaveCorrection = async (ride) => {
    const newPrice = parseFloat(corrections[ride.id]);
    if (isNaN(newPrice)) return;
    setSaving(p => ({ ...p, [ride.id]: true }));
    await supabaseApi.rideRequests.update(ride.id, { company_price: newPrice });
    setSaving(p => ({ ...p, [ride.id]: false }));
    setSaved(p => ({ ...p, [ride.id]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [ride.id]: false })), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Solo ajusta el costo empresa.</strong> El pago al conductor NO se modifica.
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pasajero o folio..." className="pl-9 text-sm" />
      </div>
      {completedRides.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">Sin servicios completados</p>
      ) : (
        <div className="space-y-2">
          {completedRides.map(ride => {
            const currentCompanyPrice = ride.company_price ?? ride.final_price ?? ride.estimated_price ?? 0;
            const driverPay = ride.driver_earnings ?? ride.estimated_price ?? 0;
            const isEdited = corrections[ride.id] !== undefined && parseFloat(corrections[ride.id]) !== currentCompanyPrice;
            return (
              <div key={ride.id} className="border border-slate-100 rounded-xl p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ride.passenger_name}</p>
                    <p className="text-xs text-slate-400">{formatCDMX(ride.created_date, "shortdatetime")} · Folio: {ride.service_id || "—"}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[260px]">{ride.pickup_address}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-slate-400">Pago conductor</p>
                    <p className="font-bold text-emerald-600">${driverPay.toFixed(0)}</p>
                    <p className="text-[10px] text-slate-300">(no cambia)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500 mb-1 block">Costo empresa ($)</Label>
                    <Input
                      type="number"
                      value={getVal(ride)}
                      onChange={e => setCorrections(p => ({ ...p, [ride.id]: e.target.value }))}
                      className={`h-8 text-sm ${isEdited ? "border-amber-400 bg-amber-50" : ""}`}
                    />
                  </div>
                  <div className="flex-shrink-0 pt-5">
                    <Button
                      size="sm"
                      disabled={!isEdited || saving[ride.id]}
                      onClick={() => handleSaveCorrection(ride)}
                      className={`rounded-xl h-8 text-xs ${
                        saved[ride.id] ? "bg-emerald-500 text-white" :
                        isEdited ? "bg-amber-500 hover:bg-amber-600 text-white" :
                        "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {saved[ride.id] ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Guardado</> :
                       saving[ride.id] ? "..." :
                       <><PenLine className="w-3.5 h-3.5 mr-1" />Guardar</>}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompanyKPIs({ rides }) {
  const completed = rides.filter(r => r.status === "completed");
  const cancelled = rides.filter(r => r.status === "cancelled");
  const totalRev = completed.reduce((s, r) => s + (r.final_price || r.estimated_price || 0), 0);
  const avgTicket = completed.length ? totalRev / completed.length : 0;
  const avgDist = completed.filter(r => r.distance_km).length
    ? completed.reduce((s, r) => s + (r.distance_km || 0), 0) / completed.filter(r => r.distance_km).length : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
      {[
        { label: "Total servicios", value: rides.length, icon: Car, color: "blue" },
        { label: "Completados", value: completed.length, icon: TrendingUp, color: "emerald" },
        { label: "Total facturado", value: `$${totalRev.toFixed(0)}`, icon: DollarSign, color: "green" },
        { label: "Ticket promedio", value: `$${avgTicket.toFixed(0)}`, icon: BarChart3, color: "purple" },
      ].map(kpi => (
        <div key={kpi.label} className={`bg-${kpi.color}-50 rounded-xl p-3 text-center`}>
          <p className="text-lg font-bold text-slate-800">{kpi.value}</p>
          <p className="text-xs text-slate-500">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}

function InvoiceTable({ rides, company }) {
  const [dateFrom, setDateFrom] = useState(moment().startOf("month").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));

  const filtered = rides.filter(r => {
    const d = moment(r.created_date);
    return d.isSameOrAfter(dateFrom, "day") && d.isSameOrBefore(dateTo, "day") && r.status === "completed";
  });

  const taxPct = company?.tax_pct ?? 16;
  const subtotal = filtered.reduce((s, r) => s + (r.company_price || r.final_price || r.estimated_price || 0), 0);
  const taxAmt = subtotal * (taxPct / 100);
  const total = subtotal + taxAmt;
  const driverTotal = filtered.reduce((s, r) => s + (r.driver_earnings || r.estimated_price || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 mt-1 text-sm" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">Sin servicios en el período seleccionado</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b">
                  {["Fecha","Folio","Pasajero","Origen","Servicio","Conductor","Costo Empresa","Pago Conductor"].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500">{formatCDMX(r.created_date, "shortdatetime")}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">{r.service_id || "—"}</td>
                    <td className="px-3 py-2 font-medium">{r.passenger_name}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[120px] truncate">{r.pickup_address}</td>
                    <td className="px-3 py-2">{r.service_type_name || "—"}</td>
                    <td className="px-3 py-2">{r.driver_name || "—"}</td>
                    <td className="px-3 py-2 font-semibold text-blue-600">${(r.company_price || r.final_price || r.estimated_price || 0).toFixed(0)}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-600">${(r.driver_earnings || r.estimated_price || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal ({filtered.length} servicios)</span><span className="font-medium text-blue-700">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Impuesto ({taxPct}%)</span><span className="font-medium">${taxAmt.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold text-slate-900">Total a facturar</span><span className="font-bold text-blue-700 text-base">${total.toFixed(2)}</span></div>
          </div>
        </>
      )}
    </div>
  );
}

function CompanyDetailDialog({ company, rides, onClose }) {
  return (
    <Dialog open={!!company} onOpenChange={v => !v && onClose()}>
      <DialogContent className="dialog-size-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            {company?.razon_social}
          </DialogTitle>
        </DialogHeader>
        {company && (
          <Tabs defaultValue="kpis">
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="kpis">KPI</TabsTrigger>
              <TabsTrigger value="billing">Facturación</TabsTrigger>
              <TabsTrigger value="rides">Historial</TabsTrigger>
              <TabsTrigger value="corrections">Correcciones</TabsTrigger>
            </TabsList>
            <TabsContent value="kpis">
              <CompanyKPITab company={company} rides={rides} />
            </TabsContent>
            <TabsContent value="billing">
              <InvoiceTable rides={rides} company={company} />
            </TabsContent>
            <TabsContent value="rides">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rides.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">Sin servicios aún</p>}
                {rides.map(r => (
                  <div key={r.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{r.passenger_name}</p>
                      <p className="text-xs text-slate-400">{r.pickup_address}</p>
                      <p className="text-xs text-slate-300">{formatCDMX(r.created_date, "shortdatetime")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">${(r.final_price || r.estimated_price || 0).toFixed(0)}</p>
                      <Badge variant="outline" className="text-xs mt-1">{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="corrections">
              <PriceCorrectionTab rides={rides} company={company} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Companies() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: zones = [] } = useQuery({
    queryKey: ["geoZones"],
    queryFn: async () => {
      const all = await supabaseApi.geoZones.list();
      return all.filter(z => z.is_active === true);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["serviceTypes"],
    queryFn: async () => {
      const all = await supabaseApi.serviceTypes.list();
      return all.filter(s => s.is_active === true);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const [expandedZones, setExpandedZones] = useState({});
  const [detailCompany, setDetailCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => supabaseApi.companies.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const all = await supabaseApi.surveys.list();
      return all.filter(s => s.is_active === true);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["allRides"],
    queryFn: () => supabaseApi.rideRequests.list(),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const up = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));

  const openNew = () => { setEditing({ ...empty }); setShowForm(true); };
  const openEdit = (c) => { setEditing({ ...c }); setShowForm(true); };

  const updateServicePrice = (zoneId, zoneName, serviceTypeId, serviceTypeName, price) => {
    const existing = editing.zone_prices || [];
    const zoneIdx = existing.findIndex(zp => zp.zone_id === zoneId);
    let zoneEntry = zoneIdx >= 0 ? { ...existing[zoneIdx] } : { zone_id: zoneId, zone_name: zoneName, service_prices: [] };
    const svcPrices = zoneEntry.service_prices || [];
    const svcIdx = svcPrices.findIndex(sp => sp.service_type_id === serviceTypeId);

    let updatedSvcPrices;
    if (price === "" || price === null) {
      updatedSvcPrices = svcPrices.filter(sp => sp.service_type_id !== serviceTypeId);
    } else if (svcIdx >= 0) {
      updatedSvcPrices = svcPrices.map(sp => sp.service_type_id === serviceTypeId ? { ...sp, price: parseFloat(price) || 0 } : sp);
    } else {
      updatedSvcPrices = [...svcPrices, { service_type_id: serviceTypeId, service_type_name: serviceTypeName, price: parseFloat(price) || 0 }];
    }
    zoneEntry.service_prices = updatedSvcPrices;

    let updated;
    if (zoneIdx >= 0) {
      updated = existing.map((zp, i) => i === zoneIdx ? zoneEntry : zp);
    } else {
      updated = [...existing, zoneEntry];
    }
    up("zone_prices", updated);
  };

  const getServicePrice = (zoneId, serviceTypeId) => {
    const zoneEntry = (editing?.zone_prices || []).find(zp => zp.zone_id === zoneId);
    if (!zoneEntry) return "";
    const svcEntry = (zoneEntry.service_prices || []).find(sp => sp.service_type_id === serviceTypeId);
    return svcEntry?.price ?? "";
  };

  const handleSave = async () => {
    if (!editing.razon_social) { toast.error("La razón social es requerida"); return; }
    setSaving(true);
    const data = {
      ...editing,
      limite_credito: parseFloat(editing.limite_credito) || 0,
      limite_por_servicio: parseFloat(editing.limite_por_servicio) || 0,
      sub_company_limit: parseFloat(editing.sub_company_limit) || 0,
      sub_accounts: editing.sub_accounts || [],
    };
    if (editing.id) await supabaseApi.companies.update(editing.id, data);
    else await supabaseApi.companies.create(data);
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    setSaving(false);
    setShowForm(false);
    toast.success("Empresa guardada");
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar empresa "${c.razon_social}"?`)) return;
    await supabaseApi.companies.delete(c.id);
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    toast.success("Empresa eliminada");
  };

  const filteredCompanies = companies.filter(c =>
    !search || c.razon_social?.toLowerCase().includes(search.toLowerCase()) || c.rfc?.toLowerCase().includes(search.toLowerCase())
  );

  const companyRides = (companyId) => rides.filter(r => r.company_id === companyId);

  return (
    <Layout currentPageName="Companies">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas (B2B)</h1>
          <p className="text-sm text-slate-400 mt-0.5">Módulo corporativo — facturación y KPIs por empresa</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nueva empresa
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa..." className="pl-10 rounded-xl" />
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{search ? "Sin resultados" : "No hay empresas registradas. Crea la primera."}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map(c => {
          const cRides = companyRides(c.id);
          const completed = cRides.filter(r => r.status === "completed");
          const revenue = completed.reduce((s, r) => s + (r.final_price || r.estimated_price || 0), 0);
          return (
            <Card key={c.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{c.razon_social}</h3>
                    <p className="text-xs text-slate-400">{c.rfc || "Sin RFC"}</p>
                  </div>
                </div>
                <Badge className={`text-xs ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {c.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm mb-3">
                {c.contacto && <p className="text-slate-600 text-xs">{c.contacto} · {c.telefono}</p>}
                {c.correo_facturacion && <p className="text-slate-400 text-xs">{c.correo_facturacion}</p>}
              </div>
              <div className="flex gap-2 bg-slate-50 rounded-xl p-2.5 mb-4">
                <div className="text-center flex-1">
                  <p className="text-xs text-slate-400">Servicios</p>
                  <p className="font-bold text-slate-800">{cRides.length}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs text-slate-400">Facturado</p>
                  <p className="font-bold text-emerald-600">${revenue.toFixed(0)}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs text-slate-400">Crédito</p>
                  <p className="font-bold text-blue-600">${c.limite_credito || 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs" onClick={() => setDetailCompany(c)}>
                  <BarChart3 className="w-3.5 h-3.5 mr-1" /> Ver detalles
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(c)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 rounded-xl" onClick={() => handleDelete(c)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="dialog-size-3xl max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Razón social *</Label>
                <Input value={editing.razon_social} onChange={e => up("razon_social", e.target.value)} className="mt-1" placeholder="Empresa S.A. de C.V." />
              </div>
              <div>
                <Label>RFC</Label>
                <Input value={editing.rfc} onChange={e => up("rfc", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Correo facturación</Label>
                <Input type="email" value={editing.correo_facturacion} onChange={e => up("correo_facturacion", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Dirección fiscal</Label>
                <Input value={editing.direccion_fiscal} onChange={e => up("direccion_fiscal", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Contacto</Label>
                <Input value={editing.contacto} onChange={e => up("contacto", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={editing.telefono} onChange={e => up("telefono", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Límite de crédito ($)</Label>
                <Input type="number" value={editing.limite_credito} onChange={e => up("limite_credito", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  Límite por servicio ($)
                </Label>
                <Input type="number" value={editing.limite_por_servicio || 0} onChange={e => up("limite_por_servicio", parseFloat(e.target.value) || 0)} className="mt-1" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={editing.is_active} onCheckedChange={v => up("is_active", v)} />
                <Label>Empresa activa</Label>
              </div>
              <div className="col-span-2">
                <Label>Notas internas</Label>
                <Textarea value={editing.notas} onChange={e => up("notas", e.target.value)} rows={2} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !editing?.razon_social}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailCompany && (
        <CompanyDetailDialog
          company={detailCompany}
          rides={companyRides(detailCompany.id)}
          onClose={() => setDetailCompany(null)}
        />
      )}
    </div>
    </Layout>
  );
}

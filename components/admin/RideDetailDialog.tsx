"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { MapPin, User, Car, CreditCard, Clock, DollarSign, Phone, Building2, Layers, FileText, Star, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { formatCDMX } from "@/components/shared/dateUtils";
import { supabaseApi } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import RideLiveMap from "@/components/admin/RideLiveMap";
import RideRouteMap from "@/components/admin/RideRouteMap";
import ChatWidget from "@/components/admin/ChatWidget";
import useAppSettings from "@/components/shared/useAppSettings";

const paymentLabels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia" };

// ── helpers ──────────────────────────────────────────────────────────────────
function getRidePrice(ride) {
  // For cancelled rides: show cancellation fee or 0
  if (ride.status === "cancelled") {
    return ride.cancellation_fee ?? 0;
  }
  // For completed rides: show final_price (actual cost charged)
  if (ride.status === "completed") {
    return ride.final_price ?? ride.estimated_price ?? 0;
  }
  // For active rides: show estimated price
  return ride.estimated_price ?? 0;
}

function calcTotals(ride) {
  const extras = Array.isArray(ride.extra_charges) ? ride.extra_charges : [];
  // Use actual ride price based on status (not just estimated)
  const basePrice = getRidePrice(ride);
  const totalExtras = extras.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const extrasForDriver = extras.filter(c => c.paid_to_driver).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const extrasWithCommission = extras.filter(c => !c.paid_to_driver).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const finalPrice = basePrice + totalExtras;
  const commissionRate = ride.commission_rate ?? 20;
  const commissionableAmount = basePrice + extrasWithCommission;
  const commission = ride.platform_commission ?? parseFloat((commissionableAmount * commissionRate / 100).toFixed(2));
  const driverEarnings = ride.driver_earnings ?? parseFloat((commissionableAmount - commission + extrasForDriver).toFixed(2));
  return { basePrice, totalExtras, extrasForDriver, extrasWithCommission, finalPrice, driverEarnings, commission, commissionRate, commissionableAmount };
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
async function generateTicketPDF(ride, type, companyOverridePrice) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const { basePrice, totalExtras, extrasForDriver, extrasWithCommission, finalPrice, driverEarnings, commission, commissionRate, commissionableAmount } = calcTotals(ride);
  const extras = Array.isArray(ride.extra_charges) ? ride.extra_charges : [];

  const lm = 15;
  let y = 18;
  const nl = (n = 7) => { y += n; return y; };
  const line = () => { doc.setLineWidth(0.3); doc.line(lm, y, 195, y); nl(5); };

  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  const title = type === "driver" ? "Ticket del Conductor" : type === "company" ? "Ticket Empresa (Facturación)" : "Ticket del Pasajero";
  doc.text(title, 105, y, { align: "center" }); nl(7);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`Folio: ${ride.service_id || ride.id?.slice(-8).toUpperCase()}`, 105, y, { align: "center" }); nl(6);
  const fechaStr = formatCDMX(ride.requested_at || ride.created_at, "datetime");
  doc.text(`Fecha: ${fechaStr}`, 105, y, { align: "center" }); nl(4);
  line();

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Datos del Servicio", lm, y); nl(6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Pasajero: ${ride.passenger_name || "-"}`, lm, y); nl(6);
  if (ride.passenger_phone) { doc.text(`Teléfono: ${ride.passenger_phone}`, lm, y); nl(6); }
  if (ride.company_name) { doc.text(`Empresa: ${ride.company_name}`, lm, y); nl(6); }
  doc.text(`Origen: ${ride.pickup_address || "-"}`, lm, y); nl(6);
  if (ride.dropoff_address) { doc.text(`Destino: ${ride.dropoff_address}`, lm, y); nl(6); }
  doc.text(`Servicio: ${ride.service_type_name || "-"}`, lm, y); nl(6);
  if (type === "driver") { doc.text(`Conductor: ${ride.driver_name || "-"}`, lm, y); nl(6); }
  if (ride.distance_km) { doc.text(`Distancia: ${ride.distance_km} km`, lm, y); nl(6); }
  nl(2); line();

  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Desglose de Costos", lm, y); nl(6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);

  if (type === "driver") {
    // ── TICKET CONDUCTOR: desglose completo ──
    doc.text(`Costo base del servicio:`, lm, y); doc.text(`$${basePrice.toFixed(2)}`, 195, y, { align: "right" }); nl(6);
    if (extras.length > 0) {
      doc.setFont("helvetica", "bold"); doc.text("Extras:", lm, y); nl(5);
      doc.setFont("helvetica", "normal");
      extras.forEach(e => {
        const tag = e.paid_to_driver ? " (PARA EL CONDUCTOR — sin comisión)" : " (con comisión)";
        const lines = doc.splitTextToSize(`  + ${e.concept}${tag}:`, 140);
        lines.forEach((l, idx) => { doc.text(l, lm, y); if (idx < lines.length - 1) nl(5); });
        if (e.paid_to_driver) doc.setTextColor(0, 80, 180); else doc.setTextColor(80, 80, 80);
        doc.text(`$${parseFloat(e.amount || 0).toFixed(2)}`, 195, y, { align: "right" });
        doc.setTextColor(0); nl(6);
      });
      doc.setLineWidth(0.2); doc.line(lm, y, 195, y); nl(5);
    }
    doc.setFont("helvetica", "bold");
    doc.text("Precio total del servicio:", lm, y); doc.text(`$${finalPrice.toFixed(2)}`, 195, y, { align: "right" }); nl(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Base comisionable (servicio + extras c/comisión): $${commissionableAmount.toFixed(2)}`, lm, y); nl(6);
    doc.text(`Comisión plataforma (${commissionRate}%):`, lm, y);
    doc.text(`-$${commission.toFixed(2)}`, 195, y, { align: "right" }); nl(6);
    if (extrasForDriver > 0) {
      doc.text(`Extras para el conductor (sin comisión):`, lm, y);
      doc.text(`+$${extrasForDriver.toFixed(2)}`, 195, y, { align: "right" }); nl(6);
    }
    doc.setLineWidth(0.3); doc.line(lm, y, 195, y); nl(5);
    doc.setFont("helvetica", "bold"); doc.setTextColor(0, 130, 0);
    doc.text("GANANCIA DEL CONDUCTOR:", lm, y); doc.text(`$${driverEarnings.toFixed(2)}`, 195, y, { align: "right" }); nl(7);
    doc.setTextColor(0); doc.setFont("helvetica", "normal");
    doc.text(`Método de pago: ${paymentLabels[ride.payment_method] || ride.payment_method || "-"}`, lm, y); nl(6);

  } else if (type === "company") {
    // ── TICKET EMPRESA: facturación completa — sin comisiones internas ──
    const billingBase = companyOverridePrice ?? ride.company_price ?? basePrice;
    const paidByPassenger = ride.paid_by === "passenger";

    doc.text(`Costo del servicio (empresa):`, lm, y); doc.text(`$${billingBase.toFixed(2)}`, 195, y, { align: "right" }); nl(6);

    // Extras: empresa paga todos salvo los del pasajero
    const extrasEmpresa = extras.filter(e => !paidByPassenger || !e.paid_to_driver);
    const extrasEmpresaTotal = extrasEmpresa.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const extrasDelPasajero = extras.filter(e => paidByPassenger && e.paid_to_driver);
    const extrasDelPasajeroTotal = extrasDelPasajero.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    if (extrasEmpresa.length > 0) {
      doc.setFont("helvetica", "bold"); doc.text("Extras (empresa):", lm, y); nl(5);
      doc.setFont("helvetica", "normal");
      extrasEmpresa.forEach(e => {
        const lines = doc.splitTextToSize(`  + ${e.concept}:`, 150);
        lines.forEach((l, idx) => { doc.text(l, lm, y); if (idx < lines.length - 1) nl(5); });
        doc.text(`$${parseFloat(e.amount || 0).toFixed(2)}`, 195, y, { align: "right" }); nl(6);
      });
    }

    if (extrasDelPasajero.length > 0) {
      doc.setFont("helvetica", "bold"); doc.setTextColor(150, 80, 0);
      doc.text("Extras (pagados por el pasajero):", lm, y); nl(5);
      doc.setFont("helvetica", "normal");
      extrasDelPasajero.forEach(e => {
        const lines = doc.splitTextToSize(`  + ${e.concept} [PASAJERO]:`, 150);
        lines.forEach((l, idx) => { doc.text(l, lm, y); if (idx < lines.length - 1) nl(5); });
        doc.text(`$${parseFloat(e.amount || 0).toFixed(2)}`, 195, y, { align: "right" }); nl(6);
      });
      doc.setTextColor(0);
    }

    doc.setLineWidth(0.2); doc.line(lm, y, 195, y); nl(5);
    doc.setFont("helvetica", "bold");

    if (paidByPassenger) {
      const companyTotal = billingBase + extrasEmpresaTotal;
      doc.text("Total empresa:", lm, y); doc.text(`$${companyTotal.toFixed(2)}`, 195, y, { align: "right" }); nl(6);
      doc.setFont("helvetica", "normal"); doc.setTextColor(150, 80, 0);
      doc.text(`Monto excedente pagado por el pasajero: $${extrasDelPasajeroTotal.toFixed(2)}`, lm, y); nl(6);
      doc.setTextColor(0);
    } else {
      const grandTotal = billingBase + extrasEmpresaTotal;
      doc.text("TOTAL A FACTURAR A LA EMPRESA:", lm, y); doc.text(`$${grandTotal.toFixed(2)}`, 195, y, { align: "right" }); nl(7);
    }
    doc.setFont("helvetica", "normal");
    doc.text(`Método de pago: ${paymentLabels[ride.payment_method] || ride.payment_method || "-"}`, lm, y); nl(6);

  } else {
    // ── TICKET PASAJERO: solo total (sin comisiones ni ganancia del conductor) ──
    doc.text(`Servicio:`, lm, y); doc.text(`$${basePrice.toFixed(2)}`, 195, y, { align: "right" }); nl(6);
    if (extras.length > 0) {
      doc.setFont("helvetica", "bold"); doc.text(`Extras:`, lm, y); doc.text(`$${totalExtras.toFixed(2)}`, 195, y, { align: "right" }); nl(5);
      doc.setFont("helvetica", "normal");
      extras.forEach(e => {
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text(`  · ${e.concept}:`, lm + 3, y); doc.text(`$${parseFloat(e.amount || 0).toFixed(2)}`, 195, y, { align: "right" }); nl(5);
        doc.setFontSize(10); doc.setTextColor(0);
      });
    }
    doc.setLineWidth(0.2); doc.line(lm, y, 195, y); nl(5);
    doc.setFont("helvetica", "bold");
    doc.text("Total a pagar:", lm, y); doc.text(`$${finalPrice.toFixed(2)}`, 195, y, { align: "right" }); nl(6);
    doc.setFont("helvetica", "normal");
    doc.text(`Método de pago: ${paymentLabels[ride.payment_method] || ride.payment_method || "-"}`, lm, y); nl(6);
  }

  nl(3); line();
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text("Documento generado automáticamente.", 105, y, { align: "center" });

  const typeLabel = type === "driver" ? "conductor" : type === "company" ? "empresa" : "pasajero";
  const filename = `ticket-${typeLabel}-${ride.service_id || ride.id?.slice(-8)}.pdf`;
  doc.save(filename);
  toast.success(`Ticket ${typeLabel} descargado`);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RideDetailDialog({ ride, open, onOpenChange, onAssign }) {
  const { settings } = useAppSettings();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [companyTicketPrice, setCompanyTicketPrice] = useState(null);
  const [editingCompanyPrice, setEditingCompanyPrice] = useState(false);

  useEffect(() => { setCompanyTicketPrice(null); setEditingCompanyPrice(false); }, [ride?.id]);

  if (!ride) return null;
  const isActiveRide = ride && !["completed", "cancelled"].includes(ride.status) && ride.driver_id;
  const { basePrice, totalExtras, extrasForDriver, extrasWithCommission, finalPrice, driverEarnings, commission, commissionRate } = calcTotals(ride);
  const extras = Array.isArray(ride.extra_charges) ? ride.extra_charges : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-size-3xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1">
            <FileText className="w-5 h-5" />
            Detalle del servicio
            <Badge className="ml-auto text-xs" variant="outline">#{ride.service_id || ride.id?.slice(-8).toUpperCase()}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-0.5 py-0.5">
          {/* Status + date */}
          <div className="flex items-center justify-between">
            <StatusBadge status={ride.status} />
            <div className="text-right">
              <span className="text-xs text-slate-400 block">
                {formatCDMX(ride.requested_at || ride.created_date, "datetime")}
              </span>
              {ride.service_id && (
                <span className="text-[10px] text-slate-300 font-mono">{ride.service_id}</span>
              )}
            </div>
          </div>

          {/* Passenger */}
          <div className="bg-slate-50 rounded-lg p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pasajero</p>
            <div className="flex items-center gap-1 text-xs"><User className="w-4 h-4 text-slate-400" /><span className="font-medium">{ride.passenger_name}</span></div>
            {ride.passenger_phone && <div className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-4 h-4 text-slate-400" />{ride.passenger_phone}</div>}
            {ride.company_name && <div className="flex items-center gap-1 text-xs text-blue-600"><Building2 className="w-4 h-4" />{ride.company_name} <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200">Corporativo</Badge></div>}
          </div>

          {/* Assign button for rides without driver (manual mode or unassigned) */}
          {!ride.driver_id && !['completed','cancelled'].includes(ride.status) && onAssign && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between gap-1">
              <div>
                <p className="text-xs font-semibold text-amber-800">Sin conductor asignado</p>
                <p className="text-xs text-amber-600 mt-0.5">Asigna un conductor manualmente o por geocerca</p>
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 rounded-lg text-xs flex-shrink-0"
                onClick={() => { onOpenChange(false); setTimeout(() => onAssign(ride), 100); }}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Asignar conductor
              </Button>
            </div>
          )}

          {/* Live map for active rides */}
          {isActiveRide && <RideLiveMap ride={ride} settings={settings} />}
          {!isActiveRide && ride.pickup_lat && <RideRouteMap ride={ride} />}

          {/* Route */}
          <div className="bg-slate-50 rounded-lg p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ruta</p>
            <div className="flex items-start gap-1 text-xs"><MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /><span>{ride.pickup_address}</span></div>
            {ride.dropoff_address && <div className="flex items-start gap-1 text-xs"><MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /><span>{ride.dropoff_address}</span></div>}
            <div className="flex gap-1 text-xs text-slate-400 pt-1">
              {ride.distance_km && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{ride.distance_km} km</span>}
              {ride.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ride.duration_minutes} min</span>}
              {ride.geo_zone_name && <span className="flex items-center gap-1 text-emerald-600"><Layers className="w-3 h-3" />{ride.geo_zone_name}</span>}
            </div>
          </div>

          {/* Driver + service */}
          <div className="bg-slate-50 rounded-lg p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Conductor y servicio</p>
            {ride.driver_name ? <div className="flex items-center gap-1 text-xs"><Car className="w-4 h-4 text-slate-400" /><span className="font-medium">{ride.driver_name}</span></div> : <span className="text-xs text-slate-400">Sin conductor asignado</span>}
            {ride.service_type_name && <div className="flex items-center gap-1 text-xs text-slate-500"><span className="text-slate-400">Tipo:</span>{ride.service_type_name}</div>}
            {ride.city_name && <div className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3.5 h-3.5 text-slate-400" />{ride.city_name}</div>}
            {ride.admin_rating && <div className="flex items-center gap-1 text-xs text-amber-600"><Star className="w-3.5 h-3.5 fill-amber-400" />Calificación: {ride.admin_rating}/5 {ride.admin_rating_comment && `· "${ride.admin_rating_comment}"`}</div>}
          </div>

          {/* Payment breakdown */}
          <div className="bg-slate-50 rounded-lg p-2 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cobro y pago</p>
              <button onClick={() => setShowBreakdown(v => !v)} className="text-xs text-blue-500 flex items-center gap-1">
                {showBreakdown ? <><ChevronUp className="w-3 h-3" /> Ocultar</>  : <><ChevronDown className="w-3 h-3" /> Desglose</>}
              </button>
            </div>
            <div className="flex justify-between text-xs"><span className="text-slate-500 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />Método</span><span className="font-medium">{paymentLabels[ride.payment_method] || ride.payment_method || "-"}</span></div>

            {ride.company_name && ride.company_price ? (
              <>
                <div className="flex justify-between text-xs text-blue-700 font-semibold">
                  <span>💼 Costo empresa (facturación)</span><span>${ride.company_price}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>🚗 Precio base (conductor)</span><span className="font-semibold">${basePrice.toFixed(2)}</span>
                </div>
                {totalExtras > 0 && (
                  <div className="flex justify-between text-xs text-amber-700">
                    <span>+ Extras</span><span>+${totalExtras.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-2">
                  <span>Precio final</span><span className="text-emerald-600">${finalPrice.toFixed(2)}</span>
                </div>
                {ride.paid_by === "passenger" && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">👤 Pagado por el pasajero — no se carga a la empresa</p>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Precio base</span><span>${basePrice.toFixed(2)}</span></div>
                {extras.length > 0 && (
                  <div className="flex justify-between text-xs text-amber-700"><span>Extras</span><span>+${totalExtras.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-xs font-semibold border-t border-slate-200 pt-2"><span>Total</span><span className="text-emerald-600">${finalPrice.toFixed(2)}</span></div>
              </>
            )}

            {showBreakdown && (
              <div className="mt-2 bg-white border border-slate-200 rounded-lg p-2 space-y-1 text-xs">
                <p className="font-semibold text-slate-600 mb-1">Desglose completo</p>
                <div className="flex justify-between text-slate-600"><span>Precio base:</span><span>${basePrice.toFixed(2)}</span></div>
                {extras.length > 0 && (
                  <>
                    <div className="font-medium text-slate-700 mt-1">Extras ({extras.length}):</div>
                    {extras.map((e, i) => (
                      <div key={i} className={`flex justify-between pl-2 ${e.paid_to_driver ? "text-blue-700" : "text-slate-500"}`}>
                        <span>{e.concept} {e.paid_to_driver ? "(→ conductor, sin comisión)" : "(con comisión)"}</span>
                        <span>+${parseFloat(e.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                {totalExtras > 0 && <div className="flex justify-between font-bold text-emerald-700 border-t pt-1"><span>Precio final:</span><span>${finalPrice.toFixed(2)}</span></div>}
                <div className="border-t pt-1 space-y-1">
                  <div className="flex justify-between text-violet-600"><span>Comisión plataforma ({commissionRate}%):</span><span>-${commission.toFixed(2)}</span></div>
                  {extrasForDriver > 0 && <div className="flex justify-between text-blue-500 text-[10px]"><span>  (extras al conductor sin comisión: +${extrasForDriver.toFixed(2)})</span></div>}
                  <div className="flex justify-between text-blue-700 font-semibold"><span>Ganancia conductor:</span><span>${driverEarnings.toFixed(2)}</span></div>
                </div>
              </div>
            )}

            {ride.cancellation_fee > 0 && <div className="flex justify-between text-xs text-red-500"><span>Cargo cancelación</span><span>${ride.cancellation_fee}</span></div>}
          </div>

          {/* Proceso del servicio */}
          {(() => {
            // Hora de solicitud: requested_at es guardado como hora local (no UTC real), usar formatCDMX directo
            const solicitudTs = ride.requested_at || ride.created_at;
            // Los demás timestamps (en_route_at, in_progress_at, completed_at) son UTC reales → formatCDMX correcto
            const steps = [
              { label: "Solicitud", ts: solicitudTs, icon: "📨" },
              { label: "Asignación / Aceptación", ts: ride.en_route_at ? null : (ride.driver_id && ride.assigned_at ? ride.assigned_at : null), icon: "📋", hide: true },
              { label: "Conductor en camino", ts: ride.en_route_at, icon: "🚗" },
              { label: "Inicio del servicio", ts: ride.in_progress_at, icon: "▶️" },
              { label: "Finalización", ts: ride.completed_at, icon: "✅" },
              { label: "Cancelación", ts: ride.status === "cancelled" ? ride.updated_at : null, icon: "❌" },
            ].filter(s => s.ts && !s.hide);
            if (steps.length === 0) return null;
            return (
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Proceso del servicio</p>
                <div className="space-y-1">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-base w-5 text-center">{s.icon}</span>
                      <div className="flex-1"><p className="text-xs font-medium text-slate-700">{s.label}</p></div>
                      <p className="text-xs text-slate-400 font-mono">{formatCDMX(s.ts, "datetime")}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Cost indicator based on ride status */}
          {(() => {
            if (ride.status === "cancelled") {
              return (
                <div className={`rounded-lg p-2 text-xs ${ride.cancellation_fee > 0 ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                  ❌ {ride.cancellation_fee > 0 ? `Cancelado con cargo: $${ride.cancellation_fee.toFixed(2)}` : "Cancelado sin costo"}
                </div>
              );
            }
            if (ride.status === "completed") {
              return (
                <div className="bg-emerald-50 rounded-lg p-2 text-xs text-emerald-700">
                  ✅ Costo final: ${(ride.final_price ?? ride.estimated_price ?? 0).toFixed(2)}
                </div>
              );
            }
            // Active rides show estimated price
            return (
              <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
                💰 Precio estimado: ${(ride.estimated_price ?? 0).toFixed(2)}
              </div>
            );
          })()}

          {ride.notes && <div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-700">📝 {ride.notes}</div>}
          {ride.cancellation_reason && <div className="bg-red-50 rounded-lg p-2 text-xs text-red-600">❌ Cancelado por {ride.cancelled_by}: {ride.cancellation_reason}</div>}
          {ride.proof_photo_url && <a href={ride.proof_photo_url} target="_blank" rel="noreferrer" className="block"><img src={ride.proof_photo_url} alt="Foto de servicio" className="w-full rounded-lg object-cover max-h-40" /></a>}

          {/* Chat Widget */}
          <ChatWidget ride={ride} />
        </div>

        {/* Actions: two tickets */}
        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generar tickets</p>
          <div className="grid grid-cols-2 gap-1">
            <Button variant="outline" className="rounded-lg text-xs flex items-center gap-1.5" onClick={() => generateTicketPDF(ride, "driver", null)}>
              🚗 Ticket conductor
            </Button>
            <Button variant="outline" className="rounded-lg text-xs flex items-center gap-1.5" onClick={() => generateTicketPDF(ride, "passenger", null)}>
              👤 Ticket pasajero
            </Button>
          </div>
          {ride.company_name && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 space-y-1">
              <p className="text-xs font-semibold text-blue-700">💼 Ticket empresa (facturación)</p>
              <p className="text-xs text-blue-500">Puedes ajustar el costo empresa para este ticket sin afectar el ticket del conductor.</p>
              {editingCompanyPrice ? (
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={companyTicketPrice ?? ride.company_price ?? basePrice}
                    onChange={e => setCompanyTicketPrice(parseFloat(e.target.value) || 0)}
                    className="flex-1 h-8 rounded-lg border border-blue-300 text-xs px-2"
                    placeholder="Precio empresa"
                  />
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => setEditingCompanyPrice(false)}>
                    Listo
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-blue-800">
                    ${(companyTicketPrice ?? ride.company_price ?? basePrice).toFixed(2)}
                  </span>
                  <button onClick={() => setEditingCompanyPrice(true)} className="text-xs text-blue-500 underline">
                    Editar costo empresa
                  </button>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full rounded-lg text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => generateTicketPDF(ride, "company", companyTicketPrice)}
              >
                📄 Generar ticket empresa
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

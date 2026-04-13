"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/admin/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, AlertTriangle, UserCheck, ChevronRight, Wifi, CalendarClock, Calendar, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardStats from "@/components/admin/DashboardStats";
import RideTable from "@/components/admin/RideTable";
import AssignDriverDialog from "@/components/admin/AssignDriverDialog";
import CreateRideDialog from "@/components/admin/CreateRideDialog";
import CancelRideDialog from "@/components/admin/CancelRideDialog";
import ETAModal from "@/components/admin/ETAModal";
import useAppSettings from "@/components/shared/useAppSettings";
import { todayCDMX, startOfDayCDMX, endOfDayCDMX, formatCDMX } from "@/components/shared/dateUtils";
import { useAdminNotifications, requestNotificationPermission } from "@/components/shared/useRideNotifications";
import { useAdminSession } from "@/components/shared/useAdminSession";

export default function Dashboard() {
  return (
    <Layout currentPageName="Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-2">Bienvenido al panel de control de YAJA Asistencia</p>
        </div>
        
        {/* Placeholder - Stats will be implemented */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Viajes Hoy</div>
            <div className="text-2xl font-bold mt-1">--</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Ingresos</div>
            <div className="text-2xl font-bold mt-1">$--</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Conductores Activos</div>
            <div className="text-2xl font-bold mt-1">--</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Satisfacción</div>
            <div className="text-2xl font-bold mt-1">--%</div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Últimos Viajes</h2>
          <p className="text-slate-500">Los viajes se cargarán aquí cuando los datos estén disponibles en Supabase</p>
        </div>
      </div>
    </Layout>
  );
}

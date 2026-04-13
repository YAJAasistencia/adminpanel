"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import Layout from "@/components/admin/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, MessageSquare, Alert } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardStats from "@/components/admin/DashboardStats";
import RideTable from "@/components/admin/RideTable";
import AssignDriverDialog from "@/components/admin/AssignDriverDialog";
import CreateRideDialog from "@/components/admin/CreateRideDialog";
import useAppSettings from "@/components/shared/useAppSettings";
import { todayCDMX } from "@/components/shared/dateUtils";

export default function Dashboard() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayCDMX());
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);

  // Fetch rides
  const { data: rides = [] } = useQuery({
    queryKey: ["rides"],
    queryFn: async () => {
      try {
        return await supabaseApi.rideRequests.list();
      } catch (error) {
        console.error("Error loading rides:", error);
        return [];
      }
    },
    staleTime: 30000,
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      try {
        return await supabaseApi.drivers.list();
      } catch (error) {
        console.error("Error loading drivers:", error);
        return [];
      }
    },
    staleTime: 30000,
  });

  // Fetch pending tickets count
  const { data: ticketsCount = 0 } = useQuery({
    queryKey: ["ticketsCount"],
    queryFn: async () => {
      try {
        const tickets = await supabaseApi.supportTickets.list() || [];
        return tickets.filter(t => t.status === "open").length;
      } catch {
        return 0;
      }
    },
    staleTime: 30000,
  });

  // Fetch unread chats count
  const { data: chatsCount = 0 } = useQuery({
    queryKey: ["chatsCount"],
    queryFn: async () => {
      try {
        const chats = await supabaseApi.chats.list() || [];
        return chats.filter(c => c.unread).length;
      } catch {
        return 0;
      }
    },
    staleTime: 30000,
  });

  // Fetch SOS alerts
  const { data: sosAlerts = [] } = useQuery({
    queryKey: ["sosAlerts"],
    queryFn: async () => {
      try {
        return await supabaseApi.sosAlerts.list() || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  const pendingRides = rides.filter(r => r.status === "pending" || r.status === "auction");

  return (
    <Layout currentPageName="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Panel de control en tiempo real</p>
          </div>
          <Button 
            onClick={() => setShowCreateRide(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Crear Viaje
          </Button>
        </div>

        {/* Quick Stats */}
        <DashboardStats rides={rides} drivers={drivers} selectedDate={selectedDate} />

        {/* Alert Banners */}
        {sosAlerts.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <Alert className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">⚠️ {sosAlerts.length} Alerta SOS Activa</h3>
              <p className="text-sm text-red-700">Requiere atención inmediata</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/sos-alerts')}
              className="ml-auto"
            >
              Ver
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/live-drivers')}
            className="h-auto flex-col gap-2 py-4"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-sm">Conductores</span>
            <span className="text-xs text-slate-500">{drivers.length} total</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/support-tickets')}
            className="h-auto flex-col gap-2 py-4"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Tickets</span>
            <span className={`text-xs ${ticketsCount > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{ticketsCount} abiertos</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/chats')}
            className="h-auto flex-col gap-2 py-4"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Mensajes</span>
            <span className={`text-xs ${chatsCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>{chatsCount} sin leer</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/sos-alerts')}
            className="h-auto flex-col gap-2 py-4"
          >
            <Alert className="w-5 h-5" />
            <span className="text-sm">SOS</span>
            <span className={`text-xs ${sosAlerts.length > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{sosAlerts.length} activas</span>
          </Button>
        </div>

        {/* Pending Rides */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Viajes Pendientes ({pendingRides.length})
            </h2>
            {pendingRides.length > 0 && (
              <Button 
                size="sm"
                onClick={() => setShowAssignDriver(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Asignar
              </Button>
            )}
          </div>

          {pendingRides.length > 0 ? (
            <RideTable 
              rides={pendingRides} 
              drivers={drivers}
              onSelectRide={(ride) => {
                setSelectedRide(ride);
                setShowAssignDriver(true);
              }}
            />
          ) : (
            <div className="p-8 bg-white rounded-lg border border-slate-200 text-center">
              <p className="text-slate-500">✓ No hay viajes pendientes</p>
            </div>
          )}
        </div>

        {/* All Rides Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Todos los Viajes</h2>
          <RideTable 
            rides={rides.slice(0, 20)} 
            drivers={drivers}
            onSelectRide={(ride) => {
              setSelectedRide(ride);
            }}
          />
        </div>

        {/* Dialogs */}
        {showCreateRide && (
          <CreateRideDialog 
            onClose={() => setShowCreateRide(false)} 
          />
        )}

        {showAssignDriver && selectedRide && (
          <AssignDriverDialog 
            ride={selectedRide}
            drivers={drivers}
            onClose={() => {
              setShowAssignDriver(false);
              setSelectedRide(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

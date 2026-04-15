"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import Layout from "@/components/admin/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, MapPin, Pencil, Trash2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const empty = { name: "", state: "", country: "México", is_active: true, center_lat: "", center_lon: "", geofence_radius_km: 50 };

export default function CitiesPage() {
  const [editCity, setEditCity] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: () => supabaseApi.cities.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => supabaseApi.drivers.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getDriverCount = (cityId: string) => drivers.filter((d: any) => d.city_id === cityId).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...editCity,
        center_lat: editCity.center_lat ? parseFloat(editCity.center_lat) : undefined,
        center_lon: editCity.center_lon ? parseFloat(editCity.center_lon) : undefined,
      };
      if (editCity.id) {
        await supabaseApi.cities.update(editCity.id, data);
        toast.success("Ciudad actualizada");
      } else {
        await supabaseApi.cities.create(data);
        toast.success("Ciudad creada");
      }
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      setShowDialog(false);
      setEditCity(null);
    } catch (error) {
      toast.error("Error al guardar ciudad");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (city: any) => {
    try {
      await supabaseApi.cities.delete(city.id);
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Ciudad eliminada");
    } catch (error) {
      toast.error("Error al eliminar ciudad");
      console.error(error);
    }
  };

  const handleToggle = async (city: any) => {
    try {
      await supabaseApi.cities.update(city.id, { is_active: !city.is_active });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
    } catch (error) {
      toast.error("Error al actualizar ciudad");
      console.error(error);
    }
  };

  return (
    <Layout currentPageName="Cities">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ciudades</h1>
          <p className="text-sm text-slate-400 mt-0.5">{cities.length} ciudades registradas</p>
        </div>
        <Button onClick={() => { setEditCity({ ...empty }); setShowDialog(true); }} className="bg-slate-900 hover:bg-slate-800 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nueva ciudad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city: any) => (
          <Card key={city.id} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{city.name}</h3>
                  <p className="text-xs text-slate-400">{city.state && `${city.state}, `}{city.country}</p>
                </div>
              </div>
              <Switch checked={!!city.is_active} onCheckedChange={() => handleToggle(city)} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" /> {getDriverCount(city.id)} conductores
              </Badge>
              {city.center_lat && (
                <span className="text-xs text-slate-400">
                  {parseFloat(city.center_lat).toFixed(4)}, {parseFloat(city.center_lon).toFixed(4)}
                  {city.geofence_radius_km && ` · ${city.geofence_radius_km}km`}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" className="flex-1 text-xs rounded-lg" onClick={() => { setEditCity(city); setShowDialog(true); }}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(city)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {cities.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay ciudades registradas aún</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={v => { setShowDialog(v); if (!v) setEditCity(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCity?.id ? "Editar ciudad" : "Nueva ciudad"}</DialogTitle>
          </DialogHeader>
          {editCity && (
            <div className="space-y-4 py-2">
              <div><Label>Nombre de la ciudad *</Label><Input value={editCity.name} onChange={e => setEditCity((p: any) => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Estado / Provincia</Label><Input value={editCity.state || ""} onChange={e => setEditCity((p: any) => ({ ...p, state: e.target.value }))} /></div>
                <div><Label>País</Label><Input value={editCity.country || ""} onChange={e => setEditCity((p: any) => ({ ...p, country: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Latitud central</Label><Input type="number" placeholder="19.4326" value={editCity.center_lat || ""} onChange={e => setEditCity((p: any) => ({ ...p, center_lat: e.target.value }))} /></div>
                <div><Label>Longitud central</Label><Input type="number" placeholder="-99.1332" value={editCity.center_lon || ""} onChange={e => setEditCity((p: any) => ({ ...p, center_lon: e.target.value }))} /></div>
              </div>
              <div><Label>Radio geocerca (km)</Label><Input type="number" placeholder="50" value={editCity.geofence_radius_km || ""} onChange={e => setEditCity((p: any) => ({ ...p, geofence_radius_km: parseFloat(e.target.value) || 50 }))} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={!!editCity.is_active} onCheckedChange={v => setEditCity((p: any) => ({ ...p, is_active: v }))} />
                <Label>Ciudad activa</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditCity(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !editCity?.name}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}

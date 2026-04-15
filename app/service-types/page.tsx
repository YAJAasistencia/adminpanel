"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/admin/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
	Plus, Pencil, Trash2, Car, Crown, Truck, Ambulance, Wrench,
	ShieldAlert, Zap, Bike, Star, Navigation,
	AlertTriangle, Cog, FolderOpen,
	ChevronDown, ChevronRight, Fuel, CircleDot, Battery, X, Upload, Image
} from "lucide-react";

const iconMap = {
	car: Car, crown: Crown, truck: Truck, ambulance: Ambulance, wrench: Wrench,
	shield: ShieldAlert, zap: Zap, bike: Bike, star: Star,
	navigation: Navigation, alert: AlertTriangle, cog: Cog,
	fuel: Fuel, tire: CircleDot, battery: Battery,
};

const iconOptions = [
	{ value: "car", label: "🚗 Taxi / Auto" },
	{ value: "crown", label: "👑 Premium / VIP" },
	{ value: "truck", label: "🚛 Grúa / Remolque" },
	{ value: "alert", label: "⚠️ Grúa de emergencia" },
	{ value: "bike", label: "🏍️ Moto" },
	{ value: "fuel", label: "⛽ Gasolina" },
	{ value: "tire", label: "🔵 Cambio de llanta" },
	{ value: "battery", label: "🔋 Paso de corriente" },
	{ value: "wrench", label: "🔧 Asistencia vial" },
	{ value: "cog", label: "⚙️ Mecánico en ruta" },
	{ value: "zap", label: "⚡ Servicio eléctrico" },
	{ value: "ambulance", label: "🚑 Ambulancia" },
	{ value: "shield", label: "🛡️ Seguridad vial" },
	{ value: "navigation", label: "🧭 Transporte especial" },
	{ value: "star", label: "⭐ Ejecutivo" },
];

const emptyService = {
	name: "", category: "", description: "", icon: "car", icon_url: "", base_price: "", price_per_km: "",
	price_per_minute: "", minimum_fare: "", surge_multiplier: 1, max_passengers: 4,
	is_active: true, pay_full_to_driver: false, color: "#3B82F6", custom_fields: [], service_extras: [],
};

const emptyField = { key: "", label: "", type: "text", options: [], required: false, placeholder: "" };

export default function ServiceTypes() {
	const [editService, setEditService] = useState(null);
	const [showDialog, setShowDialog] = useState(false);
	const [saving, setSaving] = useState(false);
	const [iconUploading, setIconUploading] = useState(false);
	const [collapsedCategories, setCollapsedCategories] = useState({});
	const [editingCat, setEditingCat] = useState(null); // { oldName, newName }
	const [catSaving, setCatSaving] = useState(false);
	const queryClient = useQueryClient();

	const { data: services = [] } = useQuery({
		queryKey: ["serviceTypes"],
		queryFn: () => supabaseApi.serviceTypes.list(),
	});

	const grouped = useMemo(() => {
		const map = {};
		services.forEach(s => {
			const cat = s.category?.trim() || "Sin categoría";
			if (!map[cat]) map[cat] = [];
			map[cat].push(s);
		});
		return map;
	}, [services]);

	const categories = Object.keys(grouped);

	const handleIconUpload = async (file) => {
		if (!file) return;
		setIconUploading(true);
		const { file_url } = await supabaseApi.uploads.uploadFile({ file });
		update("icon_url", file_url);
		setIconUploading(false);
	};

	const handleSave = async () => {
		setSaving(true);
		const data = {
			...editService,
			base_price: parseFloat(editService.base_price) || 0,
			price_per_km: parseFloat(editService.price_per_km) || 0,
			price_per_minute: parseFloat(editService.price_per_minute) || 0,
			minimum_fare: parseFloat(editService.minimum_fare) || 0,
			surge_multiplier: parseFloat(editService.surge_multiplier) || 1,
			max_passengers: parseInt(editService.max_passengers) || 4,
		};
		if (editService.id) {
			await supabaseApi.serviceTypes.update(editService.id, data);
		} else {
			await supabaseApi.serviceTypes.create(data);
		}
		queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
		setSaving(false);
		setShowDialog(false);
		setEditService(null);
	};

	const handleRenameCategory = async () => {
		if (!editingCat?.newName?.trim()) return;
		setCatSaving(true);
		const toRename = services.filter(s => (s.category?.trim() || "Sin categoría") === editingCat.oldName);
		await Promise.all(toRename.map(s => supabaseApi.serviceTypes.update(s.id, { category: editingCat.newName.trim() })));
		queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
		setCatSaving(false);
		setEditingCat(null);
	};

	const handleDelete = async (s) => {
		if (!confirm(`¿Eliminar "${s.name}"?`)) return;
		await supabaseApi.serviceTypes.delete(s.id);
		queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
	};

	const update = (field, value) => setEditService(prev => ({ ...prev, [field]: value }));
	const toggleCategory = (cat) => setCollapsedCategories(p => ({ ...p, [cat]: !p[cat] }));

	const openNew = (cat = "") => {
		setEditService({ ...emptyService, category: cat });
		setShowDialog(true);
	};

	return (
		<Layout currentPageName="Service Types">
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Tipos de Servicio</h1>
					<p className="text-sm text-slate-400 mt-0.5">Gestión de categorías y precios</p>
				</div>

				{categories.map(cat => (
					<Card key={cat} className="border-0 shadow-sm overflow-hidden">
						<div
							onClick={() => toggleCategory(cat)}
							className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
						>
							<div className="flex items-center gap-2">
								{collapsedCategories[cat] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
								<h2 className="font-semibold text-slate-900">{cat}</h2>
								<span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">{grouped[cat].length}</span>
							</div>
							<Button size="sm" variant="outline" className="rounded-lg text-xs h-8" onClick={(e) => { e.stopPropagation(); setEditingCat({ oldName: cat, newName: cat }); }}>
								Renombrar
							</Button>
						</div>

						{!collapsedCategories[cat] && (
							<div className="p-4 space-y-3">
								{grouped[cat].map(s => {
									const Icon = iconMap[s.icon] || Car;
									return (
										<div key={s.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between hover:shadow-sm transition-all">
											<div className="flex gap-3 flex-1">
												<div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + '20' }}>
													<Icon className="w-5 h-5" style={{ color: s.color }} />
												</div>
												<div className="flex-1">
													<p className="font-semibold text-slate-900">{s.name}</p>
													<p className="text-xs text-slate-500 mt-0.5">{s.description || 'Sin descripción'}</p>
													<div className="flex gap-2 mt-2">
														<span className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-1">${s.base_price.toFixed(2)} base</span>
														<span className="text-xs bg-slate-50 text-slate-600 rounded px-2 py-1">${s.price_per_km.toFixed(2)}/km</span>
														{!s.is_active && <span className="text-xs bg-red-50 text-red-700 rounded px-2 py-1">Inactivo</span>}
													</div>
												</div>
											</div>
											<div className="flex gap-2">
												<Button size="sm" variant="outline" className="rounded-lg text-xs h-8" onClick={() => { setEditService(s); setShowDialog(true); }}>
													<Pencil className="w-3 h-3" />
												</Button>
												<Button size="sm" variant="outline" className="rounded-lg text-xs h-8 text-red-600" onClick={() => handleDelete(s)}>
													<Trash2 className="w-3 h-3" />
												</Button>
											</div>
										</div>
									);
								})}
								<Button size="sm" className="w-full rounded-lg text-xs h-9" onClick={() => openNew(cat)}>
									<Plus className="w-3 h-3 mr-1" /> Agregar servicio
								</Button>
							</div>
						)}
					</Card>
				))}

				<Button className="w-full rounded-lg h-10" onClick={() => openNew()}>
					<Plus className="w-4 h-4 mr-2" /> Nueva categoría
				</Button>

				{/* Edit Dialog */}
				<Dialog open={showDialog} onOpenChange={setShowDialog}>
					<DialogContent className="max-w-2xl rounded-2xl">
						<DialogHeader>
							<DialogTitle>{editService?.id ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
						</DialogHeader>

						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-xs font-medium mb-1.5 block">Nombre</Label>
									<Input
										placeholder="Taxi / Ejecutivo / Grúa..."
										value={editService?.name || ''}
										onChange={(e) => update('name', e.target.value)}
										className="rounded-xl text-sm h-9"
									/>
								</div>
								<div>
									<Label className="text-xs font-medium mb-1.5 block">Categoría</Label>
									<Input
										placeholder="Transporte / Emergencia..."
										value={editService?.category || ''}
										onChange={(e) => update('category', e.target.value)}
										className="rounded-xl text-sm h-9"
									/>
								</div>
							</div>

							<div>
								<Label className="text-xs font-medium mb-1.5 block">Descripción</Label>
								<Input
									placeholder="Descripción del servicio..."
									value={editService?.description || ''}
									onChange={(e) => update('description', e.target.value)}
									className="rounded-xl text-sm h-9"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-xs font-medium mb-1.5 block">Precio base ($)</Label>
									<Input
										type="number"
										value={editService?.base_price || 0}
										onChange={(e) => update('base_price', e.target.value)}
										className="rounded-xl text-sm h-9"
										min={0}
										step={0.01}
									/>
								</div>
								<div>
									<Label className="text-xs font-medium mb-1.5 block">Precio por km ($)</Label>
									<Input
										type="number"
										value={editService?.price_per_km || 0}
										onChange={(e) => update('price_per_km', e.target.value)}
										className="rounded-xl text-sm h-9"
										min={0}
										step={0.01}
									/>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex-1">
									<Label className="text-xs font-medium mb-1.5 block">Color</Label>
									<Input
										type="color"
										value={editService?.color || '#3B82F6'}
										onChange={(e) => update('color', e.target.value)}
										className="rounded-xl text-sm h-9"
									/>
								</div>
								<div className="flex-1">
									<Label className="text-xs font-medium mb-1.5 block flex items-center gap-2">
										Activo
										<Switch checked={editService?.is_active} onCheckedChange={(v) => update('is_active', v)} />
									</Label>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" className="rounded-lg" onClick={() => setShowDialog(false)}>
								Cancelar
							</Button>
							<Button className="rounded-lg" onClick={handleSave} disabled={saving}>
								{saving ? 'Guardando...' : 'Guardar'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Rename Dialog */}
				<Dialog open={!!editingCat} onOpenChange={(open) => !open && setEditingCat(null)}>
					<DialogContent className="rounded-2xl">
						<DialogHeader>
							<DialogTitle>Renombrar categoría</DialogTitle>
						</DialogHeader>
						<div>
							<Label className="text-xs font-medium mb-1.5 block">Nuevo nombre</Label>
							<Input
								value={editingCat?.newName || ''}
								onChange={(e) => setEditingCat({ ...editingCat, newName: e.target.value })}
								className="rounded-xl text-sm h-9"
								placeholder="Nuevo nombre..."
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" className="rounded-lg" onClick={() => setEditingCat(null)}>
								Cancelar
							</Button>
							<Button className="rounded-lg" onClick={handleRenameCategory} disabled={catSaving}>
								{catSaving ? 'Guardando...' : 'Guardar'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</Layout>
	);
}

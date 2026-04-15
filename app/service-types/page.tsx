"use client";

import React, { useState, useMemo } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
		...existing code...
	);
}

"use client";

import React, { useState } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import moment from "moment";
import { formatCDMX } from "@/components/shared/dateUtils";
import { TrendingUp, DollarSign, Car, Users, Receipt } from "lucide-react";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

export default function Earnings() {
  const [filterMode, setFilterMode] = useState("days");
  const [daysCount, setDaysCount] = useState(1);
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [ivaPct, setIvaPct] = useState(16);
  const [isrPct, setIsrPct] = useState(10);
  const [driverFilter, setDriverFilter] = useState("all");

  const { data: rides = [] } = useQuery({
    queryKey: ["rides"],
    queryFn: () => supabaseApi.rideRequests.list("-created_date", 500),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => supabaseApi.drivers.list(),
  });

  const since = filterMode === "days"
    ? moment().subtract(Math.max(1, daysCount), "days").startOf("day")
    : moment(dateFrom).startOf("day");
  const until = filterMode === "range" ? moment(dateTo).endOf("day") : null;
  const filtered = rides.filter(r => {
    if (r.status !== "completed") return false;
    const d = moment(r.created_date);
    if (!d.isAfter(since)) return false;
    if (until && d.isAfter(until)) return false;
    return true;
  });

  // Daily earnings (admin sees full price)
  const dailyMap = {};
  filtered.forEach(r => {
    const day = formatCDMX(r.created_date, "daymonth");
    dailyMap[day] = (dailyMap[day] || 0) + (r.final_price || r.estimated_price || 0);
  });
  const dailyData = Object.entries(dailyMap)
    .slice(-14)
    .map(([date, total]) => ({ date, total: parseFloat(total.toFixed(0)) }));

  // By service
  const serviceMap = {};
  filtered.forEach(r => {
    const s = r.service_type_name || "Sin servicio";
    if (!serviceMap[s]) serviceMap[s] = { name: s, total: 0, count: 0 };
    serviceMap[s].total += (r.final_price || r.estimated_price || 0);
    serviceMap[s].count += 1;
  });
  const serviceData = Object.values(serviceMap);

  // By payment method
  const payMap = {};
  filtered.forEach(r => {
    const m = r.payment_method || "cash";
    payMap[m] = (payMap[m] || 0) + (r.final_price || r.estimated_price || 0);
  });
  const payLabels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia" };
  const payData = Object.entries(payMap).map(([k, v]) => ({ name: payLabels[k] || k, value: parseFloat(v.toFixed(0)) }));

  // By driver — filterable
  const driverFilteredRides = driverFilter === "all" ? filtered : filtered.filter(r => r.driver_name === driverFilter);
  const driverMap = {};
  filtered.forEach(r => {
    const d = r.driver_name || "Sin asignar";
    if (!driverMap[d]) driverMap[d] = { name: d, total: 0, driverPay: 0, commission: 0, net: 0, count: 0 };
    const price = r.final_price || r.estimated_price || 0;
    const driverPay = r.driver_earnings || 0;
    const commission = r.platform_commission || 0;
    driverMap[d].total += price;
    driverMap[d].driverPay += driverPay;
    driverMap[d].commission += commission;
    driverMap[d].net += commission; // platform net = commission
    driverMap[d].count += 1;
  });
  const driverData = Object.values(driverMap).sort((a, b) => b.total - a.total).slice(0, 5);
  const allDriverNames = [...new Set(filtered.map(r => r.driver_name).filter(Boolean))];

  const totalRevenue = driverFilteredRides.reduce((s, r) => s + (r.final_price || r.estimated_price || 0), 0);
  const totalDriverPay = driverFilteredRides.reduce((s, r) => s + (r.driver_earnings || 0), 0);
  const totalCommission = driverFilteredRides.reduce((s, r) => s + (r.platform_commission || 0), 0);
  const platformNetRevenue = totalCommission; // platform net = total commissions
  const avgRide = driverFilteredRides.length ? totalRevenue / driverFilteredRides.length : 0;
  const cancelledCount = rides.filter(r => {
    if (r.status !== "cancelled") return false;
    const d = moment(r.created_date);
    if (!d.isAfter(since)) return false;
    if (until && d.isAfter(until)) return false;
    return true;
  }).length;

  // Fiscal calculations on platform commission
  const ivaAmount = totalCommission * (ivaPct / 100);
  const isrAmount = totalCommission * (isrPct / 100);
  const netAfterTax = totalCommission - ivaAmount - isrAmount;

  return (
    ...existing code...
  );
}

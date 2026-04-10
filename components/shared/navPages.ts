import {
  LayoutDashboard, Users, Car, ShieldAlert, Settings, Menu, X,
  ChevronRight, Share2, TrendingUp, CreditCard, MapPin, MessageCircle,
  Siren, Scissors, UserCog, Layers, Building2, LogOut, MessageSquare,
  Wifi, ChevronDown, Lock, UserCheck, ClipboardList, FileText,
  Calendar, Bell, BarChart3, DollarSign, Map, AlertTriangle,
  CheckCircle, Clock, Phone, Mail, Globe, Zap, Target, PieChart
} from "lucide-react";

export interface NavPage {
  page: string;
  name: string;
  icon: any;
  live?: boolean;
  alert?: boolean;
}

export const ALL_PAGES: NavPage[] = [
  { page: "Dashboard", name: "Dashboard", icon: LayoutDashboard, live: true },
  { page: "Analytics", name: "Analytics", icon: BarChart3 },
  { page: "Users", name: "Usuarios", icon: Users },
  { page: "Drivers", name: "Conductores", icon: Car },
  { page: "Passengers", name: "Pasajeros", icon: UserCheck },
  { page: "LiveDrivers", name: "Conductores en vivo", icon: MapPin, live: true },
  { page: "Rides", name: "Viajes", icon: Map },
  { page: "Earnings", name: "Ganancias", icon: DollarSign },
  { page: "DriverEarnings", name: "Ganancias conductores", icon: TrendingUp },
  { page: "Payments", name: "Pagos", icon: CreditCard },
  { page: "Invoices", name: "Facturas", icon: FileText },
  { page: "SupportTickets", name: "Tickets soporte", icon: MessageSquare, alert: true },
  { page: "Chats", name: "Chats", icon: MessageCircle, alert: true },
  { page: "Notifications", name: "Notificaciones", icon: Bell },
  { page: "SosAlerts", name: "Alertas SOS", icon: Siren, alert: true },
  { page: "GeoZones", name: "Zonas geográficas", icon: MapPin },
  { page: "RedZones", name: "Zonas rojas", icon: AlertTriangle },
  { page: "Cities", name: "Ciudades", icon: Globe },
  { page: "ServiceTypes", name: "Tipos de servicio", icon: Zap },
  { page: "Companies", name: "Empresas", icon: Building2 },
  { page: "Settings", name: "Configuración", icon: Settings },
  { page: "Surveys", name: "Encuestas", icon: ClipboardList },
  { page: "CancellationPolicies", name: "Políticas cancelación", icon: FileText },
  { page: "CashCutoff", name: "Corte de caja", icon: DollarSign },
  { page: "Liquidaciones", name: "Liquidaciones", icon: CheckCircle },
  { page: "Anuncios", name: "Anuncios", icon: Target },
  { page: "Bonos", name: "Bonos", icon: DollarSign },
  { page: "AdminUsers", name: "Usuarios admin", icon: UserCog },
  { page: "AdminLogin", name: "Login admin", icon: Lock },
  { page: "RoadAssistApp", name: "App pasajero", icon: Phone },
  { page: "DriverApp", name: "App conductor", icon: Car },
];

export const DEFAULT_NAV_CONFIG = [
  {
    label: "Principal",
    pages: ["Dashboard", "Analytics", "Users", "Drivers", "Passengers", "LiveDrivers"]
  },
  {
    label: "Operaciones",
    pages: ["Rides", "Earnings", "DriverEarnings", "Payments", "Invoices", "SupportTickets", "Chats", "Notifications", "SosAlerts"]
  },
  {
    label: "Configuración",
    pages: ["GeoZones", "RedZones", "Cities", "ServiceTypes", "Companies", "Settings", "Surveys", "CancellationPolicies", "CashCutoff", "Liquidaciones", "Anuncios", "Bonos"]
  },
  {
    label: "Sistema",
    pages: ["AdminUsers", "AdminLogin", "RoadAssistApp", "DriverApp"]
  }
];
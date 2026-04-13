import {
  LayoutDashboard,
  Users,
  Car,
  ShieldAlert,
  Settings,
  TrendingUp,
  CreditCard,
  MapPin,
  MessageCircle,
  Siren,
  Scissors,
  UserCog,
  Layers,
  Building2,
  MessageSquare,
  Wifi,
  UserCheck,
  ClipboardList,
  FileText,
  BellRing,
  Trophy,
  BarChart3,
  Megaphone,
  Lock,
  Phone,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavPage {
  page: string;
  name: string;
  icon: LucideIcon;
  live?: boolean;
  alert?: boolean;
}

export const ALL_PAGES: NavPage[] = [
  { name: "Panel de control", page: "Dashboard", icon: LayoutDashboard },
  { name: "Analíticas", page: "Analytics", icon: BarChart3 },
  { name: "EN VIVO", page: "LiveDrivers", icon: Wifi, live: true },
  { name: "Conductores", page: "Drivers", icon: Users },
  { name: "Clientes / Pasajeros", page: "Passengers", icon: UserCheck },
  { name: "Chats", page: "Chats", icon: MessageCircle },
  { name: "Alertas SOS", page: "SOSAlerts", icon: Siren, alert: true },
  { name: "Tickets de soporte", page: "SupportTickets", icon: MessageSquare },
  { name: "Notificaciones", page: "Notificaciones", icon: BellRing },
  { name: "Anuncios", page: "Anuncios", icon: Megaphone },
  { page: "DriverEarnings", name: "Ganancias conductores", icon: TrendingUp },
  { page: "Earnings", name: "Ganancias plataforma", icon: TrendingUp },
  { page: "CashCutoff", name: "Corte de caja", icon: Scissors },
  { page: "Liquidaciones", name: "Liquidaciones", icon: FileText },
  { page: "Invoices", name: "Facturación", icon: FileText },
  { page: "Bonos", name: "Bonos por desempeño", icon: Trophy },
  { page: "Cities", name: "Ciudades", icon: MapPin },
  { page: "ServiceTypes", name: "Tipos de servicio", icon: Car },
  { page: "CancellationPolicies", name: "Cancelaciones", icon: ShieldAlert },
  { page: "PaymentMethods", name: "Métodos de pago", icon: CreditCard },
  { page: "GeoZones", name: "Zonas tarifarias", icon: Layers },
  { page: "RedZones", name: "Zonas rojas", icon: ShieldAlert },
  { page: "Companies", name: "Empresas (B2B)", icon: Building2 },
  { page: "Surveys", name: "Encuestas", icon: ClipboardList },
  { page: "AdminUsers", name: "Usuarios admin", icon: UserCog },
  { page: "Settings", name: "Configuración", icon: Settings },
  { page: "AdminLogin", name: "Login admin", icon: Lock },
  { page: "RoadAssistAdmin", name: "Asistencia vial", icon: Phone },
  { page: "DriverApp", name: "App conductor", icon: Car },
];

export const DEFAULT_NAV_CONFIG = [
  {
    label: "Operaciones",
    pages: ["Dashboard", "Analytics", "LiveDrivers", "Drivers", "Passengers", "Chats", "SOSAlerts", "SupportTickets", "Notificaciones", "Anuncios"],
  },
  {
    label: "Finanzas",
    pages: ["DriverEarnings", "Earnings", "CashCutoff", "Liquidaciones", "Invoices", "Bonos"],
  },
  {
    label: "Configuración",
    pages: ["Cities", "ServiceTypes", "CancellationPolicies", "PaymentMethods", "GeoZones", "RedZones", "Companies", "Surveys", "AdminUsers", "Settings"],
  },
];
/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.tsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminLogin from './pages/AdminLogin';
import AdminUsers from './pages/AdminUsers';
import Bonos from './pages/Bonos';
import CancellationPolicies from './pages/CancellationPolicies';
import CashCutoff from './pages/CashCutoff';
import Chats from './pages/Chats';
import Cities from './pages/Cities';
import Companies from './pages/Companies';
import Dashboard from './pages/Dashboard';
import DriverApp from './pages/DriverApp';
import DriverEarnings from './pages/DriverEarnings';
import Drivers from './pages/Drivers';
import Earnings from './pages/Earnings';
import GeoZones from './pages/GeoZones';
import Invoices from './pages/Invoices';
import Liquidaciones from './pages/Liquidaciones';
import LiveDrivers from './pages/LiveDrivers';
import Notificaciones from './pages/Notificaciones';
import Passengers from './pages/Passengers';
import PaymentMethods from './pages/PaymentMethods';
import RedZones from './pages/RedZones';
import RoadAssistApp from './pages/RoadAssistApp';
import ServiceTypes from './pages/ServiceTypes';
import Settings from './pages/Settings';
import SosAlerts from './pages/SosAlerts';
import SupportTickets from './pages/SupportTickets';
import Surveys from './pages/Surveys';
import __Layout from './Layout.tsx';


export const PAGES = {
    "AdminLogin": AdminLogin,
    "AdminUsers": AdminUsers,
    "Bonos": Bonos,
    "CancellationPolicies": CancellationPolicies,
    "CashCutoff": CashCutoff,
    "Chats": Chats,
    "Cities": Cities,
    "Companies": Companies,
    "Dashboard": Dashboard,
    "DriverApp": DriverApp,
    "DriverEarnings": DriverEarnings,
    "Drivers": Drivers,
    "Earnings": Earnings,
    "GeoZones": GeoZones,
    "Invoices": Invoices,
    "Liquidaciones": Liquidaciones,
    "LiveDrivers": LiveDrivers,
    "Notificaciones": Notificaciones,
    "Passengers": Passengers,
    "PaymentMethods": PaymentMethods,
    "RedZones": RedZones,
    "RoadAssistApp": RoadAssistApp,
    "ServiceTypes": ServiceTypes,
    "Settings": Settings,
    "SosAlerts": SosAlerts,
    "SupportTickets": SupportTickets,
    "Surveys": Surveys,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};

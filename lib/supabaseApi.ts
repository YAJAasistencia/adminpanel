import { supabase } from "@/lib/supabase";

// ─── Supabase API Functions ──────────────────────────────────────────────────
// Tabla → nombre real en Supabase
// PascalCase (datos de Base44): Driver, RideRequest, City, RoadAssistUser,
//   ServiceType, Company, Invoice, BonusRule, BonusLog, GeoZone, RedZone,
//   SosAlert, SupportTicket, SurveyResponse, DriverNotification, AdminUser, AppSettings
// snake_case (sin equivalente PascalCase): announcements, cancellation_policies,
//   cash_cutoffs, chat_messages, liquidations, notifications, surveys

export const supabaseApi = {

  // ─── Cities ───────────────────────────────────────────────────────────────
  cities: {
    list: async () => {
      const { data, error } = await supabase.from('City').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('City').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (city: any) => {
      const { data, error } = await supabase.from('City').insert(city).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('City').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('City').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Drivers ──────────────────────────────────────────────────────────────
  drivers: {
    list: async (filters?: any) => {
      let query = supabase.from('Driver').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('Driver').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (driver: any) => {
      const { data, error } = await supabase.from('Driver').insert(driver).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('Driver').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('Driver').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Ride Requests ────────────────────────────────────────────────────────
  rideRequests: {
    list: async (filters?: any) => {
      let query = supabase.from('RideRequest').select('*').order('created_date', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('RideRequest').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (rideRequest: any) => {
      const { data, error } = await supabase.from('RideRequest').insert(rideRequest).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('RideRequest').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('RideRequest').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Geo Zones ────────────────────────────────────────────────────────────
  geoZones: {
    list: async () => {
      const { data, error } = await supabase.from('GeoZone').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('GeoZone').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (geoZone: any) => {
      const { data, error } = await supabase.from('GeoZone').insert(geoZone).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('GeoZone').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('GeoZone').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Support Tickets ──────────────────────────────────────────────────────
  supportTickets: {
    list: async (filters?: any) => {
      let query = supabase.from('SupportTicket').select('*').order('created_date', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('SupportTicket').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (ticket: any) => {
      const { data, error } = await supabase.from('SupportTicket').insert(ticket).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('SupportTicket').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('SupportTicket').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Chat Messages (snake_case — sin PascalCase) ──────────────────────────
  chats: {
    list: async (filters?: any) => {
      let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('chat_messages').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (chat: any) => {
      const { data, error } = await supabase.from('chat_messages').insert(chat).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('chat_messages').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('chat_messages').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── SOS Alerts ───────────────────────────────────────────────────────────
  sosAlerts: {
    list: async (filters?: any) => {
      let query = supabase.from('SosAlert').select('*').order('created_date', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('SosAlert').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (alert: any) => {
      const { data, error } = await supabase.from('SosAlert').insert(alert).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('SosAlert').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('SosAlert').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Settings (AppSettings) ───────────────────────────────────────────────
  settings: {
    list: async () => {
      const { data, error } = await supabase.from('AppSettings').select('*').order('created_date', { ascending: false }).limit(1);
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('AppSettings').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (setting: any) => {
      const { data, error } = await supabase.from('AppSettings').insert(setting).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('AppSettings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('AppSettings').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Passengers / Road Assist Users ──────────────────────────────────────
  passengers: {
    list: async () => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (passenger: any) => {
      const { data, error } = await supabase.from('RoadAssistUser').insert(passenger).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('RoadAssistUser').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('RoadAssistUser').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Service Types ────────────────────────────────────────────────────────
  serviceTypes: {
    list: async () => {
      const { data, error } = await supabase.from('ServiceType').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('ServiceType').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (serviceType: any) => {
      const { data, error } = await supabase.from('ServiceType').insert(serviceType).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('ServiceType').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('ServiceType').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Admin Users ──────────────────────────────────────────────────────────
  adminUsers: {
    list: async () => {
      const { data, error } = await supabase.from('AdminUser').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('AdminUser').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (user: any) => {
      const { data, error } = await supabase.from('AdminUser').insert(user).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { password, ...safeUpdates } = updates;
      const { data, error } = await supabase.from('AdminUser').update(safeUpdates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('AdminUser').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Companies ────────────────────────────────────────────────────────────
  companies: {
    list: async () => {
      const { data, error } = await supabase.from('Company').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('Company').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (company: any) => {
      const { data, error } = await supabase.from('Company').insert(company).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('Company').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('Company').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Invoices ─────────────────────────────────────────────────────────────
  invoices: {
    list: async (filters?: any) => {
      let query = supabase.from('Invoice').select('*').order('created_date', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('Invoice').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (invoice: any) => {
      const { data, error } = await supabase.from('Invoice').insert(invoice).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('Invoice').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('Invoice').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Bonus Rules ──────────────────────────────────────────────────────────
  bonusRules: {
    list: async () => {
      const { data, error } = await supabase.from('BonusRule').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (rule: any) => {
      const { data, error } = await supabase.from('BonusRule').insert(rule).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('BonusRule').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('BonusRule').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Bonus Logs ───────────────────────────────────────────────────────────
  bonusLogs: {
    list: async (filters?: any) => {
      let query = supabase.from('BonusLog').select('*').order('created_date', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (log: any) => {
      const { data, error } = await supabase.from('BonusLog').insert(log).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('BonusLog').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
  },

  // ─── Payment Methods (dentro de AppSettings) ──────────────────────────────
  paymentMethods: {
    list: async () => {
      const { data, error } = await supabase.from('AppSettings').select('payment_methods').limit(1);
      if (error) throw error;
      return data?.[0]?.payment_methods || [];
    },
    create: async (method: any) => {
      const { data: current } = await supabase.from('AppSettings').select('*').limit(1);
      const settings = current?.[0];
      if (!settings) throw new Error('No AppSettings found');
      const methods = [...(settings.payment_methods || []), method];
      const { error } = await supabase.from('AppSettings').update({ payment_methods: methods }).eq('id', settings.id);
      if (error) throw error;
      return method;
    },
    update: async (id: string, updates: any) => {
      const { data: current } = await supabase.from('AppSettings').select('*').limit(1);
      const settings = current?.[0];
      if (!settings) throw new Error('No AppSettings found');
      const methods = (settings.payment_methods || []).map((m: any) =>
        m.id === id || m.key === id ? { ...m, ...updates } : m
      );
      const { error } = await supabase.from('AppSettings').update({ payment_methods: methods }).eq('id', settings.id);
      if (error) throw error;
      return updates;
    },
    delete: async (id: string) => {
      const { data: current } = await supabase.from('AppSettings').select('*').limit(1);
      const settings = current?.[0];
      if (!settings) throw new Error('No AppSettings found');
      const methods = (settings.payment_methods || []).filter((m: any) => m.id !== id && m.key !== id);
      const { error } = await supabase.from('AppSettings').update({ payment_methods: methods }).eq('id', settings.id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Red Zones ────────────────────────────────────────────────────────────
  redZones: {
    list: async () => {
      const { data, error } = await supabase.from('RedZone').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (zone: any) => {
      const { data, error } = await supabase.from('RedZone').insert(zone).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('RedZone').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('RedZone').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Surveys (snake_case — sin PascalCase) ────────────────────────────────
  surveys: {
    list: async () => {
      const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (survey: any) => {
      const { data, error } = await supabase.from('surveys').insert(survey).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('surveys').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Notifications (snake_case — sin PascalCase) ──────────────────────────
  notifications: {
    list: async (filters?: any) => {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (notification: any) => {
      const { data, error } = await supabase.from('notifications').insert(notification).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('notifications').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Liquidations (snake_case — sin PascalCase) ───────────────────────────
  liquidations: {
    list: async (filters?: any) => {
      let query = supabase.from('liquidations').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (liquidation: any) => {
      const { data, error } = await supabase.from('liquidations').insert(liquidation).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('liquidations').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('liquidations').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Announcements (snake_case — sin PascalCase) ──────────────────────────
  announcements: {
    list: async () => {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (announcement: any) => {
      const { data, error } = await supabase.from('announcements').insert(announcement).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('announcements').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Cancellation Policies (snake_case — sin PascalCase) ─────────────────
  cancellationPolicies: {
    list: async () => {
      const { data, error } = await supabase.from('cancellation_policies').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (policy: any) => {
      const { data, error } = await supabase.from('cancellation_policies').insert(policy).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('cancellation_policies').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('cancellation_policies').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Cash Cutoffs (snake_case — sin PascalCase) ───────────────────────────
  cashCutoffs: {
    list: async () => {
      const { data, error } = await supabase.from('cash_cutoffs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (cutoff: any) => {
      const { data, error } = await supabase.from('cash_cutoffs').insert(cutoff).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('cash_cutoffs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('cash_cutoffs').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Road Assist Users (alias de passengers) ──────────────────────────────
  roadAssistUsers: {
    list: async () => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('RoadAssistUser').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
  },

  // ─── Survey Responses ─────────────────────────────────────────────────────
  surveyResponses: {
    list: async (filters?: any) => {
      let query = supabase.from('SurveyResponse').select('*').order('created_date', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (response: any) => {
      const { data, error } = await supabase.from('SurveyResponse').insert(response).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('SurveyResponse').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Driver Notifications ─────────────────────────────────────────────────
  driverNotifications: {
    list: async () => {
      const { data, error } = await supabase.from('DriverNotification').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (notification: any) => {
      const { data, error } = await supabase.from('DriverNotification').insert(notification).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('DriverNotification').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('DriverNotification').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── File Uploads (Supabase Storage) ─────────────────────────────────────
  uploads: {
    uploadFile: async ({ file, bucket = 'assets' }: { file: File; bucket?: string }) => {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return { file_url: urlData.publicUrl };
    },
  },
};

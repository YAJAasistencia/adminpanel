import { supabase } from "@/lib/supabase";

// ─── Supabase API Functions ──────────────────────────────────────────────────

export const supabaseApi = {
  // Internal helper: some datasets still use the legacy table name `settings`
  // while the current Supabase project exposes `AppSettings`.
  _settingsTable: async () => {
    const primary = await supabase.from('AppSettings').select('id').limit(1);
    if (!primary.error) return 'AppSettings';

    const legacy = await supabase.from('settings').select('id').limit(1);
    if (!legacy.error) return 'settings';

    throw primary.error || legacy.error;
  },

  // Cities
  cities: {
    list: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (city: any) => {
      const { data, error } = await supabase
        .from('cities')
        .insert(city)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('cities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Drivers
  drivers: {
    list: async (filters?: any) => {
      let query = supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (driver: any) => {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driver)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Ride Requests
  rideRequests: {
    list: async (filters?: any) => {
      let query = supabase
        .from('ride_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (rideRequest: any) => {
      const { data, error } = await supabase
        .from('ride_requests')
        .insert(rideRequest)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('ride_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('ride_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Geo Zones
  geoZones: {
    list: async () => {
      const { data, error } = await supabase
        .from('geo_zones')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('geo_zones')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (geoZone: any) => {
      const { data, error } = await supabase
        .from('geo_zones')
        .insert(geoZone)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('geo_zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('geo_zones')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Support Tickets
  supportTickets: {
    list: async (filters?: any) => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (ticket: any) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Chats
  chats: {
    list: async (filters?: any) => {
      let query = supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (chat: any) => {
      const { data, error } = await supabase
        .from('chats')
        .insert(chat)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('chats')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // SOS Alerts
  sosAlerts: {
    list: async (filters?: any) => {
      let query = supabase
        .from('sos_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (alert: any) => {
      const { data, error } = await supabase
        .from('sos_alerts')
        .insert(alert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('sos_alerts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('sos_alerts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Settings
  settings: {
    list: async () => {
      const table = await supabaseApi._settingsTable();
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const table = await supabaseApi._settingsTable();
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (setting: any) => {
      const table = await supabaseApi._settingsTable();
      const { data, error } = await supabase
        .from(table)
        .insert(setting)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const table = await supabaseApi._settingsTable();
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const table = await supabaseApi._settingsTable();
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Passengers
  passengers: {
    list: async () => {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (passenger: any) => {
      const { data, error } = await supabase
        .from('passengers')
        .insert(passenger)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('passengers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('passengers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Service Types
  serviceTypes: {
    list: async () => {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (serviceType: any) => {
      const { data, error } = await supabase
        .from('service_types')
        .insert(serviceType)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('service_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Admin Users
  adminUsers: {
    list: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('admin_users').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (user: any) => {
      const { data, error } = await supabase.from('admin_users').insert(user).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('admin_users').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Companies
  companies: {
    list: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (company: any) => {
      const { data, error } = await supabase.from('companies').insert(company).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Invoices
  invoices: {
    list: async (filters?: any) => {
      let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = query.eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (invoice: any) => {
      const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Bonus Rules
  bonusRules: {
    list: async () => {
      const { data, error } = await supabase.from('bonus_rules').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (rule: any) => {
      const { data, error } = await supabase.from('bonus_rules').insert(rule).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('bonus_rules').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('bonus_rules').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Bonus Logs
  bonusLogs: {
    list: async (filters?: any) => {
      let query = supabase.from('bonus_logs').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = query.eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (log: any) => {
      const { data, error } = await supabase.from('bonus_logs').insert(log).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('bonus_logs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
  },

  // Payment Methods
  paymentMethods: {
    list: async () => {
      const { data, error } = await supabase.from('payment_methods').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (method: any) => {
      const { data, error } = await supabase.from('payment_methods').insert(method).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('payment_methods').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Red Zones
  redZones: {
    list: async () => {
      const { data, error } = await supabase.from('red_zones').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (zone: any) => {
      const { data, error } = await supabase.from('red_zones').insert(zone).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('red_zones').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('red_zones').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // Surveys
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

  // Notifications
  notifications: {
    list: async (filters?: any) => {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = query.eq(key, value);
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

  // Liquidations
  liquidations: {
    list: async (filters?: any) => {
      let query = supabase.from('liquidations').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) query = query.eq(key, value);
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

  // Announcements
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

  // Cancellation Policies
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

  // Cash Cutoffs
  cashCutoffs: {
    list: async () => {
      const { data, error } = await supabase.from('cash_cutoffs').select('*').order('cutoff_date', { ascending: false });
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
};
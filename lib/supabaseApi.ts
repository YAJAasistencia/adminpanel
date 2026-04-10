import { supabase } from "@/lib/supabase";

// ─── Supabase API Functions ──────────────────────────────────────────────────

export const supabaseApi = {
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
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (setting: any) => {
      const { data, error } = await supabase
        .from('settings')
        .insert(setting)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('settings')
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
};
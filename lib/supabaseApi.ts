import { supabase } from "@/lib/supabase";
import * as bcryptjs from 'bcryptjs';

// ─── Supabase API Functions ──────────────────────────────────────────────────
// Tabla → nombre real en Supabase
// PascalCase (datos de Base44): Driver, RideRequest, City, RoadAssistUser,
//   ServiceType, Company, Invoice, BonusRule, BonusLog, GeoZone, RedZone,
//   SosAlert, SupportTicket, SurveyResponse, DriverNotification, AdminUser, AppSettings
// snake_case (sin equivalente PascalCase): announcements, cancellation_policies,
//   cash_cutoffs, chat_messages, liquidations, notifications, surveys

// ─── Helper: Update with fallback to GET (handles RLS select() restrictions) ───
// ─── Helper: Update without .select() to avoid PostgREST schema introspection ───
async function updateWithFallback(tableName: string, id: string, updates: any) {
  try {
    console.log(`[supabaseApi] UPDATE ${tableName} id=${id}`, updates);
    // Realizar update SIN .select() para evitar introspección de schema
    const { error: updateError } = await supabase.from(tableName).update(updates).eq('id', id);
    if (updateError) throw updateError;
    console.log(`[supabaseApi] UPDATE SUCCESS (without .select())`);
    
    // Luego hacer GET para obtener los datos actualizados
    const { data, error: getError } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (getError) throw getError;
    console.log(`[supabaseApi] Data fetched after update:`, data);
    return data;
  } catch (fetchError: any) {
    console.error(`[supabaseApi] UPDATE FAILED on ${tableName}:`, fetchError);
    throw new Error(`Actualización fallida en ${tableName}: ${fetchError?.message || 'Error en actualización'}`);
  }
}

// ─── Helper: Create without .select() to avoid PostgREST schema introspection ───
async function createWithFallback(tableName: string, record: any) {
  try {
    console.log(`[supabaseApi] INSERT ${tableName}`, record);
    // Realizar insert SIN .select() para evitar introspección de schema
    const { data: insertedData, error: insertError } = await supabase.from(tableName).insert(record);
    if (insertError) throw insertError;
    console.log(`[supabaseApi] INSERT SUCCESS (without .select())`);
    
    // Si el insert devolvió datos, usarlos; si no, hacer GET
    if (insertedData && insertedData.length > 0) {
      return insertedData[0];
    }
    
    // Fallback: obtener el último record insertado
    const { data, error: getError } = await supabase.from(tableName).select('*').order('created_at', { ascending: false }).limit(1).single();
    if (getError) throw getError;
    console.log(`[supabaseApi] Data fetched after insert:`, data);
    return data;
  } catch (fetchError: any) {
    console.error(`[supabaseApi] INSERT FAILED on ${tableName}:`, fetchError);
    throw new Error(`Inserción fallida en ${tableName}: ${fetchError?.message || 'Error en inserción'}`);
  }
}

export const supabaseApi = {

  // ─── Cities ───────────────────────────────────────────────────────────────
  cities: {
    list: async () => {
      const { data, error } = await supabase.from('cities').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('cities').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (city: any) => {
      return createWithFallback('cities', city);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('cities', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('cities').delete().eq('id', id);
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
    // Optimized version for dashboard - only essential fields
    listForDashboard: async () => {
      const fields = 'id,name,phone,status,vehicle_license_plate,registration_status,average_rating,total_rides,created_at';
      const { data, error } = await supabase.from('Driver').select(fields).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('Driver').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (driver: any) => {
      return createWithFallback('Driver', driver);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('Driver', id, updates);
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
      let query = supabase.from('RideRequest').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) query = (query as any).eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    // Optimized version for dashboard - only essential fields
    listForDashboard: async () => {
      const fields = 'id,status,created_at,driver_id,passenger_id,start_location,end_location,estimated_fare,final_fare,rating,created_at';
      const { data, error } = await supabase.from('RideRequest').select(fields).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('RideRequest').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (rideRequest: any) => {
      return createWithFallback('RideRequest', rideRequest);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('RideRequest', id, updates);
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
      const { data, error } = await supabase.from('geo_zones').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('geo_zones').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (geoZone: any) => {
      return createWithFallback('geo_zones', geoZone);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('geo_zones', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('geo_zones').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Support Tickets ──────────────────────────────────────────────────────
  supportTickets: {
    list: async (filters?: any) => {
      let query = supabase.from('SupportTicket').select('*').order('created_at', { ascending: false });
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
      const { data, error } = await supabase.from('SupportTicket').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (ticket: any) => {
      return createWithFallback('SupportTicket', ticket);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('SupportTicket', id, updates);
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
      return createWithFallback('chat_messages', chat);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('chat_messages', id, updates);
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
      let query = supabase.from('SosAlert').select('*').order('created_at', { ascending: false });
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
      const { data, error } = await supabase.from('SosAlert').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (alert: any) => {
      return createWithFallback('SosAlert', alert);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('SosAlert', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('SosAlert').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Settings (app_settings) ───────────────────────────────────────────────
  settings: {
    list: async () => {
      const { data, error } = await supabase.from('app_settings').select('*').order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (setting: any) => {
      return createWithFallback('app_settings', setting);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('app_settings', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('app_settings').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Passengers / Road Assist Users ──────────────────────────────────────
  passengers: {
    list: async () => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (passenger: any) => {
      return createWithFallback('RoadAssistUser', passenger);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('RoadAssistUser', id, updates);
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
      return createWithFallback('ServiceType', serviceType);
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('ServiceType', id, updates);
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
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('admin_users').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (user: any) => {
      // Hashear contraseña si se proporciona
      if (user.password) {
        user.password_hash = await bcryptjs.hash(user.password, 10);
        delete user.password; // No guardar contraseña en texto plano
      }
      
      const { data, error } = await supabase.from('admin_users').insert(user).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { password, ...safeUpdates } = updates;
      const { data, error } = await supabase.from('admin_users').update(safeUpdates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Companies ────────────────────────────────────────────────────────────
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
      return updateWithFallback('companies', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Invoices ─────────────────────────────────────────────────────────────
  invoices: {
    list: async (filters?: any) => {
      let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
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
      return updateWithFallback('invoices', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Bonus Rules ──────────────────────────────────────────────────────────
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
      return updateWithFallback('bonus_rules', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('bonus_rules').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Bonus Logs ───────────────────────────────────────────────────────────
  bonusLogs: {
    list: async (filters?: any) => {
      let query = supabase.from('bonus_logs').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) query = (query as any).eq(key, value);
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
      return updateWithFallback('bonus_logs', id, updates);
    },
  },

  // ─── Payment Methods (dentro de app_settings) ──────────────────────────────
  paymentMethods: {
    list: async () => {
      const { data, error } = await supabase.from('app_settings').select('payment_methods').limit(1);
      if (error) throw error;
      return data?.[0]?.payment_methods || [];
    },
    create: async (method: any) => {
      const { data: current } = await supabase.from('app_settings').select('*').limit(1);
      const settings = current?.[0];
      if (!settings) throw new Error('No app_settings found');
      const methods = [...(settings.payment_methods || []), method];
      const { error } = await supabase.from('app_settings').update({ payment_methods: methods }).eq('id', settings.id);
      if (error) throw error;
      return method;
    },
    update: async (id: string, updates: any) => {
      const { data: current } = await supabase.from('app_settings').select('*').limit(1);
      const settings = current?.[0];
      if (!settings) throw new Error('No app_settings found');
      const methods = (settings.payment_methods || []).map((m: any) =>
        m.id === id || m.key === id ? { ...m, ...updates } : m
      );
      const { error } = await supabase.from('app_settings').update({ payment_methods: methods }).eq('id', settings.id);
      if (error) throw error;
      return updates;
    },
    delete: async (id: string) => {
      const { data: current } = await supabase.from('app_settings').select('*').limit(1);
      const settings = current?.[0];
      if (!settings) throw new Error('No app_settings found');
      const methods = (settings.payment_methods || []).filter((m: any) => m.id !== id && m.key !== id);
      const { error } = await supabase.from('app_settings').update({ payment_methods: methods }).eq('id', settings.id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ─── Red Zones ────────────────────────────────────────────────────────────
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
      return updateWithFallback('red_zones', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('red_zones').delete().eq('id', id);
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
      return updateWithFallback('surveys', id, updates);
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
      return updateWithFallback('notifications', id, updates);
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
      return updateWithFallback('liquidations', id, updates);
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
      return updateWithFallback('announcements', id, updates);
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
      return updateWithFallback('cancellation_policies', id, updates);
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
      return updateWithFallback('cash_cutoffs', id, updates);
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
      const { data, error } = await supabase.from('RoadAssistUser').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('RoadAssistUser').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('RoadAssistUser', id, updates);
    },
  },

  // ─── Survey Responses ─────────────────────────────────────────────────────
  surveyResponses: {
    list: async (filters?: any) => {
      let query = supabase.from('SurveyResponse').select('*').order('created_at', { ascending: false });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) query = (query as any).eq(key, value);
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
      const { data, error } = await supabase.from('driver_notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (notification: any) => {
      const { data, error } = await supabase.from('driver_notifications').insert(notification).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      return updateWithFallback('driver_notifications', id, updates);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('driver_notifications').delete().eq('id', id);
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

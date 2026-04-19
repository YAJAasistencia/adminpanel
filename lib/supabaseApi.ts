import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { supabase } from '@/lib/supabase';

// ─── Supabase API Functions ──────────────────────────────────────────────────
// ALL CRUD operations go through /api/db (service_role key) to bypass RLS.
// Only Supabase Storage uploads use the anon key directly.

// ─── Generic API helpers ─────────────────────────────────────────────────────

async function apiGet(table: string, id: string) {
  const res = await fetchWithAuth(`/api/db?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `GET ${table}/${id} failed`);
  return json.data;
}

async function apiList(table: string, opts?: {
  order?: string;
  ascending?: boolean;
  limit?: number;
  filters?: Record<string, any>;
  select?: string;
}) {
  const params = new URLSearchParams({ table });
  if (opts?.order) params.set('order', opts.order);
  if (opts?.ascending !== undefined) params.set('ascending', String(opts.ascending));
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.filters) params.set('filters', JSON.stringify(opts.filters));
  if (opts?.select) params.set('select', opts.select);
  const res = await fetchWithAuth(`/api/db?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `LIST ${table} failed`);
  return json.data || [];
}

async function apiCreate(table: string, record: any) {
  const res = await fetchWithAuth(`/api/db?table=${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `CREATE ${table} failed`);
  return json.data;
}

async function apiUpdate(table: string, id: string, updates: any) {
  const res = await fetchWithAuth(`/api/db?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `UPDATE ${table}/${id} failed`);
  return json.data;
}

async function apiDelete(table: string, id: string) {
  const res = await fetchWithAuth(`/api/db?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `DELETE ${table}/${id} failed`);
  return { success: true };
}

function cleanFilters(filters?: any): Record<string, any> | undefined {
  if (!filters) return undefined;
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null) clean[k] = v;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export const supabaseApi = {

  // ─── Cities ───────────────────────────────────────────────────────────────
  cities: {
    list: async () => apiList('cities', { order: 'name', ascending: true }),
    get: async (id: string) => apiGet('cities', id),
    create: async (city: any) => apiCreate('cities', city),
    update: async (id: string, updates: any) => apiUpdate('cities', id, updates),
    delete: async (id: string) => apiDelete('cities', id),
  },

  // ─── Drivers ──────────────────────────────────────────────────────────────
  drivers: {
    list: async (filters?: any) =>
      apiList('Driver', { order: 'created_at', ascending: false, filters: cleanFilters(filters) }),
    listForDashboard: async () =>
      apiList('Driver', {
        order: 'created_at', ascending: false,
        select: 'id,full_name,phone,status,license_plate,approval_status,rating,total_rides,created_at',
      }),
    get: async (id: string) => apiGet('Driver', id),
    create: async (driver: any) => apiCreate('Driver', driver),
    update: async (id: string, updates: any) => apiUpdate('Driver', id, updates),
    delete: async (id: string) => apiDelete('Driver', id),
  },

  // ─── Ride Requests ────────────────────────────────────────────────────────
  rideRequests: {
    list: async (filters?: any) =>
      apiList('ride_requests', { order: 'requested_at', ascending: false, filters: cleanFilters(filters) }),
    listForDashboard: async () =>
      apiList('ride_requests', {
        order: 'requested_at', ascending: false,
        select: 'id,status,requested_at,driver_id,passenger_user_id,pickup_address,dropoff_address,estimated_price,final_price,passenger_rating_for_driver',
      }),
    get: async (id: string) => apiGet('ride_requests', id),
    create: async (rideRequest: any) => apiCreate('ride_requests', rideRequest),
    update: async (id: string, updates: any) => apiUpdate('ride_requests', id, updates),
    delete: async (id: string) => apiDelete('ride_requests', id),
  },

  // ─── Geo Zones ────────────────────────────────────────────────────────────
  geoZones: {
    list: async () => apiList('geo_zones', { order: 'name', ascending: true }),
    get: async (id: string) => apiGet('geo_zones', id),
    create: async (geoZone: any) => apiCreate('geo_zones', geoZone),
    update: async (id: string, updates: any) => apiUpdate('geo_zones', id, updates),
    delete: async (id: string) => apiDelete('geo_zones', id),
  },

  // ─── Support Tickets ──────────────────────────────────────────────────────
  supportTickets: {
    list: async (filters?: any) =>
      apiList('support_tickets', { order: 'id', ascending: false, filters: cleanFilters(filters) }),
    get: async (id: string) => apiGet('support_tickets', id),
    create: async (ticket: any) => apiCreate('support_tickets', ticket),
    update: async (id: string, updates: any) => apiUpdate('support_tickets', id, updates),
    delete: async (id: string) => apiDelete('support_tickets', id),
  },

  // ─── Chat Messages ────────────────────────────────────────────────────────
  chats: {
    list: async (filters?: any) =>
      apiList('chat_messages', { order: 'id', ascending: false, filters: cleanFilters(filters) }),
    get: async (id: string) => apiGet('chat_messages', id),
    create: async (chat: any) => apiCreate('chat_messages', chat),
    update: async (id: string, updates: any) => apiUpdate('chat_messages', id, updates),
    delete: async (id: string) => apiDelete('chat_messages', id),
  },

  // ─── SOS Alerts ───────────────────────────────────────────────────────────
  sosAlerts: {
    list: async (filters?: any) =>
      apiList('sos_alerts', { order: 'id', ascending: false, filters: cleanFilters(filters) }),
    get: async (id: string) => apiGet('sos_alerts', id),
    create: async (alert: any) => apiCreate('sos_alerts', alert),
    update: async (id: string, updates: any) => apiUpdate('sos_alerts', id, updates),
    delete: async (id: string) => apiDelete('sos_alerts', id),
  },

  // ─── Settings (app_settings) ───────────────────────────────────────────────
  settings: {
    list: async () => apiList('app_settings', { order: 'created_at', ascending: false, limit: 1 }),
    get: async (id: string) => apiGet('app_settings', id),
    create: async (setting: any) => apiCreate('app_settings', setting),
    update: async (id: string, updates: any) => apiUpdate('app_settings', id, updates),
    delete: async (id: string) => apiDelete('app_settings', id),
  },

  // ─── Passengers / Road Assist Users ──────────────────────────────────────
  passengers: {
    list: async () => apiList('road_assist_users', { order: 'id', ascending: false }),
    get: async (id: string) => apiGet('road_assist_users', id),
    create: async (passenger: any) => apiCreate('road_assist_users', passenger),
    update: async (id: string, updates: any) => apiUpdate('road_assist_users', id, updates),
    delete: async (id: string) => apiDelete('road_assist_users', id),
  },

  // ─── Service Types ────────────────────────────────────────────────────────
  serviceTypes: {
    list: async () => apiList('service_types', { order: 'name', ascending: true }),
    get: async (id: string) => apiGet('service_types', id),
    create: async (serviceType: any) => apiCreate('service_types', serviceType),
    update: async (id: string, updates: any) => apiUpdate('service_types', id, updates),
    delete: async (id: string) => apiDelete('service_types', id),
  },

  // ─── Admin Users ──────────────────────────────────────────────────────────
  adminUsers: {
    list: async () => apiList('admin_users', { order: 'created_at', ascending: false }),
    get: async (id: string) => apiGet('admin_users', id),
    create: async (user: any) => apiCreate('admin_users', user),
    update: async (id: string, updates: any) => {
      const { password, ...safeUpdates } = updates;
      return apiUpdate('admin_users', id, safeUpdates);
    },
    delete: async (id: string) => apiDelete('admin_users', id),
  },

  // ─── Companies ────────────────────────────────────────────────────────────
  companies: {
    list: async () => apiList('companies', { order: 'razon_social', ascending: true }),
    get: async (id: string) => apiGet('companies', id),
    create: async (company: any) => apiCreate('companies', company),
    update: async (id: string, updates: any) => apiUpdate('companies', id, updates),
    delete: async (id: string) => apiDelete('companies', id),
  },

  // ─── Invoices ─────────────────────────────────────────────────────────────
  invoices: {
    list: async (filters?: any) =>
      apiList('invoices', { order: 'id', ascending: false, filters: cleanFilters(filters) }),
    get: async (id: string) => apiGet('invoices', id),
    create: async (invoice: any) => apiCreate('invoices', invoice),
    update: async (id: string, updates: any) => apiUpdate('invoices', id, updates),
    delete: async (id: string) => apiDelete('invoices', id),
  },

  // ─── Bonus Rules ──────────────────────────────────────────────────────────
  bonusRules: {
    list: async () => apiList('bonus_rules', { order: 'id', ascending: false }),
    create: async (rule: any) => apiCreate('bonus_rules', rule),
    update: async (id: string, updates: any) => apiUpdate('bonus_rules', id, updates),
    delete: async (id: string) => apiDelete('bonus_rules', id),
  },

  // ─── Bonus Logs ───────────────────────────────────────────────────────────
  bonusLogs: {
    list: async (filters?: any) =>
      apiList('bonus_logs', { order: 'period_start', ascending: false, filters: cleanFilters(filters) }),
    create: async (log: any) => apiCreate('bonus_logs', log),
    update: async (id: string, updates: any) => apiUpdate('bonus_logs', id, updates),
  },

  // ─── Payment Methods (sub-object within app_settings) ─────────────────────
  paymentMethods: {
    list: async () => {
      const settings = await apiList('app_settings', { limit: 1 });
      return settings?.[0]?.payment_methods || [];
    },
    create: async (method: any) => {
      const settings = await apiList('app_settings', { limit: 1 });
      const s = settings?.[0];
      if (!s) throw new Error('No app_settings found');
      const methods = [...(s.payment_methods || []), method];
      await apiUpdate('app_settings', s.id, { payment_methods: methods });
      return method;
    },
    update: async (id: string, updates: any) => {
      const settings = await apiList('app_settings', { limit: 1 });
      const s = settings?.[0];
      if (!s) throw new Error('No app_settings found');
      const methods = (s.payment_methods || []).map((m: any) =>
        m.id === id || m.key === id ? { ...m, ...updates } : m
      );
      await apiUpdate('app_settings', s.id, { payment_methods: methods });
      return updates;
    },
    delete: async (id: string) => {
      const settings = await apiList('app_settings', { limit: 1 });
      const s = settings?.[0];
      if (!s) throw new Error('No app_settings found');
      const methods = (s.payment_methods || []).filter((m: any) => m.id !== id && m.key !== id);
      await apiUpdate('app_settings', s.id, { payment_methods: methods });
      return { success: true };
    },
  },

  // ─── Red Zones ────────────────────────────────────────────────────────────
  redZones: {
    list: async () => apiList('red_zones', { order: 'name', ascending: true }),
    create: async (zone: any) => apiCreate('red_zones', zone),
    update: async (id: string, updates: any) => apiUpdate('red_zones', id, updates),
    delete: async (id: string) => apiDelete('red_zones', id),
  },

  // ─── Surveys ──────────────────────────────────────────────────────────────
  surveys: {
    list: async () => apiList('surveys', { order: 'id', ascending: false }),
    create: async (survey: any) => apiCreate('surveys', survey),
    update: async (id: string, updates: any) => apiUpdate('surveys', id, updates),
    delete: async (id: string) => apiDelete('surveys', id),
  },

  // ─── Notifications (driver_notificaciones) ────────────────────────────────
  notifications: {
    list: async (filters?: any) =>
      apiList('driver_notificaciones', { order: 'id', ascending: false, filters: cleanFilters(filters) }),
    create: async (notification: any) => apiCreate('driver_notificaciones', notification),
    update: async (id: string, updates: any) => apiUpdate('driver_notificaciones', id, updates),
    delete: async (id: string) => apiDelete('driver_notificaciones', id),
  },

  // ─── Liquidations (NO EXISTE en Supabase) ─────────────────────────────────
  liquidations: {
    list: async (_filters?: any) => {
      console.warn('[supabaseApi] liquidations table does not exist in Supabase');
      return [];
    },
    create: async (_liquidation: any) => { throw new Error('La tabla liquidations no existe en Supabase'); },
    update: async (_id: string, _updates: any) => { throw new Error('La tabla liquidations no existe en Supabase'); },
    delete: async (_id: string) => { throw new Error('La tabla liquidations no existe en Supabase'); },
  },

  // ─── Announcements ────────────────────────────────────────────────────────
  announcements: {
    list: async () => apiList('announcements', { order: 'id', ascending: false }),
    create: async (announcement: any) => apiCreate('announcements', announcement),
    update: async (id: string, updates: any) => apiUpdate('announcements', id, updates),
    delete: async (id: string) => apiDelete('announcements', id),
  },

  // ─── Cancellation Policies ────────────────────────────────────────────────
  cancellationPolicies: {
    list: async () => apiList('cancellation_policies', { order: 'name', ascending: true }),
    create: async (policy: any) => apiCreate('cancellation_policies', policy),
    update: async (id: string, updates: any) => apiUpdate('cancellation_policies', id, updates),
    delete: async (id: string) => apiDelete('cancellation_policies', id),
  },

  // ─── Cash Cutoffs ─────────────────────────────────────────────────────────
  cashCutoffs: {
    list: async () => apiList('cash_cutoffs', { order: 'cutoff_date', ascending: false }),
    create: async (cutoff: any) => apiCreate('cash_cutoffs', cutoff),
    update: async (id: string, updates: any) => apiUpdate('cash_cutoffs', id, updates),
    delete: async (id: string) => apiDelete('cash_cutoffs', id),
  },

  // ─── Road Assist Users (alias de passengers) ──────────────────────────────
  roadAssistUsers: {
    list: async () => apiList('road_assist_users', { order: 'id', ascending: false }),
    get: async (id: string) => apiGet('road_assist_users', id),
    update: async (id: string, updates: any) => apiUpdate('road_assist_users', id, updates),
  },

  // ─── Survey Responses ─────────────────────────────────────────────────────
  surveyResponses: {
    list: async (filters?: any) =>
      apiList('survey_responses', { order: 'id', ascending: false, filters: cleanFilters(filters) }),
    create: async (response: any) => apiCreate('survey_responses', response),
    delete: async (id: string) => apiDelete('survey_responses', id),
  },

  // ─── Driver Notifications ─────────────────────────────────────────────────
  driverNotifications: {
    list: async () => apiList('driver_notificaciones', { order: 'id', ascending: false }),
    create: async (notification: any) => apiCreate('driver_notificaciones', notification),
    update: async (id: string, updates: any) => apiUpdate('driver_notificaciones', id, updates),
    delete: async (id: string) => apiDelete('driver_notificaciones', id),
  },

  // ─── File Uploads (Supabase Storage — uses anon key directly) ──────────────
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

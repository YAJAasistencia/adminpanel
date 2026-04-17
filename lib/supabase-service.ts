/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Supabase Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralizado servicio para todas las operaciones de base de datos.
 * Proporciona métodos reutilizables para CRUD en todas las tablas.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente para operaciones públicas
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Cliente para operaciones del servidor (con service role)
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

/**
 * Service genérico para operaciones CRUD en Supabase
 */
export class SupabaseService {
  private table: string;
  private client = supabaseServer;

  constructor(tableName: string) {
    this.table = tableName;
  }

  /**
   * Obtener todos los registros con filtros opcionales
   */
  async getAll(filters?: Record<string, any>, options?: any) {
    try {
      let query = this.client.from(this.table).select(options?.select || '*');

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error(`Error fetching from ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }

  /**
   * Obtener un registro por ID
   */
  async getById(id: string, options?: any) {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select(options?.select || '*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error(`Error fetching single from ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }

  /**
   * Crear nuevo registro
   */
  async create(data: any, options?: any) {
    try {
      const { data: created, error } = await this.client
        .from(this.table)
        .insert([data])
        .select(options?.select || '*');

      if (error) throw error;
      return { data: created?.[0], success: true };
    } catch (error) {
      console.error(`Error creating in ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }

  /**
   * Actualizar registro
   */
  async update(id: string, data: any, options?: any) {
    try {
      const { data: updated, error } = await this.client
        .from(this.table)
        .update(data)
        .eq('id', id)
        .select(options?.select || '*');

      if (error) throw error;
      return { data: updated?.[0], success: true };
    } catch (error) {
      console.error(`Error updating in ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }

  /**
   * Eliminar registro
   */
  async delete(id: string) {
    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error deleting from ${this.table}:`, error);
      return { error, success: false };
    }
  }

  /**
   * Búsqueda con texto
   */
  async search(searchTerm: string, columns: string[]) {
    try {
      let query = this.client.from(this.table).select('*');

      columns.forEach((col, index) => {
        if (index === 0) {
          query = query.ilike(col, `%${searchTerm}%`);
        } else {
          query = query.or(`${col}.ilike.%${searchTerm}%`);
        }
      });

      const { data, error } = await query;

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error(`Error searching in ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }

  /**
   * Contar registros con filtros
   */
  async count(filters?: Record<string, any>) {
    try {
      let query = this.client.from(this.table).select('id', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) throw error;
      return { count: count || 0, success: true };
    } catch (error) {
      console.error(`Error counting in ${this.table}:`, error);
      return { count: 0, error, success: false };
    }
  }

  /**
   * Operación en lote
   */
  async batchCreate(dataArray: any[]) {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert(dataArray)
        .select('*');

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error(`Error batch creating in ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }

  /**
   * Ejecutar consulta personalizada
   */
  async query(filters: any, options?: any) {
    try {
      let query = this.client.from(this.table).select(options?.select || '*');

      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Para operadores especiales: { field: ['in', [1, 2, 3]] }
          const [operator, val] = value;
          if (operator === 'in') {
            query = query.in(key, val);
          } else if (operator === 'gt') {
            query = query.gt(key, val);
          } else if (operator === 'lt') {
            query = query.lt(key, val);
          }
        } else {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error(`Error querying ${this.table}:`, error);
      return { data: null, error, success: false };
    }
  }
}

/**
 * Servicios específicos para cada tabla
 */
export const cityService = new SupabaseService('City');
export const driverService = new SupabaseService('Driver');
export const companyService = new SupabaseService('Company');
export const rideRequestService = new SupabaseService('RideRequest');
export const serviceTypeService = new SupabaseService('ServiceType');
export const invoiceService = new SupabaseService('Invoice');
export const bonusRuleService = new SupabaseService('BonusRule');
export const bonusLogService = new SupabaseService('BonusLog');
export const geoZoneService = new SupabaseService('GeoZone');
export const redZoneService = new SupabaseService('RedZone');
export const sosAlertService = new SupabaseService('SosAlert');
export const supportTicketService = new SupabaseService('SupportTicket');
export const surveyService = new SupabaseService('surveys');
export const surveyResponseService = new SupabaseService('SurveyResponse');
export const driverNotificationService = new SupabaseService('DriverNotification');
export const chatMessageService = new SupabaseService('chat_messages');
export const cancellationPolicyService = new SupabaseService('cancellation_policies');
export const appSettingsService = new SupabaseService('AppSettings');
export const adminUserService = new SupabaseService('AdminUser');

export default supabaseServer;

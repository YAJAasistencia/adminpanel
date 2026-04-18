import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase credentials for admin client');
  }
  
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export class AdminService {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(filters?: Record<string, any>) {
    const supabase = getSupabaseAdmin();
    let query = supabase.from(this.tableName).select('*');

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getById(id: string | number) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(record: any) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([record])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async update(id: string | number, updates: any) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async delete(id: string | number) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async upsert(record: any, onConflict: string = 'id') {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert([record], { onConflict })
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }
}

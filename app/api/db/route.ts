/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Generic DB Proxy
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Proxy genérico para CRUD — usa service_role key (bypassa RLS).
 * Requiere autenticación JWT de admin.
 * 
 * Query params:
 *   table     — nombre de la tabla en Supabase
 *   id        — ID del registro (para get/update/delete)
 *   order     — columna para ordenar (default: created_at)
 *   ascending — true/false (default: false)
 *   limit     — límite de registros
 *   filters   — JSON string de filtros { key: value }
 *   select    — campos a seleccionar (default: *)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

const ALLOWED_TABLES = new Set([
  'Driver', 'ride_requests', 'cities', 'service_types', 'support_tickets',
  'chat_messages', 'sos_alerts', 'app_settings', 'road_assist_users',
  'companies', 'geo_zones', 'red_zones', 'bonus_rules', 'bonus_logs',
  'invoices', 'driver_notificaciones', 'admin_users', 'cancellation_policies',
  'announcements', 'surveys', 'survey_responses', 'cash_cutoffs',
]);

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

function authenticate(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = getTokenFromHeader(authHeader || '');
  return requireAdmin(token || '');
}

function validateTable(table: string | null): string {
  if (!table || !ALLOWED_TABLES.has(table)) {
    throw new Error(`Invalid or missing table: ${table}`);
  }
  return table;
}

/**
 * GET /api/db?table=xxx[&id=yyy][&order=col][&ascending=false][&limit=N][&filters={}][&select=*]
 */
export async function GET(request: Request) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const table = validateTable(searchParams.get('table'));
    const id = searchParams.get('id');
    const order = searchParams.get('order');
    const ascending = searchParams.get('ascending') === 'true';
    const limit = searchParams.get('limit');
    const filtersStr = searchParams.get('filters');
    const selectFields = searchParams.get('select') || '*';

    const supabase = getServiceClient();

    // Single record by ID
    if (id) {
      const { data, error } = await supabase.from(table).select(selectFields).eq('id', id).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data, success: true });
    }

    // List records
    let query = supabase.from(table).select(selectFields);

    // Apply filters
    if (filtersStr) {
      try {
        const filters = JSON.parse(filtersStr);
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      } catch { /* ignore bad filters */ }
    }

    // Apply ordering
    if (order) {
      query = query.order(order, { ascending });
    }

    // Apply limit
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [], success: true, count: data?.length || 0 });
  } catch (error: any) {
    console.error('GET /api/db error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/db?table=xxx
 */
export async function POST(request: Request) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const table = validateTable(searchParams.get('table'));
    const body = await request.json();

    const supabase = getServiceClient();
    const { data, error } = await supabase.from(table).insert(body).select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data?.[0] || null, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/db error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/db?table=xxx&id=yyy
 */
export async function PATCH(request: Request) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const table = validateTable(searchParams.get('table'));
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const body = await request.json();

    const supabase = getServiceClient();
    const { data, error } = await supabase.from(table).update(body).eq('id', id).select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data?.[0] || null, success: true });
  } catch (error: any) {
    console.error('PATCH /api/db error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/db?table=xxx&id=yyy
 */
export async function DELETE(request: Request) {
  try {
    if (!authenticate(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const table = validateTable(searchParams.get('table'));
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const supabase = getServiceClient();
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/db error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

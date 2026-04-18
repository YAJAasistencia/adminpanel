/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Settings API
 * ═══════════════════════════════════════════════════════════════════════════
 * Using SupabaseService to avoid schema cache poisoning
 */

import { NextResponse } from 'next/server';
import { appSettingsService } from '@/lib/supabase-service';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

/**
 * GET /api/settings
 * Obtener la única configuración global
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await appSettingsService.getAll({});

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Retornar como array pero obtener el primero
    return NextResponse.json({
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      success: true,
    });
  } catch (error) {
    console.error('[API] GET /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/settings
 * Crear nueva configuración global
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const result = await appSettingsService.create(body);

    if (!result.success) {
      const errMsg = (result.error as any)?.message || 'Unknown Supabase error';
      const errCode = (result.error as any)?.code || '';
      console.error('[API] POST /api/settings Supabase error:', errCode, errMsg);
      // RLS policy violation = missing SUPABASE_SERVICE_ROLE_KEY in env
      if (errCode === '42501') {
        return NextResponse.json({ error: 'RLS policy violation — SUPABASE_SERVICE_ROLE_KEY env var is likely missing on the server.' }, { status: 500 });
      }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
    });
  } catch (error: any) {
    console.error('[API] POST /api/settings error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/settings/[id]
 * Actualizar configuración existente
 */
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const result = await appSettingsService.update(id, body);

    if (!result.success) {
      const errMsg = (result.error as any)?.message || 'Unknown Supabase error';
      const errCode = (result.error as any)?.code || '';
      console.error('[API] PATCH /api/settings Supabase error:', errCode, errMsg);
      if (errCode === '42501') {
        return NextResponse.json({ error: 'RLS policy violation — SUPABASE_SERVICE_ROLE_KEY env var is likely missing on the server.' }, { status: 500 });
      }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
    });
  } catch (error: any) {
    console.error('[API] PATCH /api/settings error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/[id]
 * Eliminar configuración
 */
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await appSettingsService.delete(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: { success: true },
      success: true,
    });
  } catch (error) {
    console.error('[API] DELETE /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Settings API
 * ═══════════════════════════════════════════════════════════════════════════
 * Using SupabaseService to avoid schema cache poisoning
 */

import { NextResponse } from 'next/server';
import { appSettingsService } from '@/lib/supabase-service';

/**
 * GET /api/settings
 * Obtener la única configuración global
 */
export async function GET(request: Request) {
  try {
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
    const body = await request.json();

    const result = await appSettingsService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
    });
  } catch (error) {
    console.error('[API] POST /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/settings/[id]
 * Actualizar configuración existente
 */
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const result = await appSettingsService.update(id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
    });
  } catch (error) {
    console.error('[API] PATCH /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/[id]
 * Eliminar configuración
 */
export async function DELETE(request: Request) {
  try {
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

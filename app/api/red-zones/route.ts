/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - RedZone API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { redZoneService } from '@/lib/supabase-service';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

/**
 * GET /api/red-zones
 * Obtener todos los red-zones
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await redZoneService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/red-zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/red-zones
 * Crear nuevo red-zone
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const result = await redZoneService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/red-zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


/**
 * PATCH /api/red-zones?id=xxx
 * Actualizar registro
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
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const body = await request.json();
    const result = await redZoneService.update(id, body);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error('PATCH /api/red-zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/red-zones?id=xxx
 * Eliminar registro
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
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const result = await redZoneService.delete(id);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ data: { success: true }, success: true });
  } catch (error) {
    console.error('DELETE /api/red-zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

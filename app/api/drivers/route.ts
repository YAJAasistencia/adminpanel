/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Driver API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { AdminService } from '@/lib/supabase-admin';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

/**
 * GET /api/drivers
 * Obtener todos los drivers (requiere autenticación por API)
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');

    if (!requireAdmin(token || '')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const adminService = new AdminService('Driver');
    const data = await adminService.getAll(filters);

    return NextResponse.json({
      data: data,
      success: true,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/drivers
 * Crear nuevo driver (requiere autenticación por API)
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');

    if (!requireAdmin(token || '')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const adminService = new AdminService('Driver');
    const data = await adminService.create(body);

    return NextResponse.json(
      { data: data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/drivers?id=xxx
 * Actualizar un driver
 */
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const body = await request.json();
    const adminService = new AdminService('Driver');
    const data = await adminService.update(id, body);
    return NextResponse.json({ data: data, success: true });
  } catch (error) {
    console.error('PATCH /api/drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drivers?id=xxx
 * Eliminar un driver
 */
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const adminService = new AdminService('Driver');
    await adminService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

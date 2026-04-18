/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Driver Detail API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { AdminService } from '@/lib/supabase-admin';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

/**
 * GET /api/drivers/[id]
 * Obtener un driver por ID (requiere autenticación por API)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');

    if (!requireAdmin(token || '')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const adminService = new AdminService('Driver');
    const data = await adminService.getById(params.id);

    if (!data) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ data: data, success: true });
  } catch (error) {
    console.error(`GET /api/drivers/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/drivers/[id]
 * Actualizar un driver (requiere autenticación por API)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const data = await adminService.update(params.id, body);

    return NextResponse.json({ data: data, success: true });
  } catch (error) {
    console.error(`PUT /api/drivers/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drivers/[id]
 * Eliminar un driver (requiere autenticación por API)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');

    if (!requireAdmin(token || '')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const adminService = new AdminService('Driver');
    const data = await adminService.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/drivers/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

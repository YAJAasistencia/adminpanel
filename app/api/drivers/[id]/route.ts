/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Driver Detail API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { driverService } from '@/lib/supabase-service';

/**
 * GET /api/drivers/[id]
 * Obtener un driver por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await driverService.getById(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`GET /api/drivers/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/drivers/[id]
 * Actualizar un driver
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await driverService.update(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`PUT /api/drivers/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/drivers/[id]
 * Eliminar un driver
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await driverService.delete(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/drivers/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

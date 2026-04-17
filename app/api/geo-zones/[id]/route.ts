/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - GeoZone Detail API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { geoZoneService } from '@/lib/supabase-service';

/**
 * GET /api/geo-zones/[id]
 * Obtener un geo-zone por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await geoZoneService.getById(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: 'GeoZone not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`GET /api/geo-zones/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/geo-zones/[id]
 * Actualizar un geo-zone
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await geoZoneService.update(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`PUT /api/geo-zones/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/geo-zones/[id]
 * Eliminar un geo-zone
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await geoZoneService.delete(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/geo-zones/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

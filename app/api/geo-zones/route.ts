/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - GeoZone API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { geoZoneService } from '@/lib/supabase-service';

/**
 * GET /api/geo-zones
 * Obtener todos los geo-zones
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await geoZoneService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/geo-zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/geo-zones
 * Crear nuevo geo-zone
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await geoZoneService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/geo-zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

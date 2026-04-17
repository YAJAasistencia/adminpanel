/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - RedZone API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { redZoneService } from '@/lib/supabase-service';

/**
 * GET /api/red-zones
 * Obtener todos los red-zones
 */
export async function GET(request: Request) {
  try {
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Driver API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { driverService } from '@/lib/supabase-service';

/**
 * GET /api/drivers
 * Obtener todos los drivers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await driverService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/drivers
 * Crear nuevo driver
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await driverService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

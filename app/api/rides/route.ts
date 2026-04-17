/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - RideRequest API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { rideRequestService } from '@/lib/supabase-service';

/**
 * GET /api/rides
 * Obtener todos los rides
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await rideRequestService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/rides
 * Crear nuevo ride
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await rideRequestService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

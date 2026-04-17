/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - ServiceType API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { serviceTypeService } from '@/lib/supabase-service';

/**
 * GET /api/service-types
 * Obtener todos los service-types
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await serviceTypeService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/service-types error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/service-types
 * Crear nuevo service-type
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await serviceTypeService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/service-types error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

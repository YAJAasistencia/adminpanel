/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - BonusRule API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { bonusRuleService } from '@/lib/supabase-service';

/**
 * GET /api/bonus-rules
 * Obtener todos los bonus-rules
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await bonusRuleService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/bonus-rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bonus-rules
 * Crear nuevo bonus-rule
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await bonusRuleService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/bonus-rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

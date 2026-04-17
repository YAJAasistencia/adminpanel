/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Surveys API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { surveyService } from '@/lib/supabase-service';

/**
 * GET /api/surveys
 * Obtener todos los surveys
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await surveyService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/surveys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/surveys
 * Crear nuevo survey
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await surveyService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/surveys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - BonusRule Detail API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { bonusRuleService } from '@/lib/supabase-service';

/**
 * GET /api/bonus-rules/[id]
 * Obtener un bonus-rule por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await bonusRuleService.getById(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: 'BonusRule not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`GET /api/bonus-rules/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/bonus-rules/[id]
 * Actualizar un bonus-rule
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await bonusRuleService.update(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`PUT /api/bonus-rules/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/bonus-rules/[id]
 * Eliminar un bonus-rule
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await bonusRuleService.delete(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/bonus-rules/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - SupportTicket Detail API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { supportTicketService } from '@/lib/supabase-service';

/**
 * GET /api/support-tickets/[id]
 * Obtener un support-ticket por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await supportTicketService.getById(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: 'SupportTicket not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`GET /api/support-tickets/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/support-tickets/[id]
 * Actualizar un support-ticket
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await supportTicketService.update(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(`PUT /api/support-tickets/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/support-tickets/[id]
 * Eliminar un support-ticket
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await supportTicketService.delete(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/support-tickets/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

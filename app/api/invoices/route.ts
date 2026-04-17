/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Invoice API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { invoiceService } from '@/lib/supabase-service';

/**
 * GET /api/invoices
 * Obtener todos los invoices
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await invoiceService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/invoices
 * Crear nuevo invoice
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await invoiceService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

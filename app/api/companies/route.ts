/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Company API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { companyService } from '@/lib/supabase-service';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

/**
 * GET /api/companies
 * Obtener todos los companies
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await companyService.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/companies
 * Crear nuevo company
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const result = await companyService.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


/**
 * PATCH /api/companies?id=xxx
 * Actualizar registro
 */
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const body = await request.json();
    const result = await companyService.update(id, body);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error('PATCH /api/companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/companies?id=xxx
 * Eliminar registro
 */
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!requireAdmin(token || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const result = await companyService.delete(id);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ data: { success: true }, success: true });
  } catch (error) {
    console.error('DELETE /api/companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

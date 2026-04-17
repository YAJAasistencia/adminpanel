/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - API Routes Template
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * USO: Copia este template para crear nuevas rutas API
 * PASOS:
 * 1. Reemplaza TABLE_NAME con el nombre de tu tabla
 * 2. Reemplaza serviceInstance con tu servicio (ej: driverService)
 * 3. Reemplaza los campos específicos de validación
 * 4. Copia el archivo a app/api/[resource]/route.ts
 */

import { NextResponse } from 'next/server';
import { /* serviceInstance */ } from '@/lib/supabase-service';

/**
 * GET /api/[resource]
 * Obtener todos los registros
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Construir filtros desde query params
    const filters: any = {};
    // Ejemplo:
    // if (searchParams.get('city_id')) filters.city_id = searchParams.get('city_id');
    // if (searchParams.get('is_active')) filters.is_active = searchParams.get('is_active') === 'true';

    const result = await /* serviceInstance */.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/[resource]
 * Crear nuevo registro
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    // if (!body.field_name) {
    //   return NextResponse.json({ error: 'Field name is required' }, { status: 400 });
    // }

    const result = await /* serviceInstance */.create({
      // Mapear campos aquí
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

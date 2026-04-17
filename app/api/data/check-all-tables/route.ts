import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/data/check-all-tables
 * 
 * 🔍 VERIFICA TODOS LOS DATOS EN CADA TABLA
 * Retorna un resumen de qué hay en cada tabla
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DATA CHECK] Verificando todas las tablas...');

    const result: any = {};

    // 1. AdminUser
    const { data: adminUsers, error: adminError } = await supabase
      .from('AdminUser')
      .select('id, email, name, role, is_active, password, password_hash, created_at');

    result.AdminUser = {
      error: adminError?.message || null,
      count: adminUsers?.length || 0,
      users: adminUsers?.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        is_active: u.is_active,
        has_password: !!u.password,
        has_password_hash: !!u.password_hash,
        created_at: u.created_at,
      })) || [],
    };

    // 2. Company
    const { data: companies, error: companyError } = await supabase
      .from('Company')
      .select('id, name, email, status', { count: 'exact' });

    result.Company = {
      error: companyError?.message || null,
      count: companies?.length || 0,
    };

    // 3. Driver
    const { data: drivers, error: driverError } = await supabase
      .from('Driver')
      .select('id, email, full_name, status', { count: 'exact' });

    result.Driver = {
      error: driverError?.message || null,
      count: drivers?.length || 0,
    };

    // 4. RideRequest
    const { data: rides, error: rideError } = await supabase
      .from('RideRequest')
      .select('id, status, created_at', { count: 'exact' });

    result.RideRequest = {
      error: rideError?.message || null,
      count: rides?.length || 0,
    };

    // 5. Invoice
    const { data: invoices, error: invoiceError } = await supabase
      .from('Invoice')
      .select('id, status', { count: 'exact' });

    result.Invoice = {
      error: invoiceError?.message || null,
      count: invoices?.length || 0,
    };

    // 6. City
    const { data: cities, error: cityError } = await supabase
      .from('City')
      .select('id, name', { count: 'exact' });

    result.City = {
      error: cityError?.message || null,
      count: cities?.length || 0,
    };

    // 7. ServiceType
    const { data: serviceTypes, error: stError } = await supabase
      .from('ServiceType')
      .select('id, name', { count: 'exact' });

    result.ServiceType = {
      error: stError?.message || null,
      count: serviceTypes?.length || 0,
    };

    // 8. GeoZone
    const { data: geoZones, error: gzError } = await supabase
      .from('GeoZone')
      .select('id, name', { count: 'exact' });

    result.GeoZone = {
      error: gzError?.message || null,
      count: geoZones?.length || 0,
    };

    // 9. RedZone
    const { data: redZones, error: rzError } = await supabase
      .from('RedZone')
      .select('id, name', { count: 'exact' });

    result.RedZone = {
      error: rzError?.message || null,
      count: redZones?.length || 0,
    };

    console.log('✅ [DATA CHECK] Verificación completa');

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      tables: result,
      summary: {
        total_tables: Object.keys(result).length,
        tables_with_data: Object.entries(result)
          .filter(([_, v]: any) => v.count > 0)
          .map(([k]: any) => k),
      },
    });
  } catch (error: any) {
    console.error('[DATA CHECK] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

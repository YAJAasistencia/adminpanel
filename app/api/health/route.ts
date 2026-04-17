/**
 * Endpoint de diagnóstico para verificar conexión a Supabase
 * GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing Supabase credentials',
        details: {
          url: !!supabaseUrl,
          anonKey: !!supabaseAnonKey,
          serviceKey: !!supabaseServiceKey,
        },
      }, { status: 500 });
    }

    // Crear cliente con clave anónima
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test 1: Intentar obtener primera fila de AppSettings
    console.log('[health] 🔍 Test 1: Consultando AppSettings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('AppSettings')
      .select('id, company_name, created_at')
      .limit(1);

    if (settingsError) {
      console.error('[health] ❌ AppSettings error:', settingsError.message);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to query AppSettings',
        error: settingsError.message,
        code: settingsError.code,
      }, { status: 500 });
    }

    // Test 2: Intentar obtener primer driver
    console.log('[health] 🔍 Test 2: Consultando Driver...');
    const { data: driverData, error: driverError } = await supabase
      .from('Driver')
      .select('id, full_name')
      .limit(1);

    if (driverError) {
      console.error('[health] ❌ Driver error:', driverError.message);
      return NextResponse.json({
        status: 'partial',
        message: 'AppSettings works, but Driver table failed',
        error: driverError.message,
        appSettings: {
          status: 'ok',
          rows: settingsData?.length || 0,
        },
      }, { status: 200 });
    }

    // Test 3: Intentar obtener primer City
    console.log('[health] 🔍 Test 3: Consultando City...');
    const { data: cityData, error: cityError } = await supabase
      .from('City')
      .select('id, name')
      .limit(1);

    if (cityError) {
      console.error('[health] ❌ City error:', cityError.message);
    }

    console.log('[health] ✅ Todos los tests pasaron');

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString(),
      data: {
        appSettings: {
          status: 'ok',
          rows: settingsData?.length || 0,
          data: settingsData?.[0] || null,
        },
        drivers: {
          status: driverError ? 'error' : 'ok',
          error: driverError?.message || null,
          rows: driverData?.length || 0,
        },
        cities: {
          status: cityError ? 'error' : 'ok',
          error: cityError?.message || null,
          rows: cityData?.length || 0,
        },
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[health] ❌ Fatal error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

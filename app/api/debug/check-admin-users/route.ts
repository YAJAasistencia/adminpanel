import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/debug/check-admin-users
 * 
 * 🔍 DEBUG ENDPOINT - Verifica si los usuarios admin están en la BD
 * 
 * ⚠️ SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Verificando tabla AdminUser...');

    // 1. Contar cuántos usuarios hay
    const { data: allUsers, error: countError } = await supabase
      .from('AdminUser')
      .select('id, email, name, role, is_active');

    console.log('[DEBUG] Usuarios en BD:', {
      total: allUsers?.length || 0,
      error: countError?.message,
    });

    // 2. Buscar específicamente el admin
    const { data: adminUser, error: findError } = await supabase
      .from('AdminUser')
      .select('id, email, name, password, password_hash, role, is_active')
      .eq('email', 'admin@yaja.mx')
      .single();

    console.log('[DEBUG] Búsqueda admin@yaja.mx:', {
      found: !!adminUser,
      error: findError?.message,
      user: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        has_password: !!adminUser.password,
        has_password_hash: !!adminUser.password_hash,
        is_active: adminUser.is_active,
      } : null,
    });

    // 3. Verificar credenciales manualmente
    if (adminUser) {
      const testPassword = 'admin123';
      const plainMatch = adminUser.password === testPassword;
      
      console.log('[DEBUG] Verificación manual:', {
        plaintext_match: plainMatch,
        stored_password: adminUser.password,
        test_password: testPassword,
      });
    }

    return NextResponse.json({
      status: 'debug',
      totalUsers: allUsers?.length || 0,
      allUsers: allUsers || [],
      adminUserExists: !!adminUser,
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        is_active: adminUser.is_active,
        password_field: adminUser.password ? '✅ Existe' : '❌ Vacío',
        password_hash_field: adminUser.password_hash ? '✅ Existe' : '❌ Vacío',
      } : null,
      errors: {
        count_error: countError?.message,
        find_error: findError?.message,
      },
    });
  } catch (error: any) {
    console.error('[DEBUG] Exception:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        details: error,
      },
      { status: 500 }
    );
  }
}

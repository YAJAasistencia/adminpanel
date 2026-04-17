import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/validate
 * 
 * 🔐 VALIDA CREDENCIALES Y RETORNA INFO DETALLADA
 * Útil para debugging
 * 
 * Request body:
 * {
 *   "email": "admin@yaja.mx",
 *   "password": "admin123"
 * }
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('\n┌─────────────────────────────────────────────────────┐');
    console.log('│ 🔐 VALIDACIÓN DE CREDENCIALES                       │');
    console.log('└─────────────────────────────────────────────────────┘');
    console.log('Email:', email);
    console.log('Password:', password ? '***' : 'VACÍO');

    const validation: any = {
      email_provided: !!email,
      password_provided: !!password,
      checks: [],
    };

    // Check 1: Email válido
    if (!email) {
      validation.checks.push('❌ Email está vacío');
      return NextResponse.json({ success: false, validation }, { status: 400 });
    }
    validation.checks.push('✅ Email proporcionado');

    // Check 2: Password válido
    if (!password) {
      validation.checks.push('❌ Password está vacío');
      return NextResponse.json({ success: false, validation }, { status: 400 });
    }
    validation.checks.push('✅ Password proporcionado');

    const lowerEmail = email.toLowerCase().trim();

    // Check 3: Consultar tabla AdminUser
    const { data: users, error: tableError } = await supabase
      .from('AdminUser')
      .select('*');

    if (tableError) {
      validation.checks.push(`❌ Error consultando tabla: ${tableError.message}`);
      return NextResponse.json({ success: false, validation }, { status: 500 });
    }

    validation.total_users_in_db = users?.length || 0;
    validation.checks.push(`✅ Tabla consultada: ${users?.length || 0} usuarios`);

    // Check 4: Listar todos los emails
    if (users && users.length > 0) {
      validation.emails_in_db = users.map((u: any) => ({
        email: u.email,
        role: u.role,
        is_active: u.is_active,
      }));
    }

    // Check 5: Buscar usuario
    const adminUser = users?.find((u: any) => u.email.toLowerCase() === lowerEmail);

    if (!adminUser) {
      validation.checks.push(`❌ Usuario ${lowerEmail} NO encontrado en BD`);
      console.log('Búsqueda exacta:', {
        email_buscado: lowerEmail,
        emails_disponibles: users?.map((u: any) => u.email),
      });
      return NextResponse.json({ success: false, validation }, { status: 401 });
    }

    validation.checks.push(`✅ Usuario encontrado`);
    validation.user_found = {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      is_active: adminUser.is_active,
    };

    // Check 6: Cuenta activa
    if (!adminUser.is_active) {
      validation.checks.push('❌ Cuenta desactivada');
      return NextResponse.json({ success: false, validation }, { status: 403 });
    }
    validation.checks.push('✅ Cuenta activa');

    // Check 7: Campos de contraseña
    validation.password_fields = {
      has_password_plain: !!adminUser.password,
      has_password_hash: !!adminUser.password_hash,
      password_plain_value: adminUser.password,
      password_hash_value: adminUser.password_hash ? '(exists)' : 'NULL',
    };

    // Check 8: Comparar contraseña
    const isPasswordMatch = adminUser.password === password;
    validation.checks.push(
      isPasswordMatch
        ? '✅ Contraseña COINCIDE'
        : `❌ Contraseña NO coincide`
    );

    if (!isPasswordMatch) {
      validation.password_comparison = {
        provided: password,
        stored: adminUser.password,
        match: false,
      };
    }

    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│ RESULTADO DE VALIDACIÓN                             │');
    console.log('└─────────────────────────────────────────────────────┘');
    validation.checks.forEach((check: string) => console.log(check));

    const success = isPasswordMatch && adminUser.is_active;

    return NextResponse.json({
      success,
      validation,
      ...(success && {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      }),
    });
  } catch (error: any) {
    console.error('💥 Exception:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

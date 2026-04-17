import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

/**
 * POST /api/auth/login
 * 
 * ✅ NUEVO ENDPOINT DE LOGIN - CON VALIDACIONES COMPLETAS
 * - Valida credenciales exactas
 * - Retorna datos correctos
 * - Maneja errores informativo
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ FALTAN VARIABLES:', {
    url: !!supabaseUrl,
    key: !!supabaseServiceKey,
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('[AUTH] 🔐 NUEVO LOGIN REQUEST');
    console.log('═══════════════════════════════════════════════════════');

    const body = await request.json();
    const { email, password } = body;

    console.log('[AUTH] Credenciales recibidas:', { email, password: '***' });

    // Validación 1: Email y password existen
    if (!email || !password) {
      console.warn('[AUTH] ❌ Email o password vacío');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validación 2: Email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('[AUTH] ❌ Email inválido:', email);
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    console.log('[AUTH] Buscando usuario:', lowerEmail);

    // Validación 3: Consultar usuario
    const { data: users, error: selectError } = await supabase
      .from('AdminUser')
      .select('*');

    if (selectError) {
      console.error('[AUTH] ❌ Error consultando tabla:', selectError.message);
      return NextResponse.json(
        { error: 'Error al acceder a la base de datos' },
        { status: 500 }
      );
    }

    console.log('[AUTH] Total usuarios en BD:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('[AUTH] Usuarios encontrados:');
      users.forEach((u: any) => {
        console.log(`  - ${u.email} (Role: ${u.role}, Activo: ${u.is_active})`);
      });
    }

    // Validación 4: Buscar usuario específico
    const adminUser = users?.find((u: any) => u.email.toLowerCase() === lowerEmail);

    if (!adminUser) {
      console.error('[AUTH] ❌ Usuario no encontrado:', lowerEmail);
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    console.log('[AUTH] ✅ Usuario encontrado:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      is_active: adminUser.is_active,
    });

    // Validación 5: Verificar cuenta activa
    if (adminUser.is_active === false) {
      console.warn('[AUTH] ❌ Cuenta desactivada');
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada' },
        { status: 403 }
      );
    }

    // Validación 6: Verificar contraseña
    console.log('[AUTH] Verificando contraseña...');
    let passwordValid = false;
    let matchType = 'NONE';

    // Intenta hash primero
    if (adminUser.password_hash) {
      try {
        const hashMatch = await bcryptjs.compare(password, adminUser.password_hash);
        if (hashMatch) {
          passwordValid = true;
          matchType = 'HASH';
          console.log('[AUTH] ✅ Contraseña válida (HASH)');
        }
      } catch (e) {
        console.warn('[AUTH] Hash comparison error:', (e as any).message);
      }
    }

    // Fallback: comparar plaintext
    if (!passwordValid && adminUser.password) {
      if (adminUser.password === password) {
        passwordValid = true;
        matchType = 'PLAINTEXT';
        console.log('[AUTH] ✅ Contraseña válida (PLAINTEXT)');

        // Auto-hash para próxima vez
        try {
          const hash = await bcryptjs.hash(password, 10);
          await supabase
            .from('AdminUser')
            .update({ password_hash: hash, updated_at: new Date().toISOString() })
            .eq('id', adminUser.id);
          console.log('[AUTH] ✅ Password auto-hashed para próxima vez');
        } catch (hashError) {
          console.warn('[AUTH] Auto-hash falló:', hashError);
        }
      }
    }

    if (!passwordValid) {
      console.error('[AUTH] ❌ Contraseña incorrecta');
      console.log('[AUTH] Debug:', {
        storedPassword: adminUser.password ? 'existe' : 'no existe',
        storedHash: adminUser.password_hash ? 'existe' : 'no existe',
        receivedPassword: password,
      });
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    console.log('[AUTH] 🎉 LOGIN EXITOSO');
    console.log('═══════════════════════════════════════════════════════\n');

    // Retornar usuario
    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name || adminUser.email,
        role: adminUser.role || 'operator',
      },
      debug: {
        passwordMatch: matchType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AUTH] 💥 EXCEPTION:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

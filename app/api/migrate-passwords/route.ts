/**
 * Endpoint temporal para migrar contraseñas de admin_users a password_hash
 * USAR UNA SOLA VEZ después de agregar la columna password_hash a la tabla
 * 
 * Curl:
 * curl -X POST http://localhost:3301/api/migrate-passwords \
 *   -H "x-migration-key: YOUR_SECRET_KEY_HERE" \
 *   -H "Content-Type: application/json"
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Verificar clave secreta de migración (solo en producción)
    // En desarrollo local, permitir sin clave
    const isProduction = process.env.NODE_ENV === 'production';
    const migrationKey = request.headers.get('x-migration-key');
    const expectedKey = process.env.MIGRATION_SECRET_KEY;

    if (isProduction && (!expectedKey || migrationKey !== expectedKey)) {
      console.warn(`[migrate-passwords] ⚠️ Intento de acceso sin clave válida`);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid migration key' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    console.log('[migrate-passwords] 🔄 Iniciando migración de contraseñas...');

    // Obtener usuarios sin password_hash pero con password
    const { data: users, error: fetchError } = await supabase
      .from('AdminUser')
      .select('id, email, password')
      .is('password_hash', null)
      .not('password', 'is', null);

    if (fetchError) {
      console.error('[migrate-passwords] ❌ Error al obtener usuarios:', fetchError.message);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('[migrate-passwords] ✅ No hay usuarios para migrar');
      return NextResponse.json({
        message: 'No users to migrate',
        migrated: 0,
        failed: 0,
        success: true,
      });
    }

    console.log(`[migrate-passwords] 📊 Encontrados ${users.length} usuario(s)`);

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        console.log(`[migrate-passwords] 🔐 Hasheando: ${user.email}`);
        const hash = await bcryptjs.hash(user.password, 10);

        const { error: updateError } = await supabase
          .from('AdminUser')
          .update({ password_hash: hash })
          .eq('id', user.id);

        if (updateError) {
          console.error(`[migrate-passwords] ❌ Error para ${user.email}:`, updateError.message);
          failed++;
        } else {
          console.log(`[migrate-passwords] ✅ ${user.email} migrado`);
          migrated++;
        }
      } catch (hashError: any) {
        console.error(`[migrate-passwords] ❌ Error procesando ${user.email}:`, hashError.message);
        failed++;
      }
    }

    const result = {
      message: `Migration completed: ${migrated} migrated, ${failed} failed`,
      migrated,
      failed,
      success: failed === 0,
    };

    console.log('[migrate-passwords] ✅ Migración completada:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[migrate-passwords] ❌ Error fatal:', error.message);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

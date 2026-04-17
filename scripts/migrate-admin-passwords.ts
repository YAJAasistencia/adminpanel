/**
 * Script para migrar contraseñas de admin_users a password_hash
 * USAR UNA SOLA VEZ después de agregar la columna password_hash a la tabla
 * 
 * Instrucciones:
 * 1. Agregar columna en Supabase:
 *    ALTER TABLE AdminUser ADD COLUMN password_hash TEXT;
 * 
 * 2. Ejecutar este script:
 *    npx ts-node scripts/migrate-admin-passwords.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePasswords() {
  try {
    console.log('🔄 Iniciando migración de contraseñas...\n');

    // Obtener todos los usuarios sin password_hash pero con password
    const { data: users, error } = await supabase
      .from('AdminUser')
      .select('id, email, password')
      .is('password_hash', null)
      .not('password', 'is', null);

    if (error) {
      console.error('❌ Error al obtener usuarios:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('✅ No hay usuarios para migrar (todos ya tienen password_hash)');
      process.exit(0);
    }

    console.log(`📊 Encontrados ${users.length} usuario(s) para migrar\n`);

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        console.log(`  🔐 Hasheando contraseña para: ${user.email}`);
        const hash = await bcryptjs.hash(user.password, 10);

        const { error: updateError } = await supabase
          .from('AdminUser')
          .update({ password_hash: hash })
          .eq('id', user.id);

        if (updateError) {
          console.error(`    ❌ Error: ${updateError.message}`);
          failed++;
        } else {
          console.log(`    ✅ Migrado exitosamente`);
          migrated++;
        }
      } catch (err: any) {
        console.error(`    ❌ Error al procesar: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n📈 Resultados:`);
    console.log(`  ✅ Migrados: ${migrated}`);
    console.log(`  ❌ Fallidos: ${failed}`);
    console.log(`\n💡 Nota: La columna 'password' se mantendrá en la tabla como fallback`);
    console.log(`   Los proximos logins usarán password_hash automáticamente`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

migratePasswords();

/**
 * Script para migrar contraseñas correctamente usando bcryptjs compatible
 * EJECUTAR UNA SOLA VEZ después de limpiar los hashes incorrectos de crypt()
 */

import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing SUPABASE credentials in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migratePasswordsCorrectly() {
  try {
    console.log('🔄 Iniciando migración correcta de contraseñas con bcryptjs...\n');

    // Obtener todos los usuarios que tienen password pero NO queremos el generado por crypt()
    // Vamos a limpiar primero los hashes incorrectos de crypt() y regenerarlos
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('id, email, password')
      .not('password', 'is', null);

    if (error) {
      console.error('❌ Error al obtener usuarios:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('✅ No hay usuarios para migrar');
      process.exit(0);
    }

    console.log(`📊 Encontrados ${users.length} usuario(s)\n`);

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        console.log(`  🔐 Procesando: ${user.email}`);
        
        // Generar hash con bcryptjs (compatible con Node.js)
        const hash = await bcryptjs.hash(user.password, 10);
        console.log(`     Hash generado: ${hash.substring(0, 20)}...`);

        // Actualizar en Supabase
        const { error: updateError } = await supabase
          .from('admin_users')
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
    console.log(`\n✨ Próximo paso: Intenta login con tus credenciales`);
    console.log(`   Las contraseñas ahora usan bcryptjs compatible`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

migratePasswordsCorrectly();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qcfcmkchydtnqdckgdbj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZmNta2NoeWR0bnFkY2tnZGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDc2NjksImV4cCI6MjA5MjAyMzY2OX0.d4qgtKewOSGMICgSC_ZbragTgzreo4hD_P7b_9ZFIXc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminUsers() {
  try {
    console.log('🔍 Consultando tabla AdminUser...\n');

    // Obtener todos los usuarios
    const { data, error } = await supabase
      .from('AdminUser')
      .select('id, email, name, password, password_hash, role, is_active, created_at');

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('📊 RESULTADO:\n');
    console.log(`Total de usuarios: ${data.length}`);
    console.log('');

    if (data.length === 0) {
      console.log('⚠️  ¡LA TABLA ESTÁ VACÍA!');
      console.log('La migración 005 NO se ejecutó correctamente o no se guardaron los datos.');
    } else {
      console.table(data.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.is_active ? '✅' : '❌',
        password: u.password ? '✅ Sí' : '❌ No',
        password_hash: u.password_hash ? '✅ Sí' : '❌ No',
        created: new Date(u.created_at).toLocaleString(),
      })));
    }

    console.log('\n📝 DATOS COMPLETOS:\n');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('💥 Exception:', error.message);
    process.exit(1);
  }
}

checkAdminUsers();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPassword() {
  console.log('Fetching admin users...');
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('email, password, password_hash, is_active')
    .eq('email', 'admin@yaja.com');

  if (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    return;
  }

  if (!data || data.length === 0) {
    console.log('User not found!');
    return;
  }

  const user = data[0];
  console.log('User found:', user.email);
  console.log('Password stored:', user.password);
  console.log('Password hash:', user.password_hash);
  console.log('Is active:', user.is_active);
  console.log('Test password: Jairsr01@');
  console.log('Match:', user.password === 'Jairsr01@');
}

checkPassword().catch(console.error);

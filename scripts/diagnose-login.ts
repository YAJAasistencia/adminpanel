/**
 * Exhaustive login diagnostics
 * Verifies: DB access, RLS, password comparison, user data
 */
import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('🔍 LOGIN DIAGNOSTIC - Starting exhaustive check...\n');

  // 1. Check RLS status
  console.log('1️⃣  CHECKING RLS STATUS...');
  const { data: rlsStatus, error: rlsError } = await supabase.rpc('get_table_rls_status', { table_name: 'admin_users' }).catch(e => {
    console.warn('⚠️  RPC not available, using direct SELECT');
    return { data: null, error: null };
  });

  if (rlsStatus) {
    console.log('✓ RLS Status via RPC:', rlsStatus);
  } else {
    console.log('⚠️  Could not query RLS status via RPC (expected if no RPC)');
  }

  // 2. Try to fetch admin_users directly
  console.log('\n2️⃣  FETCHING admin_users DATA...');
  const { data: users, error: usersError } = await supabase
    .from('admin_users')
    .select('id, email, password, password_hash, full_name, is_active, created_at');

  if (usersError) {
    console.error('❌ ERROR fetching users:', usersError.message);
    console.error('   Code:', usersError.code);
    console.error('   This usually means RLS is blocking access');
  } else if (users && users.length > 0) {
    console.log(`✓ Found ${users.length} users:`);
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email}`);
      console.log(`     - ID: ${u.id}`);
      console.log(`     - Password (plain): ${u.password ? '✓ EXISTS' : '❌ NULL'}`);
      console.log(`     - Password hash: ${u.password_hash ? '✓ EXISTS' : '❌ NULL'}`);
      console.log(`     - Full name: ${u.full_name}`);
      console.log(`     - Active: ${u.is_active}`);
    });
  } else {
    console.log('⚠️  No users found (empty result)');
  }

  // 3. Test password comparison for admin@yaja.com
  console.log('\n3️⃣  TESTING PASSWORD COMPARISON...');
  const testEmail = 'admin@yaja.com';
  const testPassword = 'Jairsr01@';

  const admin = users?.find(u => u.email === testEmail);
  if (!admin) {
    console.error(`❌ User ${testEmail} not found in database`);
  } else {
    console.log(`✓ Found user: ${testEmail}`);
    console.log(`  Stored password: "${admin.password}"`);
    console.log(`  Test password: "${testPassword}"`);
    console.log(`  Match (plaintext): ${admin.password === testPassword ? '✓ YES' : '❌ NO'}`);

    if (admin.password_hash) {
      try {
        const hashMatch = await bcryptjs.compare(testPassword, admin.password_hash);
        console.log(`  Match (bcrypt hash): ${hashMatch ? '✓ YES' : '❌ NO'}`);
      } catch (e) {
        console.log(`  Bcrypt compare error: ${(e as Error).message}`);
      }
    }
  }

  // 4. Test login endpoint
  console.log('\n4️⃣  TESTING LOGIN ENDPOINT...');
  try {
    const response = await fetch(
      typeof window === 'undefined' 
        ? `http://localhost:3000/api/login` 
        : '/api/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      }
    );

    const result = await response.json();
    console.log(`Response status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✓ Login successful');
    } else {
      console.log('❌ Login failed:', result.error);
    }
  } catch (e) {
    console.error('❌ Could not test endpoint:', (e as Error).message);
    console.log('   (This is normal if running from server-side)');
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===\n');
}

diagnose().catch(console.error);

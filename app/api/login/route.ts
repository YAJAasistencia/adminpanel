import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';

/**
 * POST /api/login
 * 
 * Admin login endpoint - Backend handles Supabase auth to bypass RLS
 * This endpoint uses SERVICE_ROLE_KEY which has full access regardless of RLS
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    console.log('[API LOGIN] Authenticating:', email);

    // Query admin_users with service key (bypasses RLS)
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    console.log('[API LOGIN] Query result:', {
      fetchError: fetchError?.message,
      userFound: !!adminUser,
    });

    if (fetchError || !adminUser) {
      console.error('[API LOGIN] ❌ User not found:', fetchError?.message);
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Verify password
    let passwordValid = false;

    // Try hash first
    if (adminUser.password_hash) {
      try {
        passwordValid = await bcryptjs.compare(password, adminUser.password_hash);
        console.log('[API LOGIN] Hash verification:', passwordValid);
      } catch (e) {
        console.warn('[API LOGIN] Hash comparison failed:', e);
        // Fallback to plaintext
        passwordValid = adminUser.password === password;
      }
    }

    // Fallback to plaintext
    if (!passwordValid && adminUser.password) {
      passwordValid = adminUser.password === password;
      console.log('[API LOGIN] Plaintext comparison:', passwordValid);

      // Auto-hash for next time
      if (passwordValid) {
        try {
          const hash = await bcryptjs.hash(password, 10);
          await supabase
            .from('admin_users')
            .update({ password_hash: hash })
            .eq('id', adminUser.id);
          console.log('[API LOGIN] ✅ Password auto-hashed');
        } catch (e) {
          console.warn('[API LOGIN] Auto-hash failed:', e);
        }
      }
    }

    if (!passwordValid) {
      console.error('[API LOGIN] ❌ Password invalid');
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    if (adminUser.is_active === false) {
      console.warn('[API LOGIN] Account inactive');
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada' },
        { status: 403 }
      );
    }

    console.log('[API LOGIN] ✅ Authentication successful');

    // Return user data (client will store in localStorage)
    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name || adminUser.email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('[API LOGIN] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

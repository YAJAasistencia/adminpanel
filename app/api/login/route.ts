import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcryptjs from 'bcryptjs';
import { SignJWT } from 'jose';

/**
 * POST /api/login
 * 
 * Admin login endpoint - Backend handles Supabase auth to bypass RLS
 * This endpoint uses SERVICE_ROLE_KEY which has full access regardless of RLS
 * Returns a JWT token for authenticated requests
 */

// Helper: Generate JWT token
async function generateToken(adminUser: any): Promise<string> {
  try {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!secret) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 86400; // 24 hours

    const token = await new SignJWT({
      iss: 'supabase',
      ref: 'dsruuvvbeudbkdpevgwd', // Supabase project ref
      role: 'service_role', // Admin role
      aud: 'authenticated',
      user_id: adminUser.id,
      email: adminUser.email,
      iat: now,
      exp: exp,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(new TextEncoder().encode(secret));

    console.log('[API LOGIN] ✅ JWT token generated, expires at:', new Date(exp * 1000).toISOString());
    return token;
  } catch (error) {
    console.error('[API LOGIN] ❌ Token generation failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl) {
      console.error('[API LOGIN] ❌ NEXT_PUBLIC_SUPABASE_URL not defined');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      console.error('[API LOGIN] ❌ Ni SUPABASE_SERVICE_ROLE_KEY ni ANON_KEY definidas');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[API LOGIN] ✅ Supabase client creado');
    console.log('[API LOGIN] URL:', supabaseUrl.substring(0, 30) + '...');
    console.log('[API LOGIN] Key (primeros 20 chars):', supabaseServiceKey.substring(0, 20) + '...');

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

    // Generate JWT token for authenticated requests
    let token = '';
    try {
      token = await generateToken(adminUser);
      console.log('[API LOGIN] ✅ Token generated successfully, length:', token.length);
      
      if (!token || token === '') {
        throw new Error('Token generation returned empty string');
      }
    } catch (tokenError) {
      console.error('[API LOGIN] ❌ Token generation failed:', tokenError);
      // Return error - token is critical for auth
      return NextResponse.json(
        { 
          success: false,
          error: 'Token generation failed - please try again',
          user: null,
          token: null,
        },
        { status: 500 }
      );
    }

    console.log('[API LOGIN] ✅ Returning response with token:', {
      tokenExists: !!token,
      tokenLength: token.length,
      userEmail: adminUser.email,
    });

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name || adminUser.email,
        role: adminUser.role || 'operator',
      },
      token: token && token !== '' ? token : null, // Only return non-empty token
    });
  } catch (error: any) {
    console.error('[API LOGIN] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

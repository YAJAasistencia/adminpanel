import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Initialize Supabase client only when needed (lazy init for build-time safety)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  try {
    // ✅ AUTENTICACIÓN: Verificar que la solicitud viene del admin autenticado
    const authHeader = request.headers.get('authorization');
    const adminSession = request.headers.get('x-admin-session');

    // Nota: Para mayor seguridad, validar contra sesión en servidor
    // Por ahora, requerimos que exista un header de sesión
    if (!adminSession) {
      console.warn('[upload] ⚠️ Intento de upload sin sesión de admin');
      return NextResponse.json(
        { error: 'Unauthorized - Admin session required' },
        { status: 401 }
      );
    }

    // Validar que el archivo no sea muy grande (5MB)
    const contentLength = request.headers.get('content-length');
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'File too large - max 5MB' },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ✅ VALIDACIÓN: Solo permitir tipos de imagen
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type - only images allowed' },
        { status: 400 }
      );
    }

    // Generar nombre único para la imagen
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `settings-images/${timestamp}-${random}.${extension}`;

    // Convertir File a Buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    console.log(`[upload] 📤 Subiendo archivo: ${fileName} (${file.size} bytes)`);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[upload] ❌ Supabase error:', error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);

    console.log(`[upload] ✅ Archivo subido: ${data.path}`);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (error: any) {
    console.error('[upload] ❌ Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

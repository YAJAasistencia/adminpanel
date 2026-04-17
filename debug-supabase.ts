// Script de diagnóstico - Ejecutar en navegador console
// paste esto en la consola del navegador (F12) mientras estés en /companies

const diagnosticLog = async () => {
  console.log("🔍 INICIANDO DIAGNÓSTICO SUPABASE...\n");

  try {
    // 1. Chequear si supabase está inicializado
    console.log("📌 1. Verificando inicialización de Supabase...");
    const supabaseModule = await import("./lib/supabase");
    const supabase = supabaseModule.supabase;
    console.log("✅ Supabase inicializado");

    // 2. Chequear sesión/auth
    console.log("\n📌 2. Verificando autenticación...");
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Usuario actual:", user?.id || "SIN SESIÓN");
    console.log("Email:", user?.email || "N/A");

    // 3. Query directa a Company table sin RLS
    console.log("\n📌 3. Intentando query directa a Company (con timeout para ver error específico)...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const { data, error, status } = await supabase
        .from("Company")
        .select("id, razon_social, is_active, created_at")
        .limit(5);

      clearTimeout(timeoutId);

      if (error) {
        console.error("❌ ERROR en query Company:");
        console.error("  Status:", error.status);
        console.error("  Código:", error.code);
        console.error("  Mensaje:", error.message);
        console.error("  Detalles:", error.details || "N/A");
      } else {
        console.log("✅ Query exitosa. Registros:", data?.length || 0);
        if (data && data.length === 0) {
          console.warn("⚠️  La query funcionó pero NO devuelve datos (problema de RLS)");
        } else {
          console.log("Primeros registros:", data?.slice(0, 2));
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("❌ Excepción en query:", err.message);
    }

    // 4. Verificar otras tablas
    console.log("\n📌 4. Probando otras tablas para comparación...");
    const testTables = ["City", "GeoZone", "ServiceType", "Invoice"];

    for (const table of testTables) {
      const { data, error } = await supabase
        .from(table)
        .select("count")
        .limit(1);

      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: Accesible`);
      }
    }

    // 5. Chequear localStorage/sesión de Supabase
    console.log("\n📌 5. Verificando localStorage de sesión...");
    const sbSession = localStorage.getItem("sb-session") 
      ? "✅ Sesión almacenada" 
      : "⚠️  Sin sesión en localStorage";
    console.log(sbSession);

    // 6. Verificar Network requests
    console.log("\n📌 6. Próximos pasos para diagnóstico manual:");
    console.log("  a) Abre DevTools → Network tab");
    console.log("  b) Recarga la página /companies");
    console.log("  c) Busca requests a 'supabase' y revisa responses");
    console.log("  d) Si ves status 401 → Problema de autenticación");
    console.log("  e) Si ves status 200 pero [] → Problema de RLS");
    console.log("  f) Si ves status de error → Problema de query");

  } catch (err) {
    console.error("ERROR en diagnóstico:", err);
  }

  console.log("\n✅ Diagnóstico completado. Revisa los errores arriba.");
};

diagnosticLog();

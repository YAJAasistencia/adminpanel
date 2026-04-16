"use client"
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import useAppSettings from "@/components/shared/useAppSettings";
import { ADMIN_SESSION_KEY } from "@/components/shared/useAdminSession";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutos
const ATTEMPTS_KEY = "admin_login_attempts";

function getAttemptData() {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"count":0,"lockedUntil":0}');
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function saveAttemptData(data: { count: number; lockedUntil: number }) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data));
}

function resetAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { settings } = useAppSettings() || {};

  useEffect(() => {
    setMounted(true);
    // Verificar si ya hay sesión
    try {
      const saved = localStorage.getItem(ADMIN_SESSION_KEY);
      if (saved) {
        router.push("/dashboard");
      }
    } catch {
      // Ignorar errores de localStorage
    }
    
    // Limpiar bloqueo expirado al cargar
    const attempts = getAttemptData();
    if (attempts.lockedUntil && Date.now() > attempts.lockedUntil) {
      resetAttempts();
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // ⏸️  SEGURIDAD PAUSADA - Verificación de bloqueo desactivada temporalmente
    // const attempts = getAttemptData();
    // if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    //   const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    //   setError(`Demasiados intentos fallidos. Intenta en ${mins} minuto(s).`);
    //   return;
    // }

    setLoading(true);
    setError("");

    try {
      // Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !authData?.user) {
        setError("Credenciales incorrectas.");
        setLoading(false);
        return;
      }

      // Verificar que el usuario existe y está activo en admin_user
      const { data: adminUser, error: fetchError } = await supabase
        .from("admin_user")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (fetchError || !adminUser) {
        setError("Credenciales incorrectas.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (adminUser.is_active === false) {
        setError("Tu cuenta se encuentra desactivada. Contacta al administrador.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Login exitoso: limpiar contador de intentos
      resetAttempts();

      // Guardar sesión de admin
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
          id: adminUser.id,
          email: adminUser.email,
          role: "admin",
          full_name: adminUser.full_name || adminUser.email,
          allowed_pages: [],
        })
      );

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo / brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${settings?.accent_color || "#3B82F6"}, ${settings?.primary_color || "#0F172A"})`,
            }}
          >
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-white" />
            )}
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {settings?.company_name || "Panel de Admin"}
          </h1>
          <p className="text-sm text-slate-400 mt-2">Acceso seguro al panel administrativo</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              {/* Email */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block uppercase tracking-wide">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-xl min-h-[48px] focus:ring-blue-500 focus:border-blue-400 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 block uppercase tracking-wide">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 rounded-xl min-h-[48px] pr-12 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl p-3"
              >
                {error}
              </motion.p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full rounded-xl min-h-[50px] text-base font-bold shadow-lg text-white transition-all disabled:opacity-50"
              style={{ background: settings?.accent_color || "#3B82F6" }}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? "Verificando..." : "Entrar al panel"}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center pt-1">
            Solo usuarios autorizados por el administrador
          </p>
        </div>
      </motion.div>
    </div>
  );
}

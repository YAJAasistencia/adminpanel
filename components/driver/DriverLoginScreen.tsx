import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000;
const DRIVER_ATTEMPTS_KEY = "driver_login_attempts";

function getAttempts() {
  try { return JSON.parse(localStorage.getItem(DRIVER_ATTEMPTS_KEY) || '{"count":0,"lockedUntil":0}'); }
  catch { return { count: 0, lockedUntil: 0 }; }
}
function saveAttempts(d) { localStorage.setItem(DRIVER_ATTEMPTS_KEY, JSON.stringify(d)); }
function resetAttempts() { localStorage.removeItem(DRIVER_ATTEMPTS_KEY); }

// Strip all sensitive fields before storing driver in state
function sanitizeDriver(d) {
  const { password: _, access_code: __, ...safe } = d;
  return safe;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Car, LogIn, UserPlus, ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DriverRegisterScreen from "@/components/driver/DriverRegisterScreen";
import { SESSION_KEY, SESSION_TOKEN_KEY } from "@/components/driver/driverUtils";

const genToken = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function DriverLoginScreen({ onLogin, prefilledEmail = "", appLogo, appName }) {
  const [mode, setMode] = useState("login"); // login | forgot | reset
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");

  const goLogin = () => { setMode("login"); setError(""); setForgotMsg(""); setForgotToken(""); setForgotNewPass(""); };

  const doForgot = async () => {
    if (!email) { setError("Ingresa tu correo"); return; }
    setLoading(true); setError("");
    try {
      const { data, error: queryError } = await supabase.from("Driver").select("*").eq("email", email.trim().toLowerCase()).limit(1);
      if (queryError || !data || data.length === 0) { setError("No existe una cuenta de conductor con ese correo"); setLoading(false); return; }
      const driver = data[0];
      const token = genToken();
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await supabase.from("Driver").update({ reset_token: token, reset_token_expires: expires }).eq("id", driver.id);
      // Note: SendEmail functionality requires RPC or edge function - implement as needed
      setForgotMsg(`Código de recuperación enviado a ${email}. Revisa tu correo.`);
    } catch (err) {
      console.error("Error in password reset:", err);
      setError("Error al procesar solicitud");
    }
    setLoading(false);
  };

  const doReset = async () => {
    if (!forgotToken || !forgotNewPass) { setError("Ingresa el código y la nueva contraseña"); return; }
    if (forgotNewPass.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true); setError("");
    try {
      const { data, error: fetchErr } = await supabase.from("Driver").select("*").eq("email", email.trim().toLowerCase()).limit(1);
      if (fetchErr || !data || data.length === 0) { setError("Correo no encontrado"); setLoading(false); return; }
      const d = data[0];
      if (d.reset_token !== forgotToken.trim().toUpperCase()) { setError("El código es incorrecto"); setLoading(false); return; }
      if (new Date() > new Date(d.reset_token_expires)) { setError("El código expiró. Solicita uno nuevo."); setLoading(false); return; }
      await supabase.from("Driver").update({ password: forgotNewPass, reset_token: null, reset_token_expires: null }).eq("id", d.id);
      setLoading(false);
      setForgotMsg("¡Contraseña actualizada! Ya puedes iniciar sesión.");
      goLogin();
    } catch (err) {
      console.error("doReset error:", err);
      setError("Error al resetear contraseña.");
      setLoading(false);
    }
  };

  const doLogin = async () => {
    if (!email || !password) return;

    // Rate limiting
    const attempts = getAttempts();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      setError(`Demasiados intentos fallidos. Intenta en ${mins} minuto(s).`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data, error: fetchErr } = await supabase.from("Driver").select("*").eq("email", email.trim().toLowerCase()).limit(1);
      if (fetchErr || !data || data.length === 0) {
        const a = getAttempts();
        const newCount = (a.count || 0) + 1;
        saveAttempts({ count: newCount, lockedUntil: newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0 });
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
        setLoading(false);
        return;
      }
      const found = data[0];

      // Generic error — don't reveal if email exists
      if (!found || found.password !== password) {
        const a = getAttempts();
        const newCount = (a.count || 0) + 1;
        saveAttempts({ count: newCount, lockedUntil: newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0 });
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
        setLoading(false);
        return;
      }

      resetAttempts();
      const token = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
      await supabase.from("Driver").update({ access_code: token }).eq("id", found.id);
      localStorage.setItem(SESSION_KEY, found.id);
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      setLoading(false);
      // Never pass password or access_code to app state
      onLogin({ ...sanitizeDriver(found), access_code: token });
    } catch (err) {
      console.error("doLogin error:", err);
      setError("Error al iniciar sesión.");
      setLoading(false);
    }
  };

  if (showRegister) {
    return <DriverRegisterScreen onBack={() => setShowRegister(false)} prefilledEmail={email} onLogin={onLogin} />;
  }

  // FORGOT PASSWORD
  if (mode === "forgot") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 select-none"
        style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <button onClick={goLogin} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <Card className="p-6 border-0 shadow-xl space-y-4">
            <h2 className="font-bold text-slate-900 text-lg text-center">Recuperar contraseña</h2>
            <p className="text-slate-500 text-xs text-center">Ingresa tu correo y te enviaremos un código de verificación.</p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="email" placeholder="Correo electrónico" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                className="pl-10 rounded-xl min-h-[44px]" />
            </div>
            {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl p-3">{error}</p>}
            <Button onClick={doForgot} disabled={loading || !email} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl min-h-[44px]">
              {loading ? "Enviando..." : "Enviar código"}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // RESET PASSWORD
  if (mode === "reset") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 select-none"
        style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <button onClick={() => setMode("forgot")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Atrás
          </button>
          <Card className="p-6 border-0 shadow-xl space-y-4">
            <h2 className="font-bold text-slate-900 text-lg text-center">Nueva contraseña</h2>
            {forgotMsg && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-700 text-xs">{forgotMsg}</p>
              </div>
            )}
            <Input placeholder="Código recibido por correo" value={forgotToken}
              onChange={e => { setForgotToken(e.target.value); setError(""); }}
              className="tracking-widest font-mono text-center text-lg rounded-xl min-h-[44px]" />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type={showPass ? "text" : "password"} placeholder="Nueva contraseña"
                value={forgotNewPass} onChange={e => { setForgotNewPass(e.target.value); setError(""); }}
                className="pl-10 pr-10 rounded-xl min-h-[44px]" />
              <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl p-3">{error}</p>}
            <Button onClick={doReset} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl min-h-[44px]">
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 select-none"
      style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4 bg-white/10" />
          ) : (
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{appName || "App Conductor"}</h1>
          <p className="text-sm text-slate-400 mt-1">Conductor — Inicia sesión con tu cuenta</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="p-6 border-0 shadow-xl">
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }} className="rounded-xl min-h-[44px]" />
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} placeholder="Contraseña" value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && doLogin()} className="rounded-xl min-h-[44px] pr-10" />
                  <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl p-3">{error}</p>}
                <Button onClick={doLogin} disabled={!email || !password || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl min-h-[44px] select-none">
                  <LogIn className="w-4 h-4 mr-2" /> {loading ? "Verificando..." : "Ingresar"}
                </Button>
                <button onClick={() => { setMode("forgot"); setError(""); }} className="w-full text-xs text-blue-500 hover:text-blue-700 text-center min-h-[36px]">
                  ¿Olvidé mi contraseña?
                </button>
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">o</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <Button variant="outline" onClick={() => setShowRegister(true)} className="w-full rounded-xl min-h-[44px] select-none">
                  <UserPlus className="w-4 h-4 mr-2" /> Registrarse como conductor
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

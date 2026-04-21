import React, { useState } from "react";
import { supabaseApi } from "@/lib/supabaseApi";

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
import { Car, LogIn, UserPlus, ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, Copy, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  const [generatedCode, setGeneratedCode] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const goLogin = () => { setMode("login"); setError(""); setForgotMsg(""); setForgotToken(""); setForgotNewPass(""); };

  const doForgot = async () => {
    if (!email) { setError("Ingresa tu correo"); return; }
    setLoading(true); setError(""); setForgotMsg(""); setGeneratedCode("");
    try {
      const data = await supabaseApi.drivers.list({ email: email.trim().toLowerCase() });
      if (!data || data.length === 0) { setError("No existe una cuenta de conductor con ese correo"); setLoading(false); return; }
      const driver = data[0];
      const token = genToken();
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await supabaseApi.drivers.update(driver.id, { reset_token: token, reset_token_expires: expires });
      // DEVELOPMENT MODE: Mostrar código en pantalla para testing
      setGeneratedCode(token);
      setForgotMsg(`Código generado: ${token}\n\nEste código expira en 30 minutos.`);
      setMode("reset");
      setForgotToken("");
      setForgotNewPass("");
      setError("");
    } catch (err) {
      console.error("Error in password reset:", err);
      setError("Error al procesar solicitud");
    }
    setLoading(false);
  };

  // Validar fortaleza de password
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Sin contraseña", color: "text-slate-400", bg: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++; // May & minúscula
    if (/\d/.test(pass)) score++; // Números
    if (/[^a-zA-Z0-9]/.test(pass)) score++; // Caracteres especiales
    const strengths = [
      { score: 0, label: "Muy débil", color: "text-red-600", bg: "bg-red-200" },
      { score: 1, label: "Débil", color: "text-orange-600", bg: "bg-orange-200" },
      { score: 2, label: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-200" },
      { score: 3, label: "Buena", color: "text-blue-600", bg: "bg-blue-200" },
      { score: 4, label: "Fuerte", color: "text-emerald-600", bg: "bg-emerald-200" },
      { score: 5, label: "Muy fuerte", color: "text-emerald-700", bg: "bg-emerald-300" },
    ];
    return strengths[Math.min(score, 5)];
  };
  const passStrength = getPasswordStrength(forgotNewPass);
  const isPasswordValid = forgotNewPass.length >= 8 && /\d/.test(forgotNewPass);

  const doReset = async () => {
    if (!forgotToken || !forgotNewPass) { setError("Ingresa el código y la nueva contraseña"); return; }
    if (forgotNewPass.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (!/\d/.test(forgotNewPass)) { setError("La contraseña debe incluir al menos 1 número"); return; }
    setLoading(true); setError("");
    try {
      const data = await supabaseApi.drivers.list({ email: email.trim().toLowerCase() });
      if (!data || data.length === 0) { setError("Correo no encontrado"); setLoading(false); return; }
      const d = data[0];
      if (d.reset_token !== forgotToken.trim().toUpperCase()) { setError("El código es incorrecto"); setLoading(false); return; }
      if (new Date() > new Date(d.reset_token_expires)) { setError("El código expiró. Solicita uno nuevo."); setLoading(false); return; }
      await supabaseApi.drivers.update(d.id, { password: forgotNewPass, reset_token: null, reset_token_expires: null });
      setLoading(false);
      setForgotMsg("✅ ¡Contraseña actualizada!");
      toast.success("Contraseña cambiada correctamente. Inicia sesión con tu nueva contraseña.");
      setTimeout(() => goLogin(), 1500);
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
      const data = await supabaseApi.drivers.list({ email: email.trim().toLowerCase() });
      if (!data || data.length === 0) {
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
      await supabaseApi.drivers.update(found.id, { access_code: token });
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
          <Card className="p-6 border-0 shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <h2 className="font-bold text-slate-900 text-lg">Recuperar contraseña</h2>
              <p className="text-slate-500 text-xs leading-relaxed">Ingresa el correo asociado a tu cuenta de conductor y generaremos un código para resetear tu contraseña.</p>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="email" placeholder="Correo electrónico" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                className="pl-10 rounded-xl min-h-[44px] text-sm" />
            </div>
            {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}
            <Button onClick={doForgot} disabled={loading || !email} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl min-h-[44px] font-semibold">
              {loading ? "Generando código..." : "Generar código de recuperación"}
            </Button>
            <p className="text-[11px] text-slate-500 text-center">💡 El código será válido por 30 minutos.</p>
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
          <button onClick={() => { setMode("forgot"); setForgotToken(""); setForgotNewPass(""); }} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Atrás
          </button>
          <Card className="p-6 border-0 shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <h2 className="font-bold text-slate-900 text-lg">Nueva contraseña</h2>
              <p className="text-slate-500 text-xs">Ingresa el código y crea una nueva contraseña segura</p>
            </div>
            
            {/* Mostrar código generado para testing */}
            {generatedCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700">Código de recuperación (Development Mode)</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-blue-100">
                  <code className="flex-1 font-mono font-bold text-lg text-blue-900 tracking-widest text-center">{generatedCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                      toast.success("Código copiado al portapapeles");
                    }}
                    className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    {codeCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                  </button>
                </div>
                <p className="text-[10px] text-blue-600">💡 Copia este código y pégalo abajo</p>
              </div>
            )}
            
            {forgotMsg && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-600 text-xs whitespace-pre-line">{forgotMsg}</p>
              </div>
            )}
            
            {/* Input del código */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Código de recuperación</label>
              <Input placeholder="Ingresa el código aquí" value={forgotToken}
                onChange={e => { setForgotToken(e.target.value.toUpperCase()); setError(""); }}
                className="tracking-widest font-mono text-center text-base rounded-xl min-h-[44px]" />
            </div>
            
            {/* Input de nueva contraseña con validación */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type={showNewPass ? "text" : "password"} placeholder="Mínimo 8 caracteres + 1 número"
                  value={forgotNewPass} onChange={e => { setForgotNewPass(e.target.value); setError(""); }}
                  className="pl-10 pr-10 rounded-xl min-h-[44px]" />
                <button onClick={() => setShowNewPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicador de fortaleza */}
              {forgotNewPass && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full transition-all ${passStrength.bg}`} style={{ width: `${(passStrength.score + 1) * 20}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${passStrength.color}`}>{passStrength.label}</span>
                  </div>
                  <ul className="text-[10px] text-slate-500 space-y-0.5">
                    <li className={forgotNewPass.length >= 8 ? "text-emerald-600 font-semibold" : ""}>✓ Mínimo 8 caracteres</li>
                    <li className={/\d/.test(forgotNewPass) ? "text-emerald-600 font-semibold" : ""}>✓ Al menos 1 número</li>
                    <li className={/[a-z]/.test(forgotNewPass) && /[A-Z]/.test(forgotNewPass) ? "text-emerald-600 font-semibold" : ""}><span>✓ Mayúsculas y minúsculas</span></li>
                  </ul>
                </div>
              )}
            </div>
            
            {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}
            
            <Button onClick={doReset} disabled={loading || !isPasswordValid || !forgotToken} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl min-h-[44px] font-semibold">
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

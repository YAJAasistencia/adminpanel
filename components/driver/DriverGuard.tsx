"use client"

import React, { useState, useEffect } from "react";
import { Smartphone, Download, X } from "lucide-react";

function isDesktop(): boolean {
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

interface DriverGuardProps {
  children: React.ReactNode;
}

export default function DriverGuard({ children }: DriverGuardProps) {
  const [desktop, setDesktop] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setDesktop(isDesktop());
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone()) {
        setShowPwaModal(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    // Show PWA modal after short delay if not standalone and not desktop
    if (!isDesktop() && !isStandalone()) {
      const t = setTimeout(() => setShowPwaModal(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setShowPwaModal(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Desktop block
  if (desktop) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">Solo dispositivos móviles</h1>
          <p className="text-white/50 text-base leading-relaxed mb-6">
            Esta aplicación es exclusiva para conductores y está optimizada para smartphones.
            Por favor accede desde tu dispositivo móvil.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* PWA Install Modal */}
      {showPwaModal && !installed && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] flex items-center justify-center">
                <Download className="w-7 h-7 text-white" />
              </div>
              <button
                onClick={() => setShowPwaModal(false)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-white font-bold text-xl mb-2">Instala la app</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Para continuar, instala la aplicación en tu dispositivo. Así tendrás acceso
              rápido, notificaciones y una experiencia más fluida como conductor.
            </p>

            <div className="flex flex-col gap-3">
              {deferredPrompt ? (
                <button
                  onClick={handleInstall}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] text-white font-semibold text-sm hover:opacity-90 transition-all"
                >
                  Instalar ahora
                </button>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/50 text-xs leading-relaxed space-y-3">
                  <div>
                    <strong className="text-white/70">En iPhone (Safari):</strong> Toca el ícono
                    de compartir <span className="text-[#0ea5e9]">⬆</span> y luego
                    "Añadir a pantalla de inicio".
                  </div>
                  <div>
                    <strong className="text-white/70">En Android (Chrome):</strong> Toca el menú
                    <span className="text-[#0ea5e9]"> ⋮ </span> y luego
                    "Añadir a pantalla de inicio" o "Instalar aplicación".
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowPwaModal(false)}
                className="w-full py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/60 text-sm font-medium transition-all"
              >
                Continuar sin instalar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
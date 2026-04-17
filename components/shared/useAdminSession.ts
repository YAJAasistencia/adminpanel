"use client";

import { useState, useEffect, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";

export interface AdminSession {
  id: string;
  email: string;
  name?: string;
  role?: string;
  allowed_pages?: string[];
  is_active?: boolean;
  [key: string]: any;
}

export const ADMIN_SESSION_KEY = "admin_session_id";
export const PUBLIC_PAGES = ["AdminLogin", "DriverApp", "RoadAssistApp"];
export const ADMIN_ROLE = "admin";
export const BASE_ALLOWED_PAGES = ["Dashboard"];

export function getStoredSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(getStoredSession);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    const revalidateSession = async () => {
      const stored = getStoredSession();
      if (!stored?.email) {
        setSession(null);
        setValidated(true);
        return;
      }

      try {
        // ✅ Usar endpoint del backend en lugar de queries directas
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: stored.email,
            password: '', // No necesitamos la contraseña para validar la sesión
          }),
        });

        const result = await response.json();

        if (!result.success || !result.user) {
          clearSession();
          setSession(null);
          if (typeof window !== "undefined") {
            window.location.href = createPageUrl("AdminLogin");
          }
          return;
        }

        const user = result.user;
        const fresh: AdminSession = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          allowed_pages: [],
          is_active: true,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(fresh));
        }
        setSession(fresh);
      } catch (error) {
        console.warn("Session revalidation failed:", error);
        setSession(stored); // Mantener sesión local si la validación falla
      } finally {
        setValidated(true);
      }
    };

    revalidateSession();
  }, []);

  const isAllowed = useCallback((page: string) => {
    if (PUBLIC_PAGES.includes(page)) return true;
    if (!session) return false;
    if (BASE_ALLOWED_PAGES.includes(page)) return true;
    if (session.role === ADMIN_ROLE) return true;
    return (session.allowed_pages || []).includes(page);
  }, [session]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    if (typeof window !== "undefined") {
      window.location.href = createPageUrl("AdminLogin");
    }
  }, []);

  return {
    session,
    validated,
    isAllowed,
    logout,
    setSession: (nextSession: AdminSession | null) => {
      setSession(nextSession);
      if (typeof window === "undefined") return;
      if (nextSession) {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(nextSession));
      } else {
        clearSession();
      }
    },
  };
}
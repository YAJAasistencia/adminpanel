"use client"

/**
 * useAdminSession — Hook centralizado de autenticación y permisos.
 *
 * Flujo:
 *  1. Lee la sesión guardada en localStorage (clave "admin_session_id").
 *  2. Revalida contra Supabase (tabla admin_users) en cada montaje para detectar
 *     cambios de permisos, desactivación o eliminación del usuario.
 *  3. Expone helpers: isAllowed(page), role, session.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";

export const ADMIN_SESSION_KEY = "admin_session_id";

// Pages that are ALWAYS accessible (no permission check needed)
export const PUBLIC_PAGES = ["AdminLogin", "DriverApp", "RoadAssistApp"];

// Admin role always has full access
export const ADMIN_ROLE = "admin";

export function getStoredSession() {
  try {
    if (typeof window === 'undefined') return null; // SSR/prerender safety
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return; // SSR/prerender safety
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function useAdminSession() {
  const [session, setSession] = useState(getStoredSession);
  const [validated, setValidated] = useState(false);

  // Revalidate against DB on mount
  useEffect(() => {
    const validateSession = async () => {
      const stored = getStoredSession();
      if (!stored) { 
        setValidated(true); 
        return; 
      }

      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id,email,full_name,role,allowed_pages,is_active")
          .eq("email", stored.email)
          .limit(1)
          .single();

        if (error || !data) {
          // User not found or error
          clearSession();
          setSession(null);
          setValidated(true);
          return;
        }

        if (data.is_active === false) {
          // User deleted or deactivated → force logout
          clearSession();
          setSession(null);
          setValidated(true);
          return;
        }

        // Refresh session with latest permissions from DB
        const fresh = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          allowed_pages: data.allowed_pages || [],
          is_active: data.is_active,
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(fresh));
        setSession(fresh);
        setValidated(true);
      } catch (err) {
        // If validation fails but we have a stored session, keep it
        console.error("Session validation error:", err);
        setValidated(true);
      }
    };

    validateSession();
  }, []);

  const isAllowed = useCallback((page: string) => {
    if (PUBLIC_PAGES.includes(page)) return true;
    if (!session) return false;
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

  return { session, validated, isAllowed, logout };
}

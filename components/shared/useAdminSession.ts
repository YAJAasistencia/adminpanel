"use client";

import { useState, useEffect, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import { supabaseApi } from "@/lib/supabaseApi";

export interface AdminSession {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  allowed_pages?: string[];
  is_active?: boolean;
  token?: string; // JWT token for authenticated requests
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
        const allUsers = await supabaseApi.adminUsers.list();
        const user = allUsers.find((u: any) => u.email === stored.email);
        if (!user || user.is_active === false) {
          clearSession();
          setSession(null);
          if (typeof window !== "undefined") {
            window.location.href = createPageUrl("AdminLogin");
          }
          return;
        }

        const fresh: AdminSession = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          allowed_pages: user.allowed_pages || [],
          is_active: user.is_active,
          token: stored.token, // Preserve JWT token from localStorage
        };

        if (typeof window !== "undefined") {
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(fresh));
        }
        setSession(fresh);
      } catch (error) {
        console.warn("Session revalidation failed:", error);
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

// Helper function to get JWT token from session
export function getStoredToken(): string | null {
  const session = getStoredSession();
  const token = session?.token;
  
  // Explicitly handle empty strings and undefined
  if (!token || token === '' || typeof token !== 'string') {
    return null;
  }
  
  return token;
}
"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";

export interface AdminSession {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  permissions?: string[];
  [key: string]: any;
}

export const PUBLIC_PAGES = ["AdminLogin", "RoadAssistApp", "DriverApp"];

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [validated, setValidated] = useState(false);
  const router = useRouter();

  // Check if user has permission for a page
  const isAllowed = useCallback((pageName: string) => {
    if (!session) return false;
    if (PUBLIC_PAGES.includes(pageName)) return true;

    // Admin role has access to everything
    if (session.role === 'admin' || session.role === 'super_admin') return true;

    // Check specific permissions
    const pagePermissions: Record<string, string[]> = {
      Dashboard: ['read_dashboard'],
      Users: ['read_users'],
      Drivers: ['read_drivers'],
      Settings: ['read_settings'],
      // Add more page permissions as needed
    };

    const requiredPerms = pagePermissions[pageName];
    if (!requiredPerms) return true; // Default allow if no specific permissions defined

    return requiredPerms.every(perm => session.permissions?.includes(perm));
  }, [session]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear session
      setSession(null);
      setValidated(true);

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin-session');
        localStorage.removeItem('admin-token');
      }

      // Redirect to login
      router.push(createPageUrl("AdminLogin"));
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('admin-token');
        const storedSession = localStorage.getItem('admin-session');

        if (!token || !storedSession) {
          setValidated(true);
          return;
        }

        const parsedSession = JSON.parse(storedSession);

        // Here you would typically validate the token with your API
        // For now, we'll just check if it exists and hasn't expired
        const now = Date.now();
        const expiresAt = parsedSession.expires_at;

        if (expiresAt && now > expiresAt) {
          // Token expired
          logout();
          return;
        }

        setSession(parsedSession);
      } catch (error) {
        console.error("Session validation error:", error);
        logout();
      } finally {
        setValidated(true);
      }
    };

    validateSession();
  }, [logout]);

  return {
    session,
    validated,
    isAllowed,
    logout,
    setSession: (newSession: AdminSession | null) => {
      setSession(newSession);
      if (newSession && typeof window !== 'undefined') {
        localStorage.setItem('admin-session', JSON.stringify(newSession));
      }
    }
  };
}
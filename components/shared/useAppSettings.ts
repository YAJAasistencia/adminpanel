"use client"

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { setSystemTimezone } from "@/components/shared/dateUtils";

export interface AppSettings {
  company_name?: string;
  primary_color?: string;
  logo_url?: string;
  accent_color?: string;
  secondary_color?: string;
  currency?: string;
  timezone?: string;
  nav_config?: any[];
  auto_assign_enabled?: boolean;
  [key: string]: any;
}

export default function useAppSettings() {
  const { data, isLoading } = useQuery<AppSettings[]>({
    queryKey: ["appSettings"],
    queryFn: async () => {
      try {
        // Intenta con autenticaci\u00f3n (admin panel) para sortear RLS
        const res = await fetchWithAuth('/api/settings');
        if (res.ok) {
          const json = await res.json();
          return json.data ? [json.data] : [];
        }
      } catch {
        // sin acceso a localStorage (SSR) o sin token
      }
      // Fallback: clave an\u00f3nima (p\u00e1ginas p\u00faublicas / driver app)
      return supabaseApi.settings.list();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: [],
  });

  const defaultSettings: AppSettings = {
    company_name: "YAJA",
    primary_color: "#0F172A",
    accent_color: "#3B82F6",
    secondary_color: "#10B981",
    currency: "MXN",
    timezone: "America/Mexico_City",
    logo_url: undefined,
    nav_config: [],
  };

  // If database is down or returns old "RideFlow" name, use YAJA
  const settings = data?.[0] || defaultSettings;
  if (!settings.company_name || settings.company_name === "RideFlow") {
    settings.company_name = "YAJA";
  }

  useEffect(() => {
    if (settings?.timezone) {
      setSystemTimezone(settings.timezone);
    }
  }, [settings?.timezone]);

  return { settings, isLoading };
}
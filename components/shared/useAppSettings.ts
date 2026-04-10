"use client"

import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";

export interface AppSettings {
  company_name?: string;
  logo_url?: string;
  accent_color?: string;
  timezone?: string;
  nav_config?: any[];
  auto_assign_enabled?: boolean;
  [key: string]: any;
}

export default function useAppSettings() {
  const { data: settings = {} as AppSettings, ...query } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      try {
        // Try to get settings from Supabase
        const result = await supabaseApi.settings.list();
        return result?.[0] || {};
      } catch (error) {
        console.warn("Failed to load app settings, using defaults:", error);
        // Return default settings
        return {
          company_name: "YAJA Asistencia",
          accent_color: "#3B82F6",
          timezone: "America/Mexico_City",
          auto_assign_enabled: true,
        } as AppSettings;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { settings, ...query };
}
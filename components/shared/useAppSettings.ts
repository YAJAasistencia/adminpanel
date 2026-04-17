"use client"

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
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
    queryFn: () => supabaseApi.settings.list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: [],
  });

  const settings = data?.[0] || {
    company_name: "YAJA",
    primary_color: "#0F172A",
    accent_color: "#3B82F6",
    secondary_color: "#10B981",
    currency: "MXN",
    timezone: "America/Mexico_City",
  };

  useEffect(() => {
    if (settings?.timezone) {
      setSystemTimezone(settings.timezone);
    }
  }, [settings?.timezone]);

  return { settings, isLoading };
}
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { setSystemTimezone } from "@/components/shared/dateUtils";

export default function useAppSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["appSettings"],
    queryFn: () => supabaseApi.settings.list(),
    initialData: [],
  });

  const settings = data?.[0] || {
    company_name: "RideFlow",
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
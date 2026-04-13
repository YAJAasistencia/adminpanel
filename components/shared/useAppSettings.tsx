import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { setSystemTimezone } from "@/components/shared/dateUtils";

export default function useAppSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["appSettings"],
    queryFn: async () => {
      try {
        const { data: settings, error } = await supabase
          .from("AppSettings")
          .select("*")
          .limit(1);
        
        if (error || !settings || settings.length === 0) {
          return [];
        }
        
        return settings;
      } catch (err) {
        console.error("Error fetching AppSettings:", err);
        return [];
      }
    },
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

  // Sync timezone globally whenever settings load
  useEffect(() => {
    if (settings?.timezone) {
      setSystemTimezone(settings.timezone);
    }
  }, [settings?.timezone]);

  return { settings, isLoading };
}

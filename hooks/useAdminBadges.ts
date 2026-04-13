import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { useAdminSession } from "@/components/shared/useAdminSession";

/**
 * Hook to fetch badge counts for admin navigation
 */
export function useAdminBadges() {
  const { session } = useAdminSession();

  const { data: pendingRides = 0 } = useQuery({
    queryKey: ["pendingRides"],
    queryFn: async () => {
      try {
        const rides = await supabaseApi.rides.list({ status: "pending" });
        return rides?.length || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!session,
    staleTime: 30000,
  });

  const { data: openTickets = 0 } = useQuery({
    queryKey: ["openTickets"],
    queryFn: async () => {
      try {
        const tickets = await supabaseApi.tickets.list({ status: "open" });
        return tickets?.length || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!session,
    staleTime: 30000,
  });

  const { data: unreadChats = 0 } = useQuery({
    queryKey: ["unreadChats"],
    queryFn: async () => {
      try {
        const chats = await supabaseApi.messages.list({ unread: true });
        return chats?.length || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!session,
    staleTime: 30000,
  });

  const { data: activeAlerts = 0 } = useQuery({
    queryKey: ["activeAlerts"],
    queryFn: async () => {
      try {
        const alerts = await supabaseApi.sosAlerts.list({ status: "active" });
        return alerts?.length || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!session,
    staleTime: 30000,
  });

  return {
    pendingRides,
    openTickets,
    unreadChats,
    activeAlerts,
  };
}

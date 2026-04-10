"use client"

import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";

export interface AdminBadges {
  openTickets: number;
  pendingRides: number;
  unreadChats: number;
  activeAlerts: number;
}

export default function useAdminBadges(): AdminBadges {
  // Query for open support tickets
  const { data: openTickets = 0 } = useQuery({
    queryKey: ["admin-badges", "open-tickets"],
    queryFn: async () => {
      try {
        const tickets = await supabaseApi.supportTickets.list({ status: "open" });
        return tickets.length;
      } catch {
        return 0;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query for pending rides
  const { data: pendingRides = 0 } = useQuery({
    queryKey: ["admin-badges", "pending-rides"],
    queryFn: async () => {
      try {
        const rides = await supabaseApi.rideRequests.list({ status: "pending" });
        return rides.length;
      } catch {
        return 0;
      }
    },
    refetchInterval: 30000,
  });

  // Query for unread chats
  const { data: unreadChats = 0 } = useQuery({
    queryKey: ["admin-badges", "unread-chats"],
    queryFn: async () => {
      try {
        const chats = await supabaseApi.chats.list({ unread: true });
        return chats.length;
      } catch {
        return 0;
      }
    },
    refetchInterval: 30000,
  });

  // Query for active SOS alerts
  const { data: activeAlerts = 0 } = useQuery({
    queryKey: ["admin-badges", "active-alerts"],
    queryFn: async () => {
      try {
        const alerts = await supabaseApi.sosAlerts.list({ status: "active" });
        return alerts.length;
      } catch {
        return 0;
      }
    },
    refetchInterval: 15000, // More frequent for alerts
  });

  return {
    openTickets,
    pendingRides,
    unreadChats,
    activeAlerts,
  };
}
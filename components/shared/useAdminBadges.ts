"use client"

import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/api/base44Client";

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
        const tickets = await base44.entities.SupportTicket.list({ status: "open" });
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
        const rides = await base44.entities.RideRequest.list({ status: "pending" });
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
        const chats = await base44.entities.Chat.list({ unread: true });
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
        const alerts = await base44.entities.SosAlert.list({ status: "active" });
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
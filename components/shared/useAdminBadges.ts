"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseApi } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";

export interface AdminBadges {
  openTickets: number;
  pendingRides: number;
  unreadChats: number;
  activeAlerts: number;
}

export default function useAdminBadges(): AdminBadges {
  const badgesRef = useRef<AdminBadges>({
    pendingRides: 0,
    openTickets: 0,
    activeAlerts: 0,
    unreadChats: 0,
  });

  const computeBadges = useCallback(async () => {
    try {
      const [rides, tickets, alerts, { data: chats }] = await Promise.all([
        supabaseApi.rideRequests.list(),
        supabaseApi.supportTickets.list(),
        supabaseApi.sosAlerts.list(),
        supabase
          .from("chat_messages")
          .select("id, ride_id, sender_role, read_by_admin")
          .order("created_date", { ascending: false })
          .limit(200),
      ]);

      const activeRideIds = new Set(
        rides
          .filter((ride: any) => !["completed", "cancelled"].includes(ride.status))
          .map((ride: any) => ride.id),
      );

      badgesRef.current = {
        pendingRides: rides.filter((ride: any) => ["pending", "auction"].includes(ride.status)).length,
        openTickets: tickets.filter((ticket: any) => ticket.status === "open").length,
        activeAlerts: alerts.filter((alert: any) => alert.status === "active").length,
        unreadChats: (chats || []).filter((chat: any) =>
          !chat.read_by_admin &&
          (chat.sender_role === "driver" || chat.sender_role === "passenger") &&
          activeRideIds.has(chat.ride_id)
        ).length,
      };
    } catch (error: any) {
      console.warn("useAdminBadges fetch error:", error?.message || error);
    }
  }, []);

  const { refetch } = useQuery({
    queryKey: ["adminBadges"],
    queryFn: computeBadges,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    const rideChannel = supabase
      .channel("admin_badges_ride_requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, () => refetch())
      .subscribe();

    const ticketChannel = supabase
      .channel("admin_badges_support_tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => refetch())
      .subscribe();

    const alertChannel = supabase
      .channel("admin_badges_sos_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => refetch())
      .subscribe();

    const chatChannel = supabase
      .channel("admin_badges_chat_messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [refetch]);

  return badgesRef.current;
}
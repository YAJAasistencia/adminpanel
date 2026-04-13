"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabaseApi } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";

export interface AdminBadges {
  openTickets: number;
  pendingRides: number;
  unreadChats: number;
  activeAlerts: number;
}

export default function useAdminBadges(): AdminBadges {
  const [badges, setBadges] = useState<AdminBadges>({
    pendingRides: 0,
    openTickets: 0,
    activeAlerts: 0,
    unreadChats: 0,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const waitBriefly = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const fetchBadges = useCallback(async () => {
    try {
      const rides = await supabaseApi.rideRequests.list();
      await waitBriefly(150);

      const tickets = await supabaseApi.supportTickets.list();
      await waitBriefly(150);

      const alerts = await supabaseApi.sosAlerts.list();
      await waitBriefly(150);

      const { data: chats, error } = await supabase
        .from("chat_messages")
        .select("id, ride_id, sender_role, read_by_admin")
        .order("created_date", { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!isMountedRef.current) return;

      const activeRideIds = new Set(
        rides
          .filter((ride: any) => !["completed", "cancelled"].includes(ride.status))
          .map((ride: any) => ride.id),
      );

      setBadges({
        pendingRides: rides.filter((ride: any) => ["pending", "auction"].includes(ride.status)).length,
        openTickets: tickets.filter((ticket: any) => ticket.status === "open").length,
        activeAlerts: alerts.filter((alert: any) => alert.status === "active").length,
        unreadChats: (chats || []).filter((chat: any) =>
          !chat.read_by_admin &&
          (chat.sender_role === "driver" || chat.sender_role === "passenger") &&
          activeRideIds.has(chat.ride_id)
        ).length,
      });
    } catch (error: any) {
      console.warn("useAdminBadges fetch error:", error?.message || error);
    }
  }, [waitBriefly]);

  const refresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchBadges();
    }, 5000);
  }, [fetchBadges]);

  useEffect(() => {
    isMountedRef.current = true;

    initTimerRef.current = setTimeout(() => {
      fetchBadges();
    }, 1000);

    const rideChannel = supabase
      .channel("admin_badges_ride_requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_requests" }, refresh)
      .subscribe();

    const ticketChannel = supabase
      .channel("admin_badges_support_tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, refresh)
      .subscribe();

    const alertChannel = supabase
      .channel("admin_badges_sos_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, refresh)
      .subscribe();

    const chatChannel = supabase
      .channel("admin_badges_chat_messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, refresh)
      .subscribe();

    return () => {
      isMountedRef.current = false;
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(rideChannel);
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [refresh, fetchBadges]);

  return badges;
}
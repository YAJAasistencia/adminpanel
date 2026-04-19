"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/admin/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import { Send, MessageCircle, Search } from "lucide-react";
import { formatCDMX } from "@/components/shared/dateUtils";
import { toast } from "sonner";

export default function ChatsPage() {
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [showBlockedWordsSettings, setShowBlockedWordsSettings] = useState(false);
  const [newBlockedWord, setNewBlockedWord] = useState("");
  const [blockedWords, setBlockedWords] = useState<string[]>(() => {
    try { return typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("chat_blocked_words") || "[]") : []; } catch { return []; }
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const saveBlockedWords = (words: string[]) => {
    setBlockedWords(words);
    if (typeof window !== 'undefined') {
      localStorage.setItem("chat_blocked_words", JSON.stringify(words));
    }
  };

  const addBlockedWord = () => {
    const w = newBlockedWord.trim().toLowerCase();
    if (!w || blockedWords.includes(w)) return;
    saveBlockedWords([...blockedWords, w]);
    setNewBlockedWord("");
  };

  const removeBlockedWord = (w: string) => saveBlockedWords(blockedWords.filter(b => b !== w));

  // Rides con mensajes activos o asignados
  const { data: rides = [] } = useQuery({
    queryKey: ["ridesWithMessages"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('ride_requests')
          .select('*');
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching rides:", error);
        return [];
      }
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5000,
  });

  // Mensajes de chat
  const { data: allMessages = [] } = useQuery({
    queryKey: ["allMessages"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .order("id", { ascending: false })
          .limit(500);
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Suscripción en tiempo real a nuevos mensajes
  useEffect(() => {
    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["allMessages"] });
        }
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  // Scroll automático al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, selectedRideId]);

  // Marcar mensajes como leídos
  useEffect(() => {
    if (!selectedRideId) return;
    const unread = allMessages.filter((m: any) =>
      m.ride_id === selectedRideId &&
      !m.read_by_admin &&
      (m.sender_role === "driver" || m.sender_role === "passenger")
    );
    unread.forEach(async (m: any) => {
      try {
        await supabase.from("chat_messages").update({ read_by_admin: true }).eq("id", m.id);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });
  }, [selectedRideId, allMessages]);

  const activeRides = rides.filter((r: any) =>
    ["assigned", "admin_approved", "en_route", "arrived", "in_progress"].includes(r.status)
  );

  const ridesWithChatActivity = activeRides.filter((r: any) => {
    const msgs = allMessages.filter((m: any) => m.ride_id === r.id);
    return msgs.length > 0 || r.driver_id;
  });

  const filteredRides = ridesWithChatActivity.filter((r: any) =>
    !search || r.passenger_name?.toLowerCase().includes(search.toLowerCase()) || r.driver_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getUnreadCount = (rideId: string) =>
    allMessages.filter((m: any) =>
      m.ride_id === rideId &&
      !m.read_by_admin &&
      (m.sender_role === "driver" || m.sender_role === "passenger")
    ).length;

  const selectedMessages = allMessages.filter((m: any) => m.ride_id === selectedRideId).sort((a: any, b: any) => (a.id || "").localeCompare(b.id || ""));
  const selectedRide = rides.find((r: any) => r.id === selectedRideId);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedRideId) return;
    const hasBlocked = blockedWords.some((w: string) => messageText.toLowerCase().includes(w));
    if (hasBlocked) {
      toast.error("⚠️ Tu mensaje contiene palabras no permitidas");
      return;
    }
    setSending(true);
    try {
      await supabase.from("chat_messages").insert({
        ride_id: selectedRideId,
        sender_role: "admin",
        sender_name: "Administrador",
        message: messageText.trim(),
        read_by_driver: false,
        read_by_admin: true,
      });
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["allMessages"] });
      toast.success("Mensaje enviado");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const visibleRideIds = new Set(activeRides.filter((r: any) => r.driver_id).map((r: any) => r.id));
  const totalUnread = allMessages.filter((m: any) =>
    visibleRideIds.has(m.ride_id) &&
    !m.read_by_admin && (m.sender_role === "driver" || m.sender_role === "passenger")
  ).length;

  return (
    <Layout currentPageName="Chats">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Chats de viajes</h1>
            {totalUnread > 0 && <Badge className="bg-red-500 text-white">{totalUnread}</Badge>}
          </div>
        </div>
      </div>
      <div className="flex gap-0 h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm mt-4">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col flex-shrink-0">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <p className="font-semibold text-slate-900">Conversaciones activas</p>
            </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Buscar viaje o conductor..." className="pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredRides.map((ride: any) => {
            const msgs = allMessages.filter((m: any) => m.ride_id === ride.id).sort((a: any, b: any) => (b.id || "").localeCompare(a.id || ""));
            const lastMsg = msgs[0];
            const unread = getUnreadCount(ride.id);
            const isSelected = selectedRideId === ride.id;
            return (
              <button
                key={ride.id}
                onClick={() => setSelectedRideId(ride.id)}
                className={`w-full p-3 text-left border-b hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{ride.passenger_name}</p>
                      {unread > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{unread}</span>}
                    </div>
                    <p className="text-xs text-blue-600">{ride.driver_name || "Sin conductor"}</p>
                    {lastMsg && <p className="text-xs text-slate-400 truncate mt-0.5">{lastMsg.sender_role === "admin" ? "Tú: " : ""}{lastMsg.message}</p>}
                    {!lastMsg && <p className="text-xs text-slate-300 italic mt-0.5">Sin mensajes aún</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={ride.status} />
                    {lastMsg && <span className="text-xs text-slate-300">—</span>}
                  </div>
                </div>
              </button>
            );
          })}
          {rides.filter((r: any) => r.driver_id).length === 0 && (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay viajes activos con conductor asignado</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      {selectedRide ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{selectedRide.passenger_name}</p>
              <p className="text-xs text-slate-500">{selectedRide.driver_name} · {selectedRide.pickup_address}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedRide.status} />
              <button
                onClick={() => setShowBlockedWordsSettings(v => !v)}
                className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors"
                title="Palabras bloqueadas"
              >🚫 Filtros</button>
            </div>
          </div>
          {showBlockedWordsSettings && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 space-y-2">
              <p className="text-xs font-semibold text-amber-800">🚫 Palabras bloqueadas</p>
              <div className="flex gap-2">
                <input
                  value={newBlockedWord}
                  onChange={e => setNewBlockedWord(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addBlockedWord()}
                  placeholder="Agregar palabra..."
                  className="flex-1 border border-amber-200 rounded-lg px-2 py-1 text-xs"
                />
                <button onClick={addBlockedWord} className="bg-amber-600 text-white text-xs px-3 rounded-lg font-medium">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {blockedWords.map((w: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                    {w}
                    <button onClick={() => removeBlockedWord(w)} className="hover:text-red-900">×</button>
                  </span>
                ))}
                {blockedWords.length === 0 && <span className="text-xs text-amber-600 italic">Sin palabras bloqueadas</span>}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedMessages.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                Sin mensajes aún. Inicia la conversación.
              </div>
            )}
            {selectedMessages.map((msg: any) => {
              const isAdmin = msg.sender_role === "admin";
              const isRead = isAdmin && msg.read_by_driver;
              const isPassenger = msg.sender_role === "passenger";
              return (
                <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    isAdmin ? "bg-slate-900 text-white rounded-br-sm" :
                    isPassenger ? "bg-violet-100 text-violet-900 rounded-bl-sm" :
                    "bg-slate-100 text-slate-900 rounded-bl-sm"
                  }`}>
                    {!isAdmin && <p className={`text-xs font-semibold mb-1 ${isPassenger ? "text-violet-600" : "text-blue-600"}`}>
                      {msg.sender_name || (isPassenger ? "Pasajero" : "Conductor")}
                    </p>}
                    <p>{msg.message}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className={`text-xs ${isAdmin ? "text-slate-400" : "text-slate-400"}`}>—</span>
                      {isAdmin && (
                        <span className={`text-xs font-semibold ${isRead ? "text-blue-400" : "text-slate-400"}`}>
                          {isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white flex gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-xl"
            />
            <Button onClick={sendMessage} disabled={!messageText.trim() || sending} className="bg-slate-900 hover:bg-slate-800 rounded-xl px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <MessageCircle className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Selecciona un viaje para chatear</p>
            <p className="text-sm text-slate-400 mt-1">Los mensajes son en tiempo real con el conductor</p>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}

"use client"

import React, { ReactNode, useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"
import { Toaster } from "@/components/ui/toaster"

interface RootClientLayoutProps {
  children: ReactNode
}

export function RootClientLayout({ children }: RootClientLayoutProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearStaleOfflineState = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
      } catch {
        return;
      }
    };

    void clearStaleOfflineState();
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}

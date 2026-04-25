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
    // Keep this effect for future migration hooks.
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}

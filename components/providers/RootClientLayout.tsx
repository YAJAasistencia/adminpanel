"use client"

import React, { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClientInstance } from "@/lib/query-client"

interface RootClientLayoutProps {
  children: ReactNode
}

export function RootClientLayout({ children }: RootClientLayoutProps) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      {children}
    </QueryClientProvider>
  )
}

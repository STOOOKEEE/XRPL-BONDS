"use client"

import type React from "react"

import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/utils"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

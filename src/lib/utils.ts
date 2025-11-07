"use client"

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { QueryClient } from "@tanstack/react-query"

// ============================================================================
// TAILWIND UTILITIES
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// REACT QUERY CLIENT
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

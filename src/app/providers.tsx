"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          {children}
          <Toaster />
          <Sonner
            position="bottom-right"
            offset={{ right: 32, bottom: 24 }}
            mobileOffset={{ right: 16, bottom: 16, left: 16 }}
            style={{ "--width": "400px" } as CSSProperties}
          />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

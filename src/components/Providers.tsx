"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "./TRPCProvider";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SessionProvider>
        <TRPCProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TRPCProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

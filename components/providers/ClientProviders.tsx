"use client";

import { FC, ReactNode, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import { SolanaWalletProvider } from "@/components/providers/SolanaWalletProvider";
import { Toaster } from "@/components/ui/sonner";

interface ClientProvidersProps {
  children: ReactNode;
}

export const ClientProviders: FC<ClientProvidersProps> = ({ children }) => {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SolanaWalletProvider>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SolanaWalletProvider>
    </ThemeProvider>
  );
};

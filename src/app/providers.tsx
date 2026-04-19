"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { I18nProvider } from "@/hooks/useI18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        // Don't refetch when window regains focus — avoids waterfall on tab switch
        refetchOnWindowFocus: false,
        // Keep data in cache for 10 minutes after component unmounts
        gcTime: 1000 * 60 * 10,
      },
    },
  }));
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      // Suppress expected HTTP status codes that are handled at the component level
      const status = reason?.response?.status ?? reason?.status;
      if (status === 401 || status === 404) return;
      // Suppress AbortErrors from intentionally cancelled requests
      if (reason?.name === "AbortError") return;
      console.error("[TrainIQ] Unhandled rejection:", reason);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <I18nProvider>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </I18nProvider>
  );
}

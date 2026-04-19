"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { LayoutGrid, Dumbbell, MessageCircle, UtensilsCrossed, Activity, Settings, TrendingUp } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { WatchRealtimeSync } from "@/components/WatchRealtimeSync";
import { useAuthStore } from "@/store/auth";

const tabs = [
  { href: "/dashboard",     icon: LayoutGrid,     label: "Dashboard" },
  { href: "/training",      icon: Dumbbell,       label: "Training" },
  { href: "/chat",          icon: MessageCircle,  label: "Coach" },
  { href: "/ernaehrung",    icon: UtensilsCrossed,label: "Ernährung" },
  { href: "/metriken",      icon: Activity,       label: "Metriken" },
  { href: "/fitness",       icon: TrendingUp,     label: "Fitness" },
  { href: "/einstellungen", icon: Settings,       label: "Einstellungen" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const isChecked = useAuthStore((s) => s.isChecked);

  useEffect(() => {
    // Guest sessions are created automatically on the root page (/).
    // The app layout never redirects to login.
  }, [isChecked, token]);

  // Render nothing until auth state is known to avoid flash of content
  if (!isChecked) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center" role="status" aria-label="Authentifizierung wird geprüft">
        <div className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-sm mx-auto">
      <OfflineIndicator />
      {token && <WatchRealtimeSync />}
      <main className="flex-1 pb-[64px]">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation */}
      <nav aria-label="Hauptnavigation" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-bg border-t border-border z-50">
        <div className="flex">
          {tabs.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 flex items-center justify-center py-4 transition-colors ${
                  isActive ? "border-t-2 border-t-blue text-textMain" : "text-textDim"
                }`}
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

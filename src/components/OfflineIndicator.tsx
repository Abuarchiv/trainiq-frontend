"use client";
import { useOffline } from "@/hooks/useOffline";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const { isOffline, syncing, syncCount, manualSync } = useOffline();

  if (!isOffline && syncCount === 0) return null;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-50">
      {isOffline ? (
        <div className="flex items-center justify-between px-4 py-2 bg-bg border-b border-border">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-danger" />
            <span className="text-xs font-sans text-textDim tracking-wider">
              Offline — Plan weiterhin verfügbar
            </span>
          </div>
          <button
            onClick={manualSync}
            disabled={syncing}
            className="text-textDim hover:text-blue transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          </button>
        </div>
      ) : syncCount > 0 ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-blueDim border-b border-border fade-up">
          <Wifi size={14} className="text-blue" />
          <span className="text-xs font-sans text-blue tracking-wider">
            {syncCount} Aktion{syncCount !== 1 ? "en" : ""} synchronisiert ✓
          </span>
        </div>
      ) : null}
    </div>
  );
}

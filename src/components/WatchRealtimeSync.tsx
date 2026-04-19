"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useWatchRealtime, type WatchSyncEvent } from "@/hooks/useWatchRealtime";

interface ToastState {
  id: number;
  event: WatchSyncEvent;
}

/**
  * Lauscht auf Garmin/Watch-Webhook-Events und zeigt eine kurze Benachrichtigung,
 * wenn eine neue Aktivität automatisch synchronisiert wurde.
 * Wird einmal im AppLayout eingebunden.
 */
export function WatchRealtimeSync() {
  const { lastEvent } = useWatchRealtime();
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!lastEvent || lastEvent.event !== "activity_synced") return;

    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, event: lastEvent }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, event }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-[#1C1C1C] border border-border text-textMain px-4 py-3 flex items-center gap-3 shadow-lg"
          >
            <CheckCircle2 size={16} className="text-blue shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-sans tracking-widest uppercase text-textMain truncate">
                {event.workout_type ?? "Aktivität"} synchronisiert
              </p>
              {event.activity_date && (
                <p className="text-[10px] font-sans text-textDim mt-0.5">
                  {new Date(event.activity_date).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  {event.duration_min ? ` · ${event.duration_min} min` : ""}
                </p>
              )}
            </div>
            <span className="text-[10px] font-sans text-textDim shrink-0 capitalize">
              {event.provider ?? ""}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

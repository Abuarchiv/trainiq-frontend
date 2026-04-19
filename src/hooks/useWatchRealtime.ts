"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

export interface WatchSyncEvent {
  event: string;
  provider?: string;
  activity_date?: string;
  workout_type?: string;
  duration_min?: number;
}

/**
 * Öffnet eine persistente SSE-Verbindung zum Backend.
  * Sobald Garmin, Polar o.ä. eine Aktivität synchronisiert, werden
 * Metriken und Trainingsplan automatisch neu geladen.
 *
 * Reconnect mit exponential backoff bei Verbindungsabbruch.
 */
export function useWatchRealtime() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(2000);
  const [lastEvent, setLastEvent] = useState<WatchSyncEvent | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!token) return;

    // Bereits verbunden
    if (esRef.current && esRef.current.readyState !== EventSource.CLOSED) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";
    const url = `${apiBase}/tasks/watch-stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      retryDelayRef.current = 2000; // Reset backoff on success
    };

    es.onmessage = (e) => {
      try {
        const data: WatchSyncEvent = JSON.parse(e.data);
        if (data.event === "activity_synced") {
          setLastEvent(data);
          qc.invalidateQueries({ queryKey: ["training-week"] });
          qc.invalidateQueries({ queryKey: ["metrics-today"] });
          qc.invalidateQueries({ queryKey: ["metrics-recovery"] });
          qc.invalidateQueries({ queryKey: ["metrics-week"] });
          qc.invalidateQueries({ queryKey: ["training-stats"] });
          qc.invalidateQueries({ queryKey: ["achievements"] });
        }
      } catch {
        // Parse-Fehler ignorieren (Keepalive-Leerzeilen etc.)
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      const delay = Math.min(retryDelayRef.current, 30000);
      retryDelayRef.current = Math.min(delay * 2, 30000);
      retryRef.current = setTimeout(connect, delay);
    };
  }, [qc, token]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);

  return { lastEvent };
}


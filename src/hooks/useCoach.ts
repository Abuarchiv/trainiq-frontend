"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface GuestLimits {
  messagesRemaining: number | null;
  photosRemaining: number | null;
  isGuest: boolean;
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [guestLimits, setGuestLimits] = useState<GuestLimits>({
    messagesRemaining: null,
    photosRemaining: null,
    isGuest: false,
  });

  const token = useAuthStore((s) => s.token);
  const isGuest = !token;

  // Ref to abort in-flight SSE streams when component unmounts or new send starts
  const abortRef = useRef<AbortController | null>(null);

  // Gast-Limits laden
  useEffect(() => {
    if (!isGuest) return;
    const guestToken = localStorage.getItem("guest_token");
    if (!guestToken) return;

    const controller = new AbortController();
    api.get(`/guest/session/${guestToken}`, { signal: controller.signal })
      .then((res) => {
        setGuestLimits({
          messagesRemaining: res.data.messages_remaining,
          photosRemaining: res.data.photos_remaining,
          isGuest: true,
        });
      })
      .catch(() => {
        // Guest limits unavailable — UI continues without limit display
      });
    return () => controller.abort();
  }, [isGuest]);

  // Chat-Historie beim Start laden (nur für eingeloggte User)
  useEffect(() => {
    if (isGuest) {
      setHistoryLoading(false);
      return;
    }
    const controller = new AbortController();
    api.get("/coach/history", { signal: controller.signal })
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(
            data.map((m: { role: string; content: string; created_at: string }, i: number) => ({
              id: `history-${i}`,
              role: m.role as "user" | "assistant",
              content: m.content,
              created_at: m.created_at,
            }))
          );
        }
      })
      .catch(() => {
        // History unavailable — empty start is acceptable
      })
      .finally(() => {
        setHistoryLoading(false);
      });
    return () => controller.abort();
  }, [isGuest]);

  // Abort any open stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsError(false);
    const userMsg: Message = {
      id: newId(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", created_at: new Date().toISOString() },
    ]);

    try {
      const currentToken = useAuthStore.getState().token;
      const guestToken = localStorage.getItem("guest_token");
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
      } else if (guestToken) {
        headers["X-Guest-Token"] = guestToken;
      }

      const res = await fetch(`${baseURL}/coach/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = typeof err.detail === "string"
          ? err.detail
          : Array.isArray(err.detail)
            ? err.detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(", ")
            : String(err.detail || "");
        if (res.status === 403 && detail.includes("Gast-Limit")) {
          setGuestLimits((prev) => ({ ...prev, messagesRemaining: 0 }));
          throw new Error("LIMIT_REACHED");
        }
        throw new Error(detail || "Request failed");
      }

      const remaining = res.headers.get("X-Guest-Messages-Remaining");
      if (remaining !== null) {
        setGuestLimits((prev) => ({
          ...prev,
          messagesRemaining: parseInt(remaining, 10),
        }));
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        let buffer = "";
        let streamDone = false;
        try {
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              const dataLines = event
                .split("\n")
                .filter((l) => l.startsWith("data: "))
                .map((l) => l.slice(6));

              const data = dataLines.join("\n");
              if (data === "[DONE]") { streamDone = true; break; }
              if (!data) continue;

              full += data;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
              );
            }
          }
        } finally {
          reader.cancel();
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setIsError(true);
      const msg = err instanceof Error ? err.message : "";
      const errorMsg = msg === "LIMIT_REACHED"
        ? "Gast-Limit erreicht. Bitte registrieren für mehr Nachrichten."
        : "Verbindungsfehler. Bitte versuche es erneut.";
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: errorMsg } : m))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const sendImage = useCallback(async (file: File) => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsError(false);

    const userMsgId = newId();
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: "Foto hochgeladen — analysiere Mahlzeit...",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", created_at: new Date().toISOString() },
    ]);

    try {
      const currentToken = useAuthStore.getState().token;
      const guestToken = localStorage.getItem("guest_token");
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

      const form = new FormData();
      form.append("file", file);
      form.append("meal_type", "Mahlzeit");

      const uploadHeaders: Record<string, string> = {};
      if (currentToken) {
        uploadHeaders["Authorization"] = `Bearer ${currentToken}`;
      } else if (guestToken) {
        uploadHeaders["X-Guest-Token"] = guestToken;
      }

      const uploadResp = await fetch(`${baseURL}/nutrition/upload`, {
        method: "POST",
        headers: uploadHeaders,
        body: form,
        signal: controller.signal,
      });

      if (!uploadResp.ok) {
        const err = await uploadResp.json().catch(() => ({}));
        if (uploadResp.status === 403 && err.detail?.includes("Gast-Limit")) {
          setGuestLimits((prev) => ({ ...prev, photosRemaining: 0 }));
          throw new Error("PHOTO_LIMIT_REACHED");
        }
        throw new Error("Upload fehlgeschlagen");
      }

      const analysis = await uploadResp.json();

      if (analysis.photos_remaining !== undefined) {
        setGuestLimits((prev) => ({ ...prev, photosRemaining: analysis.photos_remaining }));
      }

      const extraContext = [
        `Mahlzeit analysiert: ${analysis.meal_name || "Unbekannt"}`,
        `Kalorien: ${Math.round(analysis.calories || 0)} kcal`,
        `Protein: ${Math.round(analysis.protein_g || 0)}g`,
        `Kohlenhydrate: ${Math.round(analysis.carbs_g || 0)}g`,
        `Fett: ${Math.round(analysis.fat_g || 0)}g`,
        `Erkennungsgenauigkeit: ${analysis.confidence || "unbekannt"}`,
      ].join(", ");

      const chatHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (currentToken) {
        chatHeaders["Authorization"] = `Bearer ${currentToken}`;
      } else if (guestToken) {
        chatHeaders["X-Guest-Token"] = guestToken;
      }

      const res = await fetch(`${baseURL}/coach/chat`, {
        method: "POST",
        headers: chatHeaders,
        body: JSON.stringify({
          message: "Ich habe gerade eine Mahlzeit fotografiert. Was hältst du davon im Kontext meines Trainings?",
          extra_context: extraContext,
        }),
        signal: controller.signal,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId
            ? { ...m, content: `📷 ${analysis.meal_name || "Mahlzeit"} — ${Math.round(analysis.calories || 0)} kcal` }
            : m
        )
      );

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        let buffer = "";
        let streamDone = false;
        try {
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              const dataLines = event
                .split("\n")
                .filter((l) => l.startsWith("data: "))
                .map((l) => l.slice(6));

              const data = dataLines.join("\n");
              if (data === "[DONE]") { streamDone = true; break; }
              if (!data) continue;

              full += data;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
              );
            }
          }
        } finally {
          reader.cancel();
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setIsError(true);
      const msg = err instanceof Error ? err.message : "";
      const errorMsg = msg === "PHOTO_LIMIT_REACHED"
        ? "Gast-Limit erreicht. Bitte registrieren für mehr Foto-Uploads."
        : "Bild konnte nicht analysiert werden. Bitte versuche es erneut.";
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: errorMsg } : m))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, loading, historyLoading, isError, sendMessage, sendImage, guestLimits, clearMessages };
}


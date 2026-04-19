"use client";
import { useState, useRef, useEffect } from "react";
import { useCoach } from "@/hooks/useCoach";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Camera, Trash2, LogIn } from "lucide-react";
import { ChatLoadingSkeleton } from "@/components/ui/skeleton";
import DOMPurify from "dompurify";

const QUICK_REPLIES = ["Warum?", "Plan ändern", "Ruhetag", "Wochenziel", "Ernährungstipp"];
const SUGGESTIONS = [
  "Wie ist mein Recovery heute?",
  "Erstelle mir einen Trainingsplan für diese Woche",
  "Was sollte ich vor dem Training essen?"
];

function formatContent(text: string): string {
  if (!text) return "";
  const html = text
    .replace(/^### (.+)$/gm, '<div class="text-xs font-sans font-bold uppercase tracking-wider text-blue mt-2 mb-1">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="text-sm font-sans font-bold uppercase tracking-wider text-blue border-b border-border pb-1 mt-3 mb-1">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-textMain">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-textDim">$1</em>')
    .replace(/^[-•] (.+)$/gm, '<div class="flex gap-2 ml-2"><span class="text-blue shrink-0">›</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 ml-2"><span class="text-blue font-bold shrink-0">$1.</span><span>$2</span></div>')
    .replace(/^---$/gm, '<hr class="border-border my-2" />')
    .replace(/\n/g, '<br />');
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['span', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'div', 'hr'],
    ALLOWED_ATTR: ['class', 'style'],
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}


export default function ChatPage() {
  const router = useRouter();
  const { messages, loading, historyLoading, isError, sendMessage, sendImage, guestLimits, clearMessages } = useCoach();
  const [input, setInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scrollBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollBottom(); }, [messages, loading]);

  // Upgrade-Prompt zeigen wenn Limit erreicht
  useEffect(() => {
    if (guestLimits.isGuest && guestLimits.messagesRemaining === 0) {
      setShowUpgradePrompt(true);
    }
  }, [guestLimits]);

  const handleSend = () => {
    if (!input.trim() || loading || input.length > 2000) return;
    if (guestLimits.isGuest && guestLimits.messagesRemaining === 0) {
      setShowUpgradePrompt(true);
      return;
    }
    sendMessage(input.trim());
    setInput("");
  };

  const [deleteError, setDeleteError] = useState(false);

  const handleDeleteHistory = async () => {
    setDeleteError(false);
    try {
      await api.delete("/coach/history");
      clearMessages();
      setShowDeleteConfirm(false);
    } catch {
      setDeleteError(true);
      setShowDeleteConfirm(false);
      setTimeout(() => setDeleteError(false), 3000);
    }
  };

  const limitReached = guestLimits.isGuest && guestLimits.messagesRemaining === 0;

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Gast-Banner */}
      {guestLimits.isGuest && (
        <div className="px-5 py-2 border-b border-border bg-surface text-center">
          <p className="text-[10px] font-mono tracking-widest text-textDim">
            GAST-MODUS — {guestLimits.messagesRemaining ?? "?"} Nachrichten & {guestLimits.photosRemaining ?? "?"} Fotos übrig
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <span className="font-pixel text-blue text-xl">COACH</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-wider text-blue">AKTIV</span>
          {messages.length > 0 && !guestLimits.isGuest && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-textDim hover:text-danger transition-colors"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
          {guestLimits.isGuest && (
            <button
              onClick={() => router.push("/register")}
              className="text-xs font-sans text-blue border border-blue px-2 py-1 hover:bg-blue/10 transition-colors"
            >
              <LogIn size={12} className="inline mr-1" />
              Registrieren
            </button>
          )}
        </div>
      </div>

      {/* Upgrade-Prompt */}
      {showUpgradePrompt && (
        <div className="px-5 py-4 border-b border-border bg-surface">
          <p className="font-pixel text-blue text-sm mb-2">GAST-LIMIT ERREICHT</p>
          <p className="text-xs font-sans text-textDim mb-3">
            Registriere dich kostenlos für unbegrenzte Nachrichten, Chat-Verlauf und erweiterte Features.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2"
            >
              Schließen
            </button>
            <button
              onClick={() => router.push("/register")}
              className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-2 hover:bg-blue/10 transition-colors"
            >
              Kostenlos registrieren
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="px-5 py-3 border-b border-border bg-surface">
          <p className="text-xs font-sans text-textDim tracking-widest uppercase mb-3">Chatverlauf löschen?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDeleteHistory}
              className="flex-1 border border-danger text-danger text-xs tracking-widest uppercase font-sans py-2 hover:bg-red-50 transition-colors"
            >
              Löschen
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 flex flex-col gap-4 bg-bg" style={{ paddingBottom: 170 }}>
        {historyLoading && <ChatLoadingSkeleton />}

        {messages.length === 0 && !historyLoading && (
          <div className="border border-dashed border-border p-5 mb-4">
             <p className="font-pixel text-blue text-sm mb-2">COACH BEREIT</p>
             <p className="text-sm font-sans text-textDim leading-relaxed mb-4">
                Frag mich nach deinem Plan, deiner Erholung oder Ernährung. Hier sind Vorschläge:
             </p>
             <div className="flex flex-col gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => { if (!loading && !limitReached) { sendMessage(s); } }} disabled={loading || limitReached} className="text-left border border-border px-3 py-2 text-xs font-sans text-textMain hover:border-blue transition-colors disabled:opacity-40">
                    › {s}
                  </button>
                ))}
             </div>
          </div>
        )}
        
        {isError && (
          <div className="border border-danger p-3 mb-2 text-center fade-up">
            <p className="text-xs font-sans text-danger uppercase tracking-widest">Coach aktuell nicht verfügbar</p>
          </div>
        )}

        {deleteError && (
          <div className="border border-danger p-3 mb-2 text-center fade-up">
            <p className="text-xs font-sans text-danger uppercase tracking-widest">Chatverlauf konnte nicht gelöscht werden</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 items-start fade-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 border border-border flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-pixel text-blue text-xs">C</span>
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`border p-3 text-sm font-sans leading-relaxed ${msg.role === "assistant" ? "border-border bg-surface text-textMain" : "border-border text-textMain"}`}>
                {msg.role === "assistant" ? (
                  msg.content === "" ? (
                    <span className="inline-flex items-center gap-2 text-textDim text-xs tracking-widest">
                      <span>DENKT</span>
                      <span className="inline-flex gap-0.5">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                      </span>
                    </span>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                  )
                ) : (
                  msg.content
                )}
              </div>
              <span className="text-xs text-textDim font-sans mt-1">{formatTime(msg.created_at)}</span>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Fixed bottom area */}
      <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-sm bg-bg border-t border-border">
        {/* Quick Replies */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {QUICK_REPLIES.map((r) => (
            <button
              key={r}
              onClick={() => sendMessage(r)}
              disabled={loading || limitReached}
              className="shrink-0 border border-border text-xs font-sans text-textDim px-3 py-1.5 tracking-wider hover:border-blue hover:text-blue transition-colors disabled:opacity-40"
            >
              {r}
            </button>
          ))}
        </div>
        {/* Input */}
        <div className="flex gap-3 items-center px-4 py-3 border-t border-border">
          <div className="flex-1 flex items-center gap-2 border border-border px-3 py-2">
            <span className="text-blue font-mono text-sm">›</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={limitReached ? "Limit erreicht..." : "Nachricht..."}
              disabled={limitReached}
              className="flex-1 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none disabled:opacity-50"
            />
            <span className="cursor-blink text-blue font-mono text-sm">_</span>
            {input.length > 1800 && (
              <span className="text-[10px] font-sans text-danger shrink-0">
                {2000 - input.length}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={limitReached || (guestLimits.isGuest && (guestLimits.photosRemaining ?? 0) <= 0)}
            className="border border-border p-2 hover:border-blue transition-colors disabled:opacity-40"
          >
            <Camera size={18} strokeWidth={1.5} className="text-textDim" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                e.target.value = "";
                await sendImage(file);
              }
            }}

            className="hidden"
          />
        </div>
      </div>

    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } catch {
      // Immer "ok" zeigen (Server gibt kein Hinweis ob Email existiert)
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-pixel text-blue" style={{ fontSize: 48 }}>TRAINIQ</span>
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mt-2">Passwort zurücksetzen</p>
        </div>

        {sent ? (
          <div className="border border-blue p-5 text-center fade-up">
            <p className="font-pixel text-blue text-sm mb-2">E-MAIL GESENDET</p>
            <p className="text-xs font-sans text-textDim leading-relaxed">
              Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Reset-Link geschickt.
            </p>
            <Link href="/login" className="block mt-4 text-xs font-sans text-blue hover:underline">
              ← Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="border border-border">
              <input
                type="email"
                placeholder="Deine E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "› Reset-Link senden"}
            </button>
            <Link href="/login" className="text-xs font-sans text-textDim text-center hover:text-blue transition-colors">
              ← Zurück zum Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

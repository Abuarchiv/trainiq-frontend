"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Ungültiger oder fehlender Reset-Token.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      setDone(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Reset fehlgeschlagen. Der Link ist möglicherweise abgelaufen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-pixel text-blue" style={{ fontSize: 48 }}>TRAINIQ</span>
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mt-2">Neues Passwort setzen</p>
        </div>

        {done ? (
          <div className="border border-blue p-5 text-center fade-up">
            <p className="font-pixel text-blue text-sm mb-2">PASSWORT GEÄNDERT</p>
            <p className="text-xs font-sans text-textDim leading-relaxed">
              Dein Passwort wurde erfolgreich zurückgesetzt. Du wirst weitergeleitet…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!token && (
              <p className="text-xs font-sans text-danger tracking-wider">
                ! Kein gültiger Reset-Link. Bitte fordere einen neuen Link an.
              </p>
            )}

            {error && (
              <p className="text-xs font-sans text-danger tracking-wider">! {error}</p>
            )}

            <div className="border border-border">
              <input
                type="password"
                placeholder="Neues Passwort (mind. 8 Zeichen)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
              />
            </div>

            <div className="border border-border">
              <input
                type="password"
                placeholder="Passwort bestätigen"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "› Passwort zurücksetzen"}
            </button>

            <Link
              href="/forgot-password"
              className="text-xs font-sans text-textDim text-center hover:text-blue transition-colors"
            >
              ← Neuen Reset-Link anfordern
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

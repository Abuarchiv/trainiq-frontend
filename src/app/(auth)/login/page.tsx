"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const SOCIAL_PROVIDERS = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.access_token, data.user);
      router.replace("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(Array.isArray(detail) ? detail.map((e: any) => e.msg || e).join(", ") : String(detail));
      } else if (status === 401 || status === 403) {
        setError("E-Mail oder Passwort falsch.");
      } else if (status === 429) {
        setError("Zu viele Versuche. Bitte kurz warten.");
      } else if (status && status >= 500) {
        setError("Server nicht erreichbar. Bitte später erneut versuchen.");
      } else {
        setError("Login fehlgeschlagen.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    try {
      const { data } = await api.get(`/auth/oauth/${provider}/login`);
      window.location.href = data.auth_url;
    } catch {
      setError("Anmeldung nicht verfügbar. Bitte E-Mail nutzen.");
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-pixel text-blue" style={{ fontSize: 48 }}>TRAINIQ</span>
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mt-2">Dein KI Trainingscoach</p>
        </div>

        {error && (
          <p className="text-xs font-sans text-danger tracking-wider mb-4" role="alert">! {error}</p>
        )}

        <div className="flex flex-col gap-2 mb-6">
          {SOCIAL_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={!!socialLoading}
              onClick={() => handleSocialLogin(p.id)}
              className="w-full flex items-center justify-center gap-3 border border-border text-textMain text-xs tracking-wider font-sans py-3 hover:border-blue hover:text-blue transition-colors disabled:opacity-50"
            >
              {socialLoading === p.id ? (
                <span className="opacity-50">...</span>
              ) : (
                <>{p.icon}<span>Weiter mit {p.label}</span></>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs font-sans text-textDim uppercase tracking-widest">oder</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="border border-border">
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
            />
          </div>
          <div className="border border-border">
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "› Einloggen"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-6">
          <Link href="/forgot-password" className="text-xs font-sans text-blue hover:underline">
            Passwort vergessen?
          </Link>
          <p className="text-xs font-sans text-textDim">
            Noch kein Konto?{" "}
            <Link href="/register" className="text-blue hover:underline">Jetzt registrieren</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

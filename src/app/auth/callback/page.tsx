"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Kein Autorisierungscode erhalten.");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    api
      .post("/auth/keycloak/callback", { code, redirect_uri: redirectUri })
      .then(({ data }) => {
        setAuth(data.access_token, data.user);
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("[TrainIQ] OAuth callback failed:", err);
        setError("Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
      });
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <span className="font-pixel text-blue" style={{ fontSize: 40 }}>TRAINIQ</span>
          <p className="text-xs tracking-widest uppercase text-danger font-sans mt-6">! {error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-6 w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors"
          >
            › Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <span className="font-pixel text-blue" style={{ fontSize: 40 }}>TRAINIQ</span>
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mt-6 animate-pulse">
          · Anmeldung wird abgeschlossen …
        </p>
      </div>
    </div>
  );
}

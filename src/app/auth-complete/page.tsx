"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

/**
 * Transient page: reads the auth token from the short-lived cookie set by
 * /api/auth/callback, stores it in localStorage via the auth store, clears
 * the cookie, and redirects to /dashboard.
 */
export default function AuthCompletePage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));
      return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
    };

    const clearCookie = (name: string) => {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    };

    const token = getCookie("_kc_token");
    const userRaw = getCookie("_kc_user");

    if (!token || !userRaw) {
      router.replace("/login?error=session_lost");
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      setAuth(token, { id: user.id, email: user.email, name: user.name });
      clearCookie("_kc_token");
      clearCookie("_kc_user");

      // First-time login → onboarding, otherwise dashboard
      const isNew = !localStorage.getItem("onboarding_done");
      router.replace(isNew ? "/onboarding" : "/dashboard");
    } catch {
      router.replace("/login?error=invalid_session");
    }
  }, [router, setAuth]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="font-pixel text-blue text-3xl">
        TRAINIQ<span className="cursor-blink">_</span>
      </span>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const initSession = async () => {
      const token = localStorage.getItem("token");
      const guestToken = localStorage.getItem("guest_token");

      if (token) {
        router.replace("/dashboard");
        return;
      }

      if (guestToken) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/guest/session/${guestToken}`,
            { signal }
          );
          if (res.ok) {
            router.replace("/dashboard");
            return;
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/guest/session`,
          { method: "POST", signal }
        );
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("guest_token", data.guest_token);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }

      // Always go to dashboard — even if guest session creation failed, never show login
      router.replace("/dashboard");
    };

    initSession();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="font-pixel text-blue text-4xl">
        TRAINIQ<span className="cursor-blink">_</span>
      </span>
    </div>
  );
}

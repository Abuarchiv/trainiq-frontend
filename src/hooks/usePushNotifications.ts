"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    navigator.serviceWorker?.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscribed(!!sub);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const subscribe = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

      if (!vapidKey) {
        console.warn("NEXT_PUBLIC_VAPID_KEY not set — push notifications disabled");
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const keyToBase64 = (key: ArrayBuffer | null): string => {
        if (!key) return "";
        const bytes = new Uint8Array(key);
        return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
      };

      await api.post("/notifications/subscribe", {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keyToBase64(subscription.getKey("p256dh")),
          auth: keyToBase64(subscription.getKey("auth")),
        },
      });

      setSubscribed(true);
      return true;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.post("/notifications/unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      return true;
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
      return false;
    }
  }, []);

  return {
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    supported: typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator,
  };
}

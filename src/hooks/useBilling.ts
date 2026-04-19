"use client";
import { useState, useCallback } from "react";
import api from "@/lib/api";

export interface Subscription {
  tier: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
}

export function useBilling() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Subscription>("/billing/subscription");
      setSubscription(data);
    } catch (e) {
      setError("Abonnement konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCheckout = useCallback(async (priceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout", {
        price_id: priceId,
      });
      window.location.href = data.url;
    } catch (e) {
      setError("Checkout konnte nicht gestartet werden");
    } finally {
      setLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ url: string }>("/billing/portal");
      window.location.href = data.url;
    } catch (e) {
      setError("Portal konnte nicht geöffnet werden");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subscription,
    loading,
    error,
    fetchSubscription,
    createCheckout,
    openPortal,
  };
}

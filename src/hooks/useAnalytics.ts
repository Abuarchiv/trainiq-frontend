/**
 * useAnalytics — native Fitness, Bestzeiten, Ausrüstung.
 * Daten kommen aus unserer eigenen DB (no Strava API needed).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FitnessDay {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  tss: number;
}

export interface FitnessData {
  current: { ctl: number; atl: number; tsb: number };
  history: FitnessDay[];
  calculated_at: string | null;
}

export interface PersonalRecord {
  id: string;
  distance_label: string;
  elapsed_time_s: number;
  achieved_date: string | null;
  source: string;
  notes: string | null;
}

export interface GearItem {
  id: string;
  gear_type: string;
  name: string;
  brand: string | null;
  model: string | null;
  purchase_date: string | null;
  initial_km: number;
  retired: boolean;
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Fitness & Freshness (CTL / ATL / TSB)
// ---------------------------------------------------------------------------
export function useFitness(days = 90) {
  return useQuery<FitnessData>({
    queryKey: ["analytics", "fitness", days],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/fitness?days=${days}`);
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 Minuten
  });
}

export function useRefreshFitness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get("/analytics/fitness?refresh=true");
      return data as FitnessData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "fitness"] }),
  });
}

// ---------------------------------------------------------------------------
// Personal Records
// ---------------------------------------------------------------------------
export function usePersonalRecords() {
  return useQuery<PersonalRecord[]>({
    queryKey: ["analytics", "personal-records"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/personal-records");
      return data;
    },
  });
}

export function useSyncPRsFromWatches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/analytics/personal-records/sync-from-watches");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "personal-records"] }),
  });
}

export function useUpsertPR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      distance_label,
      elapsed_time_s,
      achieved_date,
      notes,
    }: {
      distance_label: string;
      elapsed_time_s: number;
      achieved_date?: string;
      notes?: string;
    }) => {
      const { data } = await api.put(
        `/analytics/personal-records/${distance_label}`,
        { elapsed_time_s, achieved_date, notes }
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "personal-records"] }),
  });
}

export function useDeletePR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (distance_label: string) => {
      await api.delete(`/analytics/personal-records/${distance_label}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "personal-records"] }),
  });
}

// ---------------------------------------------------------------------------
// Gear / Ausrüstung
// ---------------------------------------------------------------------------
export function useGear() {
  return useQuery<GearItem[]>({
    queryKey: ["analytics", "gear"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/gear");
      return data;
    },
  });
}

export function useCreateGear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      gear_type: string;
      name: string;
      brand?: string;
      model?: string;
      purchase_date?: string;
      initial_km?: number;
      notes?: string;
    }) => {
      const { data } = await api.post("/analytics/gear", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "gear"] }),
  });
}

export function useUpdateGear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<GearItem> & { id: string }) => {
      const { data } = await api.patch(`/analytics/gear/${id}`, patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "gear"] }),
  });
}

export function useDeleteGear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/analytics/gear/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytics", "gear"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cachePlans, getCachedPlans, queueAction } from "@/lib/offline";

export interface TrainingPlanItem {
  id: string;
  date: string;
  sport: string;
  workout_type: string;
  duration_min: number | null;
  intensity_zone: number | null;
  target_hr_min: number | null;
  target_hr_max: number | null;
  description: string | null;
  coach_reasoning: string | null;
  status: string;
}

const SPORTS: Record<string, string> = {
  running: "LAUFEN", cycling: "RADFAHREN", swimming: "SCHWIMMEN", rest: "PAUSE",
  // Garmin typeKey values
  road_biking: "RADFAHREN", mountain_biking: "MTB", indoor_cycling: "RADFAHREN",
  open_water_swimming: "SCHWIMMEN", pool_swimming: "SCHWIMMEN",
  trail_running: "TRAIL", treadmill_running: "LAUFBAND",
  strength_training: "KRAFT", weight_training: "KRAFT",
  yoga: "YOGA", hiit: "HIIT", cardio_training: "CARDIO",
  walking: "GEHEN", hiking: "WANDERN",
  rowing: "RUDERN", kayaking: "KAJAK",
  soccer: "FUSSBALL", tennis: "TENNIS", basketball: "BASKETBALL",
  skiing: "SKI", snowboarding: "SNOWBOARD",
  other: "TRAINING", workout: "TRAINING", imported: "IMPORTIERT",
};

function getDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function generateEmptyWeek() {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `empty-${i}`, date: getDate(i - 3), sport: "rest", workout_type: "—",
    duration_min: 0, intensity_zone: null, target_hr_min: null, target_hr_max: null,
    description: null, coach_reasoning: null, status: "planned",
  }));
}

export { SPORTS, getDate, getMonday };

export function useTraining() {
  const qc = useQueryClient();

  const week = useQuery({
    queryKey: ["training-week"],
    queryFn: async () => {
      try {
        const data = await api.get("/training/plan", { params: { week: getMonday() } }).then((r) => r.data);
        cachePlans(data).catch(() => {});
        return data as TrainingPlanItem[];
      } catch {
        const cached = await getCachedPlans();
        if (cached.length > 0) return cached as TrainingPlanItem[];
        return [] as TrainingPlanItem[];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await queueAction({ type: "complete", endpoint: `/training/complete/${id}`, method: "POST" });
        return;
      }
      await api.post(`/training/complete/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-week"] }),
    onError: (err) => {
      console.error("[TrainIQ] Training complete failed:", err);
    },
  });

  const skip = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!navigator.onLine) {
        await queueAction({ type: "skip", endpoint: `/training/skip/${id}`, method: "POST", body: { reason } });
        return;
      }
      await api.post(`/training/skip/${id}`, { reason });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-week"] }),
    onError: (err) => {
      console.error("[TrainIQ] Training skip failed:", err);
    },
  });

  const weekData: TrainingPlanItem[] = week.data ?? [];
  const today = weekData.find((p) => p.date === getDate(0));

  return {
    week: weekData,
    today,
    complete: complete.mutate,
    skip: skip.mutate,
    completeError: complete.isError,
    skipError: skip.isError,
    isLoading: week.isLoading,
    isError: week.isError,
    refetch: () => week.refetch()
  };
}

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface WeeklyVolume {
  week_start: string;
  planned: number;
  completed: number;
  duration_min: number;
}

export interface TrainingStats {
  completion_rate: number;
  total_planned: number;
  total_completed: number;
  total_skipped: number;
  total_duration_min: number;
  by_sport: Record<string, number>;
  weekly_volume: WeeklyVolume[];
}

export function useTrainingStats() {
  const query = useQuery<TrainingStats>({
    queryKey: ["training-stats"],
    queryFn: () => api.get("/training/stats").then((r) => r.data),
    staleTime: 1000 * 60 * 30, // 30 min — stats change only on workout completion
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMetrics() {
  const today = useQuery({
    queryKey: ["metrics-today"],
    queryFn: () => api.get("/metrics/today").then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const recovery = useQuery({
    queryKey: ["metrics-recovery"],
    queryFn: () => api.get("/metrics/recovery").then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const week = useQuery({
    queryKey: ["metrics-week"],
    queryFn: () => api.get("/metrics/week").then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  return {
    today: today.data,
    recovery: recovery.data,
    week: week.data,
    isLoading: today.isLoading || recovery.isLoading || week.isLoading,
    isError: today.isError || recovery.isError || week.isError,
    refetch: () => { today.refetch(); recovery.refetch(); week.refetch(); }
  };
}

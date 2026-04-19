import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface NutritionTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sport: string;
  weekly_hours: number;
  fitness_level: string;
  rationale: string;
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2000,
  protein_g: 130,
  carbs_g: 230,
  fat_g: 56,
  sport: "allgemein",
  weekly_hours: 5,
  fitness_level: "intermediate",
  rationale: "",
};

export function useNutritionTargets() {
  const query = useQuery<NutritionTargets>({
    queryKey: ["nutrition-targets"],
    queryFn: () => api.get("/nutrition/targets").then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 Stunde — Ziele ändern sich selten
  });

  return {
    targets: query.data ?? DEFAULT_TARGETS,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

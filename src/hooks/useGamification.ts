import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
}

const DEFAULT_STREAK: StreakData = { current_streak: 0, longest_streak: 0, last_active: "" };

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first_workout", title: "Erster Schritt", description: "Erstes Training abgeschlossen", icon: "Trophy", unlocked_at: null },
  { id: "streak_3", title: "Dreifachstart", description: "3 Tage in Folge trainiert", icon: "Flame", unlocked_at: null },
  { id: "streak_7", title: "Wochensieg", description: "7 Tage in Folge trainiert", icon: "Zap", unlocked_at: null },
  { id: "streak_30", title: "Eiserner Wille", description: "30 Tage in Folge trainiert", icon: "Dumbbell", unlocked_at: null },
  { id: "recovery_master", title: "Recovery Master", description: "7 Tage perfekte Recovery", icon: "Heart", unlocked_at: null },
  { id: "early_bird", title: "Früher Vogel", description: "5 Workouts vor 8 Uhr morgens", icon: "Sunrise", unlocked_at: null },
  { id: "volume_10h", title: "Zeitmeister", description: "10 Stunden Trainingsvolumen in einer Woche", icon: "Timer", unlocked_at: null },
  { id: "plan_complete", title: "Perfekte Woche", description: "Alle Workouts einer Woche abgeschlossen", icon: "CheckCircle2", unlocked_at: null },
];

export function useStreak() {
  const streak = useQuery({
    queryKey: ["streak"],
    queryFn: () => api.get("/training/streak").then((r) => r.data as StreakData),
    staleTime: 1000 * 60 * 30, // 30 min — streak changes infrequently
  });

  return {
    streak: streak.data ?? DEFAULT_STREAK,
    isLoading: streak.isLoading,
    isError: streak.isError,
  };
}

export function useAchievements() {
  const achievements = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get("/training/achievements").then((r) => r.data as Achievement[]),
    staleTime: 1000 * 60 * 30, // 30 min — aligns with 10-min server cache + margin
  });

  return {
    achievements: achievements.data ?? DEFAULT_ACHIEVEMENTS,
    isLoading: achievements.isLoading,
    isError: achievements.isError,
  };
}

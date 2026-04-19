export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  recorded_at: string;
  hrv: number | null;
  resting_hr: number | null;
  sleep_duration_min: number | null;
  sleep_quality_score: number | null;
  sleep_stages: Record<string, unknown> | null;
  stress_score: number | null;
  spo2: number | null;
  steps: number | null;
  vo2_max: number | null;
  source: string;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  date: string;
  sport: string;
  workout_type: string;
  duration_min: number | null;
  intensity_zone: number | null;
  target_hr_min: number | null;
  target_hr_max: number | null;
  description: string | null;
  coach_reasoning: string | null;
  status: "planned" | "completed" | "skipped";
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  logged_at: string;
  meal_type: string | null;
  image_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  analysis_raw: Record<string, unknown> | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface RecoveryScore {
  id: string;
  user_id: string;
  date: string;
  score: number;
  calculated_at: string;
}

export interface DailyWellbeing {
  id: string;
  user_id: string;
  date: string;
  fatigue_score: number | null;
  mood_score: number | null;
  pain_notes: string | null;
}

export interface UserGoal {
  id: string;
  user_id: string;
  sport: string;
  goal_description: string;
  target_date: string | null;
  weekly_hours: number;
  fitness_level: string;
  created_at: string;
}

export interface WatchConnection {
  id: string;
  user_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  last_synced_at: string | null;
  is_active: boolean;
}



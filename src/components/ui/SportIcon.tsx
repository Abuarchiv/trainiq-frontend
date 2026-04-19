import { Activity, Bike, Waves, Moon, Trophy, type LucideProps } from "lucide-react";
import type React from "react";

const SPORT_MAP: Record<string, React.ComponentType<LucideProps>> = {
  running: Activity,
  cycling: Bike,
  swimming: Waves,
  rest: Moon,
  triathlon: Trophy,
};

export function SportIcon({ sport, size = 20, strokeWidth = 1.5, className }: { sport: string; size?: number; strokeWidth?: number; className?: string }) {
  const Icon = SPORT_MAP[sport] ?? Activity;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}

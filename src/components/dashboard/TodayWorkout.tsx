import Link from "next/link";
import { SportIcon } from "@/components/ui/SportIcon";

export function TodayWorkout({
  sport,
  type,
  duration,
  intensityZone,
  targetHrMin,
  targetHrMax,
}: {
  sport: string;
  type: string;
  duration: number | null;
  intensityZone?: number | null;
  targetHrMin?: number | null;
  targetHrMax?: number | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SportIcon sport={sport} size={24} className="text-textDim" />
          <div>
            <p className="font-pixel text-textMain" style={{ fontSize: 22 }}>{type.toUpperCase()}</p>
            <p className="text-xs font-sans text-textDim tracking-wider mt-0.5">
              {intensityZone ? `ZONE ${intensityZone}` : ""}
              {targetHrMin ? ` · ${targetHrMin}–${targetHrMax} BPM` : ""}
            </p>
          </div>
        </div>
        {duration != null && duration > 0 && (
          <div className="text-right">
            <p className="font-pixel text-blue" style={{ fontSize: 28 }}>{duration}</p>
            <p className="text-xs font-sans text-textDim tracking-widest">MIN</p>
          </div>
        )}
      </div>
      <Link
        href="/training"
        className="block w-full border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2.5 text-center hover:border-blue hover:text-blue transition-colors"
      >
        Details anzeigen →
      </Link>
    </div>
  );
}

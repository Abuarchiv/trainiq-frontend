"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useMetrics } from "@/hooks/useMetrics";
import { useTraining, type TrainingPlanItem } from "@/hooks/useTraining";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton, MetricSkeleton, WorkoutRowSkeleton } from "@/components/ui/skeleton";
import { StreakIndicator } from "@/components/StreakIndicator";
import { SportIcon } from "@/components/ui/SportIcon";
import { useWatch } from "@/hooks/useWatch";

const EMPTY_NUTRITION = { calories: 0, target_cal: 0, protein_g: 0, target_protein: 0, carbs_g: 0, target_carbs: 0, fat_g: 0, target_fat: 0 };

function calcTrend(
  recent: number | null | undefined,
  previous: number | null | undefined,
  invertPositive = false
): { text: string; color: string } {
  if (recent == null || previous == null || previous === 0) {
    return { text: "—", color: "text-textDim" };
  }
  const pct = ((recent - previous) / previous) * 100;
  if (Math.abs(pct) < 1) return { text: "— gleich", color: "text-textDim" };
  const abs = Math.abs(pct).toFixed(0);
  const up = pct > 0;
  const isGood = invertPositive ? !up : up;
  const arrow = up ? "▲" : "▼";
  return {
    text: `${arrow} ${abs}%`,
    color: isGood ? "text-blue" : "text-danger",
  };
}

export default function DashboardPage() {
  const { today: metrics, recovery, week, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } = useMetrics();
  const { today: workout, isLoading: trainingLoading, isError: trainingError, refetch: refetchTraining } = useTraining();
  const { data: nutritionData, isLoading: nutritionLoading } = useQuery({
    queryKey: ["nutrition-today"],
    queryFn: () => api.get("/nutrition/today").then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const nutTotals = nutritionData?.totals ?? EMPTY_NUTRITION;
  const nutTargets = nutritionData?.targets ?? EMPTY_NUTRITION;
  const nut = useMemo(() => ({
    calories: nutTotals.calories ?? 0,
    protein_g: nutTotals.protein_g ?? 0,
    carbs_g: nutTotals.carbs_g ?? 0,
    fat_g: nutTotals.fat_g ?? 0,
    target_cal: nutTargets.target_cal ?? nutTargets.calories ?? 0,
    target_protein: nutTargets.target_protein ?? nutTargets.protein_g ?? 0,
    target_carbs: nutTargets.target_carbs ?? nutTargets.carbs_g ?? 0,
    target_fat: nutTargets.target_fat ?? nutTargets.fat_g ?? 0,
  }), [nutTotals, nutTargets]);

  const weekArr = useMemo(() => Array.isArray(week) ? week : [], [week]);
  const w0 = weekArr[0] ?? null;
  const w1 = weekArr[1] ?? null;

  const hrvTrend    = useMemo(() => calcTrend(w0?.hrv,                w1?.hrv),                [w0, w1]);
  const sleepTrend  = useMemo(() => calcTrend(w0?.sleep_duration_min, w1?.sleep_duration_min), [w0, w1]);
  const stressTrend = useMemo(() => calcTrend(w0?.stress_score,       w1?.stress_score, true), [w0, w1]);

  const score         = recovery?.score ?? 0;
  const label         = recovery?.label ?? (metricsLoading ? "LÄDT..." : "KEINE DATEN");
  const hasHrv        = recovery?.has_hrv ?? false;
  const dataAvailable = recovery?.data_available ?? false;
  const scoreColor = metricsLoading ? "text-textDim" : score >= 70 ? "text-blue" : score >= 40 ? "text-textMain" : "text-danger";
  const barColor   = metricsLoading ? "bg-[#EBEBEB]" : score >= 70 ? "bg-blue"   : score >= 40 ? "bg-textDim"    : "bg-danger";

  const hrv    = metrics?.hrv != null ? metrics.hrv : null;
  const sleep  = metrics?.sleep_duration_min ? (metrics.sleep_duration_min / 60).toFixed(1) : null;
  const stress = metrics?.stress_score != null ? metrics.stress_score : null;

  const dateStr = new Date().toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();

  if (metricsError || trainingError) {
    return (
      <div className="flex flex-col p-5 gap-4">
        <div className="border border-danger p-4 text-center">
          <p className="font-pixel text-danger text-lg mb-2">FEHLER BEIM LADEN</p>
          <p className="text-xs font-sans text-textDim uppercase tracking-widest mb-4">
            Daten konnten nicht empfangen werden.
          </p>
          <button 
            onClick={() => { refetchMetrics(); refetchTraining(); }}
            className="border border-blue text-blue px-6 py-2 text-xs uppercase tracking-widest font-sans"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-5 pb-1">
        <span className="font-pixel text-blue text-xl">TRAINIQ</span>
        <div className="flex items-center gap-3">
          <StreakIndicator />
        </div>
      </div>

      {/* Recovery Score */}
      <Link href="/metriken" className="block px-5 pt-4 pb-5 border-b border-border hover:bg-surface transition-colors">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Erholung Heute</p>
        <div className="flex items-end gap-3">
          {metricsLoading ? (
            <div className="w-[100px] h-[88px] bg-[#EBEBEB] animate-pulse mb-1 mt-1" />
          ) : (
            <span className={`font-pixel fade-up ${scoreColor}`} style={{ fontSize: 88, lineHeight: 1 }}>{score}</span>
          )}
          <div className="mb-2">
            <p className="text-xs tracking-widest uppercase text-textDim font-sans">von 100</p>
            <p className={`text-xs tracking-widest uppercase font-sans mt-1 ${scoreColor}`}>● {label}</p>
          </div>
        </div>
        <div className="bar-track mt-3">
          <div className={`bar-fill ${barColor} ${metricsLoading ? "animate-pulse" : ""}`} style={{ width: `${metricsLoading ? 100 : score}%` }} />
        </div>
        <p className="text-xs font-sans text-textDim mt-2 leading-relaxed">
          {metricsLoading
            ? "Analysiere Biometrie..."
            : score === 0
              ? (metrics ? "Keine Biometrie-Daten vom heutigen Tag — sync deine Uhr für aktuelle Werte." : "Verbinde eine Uhr oder erfasse Metriken manuell.")
              : !dataAvailable
                ? "Score basiert auf Standard-Werten — sync deine Uhr für echte Biometrie."
                : score >= 70
                  ? (hasHrv ? "HRV liegt über deinem Durchschnitt. Intensives Training möglich." : "Erholungswerte im grünen Bereich. Intensives Training möglich.")
                  : score >= 40
                    ? "Moderate Werte. Halte die Intensität kontrolliert."
                    : "Niedrige Werte. Erholung wird empfohlen."}
        </p>
      </Link>

      {/* Metriken Row */}
      {metricsLoading ? (
        <MetricSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-3 border-b border-border">
            {[
              { label: "HRV",    value: hrv != null ? hrv : "—",       unit: hrv != null ? "ms" : "",     trend: hrvTrend.text,   trendColor: hrvTrend.color },
              { label: "Schlaf", value: sleep != null ? sleep : "—",   unit: sleep != null ? "std" : "",  trend: sleepTrend.text, trendColor: sleepTrend.color },
              { label: "Stress", value: stress != null ? stress : "—", unit: stress != null ? "/ 100" : "", trend: stressTrend.text, trendColor: stressTrend.color },
            ].map((m, i) => (
              <div key={i} className={`px-4 py-4 ${i < 2 ? "border-r border-border" : ""}`}>
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{m.label}</p>
                <p className="font-pixel text-textMain" style={{ fontSize: 32, lineHeight: 1 }}>{m.value}</p>
                <p className="text-xs font-sans text-textDim mt-1">{m.unit}</p>
                <p className={`text-xs font-sans mt-1 ${m.trendColor}`}>{m.trend}</p>
              </div>
            ))}
          </div>
          {hrv === null && sleep === null && stress === null && (
            <a href="/einstellungen" className="flex items-center justify-center gap-2 py-2 border-b border-border text-xs font-sans text-textDim hover:text-blue transition-colors">
              <span>+ Uhr verbinden für Biometrie-Daten</span>
            </a>
          )}
        </>
      )}

      {/* Heutiges Training */}
      <div className="px-5 py-5 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">Heute</p>
        {trainingLoading ? (
          <WorkoutRowSkeleton />
        ) : workout ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SportIcon sport={workout.sport} size={24} className="text-textDim" />
                <div>
                  <p className="font-pixel text-textMain" style={{ fontSize: 22 }}>{workout.workout_type.toUpperCase()}</p>
                  <p className="text-xs font-sans text-textDim tracking-wider mt-0.5">
                    {workout.intensity_zone ? `ZONE ${workout.intensity_zone}` : ""}
                    {workout.target_hr_min ? ` · ${workout.target_hr_min}–${workout.target_hr_max} BPM` : ""}
                  </p>
                </div>
              </div>
              {workout.duration_min > 0 && (
                <div className="text-right">
                  <p className="font-pixel text-blue" style={{ fontSize: 28 }}>{workout.duration_min}</p>
                  <p className="text-xs font-sans text-textDim tracking-widest">MIN</p>
                </div>
              )}
            </div>
            <Link href="/training" className="block w-full border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2.5 text-center hover:border-blue hover:text-blue transition-colors">
              Details anzeigen →
            </Link>
          </>
        ) : (
          <p className="text-sm font-sans text-textDim">Kein Training für heute geplant.</p>
        )}
      </div>

      {/* Ernährung */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">Ernährung</p>
          {nut.carbs_g < nut.target_carbs && <p className="text-xs font-sans text-blue">● Carbs fehlen</p>}
        </div>
        {nutritionLoading ? (
          <div className="space-y-3 mt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-16 h-3 bg-border animate-pulse" />
                <div className="flex-1 h-[3px] bg-border animate-pulse" />
                <div className="w-12 h-3 bg-border animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {[
              { label: "Kalorien", val: nut.calories,  target: nut.target_cal,     unit: `${Math.round(nut.calories)} / ${nut.target_cal} kcal`, dotColor: "bg-textMain" },
              { label: "Protein",  val: nut.protein_g, target: nut.target_protein, unit: `${Math.round(nut.protein_g)}g`,                         dotColor: "bg-blue" },
              { label: "Carbs",    val: nut.carbs_g,   target: nut.target_carbs,   unit: `${Math.round(nut.carbs_g)} / ${nut.target_carbs}g`,     dotColor: "bg-[#888]" },
              { label: "Fett",     val: nut.fat_g,     target: nut.target_fat,     unit: `${Math.round(nut.fat_g)} / ${nut.target_fat}g`,         dotColor: "bg-[#888]" },
            ].map((n, i) => (
              <div key={i} className="flex items-center gap-2 mb-2.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.dotColor}`} />
                <span className="text-xs font-sans text-textDim w-14 tracking-wider uppercase shrink-0">{n.label}</span>
                <div className="bar-track flex-1"><div className={`bar-fill ${n.dotColor}`} style={{ width: `${n.target > 0 ? Math.min(100, (n.val / n.target) * 100) : 0}%` }} /></div>
                <span className="font-sans text-textDim whitespace-nowrap" style={{ fontSize: 11 }}>{n.unit}</span>
              </div>
            ))}
          </>
        )}
        {/* Details Link */}
        <Link href="/ernaehrung" className="block w-full border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2.5 text-center hover:border-blue hover:text-blue transition-colors mt-3">
          Details anzeigen →
        </Link>
      </div>

      {/* Coach CTA */}
      <div className="px-5 py-5">
        <Link href="/chat" className={`flex items-center gap-2 w-full border px-4 py-4 transition-colors group ${
          score > 0 && score < 40
            ? "border-blue bg-blueDim"
            : "border-border hover:border-blue"
        }`}>
          <span className="font-mono text-blue group-hover:text-blue">›</span>
          <span className="text-xs tracking-widest uppercase font-sans text-textMain">
            {score > 0 && score < 40 ? "Coach empfiehlt Beratung" : "Coach fragen"}
          </span>
        </Link>
      </div>

    </div>
  );
}

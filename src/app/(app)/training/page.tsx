"use client";
import { useState } from "react";
import { useTraining, getDate, SPORTS, type TrainingPlanItem } from "@/hooks/useTraining";
import { Skeleton, WorkoutRowSkeleton } from "@/components/ui/skeleton";
import { useTrainingStats } from "@/hooks/useTrainingStats";
import { SportIcon } from "@/components/ui/SportIcon";
import { useWatch } from "@/hooks/useWatch";
const DAY_NAMES = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
const STATUS_STYLE: Record<string, string> = { completed: "text-blue", skipped: "text-danger", planned: "text-textDim" };
const STATUS_ICON: Record<string, string>  = { completed: "✓", skipped: "✕", planned: "›" };

export default function TrainingPage() {
  const { week, isLoading, isError, refetch, complete, skip } = useTraining();
  const { stats, isLoading: statsLoading } = useTrainingStats();

  const today = getDate(0);
  const [selected, setSelected] = useState(today);
  const [skipReason, setSkipReason] = useState("");
  const [showSkip, setShowSkip] = useState(false);

  const selectedPlan = week.find((p: TrainingPlanItem) => p.date === selected);

  const handleComplete = (id: string) => {
    if (id.startsWith("empty-")) return;
    complete(id);
  };

  const handleSkipConfirm = (id: string) => {
    if (id.startsWith("empty-")) { setShowSkip(false); return; }
    skip({ id, reason: skipReason });
    setSkipReason("");
    setShowSkip(false);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border flex justify-between items-center">
        <span className="font-pixel text-blue text-xl">TRAINING</span>
        {selected !== today && (
          <button
            onClick={() => setSelected(today)}
            className="text-xs font-sans text-blue tracking-widest uppercase hover:underline"
          >
            ← Heute
          </button>
        )}
      </div>

      {/* 7-Tage Strip */}
      <div className="flex border-b border-border overflow-x-auto">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[52px] py-3 px-2 flex flex-col items-center gap-2 border-r border-border last:border-r-0">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))
        ) : week.length > 0 ? (
          week.map((plan: TrainingPlanItem) => {
            const [y, m, day] = plan.date.split("-").map(Number);
            const d = new Date(y, m - 1, day);
            const isToday = plan.date === today;
            const isSelected = plan.date === selected;
            return (
              <button
                key={plan.date}
                onClick={() => setSelected(plan.date)}
                className={`flex-1 min-w-[52px] py-3 px-2 flex flex-col items-center gap-1 border-r border-border last:border-r-0 transition-colors ${isSelected ? "bg-blueDim" : ""}`}
                style={isSelected ? { borderBottom: "2px solid #2563EB" } : {}}
              >
                <span className={`text-xs font-sans tracking-wider ${isToday ? "text-blue" : "text-textDim"}`}>{DAY_NAMES[d.getDay()]}</span>
                <span className={`text-xs font-sans ${STATUS_STYLE[plan.status]}`}>{STATUS_ICON[plan.status]}</span>
                <span className="font-pixel text-textDim" style={{ fontSize: 11 }}>{plan.workout_type.split(" ")[0].toUpperCase().slice(0, 4)}</span>
              </button>
            );
          })
        ) : (
          Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 + i);
            const dateStr = d.toISOString().split("T")[0];
            const isToday = dateStr === today;
            return (
              <div key={i} className="flex-1 min-w-[52px] py-3 px-2 flex flex-col items-center gap-1 border-r border-border last:border-r-0 opacity-30">
                <span className={`text-xs font-sans tracking-wider ${isToday ? "text-blue" : "text-textDim"}`}>{DAY_NAMES[d.getDay()]}</span>
                <span className="text-xs font-sans text-textDim">—</span>
                <span className="font-pixel text-textDim" style={{ fontSize: 11 }}>—</span>
              </div>
            );
          })
        )}
      </div>

      {isError && (
        <div className="px-5 py-4 border-b border-border">
          <div className="border border-danger p-4 text-center">
            <p className="text-xs font-sans text-danger uppercase tracking-widest mb-3">Trainingsplan konnte nicht geladen werden</p>
            <button onClick={() => refetch()} className="border border-blue text-blue px-4 py-2 text-xs uppercase tracking-widest font-sans">Erneut versuchen</button>
          </div>
        </div>
      )}

      {/* Selected Training Detail */}
      {isLoading ? (
        <div className="px-5 py-8">
          <WorkoutRowSkeleton />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      ) : selectedPlan ? (
        <div>
          {/* ... (existing detail code) ... */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <p className={`text-xs tracking-widest uppercase font-sans mb-4 ${selectedPlan.date === today ? "text-blue" : "text-textDim"}`}>
              {selectedPlan.date === today ? "› Heute" : (() => { const [y,m,d] = selectedPlan.date.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }).toUpperCase(); })()}
            </p>
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SportIcon sport={selectedPlan.sport} size={22} className="text-textDim" />
                  <p className="font-pixel text-textMain" style={{ fontSize: 26 }}>{selectedPlan.workout_type.toUpperCase()}</p>
                </div>
                <p className="text-xs font-sans text-textDim tracking-wider">
                  {SPORTS[selectedPlan.sport] ?? selectedPlan.sport.toUpperCase()}
                  {selectedPlan.intensity_zone ? ` · ZONE ${selectedPlan.intensity_zone}` : ""}
                </p>
              </div>
              {(selectedPlan.duration_min ?? 0) > 0 && (
                <div className="text-right">
                  <p className="font-pixel text-blue" style={{ fontSize: 36 }}>{selectedPlan.duration_min}</p>
                  <p className="text-xs font-sans text-textDim tracking-widest">MIN</p>
                </div>
              )}
            </div>

            {/* Parameter Grid */}
            {(selectedPlan.duration_min ?? 0) > 0 && (
              <div className="grid grid-cols-2 gap-0 border border-border mb-5">
                {[
                  { label: "Intensität",    val: selectedPlan.intensity_zone ? `ZONE ${selectedPlan.intensity_zone}` : "—" },
                  { label: "Herzfrequenz",  val: selectedPlan.target_hr_min ? `${selectedPlan.target_hr_min}–${selectedPlan.target_hr_max}` : "—" },
                ].map((row, i) => (
                  <div key={i} className={`p-3 ${i === 0 ? "border-r border-border" : ""}`}>
                    <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">{row.label}</p>
                    <p className="font-pixel text-textMain" style={{ fontSize: 17 }}>{row.val}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedPlan.description && (
              <p className="text-sm font-sans text-textDim leading-relaxed mb-4">{selectedPlan.description}</p>
            )}
          </div>

          {/* Coach Begründung */}
          {selectedPlan.coach_reasoning && (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-3">Coach Begründung</p>
              <div className="border-l-2 border-blue pl-3">
                <p className="text-sm font-sans text-textDim leading-relaxed italic">"{selectedPlan.coach_reasoning}"</p>
              </div>
            </div>
          )}

          {/* Aktionen */}
          {selectedPlan.status === "planned" && (
            <div className="px-5 py-4">
              {!showSkip ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleComplete(selectedPlan.id)}
                    className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors"
                  >
                    Erledigt ✓
                  </button>
                  <button
                    onClick={() => setShowSkip(true)}
                    className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-danger hover:text-danger transition-colors"
                  >
                    Überspringen
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="border border-border flex items-center px-3 py-2 gap-2">
                    <span className="font-mono text-textDim text-sm">›</span>
                    <input
                      value={skipReason}
                      onChange={(e) => setSkipReason(e.target.value)}
                      placeholder="Grund (optional)"
                      className="flex-1 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowSkip(false)} className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3">Abbrechen</button>
                    <button
                      onClick={() => handleSkipConfirm(selectedPlan.id)}
                      className="flex-1 border border-danger text-danger text-xs tracking-widest uppercase font-sans py-3 hover:bg-red-50 transition-colors"
                    >
                      Bestätigen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedPlan.status === "completed" && (
            <div className="px-5 py-4">
              <p className="text-xs tracking-widest uppercase text-blue font-sans">✓ Erledigt</p>
            </div>
          )}
        </div>
      ) : week.length === 0 ? (
        <div className="px-5 py-12">
          <div className="border border-dashed border-border p-8 text-center">
            <p className="font-pixel text-xs text-textDim uppercase tracking-widest mb-4">
              Kein Trainingsplan
            </p>
            <p className="text-sm font-sans text-textDim mb-6">
              Trage deine Ziele ein damit der Coach einen Plan erstellt.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/onboarding" className="inline-block border border-blue text-blue px-6 py-2 text-xs uppercase tracking-widest font-sans">
                Ziele setzen →
              </a>
              <a href="/chat" className="inline-block border border-border text-textDim px-6 py-2 text-xs uppercase tracking-widest font-sans hover:border-blue hover:text-blue transition-colors">
                › Coach nach Plan fragen
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-sans text-textDim">Kein Training für diesen Tag geplant.</p>
        </div>
      )}

      {/* 4-Wochen Statistiken */}
      <div className="px-5 py-5 border-t border-border mt-2">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-5">4-Wochen Übersicht</p>

        {statsLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-border" />
            <div className="h-16 bg-border" />
          </div>
        ) : stats ? (
          <div className="flex flex-col gap-5">

            {/* Completion Rate + Gesamtstunden */}
            <div className="grid grid-cols-3 border border-border">
              <div className="p-3 border-r border-border">
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">Abschluss</p>
                <p className="font-pixel text-blue" style={{ fontSize: 26, lineHeight: 1 }}>
                  {Math.round(stats.completion_rate * 100)}
                </p>
                <p className="text-xs font-sans text-textDim mt-1">%</p>
              </div>
              <div className="p-3 border-r border-border">
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">Stunden</p>
                <p className="font-pixel text-textMain" style={{ fontSize: 26, lineHeight: 1 }}>
                  {(stats.total_duration_min / 60).toFixed(1)}
                </p>
                <p className="text-xs font-sans text-textDim mt-1">h gesamt</p>
              </div>
              <div className="p-3">
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">Einheiten</p>
                <p className="font-pixel text-textMain" style={{ fontSize: 26, lineHeight: 1 }}>
                  {stats.total_completed}
                </p>
                <p className="text-xs font-sans text-textDim mt-1">/ {stats.total_planned}</p>
              </div>
            </div>

            {/* Wochenbalken */}
            {stats.weekly_volume.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-3">Wochenvolumen</p>
                <div className="flex gap-2 items-end h-16">
                  {stats.weekly_volume.map((w, i) => {
                    const maxDuration = Math.max(
                      ...stats.weekly_volume.map((x) => x.duration_min),
                      1
                    );
                    const barHeight = Math.max(4, (w.duration_min / maxDuration) * 56);
                    const weekLabel = new Date(w.week_start).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "numeric",
                    });
                    const isCurrentWeek = i === stats.weekly_volume.length - 1;
                    return (
                      <div key={w.week_start} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full ${isCurrentWeek ? "bg-blue" : "bg-border"}`}
                          style={{ height: barHeight }}
                        />
                        <span className="text-xs font-sans text-textDim" style={{ fontSize: 10 }}>
                          {weekLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sport-Verteilung */}
            {Object.keys(stats.by_sport).length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-3">Nach Sport</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(stats.by_sport)
                    .sort((a, b) => b[1] - a[1])
                    .map(([sport, count]) => (
                      <div key={sport} className="flex items-center gap-3">
                        <span className="text-xs font-sans text-textDim w-20 uppercase tracking-wider">
                          {sport}
                        </span>
                        <div className="bar-track flex-1">
                          <div
                            className="bar-fill bg-blue"
                            style={{
                              width: `${(count / stats.total_completed) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-pixel text-textDim" style={{ fontSize: 13 }}>
                          {count}×
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <p className="text-xs font-sans text-textDim">Noch keine Statistiken verfügbar.</p>
        )}
      </div>

    </div>

  );
}

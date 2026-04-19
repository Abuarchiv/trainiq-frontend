"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTraining, SPORTS } from "@/hooks/useTraining";
import { TrainingDetailSkeleton } from "@/components/ui/skeleton";
import { SportIcon } from "@/components/ui/SportIcon";

export default function TrainingDatePage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { week, isLoading, complete, skip } = useTraining();
  const plan = week.find((p: { date: string }) => p.date === params.date);
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const handleSkipConfirm = (id: string) => {
    skip({ id, reason: skipReason });
    setShowSkip(false);
    router.back();
  };

  if (isLoading) return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
        <button onClick={() => router.back()}><ArrowLeft size={18} strokeWidth={1.5} className="text-textDim" /></button>
        <span className="font-pixel text-blue text-xl">TRAINING</span>
      </div>
      <TrainingDetailSkeleton />
    </div>
  );

  if (!plan) return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-sans text-textDim">Kein Training für diesen Tag.</p>
      <button onClick={() => router.back()} className="mt-4 text-xs tracking-widest uppercase text-blue font-sans">← Zurück</button>
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
        <button onClick={() => router.back()}><ArrowLeft size={18} strokeWidth={1.5} className="text-textDim" /></button>
        <span className="font-pixel text-blue text-xl">TRAINING</span>
      </div>

      <div className="px-5 pt-5 pb-4 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">
          {(() => { const [y,m,d] = plan.date.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }).toUpperCase(); })()}
        </p>
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2">
            <SportIcon sport={plan.sport} size={24} className="text-textDim" />
            <div>
              <p className="font-pixel text-textMain" style={{ fontSize: 26 }}>{plan.workout_type.toUpperCase()}</p>
              <p className="text-xs font-sans text-textDim tracking-wider">{SPORTS[plan.sport] ?? plan.sport.toUpperCase()}</p>
            </div>
          </div>
          {plan.duration_min > 0 && (
            <div className="text-right">
              <p className="font-pixel text-blue" style={{ fontSize: 36 }}>{plan.duration_min}</p>
              <p className="text-xs font-sans text-textDim tracking-widest">MIN</p>
            </div>
          )}
        </div>

        {plan.duration_min > 0 && (
          <div className="grid grid-cols-2 gap-0 border border-border mb-5">
            {[
              { label: "Zone",         val: plan.intensity_zone ? `ZONE ${plan.intensity_zone}` : "—" },
              { label: "Herzfrequenz", val: plan.target_hr_min ? `${plan.target_hr_min}–${plan.target_hr_max} BPM` : "—" },
            ].map((row, i) => (
              <div key={i} className={`p-3 ${i === 0 ? "border-r border-border" : ""}`}>
                <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">{row.label}</p>
                <p className="font-pixel text-textMain" style={{ fontSize: 17 }}>{row.val}</p>
              </div>
            ))}
          </div>
        )}
        {plan.description && <p className="text-sm font-sans text-textDim leading-relaxed">{plan.description}</p>}
      </div>

      {plan.coach_reasoning && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-3">Coach Begründung</p>
          <div className="border-l-2 border-blue pl-3">
            <p className="text-sm font-sans text-textDim leading-relaxed italic">&ldquo;{plan.coach_reasoning}&rdquo;</p>
          </div>
        </div>
      )}

      {plan.status === "planned" && (
        <div className="px-5 py-4">
          {!showSkip ? (
            <div className="flex gap-3">
              <button onClick={() => { complete(plan.id); router.back(); }} className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors">Erledigt ✓</button>
              <button onClick={() => setShowSkip(true)} className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-danger hover:text-danger transition-colors">Überspringen</button>
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
                <button onClick={() => handleSkipConfirm(plan.id)} className="flex-1 border border-danger text-danger text-xs tracking-widest uppercase font-sans py-3 hover:bg-red-50 transition-colors">Bestätigen</button>
              </div>
            </div>
          )}
        </div>
      )}
      {plan.status === "completed" && (
        <div className="px-5 py-4"><p className="text-xs tracking-widest uppercase text-blue font-sans">✓ Erledigt</p></div>
      )}
    </div>
  );
}

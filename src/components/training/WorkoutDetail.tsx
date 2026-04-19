import { TrainingPlan } from "@/lib/types";
import { SportIcon } from "@/components/ui/SportIcon";

const SPORTS: Record<string, string> = {
  running: "LAUFEN", cycling: "RADFAHREN", swimming: "SCHWIMMEN", rest: "PAUSE",
};

export function WorkoutDetail({
  plan,
  onComplete,
  onSkip,
}: {
  plan: TrainingPlan;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SportIcon sport={plan.sport} size={22} className="text-textDim" />
            <p className="font-pixel text-textMain" style={{ fontSize: 26 }}>{plan.workout_type.toUpperCase()}</p>
          </div>
          <p className="text-xs font-sans text-textDim tracking-wider">
            {SPORTS[plan.sport] ?? plan.sport.toUpperCase()}
            {plan.intensity_zone ? ` · ZONE ${plan.intensity_zone}` : ""}
          </p>
        </div>
        {plan.duration_min != null && plan.duration_min > 0 && (
          <div className="text-right">
            <p className="font-pixel text-blue" style={{ fontSize: 36 }}>{plan.duration_min}</p>
            <p className="text-xs font-sans text-textDim tracking-widest">MIN</p>
          </div>
        )}
      </div>

      {plan.duration_min != null && plan.duration_min > 0 && (
        <div className="grid grid-cols-2 gap-0 border border-border mb-5">
          {[
            { label: "Intensität", val: plan.intensity_zone ? `ZONE ${plan.intensity_zone}` : "—" },
            { label: "Herzfrequenz", val: plan.target_hr_min ? `${plan.target_hr_min}–${plan.target_hr_max} BPM` : "—" },
          ].map((row, i) => (
            <div key={i} className={`p-3 ${i === 0 ? "border-r border-border" : ""}`}>
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">{row.label}</p>
              <p className="font-pixel text-textMain" style={{ fontSize: 17 }}>{row.val}</p>
            </div>
          ))}
        </div>
      )}

      {plan.description && (
        <p className="text-sm font-sans text-textDim leading-relaxed mb-4">{plan.description}</p>
      )}

      {plan.coach_reasoning && (
        <div className="mb-5">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-3">Coach Begründung</p>
          <div className="border-l-2 border-blue pl-3">
            <p className="text-sm font-sans text-textDim leading-relaxed italic">&ldquo;{plan.coach_reasoning}&rdquo;</p>
          </div>
        </div>
      )}

      {plan.status === "planned" && (onComplete || onSkip) && (
        <div className="flex gap-3">
          {onComplete && (
            <button
              onClick={() => onComplete(plan.id)}
              className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors"
            >
              Erledigt ✓
            </button>
          )}
          {onSkip && (
            <button
              onClick={() => onSkip(plan.id)}
              className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-danger hover:text-danger transition-colors"
            >
              Überspringen
            </button>
          )}
        </div>
      )}

      {plan.status === "completed" && (
        <p className="text-xs tracking-widest uppercase text-blue font-sans">✓ Erledigt</p>
      )}
    </div>
  );
}

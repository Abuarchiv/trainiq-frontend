import { getDate } from "@/hooks/useTraining";

const DAY_NAMES = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];

function getWeekDates(): string[] {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split("T")[0];
  });
}

interface PlanSummary {
  date: string;
  workout_type: string;
  status: string;
}

export function WeekStrip({
  plans,
  selectedDate,
  onSelect,
}: {
  plans: PlanSummary[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const weekDates = getWeekDates();
  const today = getDate(0);

  return (
    <div className="flex border-b border-border overflow-x-auto">
      {weekDates.map((date) => {
        const [y, m, day] = date.split("-").map(Number);
        const d = new Date(y, m - 1, day);
        const plan = plans.find((p) => p.date === date);
        const isToday = date === today;
        const isSelected = date === selectedDate;

        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={`flex-1 min-w-[52px] py-3 px-2 flex flex-col items-center gap-1 border-r border-border last:border-r-0 transition-colors ${
              isSelected ? "bg-blueDim" : ""
            }`}
            style={isSelected ? { borderBottom: "2px solid #2563EB" } : {}}
          >
            <span
              className={`text-xs font-sans tracking-wider ${
                isToday ? "text-blue" : "text-textDim"
              }`}
            >
              {DAY_NAMES[d.getDay()]}
            </span>
            {plan ? (
              <span
                className={`text-xs font-sans ${
                  plan.status === "completed"
                    ? "text-blue"
                    : plan.status === "skipped"
                    ? "text-danger"
                    : "text-textDim"
                }`}
              >
                {plan.status === "completed" ? "✓" : plan.status === "skipped" ? "✕" : "›"}
              </span>
            ) : (
              <span className="text-xs font-sans text-textDim">·</span>
            )}
            <span className="font-pixel text-textDim" style={{ fontSize: 11 }}>
              {plan
                ? plan.workout_type.split(" ")[0].toUpperCase().slice(0, 4)
                : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

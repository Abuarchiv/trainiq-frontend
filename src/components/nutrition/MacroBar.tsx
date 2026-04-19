export function MacroBar({
  protein,
  carbs,
  fat,
  showLabels = true,
}: {
  protein: number;
  carbs: number;
  fat: number;
  showLabels?: boolean;
}) {
  const total = protein + carbs + fat || 1;
  const items = [
    { label: "Protein", value: protein, color: "bg-blue", pct: (protein / total) * 100 },
    { label: "Carbs", value: carbs, color: "bg-textDim", pct: (carbs / total) * 100 },
    { label: "Fett", value: fat, color: "bg-muted", pct: (fat / total) * 100 },
  ];

  return (
    <div>
      <div className="flex h-[3px] overflow-hidden">
        {items.map((item) => (
          <div
            key={item.label}
            style={{ width: `${item.pct}%` }}
            className={item.color}
          />
        ))}
      </div>
      {showLabels && (
        <div className="flex gap-4 mt-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 ${item.color}`} />
              <span className="text-[10px] font-sans text-textDim tracking-wider uppercase">
                {item.label}
              </span>
              <span className="font-pixel text-textDim" style={{ fontSize: 12 }}>
                {Math.round(item.value)}g
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

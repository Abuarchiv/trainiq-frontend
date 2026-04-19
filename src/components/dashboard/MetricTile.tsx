export function MetricTile({
  label,
  value,
  unit,
  trend,
  trendColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendColor?: string;
}) {
  return (
    <div className="px-4 py-4">
      <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{label}</p>
      <p className="font-pixel text-textMain" style={{ fontSize: 32, lineHeight: 1 }}>{value}</p>
      {unit && <p className="text-xs font-sans text-textDim mt-1">{unit}</p>}
      {trend && (
        <p className={`text-xs font-sans mt-1 ${trendColor ?? "text-textDim"}`}>{trend}</p>
      )}
    </div>
  );
}

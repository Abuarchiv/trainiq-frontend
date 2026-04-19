export function RecoveryScore({
  score,
  label,
  loading,
  hasHrv,
  dataAvailable,
}: {
  score: number;
  label?: string;
  loading?: boolean;
  hasHrv?: boolean;
  dataAvailable?: boolean;
}) {
  const scoreColor = loading
    ? "text-textDim"
    : score >= 70
      ? "text-blue"
      : score >= 40
        ? "text-textMain"
        : "text-danger";
  const barColor = loading
    ? "bg-[#EBEBEB]"
    : score >= 70
      ? "bg-blue"
      : score >= 40
        ? "bg-textDim"
        : "bg-danger";

  return (
    <div>
      <div className="flex items-end gap-3">
        {loading ? (
          <div className="w-[100px] h-[88px] bg-[#EBEBEB] animate-pulse mb-1 mt-1" />
        ) : (
          <span className={`font-pixel fade-up ${scoreColor}`} style={{ fontSize: 88, lineHeight: 1 }}>
            {score}
          </span>
        )}
        <div className="mb-2">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">von 100</p>
          {label && (
            <p className={`text-xs tracking-widest uppercase font-sans mt-1 ${scoreColor}`}>● {label}</p>
          )}
        </div>
      </div>
      <div className="bar-track mt-3">
        <div
          className={`bar-fill ${barColor} ${loading ? "animate-pulse" : ""}`}
          style={{ width: `${loading ? 100 : score}%` }}
        />
      </div>
      <p className="text-xs font-sans text-textDim mt-2 leading-relaxed">
        {loading
          ? "Analysiere Biometrie..."
          : score === 0
            ? "Verbinde eine Uhr oder erfasse Metriken manuell."
            : !dataAvailable
              ? "Score basiert auf Standard-Werten — sync deine Uhr für echte Biometrie."
              : score >= 70
                ? hasHrv
                  ? "HRV liegt über deinem Durchschnitt. Intensives Training möglich."
                  : "Erholungswerte im grünen Bereich. Intensives Training möglich."
                : score >= 40
                  ? "Moderate Werte. Halte die Intensität kontrolliert."
                  : "Niedrige Werte. Erholung wird empfohlen."}
      </p>
    </div>
  );
}

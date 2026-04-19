"use client";
import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { useMetrics } from "@/hooks/useMetrics";
import api from "@/lib/api";
import { useWatch } from "@/hooks/useWatch";
import Link from "next/link";

const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const AXIS_TICK = { fontSize: 11, fontFamily: "Inter", fill: "#888888" };

const EmptyChart = () => (
  <div className="flex items-center justify-center h-[120px] border border-border">
    <p className="text-xs font-sans text-textDim tracking-widest uppercase">Keine Daten — Uhr verbinden oder Sync starten</p>
  </div>
);

export default function MetrikenPage() {
  const { today, recovery, week } = useMetrics();
  const qc = useQueryClient();
  type MetricDay = { hrv: number; resting_hr: number; sleep_duration_min: number; stress_score: number; spo2: number; steps: number; vo2_max: number; date: string };
  const data: MetricDay[] = (week as MetricDay[]) ?? [];
  const hasValues = data.some((d) =>
    (d.hrv ?? 0) > 0 || (d.sleep_duration_min ?? 0) > 0 ||
    (d.resting_hr ?? 0) > 0 || (d.stress_score ?? 0) > 0 ||
    (d.steps ?? 0) > 0 || (d.vo2_max ?? 0) > 0
  );

  const todayMetric = today as MetricDay | undefined;

  const [fatigue, setFatigue] = useState(5);
  const [mood, setMood] = useState(7);
  const [submitted, setSubmitted] = useState(false);

  // Manuelle Metriken State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualHrv, setManualHrv] = useState("");
  const [manualSleep, setManualSleep] = useState("");
  const [manualHr, setManualHr] = useState("");
  const [manualStress, setManualStress] = useState("");
  const [manualSpo2, setManualSpo2] = useState("");
  const [manualSteps, setManualSteps] = useState("");
  const [manualVo2, setManualVo2] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSaved, setManualSaved] = useState(false);
  const [manualError, setManualError] = useState("");

  const [wellbeingError, setWellbeingError] = useState(false);

  const chartData = useMemo(() => data.map((d) => ({
    day: DAYS[new Date(d.date + "T00:00:00").getDay()],
    hrv: d.hrv ?? 0,
    hr: d.resting_hr ?? 0,
    sleep: d.sleep_duration_min ? Math.round(d.sleep_duration_min / 60 * 10) / 10 : 0,
    stress: d.stress_score ?? 0,
    spo2: d.spo2 ?? 0,
    steps: d.steps ?? 0,
    vo2: d.vo2_max ?? 0,
  })), [data]);

  const avgHrv = useMemo(() => {
    const valid = data.filter((d) => (d.hrv ?? 0) > 0);
    return valid.length > 0
      ? Math.round(valid.reduce((a, d) => a + d.hrv, 0) / valid.length)
      : 0;
  }, [data]);
  const avgSleep = useMemo(() => {
    const valid = data.filter((d) => (d.sleep_duration_min ?? 0) > 0);
    return valid.length > 0
      ? (valid.reduce((a, d) => a + d.sleep_duration_min, 0) / valid.length / 60).toFixed(1)
      : "0";
  }, [data]);
  const latestVo2 = useMemo(() =>
    todayMetric?.vo2_max ?? (data.length > 0 ? data.find((d) => d.vo2_max != null)?.vo2_max ?? null : null),
    [todayMetric, data]
  );

  const submitWellbeing = async () => {
    setWellbeingError(false);
    try {
      await api.post("/metrics/wellbeing", { fatigue_score: fatigue, mood_score: mood });
    } catch {
      setWellbeingError(true);
      setTimeout(() => setWellbeingError(false), 3000);
      return;
    }
    qc.invalidateQueries({ queryKey: ["metrics-today"] });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFatigue(5);
      setMood(7);
    }, 2000);
  };

  const submitManualMetrics = async () => {
    setManualError("");
    const hrv    = manualHrv    ? parseFloat(manualHrv)    : null;
    const sleep  = manualSleep  ? parseInt(manualSleep)    : null;
    const hr     = manualHr     ? parseInt(manualHr)       : null;
    const stress = manualStress ? parseFloat(manualStress) : null;
    const spo2   = manualSpo2   ? parseFloat(manualSpo2)   : null;
    const steps  = manualSteps  ? parseInt(manualSteps)    : null;
    const vo2    = manualVo2    ? parseFloat(manualVo2)    : null;

    if (!hrv && !sleep && !hr && !stress && !spo2 && !steps && !vo2) {
      setManualError("Mindestens ein Wert muss eingegeben werden.");
      return;
    }
    if (hrv !== null && (hrv < 5 || hrv > 200)) {
      setManualError("HRV muss zwischen 5 und 200 ms liegen.");
      return;
    }
    if (sleep !== null && (sleep < 0 || sleep > 720)) {
      setManualError("Schlafdauer muss zwischen 0 und 720 Minuten liegen.");
      return;
    }
    if (hr !== null && (hr < 30 || hr > 120)) {
      setManualError("Ruhepuls muss zwischen 30 und 120 bpm liegen.");
      return;
    }
    if (stress !== null && (stress < 0 || stress > 100)) {
      setManualError("Stress muss zwischen 0 und 100 liegen.");
      return;
    }
    if (spo2 !== null && (spo2 < 70 || spo2 > 100)) {
      setManualError("SpO₂ muss zwischen 70 und 100 % liegen.");
      return;
    }
    if (steps !== null && (steps < 0 || steps > 100000)) {
      setManualError("Schritte müssen zwischen 0 und 100.000 liegen.");
      return;
    }
    if (vo2 !== null && (vo2 < 10 || vo2 > 90)) {
      setManualError("VO₂ max muss zwischen 10 und 90 ml/kg/min liegen.");
      return;
    }

    setManualSaving(true);
    try {
      await api.post("/watch/manual", {
        hrv,
        sleep_duration_min: sleep,
        resting_hr: hr,
        stress_score: stress,
        spo2,
        steps,
        vo2_max: vo2,
      });
      setManualSaved(true);
      qc.invalidateQueries({ queryKey: ["metrics-today"] });
      qc.invalidateQueries({ queryKey: ["metrics-week"] });
      qc.invalidateQueries({ queryKey: ["metrics-recovery"] });
      setManualHrv("");
      setManualSleep("");
      setManualHr("");
      setManualStress("");
      setManualSpo2("");
      setManualSteps("");
      setManualVo2("");
      setShowManualForm(false);
      setTimeout(() => setManualSaved(false), 3000);
    } catch {
      setManualError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setManualSaving(false);
    }
  };

  const CustomTooltip = ({ active, payload, label, unit = "" }: { active?: boolean; payload?: { value: number }[]; label?: string; unit?: string }) => {
    if (active && payload?.length) {
      return (
        <div className="border border-border bg-bg px-3 py-2">
          <p className="text-xs font-sans text-textDim tracking-wider">{label}</p>
          <p className="font-pixel text-blue" style={{ fontSize: 18 }}>{payload[0].value}{unit}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border flex justify-between items-center">
        <span className="font-pixel text-blue text-xl">METRIKEN</span>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 border-b border-border">
        {[
          { label: "HRV Ø",   value: todayMetric?.hrv ?? avgHrv,  unit: "ms" },
          { label: "Schlaf",  value: avgSleep,                unit: "h / Ø" },
          { label: "Score",   value: recovery?.score ?? "—",  unit: "/ 100" },
        ].map((m, i) => (
          <div key={i} className={`px-4 py-4 ${i < 2 ? "border-r border-border" : ""}`}>
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{m.label}</p>
            <p className="font-pixel text-blue" style={{ fontSize: 28, lineHeight: 1 }}>{m.value}</p>
            <p className="text-xs font-sans text-textDim mt-1">{m.unit}</p>
          </div>
        ))}
      </div>

      {/* Zweite Reihe: Ruhepuls / SpO2 / VO2 max */}
      <div className="grid grid-cols-3 border-b border-border">
        {[
          { label: "Ruhepuls",  value: todayMetric?.resting_hr ?? "—", unit: "bpm" },
          { label: "SpO₂",      value: todayMetric?.spo2 ?? "—",        unit: "%" },
          { label: "VO₂ max",   value: latestVo2 != null ? latestVo2.toFixed(1) : "—", unit: "ml/kg/min" },
        ].map((m, i) => (
          <div key={i} className={`px-4 py-4 ${i < 2 ? "border-r border-border" : ""}`}>
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{m.label}</p>
            <p className="font-pixel text-textMain" style={{ fontSize: 24, lineHeight: 1 }}>{m.value}</p>
            <p className="text-xs font-sans text-textDim mt-1">{m.unit}</p>
          </div>
        ))}
      </div>

      {/* HRV Chart */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">HRV — 30 Tage</p>
          <p className="font-pixel text-blue" style={{ fontSize: 16 }}>{todayMetric?.hrv ?? avgHrv}ms</p>
        </div>
        {hasValues ? (
          <div className="border border-border overflow-hidden">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickCount={3} domain={["auto", "auto"]} width={28} />
                <Tooltip content={<CustomTooltip unit="ms" />} />
                <Line type="monotone" dataKey="hrv" stroke="#2563EB" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#2563EB" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart />}
      </div>

      {/* Schlaf Chart */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">Schlaf — 30 Tage</p>
          <p className="font-pixel text-textMain" style={{ fontSize: 16 }}>{todayMetric?.sleep_duration_min ? (todayMetric.sleep_duration_min / 60).toFixed(1) : avgSleep}h</p>
        </div>
        {hasValues ? (
          <div className="border border-border overflow-hidden">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickCount={3} domain={[0, "auto"]} width={28} />
                <Tooltip content={<CustomTooltip unit="h" />} />
                <Bar dataKey="sleep" fill="#CCCCCC" radius={0} maxBarSize={20} minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart />}
      </div>

      {/* Stress Chart */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">Stresslevel — 30 Tage</p>
          <p className="font-pixel text-textMain" style={{ fontSize: 16 }}>{todayMetric?.stress_score ?? "—"}</p>
        </div>
        {hasValues ? (
          <div className="border border-border overflow-hidden">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickCount={3} domain={[0, 100]} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="stress" stroke="#CCCCCC" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#888888" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart />}
      </div>

      {/* Ruhepuls Chart */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">Ruhepuls — 30 Tage</p>
          <p className="font-pixel text-textMain" style={{ fontSize: 16 }}>{todayMetric?.resting_hr ?? "—"}bpm</p>
        </div>
        {hasValues ? (
          <div className="border border-border overflow-hidden">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickCount={3} domain={["auto", "auto"]} width={28} />
                <Tooltip content={<CustomTooltip unit="bpm" />} />
                <Line type="monotone" dataKey="hr" stroke="#2563EB" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#2563EB" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart />}
      </div>

      {/* VO2 max Chart */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">VO₂ max — 30 Tage</p>
          <p className="font-pixel text-textMain" style={{ fontSize: 16 }}>
            {latestVo2 != null ? `${latestVo2.toFixed(1)} ml/kg/min` : "—"}
          </p>
        </div>
        {hasValues && chartData.some((d) => d.vo2 > 0) ? (
          <div className="border border-border overflow-hidden">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickCount={3} domain={["auto", "auto"]} width={28} />
                <Tooltip content={<CustomTooltip unit=" ml/kg/min" />} />
                <Line type="monotone" dataKey="vo2" stroke="#16A34A" strokeWidth={1.5} dot={{ r: 3, fill: "#16A34A" }} activeDot={{ r: 4, fill: "#16A34A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart />}
      </div>

      {/* Manuelle Metriken */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">Manuell eingeben</p>
          {manualSaved && (
            <p className="text-xs tracking-widest uppercase text-blue font-sans fade-up">✓ Gespeichert</p>
          )}
        </div>

        {!showManualForm ? (
          <button
            onClick={() => setShowManualForm(true)}
            className="w-full border border-dashed border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-blue hover:text-blue transition-colors"
          >
            › Heutige Werte eintragen (ohne Uhr)
          </button>
        ) : (
          <div className="flex flex-col gap-4">

            {/* HRV */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                HRV <span className="text-textDim normal-case tracking-normal">ms (z.B. 42)</span>
              </p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="z.B. 42"
                value={manualHrv}
                onChange={(e) => setManualHrv(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={5}
                max={200}
              />
            </div>

            {/* Schlaf */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                Schlafdauer <span className="text-textDim normal-case tracking-normal">Minuten (z.B. 420 = 7h)</span>
              </p>
              <input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 420"
                value={manualSleep}
                onChange={(e) => setManualSleep(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={0}
                max={720}
              />
            </div>

            {/* Ruhepuls */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                Ruhepuls <span className="text-textDim normal-case tracking-normal">bpm (z.B. 52)</span>
              </p>
              <input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 52"
                value={manualHr}
                onChange={(e) => setManualHr(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={30}
                max={120}
              />
            </div>

            {/* Stress */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                Stresslevel <span className="text-textDim normal-case tracking-normal">0–100</span>
              </p>
              <input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 35"
                value={manualStress}
                onChange={(e) => setManualStress(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={0}
                max={100}
              />
            </div>

            {/* SpO2 */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                SpO₂ <span className="text-textDim normal-case tracking-normal">% (z.B. 97)</span>
              </p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="z.B. 97"
                value={manualSpo2}
                onChange={(e) => setManualSpo2(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={70}
                max={100}
              />
            </div>

            {/* Schritte */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                Schritte <span className="text-textDim normal-case tracking-normal">(z.B. 8500)</span>
              </p>
              <input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 8500"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={0}
                max={100000}
              />
            </div>

            {/* VO2 max */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">
                VO₂ max <span className="text-textDim normal-case tracking-normal">ml/kg/min (z.B. 52)</span>
              </p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="z.B. 52"
                value={manualVo2}
                onChange={(e) => setManualVo2(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
                min={10}
                max={90}
              />
            </div>

            {manualError && (
              <p className="text-xs font-sans text-danger tracking-wider">! {manualError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowManualForm(false); setManualError(""); }}
                className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-textDim transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={submitManualMetrics}
                disabled={manualSaving}
                className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors disabled:opacity-40"
              >
                {manualSaving ? "..." : "› Speichern"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Morgendliches Befinden */}
      <div className="px-5 py-5">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-5">Heutiges Befinden</p>
        {submitted ? (
          <p className="text-xs tracking-widest uppercase text-blue font-sans">✓ Gespeichert — Danke!</p>
        ) : (
          <div className="flex flex-col gap-5">
            {[
              { label: "Müdigkeit", val: fatigue, set: setFatigue },
              { label: "Stimmung",  val: mood,    set: setMood },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <p className="text-xs tracking-widest uppercase text-textDim font-sans">{label}</p>
                  <p className="font-pixel text-blue" style={{ fontSize: 18 }}>{val}<span className="text-textDim" style={{ fontSize: 13 }}>/10</span></p>
                </div>
                <input
                  type="range" min={1} max={10} value={val}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full metric-range"
                  style={{ "--range-fill": `${(val - 1) / 9 * 100}%` } as React.CSSProperties}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-pixel text-textDim tracking-widest">Niedrig</span>
                  <span className="text-xs font-pixel text-textDim tracking-widest">Hoch</span>
                </div>
              </div>
            ))}
            {wellbeingError && (
              <p className="text-xs font-sans text-danger tracking-wider">! Speichern fehlgeschlagen. Bitte versuche es erneut.</p>
            )}
            <button
              onClick={submitWellbeing}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors"
            >
              › Speichern
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

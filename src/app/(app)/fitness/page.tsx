"use client";
import { useState, useMemo, memo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Trophy, Flame, Zap, Dumbbell, Heart, Sunrise, Timer, CheckCircle2, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import {
  useFitness,
  useRefreshFitness,
  usePersonalRecords,
  useSyncPRsFromWatches,
  useUpsertPR,
  useDeletePR,
  useGear,
  useCreateGear,
  useUpdateGear,
  useDeleteGear,
  type PersonalRecord,
  type GearItem,
} from "@/hooks/useAnalytics";
import { useAchievements } from "@/hooks/useGamification";

const ACHIEVEMENT_ICONS: Record<string, ComponentType<LucideProps>> = {
  Trophy, Flame, Zap, Dumbbell, Heart, Sunrise, Timer, CheckCircle2,
};

type Achievement = { id: string; title: string; description: string; icon: string; unlocked_at: string | null };

const AchievementItem = memo(function AchievementItem({ a }: { a: Achievement }) {
  const unlocked = a.unlocked_at !== null;
  const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Trophy;
  return (
    <div
      title={a.description}
      className={`flex flex-col items-center gap-1 px-1 py-3 border border-border transition-colors ${
        unlocked ? "border-blue" : "opacity-30"
      }`}
    >
      <Icon size={22} strokeWidth={1.5} className={unlocked ? "text-blue" : ""} />
      <span className="text-[9px] font-sans text-textDim tracking-wider uppercase text-center leading-tight break-words w-full">
        {a.title}
      </span>
    </div>
  );
});

function AchievementsSection() {
  const { achievements, isLoading } = useAchievements();
  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked_at).length, [achievements]);

  return (
    <div className="px-5 py-5">
      <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">Abzeichen</p>
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-[#EBEBEB] animate-pulse" />
              <div className="h-2 w-10 bg-[#EBEBEB] animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {achievements.map((a) => <AchievementItem key={a.id} a={a} />)}
        </div>
      )}
      {unlockedCount > 0 && (
        <p className="text-xs font-sans text-blue mt-4">
          {unlockedCount} / {achievements.length} freigeschaltet
        </p>
      )}
    </div>
  );
}

const AXIS_TICK = { fontSize: 11, fontFamily: "Inter", fill: "#888888" };

function fmtTime(s: number): string {
  if (!s) return "–";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const PR_LABELS = ["400m", "1km", "1mi", "5km", "10km", "15km", "HM", "Marathon"];

// ---------------------------------------------------------------------------
// Fitness & Freshness Section
// ---------------------------------------------------------------------------
function FitnessSection() {
  const { data, isLoading } = useFitness(90);
  const refresh = useRefreshFitness();

  const current = data?.current;
  const history = data?.history ?? [];

  const tsbColor = (tsb: number) =>
    tsb > 5 ? "#4ade80" : tsb < -10 ? "#f87171" : "#3b82f6";

  return (
    <div className="px-5 py-5 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans">Fitness &amp; Form</p>
        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="text-[10px] tracking-widest uppercase text-blue font-sans disabled:opacity-40"
        >
          {refresh.isPending ? "..." : "Neu berechnen"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs font-sans text-textDim">Lade Daten…</p>
      ) : (
        <>
          {/* Big numbers */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "CTL", desc: "Fitness", value: current?.ctl ?? 0 },
              { label: "ATL", desc: "Belastung", value: current?.atl ?? 0 },
              { label: "TSB", desc: "Form", value: current?.tsb ?? 0, colored: true },
            ].map(({ label, desc, value, colored }) => (
              <div key={label} className="border border-border p-3 text-center">
                <p className="text-[10px] tracking-widest uppercase text-textDim font-sans">{desc}</p>
                <p
                  className="font-pixel mt-1"
                  style={{ fontSize: 22, color: colored ? tsbColor(value) : "#e5e5e5" }}
                >
                  {value.toFixed(0)}
                </p>
                <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={AXIS_TICK} />
                <ReferenceLine y={0} stroke="#555" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", fontSize: 11 }}
                  formatter={(val: number, name: string) => [val.toFixed(1), name.toUpperCase()]}
                />
                <Line type="monotone" dataKey="ctl" stroke="#3b82f6" dot={false} strokeWidth={2} name="CTL" />
                <Line type="monotone" dataKey="atl" stroke="#f97316" dot={false} strokeWidth={1.5} name="ATL" />
                <Line type="monotone" dataKey="tsb" stroke="#a855f7" dot={false} strokeWidth={1.5} name="TSB" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs font-sans text-textDim text-center py-4">
              Noch keine Trainingsdaten. Trainingsplan ausfüllen um CTL/ATL zu berechnen.
            </p>
          )}

          <p className="text-[10px] font-sans text-textDim mt-3">
            CTL = Fitness (42-Tage-Durchschnitt) · ATL = Ermüdung (7 Tage) · TSB = Form (CTL − ATL)
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Personal Records Section
// ---------------------------------------------------------------------------
function PRsSection() {
  const { data: prs = [], isLoading } = usePersonalRecords();
  const syncPRs = useSyncPRsFromWatches();
  const upsertPR = useUpsertPR();
  const deletePR = useDeletePR();

  const [editing, setEditing] = useState<string | null>(null);
  const [editMin, setEditMin] = useState("");
  const [editSec, setEditSec] = useState("");
  const [editDate, setEditDate] = useState("");

  const prMap: Record<string, PersonalRecord> = {};
  for (const pr of prs) prMap[pr.distance_label] = pr;

  const handleSave = async (label: string) => {
    const m = parseInt(editMin) || 0;
    const s = parseInt(editSec) || 0;
    const total = m * 60 + s;
    if (total <= 0) return;
    await upsertPR.mutateAsync({
      distance_label: label,
      elapsed_time_s: total,
      achieved_date: editDate || undefined,
    });
    setEditing(null);
  };

  return (
    <div className="px-5 py-5 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans">Bestzeiten</p>
        <button
          onClick={() => syncPRs.mutate()}
          disabled={syncPRs.isPending}
          className="text-[10px] tracking-widest uppercase text-blue font-sans disabled:opacity-40"
        >
          {syncPRs.isPending ? "..." : "Von Uhren laden"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs font-sans text-textDim">Lade Bestzeiten…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {PR_LABELS.map((label) => {
            const pr = prMap[label];
            const isEdit = editing === label;
            return (
              <div key={label} className="border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-textDim font-sans">{label}</p>
                    <p className="font-pixel text-textMain" style={{ fontSize: 18 }}>
                      {pr ? fmtTime(pr.elapsed_time_s) : "–"}
                    </p>
                    {pr?.achieved_date && (
                      <p className="text-[10px] font-sans text-textDim">{pr.achieved_date} · {pr.source}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (pr) {
                          const m = Math.floor(pr.elapsed_time_s / 60);
                          const s = pr.elapsed_time_s % 60;
                          setEditMin(String(m));
                          setEditSec(String(s));
                          setEditDate(pr.achieved_date ?? "");
                        } else {
                          setEditMin(""); setEditSec(""); setEditDate("");
                        }
                        setEditing(isEdit ? null : label);
                      }}
                      className="text-[10px] tracking-widest uppercase text-blue font-sans"
                    >
                      {isEdit ? "×" : pr ? "Edit" : "+ Eintragen"}
                    </button>
                    {pr && !isEdit && (
                      <button
                        onClick={() => deletePR.mutate(label)}
                        className="text-[10px] tracking-widest uppercase text-danger font-sans"
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>

                {isEdit && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1 border border-border px-2 py-1.5">
                        <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-0.5">Min</p>
                        <input
                          type="number" min={0} value={editMin}
                          onChange={(e) => setEditMin(e.target.value)}
                          className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                          placeholder="35"
                        />
                      </div>
                      <div className="flex-1 border border-border px-2 py-1.5">
                        <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-0.5">Sek</p>
                        <input
                          type="number" min={0} max={59} value={editSec}
                          onChange={(e) => setEditSec(e.target.value)}
                          className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                          placeholder="42"
                        />
                      </div>
                    </div>
                    <div className="border border-border px-2 py-1.5">
                      <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-0.5">Datum (optional)</p>
                      <input
                        type="date" value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleSave(label)}
                      disabled={upsertPR.isPending}
                      className="border border-blue text-blue text-xs tracking-widest uppercase font-sans py-2 hover:bg-blueDim disabled:opacity-40"
                    >
                      {upsertPR.isPending ? "..." : "› Speichern"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gear Section
// ---------------------------------------------------------------------------
function GearSection() {
  const { data: gear = [], isLoading } = useGear();
  const createGear = useCreateGear();
  const updateGear = useUpdateGear();
  const deleteGear = useDeleteGear();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("shoes");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newKm, setNewKm] = useState("0");
  const [newDate, setNewDate] = useState("");

  const handleCreate = async () => {
    if (!newName) return;
    await createGear.mutateAsync({
      gear_type: newType,
      name: newName,
      brand: newBrand || undefined,
      model: newModel || undefined,
      initial_km: parseFloat(newKm) || 0,
      purchase_date: newDate || undefined,
    });
    setShowForm(false);
    setNewName(""); setNewBrand(""); setNewModel(""); setNewKm("0"); setNewDate("");
  };

  const gearTypeLabel: Record<string, string> = {
    shoes: "Laufschuhe",
    bike: "Fahrrad",
    wetsuit: "Neoprenanzug",
    other: "Sonstiges",
  };

  return (
    <div className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans">Ausrüstung</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] tracking-widest uppercase text-blue font-sans"
        >
          {showForm ? "×" : "+ Hinzufügen"}
        </button>
      </div>

      {showForm && (
        <div className="border border-border px-4 py-4 mb-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {["shoes", "bike", "wetsuit", "other"].map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={`flex-1 border text-[10px] tracking-widest uppercase font-sans py-1.5 ${
                  newType === t ? "border-blue text-blue" : "border-border text-textDim"
                }`}
              >
                {gearTypeLabel[t]}
              </button>
            ))}
          </div>
          {[
            { label: "Name *", val: newName, set: setNewName, placeholder: "z.B. Pegasus 40", type: "text" },
            { label: "Marke", val: newBrand, set: setNewBrand, placeholder: "Nike", type: "text" },
            { label: "Modell", val: newModel, set: setNewModel, placeholder: "Pegasus 40", type: "text" },
            { label: "Start-km", val: newKm, set: setNewKm, placeholder: "0", type: "number" },
          ].map(({ label, val, set, placeholder, type }) => (
            <div key={label} className="border border-border px-3 py-2">
              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-0.5">{label}</p>
              <input
                type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
              />
            </div>
          ))}
          <div className="border border-border px-3 py-2">
            <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-0.5">Kaufdatum</p>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-transparent text-sm font-sans text-textMain outline-none" />
          </div>
          <button
            onClick={handleCreate}
            disabled={createGear.isPending || !newName}
            className="border border-blue text-blue text-xs tracking-widest uppercase font-sans py-2.5 hover:bg-blueDim disabled:opacity-40"
          >
            {createGear.isPending ? "..." : "› Speichern"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs font-sans text-textDim">Lade Ausrüstung…</p>
      ) : gear.length === 0 ? (
        <p className="text-xs font-sans text-textDim text-center py-6">
          Noch keine Ausrüstung eingetragen.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {gear.map((g: GearItem) => (
            <div key={g.id} className={`border px-3 py-3 ${g.retired ? "border-border opacity-50" : "border-border"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-textDim font-sans">
                    {gearTypeLabel[g.gear_type] ?? g.gear_type}
                    {g.retired && " · Ausgemustert"}
                  </p>
                  <p className="text-sm font-sans text-textMain mt-0.5">{g.name}</p>
                  {(g.brand || g.model) && (
                    <p className="text-[10px] font-sans text-textDim">{[g.brand, g.model].filter(Boolean).join(" ")}</p>
                  )}
                  <p className="text-[10px] font-sans text-textDim mt-1">Start: {g.initial_km} km</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <button
                    onClick={() => updateGear.mutate({ id: g.id, retired: !g.retired })}
                    className="text-[10px] tracking-widest uppercase text-textDim font-sans"
                  >
                    {g.retired ? "Reaktivieren" : "Ausmustern"}
                  </button>
                  <button
                    onClick={() => deleteGear.mutate(g.id)}
                    className="text-[10px] tracking-widest uppercase text-danger font-sans"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Tab = "fitness" | "bestzeiten" | "ausruestung" | "abzeichen";

export default function FitnessPage() {
  const [tab, setTab] = useState<Tab>("fitness");

  return (
    <div className="min-h-full bg-bg">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 border-b border-border">
        <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">Analytics</p>
        <h1 className="font-pixel text-textMain" style={{ fontSize: 22 }}>Fitness</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["fitness", "bestzeiten", "ausruestung", "abzeichen"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[10px] tracking-widest uppercase font-sans border-b-2 transition-colors ${
              tab === t
                ? "border-b-blue text-textMain"
                : "border-b-transparent text-textDim"
            }`}
          >
            {t === "fitness" ? "Fitness" : t === "bestzeiten" ? "Bestzeiten" : t === "ausruestung" ? "Ausrüstung" : "Abzeichen"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "fitness" && <FitnessSection />}
      {tab === "bestzeiten" && <PRsSection />}
      {tab === "ausruestung" && <GearSection />}
      {tab === "abzeichen" && <AchievementsSection />}
    </div>
  );
}

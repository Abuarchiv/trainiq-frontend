"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { SportIcon } from "@/components/ui/SportIcon";

const SPORTS = [
  { id: "running",   label: "LAUFEN" },
  { id: "cycling",   label: "RADFAHREN" },
  { id: "swimming",  label: "SCHWIMMEN" },
  { id: "triathlon", label: "TRIATHLON" },
];

const FITNESS_LEVELS = [
  { id: "beginner",     label: "EINSTEIGER" },
  { id: "intermediate", label: "FORTGESCHRITTEN" },
  { id: "advanced",     label: "PROFI" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [loading, setLoading] = useState(false);

  // Optional: Personal data
  const [birthDate, setBirthDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");

  // Watch State
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [providerMsg, setProviderMsg] = useState<string>("");
  // Garmin modal
  const [garminModal, setGarminModal] = useState(false);
  const [garminEmail, setGarminEmail] = useState("");
  const [garminPassword, setGarminPassword] = useState("");
  const [garminLoading, setGarminLoading] = useState(false);
  const [garminError, setGarminError] = useState("");
  // File upload modal
  const [uploadModal, setUploadModal] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api.get("/watch/status", { signal: controller.signal })
      .then((resp) => {
        const ids = new Set<string>(
          (resp.data.connected || []).map((c: { provider: string }) => c.provider)
        );
        setConnectedProviders(ids);
      })
      .catch(() => {
        // Watch status failure is non-critical on onboarding
      });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const provider = params.get("provider_connected");
      if (provider) setConnectedProviders((prev) => new Set(Array.from(prev).concat(provider)));
    }

    return () => controller.abort();
  }, []);

  const ONBOARDING_PROVIDERS = [
    { id: "garmin", label: "GARMIN",       type: "credentials" as const, hint: "Garmin Connect E-Mail + Passwort" },
    { id: "polar",  label: "POLAR",        type: "file_upload" as const, hint: "GPX aus sport.polar.com exportieren" },
    { id: "apple",  label: "APPLE HEALTH", type: "file_upload" as const, hint: "GPX aus iOS Health exportieren" },
  ] as const;

  const handleProviderClick = async (p: typeof ONBOARDING_PROVIDERS[number]) => {
    if (p.type === "credentials") { setGarminModal(true); return; }
    if (p.type === "file_upload") { setUploadModal(p.id); setUploadFile(null); setUploadMsg(""); return; }
  };

  const handleGarminLogin = async () => {
    if (!garminEmail || !garminPassword) return;
    setGarminLoading(true);
    setGarminError("");
    try {
      await api.post("/watch/garmin/login", { email: garminEmail, password: garminPassword });
      setConnectedProviders((prev) => new Set(Array.from(prev).concat("garmin")));
      setGarminModal(false);
      setGarminEmail("");
      setGarminPassword("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      setGarminError(detail || "Login fehlgeschlagen. Prüfe E-Mail und Passwort.");
    } finally {
      setGarminLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadModal) return;
    setUploadLoading(true);
    setUploadMsg("");
    try {
      const form = new FormData();
      form.append("provider", uploadModal);
      form.append("file", uploadFile);
      const resp = await api.post("/watch/upload-gpx", form, { headers: { "Content-Type": "multipart/form-data" } });
      setConnectedProviders((prev) => new Set(Array.from(prev).concat(uploadModal)));
      setUploadMsg(`✓ ${resp.data.activity_name} importiert`);
      setTimeout(() => setUploadModal(null), 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      setUploadMsg(`! ${detail || "Upload fehlgeschlagen."}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const toggleSport = (id: string) =>
    setSelectedSports((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const [goalError, setGoalError] = useState(false);

  const saveGoals = async () => {
    setLoading(true);
    setGoalError(false);
    try {
      await api.post("/user/goals", {
        sport: selectedSports[0] ?? "running",
        goal_description: goal,
        target_date: targetDate || null,
        weekly_hours: weeklyHours,
        fitness_level: fitnessLevel,
      });
      setStep(3);
    } catch {
      setGoalError(true);
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    setLoading(true);
    try {
      await api.post("/watch/sync");
    } catch { /* ignore */ }
    localStorage.setItem("onboarding_done", "1");
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between px-6 py-10 max-w-sm mx-auto">

      {/* Progress dots */}
      <div className="flex gap-2 self-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-[3px] w-8 transition-colors ${s <= step ? "bg-blue" : "bg-border"}`} />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center w-full gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Schritt 1 / 3</p>
            <h1 className="font-pixel text-textMain" style={{ fontSize: 36 }}>DEIN SPORT</h1>
            <p className="text-sm font-sans text-textDim mt-1">Mehrfachauswahl möglich.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSport(s.id)}
                className={`border p-5 flex flex-col items-center gap-2 transition-colors ${
                  selectedSports.includes(s.id)
                    ? "border-blue bg-blueDim"
                    : "border-border hover:border-textDim"
                }`}
              >
                <SportIcon sport={s.id} size={24} className="text-textDim" />
                <span className="text-xs tracking-widest uppercase font-sans text-textMain">{s.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => selectedSports.length > 0 && setStep(2)}
            disabled={selectedSports.length === 0}
            className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors disabled:opacity-30"
          >
            Weiter →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center w-full gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Schritt 2 / 3</p>
            <h1 className="font-pixel text-textMain" style={{ fontSize: 36 }}>DEIN ZIEL</h1>
          </div>
          <div className="border border-border flex items-start px-4 py-3 gap-2">
            <span className="font-mono text-blue mt-0.5">›</span>
            <textarea
              placeholder="z.B. Halbmarathon unter 2 Stunden in 6 Monaten"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className="flex-1 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none resize-none"
            />
          </div>
          <div className="border border-border px-4 py-3">
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Zieldatum (optional)</p>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent text-sm font-sans text-textMain outline-none w-full"
            />
          </div>
          <div className="border border-border px-4 py-3">
            <div className="flex justify-between mb-2">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans">Wöchentliche Stunden</p>
              <p className="font-pixel text-blue" style={{ fontSize: 18 }}>{weeklyHours}h</p>
            </div>
            <input
              type="range" min={1} max={20} value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full metric-range"
              style={{ "--range-fill": `${(weeklyHours - 1) / 19 * 100}%` } as React.CSSProperties}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs font-sans text-textDim">1h</span>
              <span className="text-xs font-sans text-textDim">20h</span>
            </div>
          </div>

          {/* Fitnesslevel */}
          <div>
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Fitnesslevel</p>
            <div className="flex gap-2">
              {FITNESS_LEVELS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFitnessLevel(f.id)}
                  className={`flex-1 border py-2 text-xs tracking-widest uppercase font-sans transition-colors ${
                    fitnessLevel === f.id
                      ? "border-blue text-blue bg-blueDim"
                      : "border-border text-textDim hover:border-textDim"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {goalError && (
            <p className="text-xs font-sans text-danger tracking-widest">! Ziele konnten nicht gespeichert werden. Bitte versuche es erneut.</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-textDim transition-colors">
              ← Zurück
            </button>
            <button
              onClick={saveGoals}
              disabled={goal.length < 3 || loading}
              className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors disabled:opacity-30"
            >
              {loading ? "Wird gespeichert..." : "Weiter →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center w-full gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Schritt 3 / 3</p>
            <h1 className="font-pixel text-textMain" style={{ fontSize: 36 }}>UHR VERBINDEN</h1>
            <p className="text-sm font-sans text-textDim mt-1">Optional — du kannst auch manuell Daten eingeben.</p>
          </div>
          <div className="flex flex-col gap-3">
            {providerMsg && (
              <p className="text-xs font-sans text-blue tracking-widest py-1">› {providerMsg}</p>
            )}
            {ONBOARDING_PROVIDERS.map((p) => {
              const isConnected = connectedProviders.has(p.id);
              const isConnecting = connectingProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => !isConnected && handleProviderClick(p)}
                  disabled={isConnected || isConnecting}
                  className={`w-full border text-xs tracking-widest uppercase font-sans py-3 transition-colors text-left px-4 flex flex-col disabled:cursor-default ${
                    isConnected ? "border-blue text-blue" : "border-border text-textMain hover:border-blue hover:text-blue"
                  }`}
                >
                  <span className="flex justify-between w-full">
                    <span><span className="text-textDim mr-2">›</span> {p.label}</span>
                    {isConnected && <span className="text-[10px] text-blue">✓ VERBUNDEN</span>}
                    {isConnecting && <span className="text-[10px] text-textDim">...</span>}
                  </span>
                  {!isConnected && <span className="text-[9px] text-textDim mt-0.5 pl-4">{p.hint}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 mt-4">
             <button onClick={() => setStep(2)} className="w-full text-textDim text-xs tracking-widest uppercase font-sans py-2 hover:text-textMain transition-colors">
                 ← Zurück
             </button>
             <button onClick={finish} disabled={loading} className="w-full border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:text-textMain hover:border-textMain transition-colors disabled:opacity-40">
                {loading ? "Wird eingerichtet..." : "Anbindung überspringen"}
             </button>
          </div>
        </div>
      )}

      {/* Garmin Login Modal */}
      {garminModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-bg border border-border w-full max-w-sm p-6 flex flex-col gap-4">
            <p className="font-pixel text-textMain text-lg">GARMIN LOGIN</p>
            <p className="text-xs font-sans text-textDim">Deine Garmin-Connect-Zugangsdaten. Wir speichern nur sichere Tokens — nie dein Passwort.</p>
            <div className="border border-border px-3 py-2">
              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">E-Mail</p>
              <input type="email" value={garminEmail} onChange={(e) => setGarminEmail(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain outline-none" autoComplete="email" />
            </div>
            <div className="border border-border px-3 py-2">
              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">Passwort</p>
              <input type="password" value={garminPassword} onChange={(e) => setGarminPassword(e.target.value)}
                className="w-full bg-transparent text-sm font-sans text-textMain outline-none" autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleGarminLogin()} />
            </div>
            {garminError && <p className="text-xs font-sans text-danger">! {garminError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setGarminModal(false); setGarminError(""); }}
                className="flex-1 border border-border text-textDim text-xs uppercase tracking-widest font-sans py-2.5">Abbrechen</button>
              <button onClick={handleGarminLogin} disabled={garminLoading || !garminEmail || !garminPassword}
                className="flex-1 border border-blue text-blue text-xs uppercase tracking-widest font-sans py-2.5 hover:bg-blueDim disabled:opacity-40">
                {garminLoading ? "Verbinde..." : "› Anmelden"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-bg border border-border w-full max-w-sm p-6 flex flex-col gap-4">
            <p className="font-pixel text-textMain text-lg">{uploadModal === "polar" ? "POLAR" : "APPLE HEALTH"}</p>
            <p className="text-xs font-sans text-textDim">
              {uploadModal === "polar"
                ? "Öffne sport.polar.com › Training › Aktivität › Export GPX und lade die Datei hoch."
                : "Exportiere eine GPX-Datei aus deiner iOS Health App oder einer kompatiblen App."}
            </p>
            <label className="border border-border px-4 py-5 flex flex-col items-center gap-2 cursor-pointer hover:border-blue transition-colors">
              <span className="text-xs font-sans text-textDim tracking-widest uppercase">{uploadFile ? uploadFile.name : "GPX / TCX Datei wählen"}</span>
              <input type="file" accept=".gpx,.tcx,.xml" className="hidden"
                onChange={(e) => { setUploadFile(e.target.files?.[0] ?? null); setUploadMsg(""); }} />
            </label>
            {uploadMsg && <p className={`text-xs font-sans ${uploadMsg.startsWith("!") ? "text-danger" : "text-blue"}`}>{uploadMsg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setUploadModal(null)}
                className="flex-1 border border-border text-textDim text-xs uppercase tracking-widest font-sans py-2.5">Abbrechen</button>
              <button onClick={handleFileUpload} disabled={uploadLoading || !uploadFile}
                className="flex-1 border border-blue text-blue text-xs uppercase tracking-widest font-sans py-2.5 hover:bg-blueDim disabled:opacity-40">
                {uploadLoading ? "Importiere..." : "› Importieren"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div /> {/* spacer */}
    </div>
  );
}

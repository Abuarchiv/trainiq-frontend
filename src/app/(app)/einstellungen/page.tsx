"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Unlink, Check } from "lucide-react";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useBilling } from "@/hooks/useBilling";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/hooks/useI18n";

// Verbindungs-Typ:
//   "credentials"  → E-Mail + Passwort (Garmin)
//   "oauth"        → Direkt OAuth-Redirect zum Anbieter
//   "apple_pair"   → iOS HealthKit Koppelcode
//
// Verfügbare Anbieter (kein API-Key nötig):
//   Garmin   → garminconnect-Library (E-Mail + Passwort)
//   Strava   → kostenloser OAuth-Hub — deckt ab:
//              Polar, Wahoo, Suunto, COROS, Zepp/Amazfit, Fitbit,
//              Samsung Health, WHOOP, Google Fit (Wear OS), Apple Watch
//   Apple    → iOS HealthKit Koppelcode (kein API-Key)
const PROVIDERS = [
  { id: "garmin",      name: "Garmin Connect", type: "credentials" as const, connectPath: "/watch/garmin/login",       disconnectPath: "/watch/garmin/disconnect",  hint: "Garmin-Connect E-Mail + Passwort" },
  { id: "strava",      name: "Strava",         type: "oauth" as const,       connectPath: "/watch/strava/connect",     disconnectPath: "/watch/strava/disconnect",  hint: "Strava verbinden — synchronisiert automatisch mit Polar, Wahoo, Suunto, COROS, Zepp/Amazfit, Fitbit, Samsung Health, WHOOP und allen Wear-OS-Uhren" },
  { id: "apple_watch", name: "Apple Watch",    type: "apple_pair" as const,  connectPath: "/watch/apple/pair",         disconnectPath: "/watch/apple/disconnect",   hint: "iOS HealthKit – Koppelcode generieren" },
];

const FITNESS_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const SPORTS = ["running", "cycling", "swimming", "triathlon"] as const;

export default function EinstellungenPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const isGuest = !token;
  const { t } = useI18n();
  const { fetchSubscription } = useBilling();

  useEffect(() => {
    if (!isGuest) fetchSubscription();
  }, [fetchSubscription, isGuest]);

  // Profil-State
  const [profileLoading, setProfileLoading] = useState(true);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Ziele-State
  const [sports, setSports] = useState<Set<string>>(new Set(["running"]));
  const [goalDescription, setGoalDescription] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [fitnessLevel, setFitnessLevel] = useState("intermediate");
  const [targetDate, setTargetDate] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  // Watch-State
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [availableProviders, setAvailableProviders] = useState<Set<string>>(new Set<string>(PROVIDERS.map((p) => p.id)));
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});
  const [watchLoading, setWatchLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  // Garmin credential form
  const [garminEmail, setGarminEmail] = useState("");
  const [garminPassword, setGarminPassword] = useState("");
  const [garminLoading, setGarminLoading] = useState(false);
  // Apple Watch pairing
  const [applePairToken, setApplePairToken] = useState<string | null>(null);
  const [applePairLoading, setApplePairLoading] = useState(false);
  // Datei-Import (.fit / .tcx / .gpx / .csv)
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; message: string } | null>(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Connected banner (after OAuth redirect or Garmin login)
  const [connectedBanner, setConnectedBanner] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [goalError, setGoalError] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Timer refs for cleanup on unmount
  const profileSavedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const goalSavedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const passwordSavedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const connectedBannerTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    return () => {
      clearTimeout(profileSavedTimerRef.current);
      clearTimeout(goalSavedTimerRef.current);
      clearTimeout(passwordSavedTimerRef.current);
      clearTimeout(connectedBannerTimerRef.current);
    };
  }, []);

  // Profil + Ziele laden
  useEffect(() => {
    if (isGuest) {
      setProfileLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const { data } = await api.get("/user/profile", { signal: controller.signal });
        setName(data.name || "");
        setBirthDate(data.birth_date || "");
        setGender(data.gender || "");
        setWeightKg(data.weight_kg);
        setHeightCm(data.height_cm);
        if (data.goals && data.goals.length > 0) {
          const g = data.goals[0];
          setSports(new Set((g.sport || "running").split(",").map((s: string) => s.trim()).filter(Boolean)));
          setGoalDescription(g.goal_description || "");
          setWeeklyHours(g.weekly_hours || 5);
          setFitnessLevel(g.fitness_level || "intermediate");
          setTargetDate(g.target_date || "");
        }
      } catch {
        setProfileError(t("settings.profileLoadFailed"));
      } finally {
        setProfileLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [isGuest, t]);

  // Watch-Status laden + Provider-Connected-Param erkennen
  useEffect(() => {
    if (isGuest) {
      setWatchLoading(false);
      return;
    }
    const controller = new AbortController();
    const loadWatch = async () => {
      try {
        const { data } = await api.get("/watch/status", { signal: controller.signal });
        const ids = new Set<string>(
          (data.connected || []).map((c: { provider: string }) => c.provider)
        );
        setConnectedProviders(ids);
        // Build set of configured providers from availability flags
        const avail = new Set<string>();
        avail.add("garmin");      // always — uses garminconnect SSO
        if (data.strava_available) avail.add("strava");
        avail.add("apple_watch"); // always — uses pairing code
        setAvailableProviders(avail);
      } catch {
        // Watch status failure is non-critical — UI degrades gracefully
      } finally {
        setWatchLoading(false);
      }
    };
    loadWatch();

    // Detect ?provider=<name> after OAuth redirect or Garmin login
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const provider = params.get("provider");
      if (provider) {
        setConnectedBanner(provider);
        window.history.replaceState({}, "", window.location.pathname);
        queryClient.invalidateQueries({ queryKey: ["training-week"] });
        queryClient.invalidateQueries({ queryKey: ["training-stats"] });
        queryClient.invalidateQueries({ queryKey: ["metrics-today"] });
        queryClient.invalidateQueries({ queryKey: ["metrics-week"] });
        queryClient.invalidateQueries({ queryKey: ["metrics-recovery"] });
        queryClient.invalidateQueries({ queryKey: ["streak"] });
        queryClient.invalidateQueries({ queryKey: ["achievements"] });
        clearTimeout(connectedBannerTimerRef.current);
        connectedBannerTimerRef.current = setTimeout(() => setConnectedBanner(null), 6000);
      }
    }

    return () => controller.abort();
  }, [queryClient, isGuest]);

  const handleConnect = useCallback(async (p: typeof PROVIDERS[number]) => {
    setConnectingProvider(p.id);
    setProviderErrors((prev) => ({ ...prev, [p.id]: "" }));
    try {
      const { data } = await api.get<{ auth_url: string }>(p.connectPath!);
      window.location.href = data.auth_url;
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      setProviderErrors((prev) => ({ ...prev, [p.id]: detail || "Verbindung fehlgeschlagen." }));
    } finally {
      setConnectingProvider(null);
    }
  }, []);

  const handleApplePair = useCallback(async () => {
    setApplePairLoading(true);
    setProviderErrors((prev) => ({ ...prev, apple_watch: "" }));
    try {
      const { data } = await api.post<{ pairing_token: string }>("/watch/apple/pair");
      setApplePairToken(data.pairing_token);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      setProviderErrors((prev) => ({ ...prev, apple_watch: detail || "Kopplung fehlgeschlagen." }));
    } finally {
      setApplePairLoading(false);
    }
  }, []);

  const handleGarminLogin = useCallback(async () => {
    if (!garminEmail || !garminPassword) return;
    setGarminLoading(true);
    setProviderErrors((prev) => ({ ...prev, garmin: "" }));
    try {
      // Garmin SSO can take 60-120s — override the global 30s timeout
      await api.post("/watch/garmin/login", { email: garminEmail, password: garminPassword }, { timeout: 120000 });
      // Always redirect relative so we don't depend on FRONTEND_URL being correctly configured
      window.location.href = window.location.pathname + "?provider=garmin";
    } catch (err: unknown) {
      const axiosErr = err as { code?: string; response?: { data?: { detail?: string } } };
      const timedOut = axiosErr.code === "ECONNABORTED";
      const detail = axiosErr.response?.data?.detail ?? "";
      setProviderErrors((prev) => ({
        ...prev,
        garmin: timedOut
          ? "Verbindung dauerte zu lang. Bitte nochmal versuchen."
          : detail || "Login fehlgeschlagen. Prüfe E-Mail und Passwort.",
      }));
      setGarminLoading(false);
    }
  }, [garminEmail, garminPassword]);

  const handleDisconnect = useCallback(async (providerId: string, disconnectPath: string) => {
    setDisconnectingProvider(providerId);
    setProviderErrors((prev) => ({ ...prev, [providerId]: "" }));
    try {
      await api.post(disconnectPath);
      setConnectedProviders((prev) => {
        const next = new Set(prev);
        next.delete(providerId);
        return next;
      });
    } catch {
      setProviderErrors((prev) => ({ ...prev, [providerId]: "Trennen fehlgeschlagen." }));
    } finally {
      setDisconnectingProvider(null);
    }
  }, []);

  const saveProfile = useCallback(async () => {
    setProfileSaving(true);
    setProfileError("");
    try {
      await api.put("/user/profile", {
        name,
        birth_date: birthDate || null,
        gender: gender || null,
        weight_kg: weightKg,
        height_cm: heightCm,
      });
      setProfileSaved(true);
      clearTimeout(profileSavedTimerRef.current);
      profileSavedTimerRef.current = setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      setProfileError(t("settings.profileSaveFailed"));
    } finally {
      setProfileSaving(false);
    }
  }, [name, birthDate, gender, weightKg, heightCm, t]);

  const saveGoals = useCallback(async () => {
    if (!goalDescription.trim()) return;
    setGoalSaving(true);
    setGoalError(false);
    try {
      await api.post("/user/goals", {
        sport: Array.from(sports).join(",") || "running",
        goal_description: goalDescription,
        weekly_hours: weeklyHours,
        fitness_level: fitnessLevel,
        target_date: targetDate || null,
      });
      setGoalSaved(true);
      clearTimeout(goalSavedTimerRef.current);
      goalSavedTimerRef.current = setTimeout(() => setGoalSaved(false), 2000);
    } catch {
      setGoalError(true);
    } finally {
      setGoalSaving(false);
    }
  }, [goalDescription, sports, weeklyHours, fitnessLevel, targetDate]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/keycloak/logout", { refresh_token: "" });
    } catch {
      // Ignore errors — local logout proceeds regardless
    }
    logout();
    router.replace("/login");
  }, [logout, router]);

  const handleCancelPasswordChange = useCallback(() => {
    setShowPasswordForm(false);
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, []);

  const handleFileImport = useCallback(async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", importFile);
      const { data } = await api.post("/watch/import/file", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      setImportResult(data);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["training-week"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setImportError(e?.response?.data?.detail ?? "Import fehlgeschlagen.");
    } finally {
      setImportLoading(false);
    }
  }, [importFile, queryClient]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete("/user/account");
      logout();
      router.replace("/login");
    } catch {
      setDeleteError(t("settings.deleteAccountFailed"));
      setDeleting(false);
    }
  }, [logout, router, t]);

  const handleChangePassword = useCallback(async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t("settings.allFieldsRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("settings.passwordTooShort"));
      return;
    }
    if (!/[^a-zA-Z]/.test(newPassword)) {
      setPasswordError(t("settings.passwordSpecialChar"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      clearTimeout(passwordSavedTimerRef.current);
      passwordSavedTimerRef.current = setTimeout(() => {
        setPasswordSaved(false);
        setShowPasswordForm(false);
      }, 2000);
    } catch {
      setPasswordError(t("settings.passwordChangeFailed"));
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword, t]);

  // Memoized derived values — avoid recomputing on every render
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrow = useMemo(
    () => new Date(Date.now() + 86400000).toISOString().split("T")[0],
    []
  );
  const connectedList = useMemo(
    () => PROVIDERS.filter((p) => connectedProviders.has(p.id)),
    [connectedProviders]
  );
  const unconnectedList = useMemo(
    () => PROVIDERS.filter((p) => !connectedProviders.has(p.id) && availableProviders.has(p.id)),
    [connectedProviders, availableProviders]
  );
  // Derive the selected provider from unconnectedList to avoid a second PROVIDERS.find in JSX
  const selectedProviderData = useMemo(
    () => unconnectedList.find((pr) => pr.id === selectedProvider) ?? null,
    [unconnectedList, selectedProvider]
  );

  if (isGuest) {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <span className="font-pixel text-blue text-xl">{t("settings.title")}</span>
        </div>
        {/* Gast-Banner */}
        <div className="px-5 py-5 border-b border-border">
          <p className="font-pixel text-blue text-sm mb-2">GAST-MODUS</p>
          <p className="text-xs font-sans text-textDim leading-relaxed mb-4">
            Registriere dich kostenlos für vollständigen Zugriff: Profil, Ziele, verbundene Geräte und mehr.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/register")}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors"
            >
              › Kostenlos registrieren
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3 hover:border-textDim transition-colors"
            >
              › Einloggen
            </button>
          </div>
        </div>
        {/* Uhr verbinden — Login erforderlich */}
        <div className="px-5 py-5 border-b border-border">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">Verbundene Geräte</p>
          <div className="border border-border px-4 py-5">
            <p className="font-pixel text-blue text-sm mb-2">LOGIN ERFORDERLICH</p>
            <p className="text-xs font-sans text-textDim leading-relaxed mb-4">
              Verbinde deine Sportuhr oder Fitness-Tracker — dafür ist ein Account notwendig.
            </p>
            <button
              onClick={() => router.push("/register")}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-2.5 hover:bg-blueDim transition-colors"
            >
              › Jetzt registrieren
            </button>
          </div>
        </div>
        {/* Language */}
        <LanguageSwitcher />
      </div>
    );
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <span className="font-pixel text-blue text-xl">{t("settings.title")}</span>
      </div>

      {/* Profil */}
      <div className="px-5 py-5 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">{t("settings.account")}</p>
        {profileLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-border" />
            <div className="h-10 bg-border" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs font-sans text-textDim tracking-widest uppercase">{t("settings.email")}</span>
              <span className="text-sm font-sans text-textMain">{user?.email ?? "—"}</span>
            </div>
            {/* Name */}
            <div className="border border-border px-3 py-2">
              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.name")}</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoComplete="name"
                className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
              />
            </div>
            {/* Geburtstag */}
            <div className="border border-border px-3 py-2">
              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.birthDate")}</p>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={today}
                className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
              />
            </div>
            {/* Geschlecht */}
            <div className="border border-border px-3 py-2">
              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.gender")}</p>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-bg text-sm font-sans text-textMain outline-none"
              >
                <option value="">{t("settings.genderUnspecified")}</option>
                <option value="male">{t("settings.genderMale")}</option>
                <option value="female">{t("settings.genderFemale")}</option>
                <option value="other">{t("settings.genderOther")}</option>
              </select>
            </div>
            {/* Körperdaten */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border px-3 py-2">
                <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.weight")}</p>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="z.B. 75"
                  min={0}
                  value={weightKg ?? ""}
                  onChange={(e) => { const v = parseFloat(e.target.value); setWeightKg(e.target.value === "" || isNaN(v) ? null : v); }}
                  className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                />
              </div>
              <div className="border border-border px-3 py-2">
                <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.height")}</p>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="z.B. 180"
                  min={0}
                  value={heightCm ?? ""}
                  onChange={(e) => { const v = parseFloat(e.target.value); setHeightCm(e.target.value === "" || isNaN(v) ? null : v); }}
                  className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                />
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3 hover:bg-blueDim transition-colors disabled:opacity-40"
            >
              {profileSaved ? t("settings.profileSaved") : profileSaving ? "..." : `› ${t("settings.saveProfile")}`}
            </button>
            {profileError && (
              <p className="text-xs font-sans text-danger mt-2" role="alert">{profileError}</p>
            )}
          </div>
        )}
      </div>

      {/* Ziele bearbeiten */}
      <div className="px-5 py-5 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-5">{t("settings.goals")}</p>

        {profileLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-border" />
            <div className="h-20 bg-border" />
            <div className="h-10 bg-border" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Sport */}
            <div>
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{t("settings.sport")}</p>
              <div className="grid grid-cols-2 gap-2">
                {SPORTS.map((id) => {
                  const active = sports.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => setSports((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) { next.delete(id); } else { next.add(id); }
                        return next.size === 0 ? prev : next;
                      })}
                      className={`border py-2.5 text-xs tracking-widest uppercase font-sans transition-colors flex items-center justify-center gap-1.5 ${
                        active
                          ? "border-blue text-blue bg-blueDim"
                          : "border-border text-textDim hover:border-textDim"
                      }`}
                    >
                      {t(`sports.${id}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ziel */}
            <div className="border border-border flex items-center px-3 py-3 gap-2">
              <span className="font-mono text-blue shrink-0">›</span>
              <textarea
                placeholder={t("settings.goalPlaceholder")}
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                rows={2}
                className="flex-1 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none resize-none"
              />
            </div>

            {/* Wochenstunden */}
            <div className="border border-border px-4 py-3">
              <div className="flex justify-between mb-2">
                <p className="text-xs tracking-widest uppercase text-textDim font-sans">{t("settings.weeklyHours")}</p>
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
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{t("settings.fitnessLevel")}</p>
              <div className="flex gap-2">
                {FITNESS_LEVELS.map((id) => (
                  <button
                    key={id}
                    onClick={() => setFitnessLevel(id)}
                    className={`flex-1 border py-2 text-[10px] uppercase font-sans transition-colors ${
                      fitnessLevel === id
                        ? "border-blue text-blue bg-blueDim"
                        : "border-border text-textDim hover:border-textDim"
                    }`}
                  >
                    {t(`settings.${id}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Zieldatum */}
            <div className="border border-border px-4 py-3">
              <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">{t("settings.targetDate")}</p>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={tomorrow}
                className="bg-transparent text-sm font-sans text-textMain outline-none w-full"
              />
            </div>

            {/* Speichern Button */}
            {goalError && (
              <p className="text-xs font-sans text-danger tracking-wider" role="alert">! {t("settings.goalError")}</p>
            )}
            <button
              onClick={saveGoals}
              disabled={goalSaving || !goalDescription.trim()}
              className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors disabled:opacity-40"
            >
              {goalSaved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={14} /> {t("settings.saved")}
                </span>
              ) : goalSaving ? t("settings.saving") : `› ${t("settings.save")}`}
            </button>
          </div>
        )}
      </div>

      {/* Verbundene Geräte */}
      <div className="px-5 py-5 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">Verbundene Geräte</p>
        {connectedBanner && (
          <div className="border border-blue bg-blueDim px-4 py-3 mb-4 flex items-start gap-3">
            <Check size={14} strokeWidth={2} className="text-blue mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-sans text-blue tracking-widest uppercase font-medium">
                {connectedBanner.toUpperCase().replaceAll("_", " ")} verbunden
              </p>
              <p className="text-[10px] font-sans text-textDim mt-0.5">
                Letzten 12 Monate werden im Hintergrund importiert …
              </p>
            </div>
          </div>
        )}
        {watchLoading ? (
          <div className="h-12 bg-border animate-pulse" />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Already connected providers */}
            {connectedList.map((p) => {
              const isDisconnecting = disconnectingProvider === p.id;
              const err = providerErrors[p.id];
              return (
                <div key={p.id} className="border border-blue flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs tracking-widest uppercase font-sans text-textMain">{p.name}</p>
                    <p className="text-[10px] font-sans mt-0.5 text-blue">● Verbunden</p>
                    {err && <p className="text-[10px] font-sans text-danger mt-0.5" role="alert">! {err}</p>}
                  </div>
                  <button
                    onClick={() => handleDisconnect(p.id, p.disconnectPath)}
                    disabled={isDisconnecting}
                    className="flex items-center gap-1.5 border border-border text-textDim text-[10px] uppercase font-sans px-2 py-1.5 hover:border-danger hover:text-danger transition-colors disabled:opacity-40"
                  >
                    <Unlink size={11} />
                    {isDisconnecting ? "..." : "Trennen"}
                  </button>
                </div>
              );
            })}

            {/* Add new device via dropdown */}
            {unconnectedList.length > 0 && (
              <div className="border border-border">
                <div className="px-4 py-3">
                  <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-2">Gerät hinzufügen</p>
                  <select
                    value={selectedProvider}
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      setProviderErrors({});
                    }}
                    className="w-full bg-bg text-sm font-sans text-textMain outline-none px-3 py-2"
                  >
                    <option value="">– Uhr / Tracker wählen –</option>
                    {unconnectedList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Connect form for selected provider */}
                {selectedProviderData && (() => {
                  const p = selectedProviderData;
                  const isConnecting = connectingProvider === p.id;
                  const err = providerErrors[p.id];
                  const connectLabel = p.type === "credentials" ? "Anmelden & Daten importieren" : p.type === "apple_pair" ? "Koppelcode generieren" : "Mit " + p.name + " verbinden";
                  return (
                    <div className="border-t border-border px-4 py-4 flex flex-col gap-3">
                      <p className="text-[10px] font-sans text-textDim">{p.hint}</p>
                      {p.type === "credentials" && (
                        <>
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
                          {err && <p className="text-xs font-sans text-danger" role="alert">! {err}</p>}
                          <button onClick={handleGarminLogin} disabled={garminLoading || !garminEmail || !garminPassword}
                            className="w-full border border-blue text-blue text-xs uppercase tracking-widest font-sans py-2.5 hover:bg-blueDim disabled:opacity-40">
                            {garminLoading ? "Verbinde & importiere..." : "› " + connectLabel}
                          </button>
                        </>
                      )}
                      {p.type === "apple_pair" && (
                        <>
                          <p className="text-[10px] font-sans text-textDim leading-relaxed">
                            Öffne die TrainIQ iOS-App → Einstellungen → Apple Watch verbinden und gib den Code ein:
                          </p>
                          {applePairToken ? (
                            <div className="border border-blue px-4 py-5 text-center">
                              <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-2">Koppelcode</p>
                              <p className="font-pixel text-blue text-2xl tracking-widest">{applePairToken}</p>
                              <p className="text-[10px] font-sans text-textDim mt-3">Code gilt 10 Minuten</p>
                            </div>
                          ) : (
                            <button onClick={handleApplePair} disabled={applePairLoading}
                              className="w-full border border-blue text-blue text-xs uppercase tracking-widest font-sans py-2.5 hover:bg-blueDim disabled:opacity-40">
                              {applePairLoading ? "Generiere Code..." : "› " + connectLabel}
                            </button>
                          )}
                          {err && <p className="text-xs font-sans text-danger" role="alert">! {err}</p>}
                        </>
                      )}
                      {p.type === "oauth" && (
                        <>
                          {err && (
                            err.includes("API-Schlüssel fehlt") ? (
                              <p className="text-[10px] font-sans text-textDim border border-border px-3 py-2 leading-relaxed" role="alert">
                                ⚙ {err}
                              </p>
                            ) : (
                              <p className="text-xs font-sans text-danger" role="alert">! {err}</p>
                            )
                          )}
                          <button onClick={() => handleConnect(p)} disabled={isConnecting}
                            className="w-full border border-blue text-blue text-xs uppercase tracking-widest font-sans py-2.5 hover:bg-blueDim disabled:opacity-40">
                            {isConnecting ? "Weiterleitung..." : "› " + connectLabel}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Datei-Import */}
      {!isGuest && (
        <div className="px-5 py-5 border-b border-border">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-1">Datei-Import</p>
          <p className="text-[10px] font-sans text-textDim mb-4 leading-relaxed">
            Importiere Trainings direkt aus deiner Uhr — kein API-Key nötig.
            Unterstützt: <span className="text-textMain">.fit</span> (Garmin, Suunto, COROS, Wahoo),{" "}
            <span className="text-textMain">.tcx</span> (Garmin, Polar),{" "}
            <span className="text-textMain">.gpx</span> (alle GPS-Uhren),{" "}
            <span className="text-textMain">.csv</span> (Fitbit, Zepp/Amazfit)
          </p>
          <div className="border border-border">
            <div
              className="px-4 py-6 flex flex-col items-center gap-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".fit,.tcx,.gpx,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setImportFile(f);
                  setImportResult(null);
                  setImportError("");
                  e.target.value = "";
                }}
              />
              {importFile ? (
                <p className="text-xs font-sans text-textMain tracking-wide">{importFile.name}</p>
              ) : (
                <p className="text-[10px] font-sans text-textDim tracking-widest uppercase">
                  Datei auswählen (.fit / .tcx / .gpx / .csv)
                </p>
              )}
            </div>
            {importFile && (
              <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
                {importError && (
                  <p className="text-xs font-sans text-danger" role="alert">! {importError}</p>
                )}
                {importResult && (
                  <p className="text-[10px] font-sans text-blue">
                    ✓ {importResult.message}
                  </p>
                )}
                <button
                  disabled={importLoading}
                  onClick={handleFileImport}
                  className="w-full border border-blue text-blue text-xs uppercase tracking-widest font-sans py-2.5 hover:bg-blueDim disabled:opacity-40"
                >
                  {importLoading ? "Importiere..." : "› Importieren"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Push Notifications */}
      <PushNotificationSettings />

      {/* Language */}
      <LanguageSwitcher />

      {/* Passwort */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-3">{t("settings.security")}</p>
        {!showPasswordForm ? (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-sans text-textMain">{t("settings.password")}</p>
              <p className="text-xs font-sans text-textDim mt-0.5">••••••••</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-xs font-sans text-blue tracking-widest uppercase hover:underline"
            >
              {t("settings.changePassword")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {passwordSaved ? (
              <p className="text-xs font-sans text-blue tracking-widest uppercase">{t("settings.passwordSaved")}</p>
            ) : (
              <>
                <div className="border border-border px-3 py-2">
                  <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.currentPassword")}</p>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                  />
                </div>
                <div className="border border-border px-3 py-2">
                  <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.newPassword")}</p>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                  />
                </div>
                <div className="border border-border px-3 py-2">
                  <p className="text-[10px] tracking-widest uppercase text-textDim font-sans mb-1">{t("settings.confirmPassword")}</p>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-sm font-sans text-textMain outline-none"
                  />
                </div>
                {passwordError && (
                  <p className="text-xs font-sans text-danger tracking-wider" role="alert">! {passwordError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelPasswordChange}
                    className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2.5"
                  >
                    {t("settings.cancel")}
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                    className="flex-1 border border-blue text-blue text-xs tracking-widest uppercase font-sans py-2.5 hover:bg-blueDim transition-colors disabled:opacity-40"
                  >
                    {passwordSaving ? "..." : `› ${t("settings.save")}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Abmelden */}
      <div className="px-5 py-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3.5 hover:border-danger hover:text-danger transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          {t("settings.logout")}
        </button>
      </div>

      {/* Account löschen */}
      <div className="px-5 pb-5">
        {!showDeleteAccount ? (
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full text-textDim text-xs tracking-widest uppercase font-sans py-2 hover:text-danger transition-colors"
          >
            {t("settings.deleteAccount")}
          </button>
        ) : (
          <div className="border border-danger p-4">
            <p className="text-xs font-sans text-danger tracking-widest uppercase mb-3">
              ! {t("settings.deleteWarning")}
            </p>
            <p className="text-xs font-sans text-textDim mb-4">
              {t("settings.deleteDesc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 border border-border text-textDim text-xs tracking-widest uppercase font-sans py-2.5"
              >
                {t("settings.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 border border-danger text-danger text-xs tracking-widest uppercase font-sans py-2.5 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {deleting ? "..." : t("settings.deleteConfirm")}
              </button>
            </div>
            {deleteError && (
              <p className="text-xs font-sans text-danger mt-3" role="alert">{deleteError}</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

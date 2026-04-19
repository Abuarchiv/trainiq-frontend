"use client";
import { useState, useRef } from "react";
import { Camera, Trash2, Loader2, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";





export default function ErnaehrungPage() {
  const qc = useQueryClient();
  const { targets, isLoading: targetsLoading } = useNutritionTargets();

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMeal, setUploadedMeal] = useState<null | { meal_name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; confidence: string }>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: nutritionData } = useQuery({
    queryKey: ["nutrition-today"],
    queryFn: () => api.get("/nutrition/today").then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const logs   = Array.isArray(nutritionData?.logs)   ? nutritionData.logs   : [];
  const totals = nutritionData?.totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

  const t = totals;
  const mealList = logs;

  const handleUploadClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Input sofort zurücksetzen damit dieselbe Datei erneut ausgewählt werden kann
    e.target.value = "";
    if (!file) {
      setUploadError("Keine Datei ausgewählt.");
      return;
    }
    setUploading(true);
    setUploadedMeal(null);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("meal_type", "Mahlzeit");
      const { data } = await api.post("/nutrition/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadedMeal(data);
      qc.invalidateQueries({ queryKey: ["nutrition-today"] });
    } catch {
      setUploadError("Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await api.delete(`/nutrition/meal/${id}`);
      qc.invalidateQueries({ queryKey: ["nutrition-today"] });
    } catch {
      setDeleteError("Mahlzeit konnte nicht gelöscht werden. Bitte versuche es erneut.");
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const macros = [
    { label: "Kalorien", val: t.calories,   target: targets.calories,   unit: `${Math.round(t.calories)} / ${targets.calories} kcal`,  dotColor: "bg-textMain", missing: t.calories < targets.calories * 0.8 },
    { label: "Protein",  val: t.protein_g,  target: targets.protein_g,  unit: `${Math.round(t.protein_g)}g`,                           dotColor: "bg-blue",     missing: t.protein_g < targets.protein_g * 0.9 },
    { label: "Carbs",    val: t.carbs_g,    target: targets.carbs_g,    unit: `${Math.round(t.carbs_g)} / ${targets.carbs_g}g`,        dotColor: "bg-[#888]",   missing: t.carbs_g < targets.carbs_g * 0.7 },
    { label: "Fett",     val: t.fat_g,      target: targets.fat_g,      unit: `${Math.round(t.fat_g)} / ${targets.fat_g}g`,            dotColor: "bg-[#888]",   missing: false },
  ];


  const missingMacros = macros.filter(m => m.missing).map(m => m.label);

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <span className="font-pixel text-blue text-xl">ERNÄHRUNG</span>
      </div>

      {/* Upload */}
      <div className="px-5 py-5 border-b border-border">
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className={`w-full border border-dashed py-8 flex flex-col items-center gap-3 transition-colors disabled:opacity-50 ${uploadError ? "border-danger" : "border-border hover:border-blue"}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} strokeWidth={1.5} className="text-blue animate-spin" />
              <span className="text-[10px] font-mono text-blue tracking-widest">ANALYSIERE...</span>
            </div>
          ) : (
            <><Camera size={28} strokeWidth={1.5} className="text-textDim" /><span className="text-xs tracking-widest uppercase text-textDim font-sans">Foto hinzufügen</span></>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

        {uploadError && (
          <div className="mt-3 border border-danger p-3 fade-up">
            <p className="text-xs font-sans text-danger uppercase tracking-widest text-center">{uploadError}</p>
          </div>
        )}

        {uploadedMeal && (
          <div className="mt-3 border border-blue p-4 fade-up">
            <p className="text-xs tracking-widest uppercase text-blue font-sans mb-2">
               Mahlzeit analysiert: {uploadedMeal.meal_name} — {Math.round(uploadedMeal.calories)} kcal ✓
            </p>
            <div className="flex gap-4">
              {[
                { l: "Kcal",    v: Math.round(uploadedMeal.calories) },
                { l: "Protein", v: `${Math.round(uploadedMeal.protein_g)}g` },
                { l: "Carbs",   v: `${Math.round(uploadedMeal.carbs_g)}g` },
                { l: "Fett",    v: `${Math.round(uploadedMeal.fat_g)}g` },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-xs tracking-widest uppercase text-textDim font-sans">{l}</p>
                  <p className="font-pixel text-textMain" style={{ fontSize: 18 }}>{v}</p>
                </div>
              ))}
            </div>
            {uploadedMeal.confidence === "low" && <p className="text-xs text-textDim font-sans mt-2">! Niedrige Erkennungsgenauigkeit — bitte prüfen</p>}
          </div>
        )}
      </div>

      {/* Makros */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans">Heute</p>
          {missingMacros.length > 0 && <p className="text-xs font-sans text-blue">● {missingMacros.join(", ")} fehlen</p>}
        </div>
        {macros.map((m, i) => (
          <div key={i} className="flex items-center gap-2 mb-2.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.missing ? "bg-blue" : m.dotColor}`} />
            <span className={`text-xs font-sans w-14 tracking-wider uppercase shrink-0 ${m.missing ? "text-blue" : "text-textDim"}`}>{m.label}</span>
            <div className="bar-track flex-1"><div className={`bar-fill ${m.missing ? "bg-blue" : m.dotColor}`} style={{ width: `${m.target > 0 ? Math.min(100, (m.val / m.target) * 100) : 0}%` }} /></div>
            <span className="font-sans text-textDim whitespace-nowrap" style={{ fontSize: 11 }}>{m.unit}</span>
          </div>
        ))}
        {targets.rationale && !targetsLoading && (
          <p className="text-xs font-sans text-textDim leading-relaxed mt-1 mb-2">
            {targets.rationale}
          </p>
        )}
      </div>


      {/* Mahlzeiten Liste */}
      <div className="px-5 py-5 border-b border-border">
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-4">Mahlzeiten</p>
        {mealList.length === 0 ? (
          <div className="border border-dashed border-border p-6 text-center">
            <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Keine Mahlzeiten</p>
            <p className="text-sm font-sans text-textDim mb-4">Noch keine Mahlzeiten erfasst.</p>
            <button
              onClick={handleUploadClick}
              className="inline-block border border-blue text-blue text-xs tracking-widest uppercase font-sans px-6 py-2.5 hover:bg-blueDim transition-colors"
            >
              › Foto aufnehmen
            </button>
          </div>
        ) : (
          mealList.map((meal: { id: string; logged_at: string; meal_type: string | null; meal_name?: string; calories: number | null }) => (
            <div key={meal.id} className="group">
              <div className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-sans text-textDim tracking-widest uppercase mb-0.5">
                    {new Date(meal.logged_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    {meal.meal_type ? ` · ${meal.meal_type}` : ""}
                  </p>
                  <p className="text-sm font-sans text-textMain truncate">{meal.meal_name ?? meal.meal_type ?? "Mahlzeit"}</p>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <p className="font-pixel text-textDim" style={{ fontSize: 16 }}>{Math.round(meal.calories ?? 0)}</p>
                  {deleteConfirm === meal.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1 text-textDim hover:text-textMain transition-colors"
                      >
                        <X size={12} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={deletingId === meal.id}
                        className="p-1 text-danger transition-colors disabled:opacity-40"
                      >
                        {deletingId === meal.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} strokeWidth={1.5} />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(meal.id)}
                      className="p-1 text-textDim hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {deleteError && (
          <p className="text-xs font-sans text-danger px-5 py-2" role="alert">{deleteError}</p>
        )}
      </div>

      <div className="px-5 py-5">
        <div className="border border-border p-4">
          <p className="text-xs tracking-widest uppercase text-textDim font-sans mb-2">Tipp</p>
          <p className="text-sm font-sans text-textDim leading-relaxed">
            Fotografiere deine Mahlzeiten für eine vollständige Analyse. Der Coach
            berücksichtigt deine Ernährung automatisch bei der Trainingsplanung.
          </p>
        </div>
      </div>

    </div>
  );
}

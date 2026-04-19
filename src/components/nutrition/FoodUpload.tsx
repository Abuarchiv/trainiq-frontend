"use client";
import { useState, useRef } from "react";
import { Camera } from "lucide-react";

export function FoodUpload({
  onUpload,
  disabled,
}: {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Input sofort zurücksetzen damit dieselbe Datei erneut ausgewählt werden kann
    e.target.value = "";
    if (!file) {
      setError("Keine Datei ausgewählt.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch {
      setError("Upload fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        className={`w-full border border-dashed py-8 flex flex-col items-center gap-3 transition-colors disabled:opacity-50 ${
          error ? "border-danger" : "border-border hover:border-blue"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-blue tracking-widest uppercase">ANALYSIERE...</span>
          </div>
        ) : (
          <>
            <Camera size={28} strokeWidth={1.5} className="text-textDim" />
            <span className="text-xs tracking-widest uppercase text-textDim font-sans">Foto hinzufügen</span>
          </>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <div className="mt-3 border border-danger p-3 fade-up">
          <p className="text-xs font-sans text-danger uppercase tracking-widest text-center">{error}</p>
        </div>
      )}
    </div>
  );
}

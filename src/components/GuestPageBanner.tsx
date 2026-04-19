"use client";
import { useRouter } from "next/navigation";
import { Watch } from "lucide-react";

interface Props {
  title?: string;
  hint?: string;
}

export default function GuestPageBanner({
  title = "LOGIN ERFORDERLICH",
  hint = "Registriere dich kostenlos, verbinde deine Sportuhr und sieh hier deine echten Gesundheitsdaten.",
}: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-[60vh] items-center justify-center px-8 gap-6 text-center">
      <div className="border border-border p-5 flex flex-col items-center gap-4 w-full">
        <Watch size={32} strokeWidth={1} className="text-blue" />
        <div>
          <p className="font-pixel text-blue text-sm mb-2">{title}</p>
          <p className="text-xs font-sans text-textDim leading-relaxed">{hint}</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
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
    </div>
  );
}

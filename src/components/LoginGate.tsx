"use client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  message?: string;
}

export default function LoginGate({ onClose, message }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="w-full max-w-sm bg-bg border-t border-border p-6 fade-up">

        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-pixel text-blue" style={{ fontSize: 22 }}>ANMELDEN</p>
            <p className="text-xs font-sans text-textDim mt-1 tracking-wide leading-relaxed">
              {message ?? "Melde dich an um deine echten Daten zu sehen und den Coach zu nutzen."}
            </p>
          </div>
          <button onClick={onClose} className="text-textDim hover:text-textMain ml-4 mt-0.5">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/login")}
            className="w-full border border-blue text-blue text-xs tracking-widest uppercase font-sans py-3.5 hover:bg-blueDim transition-colors"
          >
            › Einloggen
          </button>
          <button
            onClick={() => router.push("/register")}
            className="w-full border border-border text-textDim text-xs tracking-widest uppercase font-sans py-3.5 hover:border-textDim transition-colors"
          >
            Konto erstellen
          </button>
        </div>

        <p className="text-xs font-sans text-textDim text-center mt-4">
          Vorschau läuft mit Demo-Daten
        </p>
      </div>
    </div>
  );
}

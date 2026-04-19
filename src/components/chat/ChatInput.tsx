"use client";
import { useRef } from "react";
import { Camera } from "lucide-react";

export function ChatInput({
  value,
  onChange,
  onSend,
  onImage,
  disabled,
  maxLength = 2000,
}: {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onImage?: (file: File) => void;
  disabled?: boolean;
  maxLength?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-sm bg-bg">
      <div className="flex gap-3 items-center px-4 py-3 border-t border-border">
        <div className="flex-1 flex items-center gap-2 border border-border px-3 py-2">
          <span className="text-blue font-mono text-sm">›</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Nachricht..."
            disabled={disabled}
            className="flex-1 bg-transparent text-sm font-sans text-textMain placeholder-textDim outline-none"
          />
          <span className="cursor-blink text-blue font-mono text-sm">_</span>
          {value.length > maxLength - 100 && (
            <span className="text-[10px] font-sans text-danger shrink-0">
              {maxLength - value.length}
            </span>
          )}
        </div>
        {onImage && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="border border-border p-2 hover:border-blue transition-colors"
            >
              <Camera size={18} strokeWidth={1.5} className="text-textDim" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  e.target.value = "";
                  await onImage(file);
                }
              }}
              className="hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}

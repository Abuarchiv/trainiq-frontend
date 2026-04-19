"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p
            className="font-pixel text-[#2563EB]"
            style={{ fontSize: 88, lineHeight: 1 }}
          >
            500
          </p>
          <p className="text-xs tracking-widest uppercase text-[#888888] mt-4 mb-6">
            Unerwarteter Fehler
          </p>
          <p className="text-sm text-[#888888] leading-relaxed mb-8">
            {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
          </p>
          <button
            onClick={reset}
            className="inline-block border border-[#2563EB] text-[#2563EB] text-xs tracking-widest uppercase px-8 py-3"
          >
            › Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}

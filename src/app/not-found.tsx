import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-pixel text-blue" style={{ fontSize: 88, lineHeight: 1 }}>404</p>
        <p className="text-xs tracking-widest uppercase text-textDim font-sans mt-4 mb-6">
          Seite nicht gefunden
        </p>
        <p className="text-sm font-sans text-textDim leading-relaxed mb-8">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/dashboard"
          className="inline-block border border-blue text-blue text-xs tracking-widest uppercase font-sans px-8 py-3 hover:bg-blueDim transition-colors"
        >
          › Zum Dashboard
        </Link>
      </div>
    </div>
  );
}

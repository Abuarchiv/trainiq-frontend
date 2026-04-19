export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="font-pixel text-blue text-3xl animate-pulse">TRAINIQ</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-blue animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-blue animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-blue animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

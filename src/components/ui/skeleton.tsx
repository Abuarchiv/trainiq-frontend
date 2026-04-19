// Einfaches Skeleton mit Pulse-Animation
// Nutze das Design System: border statt Schatten, bg-[#EBEBEB]
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#EBEBEB] ${className ?? ""}`}
    />
  )
}

// Spezifische Skeletons für wiederkehrende Muster
export function MetricSkeleton() {
  return (
    <div className="grid grid-cols-3 border-b border-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`px-4 py-4 ${i < 3 ? "border-r border-border" : ""}`}>
          <Skeleton className="h-3 w-12 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-8 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export function WorkoutRowSkeleton() {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" />
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <Skeleton className="h-7 w-10 mb-1" />
        <Skeleton className="h-3 w-6" />
      </div>
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 bg-[#EBEBEB] animate-pulse shrink-0 mt-0.5" />
      <div className="max-w-[80%] flex flex-col gap-1">
        <Skeleton className="h-16 w-48" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-2">
      <ChatMessageSkeleton />
      <div className="flex gap-3 items-start justify-end">
        <div className="max-w-[65%] flex flex-col gap-1 items-end">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <ChatMessageSkeleton />
      <div className="flex gap-3 items-start justify-end">
        <div className="max-w-[55%] flex flex-col gap-1 items-end">
          <Skeleton className="h-12 w-36" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <ChatMessageSkeleton />
    </div>
  )
}

export function TrainingDetailSkeleton() {
  return (
    <div className="px-5 pt-5 pb-4 border-b border-border">
      <Skeleton className="h-3 w-32 mb-4" />
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="w-7 h-7" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="text-right">
          <Skeleton className="h-9 w-14 mb-1" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-0 border border-border mb-5">
        <div className="p-3 border-r border-border">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}

export function TrainingStatsSkeleton() {
  return (
    <div className="px-5 py-5 border-t border-border mt-2">
      <Skeleton className="h-3 w-36 mb-5" />
      <div className="grid grid-cols-3 border border-border mb-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`p-3 ${i < 2 ? "border-r border-border" : ""}`}>
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-7 w-10 mb-1" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3 w-28 mb-3" />
      <div className="flex gap-2 items-end h-16">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-full" />
        ))}
      </div>
    </div>
  )
}

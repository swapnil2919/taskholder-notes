export function TaskSkeleton() {
  return (
    <div className="rounded-xl border border-white/8 p-5" style={{ background: '#12121e' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 shimmer rounded w-3/4" />
        <div className="flex gap-1 shrink-0">
          <div className="w-7 h-7 shimmer rounded-lg" />
          <div className="w-7 h-7 shimmer rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="h-5 shimmer rounded-full w-16" />
        <div className="h-5 shimmer rounded-full w-14" />
        <div className="h-4 shimmer rounded w-20 ml-auto" />
      </div>
    </div>
  )
}

export function NoteSkeleton() {
  return (
    <div className="rounded-xl border border-white/8 p-5" style={{ background: '#12121e' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 shimmer rounded w-2/3" />
        <div className="flex gap-1 shrink-0">
          <div className="w-7 h-7 shimmer rounded-lg" />
          <div className="w-7 h-7 shimmer rounded-lg" />
          <div className="w-7 h-7 shimmer rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <div className="h-5 shimmer rounded-full w-20" />
        <div className="h-4 shimmer rounded w-16 ml-auto" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-xl border border-white/8 p-5" style={{ background: '#12121e' }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shimmer rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-8 shimmer rounded w-14" />
          <div className="h-4 shimmer rounded w-24" />
        </div>
      </div>
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2 h-2 shimmer rounded-full shrink-0" />
        <div className="h-4 shimmer rounded w-40" />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="h-5 shimmer rounded-full w-16" />
        <div className="h-5 shimmer rounded-full w-12" />
      </div>
    </div>
  )
}

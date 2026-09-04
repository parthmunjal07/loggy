// app/dashboard/loading.tsx
// Skeletal loader matching the exact shape of DashboardPage:
// Header -> Quick stats row -> 2-column challenge card grid with heatmap preview.

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-48 bg-zinc-800 rounded-md mb-2" />
          <div className="h-4 w-64 bg-zinc-900 rounded" />
        </div>
        <div className="h-9 w-36 bg-zinc-800 rounded-lg" />
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-zinc-800" />
              <div className="h-3 w-20 bg-zinc-800 rounded" />
            </div>
            <div className="h-7 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Challenge Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((card) => (
          <div
            key={card}
            className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between min-h-[220px]"
          >
            <div>
              {/* Card top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1.5 flex-1">
                  <div className="h-5 w-40 bg-zinc-800 rounded" />
                  <div className="h-3.5 w-24 bg-zinc-900 rounded" />
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-zinc-800 bg-zinc-900/60 shrink-0" />
              </div>

              {/* Badges row */}
              <div className="flex gap-2 mb-4">
                <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                <div className="h-5 w-20 bg-zinc-900 rounded-full" />
              </div>
            </div>

            {/* Mini heatmap preview */}
            <div className="pt-3 border-t border-zinc-900">
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 20 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-3 rounded-[3px] bg-zinc-800/70"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// app/challenges/[id]/loading.tsx
// Skeletal loader matching ChallengeDetailClient layout:
// Back navigation -> Header & actions -> 4 Stat cards -> View tabs -> Full Heatmap card.

export default function ChallengeDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 bg-zinc-900 rounded mb-6" />

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-56 bg-zinc-800 rounded-md" />
          <div className="h-6 w-20 bg-zinc-800 rounded-full" />
        </div>
        <div className="h-9 w-40 bg-zinc-800 rounded-lg" />
      </div>
      <div className="h-4 w-44 bg-zinc-900 rounded mb-8" />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40"
          >
            <div className="h-3 w-16 bg-zinc-800 rounded mb-2" />
            <div className="h-7 w-20 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex gap-2 p-1 bg-zinc-900/80 border border-zinc-800 rounded-lg">
          <div className="h-7 w-28 bg-zinc-800 rounded-md" />
          <div className="h-7 w-24 bg-zinc-900 rounded-md" />
        </div>
        <div className="h-4 w-32 bg-zinc-900 rounded" />
      </div>

      {/* Heatmap Card */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="space-y-3">
          {/* Heatmap grid columns skeleton */}
          <div className="h-4 w-full bg-zinc-900/50 rounded mb-4" />
          <div className="grid grid-cols-12 sm:grid-cols-15 gap-2">
            {Array.from({ length: 75 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-[4px] bg-zinc-800/60"
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end items-center gap-2 mt-6 pt-4 border-t border-zinc-900">
          <div className="h-3 w-8 bg-zinc-900 rounded" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-[3px] bg-zinc-800" />
            ))}
          </div>
          <div className="h-3 w-8 bg-zinc-900 rounded" />
        </div>
      </div>
    </div>
  );
}

// app/leaderboard/loading.tsx
// Skeletal loader matching LeaderboardClient:
// Header & week range -> Top-3 podium cards -> Ranked table rows skeleton.

export default function LeaderboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-56 bg-zinc-800 rounded-md" />
          <div className="h-5 w-16 bg-zinc-800 rounded-full" />
        </div>
        <div className="h-4 w-72 bg-zinc-900 rounded" />
      </div>

      {/* User Rank Card skeleton */}
      <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-zinc-800 rounded" />
            <div className="h-3 w-40 bg-zinc-900 rounded" />
          </div>
        </div>
        <div className="h-7 w-20 bg-zinc-800 rounded" />
      </div>

      {/* Top-3 Podium Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 items-end">
        {[2, 1, 3].map((pos) => (
          <div
            key={pos}
            className={`p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col items-center text-center ${
              pos === 1 ? "sm:order-2 sm:pb-6" : pos === 2 ? "sm:order-1" : "sm:order-3"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 mb-3" />
            <div className="h-4 w-24 bg-zinc-800 rounded mb-1.5" />
            <div className="h-3 w-16 bg-zinc-900 rounded mb-3" />
            <div className="h-6 w-20 bg-zinc-800/90 rounded-full" />
          </div>
        ))}
      </div>

      {/* Ranked Table Skeleton */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-4 w-24 bg-zinc-900 rounded" />
        </div>
        <div className="divide-y divide-zinc-800/60">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-5 w-6 bg-zinc-800/60 rounded" />
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                <div className="h-4 w-32 bg-zinc-800 rounded" />
              </div>
              <div className="h-5 w-20 bg-zinc-800/80 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

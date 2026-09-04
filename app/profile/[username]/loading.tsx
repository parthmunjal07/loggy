// app/profile/[username]/loading.tsx
// Skeletal loader matching PublicProfileClient:
// Profile identity card -> Active challenges cards -> Journal feed timeline skeleton.

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full animate-pulse">
      {/* Profile Card Skeleton */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-36 bg-zinc-800 rounded-md" />
              <div className="h-4 w-24 bg-zinc-900 rounded" />
            </div>
          </div>
          {/* Quick stats pills */}
          <div className="flex gap-4 sm:gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-800/80">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-14 bg-zinc-900 rounded" />
                <div className="h-6 w-12 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges Section Skeleton */}
      <div className="mb-8">
        <div className="h-5 w-36 bg-zinc-800 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 min-h-[160px] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-32 bg-zinc-800 rounded" />
                <div className="h-3 w-20 bg-zinc-900 rounded" />
              </div>
              <div className="h-6 w-full bg-zinc-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Journal Feed Timeline Skeleton */}
      <div>
        <div className="h-5 w-40 bg-zinc-800 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/20 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-zinc-800 rounded" />
                <div className="h-4 w-16 bg-zinc-900 rounded" />
              </div>
              <div className="h-3.5 w-3/4 bg-zinc-900 rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-4 w-14 bg-zinc-800/60 rounded-full" />
                <div className="h-4 w-16 bg-zinc-800/40 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

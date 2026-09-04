// app/challenges/[id]/day/[logId]/loading.tsx
// Skeletal loader matching DayPageClient:
// Header & day meta -> Notes card -> 3-column Kanban board skeleton.

export default function DayLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-32 bg-zinc-900 rounded mb-6" />

      {/* Day header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-32 bg-zinc-800 rounded-md" />
            <div className="h-6 w-20 bg-zinc-800 rounded-full" />
          </div>
          <div className="h-4 w-48 bg-zinc-900 rounded" />
        </div>
        <div className="h-8 w-28 bg-zinc-800/80 rounded-lg" />
      </div>

      {/* Notes card skeleton */}
      <div className="p-4 rounded-xl border border-zinc-800/70 bg-zinc-900/30 mb-8">
        <div className="h-4 w-24 bg-zinc-800 rounded mb-2" />
        <div className="h-14 w-full bg-zinc-900/50 rounded-lg" />
      </div>

      {/* 3-Column Kanban Board Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {[
          { title: "To Do", count: 2 },
          { title: "In Progress", count: 1 },
          { title: "Done", count: 2 },
        ].map((col, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4 min-h-[420px]"
          >
            {/* Column header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-zinc-800 rounded" />
                <div className="h-5 w-5 bg-zinc-800 rounded-full" />
              </div>
              <div className="h-6 w-6 bg-zinc-800/60 rounded" />
            </div>

            {/* Task card skeletons */}
            <div className="space-y-2.5 flex-1">
              {Array.from({ length: col.count }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="p-3.5 rounded-lg border border-zinc-800/90 bg-zinc-900/60 space-y-2"
                >
                  <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-4 w-12 bg-zinc-800/60 rounded-full" />
                    <div className="h-4 w-16 bg-zinc-800/40 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add task button skeleton */}
            <div className="h-8 w-full bg-zinc-900/60 border border-zinc-800/60 rounded-lg mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

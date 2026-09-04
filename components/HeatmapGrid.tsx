"use client";
// components/HeatmapGrid.tsx
// Full-width heatmap grid for a challenge — matches GitHub contributions style.
// Cells are grouped into columns of 7 (days of week) and rendered week-by-week.
// Color intensity is continuous (pctToHeat), not binary.

import { HeatmapCell, pctToHeat } from "./HeatmapCell";
import type { HeatmapCellProps } from "./HeatmapCell";

export type HeatmapLog = {
  id: string;
  dayNumber: number;
  date: string;
  completionPct: number;
};

type HeatmapGridProps = {
  logs: HeatmapLog[];
  todayLogId?: string;
  onDayClick?: (logId: string) => void;
  compact?: boolean; // compact=true → smaller cells for dashboard card preview
};

/** Split logs into columns of 7 (left-pad the first column if needed) */
function buildWeekColumns(logs: HeatmapLog[]): (HeatmapLog | null)[][] {
  if (logs.length === 0) return [];
  // Which day-of-week does day 1 fall on? (0=Sun…6=Sat)
  const firstDate = new Date(logs[0].date);
  const startDOW = firstDate.getUTCDay();

  const paddedLogs: (HeatmapLog | null)[] = [
    ...Array(startDOW).fill(null),
    ...logs,
  ];

  const weeks: (HeatmapLog | null)[][] = [];
  for (let i = 0; i < paddedLogs.length; i += 7) {
    weeks.push(paddedLogs.slice(i, i + 7));
  }
  return weeks;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function HeatmapGrid({
  logs,
  todayLogId,
  onDayClick,
  compact = false,
}: HeatmapGridProps) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const weeks = buildWeekColumns(logs);

  const gap = compact ? "gap-1" : "gap-1.5";

  return (
    <div
      role="grid"
      aria-label="Activity heatmap"
      className="w-full overflow-x-auto pb-1"
    >
      <div className={`w-full flex ${gap} justify-between items-start`}>
        {/* Day-of-week labels (only shown in full view) */}
        {!compact && (
          <div className={`flex flex-col ${gap} mr-1 mt-5 shrink-0`}>
            {DAY_LABELS.map((d, i) => (
              <span
                key={i}
                className="w-3 h-3.5 flex items-center justify-center text-[9px] font-mono text-[var(--text-muted)] select-none"
              >
                {i % 2 === 1 ? d : ""}
              </span>
            ))}
          </div>
        )}

        {/* Week columns — stretch evenly to fill 100% of container width */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className={`flex flex-col ${gap} flex-1 min-w-[12px] max-w-[28px]`}
          >
            {/* Month label on first day of month or first week */}
            {!compact && (
              <span className="h-4 text-[9px] font-mono text-[var(--text-muted)] select-none block truncate">
                {week[0] && new Date(week[0].date).getUTCDate() <= 7
                  ? new Date(week[0].date).toLocaleDateString("en-US", {
                      month: "short",
                    })
                  : ""}
              </span>
            )}

            {/* Cells — scale aspect-square with column width */}
            {week.map((log, di) => {
              if (!log) {
                return (
                  <div
                    key={`pad-${di}`}
                    className="w-full aspect-square rounded-sm"
                    style={{ background: "transparent" }}
                  />
                );
              }

              const cellDate = new Date(log.date);
              cellDate.setUTCHours(0, 0, 0, 0);
              const isToday = cellDate.getTime() === today.getTime();
              const isFuture = cellDate.getTime() > today.getTime();

              return (
                <HeatmapCell
                  key={log.id}
                  logId={log.id}
                  dayNumber={log.dayNumber}
                  date={log.date}
                  completionPct={log.completionPct}
                  isToday={isToday}
                  isFuture={isFuture}
                  className="w-full aspect-square"
                  onClick={
                    isToday && onDayClick
                      ? () => onDayClick(log.id)
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compact legend strip ─────────────────────────────────────────────────────

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono text-[var(--text-muted)]">Less</span>
      {([0, 1, 2, 3, 4, 5] as const).map((h) => (
        <div
          key={h}
          data-heat={h}
          className="w-2.5 h-2.5 rounded-sm"
        />
      ))}
      <span className="text-[10px] font-mono text-[var(--text-muted)]">More</span>
    </div>
  );
}

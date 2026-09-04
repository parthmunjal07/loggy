"use client";
// components/HeatmapCell.tsx
// A single heatmap cell. Intensity is derived from completionPct (0–100).
// Only "today" cells are interactive; past cells are read-only tooltips.

import { motion, useReducedMotion } from "motion/react";

export type HeatmapCellProps = {
  logId: string;
  dayNumber: number;
  date: string;          // ISO string
  completionPct: number; // 0–100
  isToday: boolean;
  isFuture: boolean;
  onClick?: () => void;
  className?: string;
};

/** Maps 0-100 completionPct → heat level 0-5 */
export function pctToHeat(pct: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (pct === 0)   return 0;
  if (pct <= 25)   return 1;
  if (pct <= 50)   return 2;
  if (pct <= 75)   return 3;
  if (pct < 100)   return 4;
  return 5;
}

export function HeatmapCell({
  dayNumber,
  date,
  completionPct,
  isToday,
  isFuture,
  onClick,
  className,
}: HeatmapCellProps) {
  const shouldReduceMotion = useReducedMotion();
  const heat = pctToHeat(completionPct);
  const label = `Day ${dayNumber}: ${completionPct.toFixed(0)}% complete`;
  const d = new Date(date);
  const monthDay = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const isClickable = isToday && !!onClick;
  const sizeClass = className || "w-3.5 h-3.5";

  return (
    <motion.button
      type="button"
      role="gridcell"
      tabIndex={isClickable ? 0 : -1}
      aria-label={label}
      title={`${monthDay} · Day ${dayNumber} · ${completionPct.toFixed(0)}%`}
      data-heat={heat}
      disabled={!isClickable}
      onClick={isClickable ? onClick : undefined}
      whileHover={
        isClickable && !shouldReduceMotion
          ? { scale: 1.25 }
          : !shouldReduceMotion
          ? { scale: 1.08 }
          : undefined
      }
      whileTap={isClickable && !shouldReduceMotion ? { scale: 0.95 } : undefined}
      transition={{ duration: shouldReduceMotion ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={[
        sizeClass,
        "rounded-sm transition-[box-shadow] duration-200",
        "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)]",
        isToday
          ? "ring-1 ring-offset-1 ring-offset-[var(--surface-0)] ring-[var(--accent)] cursor-pointer"
          : isFuture
          ? "opacity-30 cursor-default"
          : "cursor-default",
      ].join(" ")}
      style={{
        // shadow for today's cell to make it pop
        boxShadow:
          isToday && completionPct > 0
            ? `0 0 6px 1px var(--accent-glow)`
            : undefined,
      }}
    />
  );
}

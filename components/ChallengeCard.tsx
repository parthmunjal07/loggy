"use client";
// components/ChallengeCard.tsx
// Dashboard card — compact heatmap preview + streak + progress ring.

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { HeatmapGrid } from "./HeatmapGrid";
import { StreakBadge } from "./StreakBadge";
import type { HeatmapLog } from "./HeatmapGrid";

type ChallengeCardProps = {
  id: string;
  title: string;
  totalDays: number;
  daysElapsed: number;
  daysWithProgress: number;
  currentStreak: number;
  status: string;
  logs: HeatmapLog[];
  index: number; // for stagger animation
};

function ProgressRing({
  pct,
  size = 36,
  shouldReduceMotion = false,
}: {
  pct: number;
  size?: number;
  shouldReduceMotion?: boolean;
}) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="rotate-[-90deg]"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface-3)"
        strokeWidth={3}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: shouldReduceMotion ? offset : circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{
          duration: shouldReduceMotion ? 0 : 1.2,
          ease: [0.16, 1, 0.3, 1],
          delay: shouldReduceMotion ? 0 : 0.2,
        }}
      />
    </svg>
  );
}

export function ChallengeCard({
  id,
  title,
  totalDays,
  daysElapsed,
  daysWithProgress,
  currentStreak,
  status,
  logs,
  index,
}: ChallengeCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const progressPct =
    daysElapsed > 0 ? Math.round((daysWithProgress / daysElapsed) * 100) : 0;
  const elapsedPct = Math.round((daysElapsed / totalDays) * 100);

  const isCompleted = status === "COMPLETED";

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card group relative overflow-hidden focus-within:ring-1 focus-within:ring-[var(--accent)]"
      style={{ padding: "20px" }}
    >
      {/* Subtle accent top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent-dim), transparent)",
          opacity: isCompleted ? 1 : 0.4,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted && (
              <CheckCircle
                size={14}
                weight="fill"
                style={{ color: "var(--accent)", flexShrink: 0 }}
              />
            )}
            <h2
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
          </div>
          <p
            className="text-xs font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            Day {Math.min(daysElapsed, totalDays)} of {totalDays}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <StreakBadge streak={currentStreak} size="sm" />
          <div className="relative flex items-center justify-center">
            <ProgressRing pct={elapsedPct} />
            <span
              className="absolute text-[9px] font-mono font-bold"
              style={{ color: "var(--text-secondary)" }}
            >
              {elapsedPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Compact heatmap preview — starts from Day 1 */}
      <div className="mb-4 overflow-x-auto pb-1">
        <HeatmapGrid logs={logs} compact />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {daysWithProgress}/{daysElapsed} days active
          {progressPct > 0 && ` · ${progressPct}% completion rate`}
        </span>

        <Link
          href={`/challenges/${id}`}
          className="flex items-center gap-1 text-[11px] font-medium transition-colors duration-150"
          style={{ color: "var(--text-muted)" }}
          aria-label={`View ${title}`}
        >
          <span
            className="group-hover:text-[var(--accent)] transition-colors duration-150"
            style={{ color: "inherit" }}
          >
            View
          </span>
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform duration-150"
            style={{ color: "var(--text-muted)" }}
          />
        </Link>
      </div>
    </motion.article>
  );
}

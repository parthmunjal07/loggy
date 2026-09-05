"use client";
// app/challenges/[id]/ChallengeDetailClient.tsx
// Client wrapper: handles "click today → open Kanban panel" interaction.
// Phase 5: Embeds the full Kanban board with live optimistic heatmap cell updates.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  X,
  CalendarBlank,
  ArrowSquareOut,
  SquaresFour,
  Table,
} from "@phosphor-icons/react";
import { HeatmapGrid, HeatmapLegend } from "@/components/HeatmapGrid";
import { StreakBadge } from "@/components/StreakBadge";
import { KanbanBoard, type KanbanTask } from "@/components/KanbanBoard";
import { ChallengeSheetView, type SheetLog } from "@/components/ChallengeSheetView";
import type { HeatmapLog } from "@/components/HeatmapGrid";

type Log = HeatmapLog & {
  tasksTotal: number;
  tasksDone: number;
  note: string | null;
  completedTags?: { id: string; name: string }[];
};

type Props = {
  challengeId: string;
  title: string;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  logs: Log[];
};

export function ChallengeDetailClient({
  challengeId,
  title,
  totalDays,
  currentStreak,
  longestStreak,
  logs: initialLogs,
}: Props) {
  const [activeView, setActiveView] = useState<"heatmap" | "sheet">("heatmap");
  const [logsState, setLogsState] = useState<Log[]>(initialLogs);
  const [activePanelLogId, setActivePanelLogId] = useState<string | null>(null);
  const [panelTasks, setPanelTasks] = useState<KanbanTask[] | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const reduce = useReducedMotion();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todayLog = logsState.find((l) => {
    const d = new Date(l.date);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const activeLog = activePanelLogId
    ? logsState.find((l) => l.id === activePanelLogId)
    : null;

  const isLocked = activeLog
    ? (() => {
        const d = new Date(activeLog.date);
        d.setUTCHours(0, 0, 0, 0);
        return d < today;
      })()
    : false;

  const daysElapsed = logsState.filter((l) => {
    const d = new Date(l.date);
    d.setUTCHours(0, 0, 0, 0);
    return d <= today;
  }).length;

  const daysWithProgress = logsState.filter((l) => l.completionPct > 0).length;
  const overallPct =
    daysElapsed > 0
      ? Math.round((daysWithProgress / daysElapsed) * 100)
      : 0;

  // Load tasks when a log is selected
  useEffect(() => {
    if (!activePanelLogId) {
      setPanelTasks(null);
      return;
    }

    let isMounted = true;
    setIsLoadingTasks(true);

    fetch(`/api/logs/${activePanelLogId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.log?.tasks) {
          setPanelTasks(data.log.tasks);
        } else {
          setPanelTasks([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch day tasks:", err);
        if (isMounted) setPanelTasks([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTasks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePanelLogId]);

  // Handle optimistic task / log updates from the Kanban board
  const handleLogUpdated = useCallback(
    ({
      logId,
      tasksTotal,
      tasksDone,
      completionPct,
    }: {
      logId: string;
      tasksTotal: number;
      tasksDone: number;
      completionPct: number;
    }) => {
      setLogsState((prev) =>
        prev.map((l) =>
          l.id === logId
            ? { ...l, tasksTotal, tasksDone, completionPct }
            : l
        )
      );
    },
    []
  );

  const handleNoteUpdated = useCallback(
    (logId: string, newNote: string | null) => {
      setLogsState((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, note: newNote } : l))
      );
    },
    []
  );

  return (
    <div className="min-h-dvh" style={{ background: "var(--surface-0)" }}>
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p
              className="text-xs font-mono mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Challenge
            </p>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h1>
          </div>
          <StreakBadge streak={currentStreak} size="lg" />
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-8 rounded-xl overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          {[
            { label: "Total days", value: totalDays },
            { label: "Days elapsed", value: daysElapsed },
            { label: "Days active", value: daysWithProgress },
            { label: "Best streak", value: `${longestStreak}d` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1 px-5 py-4"
              style={{ background: "var(--surface-1)" }}
            >
              <span
                className="text-[11px] font-mono uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </span>
              <span
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* View mode switcher */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div
            className="flex items-center p-1 rounded-xl border text-xs font-mono"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView("heatmap")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeView === "heatmap"
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <SquaresFour size={14} />
              <span>Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("sheet")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeView === "sheet"
                  ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Table size={14} />
              <span>Sheet View</span>
            </button>
          </div>

          <p
            className="text-xs font-mono hidden sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            {activeView === "heatmap"
              ? `${overallPct}% completed across ${daysElapsed} days`
              : `${logsState.length} total days in challenge`}
          </p>
        </div>

        {/* View Contents */}
        {activeView === "heatmap" ? (
          <>
            {/* Heatmap section */}
            <section className="card p-5 mb-6" aria-labelledby="heatmap-heading">
              <div className="flex items-center justify-between mb-5">
                <h2
                  id="heatmap-heading"
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Activity
                </h2>
                <HeatmapLegend />
              </div>

              <HeatmapGrid
                logs={logsState}
                todayLogId={todayLog?.id}
                onDayClick={(logId) => setActivePanelLogId(logId)}
              />

              {todayLog && (
                <p
                  className="mt-4 text-[11px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  Click today to open your Kanban board.
                </p>
              )}
            </section>

            {/* Completion rate note */}
            <p
              className="text-xs font-mono mb-8"
              style={{ color: "var(--text-muted)" }}
            >
              Overall completion rate: {overallPct}% across {daysElapsed} elapsed
              days.
            </p>
          </>
        ) : (
          <div className="mb-8">
            <ChallengeSheetView
              challengeId={challengeId}
              logs={logsState as SheetLog[]}
              onNoteUpdated={handleNoteUpdated}
            />
          </div>
        )}
      </div>

      {/* Day panel — slides up when a day is selected */}
      <AnimatePresence>
        {activeLog && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => setActivePanelLogId(null)}
            />

            {/* Panel */}
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label={`Day ${activeLog.dayNumber} detail`}
              initial={reduce ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderBottom: "none",
                maxHeight: "88dvh",
                overflowY: "auto",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: "var(--surface-3)" }}
                />
              </div>

              <div className="max-w-5xl mx-auto px-5 pb-8">
                {/* Panel header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarBlank
                        size={14}
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color: "var(--accent)" }}
                      >
                        Day {activeLog.dayNumber}
                      </span>
                    </div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {new Date(activeLog.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/challenges/${challengeId}/day/${activeLog.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                      style={{
                        background: "var(--surface-2)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <span>Full page</span>
                      <ArrowSquareOut size={13} />
                    </Link>
                    <button
                      id="close-day-panel-btn"
                      onClick={() => setActivePanelLogId(null)}
                      className="p-1.5 rounded-lg transition-colors duration-150 hover:bg-[var(--surface-2)]"
                      aria-label="Close day panel"
                    >
                      <X size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="flex-1 rounded-lg px-4 py-3"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <p
                      className="text-[10px] font-mono uppercase tracking-wide mb-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Completion
                    </p>
                    <p
                      className="text-xl font-bold font-mono tabular-nums"
                      style={{ color: "var(--accent)" }}
                    >
                      {activeLog.completionPct.toFixed(0)}%
                    </p>
                  </div>
                  <div
                    className="flex-1 rounded-lg px-4 py-3"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <p
                      className="text-[10px] font-mono uppercase tracking-wide mb-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Tasks
                    </p>
                    <p
                      className="text-xl font-bold font-mono tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {activeLog.tasksDone}
                      <span
                        className="text-sm font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        /{activeLog.tasksTotal}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Live Kanban Board */}
                {isLoadingTasks ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="rounded-xl border p-4 h-48 animate-pulse"
                        style={{
                          background: "var(--surface-2)",
                          borderColor: "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <KanbanBoard
                    logId={activeLog.id}
                    challengeId={challengeId}
                    dayNumber={activeLog.dayNumber}
                    date={activeLog.date}
                    initialTasks={panelTasks || []}
                    isLocked={isLocked}
                    onLogUpdated={handleLogUpdated}
                  />
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

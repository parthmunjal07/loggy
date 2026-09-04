"use client";
// app/challenges/[id]/day/[logId]/DayPageClient.tsx
// Phase 5: Dedicated Day View with Kanban Board, progress indicator, and note editor.

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  NotePencil,
  Check,
} from "@phosphor-icons/react";
import { KanbanBoard, type KanbanTask } from "@/components/KanbanBoard";

type Props = {
  challengeId: string;
  challengeTitle: string;
  logId: string;
  dayNumber: number;
  date: string;
  isLocked: boolean;
  initialCompletionPct: number;
  initialTasksTotal: number;
  initialTasksDone: number;
  initialNote: string | null;
  tasks: KanbanTask[];
  prevLogId?: string | null;
  prevDayNumber?: number | null;
  nextLogId?: string | null;
  nextDayNumber?: number | null;
};

export function DayPageClient({
  challengeId,
  challengeTitle,
  logId,
  dayNumber,
  date,
  isLocked,
  initialCompletionPct,
  initialTasksTotal,
  initialTasksDone,
  initialNote,
  tasks,
  prevLogId,
  prevDayNumber,
  nextLogId,
  nextDayNumber,
}: Props) {
  const [stats, setStats] = useState({
    completionPct: initialCompletionPct,
    tasksTotal: initialTasksTotal,
    tasksDone: initialTasksDone,
  });

  // Note autosave state
  const [note, setNote] = useState(initialNote || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const noteDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setNote(nextVal);
    setSaveStatus("saving");

    if (noteDebounceTimer.current) {
      clearTimeout(noteDebounceTimer.current);
    }

    noteDebounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/logs/${logId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: nextVal.trim() ? nextVal : null }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
        } else {
          setSaveStatus("idle");
        }
      } catch {
        setSaveStatus("idle");
      }
    }, 750);
  };

  const handleLogUpdated = useCallback(
    (newStats: { tasksTotal: number; tasksDone: number; completionPct: number }) => {
      setStats({
        tasksTotal: newStats.tasksTotal,
        tasksDone: newStats.tasksDone,
        completionPct: newStats.completionPct,
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      if (noteDebounceTimer.current) {
        clearTimeout(noteDebounceTimer.current);
      }
    };
  }, []);

  return (
    <main
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--surface-0)" }}
    >
      <div className="max-w-6xl w-full mx-auto px-5 py-8 flex-1 flex flex-col">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href={`/challenges/${challengeId}`}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to {challengeTitle}</span>
          </Link>

          {/* Prev / Next Day navigation */}
          <div className="flex items-center gap-2">
            {prevLogId && prevDayNumber ? (
              <Link
                href={`/challenges/${challengeId}/day/${prevLogId}`}
                className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-md border text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                style={{
                  background: "var(--surface-1)",
                  borderColor: "var(--border)",
                }}
              >
                <CaretLeft size={12} />
                <span>Day {prevDayNumber}</span>
              </Link>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 text-zinc-600 cursor-not-allowed">
                Start
              </span>
            )}

            <span className="text-xs font-mono text-zinc-500">/</span>

            {nextLogId && nextDayNumber ? (
              <Link
                href={`/challenges/${challengeId}/day/${nextLogId}`}
                className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-md border text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                style={{
                  background: "var(--surface-1)",
                  borderColor: "var(--border)",
                }}
              >
                <span>Day {nextDayNumber}</span>
                <CaretRight size={12} />
              </Link>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 text-zinc-600 cursor-not-allowed">
                End
              </span>
            )}
          </div>
        </div>

        {/* Day Header Card */}
        <div
          className="rounded-xl border p-5 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <CalendarBlank size={14} style={{ color: "var(--accent)" }} />
              <span
                className="text-xs font-mono font-medium"
                style={{ color: "var(--accent)" }}
              >
                Day {dayNumber}
              </span>
              <span className="text-xs text-zinc-600">•</span>
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {formattedDate}
              </span>
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Day {dayNumber} Execution
            </h1>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4">
            <div
              className="px-4 py-2.5 rounded-lg border flex flex-col"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Tasks Done
              </span>
              <span className="text-lg font-bold font-mono text-zinc-100">
                {stats.tasksDone}
                <span className="text-xs font-normal text-zinc-500">
                  /{stats.tasksTotal}
                </span>
              </span>
            </div>

            <div
              className="px-4 py-2.5 rounded-lg border flex flex-col min-w-[100px]"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Completion
              </span>
              <span
                className="text-lg font-bold font-mono"
                style={{ color: "var(--accent)" }}
              >
                {stats.completionPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Journal Section */}
        <div
          className="rounded-xl border p-4 mb-6 transition-colors"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <NotePencil size={14} style={{ color: "var(--accent)" }} />
              <span>Day Notes & Reflections</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                  <Check size={11} /> Saved
                </span>
              )}
            </div>
          </div>
          <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder={
              isLocked
                ? "No note was recorded for this day."
                : "Add notes, blockers, or thoughts for today. Autosaves as you type."
            }
            disabled={isLocked}
            rows={2}
            className="w-full text-xs font-mono rounded-lg p-3 outline-none resize-y transition-colors leading-relaxed disabled:opacity-75 disabled:cursor-not-allowed"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* The Kanban Board */}
        <div className="flex-1 flex flex-col">
          <KanbanBoard
            logId={logId}
            challengeId={challengeId}
            dayNumber={dayNumber}
            date={date}
            initialTasks={tasks}
            isLocked={isLocked}
            onLogUpdated={handleLogUpdated}
          />
        </div>
      </div>
    </main>
  );
}

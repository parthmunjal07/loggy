"use client";

// app/challenges/new/page.tsx
// Unified creation page allowing users to launch either a fixed-duration challenge
// or an ongoing open-ended daily log with zero end date.

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Calendar,
  Sparkle,
  ArrowLeft,
  Lightning,
  Flag,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { AppNav } from "@/components/AppNav";

const STRUCTURED_PRESETS = [
  "100 Days of Code",
  "Winter Arc",
  "30 Days of Fitness",
  "75 Hard",
];

const OPEN_PRESETS = [
  "Daily Log",
  "Work Notes",
  "Habit Engine",
  "Engineering Journal",
];

const PRESET_DURATIONS = [
  { label: "30 Days", value: 30 },
  { label: "75 Days", value: 75 },
  { label: "100 Days", value: 100 },
  { label: "365 Days", value: 365 },
];

function NewChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "open" ? "open" : "structured";

  const [mode, setMode] = useState<"structured" | "open">(initialMode);
  const todayIso = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState(initialMode === "open" ? "Daily Log" : "");
  const [totalDays, setTotalDays] = useState<number>(100);
  const [startDate, setStartDate] = useState(todayIso);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleModeChange = (nextMode: "structured" | "open") => {
    setMode(nextMode);
    setErrorMessage(null);
    if (nextMode === "open" && !title.trim()) {
      setTitle("Daily Log");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    if (mode === "structured" && (totalDays < 1 || totalDays > 366)) {
      setErrorMessage("Total days must be between 1 and 366.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: { title: string; startDate: string; totalDays?: number } = {
      title: title.trim(),
      startDate,
    };

    if (mode === "structured") {
      payload.totalDays = Number(totalDays);
    }

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create challenge");
      }

      if (mode === "open") {
        router.push(`/challenges/${data.challenge.id}?today=true`);
      } else {
        router.push(`/challenges/${data.challenge.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="card rounded-2xl p-6 sm:p-8 border shadow-xl flex flex-col gap-6"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          {mode === "open" ? (
            <Sparkle size={18} style={{ color: "var(--accent)" }} />
          ) : (
            <Target size={18} style={{ color: "var(--accent)" }} />
          )}
          <span
            className="text-xs font-mono font-medium uppercase tracking-wider"
            style={{ color: "var(--accent)" }}
          >
            {mode === "open" ? "Continuous Log" : "New Commitment"}
          </span>
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {mode === "open" ? "Start an Ongoing Log" : "Launch a Challenge"}
        </h1>
        <p
          className="text-xs font-mono mt-1 leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {mode === "open"
            ? "Track daily productivity continuously without a numbered end date."
            : "Define your goal, choose your daily execution window, and begin tracking your streak."}
        </p>
      </div>

      {/* Mode Switcher */}
      <div
        className="p-1 rounded-xl border flex items-center gap-1 text-xs font-mono"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => handleModeChange("structured")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all cursor-pointer ${
            mode === "structured"
              ? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs font-semibold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Flag size={14} />
          <span>Fixed Challenge</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("open")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all cursor-pointer ${
            mode === "open"
              ? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-xs font-semibold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Sparkle size={14} />
          <span>Open-Ended Log</span>
        </button>
      </div>

      {/* Error Notification */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg p-3 text-xs font-mono bg-red-950/70 border border-red-800/80 text-red-200 flex flex-col gap-1"
          >
            <span>{errorMessage}</span>
            {errorMessage.includes("already have an ongoing log") && (
              <Link
                href="/dashboard"
                className="underline hover:text-white font-semibold mt-1"
              >
                Go to Dashboard to access your ongoing log &rarr;
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="challenge-title"
            className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-medium"
          >
            {mode === "open" ? "Log Title" : "Challenge Title"}
          </label>
          <input
            id="challenge-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "open" ? "e.g. Daily Log or Work Notes" : "e.g. 100 Days of Code"}
            required
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />

          {/* Preset Suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(mode === "open" ? OPEN_PRESETS : STRUCTURED_PRESETS).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTitle(preset)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-colors ${
                  title === preset
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-3)]"
                    : "border-[var(--border)] text-zinc-400 hover:text-zinc-200 bg-[var(--surface-2)]"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Configuration */}
        {mode === "structured" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="total-days"
                className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-medium"
              >
                Duration (Days)
              </label>
              <span className="text-xs font-mono text-zinc-500">
                1 to 366 days
              </span>
            </div>

            <input
              id="total-days"
              type="number"
              min={1}
              max={366}
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors font-mono tabular-nums"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />

            {/* Preset Duration Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-1">
              {PRESET_DURATIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTotalDays(value)}
                  className={`py-2 text-xs font-mono rounded-lg border transition-colors ${
                    totalDays === value
                      ? "border-[var(--accent)] text-white bg-[var(--surface-3)] font-semibold"
                      : "border-[var(--border)] text-zinc-400 hover:text-zinc-200 bg-[var(--surface-2)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <ArrowsClockwise
              size={18}
              className="text-[var(--accent)] mt-0.5 shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-[var(--text-primary)] block">
                Continuous Pacing
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                No end date. Today&apos;s board is created lazily on access, and your streak grows continuously day by day.
              </p>
            </div>
          </div>
        )}

        {/* Start Date */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="start-date"
            className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-medium flex items-center gap-1.5"
          >
            <Calendar size={13} style={{ color: "var(--accent)" }} />
            <span>Start Date</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors font-mono"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="mt-2 w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: "var(--accent)",
            color: "var(--surface-0)",
          }}
        >
          <Lightning size={16} weight="fill" />
          <span>
            {isSubmitting
              ? "Launching..."
              : mode === "open"
              ? "Start Ongoing Log"
              : "Launch Challenge"}
          </span>
        </button>
      </form>
    </div>
  );
}

export default function NewChallengePage() {
  return (
    <>
      <AppNav />
      <main
        className="min-h-dvh flex flex-col justify-center py-12 px-5"
        style={{ background: "var(--surface-0)" }}
      >
        <div className="max-w-xl w-full mx-auto">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>

          <Suspense
            fallback={
              <div
                className="card rounded-2xl p-8 border animate-pulse h-96"
                style={{
                  background: "var(--surface-1)",
                  borderColor: "var(--border)",
                }}
              />
            }
          >
            <NewChallengeForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}

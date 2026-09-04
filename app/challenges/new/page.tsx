"use client";
// app/challenges/new/page.tsx
// Phase 1: Create Challenge page allowing users to launch a new multi-day commitment.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  Calendar,
  Sparkle,
  ArrowLeft,
  Lightning,
} from "@phosphor-icons/react";
import { AppNav } from "@/components/AppNav";

const PRESET_TITLES = [
  "100 Days of Code",
  "Winter Arc",
  "30 Days of Fitness",
  "75 Hard",
];

const PRESET_DURATIONS = [
  { label: "30 Days", value: 30 },
  { label: "75 Days", value: 75 },
  { label: "100 Days", value: 100 },
  { label: "365 Days", value: 365 },
];

export default function NewChallengePage() {
  const router = useRouter();
  const todayIso = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [totalDays, setTotalDays] = useState<number>(100);
  const [startDate, setStartDate] = useState(todayIso);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    if (totalDays < 1 || totalDays > 366) {
      setErrorMessage("Total days must be between 1 and 366.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          totalDays: Number(totalDays),
          startDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create challenge");
      }

      const data = await res.json();
      router.push(`/challenges/${data.challenge.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

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

          {/* Form Card */}
          <div
            className="card rounded-2xl p-6 sm:p-8 border shadow-xl flex flex-col gap-6"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--border)",
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Target size={18} style={{ color: "var(--accent)" }} />
                <span
                  className="text-xs font-mono font-medium uppercase tracking-wider"
                  style={{ color: "var(--accent)" }}
                >
                  New Commitment
                </span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Launch a Challenge
              </h1>
              <p
                className="text-xs font-mono mt-1 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                Define your goal, choose your daily execution window, and begin tracking your streak.
              </p>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-lg p-3 text-xs font-mono bg-red-950/70 border border-red-800/80 text-red-200"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Challenge Title */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="challenge-title"
                  className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-medium"
                >
                  Challenge Title
                </label>
                <input
                  id="challenge-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 100 Days of Code"
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
                  {PRESET_TITLES.map((preset) => (
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

              {/* Total Duration */}
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

              {/* Action */}
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="mt-2 w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "var(--accent)",
                  color: "var(--surface-0)",
                }}
              >
                <Lightning size={16} weight="fill" />
                <span>{isSubmitting ? "Launching..." : "Launch Challenge"}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

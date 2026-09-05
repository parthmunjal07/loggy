"use client";

// app/welcome/WelcomeChoiceClient.tsx
// Two-option decision screen for first-run onboarding.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, ArrowRight, SpinnerGap, Sparkle } from "@phosphor-icons/react";

export function WelcomeChoiceClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartOpenEnded = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Daily Log",
          // totalDays omitted -> creates open-ended challenge
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to start ongoing log.");
      }

      // Redirect straight to challenge detail page with today's Kanban panel ready
      router.push(`/challenges/${data.challenge.id}?today=true`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          How would you like to track your work?
        </h1>
        <p
          className="text-sm max-w-md mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Choose a path to begin. You can create additional challenges anytime.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl text-xs font-mono border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
        >
          {errorMessage}
        </div>
      )}

      {/* Decision Cards: Exactly two options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Start a challenge */}
        <Link
          href="/challenges/new"
          className="group card p-6 rounded-2xl border transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-[var(--surface-2)]/50 flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
              style={{
                background: "var(--surface-2)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              <Flag size={20} weight="duotone" />
            </div>

            <h2
              className="text-base font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              Start a challenge
            </h2>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Commit to a fixed duration like 30, 60, or 100 days with a clear goal and finish line.
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 text-xs font-medium pt-6 mt-6 border-t"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <span>Set up challenge</span>
            <ArrowRight
              size={13}
              weight="bold"
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </Link>

        {/* Option 2: Just start logging */}
        <button
          type="button"
          onClick={handleStartOpenEnded}
          disabled={isLoading}
          className="group text-left card p-6 rounded-2xl border transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-[var(--surface-2)]/50 flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60 cursor-pointer"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
              style={{
                background: "var(--surface-2)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              <Sparkle size={20} weight="duotone" />
            </div>

            <h2
              className="text-base font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              Just start logging
            </h2>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Open an ongoing daily log with no end date. Scope daily tasks and build your streak at your own pace.
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 text-xs font-medium pt-6 mt-6 border-t w-full"
            style={{
              borderColor: "var(--border)",
              color: "var(--accent)",
            }}
          >
            {isLoading ? (
              <>
                <SpinnerGap size={13} className="animate-spin" />
                <span>Creating your daily board...</span>
              </>
            ) : (
              <>
                <span>Start logging today</span>
                <ArrowRight
                  size={13}
                  weight="bold"
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

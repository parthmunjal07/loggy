"use client";

// app/error.tsx
// Root error boundary in Loggy voice: calm, reassuring, zero em-dashes.
// Informs user streak/challenge data is safe and offers an immediate retry path.

import { useEffect } from "react";
import Link from "next/link";
import { ArrowCounterClockwise, WarningCircle } from "@phosphor-icons/react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pipeline runtime error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
        <WarningCircle size={24} weight="bold" />
      </div>

      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">
        Something stalled in the pipeline
      </h1>

      <p className="text-sm text-[var(--text-secondary)] max-w-[48ch] mb-8 leading-relaxed">
        Your streak data and logged tasks are safe in the ledger. The request ran into an unexpected state.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--surface-3)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-colors border border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <ArrowCounterClockwise size={16} weight="bold" />
          Retry request
        </button>

        <Link
          href="/dashboard"
          className="flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-zinc-950 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
        >
          Back to dashboard
        </Link>
      </div>

      {error.digest && (
        <p className="font-mono text-xs text-[var(--text-muted)] mt-10">
          Ref: {error.digest}
        </p>
      )}
    </div>
  );
}

// app/not-found.tsx
// 404 page in Loggy voice: calm, clean, zero em-dashes.

import Link from "next/link";
import { Compass, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[var(--accent)] mb-6">
        <Compass size={24} weight="bold" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-xs font-mono text-[var(--text-secondary)] mb-4">
        404: Not Found
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] mb-3">
        Coordinate not found
      </h1>

      <p className="text-sm text-[var(--text-secondary)] max-w-[44ch] mb-8 leading-relaxed">
        The ledger has no record of this day or challenge. It may have been archived or moved to a different path.
      </p>

      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-zinc-950 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
      >
        <House size={16} weight="bold" />
        Return to dashboard
      </Link>
    </div>
  );
}
